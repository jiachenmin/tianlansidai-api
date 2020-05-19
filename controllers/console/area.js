const Joi = require('joi')
const AreaModel = require('../../models/area')

async function createArea(ctx, next) {

    let name = ctx.request.body.name
    let code = ctx.request.body.code
    let memo = ctx.request.body.memo
    let parentId = ctx.request.body.parentId

    const schema = Joi.object().keys({
        name: Joi.string().min(2).max(20).required(),
        code: Joi.string().min(2).max(10).required(),
        memo: Joi.string().min(0).max(200).default(''),
        parentId: Joi.string().length(24),
    })

    const { error, value } = Joi.validate({
        name: name,
        code: code,
        memo: memo,
        parentId: parentId,
    }, schema)

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let area = {
        name: value.name,
        code: value.code,
        memo: value.memo,
        parentId: value.parentId ? value.parentId: null
    }
    area = await AreaModel.save(area)

    ctx.state.code = 1
    ctx.state.message = "创建成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {
        area: area,
    })

    await next()
}

async function deleteArea(ctx, next) {

    let areaId = ctx.params.id

    const schema = Joi.object().keys({
        areaId: Joi.string().length(24).required(),
    });

    const { error, value } = Joi.validate({
        areaId: areaId,
    }, schema)

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    await AreaModel.delete({ _id: value.areaId })

    ctx.state.code = 1
    ctx.state.message = "删除成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {
    })
    await next()
}


async function modifyArea(ctx, next) {

    let areaId = ctx.params.id
    let name = ctx.request.body.name
    let code = ctx.request.body.code
    let memo = ctx.request.body.memo

    const schema = Joi.object().keys({
        areaId: Joi.string().length(24).required(),
        name: Joi.string().min(2).max(20).required(),
        code: Joi.string().min(2).max(10).required(),
        memo: Joi.string().default('').min(0).max(200).required(),
    })

    const { error, value } = Joi.validate({
        areaId: areaId,
        name: name,
        code: code,
        memo: memo,
    }, schema)

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let area = await AreaModel.getById({ _id: value.areaId })
    if (area == null) {
        ctx.state.code = 4
        ctx.state.message = "记录不存在"
        throw new Error(ctx.state.message)
    }

    await AreaModel.updateOne({ _id: value.areaId }, {
        $set: {
            name: value.name,
            code: value.code,
            memo: value.memo
        }
    }, {})

    ctx.state.code = 1
    ctx.state.message = "更新成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {
    })
    await next()
}

async function findArea(ctx, next) {

    let areaId = ctx.params.id;

    const schema = Joi.object().keys({
        areaId: Joi.string().length(24),
    });

    const { error, value } = Joi.validate({
        areaId: areaId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let area = await AreaModel.getById(areaId)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        area: area
    })

    await next()
}

async function findAreas(ctx, next) {

    let query = {parentId: null, status: 1}
    let areas = await AreaModel.getByQuery(query, '', { sort: { name: 1 } })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        areas: areas || []
    })
    await next()
}

async function searchAreas(ctx, next) {
    
    let keywords = ctx.query.keywords
    let count = ctx.query.count
    let page = ctx.query.page

    const schema = Joi.object().keys({
        count: Joi.number().default(10).min(10).max(100).required(),
        page: Joi.number().default(1).min(1).max(100).required(),
    });

    const { error, value } = Joi.validate({
        count: count,
        page: page
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let opt = {
        limit: value.count,
        skip: (value.page - 1) * value.count,
        sort: { seq: 1 }
    }

    let areas = await AreaModel.getByQuery({
        memo: new RegExp(keywords, "ig") 
    }, '', opt)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        areas: areas || []
    })
    await next()
}

module.exports = { createArea, deleteArea, modifyArea, findArea, findAreas, searchAreas }