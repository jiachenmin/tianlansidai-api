const Core = require('@alicloud/pop-core')
const config = require('../config')
const uuid = require('uuid')
const Joi = require('joi')
const smsModel = require('../models/sms')
const LOG = require('./log.js')

const client = new Core({
    accessKeyId: config.aliyun.AccessKeyId,
    accessKeySecret: config.aliyun.AccessKeySecret,
    endpoint: 'https://dysmsapi.aliyuncs.com',
    apiVersion: '2017-05-25'
})

async function sendSms (params) {

    params = Object.assign({}, {
        OutId: uuid.v4()
    }, params)

    const schema = Joi.object().keys({
        PhoneNumbers: Joi.string().required(),
        TemplateCode: Joi.string().required(),
        TemplateParam: Joi.object().required(),
    })

    const { error, value } = Joi.validate({
        PhoneNumbers: params.PhoneNumbers,
        TemplateCode: params.TemplateCode,
        TemplateParam: params.TemplateParam,
    }, schema)

    if (error) throw new Error(error)

    params.TemplateParam = JSON.stringify(params.TemplateParam)

    let requestOption = { method: 'POST' }

    let sendResult = {}
    try {
        sendResult = await client.request('SendSms', params, requestOption)
    } catch (error) {
        sendResult = {
            error: error,
            sendSmsParams: params
        }
    }

    let result = {
        signName: params.SignName,
        outId: params.OutId,
        phoneNumbers: params.PhoneNumbers,
        templateCode: params.TemplateCode,
        templateParam: JSON.parse(params.TemplateParam),
        sendResult: sendResult,
    }
    return await smsModel.save(result)
}


module.exports = { sendSms }