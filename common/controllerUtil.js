/**
 * 对请求参数进行校验
 * 
 * status       ok
 * author       archer
 * createAt     2019年12月04日
 */
'use strict';

const joi = require('joi')

/**
 * 获取校验错误的描述信息
 * @param {Object} error 校验出错的对象
 * @returns map
 */
function _getErrorFieldDesc (error) {
    return error.details.map(item => item.message);
}

/**
 * 对请求参数进行校验
 * @param {Object} ctx       请求上下文
 * @param {Object} params    待校验的参数
 * @param {Object} schema    校验用的模板
 * 
 * @returns {Object}    校验通过后返回的参数
 */
function validateParam (ctx, params, schema) {
    const { error, value } = joi.validate(params, schema, { abortEarly: false })
    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误：" + _getErrorFieldDesc(error)
        throw new Error(error)
    }
    return value
}
/**
 * 错误响应
 * @param {Object} ctx 
 * @param {String} message 
 */
function failureResponse (ctx, message) {
    ctx.state.code = 4
    ctx.state.message = message
    throw new Error(message)
}

/**
 * 成功响应
 * @param {Object} ctx 
 * @param {String} message 
 * @param {Object} data 
 */
function successResponse (ctx, message, data) {
    ctx.state.code = 1
    ctx.state.message = message || "操作成功"
    ctx.state.data = Object.assign({}, ctx.state.data, data)
}

module.exports = { validateParam, failureResponse, successResponse }