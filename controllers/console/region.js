const Joi = require("joi")
const regionModel = require('../../models/region.js');

async function findRegions(ctx, next) {

    let parentCode = ctx.query.parentCode
    if (!parentCode) {
        parentCode = '86'
    }
    let query = {
        parentCode,
    }
    let open = ctx.query.open || false
    if(open) {
        query.open = true
    }
    let result = await regionModel.getByQuery(query, 'parentCode regionName regionCode open', { sort:{regionCode: 1}})
    ctx.state.code = 1;
    ctx.state.message = "ok!"
    ctx.state.data = {
        regions: result
    }
    return await next()
}

module.exports = {
    findRegions
}