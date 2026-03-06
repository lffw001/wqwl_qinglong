/**
 * 脚本：wqwl_new_霖久智服.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序霖久智服，抓请求头的X-Account-Id、X-Auth-Token，手机号,/base/uniapp/uaa/member/mp/auth/quick下的openId，sessionKey格式：accoutId1#authToken1#手机号1#openId#sessionKey#备注1
 * 环境变量：wqwl_ljzf，多个换行或新建多个变量（不能混合使用）
 * 环境变量描述：
 * cron: 15 0 0,23 * * *
 */

//ck隔天运行就过期了，有协议的自己改吧，不然不推荐玩了。

//环境变量
const ckName = 'wqwl_ljzf';
//脚本名称
const scriptName = '微信小程序霖久智服';
//本地版本
const version = 1.3;
//是否需要文件存储
const isNeedFile = true;
//ck长度
const ckLength = 5;
//日志是否需要具体时间
const isNeedTimes = false;
//日志是否需要推送汇总
const isNeedDetailed = true;

const proxy = process.env["wqwl_daili"] || '';
const isProxy = process.env["wqwl_useProxy"] || false;
const bfs = process.env["wqwl_bfs"] || 4;
const isNotify = process.env["wqwl_isNotify"] || true;
const isDebug = process.env["wqwl_isDebug"] || false;

/**
 * 其他全局环境变量说明
 * wqwl_daili：代理链接，需要返回单挑txt格式
 * wqwl_useProxy：是否用代理，默认使用（填了代理链接）
 * wqwl_bfs：并发数，默认4
 * wqwl_isNotify：是否进行通知
 * wqwl_isDebug：是否调试输出请求
 */


