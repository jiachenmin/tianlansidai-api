const Joi = require('joi');
const RoomModel = require('../../models/room.js')

async function createRoom(ctx, next) {

    let params = {
        territoryId: ctx.state.territoryId,
        areaId: ctx.request.body.areaId,
        provinceName: ctx.request.body.provinceName,
        provinceCode: ctx.request.body.provinceCode,
        cityName: ctx.request.body.cityName,
        cityCode: ctx.request.body.cityCode,
        districtName: ctx.request.body.districtName,
        districtCode: ctx.request.body.districtCode,
        roomName: ctx.request.body.roomName,
        roomCode: ctx.request.body.roomCode,
        longitude: ctx.request.body.longitude,
        latitude: ctx.request.body.latitude,
        phone: ctx.request.body.phone,
        businessTime: ctx.request.body.businessTime
    }
    let roomId = ctx.request.body.roomId || ""
    let schemaObj = {
        territoryId: Joi.string().length(24).required(),
        areaId: Joi.string().length(24).required(),
        provinceName: Joi.string().min(2).max(20).required(),
        provinceCode: Joi.string().min(2).max(20).required(),
        cityName: Joi.string().min(2).max(20).required(),
        cityCode: Joi.string().min(2).max(20).required(),
        districtName: Joi.string().min(2).max(10).required(),
        districtCode: Joi.string().min(2).max(10).required(),
        roomName: Joi.string().min(2).max(30).required(),
        roomCode: Joi.string().min(2).max(10).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        latitude: Joi.number().min(-180).max(180).required(),
        businessTime: Joi.string().required(),
        phone: Joi.string().required()
    }
    if (roomId.trim()) {
        params.roomId = roomId.trim()
        schemaObj.roomId = Joi.string().length(24).required()
    }
    const schema = Joi.object().keys(schemaObj);

    const {error, value} = Joi.validate(params, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }
    if (value.roomId) {
        let room = await RoomModel.getById(value.roomId)
        if (!room) {
            ctx.state.code = 4
            ctx.state.message = "不存在的小屋！"
            ctx.data = {}
            await next()
            return
        }
        room.territoryId = value.territoryId
        room.areaId = value.areaId
        room.provinceName = value.provinceName
        room.provinceCode = value.provinceCode
        room.cityName = value.cityName
        room.cityCode = value.cityCode
        room.districtName = value.districtName
        room.districtCode = value.districtCode
        room.roomName = value.roomName
        room.roomCode = value.roomCode
        room.location.coordinates = [value.longitude,value.latitude]
        room.phone = value.phone
        room.businessTime = value.businessTime
        room.modifyAt = new Date()
        room = await RoomModel.save(room)
        ctx.state.code = 1
        ctx.state.message = "修改成功！"
        ctx.data = Object.assign({}, ctx.state.data, {
            room: room
        })
        await next()
        return
    }

    let room = await RoomModel.save({
        territoryId: value.territoryId,
        areaId: value.areaId,
        provinceName: value.provinceName,
        provinceCode: value.provinceCode,
        cityName: value.cityName,
        cityCode: value.cityCode,
        districtName: value.districtName,
        districtCode: value.districtCode,
        roomName: value.roomName,
        roomCode: value.roomCode,
        location: {
            type: "Point",
            coordinates: [value.longitude, value.latitude],
        },
        phone : value.phone,
        businessTime : value.businessTime
    })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        room: room
    })

    await next()
}

