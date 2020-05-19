const config = require('../config.js');
const moment = require('moment')
const request = require('request');
const Promise = require("bluebird");
const httpPOST = Promise.promisify(request.post);
const httpGET = Promise.promisify(request.get);
const sha1 = require('./sha1')
const aesDecrypt = require('./aesDecrypt')
const { ERRORS, LOGIN_STATE } = require('./constants')
const redis = require('../models/index.js').redisConn

/**
 * qcloud sdk
 * @param {string} [可选] config.wechat.appId              微信小程序 App ID
 * @param {string} [可选] config.wechat.appSecret          微信小程序 App Secret
 * @param {string} [必须] config.wechat.serverHost         服务器 Host
 * @param {string} [必须] config.wechat.wxMessageToken     微信消息通知 token
 * @param {number} [可选] config.wechat.wxLoginExpires     微信登录态有效期（单位：秒）
 */

/**
 * @ 单后台支持多小程序 @ session key 交换
 * @param {string} appid
 * @param {string} appsecret
 * @param {string} code
 * @return {Promise}
 */
async function wxLogin(ctx, next) {
    // 从头部获取信息
    const {
        'x-wx-appid': appId, // appId 是小程序端调用 wx.getAccountInfoSync() 获取到的 project.config.json 中的内容
        'x-wx-code': code   // code 小程序端调用 wxRequest.wxLogin() 获取到的内容
    } = ctx.req.headers

    // 信息校验
    if (!code) throw new Error(`x-wx-code not in headers!`)
    if (!appId) throw new Error(`x-wx-appid not in headers!`)

    // appSecret 是配置在 config.js 中的内容，因为支持多个小程序，所以，wechat 里以 appId 为 key 配置多份
    const appSecret = config.wechat[appId].appSecret;

    // 信息校验
    if (!appSecret) throw new Error(`appId[${appId}]‘s appSecret not in config!`)

    // 发起请求获取用户信息
    const options = {
        method: 'GET',
        uri: 'https://api.weixin.qq.com/sns/jscode2session',
        qs: {
            appid: appId,
            secret: appSecret,
            js_code: code,
            grant_type: 'authorization_code'
        },
        timeout: 20000
    }
    let body = (await httpGET(options)).body
    body = JSON.parse(body);
    if (body.errcode || !body.openid || !body.session_key) {
        throw new Error(`${ERRORS.ERR_GET_SESSION_KEY}\n${JSON.stringify(body)}`)
    }
    ctx.state.user = Object.assign({}, {
        wxAppId: appId,
        wxSessionKey: { [appId]: body.session_key },
        wxSkey: { [appId]: sha1(body.session_key) }, // 生成 3rd_session
        wxOpenId: { [appId]: body.openid },
        wxLastVisitTime: { [appId]: moment().format('YYYY-MM-DD HH:mm:ss') },
        wxUnionId: body.unionid
    }, ctx.state.user)
    await next()
}

/**
 * session key 交换
 * @param {string} appid
 * @param {string} appsecret
 * @param {string} code
 * @return {Promise}
 */
async function getSessionKey(code) {

    const appid = config.wechat.appId;
    const appsecret = config.wechat.appSecret;

    const options = {
        method: 'GET',
        uri: 'https://api.weixin.qq.com/sns/jscode2session',
        qs: {
            appid: appid,
            secret: appsecret,
            js_code: code,
            grant_type: 'authorization_code'
        },
        timeout: 20000
    }
    let ret = await httpGET(options);
    let body = JSON.parse(ret.body);
    if (body.errcode || !body.openid || !body.session_key) {
        throw new Error(`${ERRORS.ERR_GET_SESSION_KEY}\n${JSON.stringify(body)}`)
    } else {
        sessionKey = body.session_key
        return sessionKey;
    }
}

/**
 * 授权模块
 */
async function authorizationMiddleware(ctx, next) {
    const {
        'x-wx-code': code,
        'x-wx-encrypted-data': encryptedData,
        'x-wx-iv': iv
    } = ctx.req.headers

    // 检查 headers
    if ([code, encryptedData, iv].some(v => !v)) {
        throw new Error(ERRORS.ERR_HEADER_MISSED)
    }

    // 获取 session key
    let sessionKey = await getSessionKey(code);
    // 生成 3rd_session
    const skey = sha1(sessionKey)

    // 解密数据
    let decryptedData;
    try {
        decryptedData = aesDecrypt(sessionKey, iv, encryptedData)
        decryptedData = JSON.parse(decryptedData)
    } catch (error) {
        throw new Error(`${ERRORS.ERR_IN_DECRYPT_DATA}\n${error}`)
    }
    let user = decryptedData
    user['sessionKey'] = sessionKey
    user['lastVisitTime'] = moment().format('YYYY-MM-DD HH:mm:ss')
    user['skey'] = skey
    ctx.state.user = user
    await next()
}

/**
 * 鉴权模块
 */
async function validationMiddleware(ctx, next) {
    const { 'x-wx-skey': skey } = ctx.req.headers
    if (!skey) {
        ctx.state.code = -1
        ctx.state.error = ERRORS.ERR_SKEY_INVALID
        throw new Error(ERRORS.ERR_SKEY_INVALID)
    }
    let user = await redis.getAsync(skey)
    user = JSON.parse(user)
    if (user == null) {
        ctx.state.code = -1
        ctx.state.error = ERRORS.ERR_SKEY_INVALID
        throw new Error(ERRORS.ERR_SKEY_INVALID)
    }
    ctx.state.user = user
    await next()
}

async function getUser(ctx, next) {
    const { 'x-wx-skey': skey } = ctx.req.headers
    if (!skey) {
        return await next()
    }
    let user = await redis.getAsync(skey)
    user = JSON.parse(user)
    if (!user) {
        return await next()
    }
    ctx.state.user = user
    await next()
}

module.exports = {
    auth: {
        wxLogin,
        authorizationMiddleware,
        validationMiddleware,
        getUser
    },
}

/*
decryptedData: {
	openId: 'oSNMk0ct7DCx00wgF9V_xA5lsJUY',
	nickName: '王秀文🍀',
	gender: 1,
	language: 'zh_CN',
	city: 'Taiyuan',
	province: 'Shanxi',
	country: 'China',
	avatarUrl: 'https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJETibDh9wrP11s7fkqVFtjzrMicScWh0TNquNCwkhBufKahPMAneKYB1uqyku7DjsricS87UzIjrTyw/0',
	watermark: { timestamp: 1514021486, appid: 'wx34ca2c55fc7b47cc' } }
*/