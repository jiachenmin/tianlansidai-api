const Joi = require('joi');
const ArticleModel = require('../../models/article.js')
const ColumnModel = require('../../models/column.js')


async function createArticle(ctx, next) {

    let title = ctx.request.body.title
    let code = ctx.request.body.code
    let remark = ctx.request.body.remark
    let html = ctx.request.body.html
    let columnId = ctx.request.body.columnId
    let imageUrl = ctx.request.body.imageUrl
    let resume = ctx.request.body.resume || ""

    const schema = Joi.object().keys({
        code: Joi.string().required(),
        columnId: Joi.string().required(),
        imageUrl: Joi.string().required(),
        title: Joi.string().required(),
        html: Joi.string().required()
    });

    const {error, value} = Joi.validate({
        code: code,
        columnId: columnId,
        title: title,
        html: html,
        imageUrl: imageUrl
    }, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let Column = await ColumnModel.getOneByQuery({ _id: columnId, status: 1 }, '', {})
    if(!Column){
        ctx.state.code = 4
        ctx.state.message = "栏目分类不存在"
        return await next()
    }


    let article = await ArticleModel.save({
        columnId: columnId,
        code: code,
        title: title,
        html: html,
        imageUrl: imageUrl,
        memo: remark,
        resume: resume
    })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        article: article
    })
    await next()
}

async function deleteArticle(ctx, next) {

    let articleId = ctx.params.id || '';

    const schema = Joi.object().keys({
        articleId: Joi.string().length(24),
    });

    const {error, value} = Joi.validate({
        articleId: articleId,
    }, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = error
        throw new Error(error)
    }

    await ArticleModel.delete({_id: articleId})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {})
    await next()
}


async function modifyArticle(ctx, next) {

    let articleId = ctx.params.id
    let code = ctx.request.body.code
    let title = ctx.request.body.title || ''
    let remark = ctx.request.body.remark || '';
    let html = ctx.request.body.html || '';
    let columnId = ctx.request.body.columnId || '';
    let imageUrl = ctx.request.body.imageUrl || '';
    let businessStatus = ctx.request.body.status || '';
    let resume = ctx.request.body.resume || ""


    const schema = Joi.object().keys({
        code: Joi.string().required(),
        columnId: Joi.string().required(),
        imageUrl: Joi.string().required(),
        title: Joi.string().required(),
        html: Joi.string().required(),
        businessStatus: Joi.number().integer().valid(2, 3).required()
    });

    const {error, value} = Joi.validate({
        code: code,
        columnId: columnId,
        title: title,
        html: html,
        imageUrl: imageUrl,
        businessStatus: businessStatus,
    }, schema);

    if (error) {
        ctx.state.code = -1
        throw new Error(error)
    }

    let Column = await ColumnModel.getOneByQuery({ _id: columnId, status: 1 }, '', {})
    if(!Column){
        ctx.state.code = 4
        ctx.state.message = "栏目分类不存在"
        throw new Error(ctx.state.message)
    }

    let article = await ArticleModel.getById({_id: articleId})
    if (article == null) {
        ctx.state.code = -1
        ctx.state.message = ""
        throw new Error("article not found")
    }

    await ArticleModel.update({_id: articleId}, {
        $set: {
            code: code,
            columnId: columnId,
            title: title,
            html: html,
            imageUrl: imageUrl,
            memo: remark,
            businessStatus: businessStatus,
            resume: resume
        }
    }, {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {})
    await next()
}

async function findArticle(ctx, next) {

    let articleId = ctx.params.id;

    const schema = Joi.object().keys({
        articleId: Joi.string().length(24),
    });

    const {error, value} = Joi.validate({
        articleId: articleId,
    }, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = error
        throw new Error(error)
    }

    let article = await ArticleModel.getOneByQuery({ _id: articleId, status: 1 }, '', {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        article: article
    })

    await next()
}

async function findArticles(ctx, next) {

    let keywords = ctx.query.keywords
    let count = ctx.query.count
    let page = ctx.query.page

    const schema = Joi.object().keys({
        count: Joi.number().default(10).min(10).max(100).required(),
        page: Joi.number().default(1).min(1).max(100).required(),
    });

    const {error, value} = Joi.validate({
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
        sort: {schoolName: 1}
    }

    let query = {
        title: new RegExp(keywords, 'ig') ,
        status: [1, 2, 3]
    }
    let articles = await ArticleModel.getByQuery(query, '', opt)
    let total = await ArticleModel.countByQuery(query);

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        articles: articles || [],
        total: total
    })
    await next()
}

async function articleList(ctx, next) {

    let page = ctx.query.page
    let count = ctx.query.count
    let clmid = ctx.query.columnId

    const schema = Joi.object().keys({
        count: Joi.number().default(10).min(10).max(100).required(),
        page: Joi.number().default(1).min(1).max(100).required(),
    });
    const {error, value} = Joi.validate({
        count: count,
        page: page
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let skip = (value.page - 1) * value.count;
    let query = {
        columnId: clmid,
        status: [1, 2, 3]
    }
    let articles = await ArticleModel.getByQuery(query, '', { sort: { modifyAt: 1 }, skip: skip, limit: value.count })
    let total = await ArticleModel.countByQuery(query);

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        articles: articles || [],
        total: total
    })
    await next()
}


async function articleAllTitle(ctx, next) {

    // let page = ctx.query.page
    // let count = ctx.query.count
    // let clmid = ctx.query.columnId

    // const schema = Joi.object().keys({
    //     count: Joi.number().default(10).min(10).max(100).required(),
    //     page: Joi.number().default(1).min(1).max(100).required(),
    // });
    // const {error, value} = Joi.validate({
    //     count: count,
    //     page: page
    // }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    // let skip = (value.page - 1) * value.count;
    let query = {
        // columnId: clmid,
        status: [1, 2]
    }
    let articles = await ArticleModel.getByQuery(query, '_id, title', { sort: { modifyAt: -1 } })
    let total = await ArticleModel.countByQuery(query);

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        articles: articles || [],
        total: total
    })
    await next()
}

module.exports = {createArticle, deleteArticle, modifyArticle, findArticle, findArticles, articleList, articleAllTitle }