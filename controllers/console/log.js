const Joi = require('joi')
const SLS = require('../../common/sls.js')
const moment = require('moment')
const config = require('../../config.js')

async function getLogs(ctx, next){
  
    let from = ctx.query.from
    let to = ctx.query.to
    let query = ctx.query.query

    const schema = Joi.object().keys({
        from: Joi.date().timestamp().required(),
        to: Joi.date().timestamp().required(),
    });

    const { error, value } = Joi.validate({
        from: from,
        to: to
    }, schema);
  
    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }
   
    let projectName = config.aliyun.log.project
    let logstoreName = config.aliyun.log.logstore
    console.log(value.from, value.to)
    let logs = await SLS.getLogs({
        projectName: projectName, 
        logstoreName: logstoreName, 
        from: value.from, 
        to: value.to,
        reverse: true,
        query: query,
    })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        logs: logs || []
    })
    await next()
}

module.exports = {
    getLogs,
}

