const moment = require('moment')
const Joi = require("joi")
const metadataProxy = require('../../models/metadata')
const articleProxy = require('../../models/article')
const columnProxy = require('../../models/column')
const mongoose = require('mongoose')
const CONSTANT = require('../../common/constants')
const utils = require('../../common/utils')

async function reportPageBanner(ctx, next) {
    // 获取普查任务轮播图
    let surveyBannerMetadata = await metadataProxy.getOneByQuery({number: "survey_missions_image_carousel", status: 1})
    let surveyBannerIds = []
    if (surveyBannerMetadata) {
        surveyBannerMetadata.content.split(",").forEach(function (item) {
            if (item != "") {
                surveyBannerIds.push(mongoose.Types.ObjectId(item))
            }
        })
    }
    let surveyBanner = []
    if (surveyBannerIds.length) {
        surveyBanner = await articleProxy.getByQuery({_id: {$in: surveyBannerIds}}, {}, {
            sort: {modifyAt: 1}
        })
    }
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({},ctx.state.data, {
        surveyBanner: surveyBanner
    })
    await next()
}

async function homepage(ctx, next) {

    //获取banner
    let bannerMetadata = await metadataProxy.getOneByQuery({number: "home_image_carousel", status: 1})
    let bannerIds = []
    if (bannerMetadata) {
        bannerMetadata.content.split(",").forEach(function (item) {
            if (item != "") {
                bannerIds.push(mongoose.Types.ObjectId(item))
            }
        })
    }
    let banner = []
    if (bannerIds.length) {
        banner = await articleProxy.getByQuery({_id: {$in: bannerIds}}, {}, {
            sort: {modifyAt: -1}
        })
    }

    //获取普查任务轮播图
    let surveyBannerMetadata = await metadataProxy.getOneByQuery({number: "survey_missions_image_carousel", status: 1})
    let surveyBannerIds = []
    if (surveyBannerMetadata) {
        surveyBannerMetadata.content.split(",").forEach(function (item) {
            if (item != "") {
                surveyBannerIds.push(mongoose.Types.ObjectId(item))
            }
        })
    }
    let surveyBanner = []
    if (surveyBannerIds.length) {
        surveyBanner = await articleProxy.getByQuery({_id: {$in: surveyBannerIds}}, {}, {
            sort: {modifyAt: 1}
        })
    }


    //获取提示
    let tipsMetadata = await metadataProxy.getOneByQuery({number: "home_tip", status: 1})
    let tips = ""
    if (tipsMetadata) {
        tips = tipsMetadata.content
    }

    //获取栏目
    let columnMetadata = await metadataProxy.getOneByQuery({number: "home_columns", status: 1})
    let columnIds = []
    if (columnMetadata) {
        columnMetadata.content.split(",").forEach(function (item) {
            if (item != "") {
                columnIds.push(mongoose.Types.ObjectId(item))
            }
        })
    }
    let columns = []
    if (columnIds.length) {
        columns = await columnProxy.getByQuery({_id: {$in: columnIds}}, {}, {
            sort: {seq: 1}
        })
    }


    //获取推荐文章
    let articleMetadata = await metadataProxy.getOneByQuery({number: "home_recommended_articles", status: 1})
    let articleIds = []
    if (articleMetadata) {
        articleMetadata.content.split(",").forEach(function (item) {
            if (item != "") {
                articleIds.push(mongoose.Types.ObjectId(item))
            }
        })
    }
    let articles = []
	let sortArticles = []
    if (articleIds.length) {
        articles = await articleProxy.getByQuery({_id: {$in: articleIds}}, {}, {
            sort: {modifyAt: -1}
        })
    }
	let articleObj = {}
	articles.forEach(function (item) {
		articleObj[item._id.toString()] = item
	})
	articleIds.forEach(function (oneArticleId) {
		sortArticles.push(articleObj[oneArticleId.toString()])
	})
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, {
        banner: banner,
        surveyBanner: surveyBanner,
        tips: tips,
        column: columns,
        article: sortArticles
    })
    await next()
}


async function getColumnArticle(ctx, next) {
    let params = {
        columnId: ctx.params.cId,
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum
    }
    const schema = Joi.object().keys({
        columnId: Joi.string().length(24).required(),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().default(10)
    })
    let {value, error} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = CONSTANT.weapp.home.getColumnArticle[utils.getFiled(error.message)] || "参数不合法!"
        throw new Error(error)
    }
    const skipCount = value.pageSize * (value.pageNum - 1)
    let result = await articleProxy.getByQuery({columnId: value.columnId, status: 1}, {}, {
        sort: {modifyAt: -1},
        skip: skipCount,
        limit: value.pageSize
    })
    let list = []
    result.forEach(function (item) {
        list.push(Object.assign({}, item._doc, {createAt: moment(item.createAt).format('YYYY-MM-DD HH:MM')}))
    })
    let total = await articleProxy.countByQuery({columnId: value.columnId, status: 1})
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, {
        list: list,
        total: total
    })
    await next()

}

module.exports = {
    homepage,
    getColumnArticle,
    reportPageBanner
}