const schoolProxy = require('../../models/school')
const areaProxy = require('../../models/area')
const childProxy = require('../../models/child')
const surveyResultProxy = require('../../models/survey_result')
const surveyProxy = require('../../models/survey_mission')
const interventionProxy = require('../../models/intervention')
const couponInstanceProxy = require('../../models/coupon_instance')
const userProxy = require('../../models/user')
const checkupTermProxy = require('../../models/checkup_term')
const Joi = require('joi')
const mongoose = require("mongoose")
const eyesightTagUtil = require("../../common/eyesightTagUtil")
const metadataProxy = require('../../models/metadata')
const moment = require('moment')
const controllerUtil = require("../../common/controllerUtil")
const ejs = require('ejs');
const smsManager = require('../../common/sms.js')

async function schoolArrangement (ctx, next) {
    let result = await schoolProxy.model.aggregate([
        { $match: { status: 1 } },
        { $group: { _id: { areaId: "$areaId", schoolStage: "$schoolStage" }, total: { $sum: 1 }, } },
    ])
    let areas = await areaProxy.getAll()
    let areasObj = {}
    areas.forEach(function (oneArea) {
        areasObj[oneArea._id] = oneArea
    })
    let returnObj = {}
    let returnArr = []
    result.forEach(function (one) {
        if (!returnObj[one._id.areaId]) {
            returnObj[one._id.areaId] = {
                areaId: one._id.areaId,
                areaName: areasObj[one._id.areaId].name,
                schools: []
            }
        }
        returnObj[one._id.areaId].schools.push({
            stage: one._id.schoolStage,
            total: one.total
        })
    })
    for (let key in returnObj) {
        returnArr.push(returnObj[key])
    }
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = returnArr
    await next()
}

async function childrenArrangement (ctx, next) {
    let result = await childProxy.model.aggregate([
        { $match: { status: 1, birthTime: { $ne: null } } },
        {
            $project: {
                age: {
                    $divide: [
                        {
                            $subtract: [
                                new Date(),
                                "$birthTime"
                            ]
                        },
                        1000 * 60 * 60 * 24 * 365
                    ]
                },
                gender: 1
            }
        },
        {
            $group: {
                _id: {
                    range: {
                        $concat: [
                            { $cond: [{ $lte: ["$age", 0] }, "Unknown", ""] },
                            { $cond: [{ $and: [{ $gt: ["$age", 0] }, { $lt: ["$age", 10] }] }, "- 10", ""] },
                            { $cond: [{ $and: [{ $gte: ["$age", 10] }, { $lt: ["$age", 15] }] }, "10 - 15", ""] },
                            { $cond: [{ $gte: ["$age", 15] }, "15 -", ""] },
                        ]
                    },
                    gender: "$gender"
                },
                total: { $sum: 1 }
            }
        }
    ])
    let toReturnArr = []
    let toReturnObj = {}
    result.forEach(function (one) {
        if (!toReturnObj[one._id.range]) {
            toReturnObj[one._id.range] = {
                range: one._id.range
            }
        }
        toReturnObj[one._id.range][one._id.gender] = one.total
    })
    for (let key in toReturnObj) {
        toReturnArr.push(toReturnObj[key])
    }
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = toReturnArr
    await next()
}

async function planArrangement (ctx, next) {
    let result = await surveyResultProxy.model.aggregate([
        { $unwind: "$intervention" },
        { $match: { status: 1, type: 1, interventionIsMatched: 2 } },
        {
            $project: {
                intervention: 1,
                gender: 1,
                surveyMission: 1
            }
        },
        {
            $group: {
                _id: { interventionMatched: "$intervention", surveyMission: "$surveyMission" },
                total: { $sum: 1 },
            }
        }
    ])
    let surveyAll = await surveyProxy.getAll()
    let interventionAll = await interventionProxy.getAll()
    let surveyAllObj = {}
    let interventionAllObj = {}
    surveyAll.forEach(function (onesurvey) {
        surveyAllObj[onesurvey._id] = onesurvey
    })
    interventionAll.forEach(function (oneIntervention) {
        interventionAllObj[oneIntervention._id] = oneIntervention
    })

    let toReturnArr = []
    let toReturnObj = {}
    result.forEach(function (one) {
        if (!toReturnObj[one._id.surveyMission]) {
            toReturnObj[one._id.surveyMission] = {
                surveyMissionId: one._id.surveyMission,
                surveyMissionName: surveyAllObj[one._id.surveyMission].name
            }
        }
        toReturnObj[one._id.surveyMission][one._id.interventionMatched] = {
            total: one.total,
            interventionName: interventionAllObj[one._id.interventionMatched].memo
        }
    })
    for (let key in toReturnObj) {
        toReturnArr.push(toReturnObj[key])
    }
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = toReturnArr
    await next()
}

