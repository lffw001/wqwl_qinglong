/**
 * 脚本：wqwl_new_回收蛙.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序回收蛙，抓包user_id,格式:user_id#备注
 * 环境变量：wqwl_hsw，多个换行或新建多个变量（不能混合使用）
 * 环境变量描述：
 * cron: 11 8 * * *
 */


//环境变量
const ckName = 'wqwl_hsw';
//脚本名称
const scriptName = '微信小程序回收蛙';
//本地版本
const version = 1.0;
//是否需要文件存储
const isNeedFile = true;
//ck长度
const ckLength = 1;
//日志是否需要具体时间
const isNeedTimes = false;
//日志是否需要推送汇总
const isNeedDetailed = true;

const proxy = process.env["wqwl_daili"] || '';
const isProxy = process.env["wqwl_useProxy"] || false;
const bfs = process.env["wqwl_bfs"] || 1;
const isNotify = process.env["wqwl_isNotify"] || true;
const isDebug = process.env["wqwl_isDebug"] || false;

/**
 * 其他全局环境变量说明
 * wqwl_daili：代理链接，需要返回单条txt格式
 * wqwl_useProxy：是否用代理，默认使用（填了代理链接）
 * wqwl_bfs：并发数，默认3
 * wqwl_isNotify：是否进行通知
 * wqwl_isDebug：是否调试输出请求
 */

const axios = require('axios');
const fs = require('fs');

const crypto = require('crypto');
const querystring = require('querystring');


let wqwlkj;
// 先下载依赖文件
async function downloadRequire() {
    const filePath = 'wqwl_require.js';
    const url = 'https://raw.githubusercontent.com/298582245/wqwl_qinglong/refs/heads/main/wqwl_require.js';

    if (fs.existsSync(filePath)) {
        console.log('✅wqwl_require.js已存在，无需重新下载，如有报错请重新下载覆盖\n');
        wqwlkj = require('./wqwl_require');
        return true;
    } else {
        console.log('正在下载wqwl_require.js，请稍等...\n');
        console.log(`如果下载过慢，可以手动下载wqwl_require.js，并保存为wqwl_require.js，并重新运行脚本`);
        console.log('地址：' + url);
        try {
            const res = await axios.get(url);
            fs.writeFileSync(filePath, res.data);
            console.log('✅ 下载完成\n');
            wqwlkj = require('./wqwl_require');
            return true;
        } catch (e) {
            console.log('❌ 下载失败，请手动下载wqwl_require.js\n');
            console.log('地址：' + url);
            return false;
        }
    }
}

