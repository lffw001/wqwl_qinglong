/**
 * 脚本：wqwl_new_汤星球.js
 * 作者：wqwlkj 裙：960690899
 * 描述：复制本文件改名后，按注释填写业务逻辑即可
 * 环境变量：wqwl_txq，抓包Authorization，格式 Authorization#备注（备注可选）
 * cron: 14 0 * * *
 */

//

// ========== 基础配置（必填） ==========
const ckName = 'wqwl_txq';           // 环境变量名
const scriptName = '微信小程序汤星球';        // 脚本显示名称
const version = 1.0;                 // 本地版本号
const isNeedFile = true;            // 是否持久化 UA 等数据到 wqwl_data
const ckLength = 1;                  // ck 最少段数（不含备注），如 token#备注 则填 1
const isNeedTimes = false;           // 日志是否带毫秒时间戳

// ========== 运行配置 ==========
const CONFIG = {
    proxy: '',       // 代理提取链接，留空则读环境变量 wqwl_daili
    isProxy: false,  // 是否使用代理
    bfs: 3,          // 并发数
    isNotify: true,  // 是否推送通知
    isDebug: 2,  // 是否输出请求调试信息
}

const proxy = CONFIG['proxy'] || process.env['wqwl_daili'] || '';
const isProxy = CONFIG['isProxy'] || process.env['wqwl_useProxy'] || false;
const bfs = CONFIG['bfs'] || process.env['wqwl_bfs'] || 3;
const isNotify = CONFIG['isNotify'] || process.env['wqwl_isNotify'] || true;
const isDebug = CONFIG['isDebug'] || process.env['wqwl_isDebug'] || false;

/**
 * 其他全局环境变量说明
 * wqwl_daili：代理链接，需返回单条 IP:PORT 的 txt
 * wqwl_useProxy：是否用代理
 * wqwl_bfs：并发数
 * wqwl_isNotify：是否通知
 * wqwl_isDebug：是否调试
 * wqwl_request_timeout：请求超时毫秒数（wqwl_require.js 内生效）
 */

const axios = require('axios');
const fs = require('fs');

let wqwlkj;

async function downloadRequire() {
    const filePath = 'wqwl_require.js';
    const url = 'https://raw.githubusercontent.com/298582245/wqwl_qinglong/refs/heads/main/wqwl_require.js';

    if (fs.existsSync(filePath)) {
        console.log('✅ wqwl_require.js 已存在，无需重新下载，如有报错请重新下载覆盖\n');
        wqwlkj = require('./wqwl_require');
        return true;
    }

    console.log('正在下载 wqwl_require.js，请稍等...\n');
    console.log('如果下载过慢，可手动下载保存为 wqwl_require.js 后重新运行');
    console.log('地址：' + url);
    try {
        const res = await axios.get(url);
        fs.writeFileSync(filePath, res.data);
        console.log('✅ 下载完成\n');
        wqwlkj = require('./wqwl_require');
        return true;
    } catch (e) {
        console.log('❌ 下载失败，请手动下载 wqwl_require.js\n');
        console.log('地址：' + url);
        return false;
    }
}

