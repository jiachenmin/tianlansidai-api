const childProxy = require("../../models/child.js")
const surveyMissionProxy = require("../../models/survey_mission.js")
const surveyResultProxy = require("../../models/survey_result.js")
const Joi = require('joi')
const feedbackProxy = require('../../models/feedback.js')
const userProxy = require('../../models/user')
const questionnaireResultProxy = require('../../models/questionnaire_result.js')
const mongoose = require("mongoose")
const config = require('../../config')
const moment = require('moment')
const OSS = require('ali-oss')
const fs = require('fs')
const checkupTermProxy = require('../../models/checkup_term')
const interventionProxy = require('../../models/intervention')
const metadataProxy = require('../../models/metadata')
const vm = require('vm')
const utils = require('../../common/utils')
const CONSTANT = require('../../common/constants')
const subjectProxy = require('../../models/subject')
const stringUtil = require('../../common/stringUtil')


async function addChildren (ctx, next) {
    let params = {
        childId: ctx.request.body.childId,
        icon: ctx.request.body.icon,
        name: ctx.request.body.name,
        gender: ctx.request.body.gender,
        // studentCode: ctx.request.body.studentCode,
        identityCode: ctx.request.body.identityCode,
        schoolId: ctx.request.body.schoolId,
        parentId: ctx.state.user._id,
        gradeName: ctx.request.body.gradeName,
        className: ctx.request.body.className,
    }
    let schemaObj = {
        icon: Joi.string().required(),
        name: Joi.string().required(),
        gender: Joi.number().valid(1, 2).required(),
        // studentCode: Joi.string().required(),
        identityCode: Joi.string().length(18).required(),
        schoolId: Joi.string().length(24).required(),
        parentId: Joi.string().length(24).required(),
        childId: Joi.string().length(24),
        gradeName: Joi.string().allow("").default(""),
        className: Joi.string().allow("").default(""),
    }
    if (!params.childId) {
        params.questionnaireId = ctx.request.body.questionnaireId
        params.questionnaireResult = ctx.request.body.questionnaireResult
        schemaObj.questionnaireId = Joi.string().length(24).required()
        schemaObj.questionnaireResult = Joi.array().items(
            Joi.object().keys({
                subject: Joi.string().length(24).required(),
                value: Joi.string().required(),
            }))
    }
    const schema = Joi.object().keys(schemaObj)
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = CONSTANT.weapp.survey.addChildren[utils.getFiled(error.message)] || "参数不合法!"
        throw new Error(error)
    }
    if (value.childId) {//修改宝贝信息
        let child = await childProxy.getOneByQuery({ _id: value.childId, status: 1 })
        if (!child) {
            ctx.state.code = 4;
            ctx.state.message = "该宝贝不存在!"
            ctx.state.data = {}
            return await next()
        }
        if (child.parentId.indexOf(value.parentId) == -1) {
            ctx.state.code = 4;
            ctx.state.message = "您不是该宝贝家长，不能修改宝贝信息!"
            ctx.state.data = {}
            return await next()
        }
        child.icon = value.icon
        child.name = value.name
        child.gender = value.gender
        // child.studentCode = value.studentCode
        child.identityCode = value.identityCode
        child.schoolId = value.schoolId
        child.gradeName = value.gradeName
        child.className = value.className
        child.modifyAt = new Date()
        child = await childProxy.save(child)
        ctx.state.code = 1;
        ctx.state.message = "success!"
        ctx.state.data = child
        return await next()
    }
    //判断该孩子是否已经存在
    let child = await childProxy.getOneByQuery({
        identityCode: value.identityCode,
        // studentCode: value.studentCode,
        status: 1
    })
    if (child) {
        if (child.parentId.indexOf(value.parentId) == -1) {
            child.parentId.push(value.parentId)
            child = await childProxy.save(child)
            ctx.state.code = 1;
            ctx.state.message = "success!"
            ctx.state.data = child
            return await next()
        } else {
            ctx.state.code = 4;
            ctx.state.message = "您已添加过该宝贝!"
            ctx.state.data = child
            return await next()
        }
    }
    //校验问卷结果
    let subjects = await subjectProxy.getByQuery({ qid: value.questionnaireId, status: 1, isMust: 1 })
    let questionnaireResultObj = {}
    value.questionnaireResult.forEach(function (item) {
        questionnaireResultObj[item.subject] = 1
    })
    let isValid = true
    subjects.forEach(function (item) {
        if (!questionnaireResultObj[item._id.toString()]) {
            isValid = false
        }
    })
    if (!isValid) {
        ctx.state.code = 4;
        ctx.state.message = "请回答所有必填项的问题!"
        ctx.state.data = {}
        return await next()
    }
    //调查问卷
    let qrObj = {
        questionnaire: value.questionnaireId,
        select: value.questionnaireResult
    }
    //生成二维码并上传到oss
    // let childId = mongoose.Types.ObjectId()
    // let qrimage = qr_image.image(childId.toString())
    // let filename = childId.toString() + '_' + (new Date().getTime()) + '.png'
    // let uploadRes = await upload(filename, qrimage)
    // if (200 != uploadRes.res.status) {
    //     ctx.state.code = 4;
    //     ctx.state.message = "二维码生成失败!"
    //     ctx.state.data = {}
    //     return await next()
    // }
    // let newchild = Object.assign({}, value, {qrcode: config.aliyun.oss.visitUrl + uploadRes.name}, {_id: childId})
    let toSave = {};
    let birthDay = utils.getBirth(value.identityCode)
    if (!birthDay || birthDay == "Invalid Date") {
        console.log("请正确填写身份证号码!")
        ctx.state.code = 4;
        ctx.state.message = "请正确填写身份证号码!"
        ctx.state.data = {}
        return await next()
    }
    Object.assign(toSave, {
        icon: value.icon,
        name: value.name,
        gender: value.gender,
        // studentCode: value.studentCode,
        identityCode: value.identityCode,
        schoolId: value.schoolId,
        birthTime: birthDay,
        parentId: [value.parentId],
        gradeName: value.gradeName,
        className: value.className
    })
    let childSave = await childProxy.save(toSave)
    if (!childSave) {
        ctx.state.code = 4;
        ctx.state.message = "宝贝添加失败!"
        ctx.state.data = {}
        return await next()
    }
    qrObj.child = childSave._id
    await questionnaireResultProxy.save(qrObj)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = childSave
    return await next()
}