async function deleteRoom(ctx, next) {

    let roomId = ctx.params.id

    const schema = Joi.object().keys({
        roomId: Joi.string().length(24).required(),
    });

    const {error, value} = Joi.validate({
        roomId: roomId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    await RoomModel.delete({_id: value.roomId})

    ctx.state.code = 1
    ctx.state.message = "删除成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {})
    await next()
}


async function modifyRoom(ctx, next) {

    let roomId = ctx.params.id
    let areaId = ctx.request.body.areaId
    let provinceName = ctx.request.body.provinceName
    let provinceCode = ctx.request.body.provinceCode
    let cityName = ctx.request.body.cityName
    let cityCode = ctx.request.body.cityCode
    let districtName = ctx.request.body.districtName
    let districtCode = ctx.request.body.districtCode
    let roomName = ctx.request.body.roomName
    let roomCode = ctx.request.body.roomCode
    let longitude = ctx.request.body.longitude
    let latitude = ctx.request.body.latitude
	let phone = ctx.request.body.phone
    let businessTime = ctx.request.body.businessTime

    const schema = Joi.object().keys({
        roomId: Joi.string().length(24).required(),
        areaId: Joi.string().length(24).required(),
        provinceName: Joi.string().min(2).max(20).required(),
        provinceCode: Joi.string().min(2).max(20).required(),
        cityName: Joi.string().min(2).max(20).required(),
        cityCode: Joi.string().min(2).max(20).required(),
        districtName: Joi.string().min(2).max(10).required(),
        districtCode: Joi.string().min(2).max(10).required(),
        roomName: Joi.string().min(2).max(30).required(),
        roomCode: Joi.string().min(2).max(10).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        latitude: Joi.number().min(-180).max(180).required(),
		businessTime: Joi.string().required(),
        phone: Joi.string().required()
    });

    const {error, value} = Joi.validate({
        roomId: roomId,
        areaId: areaId,
        provinceName: provinceName,
        provinceCode: provinceCode,
        cityName: cityName,
        cityCode: cityCode,
        districtName: districtName,
        districtCode: districtCode,
        roomName: roomName,
        roomCode: roomCode,
        longitude: longitude,
        latitude: latitude,
		phone: phone,
		businessTime: businessTime
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let room = await RoomModel.getById({_id: value.roomId, status: 1})
    if (room == null) {
        ctx.state.code = 4
        ctx.state.message = "记录不存在"
        throw new Error(ctx.state.message)
    }

    await RoomModel.updateOne({_id: value.roomId}, {
        $set: {
            areaId: value.areaId,
            provinceName: value.provinceName,
            provinceCode: value.provinceCode,
            cityName: value.cityName,
            cityCode: value.cityCode,
            districtName: districtName,
            districtCode: districtCode,
            roomName: value.roomName,
            roomCode: value.roomCode,
            location: {
                type: "Point",
                coordinates: [longitude, latitude],
            },
			phone: phone,
			businessTime: businessTime
        }
    }, {})

    ctx.state.code = 1
    ctx.state.message = "更新成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {})
    await next()
}

async function findRoom(ctx, next) {

    let roomId = ctx.params.id;

    const schema = Joi.object().keys({
        roomId: Joi.string().length(24),
    });

    const {error, value} = Joi.validate({
        roomId: roomId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let room = await RoomModel.getOneByQuery({_id: value.roomId, status: 1}, '', {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        room: room
    })

    await next()
}

async function findRooms(ctx, next) {

    let areaId = ctx.query.areaId
    let count = ctx.query.count
    let page = ctx.query.page

    const schema = Joi.object().keys({
        areaId: Joi.string().length(24).required(),
        count: Joi.number().default(10).min(10).max(100).required(),
        page: Joi.number().default(1).min(1).max(100).required(),
    });

    const {error, value} = Joi.validate({
        areaId: areaId,
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
        sort: {roomName: 1}
    }

    let query = {
        areaId: value.areaId,
        status: 1
    }
    let rooms = await RoomModel.getByQuery(query, '', opt)
    let total = await RoomModel.countByQuery(query)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        rooms: rooms || [],
        total: total
    })
    await next()
}

async function searchRooms(ctx, next) {

    let keywords = ctx.query.keywords
    let count = ctx.query.count
    let page = ctx.query.page

    const schema = Joi.object().keys({
        count: Joi.number().default(10).min(10).max(100).required(),
        page: Joi.number().default(1).min(1).max(100).required(),
    });

    const {error, value} = Joi.validate({
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
        sort: {seq: 1}
    }

    let rooms = await RoomModel.getByQuery({
        roomName: new RegExp(keywords, 'ig')
    }, '', opt)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        rooms: rooms || []
    })
    await next()
}

module.exports = {createRoom, deleteRoom, modifyRoom, findRoom, findRooms, searchRooms}