// 立即执行下载并等待完成
!(async function () {
    const downloadIsSuccess = await downloadRequire();
    if (!downloadIsSuccess) {
        console.log('❌ 依赖文件下载失败，脚本终止');
        process.exit(1);
    }
    if (!wqwlkj.WQWLBase || !wqwlkj.WQWLBaseTask) {
        console.log('❌ wqwl_require.js 未发现WQWLBase类、WQWLBaseTask类，请重新下载新版本');
        process.exit(1);
    }

    class Task extends wqwlkj.WQWLBaseTask {
        constructor(ck, index, base) {
            // 调用父类构造函数
            super(ck, index, base);
            this.baseUrl = 'https://oa.syrecovery.com';
        }

        async init() {
            const ckData = this.ck.split('#');
            if (ckData.length < ckLength) {
                this.sendMessage(`${this.index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                return false;
            } else if (ckData.length === ckLength) {
                this.remark = `${ckData[0].slice(0, 8)}-${this.index}`;
            } else {
                this.remark = ckData[ckLength];
            }


            this.user_id = ckData[0];


            if (!this.base.fileData[this.remark])
                this.base.fileData[this.remark] = {}
            let ua;
            if (!this.base.fileData[this.remark]['ua']) {
                this.base.fileData[this.remark]['ua'] = this.base.wqwlkj.generateRandomUA()
            }
            ua = this.base.fileData[this.remark]['ua']

            this.sendMessage(`🎲 使用ua：${ua.slice(0, 60)}`)

            // 设置请求头
            this.headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'xweb_xhr': '1',
                'User-Agent': ua,
                'Referer': 'https://servicewechat.com/wx5f671b00a9dfca58/154/page-frame.html',
                'Accept-Language': 'zh-CN,zh;q=0.9'
            };
            if (this.proxyConfig && this.isProxy) {
                this.proxy = await wqwlkj.getProxy(this.index, this.proxyConfig);
                this.sendMessage(`✅ 使用代理：${this.proxy}`);
            } else {
                this.proxy = '';
            }

            return true;
        }
        // 签到
        async signIn() {
            const methodName = '签到';

            this.sendMessage(`🔍 正在${methodName}...`);

            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/api/recycle/app/welfare/sign_in `,
                    headers: this.headers,
                    method: "POST",
                    data: { user_id: this.user_id }

                };

                const res = await this.request(options, 0);
                if (res.code === 1) {
                    this.sendMessage(`✅ [${methodName}] 成功`)
                    return true
                } else {
                    this.statisticSetFailure(methodName)
                    throw new Error(`接口返回：${res?.errorMsg || res?.msg || "未知错误信息"}`)
                }

            };

            return await this.safeExecute(method, methodName);
        }

        // 获取商品id
        async productList() {
            const methodName = '获取商品id';

            this.sendMessage(`🔍 正在${methodName}...`);
            let params = `i=373&t=undefined&v=1.0.0&from=wxapp&c=entry&a=wxapp&do=goods_list_new&m=zm_jyf&page=1&uid=${this.user_id}&state=0&type=wx`
            const sign = this.getSign(params)
            params += `&sign=${sign}`
            const method = async () => {
                const options = {
                    url: `https://www.syrecovery.com/app/index.php?${params}`,
                    headers: this.headers,
                    method: "GET",

                };

                const res = await this.request(options, 0);
                if (res.errno === 0) {
                    this.sendMessage(`✅ [${methodName}] 成功`)
                    const goods = this.getGoodIds(res)
                    return goods
                } else {
                    this.statisticSetFailure(methodName)
                    throw new Error(`接口返回：${res?.errorMsg || res?.msg || "未知错误信息"}`)
                }

            };

            return await this.safeExecute(method, methodName);
        }
        // 浏览商品
        async watch_product(product) {
            const methodName = `浏览商品`;

            this.sendMessage(`🔍 正在${methodName}【${product.title}】...`);

            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/api/recycle/app/welfare/watch_product `,
                    headers: this.headers,
                    method: "POST",
                    data: { product_id: product.id, user_id: this.user_id }

                };

                const res = await this.request(options, 0);
                if (res.code === 1) {
                    this.sendMessage(`✅ [${methodName}] 成功`)
                    this.statisticSetSuccess(methodName)
                    return true
                } else {
                    this.statisticSetFailure(methodName)
                    throw new Error(`接口返回：${res?.errorMsg || res?.msg || "未知错误信息"}`)
                }

            };

            return await this.safeExecute(method, methodName);
        }

        // 获取视频
        async videoList() {
            const methodName = '获取视频id';

            this.sendMessage(`🔍 正在${methodName}...`);
            let params = `i=373&t=undefined&v=1.0.0&from=wxapp&c=entry&a=wxapp&do=notice_list&m=zm_jyf&page=1&uid=${this.user_id}&state=0&type=wx`
            const sign = this.getSign(params)
            params += `&sign=${sign}`
            const method = async () => {
                const options = {
                    url: `https://www.syrecovery.com/app/index.php?${params}`,
                    headers: this.headers,
                    method: "GET",

                };

                const res = await this.request(options, 0);
                if (res.errno === 0) {
                    this.sendMessage(`✅ [${methodName}] 成功`)
                    const video = this.getVideo(res)
                    return video
                } else {
                    this.statisticSetFailure(methodName)
                    throw new Error(`接口返回：${res?.errorMsg || res?.msg || "未知错误信息"}`)
                }

            };

            return await this.safeExecute(method, methodName);
        }

        // 观看视频
        async watch_video(video) {
            const methodName = `浏览视频`;

            this.sendMessage(`🔍 正在${methodName}【${video.content}】...`);

            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/api/recycle/app/welfare/watch_video `,
                    headers: this.headers,
                    method: "POST",
                    data: { video_id: video.video, user_id: this.user_id }

                };

                const res = await this.request(options, 0);
                if (res.code === 1) {
                    this.sendMessage(`✅ [${methodName}] 成功`)
                    this.statisticSetSuccess(methodName)
                    return true
                } else {
                    this.statisticSetFailure(methodName)
                    throw new Error(`接口返回：${res?.errorMsg || res?.msg || "未知错误信息"}`)
                }

            };

            return await this.safeExecute(method, methodName);
        }


        // 当前积分
        async user_jf_log() {
            const methodName = '获取当前积分';

            this.sendMessage(`🔍 正在${methodName}...`);
            let params = `i=373&t=undefined&v=1.0.0&from=wxapp&c=entry&a=wxapp&do=user_jf_log&m=zm_jyf&page=1&uid=${this.user_id}&state=0&type=wx`
            const sign = this.getSign(params)
            params += `&sign=${sign}`
            const method = async () => {
                const options = {
                    url: `https://www.syrecovery.com/app/index.php?${params}`,
                    headers: this.headers,
                    method: "GET",

                };

                const res = await this.request(options, 0);
                if (res.errno === 0) {
                    const jifen = res?.data?.jifen || 0
                    this.sendMessage(`✅ [${methodName}] 成功,余额为为${(parseInt(jifen) / 1000).toFixed(2)}元,最低提现额度为${res?.data?.tx_min_money}元`, true)
                    //  const video = this.getVideo(res)
                    return true
                } else {
                    this.statisticSetFailure(methodName)
                    throw new Error(`接口返回：${res?.errorMsg || res?.msg || "未知错误信息"}`)
                }

            };

            return await this.safeExecute(method, methodName);
        }
        getGoodIds(data) {
            const list = data.data.list;
            const shuffled = list.sort(() => Math.random() - 0.5); // 打乱数组
            const result = shuffled.slice(0, 5).map(item => ({
                id: item.id,
                title: item.title
            }));
            return result;
        }

        getVideo(jsonData) {
            const list = jsonData.data.list;

            // 过滤出包含video和content的有效项
            const validItems = list.filter(item => item.video && item.content);

            if (validItems.length === 0) {
                return null; // 没有有效数据
            }

            const randomIndex = Math.floor(Math.random() * validItems.length);
            const randomItem = validItems[randomIndex];

            return {
                video: randomItem.video,
                content: randomItem.content
            };
        }
        getSign(url, params = {}, token = 'undified') {
            // 检查已有签名
            const urlParams = querystring.parse(url.split('?')[1] || '');
            if (urlParams.sign || (params && params.sign)) {
                return false;
            }

            // 收集参数
            const paramMap = new Map();

            // 从URL获取参数
            if (url) {
                const queryParams = querystring.parse(url.split('?')[1] || '');
                for (const [key, value] of Object.entries(queryParams)) {
                    if (key && value && key !== 'sign') {
                        paramMap.set(key, value);
                    }
                }
            }

            // 从params对象获取参数
            if (params) {
                for (const [key, value] of Object.entries(params)) {
                    if (key && value && key !== 'sign') {
                        paramMap.set(key, value);
                    }
                }
            }

            // 转换为数组并排序
            const paramList = Array.from(paramMap.entries())
                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

            // 构建参数字符串
            const paramString = paramList
                .map(([key, value]) => `${key}=${value}`)
                .join('&');

            // 获取token并计算MD5
            const finalToken = token || process.env.TOKEN || 'default_token';
            const sign = crypto.createHash('md5')
                .update(paramString + finalToken)
                .digest('hex');

            return sign;
        }

        async main() {
            const init = await this.init();
            if (!init) return;
            await this.signIn()
            let sleepTime = this.base.wqwlkj.getRandom(3, 6)
            this.sendMessage(`⏰等待${sleepTime}秒`)
            await this.base.wqwlkj.sleep(sleepTime)
            const video = await this.videoList()
            //this.sendMessage(JSON.stringify(video))
            if (video)
                await this.watch_video(video)
            sleepTime = this.base.wqwlkj.getRandom(3, 6)
            this.sendMessage(`⏰等待${sleepTime}秒`)
            await this.base.wqwlkj.sleep(sleepTime)
            const goods = await this.productList()
            if (goods) {
                for (const item of goods) {
                    await this.watch_product(item)
                    sleepTime = this.base.wqwlkj.getRandom(3, 6)
                    this.sendMessage(`⏰等待${sleepTime}秒`)
                    await this.base.wqwlkj.sleep(sleepTime)
                }
            }
            sleepTime = this.base.wqwlkj.getRandom(3, 6)
            this.sendMessage(`⏰等待${sleepTime}秒`)
            await this.base.wqwlkj.sleep(sleepTime)
            await this.user_jf_log()
        }
    }

    if (wqwlkj.WQWLBase && wqwlkj.WQWLBaseTask) {
        const base = new wqwlkj.WQWLBase(wqwlkj, ckName, scriptName, version, isNeedFile, proxy, isProxy, bfs, isNotify, isDebug, isNeedTimes, isNeedDetailed);
        await base.runTasks(Task);
    } else {
        console.log('❌ wqwl_require.js 未发现WQWLBase类、WQWLBaseTask类，请重新下载新版本');
    }
})();