const Joi = require('joi');
const HospitalModel = require('../../models/hospital.js')
const redis = require('../../models/index.js').redisConn
const moment = require('moment')
const HospitalAppointmentModel = require('../../models/hospital_appointment')
const mongoose = require("mongoose")

// 根据内容code获取内容信息
async function getHospitalByCode (ctx, next) {
    const schema = Joi.object().keys({
        code: Joi.string().required(),
    });
    const { error, value } = Joi.validate({
        code: ctx.request.query.code,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let hospital = await HospitalModel.getOneByQuery({ hospitalCode: value.code, status: 1 }, '', {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        hospital: hospital
    })

    await next()
}

// 根据内容code获取内容信息
async function listHospitalAppointmentStatistics (ctx, next) {
    let params = {
        hospitalId: ctx.request.query.hospitalId,
        appointedDate: ctx.request.query.appointedDate
    }
    const schema = Joi.object().keys({
        hospitalId: Joi.string().length(24).required(),
        appointedDate: Joi.date().timestamp().required()
    })
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }

    let hospital = await HospitalModel.getOneByQuery({ _id: value.hospitalId, status: 1 }, '', {})
    if (!hospital) {
        ctx.state.code = 4;
        ctx.state.message = "没有找到对应的医院!"
        return await next()
    }
    const str4AppointedDateUTC8 = moment(value.appointedDate).utc(8).format("YYYY-MM-DD")
    let query = {
        hospitalId: value.hospitalId, status: 1,
        appointedDate: {
            $gte: moment(str4AppointedDateUTC8 + " 00:00:00").utc().format(),
            $lte: moment(str4AppointedDateUTC8 + " 23:59:59").utc().format()
        }
    }
    let hospitalAppointments = await HospitalAppointmentModel.getByQuery(query)
    let businessTimeStatistics = hospital.businessTime
    const hospitalTimer = Object.keys(businessTimeStatistics)

    hospitalAppointments.forEach(doc => {
        const appointedTime = doc['appointedTime']
        if (hospitalTimer.indexOf(appointedTime) < 0) return
        businessTimeStatistics[appointedTime] = businessTimeStatistics[appointedTime] - 1
        if (businessTimeStatistics[appointedTime] < 0) {
            businessTimeStatistics[appointedTime] = 0
        }
    });
    let allDayFreeAppointmentCount = 0
    Object.keys(businessTimeStatistics).forEach(key => {
        allDayFreeAppointmentCount += businessTimeStatistics[key]
    })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        businessTimeStatistics: businessTimeStatistics,
        allDayFreeAppointmentCount: allDayFreeAppointmentCount
    })

    await next()
}
// 提交预约
async function createHospitalAppointment (ctx, next) {
    let params = {
        hospitalId: ctx.request.body.hospitalId,
        appointedDate: ctx.request.body.appointedDate,
        appointedTime: ctx.request.body.appointedTime,
        phone: ctx.request.body.phone,
        childName: ctx.request.body.childName,
        childGender: ctx.request.body.childGender,
        childIdentityCard: ctx.request.body.childIdentityCard,
        schoolId: ctx.request.body.schoolId,
        gradeName: ctx.request.body.gradeName,
        className: ctx.request.body.className,
        memo: ctx.request.body.memo,
    }
    let schemaObj = {
        hospitalId: Joi.string().length(24).required(),
        appointedDate: Joi.date().timestamp().required(),
        appointedTime: Joi.string().required(),
        phone: Joi.string().regex(/^1[3|4|5|7|8][0-9]{9}$/),
        schoolId: Joi.string().length(24).required(),
        childName: Joi.string().required(),
        childGender: Joi.number().valid(1, 2).required(),
        childIdentityCard: Joi.string().allow("").regex(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/),
        gradeName: Joi.string().allow("").default(""),
        className: Joi.string().allow("").default(""),
        memo: Joi.string().allow("").default(""),
    }
    const schema = Joi.object().keys(schemaObj)
    let { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }

    let hospital = await HospitalModel.getOneByQuery({ _id: value.hospitalId, status: 1 }, '', {})
    if (!hospital) {
        ctx.state.code = 4;
        ctx.state.message = "没有找到对应的医院!"
        return await next()
    }
    const limit = hospital.businessTime[value.appointedTime];
    let total = await HospitalAppointmentModel.countByQuery({
        hospitalId: value.hospitalId,
        appointedDate: value.appointedDate,
        appointedTime: value.appointedTime,
        status: 1
    })
    if (total >= limit) {
        ctx.state.code = 4;
        ctx.state.message = "预约已满!"
        return await next()
    }

    const redisCountKey = `${value.hospitalId}-${value.appointedDate}-${value.appointedTime}`
    const redisCount = await redis.incr(redisCountKey)
    const expireSeconds = moment(value.appointedDate).diff(moment().add(1, 'd'), "second")
    redis.expire(redisCountKey, expireSeconds)
    if (redisCount > limit) {
        ctx.state.code = 4;
        ctx.state.message = "预约已满!"
        return await next()
    }

    const str4AppointedDateUTC8 = moment(value.appointedDate).utc(8).format("YYYY-MM-DD")
    const queryStr = {
        hospitalId: mongoose.Types.ObjectId(value.hospitalId),
        phone: value.phone,
        schoolId: mongoose.Types.ObjectId(value.schoolId),
        childName: value.childName,
        childGender: value.childGender,
        childIdentityCard: value.childIdentityCard ? value.childIdentityCard : "",
        gradeName: value.gradeName ? value.gradeName : "",
        className: value.className ? value.className : "",
        status: 1,
        appointedDate: {
            $gte: moment(str4AppointedDateUTC8 + " 00:00:00").utc().format(),
            $lte: moment(str4AppointedDateUTC8 + " 23:59:59").utc().format()
        }
    }
    let obj = await HospitalAppointmentModel.getOneByQuery(queryStr)
    let savedObj = null
    if (obj) {
        obj.appointedDate = value.appointedDate
        obj.appointedTime = value.appointedTime
        obj.modifyAt = new Date()
        obj.memo = value.memo ? value.memo : ""
        savedObj = await HospitalAppointmentModel.save(obj)
    } else {
        savedObj = await HospitalAppointmentModel.save({
            hospitalId: value.hospitalId,
            phone: value.phone,
            schoolId: value.schoolId,
            childName: value.childName,
            childGender: value.childGender,
            childIdentityCard: value.childIdentityCard,
            gradeName: value.gradeName,
            className: value.className,
            status: 1,
            appointedDate: value.appointedDate,
            appointedTime: value.appointedTime,
            memo: value.memo ? value.memo : "",
        })
    }

    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = savedObj
    return await next()
}

