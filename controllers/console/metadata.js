const metadataTypeProxy = require("../../models/metadata_type.js")
const metadataProxy = require("../../models/metadata.js")
const Joi = require("joi")

async function createMetadataType(ctx, next) {

    let name = ctx.request.body.name || ''
    let number = ctx.request.body.number
    let memo = ctx.request.body.memo || ''
    let parentId = ctx.request.body.parentId || ''

    let schema = Joi.object().keys({
        name: Joi.string().min(2).max(20).required(),
        number: Joi.string().min(2).max(10).required()
    })
    let schemaObj = {
        name:name,
        number:number
    }
    if (!!parentId) {
        schema.parentId = Joi.string().length(24).required()
        schemaObj.parentId = parentId
    }
    let {value, error} = Joi.validate(schemaObj, schema)

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    let toSave = {
        name: value.name,
        number: value.number,
        memo: memo
    }
    if (!!parentId) {
        let parent = await metadataTypeProxy.getOneByQuery({_id: parentId, status: 1}, '')
        if (parent.length) {
            ctx.state.code = 4;
            ctx.state.message = "父分类不存在!"
            throw new Error(ctx.state.message)
        }
        toSave.parentId = value.parentId
    }
    let result = await metadataTypeProxy.save(toSave)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = result
    return await next()
}

async function getMetadataType(ctx, next) {
    let result = await metadataTypeProxy.getByQuery({
        parentId: null,
        status: 1
    }, '_id parentId number name memo', {sort: {modifyAt: 1}})
    let trees = []
    for (let i = 0; i < result.length; i++) {
        let res = result[i];
        let all = await metadataTypeProxy.getByQuery({
            parentId: res._id,
            status: 1
        }, '_id parentId number name memo', {sort: {modifyAt: 1}})
        trees.push({
            _id: res._id,
            name: res.name,
            parents: all,
            parentId: res.parentId,
        });
    }
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = trees || []
    return await next()
}

async function deleteMetadataType(ctx, next) {
    let metadataTypeId = ctx.params.id;
    const schema = Joi.object().keys({
        id: Joi.string().length(24).required()
    })
    let {error} = Joi.validate({id: metadataTypeId}, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }

    await metadataTypeProxy.delete({_id: metadataTypeId})

    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    return await next()
}


async function operatingMetadataType(ctx, next) {
    const schema = Joi.object().keys({
        id: Joi.string().length(24).required(),
        name: Joi.string().min(2).max(20).required(),
        number: Joi.string().min(2).max(10).required(),
    })
    const params = {
        id: ctx.params.id,
        name: ctx.request.body.name,
        number: ctx.request.body.number,
        memo: ctx.request.body.memo,
        parentId: ctx.request.body.parentId,
    }

    let {value, error} = Joi.validate({
        id: params.id,
        name: params.name,
        number: params.number
    }, schema)

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    await metadataProxy.updateOne({_id: value.id}, {
        $set: {
            name: value.name,
            number: value.number,
            memo: value.memo,
            parentId: value.parentId,
        }
    })
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    return await next()
}

async function createMetadata(ctx, next) {
    let params = {
        name: ctx.request.body.name,
        number: ctx.request.body.number,
        typeId: ctx.request.body.typeId,
        content: ctx.request.body.content,
        memo: ctx.request.body.memo,
    }
    let metadataId = ctx.request.body.metadataId
    let schemaObj = {
        name: Joi.string().required(),
        number: Joi.string().required(),
        typeId: Joi.string().length(24).required(),
        content: Joi.string().required(),
        memo: Joi.string()
    }
    if (!!metadataId && metadataId.trim()) {
        params.metadataId = metadataId.trim()
        schemaObj.metadataId = Joi.string().length(24).required()
    }
    const schema = Joi.object().keys(schemaObj)
    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    let parent = await metadataTypeProxy.getByQuery({_id: ctx.request.body.parentId, status: 1}, {})
    if (parent.length) {
        ctx.state.code = 4;
        ctx.state.message = "分类不存在!"
        throw new Error(ctx.state.message)
    }
    if (value.metadataId) {
        let metaData = await metadataProxy.getOneByQuery({_id: value.metadataId, status: 1})
        if (!metaData) {
            ctx.state.code = 4;
            ctx.state.message = "元数据不存在!"
            throw new Error(ctx.state.message)
        }
        metaData.name = value.name
        metaData.number = value.number
        metaData.typeId = value.typeId
        metaData.content = value.content
        metaData.memo = value.memo
        metaData.modifyAt = new Date()
        metaData = await metadataProxy.save(metaData)
        ctx.state.code = 1;
        ctx.state.message = "success!"
        ctx.state.data = metaData
        return await next()
    }
    let result = await metadataProxy.save(value)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = result
    return await next()
}

async function deleteMetadata(ctx, next) {
    let metadataId = ctx.params.id;
    const schema = Joi.object().keys({
        id: Joi.string().length(24).required()
    })
    let {error} = Joi.validate({id: metadataId}, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }

    await metadataProxy.delete({_id: metadataId})

    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    return await next()
}


async function operatingMetadata(ctx, next) {
    let params = {
        id: ctx.params.id,
        opCode: ctx.request.body.opCode
    }

    const schema = Joi.object().keys({
        id: Joi.string().length(24).required(),
        opCode: Joi.number().valid(1, 2, 3).required()
    })
    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    await metadataProxy.updateOne({_id: value.id, status: 1}, {
        $set: {
            businessStatus: value.opCode
        }
    })
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    return await next()
}

async function metadataDetail(ctx, next) {
    let metadataId = ctx.params.id;
    const schema = Joi.object().keys({
        id: Joi.string().length(24).required()
    })
    let {error} = Joi.validate({id: metadataId}, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }

    let resutlt = await metadataProxy.getById(metadataId)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = resutlt
    return await next()
}

async function metadataList(ctx, next) {

    let params = {
        TypeId: ctx.request.query.typeId,
        keyWord: ctx.request.query.keyWord,
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum
    }
    const schema = Joi.object().keys({
        TypeId: Joi.string().length(24).required(),
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

    let queryStr = {typeId: params.TypeId, status: 1}
    if (params.keyWord) {
        queryStr['$or'] = [{number: new RegExp(params.keyWord, 'ig')}, {name: new RegExp(params.keyWord, 'ig')}]
    }
    let result = await metadataProxy.getByQuery(queryStr, {}, {
        sort: {_id: -1},
        skip: skipCount,
        limit: params.pageSize
    });
    let total = await metadataProxy.countByQuery(queryStr)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, {total: total, list: result})
    return await next()
}

module.exports = {
    createMetadataType,
    getMetadataType,
    createMetadata,
    deleteMetadata,
    operatingMetadata,
    metadataDetail,
    metadataList,
    deleteMetadataType,
    operatingMetadataType,
}