const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto')

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
            this.baseUrl = 'https://linjiucloud-api.ysservice.com.cn';
        }

        async init() {
            const ckData = this.ck.split('#')
            // console.log(ckData)
            if (ckData.length < ckLength) {
                this.sendMessage(`${this.index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                return false;
            }
            else if (ckData.length === ckLength) {
                this.remark = `${ckData[0].slice(0, 8)}-${this.index}`;
            }
            else {
                this.remark = ckData[ckLength];
            }

            this.accoutId = ckData[0];
            this.authToken = ckData[1];
            this.phone = ckData[2];
            this.openId = ckData[3];
            this.sessionKey = ckData[4]

            this.name = `用户${this.phone.slice(-4)}`

            if (this.proxyConfig && this.isProxy) {
                this.proxy = await wqwlkj.getProxy(this.index, this.proxyConfig)
                this.sendMessage(`✅ 使用代理：${this.proxy}`)
            }
            else {
                this.proxy = ''
                this.sendMessage(`⚠️ 不使用代理`)
            }
            if (!this.base.fileData[this.remark])
                this.base.fileData[this.remark] = {}
            let ua;
            if (!this.base.fileData[this.remark]['ua']) {
                this.base.fileData[this.remark]['ua'] = this.base.wqwlkj.generateRandomUA()
            }
            ua = this.base.fileData[this.remark]['ua']
            this.sendMessage(`🎲 使用ua：${ua.slice(0, 50)}`)
            this.headers = {
                'X-Tenant-Id': '10111',
                'User-Agent': ua,
                'Content-Type': 'application/json',
                'X-Account-Id': this.accoutId,
                'xweb_xhr': '1',
                'X-Client-Id': '64',
                'X-Auth-Token': this.authToken,
                'X-Client-Type': 'mini_program',
                'X-Project-id': '',
                'Accept': '*/*',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Referer': ' https://servicewechat.com/wx0a9f159eddb2c5f8/116/page-frame.html',
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Accept-Encoding': 'gzip, deflate'
            }
            this.memberId = ''
            await this.getMemberId();

            return true
        }
        async getMemberId() {
            const methodName = '获取memberId'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/mc/member/autoMember`,
                    method: "POST",
                    headers: this.headers,
                    data: JSON.stringify({
                        "channel": "CHARGE_PLATFORM",
                        "mobile": this.phone,
                        "tenantId": "10111"
                    }
                    )
                }
                const res = await this.request(options, 0)
                if (res?.code === 0 && res?.data) {
                    this.memberId = res?.data
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }

        async taskList() {
            const methodName = '获取任务列表'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/mt/mini/task/list`,
                    method: "POST",
                    headers: this.headers,
                    data: JSON.stringify({
                        "memberId": this.memberId,
                        "tenantId": "10111"
                    })
                }
                const res = await this.request(options, 0)
                if (res?.code === 0) {
                    return true
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }

        async singleTask() {
            const tasks = [
                { SIGN_IN: "签到" },
                { express: "浏览快递小程序" },
                { ELE_HALF_SCREEN_INTERSTITIAL: "饿了么拉起半屏广告" }
            ]
            for (const task of tasks) {
                for (const [key, value] of Object.entries(task)) {
                    await this.sendMessage(`🔍 正在执行${value}`)
                    await this.doSingleTask(value, key)
                    await this.base.wqwlkj.sleep(await this.base.wqwlkj.getRandom(2, 5))
                }
            }

        }
        async doSingleTask(methodName, type) {
            const encrypt = await this.encryptRequestData({
                "actionRecordCO": {
                    "actionType": type,
                    "actionUnit": "1",
                    "channel": "LJZF",
                    "createdBy": this.memberId,
                    "createdName": this.name,
                    "unitCount": "1"
                },
                "tenantId": "10111",
                "appId": "wx0a9f159eddb2c5f8",
                "sessionKey": this.sessionKey,
                "openId": this.openId
            })
            const headers = { ...this.headers, ...encrypt['headers'] }
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/mt/web/action/add`,
                    method: "POST",
                    headers: headers,
                    data: encrypt['envelope']
                }
                const res = await this.request(options, 0)
                if (res?.code === 0) {
                    const point = res?.data?.pointCount || 0
                    const level = res?.data?.pointLevelCount || 0
                    this.sendMessage(`✅ [${methodName}] 成功，获得积分${point},成长值：${level}`, true)
                    this.statisticMulti(methodName, {
                        '积分': point,
                        '成长值': level
                    })

                }
                else {
                    this.statisticSetFailure(methodName)
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }

        async ad() {
            const methodName = '视频广告'
            const method = async () => {
                let i = 0;
                let sum = 0, sumLevel = 0;
                while (true) {
                    this.sendMessage(`⏳ 正在执行第${i + 1}次看${methodName}`)

                    const encrypt = await this.encryptRequestData({
                        "actionRecordCO": {
                            "actionType": "AD",
                            "actionUnit": "1",
                            "channel": "LJZF",
                            "createdBy": this.memberId,
                            "createdName": this.name,
                            "unitCount": "1"
                        },
                        "tenantId": "10111",
                        "appId": "wx0a9f159eddb2c5f8",
                        "sessionKey": this.sessionKey,
                        "openId": this.openId
                    })
                    const headers = { ...this.headers, ...encrypt['headers'] }
                    const options = {
                        url: `${this.baseUrl}/mt/web/action/add`,
                        method: "POST",
                        headers: headers,
                        data: encrypt['envelope']
                    }

                    const res = await this.request(options, 0)
                    if (res?.code === 0) {
                        const point = res?.data?.pointCount || 0
                        const level = res?.data?.pointLevelCount || 0
                        this.sendMessage(`✅ [第${++i}次看${methodName}] 成功，获得积分${point},成长值：${level}`)
                        this.statisticMulti(methodName, {
                            '积分': point,
                            '成长值': level
                        })
                        sum += point
                        sumLevel += level
                    }
                    else {
                        this.sendMessage(`✅ [${methodName}] 完成，共完成${i}次，获得${sum}积分，获得${sumLevel}成长值`, true)

                        break;
                    }
                    const sleep = this.base.wqwlkj.getRandom(20, 40)
                    this.sendMessage(`🕒 随机暂停${sleep}s`)
                    await this.base.wqwlkj.sleep(sleep)
                }
            }
            return await this.safeExecute(method, methodName)
        }

        async getInfo() {
            const methodName = '获取个人信息'
            const method = async () => {
                const options = {
                    url: `https://linjiucloud-api.ysservice.com.cn/mc/member/memberPoint`,
                    method: "GET",
                    headers: this.headers,
                    params: {
                        "mobile": this.phone,
                        "tenantId": "10111"
                    }
                }
                const res = await this.request(options, 0)
                if (res?.code === 0) {
                    this.sendMessage(`✅ [${methodName}] 成功，当前可用积分：${res?.data?.availablePoints || 0}`, true)
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }

        async encryptRequestData(data) {
            try {
                // 辅助函数
                const randStr = len => [...Array(len)].map(() =>
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
                ).join('');

                const randHex = len => [...Array(len)].map(() =>
                    '0123456789abcdef'[Math.floor(Math.random() * 16)]
                ).join('');

                // 修复的公钥格式 - 尝试不同的格式
                const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
        MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgDjIfkejLVzxwxqP29PA
        6ugWJmpXPNK7yFHioPJQRTlvI0Cx++95v/0hWTitPqOaGJp6zDu6QdCuAHF/wXVU
        HSQQL7tJUCNhBNqe/0CsAaAq2HlAUHTNKB4mg02JmpWZB/lpGSkbgjuF7HBpBd2W
        L2xPpyI7E8SaYBzU7RHXtpVWoxLMsP/OvL1HH8N5oMx+Zz1y+OaDIcFG4WMzN17h
        o1V/TT3EgdfTirdtxg9usw8xNj9Q3pkafBQT0lnHdzvUjEmZNoP3MBczjy6iZyor
        EoT/GbwnNdB2DqTeJmEdEYJ6YFsvIl/XV7YEdy/Cr7ngNK8793lj031zEFx0eb5+
        uQIDAQAB
        -----END PUBLIC KEY-----`;

                // 尝试DER格式
                const PUBLIC_KEY_DER = Buffer.from(`
            MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgDjIfkejLVzxwxqP29PA
            6ugWJmpXPNK7yFHioPJQRTlvI0Cx++95v/0hWTitPqOaGJp6zDu6QdCuAHF/wXVU
            HSQQL7tJUCNhBNqe/0CsAaAq2HlAUHTNKB4mg02JmpWZB/lpGSkbgjuF7HBpBd2W
            L2xPpyI7E8SaYBzU7RHXtpVWoxLMsP/OvL1HH8N5oMx+Zz1y+OaDIcFG4WMzN17h
            o1V/TT3EgdfTirdtxg9usw8xNj9Q3pkafBQT0lnHdzvUjEmZNoP3MBczjy6iZyor
            EoT/GbwnNdB2DqTeJmEdEYJ6YFsvIl/XV7YEdy/Cr7ngNK8793lj031zEFx0eb5+
            uQIDAQAB
            `.replace(/\s/g, ''), 'base64');

                // 生成AES密钥和IV
                const aesKey = randStr(32);
                const iv = randStr(16);

                const aesKeyBuffer = Buffer.from(aesKey, 'utf8');
                const ivBuffer = Buffer.from(iv, 'utf8');

                // AES加密数据
                const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
                const cipher = crypto.createCipheriv('aes-256-cbc', aesKeyBuffer, ivBuffer);
                const encryptedData = cipher.update(dataStr, 'utf8', 'base64') + cipher.final('base64');

                // 尝试不同的RSA加密方式
                const aesKeyBase64 = aesKeyBuffer.toString('base64');
                let encryptedKey = null;
                let lastError = null;

                // 方法1: 尝试使用PEM格式
                try {
                    const cleanPem = PUBLIC_KEY_PEM.replace(/\r/g, '').trim();
                    encryptedKey = crypto.publicEncrypt(
                        {
                            key: cleanPem,
                            padding: crypto.constants.RSA_PKCS1_PADDING
                        },
                        Buffer.from(aesKeyBase64, 'utf8')
                    ).toString('base64');
                } catch (err1) {
                    lastError = err1;
                    //  console.log('PEM格式失败，尝试DER格式...');

                    // 方法2: 尝试使用DER格式
                    try {
                        encryptedKey = crypto.publicEncrypt(
                            {
                                key: PUBLIC_KEY_DER,
                                padding: crypto.constants.RSA_PKCS1_PADDING,
                                format: 'der',
                                type: 'spki'
                            },
                            Buffer.from(aesKeyBase64, 'utf8')
                        ).toString('base64');
                    } catch (err2) {
                        lastError = err2;
                        // console.log('DER格式也失败，使用模拟加密...');

                        // 方法3: 模拟加密（仅用于测试）
                        // 使用简单的base64编码两次
                        encryptedKey = Buffer.from(
                            Buffer.from(aesKeyBase64).toString('base64')
                        ).toString('base64');
                    }
                }

                return {
                    envelope: {
                        encryptedKey: encryptedKey,
                        encryptedData: encryptedData,
                        iv: ivBuffer.toString('base64')
                    },
                    //X-Timestamp 而不是 X-Timestamp
                    headers: {
                        'X-Nonce': randHex(32),
                        'X-Timestamp': Date.now().toString()
                    }
                };

            } catch (error) {
                console.error('加密失败:', error);
                throw error;
            }
        }


        async main() {
            const init = await this.init()
            if (!init) return;
            this.sendMessage(`🔍 正在获取任务列表...`)
            const taskList = await this.taskList()
            if (!taskList) return;
            await this.base.wqwlkj.sleep(1)
            await this.singleTask()
            await this.base.wqwlkj.sleep(1)
            await this.ad()
            await this.base.wqwlkj.sleep(1)
            await this.getInfo()
        }

    }

    if (wqwlkj.WQWLBase && wqwlkj.WQWLBaseTask) {
        const base = new wqwlkj.WQWLBase(wqwlkj, ckName, scriptName, version, isNeedFile, proxy, isProxy, bfs, isNotify, isDebug, isNeedTimes, isNeedDetailed);
        await base.runTasks(Task);
    }
    else {
        // 如果 wqwl_require.js 没有导出 WQWLBase，可能需要手动处理
        console.log('❌ wqwl_require.js 未发现WQWLBase类、WQWLBaseTask类，请重新下载新版本');
        console.log('地址：' + url);
    }
})();