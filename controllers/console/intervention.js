const interventionVersionProxy = require('../../models/intervention_version.js')
const interventionProxy = require('../../models/intervention.js')
const subjectProxy = require("../../models/subject.js")
const Joi = require('joi')

async function createInterventionVersion(ctx, next) {
    let params = {
        name: ctx.request.query.name,
        number: ctx.request.query.number,
        memo: ctx.request.query.memo
    }
    const schema = Joi.object().keys({
        name: Joi.string().required(),
        number: Joi.string().default(""),
        memo: Joi.string().default("")
    })
    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    let result = await interventionVersionProxy.save(value)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = result
    return await next()
}

async function deleteInterventionVersion(ctx, next) {
    let id = ctx.params.id
    let {error, value} = Joi.validate({
        id
    }, {
        id: Joi.string().length(24).required()
    })
    let result = await interventionVersionProxy.delete({_id: id})
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    await next()
}

async function modifyInterventionVersion(ctx, next) {
    let params = {
        id: ctx.params.id,
        name: ctx.request.body.name,
        number: ctx.request.body.number,
        memo: ctx.request.body.memo,
        status: ctx.request.body.status,
    }
    const schema = Joi.object().keys({
        id: Joi.string().length(24).required(),
        name: Joi.string().required(),
        number: Joi.string().default(""),
        memo: Joi.string().default(""),
        status: Joi.number().integer().valid(2, 3).required(),
    })
    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    let result = await interventionVersionProxy.updateOne({_id: value.id}, {
        $set: {
            name: value.name,
            number: value.number,
            memo: value.memo,
            businessStatus: value.status,
        }
    })
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    await next()
}

async function createIntervention(ctx, next) {
    let params = {
        version: ctx.request.body.version,
        seq: ctx.request.body.seq,
        number: ctx.request.body.number,
        content: ctx.request.body.content,
        visionRule: ctx.request.body.visionRule,
        questionnaireRule: ctx.request.body.questionnaireRule,
        questionnaire: ctx.request.body.questionnaireId,
        memo: ctx.request.body.memo
    }
    let schemaObj = {
        version: Joi.string().length(24).required(),
        seq: Joi.number().required(),
        number: Joi.string().allow("").default(""),
        content: Joi.string().allow("").default(""),
        visionRule: Joi.string().required(),
        questionnaireRule: Joi.string().required(),
        questionnaire: Joi.string().length(24).required(),
        memo: Joi.string().allow("").default("")
    }
    if(ctx.request.body.interventionId){
        params.interventionId = ctx.request.body.interventionId
        params.businessStatus = ctx.request.body.businessStatus
        schemaObj.interventionId = Joi.string().length(24).required()
        schemaObj.businessStatus = Joi.number().valid(2,3).required()
    }
    const schema = Joi.object().keys(schemaObj)
    /*
    * questionnaireRule
    * {
    *   subjectId:{
    *       A:"sdfsdf",
    *       B:"sdfsdfsdf",
    *       C:"sdfsdfsdf"
    *   }
    * }
    * */
    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    if(value.interventionId){
        let interventionSaved = await  interventionProxy.getById(value.interventionId)
        if(!interventionSaved){
            ctx.state.code = 4;
            ctx.state.message = "不存的干预方案!"
            ctx.state.data = {}
            return await next()
        }
        interventionSaved.version = value.version
        interventionSaved.seq = value.seq
        interventionSaved.number = value.number
        interventionSaved.content = value.content
        interventionSaved.visionRule = value.visionRule
        interventionSaved.questionnaireRule = value.questionnaireRule
        interventionSaved.questionnaire = value.questionnaire
        interventionSaved.memo = value.memo
        interventionSaved.businessStatus = value.businessStatus
        interventionSaved.modifyAt = new Date()
        interventionSaved = await interventionProxy.save(interventionSaved)
        ctx.state.code = 1;
        ctx.state.message = "success!"
        ctx.state.data = interventionSaved
        return await next()
    }
    let result = await interventionProxy.save(value)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = result
    return await next()
}


//微信端获取
async function createInterventionPlan(ctx, next) {

    let params = {
        uid: ctx.params.uid,
        vid: ctx.request.query.vid
    }
    const schema = Joi.object().keys({
        uid: Joi.string().length(24).required,
        vid: Joi.string().length(24).required
    })
    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    /*
    获取用户体检结果
    {
        XXX:2,
        xxxx:3,
        xxas:1
    }
    */
    let checkresult = {}

    let interventionPlans = await interventionProxy.getByQuery({version: value.vid, status: 1});
    //计算干预方案
    let iPlans = {}
    interventionPlans.some(function (item) {
        if (eval(item.visionRule)(checkresult)) {
            iPlans = item
            return true
        }
    })
    //根据干预方案获取调查问卷题目
    let subjects = await subjectProxy.getByQuery({qid: iPlans.questionnaire, status: 1}, {}, {sort: {sid: 1}})

    let questionnaireSelected = {}
    /*
    获取用户调查问卷结果
    {
        XXX:'A',
        xxxx:'B',
        xxas:'C'
    }
    */
    //let rule = eval("(function(){return function(obj){return obj.sd > 0}})()")
    //console.log(rule(o))
    let questionnaireResult = []//{_id:sdfsdf,selected:A,suggestion:ssssssss}
    subjects.forEach(function (one, index) {
        questionnaireResult.push(Object.assign({}, one, {
            selected: questionnaireSelected[one._id],
            suggestion: iPlans[one._id][questionnaireSelected[one._id]]
        }))
    })
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = Object.assign(iPlans, {quertionnairePlan: questionnaireResult})
    return await next()

}

async function getInterventions(ctx, next) {
    let params = {
        vid: ctx.request.query.vid,
        keyWord: ctx.request.query.keyWord,
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum
    }

    const schema = Joi.object().keys({
        vid: Joi.string().length(24),
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

    let queryStr = {status: 1}
    if (params.vid) {
        queryStr.version = params.vid
    }
    if (params.keyWord) {
        queryStr.number = new RegExp(params.keyWord, 'ig')
    }

    let result = await interventionProxy.getByQuery(queryStr, {}, {
        sort: {seq: 1},
        skip: skipCount,
        limit: params.pageSize
    })
    let count = await interventionProxy.countByQuery(queryStr)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, {total: count, list: result})
    return await next()
}

async function getInterventionVersion(ctx, next) {
    let result = await interventionVersionProxy.getByQuery({status: 1}, {}, {
        sort: {createAt: 1}
    })
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = result
    await next()
}

async function deleteIntervention(ctx, next) {
    let id = ctx.params.id
    let {error, value} = Joi.validate({
        id
    }, {
        id: Joi.string().length(24).required()
    })
    let result = await interventionProxy.delete({_id: id})
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    await next()
}

async function modifyIntervention(ctx, next) {
    let params = {
        id: ctx.params.id,
        status: ctx.request.body.status
    }
    const schema = Joi.object().keys({
        id: Joi.string().length(24).required(),
        status: Joi.number().integer().valid(2, 3).required(),
    })
    let {error, value} = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    let result = await interventionProxy.updateOne({_id: value.id}, {$set: {businessStatus: value.status}})
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    await next()
}

module.exports = {
    createInterventionVersion,
    getInterventionVersion,
    createIntervention,
    getInterventions,
    deleteIntervention,
    modifyIntervention,
    deleteInterventionVersion,
    modifyInterventionVersion,
}
