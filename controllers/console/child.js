const childProxy = require('../../models/child')
const Joi = require('joi')
const CONSTANT = require('../../common/constants')
const surveyResultProxy = require('../../models/survey_result')
const surveyMissionProxy = require('../../models/survey_mission')

async function findChild(ctx, next) {

    let id = ctx.params.id;

    const schema = Joi.object().keys({
        id: Joi.string().length(24),
    });

    const { error, value } = Joi.validate({
        id: id,
    }, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = error
        throw new Error(error)
    }

    let child = await childProxy.getOneByQuery({ _id: value.id, status: 1 }, '', {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        child: child
    })

    await next()
}

async function findChildByIds(ctx, next) {

    let params = { ids: ctx.request.body.ids }

    const schema = Joi.object().keys({
        ids: Joi.array().items(Joi.string())
    })

    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }    
    let result = await childProxy.getByQuery({_id: {$in: value.ids}}, {}, {
        sort: {_id: -1}
    })
    let total = await childProxy.countByQuery({_id: {$in: value.ids}})
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, {total: total, list: result})
    return await next()
}

async function childList(ctx, next) {
    let params = {
        keyWord: ctx.request.query.keyWord,
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum
    }

    const schema = Joi.object().keys({
        keyWord: Joi.string().allow("").default(""),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().default(10)
    })

    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    const skipCount = value.pageSize * (value.pageNum - 1)
    let queryStr = {status: 1}
    if (value.keyWord.trim()) {
        // queryStr['$or'] = [{name: new RegExp(value.keyWord, 'ig')}, {identityCode: new RegExp(value.keyWord, 'ig')}, {studentCode: new RegExp(value.keyWord, 'ig')}]
        queryStr['$or'] = [{name: new RegExp(value.keyWord, 'ig')}, {identityCode: new RegExp(value.keyWord, 'ig')}]
    }
    let result = await childProxy.getByQuery(queryStr, {}, {
        sort: {_id: -1},
        skip: skipCount,
        limit: value.pageSize
    })
    let total = await childProxy.countByQuery(queryStr)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, {total: total, list: result})
    return await next()
}

async function listChild(ctx, next) {
    let params = {
        keyWord: ctx.request.query.keyWord,
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum,
        schoolId: ctx.request.query.schoolId,
        gradeName: ctx.request.query.gradeName,
        className: ctx.request.query.className,
    }

    const schema = Joi.object().keys({
        keyWord: Joi.string().allow("").default(""),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().default(10),
        schoolId: Joi.string().allow("").default("").length(24),
        gradeName: Joi.string().allow("").default(""),
        className: Joi.string().allow("").default(""),
    })

    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    const skipCount = value.pageSize * (value.pageNum - 1)
    let queryStr = {status: 1}
    if (value.keyWord.trim()) {
        // queryStr['$or'] = [{name: new RegExp(value.keyWord, 'ig')}, {identityCode: new RegExp(value.keyWord, 'ig')}, {studentCode: new RegExp(value.keyWord, 'ig')}]
        queryStr['$or'] = [{name: new RegExp(value.keyWord.trim(), 'ig')}, {identityCode: new RegExp(value.keyWord.trim(), 'ig')}]
    }
    if(value.schoolId.trim()){
        queryStr.schoolId = value.schoolId
    }
    if(value.gradeName.trim()){
        queryStr.gradeName = value.gradeName
    }
    if(value.className.trim()){
        queryStr.className = value.className
    }
    let result = await childProxy.getByQueryPopulate(queryStr, {}, {
        sort: {_id: -1},
        skip: skipCount,
        limit: value.pageSize
    })
    let total = await childProxy.countByQuery(queryStr)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, {total: total, list: result})
    return await next()
}

async function getSurveyMission(ctx, next) {
    let params = {
        childId : ctx.request.query.childI
    }
    let schema = Joi.object().keys({
        childId : Joi.string().length(24).required()
    })
    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    let child = await childProxy.getOneByQueryPopulate(value.childId)
    if(!child){
        ctx.state.code = 4;
        ctx.state.message = "不存的宝贝!"
        ctx.state.data = {}
    }
    let now = new Date()
    let returnResultHistory = []//普查历史
    let returnResultCurrent = []//进行中的普查
    let surveyResults = await surveyResultProxy.getByQueryPopulateSM({
        child: child._id,
        status: 1,
        type: 1
    }, null, {sort: {createAt: -1}})
    for (let i = 0; i < surveyResults.length; i++) {
        let current = surveyResults[i]
        let tmp = {
            childId: child._id,
            childName: child.name,
            icon: child.icon,
            surveyId: current.surveyMission._id,
            schoolId: child.schoolId._id,
            schoolName: child.schoolId.schoolName,
            startTime: moment(current.surveyMission.startTime).format('YYYY年MM月DD日'),
            endTime: moment(current.surveyMission.endTime).format('YYYY年MM月DD日')
        }
        if (current.businessStatus > 2) {//已经结束的普查
            tmp.surveyStatus = current.businessStatus
            tmp.surveyStatusShow = CONSTANT.SURVEY_STATUS[current.businessStatus]
            returnResultHistory.push(tmp)
        } else {
            if (current.surveyMission.businessStatus == 3) {
                tmp.surveyStatus = 3
                tmp.surveyStatusShow = CONSTANT.SURVEY_STATUS[3]
                current.businessStatus = 3
                current.surveyMission = current.surveyMission._id
                current.modifyAt = new Date()
                await surveyResultProxy.save(current)
            } else {
                tmp.surveyStatus = current.businessStatus
                tmp.surveyStatusShow = CONSTANT.SURVEY_STATUS[current.businessStatus]
            }
            returnResultCurrent.push(tmp)
        }

    }

    //获取该学校执行中的普查任务
    let surveyMission = await surveyMissionProxy.getOneByQueryPopulate({
        businessStatus: 1,
        status: 1,
        schoolId: child.schoolId._id,
        startTime: {$lte: now},
        endTime: {$gte: now}
    }, null, {sort: {createAt: -1}})
    let tmp = {
        childId: child._id,
        childName: child.name,
        icon: child.icon
    }
    if (!!surveyMission) { //没有普查任务
        tmp.surveyStatus = 0
        tmp.surveyStatusShow = CONSTANT.SURVEY_STATUS[0]
        tmp.surveyId = null
        // returnResult.push(tmp) //小鹏需求，如果没有普查任务就不返回了2019.04.25
        let surveyResult = await surveyResultProxy.getOneByQuery({
            child: child._id,
            surveyMission: surveyMission._id,
            status: 1,
            type: 1
        })
        if (!surveyResult) {
            returnResultCurrent.push({
                childId: child._id,
                childName: child.name,
                icon: child.icon,
                surveyId: surveyMission._id,
                schoolId: child.schoolId._id,
                schoolName: child.schoolId.schoolName,
                startTime: moment(surveyMission.startTime).format('YYYY年MM月DD日'),
                endTime: moment(surveyMission.endTime).format('YYYY年MM月DD日'),
                surveyStatus: 1,
                surveyStatusShow: CONSTANT.SURVEY_STATUS[1]
            })
        }
    }
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = returnResultCurrent.concat(returnResultHistory)
    await next()
}


module.exports = {childList, getSurveyMission, listChild, findChild, findChildByIds}