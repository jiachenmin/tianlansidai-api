const Joi = require('joi');
const RoomPersonModel = require('../../models/room_person.js')

async function createRoomPerson(ctx, next) {
  
    let roomId = ctx.request.body.roomId
    let personName = ctx.request.body.personName 
    let phone = ctx.request.body.phone 

    const schema = Joi.object().keys({
        roomId: Joi.string().length(24).required(),
        personName: Joi.string().min(2).max(20).required(),
        phone: Joi.string().regex(/^1[3|4|5|7|8][0-9]{9}$/),
    });

    const {error, value} = Joi.validate({
        roomId: roomId,
        personName: personName,
        phone: phone,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let roomPerson = await RoomPersonModel.save({
        roomId: value.roomId,
        personName: value.personName,
        phone: value.phone,
    })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        roomPerson: roomPerson
    })
    
    await next()
}

async function deleteRoomPerson(ctx, next) {

    let roomPersonId = ctx.params.id

    const schema = Joi.object().keys({
        roomPersonId: Joi.string().length(24),
    });

    const {error, value} = Joi.validate({
        roomPersonId: roomPersonId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let roomPerson = await RoomPersonModel.getOneByQuery({_id: value.roomPersonId})

    await RoomPersonModel.updateOne({_id: value.roomPersonId}, {
        $set: {
            status: -1,
            deletedPhone: roomPerson.phone,
        },
        $unset: {
            phone: 1
        }
    })

    ctx.state.code = 1
    ctx.state.message = "删除成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {
    })
    await next()
}


async function modifyRoomPerson(ctx, next) {

    let roomPersonId = ctx.params.id;
    let roomId = ctx.request.body.roomId
    let personName = ctx.request.body.personName 
    let phone = ctx.request.body.phone 

    const schema = Joi.object().keys({
        roomPersonId: Joi.string().length(24).required(),
        roomId: Joi.string().length(24).required(),
        personName: Joi.string().min(2).max(20).required(),
        phone: Joi.string().regex(/^1[3|4|5|7|8][0-9]{9}$/),
    });

    const {error, value} = Joi.validate({
        roomPersonId: roomPersonId,
        roomId: roomId,
        personName: personName,
        phone: phone,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let roomPerson = await RoomPersonModel.getById({ _id: value.roomPersonId, status: 1 })
    if (roomPerson == null) {
        ctx.state.code = 4
        ctx.state.message = "记录不存在"
        throw new Error(ctx.state.message)
    }

    await RoomPersonModel.update({_id: value.roomPersonId}, {
        $set: {
            roomId: value.roomId,
            personName: value.personName,
            phone: value.phone,
        }
    }, {})

    ctx.state.code = 1
    ctx.state.message = "更新成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {
    })
    await next()
}

async function findRoomPerson(ctx, next) {

    let roomPersonId = ctx.params.id;

    const schema = Joi.object().keys({
        roomPersonId: Joi.string().length(24).required(),
    });

    const {error, value} = Joi.validate({
        roomPersonId: roomPersonId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let roomPerson = await RoomPersonModel.getOneByQuery({_id: value.roomPersonId, status: 1}, '', {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        roomPerson: roomPerson
    })
    
    await next()
}

async function findRoomPersons(ctx, next) {

    let roomId = ctx.query.roomId
    let count = ctx.query.count
    let page = ctx.query.page

    const schema = Joi.object().keys({
        roomId: Joi.string().length(24).required(),
        count: Joi.number().default(10).min(10).max(100).required(),
        page: Joi.number().default(1).min(1).max(100).required(),
    });

    const { error, value } = Joi.validate({
        roomId: roomId,
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
        sort: { personName: 1 }
    }

    let query = {
        roomId: value.roomId,
        status: 1,
    }
    let roomPersons = await RoomPersonModel.getByQuery(query, '', opt)
    let total = await RoomPersonModel.countByQuery(query)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        roomPersons: roomPersons || [],
        total: total,
    })
    await next()
}

async function searchRoomPersons(ctx, next) {
    
    let keywords = ctx.query.keywords
    let count = ctx.query.count
    let page = ctx.query.page

    const schema = Joi.object().keys({
        count: Joi.number().default(10).min(10).max(100).required(),
        page: Joi.number().default(1).min(1).max(100).required(),
    });

    const { error, value } = Joi.validate({
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
        sort: { _id: -1 }
    }

    let roomPersons = await RoomPersonModel.getByQuery({
        personName: new RegExp(keywords, 'ig') 
    }, '', opt)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        roomPersons: roomPersons || []
    })
    await next()
}

module.exports = { createRoomPerson, deleteRoomPerson, modifyRoomPerson, findRoomPerson, findRoomPersons, searchRoomPersons }