const Joi = require('joi');
const HospitalModel = require('../../models/hospital.js')

async function createHospital (ctx, next) {
    let params = {
        territoryId: ctx.state.territoryId,
        areaId: ctx.request.body.areaId,
        provinceName: ctx.request.body.provinceName,
        provinceCode: ctx.request.body.provinceCode,
        cityName: ctx.request.body.cityName,
        cityCode: ctx.request.body.cityCode,
        districtName: ctx.request.body.districtName,
        districtCode: ctx.request.body.districtCode,
        hospitalName: ctx.request.body.hospitalName,
        hospitalCode: ctx.request.body.hospitalCode,
        longitude: ctx.request.body.longitude,
        latitude: ctx.request.body.latitude,
        phone: ctx.request.body.phone,
        businessTime: ctx.request.body.businessTime
    }
    let hospitalId = ctx.request.body.hospitalId || ""
    let schemaObj = {
        territoryId: Joi.string().length(24).required(),
        areaId: Joi.string().length(24).required(),
        provinceName: Joi.string().min(2).max(20).required(),
        provinceCode: Joi.string().min(2).max(20).required(),
        cityName: Joi.string().min(2).max(20).required(),
        cityCode: Joi.string().min(2).max(20).required(),
        districtName: Joi.string().min(2).max(10).required(),
        districtCode: Joi.string().min(2).max(10).required(),
        hospitalName: Joi.string().min(2).max(30).required(),
        hospitalCode: Joi.string().min(2).max(10).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        latitude: Joi.number().min(-180).max(180).required(),
        businessTime: Joi.object().required(),
        phone: Joi.string().required()
    }
    if (hospitalId.trim()) {
        params.hospitalId = hospitalId.trim()
        schemaObj.hospitalId = Joi.string().length(24).required()
    }
    const schema = Joi.object().keys(schemaObj);
    const { error, value } = Joi.validate(params, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }
    if (value.hospitalId) {
        let hospital = await HospitalId.getById(value.hospitalId)
        if (!hospital) {
            ctx.state.code = 4
            ctx.state.message = "不存在的医院！"
            ctx.data = {}
            await next()
            return
        }
        hospital.territoryId = value.territoryId
        hospital.areaId = value.areaId
        hospital.provinceName = value.provinceName
        hospital.provinceCode = value.provinceCode
        hospital.cityName = value.cityName
        hospital.cityCode = value.cityCode
        hospital.districtName = value.districtName
        hospital.districtCode = value.districtCode
        hospital.hospitalName = value.hospitalName
        hospital.hospitalCode = value.hospitalCode
        hospital.location.coordinates = [value.longitude, value.latitude]
        hospital.phone = value.phone
        hospital.businessTime = value.businessTime
        hospital.modifyAt = new Date()
        hospital = await HospitalModel.save(hospital)

        ctx.state.code = 1
        ctx.state.message = "修改成功！"
        ctx.data = Object.assign({}, ctx.state.data, { hospital: hospital })
        await next()
        return
    }

    let hospital = await HospitalModel.save({
        territoryId: value.territoryId,
        areaId: value.areaId,
        provinceName: value.provinceName,
        provinceCode: value.provinceCode,
        cityName: value.cityName,
        cityCode: value.cityCode,
        districtName: value.districtName,
        districtCode: value.districtCode,
        hospitalName: value.hospitalName,
        hospitalCode: value.hospitalCode,
        location: {
            type: "Point",
            coordinates: [value.longitude, value.latitude],
        },
        phone: value.phone,
        businessTime: value.businessTime
    })
    console.log(hospital);
    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        hospital: hospital
    })

    await next()
}

async function deleteHospital (ctx, next) {
    let hospitalId = ctx.params.id
    const schema = Joi.object().keys({
        hospitalId: Joi.string().length(24).required(),
    });
    const { error, value } = Joi.validate({
        hospitalId: hospitalId,
    }, schema);
    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    await HospitalModel.delete({ _id: value.hospitalId })

    ctx.state.code = 1
    ctx.state.message = "删除成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {})
    await next()
}

async function modifyHospital (ctx, next) {
    let hospitalId = ctx.params.id
    let areaId = ctx.request.body.areaId
    let provinceName = ctx.request.body.provinceName
    let provinceCode = ctx.request.body.provinceCode
    let cityName = ctx.request.body.cityName
    let cityCode = ctx.request.body.cityCode
    let districtName = ctx.request.body.districtName
    let districtCode = ctx.request.body.districtCode
    let hospitalName = ctx.request.body.hospitalName
    let hospitalCode = ctx.request.body.hospitalCode
    let longitude = ctx.request.body.longitude
    let latitude = ctx.request.body.latitude
    let phone = ctx.request.body.phone
    let businessTime = ctx.request.body.businessTime

    const schema = Joi.object().keys({
        hospitalId: Joi.string().length(24).required(),
        areaId: Joi.string().length(24).required(),
        provinceName: Joi.string().min(2).max(20).required(),
        provinceCode: Joi.string().min(2).max(20).required(),
        cityName: Joi.string().min(2).max(20).required(),
        cityCode: Joi.string().min(2).max(20).required(),
        districtName: Joi.string().min(2).max(10).required(),
        districtCode: Joi.string().min(2).max(10).required(),
        hospitalName: Joi.string().min(2).max(30).required(),
        hospitalCode: Joi.string().min(2).max(10).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        latitude: Joi.number().min(-180).max(180).required(),
        businessTime: Joi.object().required(),
        phone: Joi.string().required()
    });

    const { error, value } = Joi.validate({
        hospitalId: hospitalId,
        areaId: areaId,
        provinceName: provinceName,
        provinceCode: provinceCode,
        cityName: cityName,
        cityCode: cityCode,
        districtName: districtName,
        districtCode: districtCode,
        hospitalName: hospitalName,
        hospitalCode: hospitalCode,
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

    let hospital = await HospitalModel.getById({ _id: value.hospitalId, status: 1 })
    if (hospital == null) {
        ctx.state.code = 4
        ctx.state.message = "记录不存在"
        throw new Error(ctx.state.message)
    }

    await HospitalModel.updateOne({ _id: value.hospitalId }, {
        $set: {
            areaId: value.areaId,
            provinceName: value.provinceName,
            provinceCode: value.provinceCode,
            cityName: value.cityName,
            cityCode: value.cityCode,
            districtName: districtName,
            districtCode: districtCode,
            hospitalName: value.hospitalName,
            hospitalCode: value.hospitalCode,
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

async function findHospital (ctx, next) {
    let hospitalId = ctx.params.id;
    const schema = Joi.object().keys({
        hospitalId: Joi.string().length(24),
    });
    const { error, value } = Joi.validate({
        hospitalId: hospitalId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let hospital = await HospitalModel.getOneByQuery({ _id: value.hospitalId, status: 1 }, '', {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        hospital: hospital
    })

    await next()
}

async function findHospitals (ctx, next) {

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
        sort: { hospitalName: 1 }
    }

    let query = {
        areaId: value.areaId,
        status: 1
    }
    let hospitals = await HospitalModel.getByQuery(query, '', opt)
    let total = await HospitalModel.countByQuery(query)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        hospitals: hospitals || [],
        total: total
    })
    await next()
}

async function searchHospitals (ctx, next) {

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

    let hospitals = await HospitalModel.getByQuery({
        hospitalName: new RegExp(keywords, 'ig')
    }, '', opt)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        hospitals: hospitals || []
    })
    await next()
}

module.exports = { createHospital, deleteHospital, modifyHospital, findHospital, findHospitals, searchHospitals }