// 基于手机号获取预约情况
async function listHospitalAppointmentByPhone (ctx, next) {
    let params = {
        phone: ctx.request.query.phone,
    }
    let schemaObj = {
        phone: Joi.string().regex(/^1[3|4|5|7|8][0-9]{9}$/),
    }
    const schema = Joi.object().keys(schemaObj)
    const { value, error } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }

    const query = { phone: value.phone, status: 1, appointedDate: { $gte: new Date() } }
    const hospitalAppointments = await HospitalAppointmentModel.getByQueryPopulate(query)
    const total = await HospitalAppointmentModel.countByQuery(query)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        list: hospitalAppointments || [],
        total: total,
    })
    return await next()
}

// 获取该医院的所有申请
async function listHospitalAppointmentByHospitalCode (ctx, next) {

    const schema = Joi.object().keys({
        hospitalCode: Joi.string().required(),
        count: Joi.number().default(10).min(10).max(100).required(),
        page: Joi.number().default(1).min(1).max(100).required(),
    });

    const { error, value } = Joi.validate({
        hospitalCode: ctx.query.hospitalCode,
        count: ctx.query.count,
        page: ctx.query.page
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let hospital = await HospitalModel.getOneByQuery({ hospitalCode: value.hospitalCode, status: 1 }, '', {})
    if (!hospital) {
        ctx.state.code = 4
        ctx.state.message = "没有找到该标识对应的医院"
        return await next()
    }

    let query = { hospitalId: hospital._id, status: 1 }
    let opt = { limit: value.count, skip: (value.page - 1) * value.count, sort: { createAt: 1 } }
    let hospitalAppointments = await HospitalAppointmentModel.getByQueryPopulate(query, '', opt)
    let total = await HospitalAppointmentModel.countByQuery(query)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        list: hospitalAppointments || [],
        total: total,
    })
    await next()
}
module.exports = {
    getHospitalByCode,
    listHospitalAppointmentStatistics,
    createHospitalAppointment,
    listHospitalAppointmentByPhone,
    listHospitalAppointmentByHospitalCode
}