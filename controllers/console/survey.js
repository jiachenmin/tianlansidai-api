const surveyProxy = require("../../models/survey_mission.js")
const surveyResultProxy = require("../../models/survey_result")
const SMS = require("../../common/sms")
const Joi = require("joi")
const moment = require("moment")

async function createSurveyMission(ctx, next) {
    let params = {
        surveyMissionId: ctx.request.body.surveyMissionId,
        name: ctx.request.body.name,
        code: ctx.request.body.code,
        areaId: ctx.request.body.areaId,
        schoolId: ctx.request.body.schoolId,
        doctorIds: ctx.request.body.doctorIds,
        startTime: ctx.request.body.startTime,
        endTime: ctx.request.body.endTime,
        couponId: ctx.request.body.couponIds,
        businessStatus: ctx.request.body.businessStatus
    }
    if (ctx.request.body.memo.trim()) {
        params.memo = ctx.request.body.memo.trim()
    }
    const schema = Joi.object().keys({
        name: Joi.string().required(),
        code: Joi.string().default(""),
        areaId: Joi.string().length(24).required(),
        schoolId: Joi.string().length(24).required(),
        doctorIds: Joi.array().items(Joi.string().length(24)).required(),
        startTime: Joi.date().required(),
        endTime: Joi.date().required(),
        memo: Joi.string().default(""),
        couponId: Joi.array().items(Joi.string().length(24)).required(),
        businessStatus: Joi.number().valid(3),
        surveyMissionId: Joi.string().length(24)
    })
    let {value, error} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    let result = null
    if (value.surveyMissionId) {
        let surveyMission = await surveyProxy.getOneByQuery({_id: value.surveyMissionId, status: 1})
        if (!surveyMission) {
            ctx.state.code = 4;
            ctx.state.message = "不存在的普查任务!"
            ctx.state.data = {}
            return await next()
        }
        surveyMission.name = value.name
        surveyMission.code = value.code
        surveyMission.areaId = value.areaId
        surveyMission.schoolId = value.schoolId
        surveyMission.doctorIds = value.doctorIds
        surveyMission.startTime = value.startTime
        surveyMission.endTime = value.endTime
        surveyMission.memo = value.memo
        surveyMission.couponId = value.couponId
        surveyMission.memo = value.memo
        surveyMission.modifyAt = new Date()
        if (value.businessStatus) {
            if (value.businessStatus == 3) {
                surveyMission.completeTime = new Date()
            }
            surveyMission.businessStatus = value.businessStatus
        }
        result = await surveyProxy.save(surveyMission)
    } else {
        result = await surveyProxy.save(value)
    }
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = result
    return await next()
}

async function modifySurveyMission(ctx, next) {
    let now = new Date()
    let params = {
        id: ctx.params.id
    }
    const schema = Joi.object().keys({
        id: Joi.string().length(24).required()
    })
    let {value, error} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    let result = await surveyProxy.findOneAndUpdate({
        _id: value.id,
        status: 1
    }, {$set: {businessStatus: 3, completeTime: now}}, {new: true})
    // await sendSMS(value.id)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = result
    return await next()
}

async function sendSMS(surveyId) {
    let survey = await surveyProxy.getOneByQueryPopulate({_id: surveyId})
    //发送短信通知家长查看结果
    if(survey){
        let phoneMap = {}
        let PhoneNumberJson = []
        let surveyResult = await surveyResultProxy.getByQueryPopulateChild({
            surveyMission: surveryId,
            businessStatus: 2
        })
        surveyResult.forEach(function (one) {
            one.child.parentId.forEach(function (oneParent) {
                phoneMap[oneParent.phone] = 1
            })
        })

        for (key in phoneMap) {
            PhoneNumberJson.push(key)
        }
        let beginAt = moment(survey.startTime).format('YYYY/MM/DD')
        let endAt = moment(survey.endTime).format('YYYY/MM/DD')
        await SMS.sendBatchSms({
            PhoneNumberJson: PhoneNumberJson,
            TemplateCode: SMS.templateCodes.surveyMissionComplete,
            TemplateParamJson: [{"schoolName":survey.schoolId.schoolName},{"beginAt":beginAt},{"endAt":endAt}]
        })
    }
}

async function deleteMission(ctx, next) {
    let params = {
        id: ctx.params.id
    }
    const schema = Joi.object().keys({
        id: Joi.string().length(24).required()
    })
    let {value, error} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    await surveyProxy.delete({_id: value.id, status: 1})
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    return await next()
}

async function surveyMissionList(ctx, next) {
    let params = {
        areaId: ctx.request.query.areaId,
        keyWord: ctx.request.query.keyWord,
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum
    }
    const schema = Joi.object().keys({
        areaId: Joi.string().length(24).default(""),
        keyWord: Joi.string().default(""),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().default(10)
    })
    let {value, error} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    params = Object.assign(params, value)
    params.keyWord = params.keyWord.trim()
    params.areaId = params.areaId.trim()
    const skipCount = params.pageSize * (params.pageNum - 1)

    let queryStr = {status: 1}
    if (value.keyWord) {
        queryStr['$or'] = [{code: new RegExp(value.keyWord, 'ig')}, {name: new RegExp(value.keyWord, 'ig')}]
    }
    if (value.areaId) {
        queryStr['areaId'] = value.areaId
    }
    let result = await surveyProxy.getByQueryPopulateSDC(queryStr, {}, {
        sort: {_id: -1},
        skip: skipCount,
        limit: params.pageSize
    });
    let returnResult = []
    let now = new Date()
    result.forEach(function (item) {
        if (item.businessStatus == 1 && item.startTime <= now) {
            returnResult.push(Object.assign({}, item._doc, {businessStatus: 2}))
        } else {
            returnResult.push(item)
        }
    })

    let total = await surveyProxy.countByQuery(queryStr)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, {total: total, list: returnResult})
    return await next()
}

module.exports = {
    createSurveyMission,
    modifySurveyMission,
    deleteMission,
    surveyMissionList,
}