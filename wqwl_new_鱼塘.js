/**
 * 脚本：wqwl_new_鱼塘.js
 * 作者：wqwlkj 裙：960690899
 * 描述：APP鱼塘，抓请求头的Authorization：Authorization1#备注1，（Authorization去掉Bearer ）
 * 环境变量：wqwl_yutang，多个换行或新建多个变量（不能混合使用）
 * 环境变量描述：
 * cron: 15 0 0-23/8 * * *
 */

// 别玩，一玩就封号，不过我写了就得发。

//官方鱼儿需要12小时领取一次，不然会上限不加，还有本脚本只会提0.2，要提其他自行提现或者修改withDraw函数

//环境变量
const ckName = 'wqwl_yutang';
//脚本名称
const scriptName = 'APP鱼塘';
//本地版本
const version = 1.0;
//是否需要文件存储
const isNeedFile = false;
//ck长度
const ckLength = 1;
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
            this.baseUrl = 'http://fp.woyfc.cn';
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

            this.auth = ckData[0]


            if (this.proxyConfig && this.isProxy) {
                this.proxy = await wqwlkj.getProxy(this.index, this.proxyConfig)
                this.sendMessage(`✅ 使用代理：${this.proxy}`)
            }
            else {
                this.proxy = ''
                this.sendMessage(`⚠️ 不使用代理`)
            }
            let ua;
            if (isNeedFile) {
                if (!this.base.fileData[this.remark])
                    this.base.fileData[this.remark] = {}

                if (!this.base.fileData[this.remark]['ua']) {
                    this.base.fileData[this.remark]['ua'] = this.base.wqwlkj.generateRandomUA()
                }
                ua = this.base.fileData[this.remark]['ua']
                this.sendMessage(`🎲 使用ua：${ua.slice(0, 50)}`)
            }
            this.headers = {
                'User-Agent': 'okhttp/4.10.0',
                'Connection': 'Keep-Alive',
                'Accept-Encoding': 'gzip',
                'Authorization': this.auth
            }
            return true
        }
        async getAllTask() {
            const methodName = '获取任务列表'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/task/all`,
                    method: "GET",
                    headers: this.headers,
                }
                const res = await this.request(options, 0)
                if (res?.success) {
                    const getTimes = res?.data.map(item => {
                        if (item.name === "观看广告") {
                            return {
                                id: item.id,
                                name: item.name,
                                times: item.times,
                                completedCount: item.completedCount
                            };
                        }
                        return null;
                    }).filter(item => item !== null)[0];
                    this.adTimes = parseInt(getTimes.times) - parseInt(getTimes.completedCount)
                    this.sendMessage(`✅ [${methodName}] 成功，当前观看广告剩余次数：${this.adTimes}`)
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }
        async taskAccept(id) {
            const methodName = '观看广告'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/task/accept`,
                    method: "POST",
                    headers: this.headers,
                    data: {
                        id: id,
                        transId: "990003-网络错误-SSLHandshakeException"
                    }
                }
                const res = await this.request(options, 0)
                if (res?.success) {
                    this.sendMessage(`✅ [${methodName}] 成功`)
                    return true
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }

        async userData() {
            const methodName = '用户信息'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/user/data`,
                    method: "GET",
                    headers: this.headers,

                }
                const res = await this.request(options, 0)
                if (res?.success) {
                    this.sendMessage(`✅ [${methodName}] 目前倍数：${res?.data?.addRate}(${res?.data?.rateTaskNum}/${res?.data?.taskRate})`)
                    this.taskTimes = parseInt(res?.data?.taskRate) - parseInt(res?.data?.rateTaskNum)
                    this.coin = parseFloat(res?.data?.coin)
                    this.fish = parseFloat(res?.data?.fish)
                    this.rod = parseFloat(res?.data?.rod)

                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }

        async prizeInfo() {
            const methodName = '抽奖信息'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/fish/prize_info`,
                    method: "GET",
                    headers: this.headers,

                }
                const res = await this.request(options, 0)
                if (res?.success) {
                    this.sendMessage(`✅ [${methodName}] 成功，今日剩余抽奖次数：${res?.data?.lotteryCount}`)
                    this.lotteryCount = res?.data?.lotteryCount || 0
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }


        async prizeList() {
            const methodName = '奖励列表'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/fish/prize_list`,
                    method: "GET",
                    headers: this.headers,

                }
                const res = await this.request(options, 0)
                if (res?.success) {
                    //
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }
        async draw() {

            const methodName = '抽奖'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/fish/draw_lottery`,
                    method: "POST",
                    headers: this.headers,
                }
                const res = await this.request(options, 0)
                if (res?.success) {
                    this.sendMessage(`✅ [${methodName}] 成功，获得：[${res?.data?.reward}] ${res?.data?.prizeName}`)
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }

        async claimFish() {

            const methodName = '收鱼'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/fish/claim`,
                    method: "POST",
                    headers: this.headers,
                }
                const res = await this.request(options, 0)
                if (res?.success) {
                    this.sendMessage(`✅ [${methodName}] 成功，获得鱼儿：${res?.data?.reward}`)
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }

        async sellFish() {

            const methodName = '卖鱼'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/fish/sell`,
                    method: "POST",
                    headers: this.headers,
                    data: {
                        number: Math.floor(this.fish)
                    }
                }
                const res = await this.request(options, 0)
                if (res?.success) {
                    this.sendMessage(`✅ [${methodName}] 成功，获得余额：${res?.data?.reward}`)
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }

        async buyRod() {

            const methodName = '买鱼竿'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/fish/buy_rod`,
                    method: "POST",
                    headers: this.headers,
                    data: {
                        number: Math.floor(this.coin / 300)
                    }
                }
                const res = await this.request(options, 0)
                if (res?.success) {
                    this.sendMessage(`✅ [${methodName}] 成功`)
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }

        //提现记录
        async pageLog() {
            const methodName = '提现记录'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/withdraw/page_log`,
                    method: "GET",
                    headers: this.headers,

                }
                const res = await this.request(options, 0)
                if (res?.success) {
                    this.sendMessage(`✅ [${methodName}] 成功`)
                    return res
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }
        //余额提现
        async withDraw() {

            const methodName = '余额提现'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/withdraw/do`,
                    method: "POST",
                    headers: this.headers,
                    data: {
                        "amount": 0.2,
                        "amountId": 1,
                        "versionCode": 207
                    }
                }
                const res = await this.request(options, 0)
                if (res?.success) {
                    this.sendMessage(`✅ [${methodName}] 成功,提现0.2成功`, true)
                    this.money -= 0.2
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }

        async wallet() {

            const methodName = '钱包信息'
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/wallet/balance?type=1%2C2%2C3`,
                    method: "GET",
                    headers: this.headers,
                }
                const res = await this.request(options, 0)
                if (res?.success) {
                    this.sendMessage(`✅ [${methodName}] 成功,当前余额：${res?.data?.balance?.cash}`)
                    if (res?.data?.balance?.cash >= 0.2) {
                        this.money = parseFloat(res?.data?.balance?.cash)
                        const getLog = await this.pageLog()
                        console.log(getLog)
                        if (getLog) {
                            const hasTodayStatus = (response) => {
                                if (!response.success || !response.data || !Array.isArray(response.data)) {
                                    return false;
                                }

                                const today = new Date().toISOString().split('T')[0];
                                return response.data.some(item =>
                                    item.createdAt.includes(today) && item.status === 2
                                );
                            };
                            console.log(hasTodayStatus(getLog))
                            if (!hasTodayStatus(getLog)) {
                                await this.withDraw()
                            } else {
                                this.sendMessage(`⚠️ 今日已经提过了，暂不提现`)
                            }
                        }

                    }
                }
                else {
                    throw new Error(`接口返回：${res?.message || "未知错误信息"}`)
                }
            }
            return await this.safeExecute(method, methodName)
        }

        async main() {
            const init = await this.init()
            this.money = 0;
            this.coin = 0;
            this.fish = 0;
            this.rod = 0;
            if (!init) return;
            //1.金币广告
            await this.getAllTask()
            if (this.adTimes > 0) {
                for (let i = 0; i < this.adTimes; i++) {
                    this.sendMessage(`⏳ 正在执行第${i + 1}次看金币广告`)
                    const sleep = this.base.wqwlkj.getRandom(20, 40)
                    this.sendMessage(`🕒 随机暂停${sleep}s`)
                    await this.base.wqwlkj.sleep(sleep)
                    const isSuccess = await this.taskAccept(3)
                    if (!isSuccess)
                        break
                    const sleep2 = this.base.wqwlkj.getRandom(1, 3)
                    this.sendMessage(`🕒 随机暂停${sleep2}s`)
                    await this.base.wqwlkj.sleep(sleep2)
                }
            }
            let sleep3 = this.base.wqwlkj.getRandom(1, 3)
            this.sendMessage(`🕒 随机暂停${sleep3}s`)
            await this.base.wqwlkj.sleep(sleep3)
            //2. 倍率增加
            await this.userData()
            if (this.taskTimes > 0) {
                for (let i = 0; i < this.taskTimes; i++) {
                    this.sendMessage(`⏳ 正在执行第${i + 1}次看倍率广告`)
                    const sleep = this.base.wqwlkj.getRandom(20, 40)
                    this.sendMessage(`🕒 随机暂停${sleep}s`)
                    await this.base.wqwlkj.sleep(sleep)
                    const isSuccess = await this.taskAccept(201)
                    if (!isSuccess)
                        break
                    const sleep2 = this.base.wqwlkj.getRandom(1, 3)
                    this.sendMessage(`🕒 随机暂停${sleep2}s`)
                    await this.base.wqwlkj.sleep(sleep2)
                }
            }
            sleep3 = this.base.wqwlkj.getRandom(1, 3)
            this.sendMessage(`🕒 随机暂停${sleep3}s`)
            await this.base.wqwlkj.sleep(sleep3)
            await this.prizeInfo()
            await this.prizeList()
            if (this.lotteryCount > 0) {
                for (let i = 0; i < this.lotteryCount; i++) {
                    this.sendMessage(`⏳ 正在执行第${i + 1}次抽奖`)
                    const isSuccess = await this.draw()
                    if (!isSuccess)
                        break
                    const sleep2 = this.base.wqwlkj.getRandom(1, 3)
                    this.sendMessage(`🕒 随机暂停${sleep2}s`)
                    await this.base.wqwlkj.sleep(sleep2)
                }
            }
            //3. 收鱼
            await this.claimFish()
            const sleep2 = this.base.wqwlkj.getRandom(1, 3)
            this.sendMessage(`🕒 随机暂停${sleep2}s`)
            await this.base.wqwlkj.sleep(sleep2)
            //刷新信息
            await this.userData()
            if (this.coin > 300) {
                await this.buyRod()
                const sleep2 = this.base.wqwlkj.getRandom(1, 3)
                this.sendMessage(`🕒 随机暂停${sleep2}s`)
                await this.base.wqwlkj.sleep(sleep2)
            }
            if (Math.floor(this.fish) >= 1) {
                await this.sellFish()
                const sleep2 = this.base.wqwlkj.getRandom(1, 3)
                this.sendMessage(`🕒 随机暂停${sleep2}s`)
                await this.base.wqwlkj.sleep(sleep2)
            }
            await this.wallet()
            //刷新信息
            await this.userData()
            this.sendMessage(`当前信息：💰 余额：${this.money.toFixed(2)},🪙 金币: ${this.coin.toFixed(2)},🐟 鱼儿: ${this.fish.toFixed(2)},🎣 鱼竿: ${this.rod.toFixed(2)}`, true)
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