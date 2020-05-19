const Joi = require('joi');
const DoctorModel = require('../../models/doctor.js')

async function createDoctor(ctx, next) {
  
    let territoryId = ctx.state.territoryId
    let areaId = ctx.request.body.areaId
    let provinceName = ctx.request.body.provinceName
    let provinceCode = ctx.request.body.provinceCode
    let cityName = ctx.request.body.cityName
    let cityCode = ctx.request.body.cityCode
    let districtName = ctx.request.body.districtName
    let districtCode = ctx.request.body.districtCode
    let doctorName = ctx.request.body.doctorName
    let phone = ctx.request.body.phone

    const schema = Joi.object().keys({
        territoryId: Joi.string().length(24).required(),
        areaId: Joi.string().length(24).required(),
        provinceName: Joi.string().min(2).max(20).required(),
        provinceCode: Joi.string().min(2).max(20).required(),
        cityName: Joi.string().min(2).max(20).required(),
        cityCode: Joi.string().min(2).max(20).required(),
        districtName: Joi.string().min(2).max(10).required(),
        districtCode: Joi.string().min(2).max(10).required(),
        doctorName: Joi.string().min(2).max(30).required(),
        phone: Joi.string().regex(/^1[3|4|5|7|8][0-9]{9}$/).required(),
      
    });

    const {error, value} = Joi.validate({
        territoryId: territoryId,
        areaId: areaId,
        provinceName: provinceName,
        provinceCode: provinceCode,
        cityName: cityName,
        cityCode: cityCode,
        districtName: districtName,
        districtCode: districtCode,
        doctorName: doctorName,
        phone: phone,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let doctor = await DoctorModel.save({
        territoryId: territoryId,
        areaId: value.areaId,
        provinceName: value.provinceName,
        provinceCode: value.provinceCode,
        cityName: value.cityName,
        cityCode: value.cityCode,
        districtName: districtName,
        districtCode: districtCode,
        doctorName: value.doctorName,
        phone: value.phone,
    })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        doctor: doctor
    })
    
    await next()
}

async function deleteDoctor(ctx, next) {

    let doctorId = ctx.params.id

    const schema = Joi.object().keys({
        doctorId: Joi.string().length(24).required(),
    });

    const {error, value} = Joi.validate({
        doctorId: doctorId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let doctor = await DoctorModel.getOneByQuery({_id: value.doctorId})

    await DoctorModel.updateOne({_id: value.doctorId}, {
        $set: {
            status: -1,
            deletedPhone: doctor.phone,
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


async function modifyDoctor(ctx, next) {

    let doctorId = ctx.params.id;
    let areaId = ctx.request.body.areaId
    let provinceName = ctx.request.body.provinceName
    let provinceCode = ctx.request.body.provinceCode
    let cityName = ctx.request.body.cityName
    let cityCode = ctx.request.body.cityCode
    let districtName = ctx.request.body.districtName
    let districtCode = ctx.request.body.districtCode
    let doctorName = ctx.request.body.doctorName
    let phone = ctx.request.body.phone

    const schema = Joi.object().keys({
        doctorId: Joi.string().length(24).required(),
        areaId: Joi.string().length(24).required(),
        provinceName: Joi.string().min(2).max(20).required(),
        provinceCode: Joi.string().min(2).max(20).required(),
        cityName: Joi.string().min(2).max(20).required(),
        cityCode: Joi.string().min(2).max(20).required(),
        districtName: Joi.string().min(2).max(10).required(),
        districtCode: Joi.string().min(2).max(10).required(),
        doctorName: Joi.string().min(2).max(30).required(),
        phone: Joi.string().regex(/^1[3|4|5|7|8][0-9]{9}$/).required(),
    });

    const {error, value} = Joi.validate({
        doctorId: doctorId,
        areaId: areaId,
        provinceName: provinceName,
        provinceCode: provinceCode,
        cityName: cityName,
        cityCode: cityCode,
        districtName: districtName,
        districtCode: districtCode,
        doctorName: doctorName,
        phone: phone,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let doctor = await DoctorModel.getById({_id: doctorId})
    if (doctor == null) {
        ctx.state.code = 4
        ctx.state.message = "记录不存在"
        throw new Error(ctx.state.message)
    }

    await DoctorModel.updateOne({_id: doctorId}, {
        $set: {
            areaId: value.areaId,
            provinceName: value.provinceName,
            provinceCode: value.provinceCode,
            cityName: value.cityName,
            cityCode: value.cityCode,
            districtName: value.districtName,
            districtCode: value.districtCode,
            doctorName: value.doctorName,
            phone: value.phone,
        }
    }, {})

    ctx.state.code = 1
    ctx.state.message = "更新成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {
    })
    await next()
}

async function findDoctor(ctx, next) {

    let doctorId = ctx.params.id;

    const schema = Joi.object().keys({
        doctorId: Joi.string().length(24).required(),
    });

    const {error, value} = Joi.validate({
        doctorId: doctorId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let doctor = await DoctorModel.getOneByQuery({_id: doctorId, status: 1}, '', {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        doctor: doctor
    })
    
    await next()
}

async function findDoctors(ctx, next) {

    let areaId = ctx.query.areaId
    let count = ctx.query.count
    let page = ctx.query.page

    const schema = Joi.object().keys({
        areaId: Joi.string().length(24).required(),
        count: Joi.number().default(10).min(10).max(100).required(),
        page: Joi.number().default(1).min(1).max(100).required(),
    });

    const { error, value } = Joi.validate({
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
        sort: { _id: -1 }
    }

    let query = {
        areaId: value.areaId,
        status: 1
    }
    let doctors = await DoctorModel.getByQuery(query, '', opt)
    let total = await DoctorModel.countByQuery(query)
    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        doctors: doctors || [],
        total: total
    })
    await next()
}

async function searchDoctors(ctx, next) {

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
        sort: { seq: 1 }
    }

    let doctors = await DoctorModel.getByQuery({
        doctorName: new RegExp(keywords, 'ig') 
    }, '', opt)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        doctors: doctors || []
    })
    await next()
}

async function findDoctorsByArea(ctx, next) {

    let areaId = ctx.query.areaId
    let keywords = ctx.query.keywords
    
    const schema = Joi.object().keys({
        areaId: Joi.string().length(24).required(),
    });

    const { error, value } = Joi.validate({
        areaId: areaId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let query = {
        doctorName: new RegExp(keywords, "ig"),
        status: 1
    }
    let doctors = await DoctorModel.getByQuery(query, '_id doctorName', {})
    let total = await DoctorModel.countByQuery(query)
    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        doctors: doctors || [],
        total: total
    })
    await next()
}

module.exports = { createDoctor, deleteDoctor, modifyDoctor, findDoctor, findDoctors, searchDoctors, findDoctorsByArea }