async function createQrcode (ctx, next) {
    let params = {
        id: ctx.params.id,
    }
    const schema = Joi.object().keys({
        id: Joi.string().length(24).required()
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error("参数不合法!")
    }
    let child = await childProxy.getByQuery({ _id: value.id, status: 1 })
    if (!child.length) {
        ctx.state.code = 4;
        ctx.state.message = "未添加的宝贝!"
        ctx.state.data = {}
        return await next()
    }
    ctx.type = "image/png"
    ctx.body = new Buffer(child[0].qrcode, "base64")
    return await next()
}

async function createFeedback (ctx, next) {
    let params = {
        mobile: ctx.request.body.mobile,
        parentName: ctx.request.body.parentName,
        parentOpinion: ctx.request.body.parentOpinion, //家长意见
        surveyMissionId: ctx.request.body.surveyMissionId, //普查任务Id
        childId: ctx.params.id,
        parentId: ctx.state.user._id
    }
    const schema = Joi.object().keys({
        mobile: Joi.string().length(11).required(),
        parentName: Joi.string(),
        parentOpinion: Joi.string(),
        childId: Joi.string().length(24).required(),
        parentId: Joi.string().length(24).required(),
        surveyMissionId: Joi.string().length(24).required()
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error("参数不合法!")
    }
    let oldOne = await feedbackProxy.getOneByQuery({ childId: value.childId, surveyMissionId: value.surveyMissionId })
    if (oldOne) {
        ctx.state.code = 4;
        ctx.state.message = "已经填写过反馈了!"
        throw new Error("已经填写过反馈了!")
    }
    let result = await feedbackProxy.save(value)
    await surveyResultProxy.updateOne({
        child: value.childId,
        surveyMission: value.surveyMissionId
    }, { $set: { businessStatus: 4 } })
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = result
    return await next()
}

async function getSurveyMission (ctx, next) {
    //let uid = ctx.params.id
    //let user = await userProxy.getById(uid)
    let user = ctx.state.user //|| {_id: mongoose.Types.ObjectId("5ca496e6deaea140b4a5eecc")}
    let now = new Date()
    let children = await childProxy.getByQueryPopulate({ parentId: user._id, status: 1 })
    if (!children.length) {
        ctx.state.code = 4;
        ctx.state.message = "请先添加宝贝!"
        throw new Error("请先添加宝贝!")
    }
    let returnResultHistory = []//普查历史
    let returnResultCurrent = []//进行中的普查
    for (let index = 0; index < children.length; index++) {
        let child = children[index]
        let surveyResults = await surveyResultProxy.getByQueryPopulateSM({
            child: child._id,
            status: 1,
            type: 1
        }, null, { sort: { createAt: -1 } })
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
                // 普查结果为 2 正在分析中 以及以下 时，如果 所属的普查任务完成了，即 businessStatus == 3 则将普查结果的状态直接设置为 5 待领取报告 
                if (current.surveyMission.businessStatus == 3) {
                    tmp.surveyStatus = 5
                    tmp.surveyStatusShow = CONSTANT.SURVEY_STATUS[5]
                    current.businessStatus = 5
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
            startTime: { $lte: now },
            endTime: { $gte: now }
        }, null, { sort: { createAt: -1 } })
        let tmp = {
            childId: child._id,
            childName: child.name,
            icon: child.icon,
            qrcode: child.qrcode
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
        /*else { //有普查任务,执行中
            tmp.surveyId = surveyMission._id
            tmp.schoolId = surveyMission.schoolId._id
            tmp.schoolName = surveyMission.schoolId.schoolName
            tmp.startTime = moment(surveyMission.startTime).format('YYYY年MM月DD日')
            tmp.endTime = moment(surveyMission.endTime).format('YYYY年MM月DD日')
            let surveyResutl = await surveyResultProxy.getOneByQuery({
                child: child._id,
                surveyMission: surveyMission._id,
                status: 1,
                type: 1
            })
            if (!surveyResutl) { //还没有开始检查
                tmp.surveyStatus = 1
                tmp.surveyStatusShow = CONSTANT.SURVEY_STATUS[1]
                returnResult.push(tmp)
            } else if (surveyResutl && surveyResutl.businessStatus == 2 && surveyMission.businessStatus == 3) {
                tmp.surveyStatus = 3
                tmp.surveyStatusShow = CONSTANT.SURVEY_STATUS[3]
                surveyResutl.businessStatus = 3
                await surveyResutl.save(surveyResutl)
                returnResult.push(tmp)
            } else {
                tmp.surveyStatus = surveyResutl.businessStatus
                tmp.surveyStatusShow = CONSTANT.SURVEY_STATUS[surveyResutl.businessStatus]
                returnResult.push(tmp)
            }
        }*/
    }
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = returnResultCurrent.concat(returnResultHistory)
    return await next()
}

async function deleteChild (ctx, next) {
    let params = {
        childId: ctx.request.body.childId,
        parentId: ctx.state.user._id
    }
    const schema = Joi.object().keys({
        childId: Joi.string().length(24).required(),
        parentId: Joi.string().length(24).required()
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = CONSTANT.weapp.survey.deleteChild[utils.getFiled(error.message)] || "参数不合法!"
        throw new Error("参数不合法!")
    }
    let child = await childProxy.getOneByQuery({ _id: value.childId, parentId: value.parentId, status: 1 })
    if (!child) {
        ctx.state.code = 4;
        ctx.state.message = "您未添加该宝贝!"
        ctx.state.data = {}
        return await next()
    }
    let index = child.parentId.indexOf(value.parentId)
    child.parentId.splice(index, 1)
    child.modifyAt = new Date()
    await childProxy.save(child)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    return await next()
}

async function getDoctorSurvey (ctx, next) {
    let user = ctx.state.user
    let now = new Date()
    //判断是否有医生身份
    let doctor = ctx.state.doctor
    if (!doctor) {
        ctx.state.code = 4;
        ctx.state.message = "您不是医生!"
        throw new Error('您不是医生!')
    }
    let returnResult = {
        notStart: [], //未开始
        doing: [], //进行中
        finish: [] //已完成
    }
    let surveys = await surveyMissionProxy.getByQueryPopulate({ doctorIds: doctor._id, status: 1 })
    for (let i = 0; i < surveys.length; i++) {
        let currentSurvey = surveys[i]
        let checkCount = await surveyResultProxy.countByQuery({
            result: { $elemMatch: { doctor: doctor._id } },
            surveyMission: currentSurvey._id
        })
        let tem = {
            surveyId: currentSurvey._id,
            schoolId: currentSurvey.schoolId._id,
            schoolName: currentSurvey.schoolId.schoolName,
            time: moment(currentSurvey.startTime).format('YYYY年MM月DD日') + ' - ' + moment(currentSurvey.endTime).format('YYYY年MM月DD日'),
            checkCount: checkCount
        }
        if (1 == currentSurvey.businessStatus) {
            if (now >= currentSurvey.startTime && now <= currentSurvey.endTime) {
                returnResult.doing.push(tem)
            } else {
                returnResult.notStart.push(tem)
            }
        } else if (2 == currentSurvey.businessStatus) {
            returnResult.doing.push(tem)
        } else {
            returnResult.finish.push(tem)
        }
    }
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = returnResult
    return await next()

}


async function getInterventionPlan (ctx, next) {

    let params = {
        child: ctx.params.childId,
        surveyMission: ctx.request.query.surveyMissionId,
    }
    const schema = Joi.object().keys({
        child: Joi.string().length(24).required(),
        surveyMission: Joi.string().length(24).required(),
    })
    let { error, value } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    let user = ctx.state.user //|| {phone: "13262796937", nickName: "Space X"}
    //let uid = "5ca496e6deaea140b4a5eecc"
    //let user = await userProxy.getById(uid)
    let child = await childProxy.getById(value.child)
    if (!child) {
        ctx.state.code = 4;
        ctx.state.message = "宝贝未添加!"
        throw new Error("宝贝未添加!")
    }

    let metadata = await metadataProxy.getOneByQuery({ number: "CURRENT_INTERVENTION", businessStatus: 2 })
    if (!metadata) {
        ctx.state.code = 4;
        ctx.state.message = "获取系统当期干预方案版本失败!"
        throw new Error(ctx.state.message)
    }
    let vid = metadata.content

    //-------------------处理体检结果   start--------------------//
    let returnCheckResult = []
    let checkresult = {}
    let surveyResultSaved = await surveyResultProxy.getOneByQueryPopulate({
        child: value.child,
        surveyMission: value.surveyMission
    })
    if (!surveyResultSaved) {
        ctx.state.code = 4;
        ctx.state.message = "检查结果未提交!"
        throw new Error("检查结果未提交!")
    }

    // 增加了核验功能，共用这个接口，但是，核验的时候不能更新检查结果的 BusinessStatus 因此，通过这个开关进行判断
    // 即，当普查任务未完成时，不能更新 BusinessStatus，如此，在核验的时候，便不会更新了
    const surveyMission = await surveyMissionProxy.getOneByQueryPopulate({ _id: value.surveyMission })
    if (!surveyMission) {
        ctx.state.code = 4;
        ctx.state.message = "没有对应的普查任务!"
        throw new Error("没有对应的普查任务!")
    }
    let isNeedUpdateSurveyResult = false;
    if (surveyMission.businessStatus === 3) {
        isNeedUpdateSurveyResult = true;
    }

    let resultObj = {}
    for (let i = 0; i < surveyResultSaved.result.length; i++) {
        let oneCheck = surveyResultSaved.result[i]
        checkresult[oneCheck.checkupTerm] = oneCheck.value
        let termObj = await checkupTermProxy.getOneByQueryPopulate({ _id: oneCheck.checkupTerm })
        if (!termObj) {
            continue;
        }
        if (!resultObj[termObj.name]) {
            resultObj[termObj.name] = []
        }
        resultObj[termObj.name].push({
            checkupTermName: termObj.name,
            checkupTermPart: termObj.part,
            value: oneCheck.value
        })
    }
    let resultArr = []
    for (let key in resultObj) {
        let left = 0.0;
        let right = 0.0;
        resultObj[key].forEach((s) => {
            if (s.checkupTermPart == 1) {
                left = s.value;
            }
            if (s.checkupTermPart == 2) {
                right = s.value;
            }
        })
        resultArr.push({
            checkupTermName: key,
            values: resultObj[key],
            left: left,
            right: right
        })
    }
    //-------------------处理体检结果   end--------------------//

    //-------------------处理专家意见，问卷结果   start---------//
    let finalInterventionPlan = []
    for (var key in checkresult) {
        checkresult[key] = new Number(checkresult[key].replace(/[^-^0-9^\.]/ig, ""));
    }
    if (surveyResultSaved.interventionIsMatched == 1) {//还没计算过
        let matchRule = await metadataProxy.getOneByQuery({ number: "MORE_INTERVENTION_DEALWITH", businessStatus: 2 })//匹配规则，匹配多个还是匹配一个
        if (!matchRule) {
            ctx.state.code = 4;
            ctx.state.message = "获取专家意见失败!"
            throw new Error(ctx.state.message)
        }
        let sortValue = 1
        if (matchRule.content == '2') {
            sortValue = -1
        }
        let interventionPlans = await interventionProxy.getByQuery({
            version: vid,
            status: 1
        }, "", { sort: { seq: sortValue } });

        //计算干预方案
        let matchedPlans = []
        let sandbox = {
            checkresult: checkresult,
            flag: false
        }
        vm.createContext(sandbox)
        for (let i = 0; i < interventionPlans.length; i++) {
            let item = interventionPlans[i]
            let code = 'flag = ' + item.visionRule + '(checkresult)'
            vm.runInContext(code, sandbox)
            if (sandbox.flag) {
                matchedPlans.push(item)
                if (matchRule.content != "3") {
                    break;
                }
            }
        }
        if (!matchedPlans.length) {
            surveyResultSaved.interventionIsMatched = 3
            // 取消待领取优惠券的状态，直接跳转到最后一个状态 @ begin
            // surveyResultSaved.businessStatus = 4
            surveyResultSaved.businessStatus = 5
            // 取消待领取优惠券的状态，直接跳转到最后一个状态 @ end
            if (isNeedUpdateSurveyResult) {
                surveyResultSaved = await surveyResultProxy.save(surveyResultSaved)
            }
        } else {
            let matchedInterventionIds = []
            let questionnaireStr = []
            for (let i = 0; i < matchedPlans.length; i++) {
                let oneIntervention = matchedPlans[i]
                let tmp = []
                matchedInterventionIds.push(oneIntervention._id)
                let questionnaireSelectedSaved = await questionnaireResultProxy.getOneByQuery({
                    child: value.child,
                    questionnaire: oneIntervention.questionnaire
                })
                if (!questionnaireSelectedSaved) {
                    questionnaireStr.push([])
                } else {
                    questionnaireSelectedSaved.select.forEach(function (one) {
                        let questionRule = JSON.parse(oneIntervention.questionnaireRule)
                        if (questionRule[one.subject.toString()] && questionRule[one.subject.toString()][one.value]) {
                            tmp.push(questionRule[one.subject][one.value])
                        }
                    })
                    questionnaireStr.push(tmp)
                }
                finalInterventionPlan.push({
                    intervention: oneIntervention.content,
                    questionnairePlan: tmp,
                })
            }
            surveyResultSaved.interventionIsMatched = 2
            surveyResultSaved.intervention = matchedInterventionIds
            surveyResultSaved.questionnaireStr = questionnaireStr
            // 取消待领取优惠券的状态，直接跳转到最后一个状态 @ begin
            // surveyResultSaved.businessStatus = 4
            surveyResultSaved.businessStatus = 5
            // 取消待领取优惠券的状态，直接跳转到最后一个状态 @ end
            if (isNeedUpdateSurveyResult) {
                surveyResultSaved = await surveyResultProxy.save(surveyResultSaved)
            }
        }
    } else {
        for (let i = 0; i < surveyResultSaved.intervention.length; i++) {
            finalInterventionPlan.push({
                intervention: surveyResultSaved.intervention[i].content,
                questionnairePlan: surveyResultSaved.questionnaireStr[i],
            })
        }
    }
    //-------------------处理专家意见，问卷结果   end----------//
    ctx.state.code = 1;
    ctx.state.message = "success!"

    const infoFromObjectId = stringUtil.getInfoFromObjectId(surveyResultSaved._id + "")
    const surveyResultId = surveyMission.schoolId.districtCode + "-" + moment(surveyResultSaved.createAt).format("YYYYMMDD") + "-" + infoFromObjectId.seq

    ctx.state.data = Object.assign({}, {
        surveyResultId: surveyResultId,
        time: moment(surveyResultSaved.createAt).format("YYYY年MM月DD日"),
        suggestion: finalInterventionPlan,
        checkResult: resultArr,
        parentName: user.nickName,
        parentPhone: user.phone,
        childName: child.name,
        checkupType: surveyResultSaved.type
    })
    return await next()

}

async function upload (filename, data) {
    filename = 'weapp/' + moment().format('YYYY/MM/DD') + '/' + filename
    let client = new OSS({
        region: config.aliyun.oss.region,
        accessKeyId: config.aliyun.oss.AccessKeyId,
        accessKeySecret: config.aliyun.oss.AccessKeySecret,
        bucket: config.aliyun.oss.bucket
    })
    let result = await client.putStream(filename, data);
    return result
}

async function childInfo (ctx, next) {
    let params = {
        childId: ctx.params.id
    }
    const schema = Joi.object().keys({
        childId: Joi.string().length(24).required()
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = CONSTANT.weapp.survey.childInfo[utils.getFiled(error.message)] || "参数不合法!"
        throw new Error("参数不合法!")
    }
    let child = await childProxy.getOneByQuery({ _id: value.childId, status: 1 })
    ctx.state.code = 4;
    ctx.state.message = "不存在的宝贝!"
    ctx.state.data = {}
    if (child) {
        ctx.state.code = 1;
        ctx.state.message = "success!"
        ctx.state.data = child
    }
    await next()
}

async function getCheckCount (ctx, next) {
    let params = {
        surveyId: ctx.request.query.surveyId
    }
    const schema = Joi.object().keys({
        surveyId: Joi.string().length(24).required()
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = CONSTANT.weapp.survey.deleteChild[utils.getFiled(error.message)] || "参数不合法!"
        throw new Error("参数不合法!")
    }
    let doctor = ctx.state.doctor //|| {_id:"5cbda3576cfac3104072757e"}
    if (!doctor) {
        ctx.state.code = 4;
        ctx.state.message = "您不具有医生身份!"
        ctx.state.data = {}
    }
    let checkCount = await surveyResultProxy.countByQuery({
        result: { $elemMatch: { doctor: doctor._id } },
        surveyMission: value.surveyId
    })
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {
        surveyId: value.surveyId,
        checkCount: checkCount
    }
    await next()
}

module.exports = {
    addChildren,
    createFeedback,
    getSurveyMission,
    getDoctorSurvey,
    getInterventionPlan,
    deleteChild,
    childInfo,
    getCheckCount
}