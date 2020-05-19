
const Joi = require('joi')
const request = require('request')
const Promise = require("bluebird")
const httpPOST = Promise.promisify(request.post)
const httpGET = Promise.promisify(request.get)
const crypto = require('crypto')
const uuid = require('uuid')
const config = require('../config')
require('./time.js')

function percentEncode(key){
	return encodeURIComponent(key).replace('+', '%20').replace('*', '%2A').replace('%7E', '~');
	//return escape(key).replace('+', '%20').replace('*', '%2A').replace('%7E', '~');
}

async function aliyunRequest(url, params) {

    console.log(typeof url)
    params = Object.assign({}, {
        Format: 'JSON',
        Version: '2018-05-10',
        AccessKeyId: config.aliyun.AccessKeyId,
        SignatureMethod: 'Hmac-SHA1',
        Timestamp: new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000).format('yyyy-MM-ddThh:mm:ssZ'),
        SignatureVersion: '1.0',
        SignatureNonce: uuid.v4(),
    }, params)

    const schema = Joi.object().keys({
        //url: Joi.string(),
        Action: Joi.string(),
    })

    const { error, value } = Joi.validate({
        //url: Joi.string(),
        Action: params.Action,
    }, schema)

    if (error) {
        throw new Error(error)
    }

    var keys = [];
    for (let key in params) {
        keys.push(key);
    }
    keys = keys.sort()
    
    let canonicalizedQueryArray = []
    for (let i = 0; i < keys.length; i++) {
        canonicalizedQueryArray.push(keys[i] + '=' + percentEncode(params[keys[i]]))
    }
    let canonicalizedQueryString = canonicalizedQueryArray.join('&')
    let stringToSign = 'GET' + '&' + percentEncode('/') + '&' + percentEncode(canonicalizedQueryString);
    let signature = crypto.createHmac('sha1',  config.aliyun.AccessKeySecret + '&').update(stringToSign, 'utf8', 'binary').digest('base64');
    canonicalizedQueryString = 'Signature=' + percentEncode(signature) + '&' + canonicalizedQueryString;

    url = url + '?' + canonicalizedQueryString
    console.log(url)

    let body = (await httpGET(url)).body
    return body
}


/*
同一个 ID 每天最多可提交2000条URL预热刷新类请求，以及100个目录预热刷新类请求。
刷新预热类接口包含RefreshObjectCaches 刷新接口和 PushObjectCache预热接口。
刷新API每次最高提交1000条URL，且单域名每次最高提交100条URL。
*/

async function refreshObjectCaches(){
  
    let result = await aliyunRequest("https://cdn.aliyuncs.com", {
        Action: 'RefreshObjectCaches',
        ObjectPath: 'console.tianlansidai.com/index.html',
        ObjectType: 'file', // File或Directory
    })
}

module.exports = { aliyunRequest }
