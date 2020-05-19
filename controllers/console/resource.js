const resourceTypeProxy = require("../../models/resource_type.js")
const resourceProxy = require("../../models/resource.js")
const Joi = require("joi")

async function getType(ctx, next) {

    let res = await resourceTypeProxy.getAll();
    ctx.state.code = 1;
    ctx.state.message = "success"
    ctx.state.data = res;
    await next()
}

async function createType(ctx, next) {
    let params = {
        name: ctx.request.body.name
    }
    const schema = Joi.object().keys({
        name: Joi.string().required()
    })
    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }

    let saveResutl = await resourceTypeProxy.save(value)
    ctx.state.code = 1;
    ctx.state.message = "success"
    ctx.state.data = saveResutl;
    return await next()
}

async function addResource(ctx, next) {

    let params = {
        resourceType: ctx.request.body.resourceTypeId,
        number: ctx.request.body.number,
        name: ctx.request.body.name,
        memo: ctx.request.body.memo
    }
    let schemaObj = {
        resourceType: Joi.string().length(24).required(),
        number: Joi.string().required(),
        name: Joi.string().required(),
        memo: Joi.string()
    }
    let resourceId = ctx.request.body.resourceId
    if (!!resourceId && resourceId.trim()) {
        params.resourceId = resourceId.trim()
        schemaObj.resourceId = Joi.string().length(24).required()
    }
    const schema = Joi.object().keys(schemaObj)

    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    let isvalid = await resourceProxy.getOneByQuery({number: value.number})
    if (isvalid) {
        ctx.state.code = 4;
        ctx.state.message = "已存在的编号"
        throw new Error("已存在的编号")
    }
    let rType = await resourceTypeProxy.getById(value.resourceType)
    if(!rType){
        ctx.state.code = 4;
        ctx.state.message = "不存在的资源类型!"
        throw new Error("不存在的资源类型!")
    }
    if (value.resourceId) {
        let saved = await resourceProxy.getById(value.resourceId)
        if(!saved){
            ctx.state.code = 4
            ctx.state.message = "不存在的资源！"
            ctx.state.data = {}
            return await next()
        }
        saved.resourceType = value.resourceType
        saved.number = value.number
        saved.name = value.name
        saved.memo = value.memo
        saved.modifyAt = new Date()
        saved  = await resourceProxy.save(saved)
        ctx.state.code = 1
        ctx.state.message = "success"
        ctx.state.data = saved
        return await next()
    }
    let saveResult = await resourceProxy.save(value)
    ctx.state.code = 1
    ctx.state.message = "success"
    ctx.state.data = saveResult
    await next()
}

async function deleteResource(ctx, next) {

    const schema = Joi.object().keys({
        resourceId: Joi.string().length(24).required()
    })
    let {error, value} = Joi.validate({resourceId: ctx.params.id}, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        return await next()
    }
    await resourceProxy.delete({_id: value.resourceId})
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    return await next()
}

async function getResourceList(ctx, next) {

    let params = {
        typeId: ctx.request.query.typeId,
        keyWord: ctx.request.query.keyWord,
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum
    }

    const schema = Joi.object().keys({
        typeId: Joi.string().length(24).required(),
        keyWord: Joi.string().default(""),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().default(10)
    })

    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }

    params = Object.assign(params, value)
    params.keyWord = params.keyWord.trim()
    const skipCount = params.pageSize * (params.pageNum - 1)

    let queryStr = {resourceType: params.typeId, status: 1}
    if (params.keyWord) {
        queryStr['$or'] = [{number: new RegExp(params.keyWord, 'ig')}, {name: new RegExp(params.keyWord, 'ig')}]
    }
    let result = await resourceProxy.getByQuery(queryStr, {}, {
        sort: {_id: -1},
        skip: skipCount,
        limit: params.pageSize
    })
    let total = await resourceProxy.countByQuery(queryStr)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, {total: total, list: result})
    return await next()
}

module.exports = {getType, addResource, deleteResource, getResourceList, createType}
