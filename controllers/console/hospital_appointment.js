const Joi = require('joi');
const HospitalAppointmentModel = require('../../models/hospital_appointment.js')
const mongoose = require("mongoose")

async function findById (ctx, next) {
    let hospitalAppointmentId = ctx.params.id;

    const schema = Joi.object().keys({
        hospitalAppointmentId: Joi.string().length(24).required(),
    });

    const { error, value } = Joi.validate({
        hospitalAppointmentId: hospitalAppointmentId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let hospitalAppointment = await HospitalAppointmentModel.getOneByQuery({ _id: value.hospitalAppointmentId, status: 1 }, '', {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        hospitalAppointment: hospitalAppointment
    })

    await next()
}

async function listByHospitalId (ctx, next) {
    // 1.获取参数
    const params = {
        hospitalId: ctx.request.body.hospitalId,
        count: ctx.request.body.count,
        page: ctx.request.body.page,
        appointedDateGte: ctx.request.body.appointedDateGte,
        appointedDateLte: ctx.request.body.appointedDateLte,
        schoolId: ctx.request.body.schoolId || "",
        gradeName: ctx.request.body.gradeName || "",
        className: ctx.request.body.className || "",
    }
    const schema = Joi.object().keys({
        hospitalId: Joi.string().length(24).required(),
        count: Joi.number().default(10).min(10).max(100).required(),
        page: Joi.number().default(1).min(1).max(100).required(),
        appointedDateGte: Joi.date().timestamp(),
        appointedDateLte: Joi.date().timestamp(),
        schoolId: Joi.string().length(24).allow(""),
        gradeName: Joi.string().allow(""),
        className: Joi.string().allow(""),
    });

    const { error, value } = Joi.validate(params, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let query = { hospitalId: mongoose.Types.ObjectId(value.hospitalId), status: 1 }
    if (value.appointedDateGte) {
        if (!query["appointedDate"]) query["appointedDate"] = {}
        query["appointedDate"]["$gte"] = value.appointedDateGte
    }
    if (value.appointedDateLte) {
        if (!query["appointedDate"]) query["appointedDate"] = {}
        query["appointedDate"]["$lte"] = value.appointedDateLte
    }
    if (value.schoolId) query["schoolId"] = mongoose.Types.ObjectId(value.schoolId)
    if (value.gradeName) query["gradeName"] = value.gradeName
    if (value.className) query["className"] = value.className

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

async function listByKeyword (ctx, next) {
    let searchBy = ctx.query.searchBy
    let keyword = ctx.query.keyword
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

    let query = { [searchBy]: new RegExp(keyword, 'ig') }
    let opt = { limit: value.count, skip: (value.page - 1) * value.count, sort: { _id: -1 } }

    let hospitalAppointments = await HospitalAppointmentModel.getByQuery(query, '', opt)
    let total = await HospitalAppointmentModel.countByQuery(query)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        list: hospitalAppointments || [],
        total: total,
    })
    await next()
}

module.exports = { findById, listByHospitalId, listByKeyword }