async function commonArrangement (ctx, next) {
    let couponGroup = await couponInstanceProxy.model.aggregate([
        { $match: { status: 1 } },
        { $group: { _id: "$useStatus", total: { $sum: 1 } } }
    ])
    let unCollectCount = await surveyResultProxy.countByQuery({ status: 1, businessStatus: 4 })
    let parentCount = await userProxy.countByQuery({ status: 1 })
    let parentHasChildCount = await childProxy.model.aggregate([
        { $unwind: "$parentId" },
        { $match: { status: 1 } },
        { $project: { "parentId": 1 } },
        { $group: { _id: "$parentId" } },
        { $group: { _id: null, total: { $sum: 1 } } }
    ])
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = {
        couponGroup: couponGroup,
        parentCount: parentCount,
        parentHasChildCount: parentHasChildCount[0].total,
        unCollectCount: unCollectCount
    }
    await next()
}

async function surveyStudentStatistics (ctx, next) {
    let params = {
        surveyId: ctx.params.surveyId,
    }
    const schema = Joi.object().keys({
        surveyId: Joi.string().length(24).required()
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error("参数不合法!")
    }
    let survey = await surveyProxy.getById(value.surveyId)
    if (!survey) {
        ctx.state.code = 4;
        ctx.state.message = "不存在的普查任务!"
        throw new Error(ctx.state.message)
    }
    //待普查学生总数
    let total = await childProxy.countByQuery({ schoolId: survey.schoolId })

    //已有过检查项的学生总数
    let haveCheckedCount = await surveyResultProxy.countByQuery({ surveyMission: survey._id })

    //已全部检查完成的学生总数
    let terms = await checkupTermProxy.getByQuery({ isUse: 1 })
    let query = []
    terms.forEach(function (oneTerms) {
        query.push({
            $elemMatch: { checkupTerm: oneTerms._id }
        })
    })
    let checkCompleteCount = await surveyResultProxy.countByQuery({
        surveyMission: value.surveyId,
        result: { $all: query }
    })
    //在检/漏检学生总数


    let planMatchAgg = await surveyResultProxy.model.aggregate([
        { $match: { status: 1, surveyMission: survey._id } },
        { $group: { _id: "$interventionIsMatched", total: { $sum: 1 }, } },
    ])
    let result = {
        total: total,
        haveCheckedCount: haveCheckedCount,
        checkCompleteCount: checkCompleteCount,
        checkingOrMissed: haveCheckedCount - checkCompleteCount,
        unmatchedCount: 0,
        successMatchedCount: 0,
        failMatchedCount: 0
    }
    planMatchAgg.forEach(function (one) {
        switch (one._id) {
            case 1:
                result.unmatchedCount = one.total
                break
            case 2:
                result.successMatchedCount = one.total
                break
            case 3:
                result.failMatchedCount = one.total
        }
    })
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = result
    await next()
}

async function getExceptionReport (ctx, next) {
    let params = {
        surveyId: ctx.params.surveyId,
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum,
        keyWord: ctx.request.query.keyWord,
        type: ctx.request.query.type,
    }
    const schema = Joi.object().keys({
        surveyId: Joi.string().length(24).required(),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().default(10),
        keyWord: Joi.string().allow("").optional(),
        type: Joi.number().valid(1, 2, 3, 4, 5).allow("").optional()
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error("参数不合法!")
    }
    let survey = await surveyProxy.getById(value.surveyId)
    if (!survey) {
        ctx.state.code = 4;
        ctx.state.message = "不存在的普查任务!"
        throw new Error(ctx.state.message)
    }
    const skipCount = value.pageSize * (value.pageNum - 1)
    let terms = await checkupTermProxy.getByQuery({ isUse: 1 })
    let termMap = {}
    let resultMap = {}
    let query = []
    terms.forEach(function (oneTerm) {
        termMap[oneTerm._id] = oneTerm
        resultMap[oneTerm.name + oneTerm.code] = "未检"
        query.push({
            $elemMatch: { checkupTerm: oneTerm._id }
        })
    })
    let queryObj = {
        surveyMission: value.surveyId,
        $or: [{ result: { $not: { $all: query } } }, { result: { $elemMatch: { value: "" } } }]
    }
    if (value.keyWord) {
        let regx = new RegExp(value.keyWord)
        let children = await childProxy.getByQuery({ $or: [{ name: regx }, { identityCode: regx }] })
        let childIds = []
        children.forEach(function (oneChild) {
            childIds.push(oneChild._id)
        })
        queryObj.child = { $in: childIds }
    }
    if (value.type) {
        switch (value.type) {
            case 1:
                queryObj.businessStatus = 2
                break
            case 2:
                queryObj.businessStatus = 5
                queryObj.interventionIsMatched = 1
                break
            case 3:
                queryObj.businessStatus = 5
                queryObj.interventionIsMatched = 2
                break
            case 4:
                queryObj.businessStatus = 5
                queryObj.interventionIsMatched = 3
                break
            case 5:
                queryObj["$and"] = [
                    { businessStatus: { $ne: 2 } },
                    { businessStatus: { $ne: 5 } },
                ]
        }
    }
    let exceptionData = await surveyResultProxy.getByQueryPopulateChild(queryObj, {}, {
        sort: { _id: -1 },
        skip: skipCount,
        limit: value.pageSize
    })
    let total = await surveyResultProxy.countByQuery(queryObj)
    let finalResult = []
    exceptionData.forEach(function (one) {
        let result = Object.assign({}, resultMap)
        one.result.forEach(function (oneResult) {
            result[termMap[oneResult.checkupTerm].name + termMap[oneResult.checkupTerm].code] = oneResult.value
        })
        finalResult.push({
            childId: one.child._id,
            childName: one.child.name,
            result: result
        })
    })
    //let test = []
    //for(let i = 0; i < value.pageSize; i++){
    //    test.push(finalResult[0])
    //}
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = {
        total: total,
        children: finalResult,
    }
    await next()
}

async function revise (ctx, next) {
    let params = {
        resultId: ctx.params.resultId,
        termId: ctx.request.body.termId,
        value: ctx.request.body.value
    }
    const schema = Joi.object().keys({
        resultId: Joi.string().length(24).required(),
        termId: Joi.string().length(24).required(),
        value: Joi.string().allow("").required(),
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error("参数不合法!")
    }
    let term = await checkupTermProxy.getById(value.termId)
    if (!term) {
        ctx.state.code = 4
        ctx.state.message = "不存在的体检项!"
        return await next()
    }
    let resultSaved = await surveyResultProxy.getById(value.resultId)
    if (!resultSaved) {
        ctx.state.code = 4
        ctx.state.message = "不存在的体检结果!"
        return await next()
    }
    let find = false
    for (let i = 0; i < resultSaved.result.length; i++) {
        if (resultSaved.result[i].checkupTerm.toString() == value.termId) {
            find = true
            resultSaved.result[i].value = value.value
        }
    }
    if (!find) {
        resultSaved.result.push({
            checkupGroup: term.groupId,
            checkupTerm: term._id,
            value: value.value,
            docker: null,
        })
    }
    resultSaved = await surveyResultProxy.save(resultSaved)
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = { result: resultSaved }
    await next()
}

async function surveyResult (ctx, next) {
    let params = {
        surveyId: ctx.params.surveyId,
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum,
        keyWord: ctx.request.query.keyWord,
        type: ctx.request.query.type,           //1、全部数据，2、异常数据
        condition: ctx.request.query.condition  //筛选条件
    }
    const schema = Joi.object().keys({
        surveyId: Joi.string().length(24).required(),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().default(10),
        keyWord: Joi.string().allow("").optional(),
        type: Joi.number().valid(1, 2).required(),
        condition: Joi.number().valid(1, 2, 3, 4, 5).allow("").optional(),
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error("参数不合法!")
    }

    let terms = await checkupTermProxy.getByQuery({ isUse: 1 })
    let termMap = {}
    let childQuery = []
    terms.forEach(function (oneTerm) {
        termMap[oneTerm._id] = oneTerm.name + oneTerm.code
        childQuery.push({
            $elemMatch: { checkupTerm: oneTerm._id }
        })
    })
    let query = {
        surveyMission: value.surveyId
    }

    if (value.type == 2) {
        query["$or"] = [{ result: { $not: { $all: childQuery } } }, { result: { $elemMatch: { value: "" } } }]
    }
    if (value.keyWord) {
        let regx = new RegExp(value.keyWord)
        let children = await childProxy.getByQuery({ $or: [{ name: regx }, { identityCode: regx }] })
        let childIds = []
        children.forEach(function (oneChild) {
            childIds.push(oneChild._id)
        })
        query.child = { $in: childIds }
    }
    if (value.condition) {
        switch (value.condition) {
            case 1:
                query.businessStatus = 2
                break
            case 2:
                query.businessStatus = 5
                query.interventionIsMatched = 1
                break
            case 3:
                query.businessStatus = 5
                query.interventionIsMatched = 2
                break
            case 4:
                query.businessStatus = 5
                query.interventionIsMatched = 3
                break
            case 5:
                query["$and"] = [
                    { businessStatus: { $ne: 2 } },
                    { businessStatus: { $ne: 5 } },
                ]
        }
    }
    const skipCount = value.pageSize * (value.pageNum - 1)
    let result = await surveyResultProxy.getByQueryPopulateChild(query, "", {
        sort: { createAt: -1 },
        skip: skipCount,
        limit: value.pageSize
    })
    let total = await surveyResultProxy.countByQuery(query)
    for (let i = 0; i < result.length; i++) {
        let checkTermMap = {}
        for (let j = 0; j < result[i].result.length; j++) {
            checkTermMap[result[i].result[j].checkupTerm] = j
        }
        for (let k = 0; k < terms.length; k++) {
            if (!(terms[k]._id in checkTermMap)) {
                result[i].result.push({
                    checkupGroup: terms[k].groupId,
                    checkupTerm: terms[k]._id,
                    value: "未检",
                    docker: null,
                })
            }
        }
    }
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = { surveyResult: result, total: total, termMap: termMap }
    await next()
}

async function updateMobile (ctx, next) {
    let params = {
        userId: ctx.params.userId,
        mobile: ctx.request.body.mobile,
    }
    const schema = Joi.object().keys({
        userId: Joi.string().length(24).required(),
        mobile: Joi.string().length(11).required(),
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error("参数不合法!")
    }
    let user = await userProxy.getById(value.userId)
    if (!user) {
        ctx.state.code = 4
        ctx.state.message = "不存在的用户!"
        ctx.state.data = {}
        return await next()
    }
    user.phone = value.mobile
    user = await userProxy.save(user)
    ctx.state.code = 1
    ctx.state.message = "修改成功!"
    ctx.state.data = { user: user }
    await next()
}

async function operationBind (ctx, next) {
    let params = {
        parentId: ctx.request.body.parentId,
        childId: ctx.request.body.childId,
        type: ctx.request.body.type,
    }
    const schema = Joi.object().keys({
        parentId: Joi.string().length(24).required(),
        childId: Joi.string().length(24).required(),
        type: Joi.number().valid(1, 2).optional()//1 绑定，2 解绑
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error("参数不合法!")
    }
    let user = await userProxy.getById(value.parentId)
    if (!user) {
        ctx.state.code = 4
        ctx.state.message = "不存在的家长!"
        ctx.state.data = {}
        return await next()
    }
    let child = await childProxy.getById(value.childId)
    if (!child) {
        ctx.state.code = 4
        ctx.state.message = "不存在的宝贝!"
        ctx.state.data = {}
        return await next()
    }

    let index = child.parentId.indexOf(mongoose.Types.ObjectId(value.parentId))
    if (index == -1 && value.type == 1) {
        child.parentId.push(mongoose.Types.ObjectId(value.parentId))
        ctx.state.message = "绑定成功!"
    }
    if (index != -1 && value.type == 2) {
        child.parentId.splice(index, 1)
        ctx.state.message = "解绑成功!"
    }
    child.modifyAt = new Date()
    await childProxy.save(child)
    ctx.state.code = 1
    ctx.state.data = {}
    await next()
}

async function searchParent (ctx, next) {
    let params = {
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum,
        keyWord: ctx.request.query.keyWord,
    }
    const schema = Joi.object().keys({
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().default(10),
        keyWord: Joi.string().allow("").optional(),
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error("参数不合法!")
    }
    let query = {
        status: 1
    }
    if (value.keyWord) {
        if (value.keyWord.length == 24) {
            query["_id"] = value.keyWord
        } else {
            let regx = new RegExp(value.keyWord)
            query["phone"] = regx
        }
    }
    let skipCount = (value.pageNum - 1) * value.pageSize
    let result = await userProxy.getByQuery(query, "", {
        sort: { createAt: -1 },
        skip: skipCount,
        limit: value.pageSize
    })
    let total = await userProxy.countByQuery(query)
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = { parents: result, total: total }
    await next()
}

async function setTagBySurveyResult (ctx, next) {
    // 1.获取参数
    let params = {
        surveyId: ctx.params.surveyId
    }

    // 2.设置校验模板
    const schema = Joi.object().keys({
        surveyId: Joi.string().length(24).required()
    })

    // 3.执行参数校验
    let { value, error } = Joi.validate(params, schema)
    // 3.1.校验失败时，抛出异常，返回错误提示-1
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error("参数不合法!")
    }

    // 4.执行具体的逻辑
    // 4.1.获取检查项目
    const terms = await checkupTermProxy.getByQuery({ isUse: 1 })
    // 4.2.遍历检查项目，以 _id 为 key , name 和 code 拼接在一起 为 value 形成 json 对象
    const termMap = {}
    terms.forEach(term => termMap[term._id] = term.name + term.code)
    // 4.3.获取当前普查任务的检查结果
    const query = { surveyMission: value.surveyId }
    const total = await surveyResultProxy.countByQuery(query)
    const result = await surveyResultProxy.getByQueryPopulateChild(query, "", {})
    // 4.4.遍历检查结果，整理检查数据并执行标签标记操作
    let i = 0
    for (; i < result.length; i++) {
        // 4.4.1.获取当前检查结果记录
        let record = result[i]
        // 4.4.2.遍历当前记录中的检查项目，并整理成分析用的数据
        for (let j = 0; j < record.result.length; j++) {
            const resultItem = record.result[j]
            const itemCode = termMap[resultItem.checkupTerm]
            record[itemCode] = resultItem.value
        }
        // 4.4.3.计算左右眼标签                                                                                                                                                                                                                                                       
        record = eyesightTagUtil.setTag(record)
        // 4.4.4.获取左右眼标签
        let memo = record.memo
        if (!memo) { memo = "{}" }
        memo = Object.assign({}, JSON.parse(memo), {
            TAG: { L: record["标签_L"], R: record["标签_R"] }
        })
        // 4.4.5.将标签更新到系统中
        await surveyResultProxy.updateOne({
            _id: mongoose.Types.ObjectId(record._id)
        }, { $set: { memo: JSON.stringify(memo) } })
    }
    // 4.5.将处理后的概述更新到普查任务中
    const tagSummary = { TAG: { total: total, taggedCount: i, isTaggedAll: (total == i) } }
    await surveyProxy.updateOne({
        _id: mongoose.Types.ObjectId(value.surveyId)
    }, { $set: { memo: JSON.stringify(tagSummary) } })

    // 5.返回正在处理的提示
    ctx.state.code = 1
    ctx.state.message = "处理完成"
    ctx.state.data = tagSummary["TAG"]
    await next()
}

async function _doSendAliSms (phone, visionTagMessage, messageParam) {
    const sendParam = {
        SignName: visionTagMessage['aliSms']["signName"],
        PhoneNumbers: phone,
        TemplateCode: visionTagMessage['aliSms']["smsCode"],
        TemplateParam: messageParam
    };
    return await smsManager.sendSms(sendParam);
}
function _getSurveyResultMessageDetail (json4SurveyResultMemo) {
    if (!json4SurveyResultMemo || Object.keys(json4SurveyResultMemo).length <= 0)
        return { aliSms: {}, wxServiceMsg: {} }

    let oldMessageDetail = json4SurveyResultMemo["MSG"]
    if (!oldMessageDetail || Object.keys(json4SurveyResultMemo).length <= 0)
        return { aliSms: {}, wxServiceMsg: {} }

    oldMessageDetail = oldMessageDetail["detail"]
    if (!oldMessageDetail || Object.keys(oldMessageDetail).length <= 0)
        return { aliSms: {}, wxServiceMsg: {} }

    return oldMessageDetail
}
async function doSendMessage (surveyResult, surveyMission, visionTag, visionTagMessage) {
    const tag = JSON.parse(surveyResult.memo)["TAG"]
    const json4SurveyResultMemo = JSON.parse(surveyResult.memo)
    const messageDetail = _getSurveyResultMessageDetail(json4SurveyResultMemo)
    let sendState = 1 // 默认为失败

    if (!surveyResult.child) return sendState

    const messageParam = {
        childName: surveyResult.child.name,
        surveyDate: moment(surveyResult.createAt).format('YYYY-MM-DD'),
        schoolName: surveyMission.schoolId.schoolName,
        tagEyeL: visionTag[tag["L"]],
        tagEyeR: visionTag[tag["R"]],
        pagePath: "",
    }
    const parentId = surveyResult.child.parentId
    let parents = await userProxy.getByQuery({ "_id": { "$in": parentId } })

    const wxServiceMsgConfig = visionTagMessage["wxServiceMsg"]
    for (let i = 0; i < parents.length; i++) {
        const parent = parents[i]
        let phone = parent.phone
        // 1.如没有服务号openid，则发送阿里云短信
        const toUserOpenId = parent["openId_" + wxServiceMsgConfig["appId"]]
        if (!toUserOpenId) {
            // 没找到手机号，则不能发送
            if (!phone) continue;
            // 已经发送过，则无需发送
            if (messageDetail['aliSms'][parent._id]) {
                sendState = 3 // 不需要再发送
                continue
            }
            let sendResult = await _doSendAliSms(phone, visionTagMessage, messageParam)
            if (sendResult.sendResult.Message == "OK") {
                sendState = 2 // 发送成功
                messageDetail['aliSms'][parent._id] = sendResult._id
            }
        } else {
            // 2.发送服务号消息
            const toSendContent = {
                "touser": toUserOpenId,
                "template_id": wxServiceMsgConfig.templateId,
                "data": {
                    "first": { "value": wxServiceMsgConfig.first.value, "color": wxServiceMsgConfig.first.color },
                    "keyword1": { "value": phone, "color": wxServiceMsgConfig.keyword1.color }, // 手机号码 
                    "keyword2": { "value": messageParam.childName, "color": wxServiceMsgConfig.keyword2.color }, // 孩子姓名
                    "keyword3": { "value": messageParam.surveyDate, "color": wxServiceMsgConfig.keyword3.color }, // 普查时间
                    "keyword4": { "value": messageParam.tagEyeL, "color": wxServiceMsgConfig.keyword4.color }, // 左眼结果
                    "keyword5": { "value": messageParam.tagEyeR, "color": wxServiceMsgConfig.keyword5.color }, // 右眼结果
                    "remark": { "value": wxServiceMsgConfig.remark.value, "color": wxServiceMsgConfig.remark.color }
                }
            }
        }
    }
    if (sendState == 2) {
        const surveyResultMemo = Object.assign({}, JSON.parse(surveyResult.memo), { MSG: { isSend: true, detail: messageDetail } })
        await surveyResultProxy.updateOne({ _id: mongoose.Types.ObjectId(surveyResult._id) }, { $set: { memo: JSON.stringify(surveyResultMemo) } })
    }
    return sendState
}

async function sendMessage (ctx, next) {
    // 1.获取参数
    let params = { surveyId: ctx.params.surveyId }

    // 2.设置校验模板
    const schema = Joi.object().keys({ surveyId: Joi.string().length(24).required() })

    // 3.执行参数校验
    // 3.1.校验失败时，抛出异常，返回错误提示-1
    // 3.2.校验成功时，返回通过校验的参数
    const value = controllerUtil.validateParam(ctx, params, schema)

    // 4.执行具体的逻辑
    // 4.1.获取普查任务
    const surveyMission = await surveyProxy.getOneByQueryPopulate({ _id: value.surveyId, status: 1 })
    if (!surveyMission) controllerUtil.failureResponse(ctx, '普查任务不存在')

    // 4.2.获取元数据（标签、标签话术）
    let visionTag = await metadataProxy.getOneByQuery({ number: "VISION_TAG", status: 1 })
    if (!visionTag || !visionTag.content) controllerUtil.failureResponse(ctx, '元数据配置 VISION_TAG 不存在或内容为空')
    visionTag = JSON.parse(visionTag.content)

    let visionTagMessage = await metadataProxy.getOneByQuery({ number: "VISION_TAG_MESSAGE", status: 1 })
    if (!visionTagMessage || !visionTagMessage.content) controllerUtil.failureResponse(ctx, '元数据配置 VISION_TAG_MESSAGE 不存在或内容为空')
    visionTagMessage = JSON.parse(visionTagMessage.content)
    visionTagMessage.wxServiceMsg.first.value = ejs.render(visionTagMessage.wxServiceMsg.first.value, { schoolName: surveyMission.schoolId.schoolName })

    // 4.3.获取当前普查任务的检查结果
    const query = { surveyMission: value.surveyId }
    const result = await surveyResultProxy.getByQueryPopulateChild(query, "", {})
    // 4.3.遍历检查结果，整理检查数据并执行标签标记操作
    let i = 0
    let allSuccessCount = 0
    let isSendSuccessCount = 0
    let isSendFailureCount = 0
    for (; i < result.length; i++) {
        // 4.4.1.获取当前检查结果记录
        const sendState = await doSendMessage(result[i], surveyMission, visionTag, visionTagMessage)
        if (sendState == 1) {
            isSendFailureCount++
        } else if (sendState == 2) {
            isSendSuccessCount++
        } else {
            allSuccessCount++
        }
    }
    // 4.5.将处理后的概述更新到普查任务中
    let surveyMissionMemo = surveyMission.memo
    if (!surveyMissionMemo) surveyMissionMemo = "{}"
    const total = await surveyResultProxy.countByQuery(query)
    surveyMissionMemo = Object.assign({}, JSON.parse(surveyMissionMemo), { MSG: { total: total, sendedCount: i, allSuccessCount: allSuccessCount, successCount: isSendSuccessCount, failureCount: isSendFailureCount, isSended: (total == i) } })
    await surveyProxy.updateOne({
        _id: mongoose.Types.ObjectId(value.surveyId)
    }, { $set: { memo: JSON.stringify(surveyMissionMemo) } })

    // 5.返回正在处理的提示
    ctx.state.code = 1
    ctx.state.message = "处理完成"
    ctx.state.data = surveyMissionMemo["MSG"]
    await next()
}

module.exports = {
    schoolArrangement,
    childrenArrangement,
    planArrangement,
    commonArrangement,
    surveyStudentStatistics,
    getExceptionReport,
    revise,
    surveyResult,
    updateMobile,
    operationBind,
    searchParent,
    setTagBySurveyResult,
    sendMessage
}