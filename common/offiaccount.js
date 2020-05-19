const config = require('../config.js');
const moment = require('moment')
const request = require('request');
const Promise = require("bluebird");
const httpPOST = Promise.promisify(request.post);
const httpGET = Promise.promisify(request.get);
const sha1 = require('./sha1')
const aesDecrypt = require('./aesDecrypt')
const { ERRORS, LOGIN_STATE } = require('./constants')
const { redisConn } = require('../models/index.js');


/**
 * 获取微信公众号token
 * @returns {*}
 */
async function getWxToken() {

    let token = await redisConn.getAsync(`appId:${config.offiaccount.appId}`);
    if (token) {
        return token;
    }
    const options = {
        method: 'GET',
        uri: 'https://api.weixin.qq.com/cgi-bin/token',
        qs: {
            appid: config.offiaccount.appId,
            secret: config.offiaccount.appSecret,
            grant_type: 'client_credential'
        },
        json: true,
        timeout: 20000
    }

    let ret = await httpGET(options);
    let body = ret.body;
    console.log(body);
    if (body.access_token) {
        // client.quit();                                                                              
        await redisConn.setAsync(`appId:${config.offiaccount.appId}`, body.access_token, 'EX', parseInt(body.expires_in) - 10);
        return body.access_token;
    }
    return null;
}

/**
 * 创建菜单
 * @param params
 * @returns {*}
 */
async function createMenus(params) {

    var token = await getWxToken()
    if (!token) {
        console.log("token is null")
        return true;
    }
    const options = {
        headers: {
            'content-type': 'application/json'
        },
        method: 'POST',
        uri: 'https://api.weixin.qq.com/cgi-bin/menu/create?access_token=' + token,
        body: params,
        json: true,
        timeout: 20000
    }

    let body = (await httpPOST(options)).body;
    return body
}

/**
 * 发送模板消息
 * @param params
 * @returns {*}
 */
async function templateSend(params) {

    var token = await getWxToken()
    if (!token) {
        console.log("token is null")
        return token;
    }
    const options = {
        headers: {
            'content-type': 'application/json'
        },
        method: 'POST',
        uri: 'https://api.weixin.qq.com/cgi-bin/message/template/send',
        qs: {
            access_token: token,
        },
        body: params,
        json: true,
        timeout: 20000
    }

    let body = (await httpPOST(options)).body;
    return body
}


/**
 * 获取素材列表
 * @param params
 * @returns {*}
 */
async function getMaterial(params) {

    var token = await getWxToken()
    if (!token) {
        console.log("token is null")
        return true;
    }
    const options = {
        headers: {
            'content-type': 'application/json'
        },
        method: 'POST',
        uri: 'https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=' + token,
        body: params,
        json: true,
        timeout: 20000
    }

    let body = (await httpPOST(options)).body;
    return body
}

/**
 * 获取素材详情
 * @param params
 * @returns {*}
 */
async function getMaterialDetail(params) {

    var token = await getWxToken()
    if (!token) {
        console.log("token is null")
        return true;
    }
    const options = {
        headers: {
            'content-type': 'application/json'
        },
        method: 'POST',
        uri: 'https://api.weixin.qq.com/cgi-bin/material/get_material?access_token=' + token,
        body: params,
        json: true,
        timeout: 20000
    }

    let body = (await httpPOST(options)).body;
    return body
}


/**
 * getWxUserInfo
 * @param openId
 * @returns {*}
 */
async function getWxUserInfo(openId) {

    var token = await getWxToken()
    if (!token) {
        console.log("token is null")
        return true;
    }
    const options = {
        method: 'GET',
        uri: 'https://api.weixin.qq.com/cgi-bin/user/info?access_token=ACCESS_TOKEN' + token,
        qs: {
            access_token: token,
            openid: openId,
            lang: 'zh_CN'
        },
        json: true,
        timeout: 20000
    }
    let body = (await httpGET(options)).body;
    return body
}


module.exports = {
    getWxToken,
    createMenus,
    getMaterial,
    getWxUserInfo,
    getMaterialDetail,
    templateSend
}

