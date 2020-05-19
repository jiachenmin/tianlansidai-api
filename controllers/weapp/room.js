const childProxy = require('../../models/child')
const roomProxy = require('../../models/room')
const Joi = require('joi')
async function roomList(ctx, next) {
    let params = {
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum
    }

    const schema = Joi.object().keys({
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
    let user = ctx.state.user
    let children = await childProxy.getByQueryPopulate({parentId: user._id, status: 1})
    if (!children.length) {
        ctx.state.code = 4;
        ctx.state.message = "请先添加宝贝!"
        throw new Error("请先添加宝贝!")
    }
    let cityCodes = []
    children.forEach(function (one) {
        cityCodes.push(one.schoolId.cityCode)
    })
    let rooms = await roomProxy.getByQuery({cityCode: {$in: cityCodes}, status: 1}, {}, {
        sort: {cityCode: -1},
        skip: skipCount,
        limit: value.pageSize
    })
    let total = await roomProxy.countByQuery({cityCode: {$in: cityCodes}, status: 1})
    let toReturn = []
    rooms.forEach(function (one) {
        toReturn.push({
            _id: one._id,
            name: one.roomName,
            address: one.address,
            phone: one.phone,
            businessTime: one.businessTime,
            location: one.location
        })
    })
    ctx.state.code = 1
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, {
        rooms: toReturn,
        total: total
    })
    await next()
}

module.exports = {roomList}