!(async function () {
    // 防止长跑/高并发时未捕获异常导致进程静默退出
    process.on('unhandledRejection', (reason) => {
        const detail = reason instanceof Error ? (reason.stack || reason.message) : String(reason);
        console.error(`❌ [致命] 未捕获的Promise异常: ${detail}`);
    });
    process.on('uncaughtException', (err) => {
        console.error(`❌ [致命] 未捕获的异常: ${err.stack || err.message}`);
    });

    const downloadIsSuccess = await downloadRequire();
    if (!downloadIsSuccess) {
        console.log('❌ 依赖文件下载失败，脚本终止');
        process.exit(1);
    }
    if (!wqwlkj.WQWLBase || !wqwlkj.WQWLBaseTask) {
        console.log('❌ wqwl_require.js 未发现 WQWLBase / WQWLBaseTask，请重新下载新版本');
        process.exit(1);
    }

    class Task extends wqwlkj.WQWLBaseTask {
        constructor(ck, index, base) {
            super(ck, index, base);
            this.baseUrl = 'https://vip.by-health.com'; // TODO: 改成目标 API 域名
        }

        async init() {
            const ckData = this.ck.split('#');
            if (ckData.length < ckLength) {
                this.sendMessage('环境变量格式有误，请检查', true);
                return false;
            }
            if (ckData.length === ckLength) {
                this.remark = `${ckData[0].slice(0, 8)}-${this.index}`;
            } else {
                this.remark = ckData[ckLength];
            }

            this.token = ckData[0]; // TODO: 按实际 ck 字段拆分赋值

            // 代理（可选）
            if (this.base.proxyUrl && this.base.isProxy) {
                this.proxy = await wqwlkj.getProxy(this.index, this.base.proxyUrl);
                this.sendMessage(`✅ 使用代理：${this.proxy}`);
            } else {
                this.proxy = '';
                this.sendMessage('⚠️ 不使用代理');
            }

            // 持久化 UA（isNeedFile=true 时生效）
            let ua = 'Mozilla/5.0';
            if (isNeedFile) {
                if (!this.base.fileData[this.remark]) {
                    this.base.fileData[this.remark] = {};
                }
                if (!this.base.fileData[this.remark]['ua']) {
                    this.base.fileData[this.remark]['ua'] = this.base.wqwlkj.generateRandomUA();
                }
                ua = this.base.fileData[this.remark]['ua'];
                this.sendMessage(`🎲 使用 ua：${ua.slice(0, 50)}`);
            }

            this.headers = {
                "Connection": "keep-alive",
                "User-Agent": ua,
                "Content-Type": "application/json;charset=utf-8",
                "Authorization": this.token,
                "Accept": "*/*",
                "Origin": "https://vip.by-health.com",
                "Sec-Fetch-Site": "same-origin",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Dest": "empty",
                "Referer": 'https://servicewechat.com/wx9bb6d5ac457bd69d/107/page-frame.html',
                "Accept-Language": "zh-CN,zh;q=0.9",
                "Accept-Encoding": "gzip, deflate"
            }

            return true;
        }

        //获取unionId
        async getUnionId() {
            const methodName = '获取unionId';
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/vip-api/member/assets?forceRefresh=0`, // TODO: 改成真实接口
                    method: 'GET',
                    headers: this.headers,
                };
                const res = await this.request(options);

                if (res?.data?.rspCode === '00' && res?.data?.result?.unionId) {
                    this.unionId = res?.data?.result?.unionId
                    this.sendMessage(`✅ [${methodName}] 成功：unionId:${this.unionId}`);
                    this.statisticSetSuccess(methodName);
                    return true;
                }

                this.statisticSetFailure(methodName);
                this.sendMessage(`❌ [${methodName}] 接口返回：${res?.data?.rspMsg || res?.msg || '未知错误'}`);
            };
            return await this.safeExecute(method, methodName);
        }


        //签到详情
        async signFlag() {
            const methodName = '签到详情';
            const header = JSON.parse(JSON.stringify(this.headers))
            header['Referer'] = `https://vip.by-health.com/web/vip-center-h5/?token=${this.token}&isRegister=true&otherParam=%7B%22shareid%22%3A%22%22%2C%22chattype%22%3A%22%22%2C%22shareUserId%22%3A%22%22%2C%22chatinfo%22%3A%22%22%2C%22isRefresh%22%3Afalse%2C%22name%22%3Anull%2C%22userId%22%3A%22${this.unionId}%22%2C%22link%22%3Anull%2C%22id%22%3Anull%2C%22type%22%3Anull%7D&_t=`
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/vip-api/sign/activity/detail`, // TODO: 改成真实接口
                    method: 'POST',
                    headers: header,
                    data: {}
                };
                const res = await this.request(options);

                if (res?.data?.rspCode === '00') {
                    const signFlag = res?.data?.result?.signFlag === 1 ? '已签到' : '未签到'
                    this.sendMessage(`✅ [${methodName}] 成功：今日状态：${signFlag}`);
                    this.statisticSetSuccess(methodName);
                    const getAvailableRewards = (rewardList) => {
                        if (!Array.isArray(rewardList)) {
                            return [];
                        }
                        return rewardList
                            .filter(item => item.finishFlag === 1 && item.drawnFlag === 0)
                            .map(item => ({
                                rewardRecordId: item.rewardRecordId,
                                rewardName: item.rewardName
                            }));
                    };

                    const rewards = getAvailableRewards(res?.data?.result?.rewardList)
                    return { signFlag: res?.data?.result?.signFlag === 1 ? true : false, rewards: rewards }
                }

                this.statisticSetFailure(methodName);
                this.sendMessage(`❌ [${methodName}] 接口返回：${res?.data?.rspMsg || res?.msg || '未知错误'}`);
            };
            return await this.safeExecute(method, methodName);
        }


        //签到
        async sign() {
            const methodName = '签到';
            const header = JSON.parse(JSON.stringify(this.headers))
            header['Referer'] = `https://vip.by-health.com/web/vip-center-h5/?token=${this.token}&isRegister=true&otherParam=%7B%22shareid%22%3A%22%22%2C%22chattype%22%3A%22%22%2C%22shareUserId%22%3A%22%22%2C%22chatinfo%22%3A%22%22%2C%22isRefresh%22%3Afalse%2C%22name%22%3Anull%2C%22userId%22%3A%22${this.unionId}%22%2C%22link%22%3Anull%2C%22id%22%3Anull%2C%22type%22%3Anull%7D&_t=`
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/vip-api/sign/daily/create`, // TODO: 改成真实接口
                    method: 'POST',
                    headers: header,
                    data: {
                        activityId: 11
                    }
                };
                const res = await this.request(options);

                if (res?.data?.rspCode === '00') {
                    this.sendMessage(`✅ [${methodName}] 成功：剩余${res?.data?.result?.remainingDay}天即可领取宝箱`, true);
                    this.statisticSetSuccess(methodName);
                    return true
                }

                this.statisticSetFailure(methodName);
                this.sendMessage(`❌ [${methodName}] 接口返回：${res?.data?.rspMsg || res?.msg || '未知错误'}`);
            };
            return await this.safeExecute(method, methodName);
        }

        //领取宝箱奖励
        async draw(rewardRecordId) {
            const methodName = '领取宝箱奖励';
            const header = JSON.parse(JSON.stringify(this.headers))
            header['Referer'] = `https://vip.by-health.com/web/vip-center-h5/?token=${this.token}&isRegister=true&otherParam=%7B%22shareid%22%3A%22%22%2C%22chattype%22%3A%22%22%2C%22shareUserId%22%3A%22%22%2C%22chatinfo%22%3A%22%22%2C%22isRefresh%22%3Afalse%2C%22name%22%3Anull%2C%22userId%22%3A%22${this.unionId}%22%2C%22link%22%3Anull%2C%22id%22%3Anull%2C%22type%22%3Anull%7D&_t=`
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/vip-api/sign/daily/draw`,
                    method: 'POST',
                    headers: header,
                    data: { "rewardRecordId": rewardRecordId }
                };
                const res = await this.request(options);

                if (res?.data?.rspCode === '00') {
                    this.sendMessage(`✅ [${methodName}] 成功：${res?.data?.result?.msg}`, true);
                    this.statisticSetSuccess(methodName);
                    return true
                }

                this.statisticSetFailure(methodName);
                this.sendMessage(`❌ [${methodName}] 接口返回：${res?.data?.rspMsg || res?.msg || '未知错误'}`);
            };
            return await this.safeExecute(method, methodName);
        }

        async main() {
            const ok = await this.init();
            if (!ok) return;

            // TODO: 在此编排业务流程
            await this.getUnionId();

            let wait = this.base.wqwlkj.getRandom(1, 3);
            this.sendMessage(`🕒 随机暂停 ${wait}s`);
            await this.base.wqwlkj.sleep(wait);
            let flag = await this.signFlag()
            if (!flag?.signFlag) {
                wait = this.base.wqwlkj.getRandom(1, 3);
                this.sendMessage(`🕒 随机暂停 ${wait}s`);
                await this.base.wqwlkj.sleep(wait);
                await this.sign()
            }
            //重新获取是否有可领取的宝箱
            wait = this.base.wqwlkj.getRandom(1, 3);
            this.sendMessage(`🕒 随机暂停 ${wait}s`);
            await this.base.wqwlkj.sleep(wait);
            flag = await this.signFlag()
            if (flag.rewards.length > 0) {
                for (const reward of flag.rewards) {
                    this.sendMessage(`尝试领取【${reward.rewardName}】(id:${reward.rewardRecordId})`)
                    await this.draw(reward.rewardRecordId)
                    wait = this.base.wqwlkj.getRandom(1, 3);
                    this.sendMessage(`🕒 随机暂停 ${wait}s`);
                    await this.base.wqwlkj.sleep(wait);
                }
            }
        }
    }

    const base = new wqwlkj.WQWLBase(
        wqwlkj, ckName, scriptName, version,
        isNeedFile, proxy, isProxy, bfs, isNotify, isDebug, isNeedTimes
    );
    await base.runTasks(Task);
})().catch((err) => {
    console.error(`❌ 脚本顶层异常退出: ${err.stack || err.message}`);
    process.exit(1);
});
