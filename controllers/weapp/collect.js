const childProxy = require('../../models/child')
const surveyResultProxy = require('../../models/survey_result')
const checkupTermProxy = require('../../models/checkup_term')
const collectProxy = require('../../models/collect')
const articleProxy = require('../../models/article')
const moment = require('moment')
const CONSTANT = require('../../common/constants')
const Joi = require("joi")
const utils = require('../../common/utils')


async function addCollect(ctx, next) {
    let user = ctx.state.user //|| {_id: "5ca496e6deaea140b4a5eecc"}
    let params = {
        article: ctx.request.body.articleId
    }
    const schema = Joi.object().keys({
        article: Joi.string().length(24).required()
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = CONSTANT.weapp.collect.addCollect[utils.getFiled(error.message)] || "参数不合法!"
        throw new Error(error)
    }
    let collect = await collectProxy.getOneByQuery({ user: user._id, article: value.article })
    if (!collect) {
        await collectProxy.save({
            user: user._id,
            article: value.article
        })
        ctx.state.code = 1
        ctx.state.message = "success!"
    } else {
        if (collect.status != 1) {
            collect.status = 1
            collect.updated_at = new Date()
            await collectProxy.save(collect)
            ctx.state.code = 1
            ctx.state.message = "success!"
        } else {
            ctx.state.code = 4
            ctx.state.message = "收藏过的文章!"
        }
    }
    ctx.state.data = {}
    await next()
}

async function deleteCollect(ctx, next) {
    let params = {
        collectId: ctx.params.id
    }
    const schema = Joi.object().keys({
        collectId: Joi.string().length(24).required()
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = CONSTANT.weapp.collect.deleteCollect[utils.getFiled(error.message)] || "参数不合法!"
        throw new Error(error)
    }
    await collectProxy.updateOne({ _id: value.collectId }, { $set: { modifyAt: new Date(), status: -1 } })
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = {}
    await next()
}

async function getCollect(ctx, next) {
    let user = ctx.state.user //|| {_id: "5ca496e6deaea140b4a5eecc"}
    let params = {
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum
    }

    const schema = Joi.object().keys({
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().default(10)
    })

    let { error, value } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = CONSTANT.weapp.collect.deleteCollect[utils.getFiled(error.message)] || "参数不合法!"
        throw new Error(error)
    }
    const skipCount = value.pageSize * (value.pageNum - 1)
    let result = await collectProxy.getByQueryPopulate({ user: user._id, status: 1 }, {}, {
        sort: { modifyAt: -1 },
        skip: skipCount,
        limit: value.pageSize
    })
    let list = []
    result.forEach(function(item) {
        list.push(Object.assign({}, item._doc, { createAt: moment(item.createAt).format('YYYY-MM-DD HH:MM') }))
    })
    let total = await collectProxy.countByQuery({ user: user._id, status: 1 })
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, {
        list: list,
        total: total
    })
    await next()
}

async function articleInfo(ctx, next) {
    let user = ctx.state.user;
    let params = {
        articleId: ctx.params.aId
    }
    const schema = Joi.object().keys({
        articleId: Joi.string().length(24).required()
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = CONSTANT.weapp.collect.articleInfo[utils.getFiled(error.message)] || "参数不合法!"
        throw new Error(error)
    }
    let article = await articleProxy.getOneByQuery({ _id: value.articleId })
    if (!article) {
        ctx.state.code = 4
        ctx.state.message = "不存在的文章!"
        return await next()
    }
    let isCollected = false
    if(!!user){
        let collect = await collectProxy.getOneByQuery({ user: user._id, article: params.articleId })
        if (collect) {
            isCollected = true
        }
    }
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, article._doc, {
        collect: isCollected,
        createAt: moment(article.createAt).format('YYYY-MM-DD HH:MM')
    })
    await next()
}

module.exports = {
    addCollect,
    deleteCollect,
    getCollect,
    articleInfo
}