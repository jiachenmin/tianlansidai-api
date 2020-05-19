const Joi = require('joi');
const ColumnModel = require('../../models/column.js')


async function createColumn(ctx, next) {

    let params = {
        name: ctx.request.body.name,
        seq: ctx.request.body.seq,
        imageUrl: ctx.request.body.imageUrl
    }
    if(ctx.request.body.remark.trim()){
        params.memo = ctx.request.body.remark.trim()
    }
    const schema = Joi.object().keys({
        name: Joi.string().required(),
        memo: Joi.string().allow("").default(""),
        seq: Joi.string().allow("").default(""),
        imageUrl: Joi.array().items(Joi.string())
    });

    const {error, value} = Joi.validate(params, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = error
        throw new Error(error)
    }

    let column = await ColumnModel.save(value)
    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        column: column
    })

    await next()
}

async function deleteColumn(ctx, next) {

    let columnId = ctx.params.id || '';

    const schema = Joi.object().keys({
        columnId: Joi.string().length(24),
    });

    const {error, value} = Joi.validate({
        columnId: columnId,
    }, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = error
        throw new Error(error)
    }

    await ColumnModel.delete({_id: columnId})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {})
    await next()
}


async function modifyColumn(ctx, next) {

    let columnId = ctx.params.id;
    let name = ctx.request.body.name || ''
    let remark = ctx.request.body.remark || '';
    let seq = ctx.request.body.seq;
    let imageUrl = ctx.request.body.imageUrl


    const schema = Joi.object().keys({
        columnId: Joi.string().length(24),
        name: Joi.string().required(),
        imageUrl: Joi.array().items(Joi.string())
    });

    const {error, value} = Joi.validate({
        columnId: columnId,
        name: name,
        imageUrl: imageUrl
    }, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = error
        throw new Error(error)
    }

    let column = await ColumnModel.getById({_id: columnId})
    if (column == null) {
        ctx.state.code = -1
        ctx.state.data = Object.assign({}, ctx.state.data, {
            column: {}
        })
        return await next()
    }

    await ColumnModel.update({_id: columnId}, {
        $set: {
            name: name,
            seq: seq,
            memo: remark,
            imageUrl: imageUrl
        }
    }, {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {})
    await next()
}

async function findColumn(ctx, next) {

    let columnId = ctx.params.id;

    const schema = Joi.object().keys({
        columnId: Joi.string().length(24),
    });

    const {error, value} = Joi.validate({
        columnId: columnId,
    }, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = error
        throw new Error(error)
    }

    let column = await ColumnModel.getOneByQuery({_id: columnId, status: 1}, '_id name memo', {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        column: column
    })

    await next()
}

async function findColumns(ctx, next) {

    let page = ctx.query.page || 1;
    let count = ctx.query.count || 1;
    let keyWords = ctx.query.keyWords

    let query = {status: 1};
    if (keyWords) {
        query.name = {$nin: [keyWords, null]};
    }
    let skip = (page - 1) * count;

    let columns = await ColumnModel.getByQuery(query, '', {
        sort: {modifyAt: 1},
        $skip: skip,
        $limit: count
    })
    let total = await ColumnModel.countByQuery(query);

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        columns: columns || [],
        total: total
    })
    await next()
}


module.exports = {createColumn, deleteColumn, modifyColumn, findColumn, findColumns}