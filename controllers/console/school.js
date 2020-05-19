const Joi = require('joi');
const SchoolModel = require('../../models/school.js')
const TerritoryModel = require('../../models/territory.js')
const RegionModel = require('../../models/region.js')
const redis = require('../../models/index.js').redisConn

async function createSchool (ctx, next) {

    let territoryId = ctx.state.territoryId
    let areaId = ctx.request.body.areaId
    let provinceName = ctx.request.body.provinceName
    let provinceCode = ctx.request.body.provinceCode
    let cityName = ctx.request.body.cityName
    let cityCode = ctx.request.body.cityCode
    let districtName = ctx.request.body.districtName
    let districtCode = ctx.request.body.districtCode
    let schoolName = ctx.request.body.schoolName
    let schoolCode = ctx.request.body.schoolCode
    let schoolStage = ctx.request.body.schoolStage
    let longitude = ctx.request.body.longitude
    let latitude = ctx.request.body.latitude

    const schema = Joi.object().keys({
        territoryId: Joi.string().length(24).required(),
        areaId: Joi.string().length(24).required(),
        provinceName: Joi.string().min(2).max(20).required(),
        provinceCode: Joi.string().min(2).max(20).required(),
        cityName: Joi.string().min(2).max(20).required(),
        cityCode: Joi.string().min(2).max(20).required(),
        districtName: Joi.string().min(2).max(10).required(),
        districtCode: Joi.string().min(2).max(10).required(),
        schoolName: Joi.string().min(2).max(30).required(),
        schoolCode: Joi.string().min(2).max(10).required(),
        schoolStage: Joi.number().min(3).max(5).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        latitude: Joi.number().min(-180).max(180).required(),
    });

    const { error, value } = Joi.validate({
        territoryId: territoryId,
        areaId: areaId,
        provinceName: provinceName,
        provinceCode: provinceCode,
        cityName: cityName,
        cityCode: cityCode,
        districtName: districtName,
        districtCode: districtCode,
        schoolName: schoolName,
        schoolCode: schoolCode,
        schoolStage: schoolStage,
        longitude: longitude,
        latitude: latitude,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let school = await SchoolModel.save({
        territoryId: value.territoryId,
        areaId: value.areaId,
        provinceName: value.provinceName,
        provinceCode: value.provinceCode,
        cityName: value.cityName,
        cityCode: value.cityCode,
        districtName: value.districtName,
        districtCode: value.districtCode,
        schoolName: value.schoolName,
        schoolCode: value.schoolCode,
        schoolStage: schoolStage,
        location: {
            type: "Point",
            coordinates: [longitude, latitude],
        },
    })

    await RegionModel.update({
        $or: [{
            regionCode: provinceCode
        }, {
            regionCode: cityCode
        }, {
            regionCode: districtCode
        }]
    }, {
        $set: {
            hasSchool: true
        }
    })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        school: school
    })

    await next()
}

async function deleteSchool (ctx, next) {

    let schoolId = ctx.params.id

    const schema = Joi.object().keys({
        schoolId: Joi.string().length(24).required(),
    });

    const { error, value } = Joi.validate({
        schoolId: schoolId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let school = await SchoolModel.getOneByQuery({ _id: schoolId })

    // 区
    let count = await SchoolModel.countByQuery({ districtCode: school.districtCode })
    if (count <= 1) {
        await RegionModel.update({
            regionCode: school.districtCode
        }, {
            $set: {
                hasSchool: false
            }
        })
    }
    // 市
    count = await SchoolModel.countByQuery({ cityCode: school.cityCode })
    if (count <= 1) {
        await RegionModel.update({
            regionCode: school.cityCode
        }, {
            $set: {
                hasSchool: false
            }
        })
    }
    // 省
    count = await SchoolModel.countByQuery({ provinceCode: school.provinceCode })
    if (count <= 1) {
        await RegionModel.update({
            regionCode: school.provinceCode
        }, {
            $set: {
                hasSchool: false
            }
        })
    }

    await SchoolModel.delete({ _id: schoolId })

    ctx.state.code = 1
    ctx.state.message = "删除成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {
    })
    await next()
}

async function modifySchoolMemo (ctx, next) {
    let schoolId = ctx.params.id
    let memo = ctx.request.body.memo
    const schema = Joi.object().keys({
        schoolId: Joi.string().length(24).required(),
    })
    const { error, value } = Joi.validate({
        schoolId: schoolId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "学校编号错误"
        throw new Error(error)
    }
    let school = await SchoolModel.getById({ _id: value.schoolId })
    if (school == null) {
        ctx.state.code = 4
        ctx.state.message = "记录不存在"
        throw new Error(ctx.state.message)
    }
    await SchoolModel.updateOne({ _id: value.schoolId }, {
        $set: {
            memo: memo
        }
    }, {})

    ctx.state.code = 1
    ctx.state.message = "更新成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {})
    await next()
}

async function modifySchool (ctx, next) {

    let schoolId = ctx.params.id
    let areaId = ctx.request.body.areaId
    let provinceName = ctx.request.body.provinceName
    let provinceCode = ctx.request.body.provinceCode
    let cityName = ctx.request.body.cityName
    let cityCode = ctx.request.body.cityCode
    let districtName = ctx.request.body.districtName
    let districtCode = ctx.request.body.districtCode
    let schoolName = ctx.request.body.schoolName
    let schoolCode = ctx.request.body.schoolCode
    let schoolStage = ctx.request.body.schoolStage
    let longitude = ctx.request.body.longitude
    let latitude = ctx.request.body.latitude
    let memo = ctx.request.body.memo

    const schema = Joi.object().keys({
        schoolId: Joi.string().length(24).required(),
        areaId: Joi.string().length(24).required(),
        provinceName: Joi.string().min(2).max(20).required(),
        provinceCode: Joi.string().min(2).max(20).required(),
        cityName: Joi.string().min(2).max(20).required(),
        cityCode: Joi.string().min(2).max(20).required(),
        districtName: Joi.string().min(2).max(10).required(),
        districtCode: Joi.string().min(2).max(10).required(),
        schoolName: Joi.string().min(2).max(30).required(),
        schoolCode: Joi.string().min(2).max(10).required(),
        schoolStage: Joi.number().min(3).max(5).required(),
        longitude: Joi.number().min(-360).max(360).required(),
        latitude: Joi.number().min(-360).max(360).required(),
    });

    const { error, value } = Joi.validate({
        schoolId: schoolId,
        areaId: areaId,
        provinceName: provinceName,
        provinceCode: provinceCode,
        cityName: cityName,
        cityCode: cityCode,
        districtName: districtName,
        districtCode: districtCode,
        schoolName: schoolName,
        schoolCode: schoolCode,
        schoolStage: schoolStage,
        longitude: longitude,
        latitude: latitude
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let school = await SchoolModel.getById({ _id: value.schoolId })
    if (school == null) {
        ctx.state.code = 4
        ctx.state.message = "记录不存在"
        throw new Error(ctx.state.message)
    }

    // 区
    if (school.districtCode != value.districtCode) {
        let count = await SchoolModel.countByQuery({ districtCode: school.districtCode })
        if (count <= 1) {
            await RegionModel.update({
                regionCode: school.districtCode
            }, {
                $set: {
                    hasSchool: false
                }
            })
            await RegionModel.update({
                regionCode: value.districtCode
            }, {
                $set: {
                    hasSchool: true
                }
            })
        }
    }

    // 市
    if (school.cityCode != value.cityCode) {
        let count = await SchoolModel.countByQuery({ cityCode: school.cityCode })
        if (count <= 1) {
            await RegionModel.update({
                regionCode: school.cityCode
            }, {
                $set: {
                    hasSchool: false
                }
            })
            await RegionModel.update({
                regionCode: value.cityCode
            }, {
                $set: {
                    hasSchool: true
                }
            })
        }
    }
    // 省
    if (school.provinceCode != value.provinceCode) {
        let count = await SchoolModel.countByQuery({ provinceCode: school.provinceCode })
        if (count <= 1) {
            await RegionModel.update({
                regionCode: school.provinceCode
            }, {
                $set: {
                    hasSchool: false
                }
            })
            await RegionModel.update({
                regionCode: value.provinceCode
            }, {
                $set: {
                    hasSchool: true
                }
            })
        }
    }

    await SchoolModel.updateOne({ _id: value.schoolId }, {
        $set: {
            areaId: value.areaId,
            provinceName: value.provinceName,
            provinceCode: value.provinceCode,
            cityName: value.cityName,
            cityCode: value.cityCode,
            districtName: districtName,
            districtCode: districtCode,
            schoolName: value.schoolName,
            schoolCode: value.schoolCode,
            schoolStage: schoolStage,
            location: {
                type: "Point",
                coordinates: [longitude, latitude]
            },
            memo: memo
        }
    }, {})

    ctx.state.code = 1
    ctx.state.message = "更新成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {
    })
    await next()
}

async function findSchool (ctx, next) {

    let schoolId = ctx.params.id;

    const schema = Joi.object().keys({
        schoolId: Joi.string().length(24).required(),
    });

    const { error, value } = Joi.validate({
        schoolId: schoolId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let school = await SchoolModel.getOneByQuery({ _id: schoolId, status: 1 }, '', {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        school: school
    })

    await next()
}

async function findSchools (ctx, next) {

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
        sort: { schoolName: 1 }
    }

    let query = {
        areaId: value.areaId,
        status: 1,
    }
    let schools = await SchoolModel.getByQuery(query, '', opt)
    let total = await SchoolModel.countByQuery(query)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        schools: schools || [],
        total: total
    })
    await next()
}

async function searchSchools (ctx, next) {

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
        sort: { schoolName: 1 }
    }

    let schools = await SchoolModel.getByQuery({
        schoolName: new RegExp(keywords, 'ig')
    }, '', opt)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        schools: schools || []
    })
    await next()
}

async function findSchoolsByArea (ctx, next) {

    let areaId = ctx.query.areaId

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
        areaId: value.areaId,
        status: 1,
    }
    let schools = await SchoolModel.getByQuery(query, '_id schoolName', {})
    let total = await SchoolModel.countByQuery(query)

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        schools: schools || [],
        total: total
    })
    await next()
}
async function listAllSchool (ctx, next) {
    let schoolsTime =  await redis.getAsync('schools_console:time')
    if (schoolsTime) {
        let schoolsData =  JSON.parse(await redis.getAsync('schools_console:data'))
        if(!schoolsData) schoolsData = {}
        ctx.state.code = 1;
        ctx.state.message = "success get data from redis"
        ctx.state.data = Object.assign({}, ctx.state.data, schoolsData);
        return await next()
    }
    let provinces = {};
    let cities = {};
    let districts = {};
    let schools = {};
    let result = []
    let schoolsInMongoDB = await SchoolModel.getByQuery({status: 1});
    for (let i = 0; i < schoolsInMongoDB.length; i++) {
        const school = schoolsInMongoDB[i];
        schools[school._id] = school;
        // 省不存在时
        if (!provinces.hasOwnProperty(school.provinceCode)) {
            result.push({
                value: school.provinceCode,
                label: school.provinceName,
                children: [
                    {
                        value: school.cityCode,
                        label: school.cityName,
                        children: [
                            {
                                value: school.districtCode,
                                label: school.districtName,
                                children: [
                                    {
                                        value: school._id,
                                        label: school.schoolName,
                                    }
                                ]
                            }
                        ]
                    }
                ]
            })
            provinces[school.provinceCode] = result.length - 1;
            cities[school.cityCode] = 0;
            districts[school.districtCode] = 0;
            continue;
        }
        // 省存在时
        // 市不存在的时候
        if (!cities.hasOwnProperty(school.cityCode)) {
            result[provinces[school.provinceCode]].children.push(
                {
                    value: school.cityCode,
                    label: school.cityName,
                    children: [
                        {
                            value: school.districtCode,
                            label: school.districtName,
                            children: [
                                {
                                    value: school._id,
                                    label: school.schoolName,
                                }
                            ]
                        }
                    ]
                }
            )
            cities[school.cityCode] = result[provinces[school.provinceCode]].children.length - 1;
            districts[school.districtCode] = 0;
            continue;
        }
        // 市存在时
        // 区不存在时
        if (!districts.hasOwnProperty(school.districtCode)) {
            result[provinces[school.provinceCode]].children[cities[school.cityCode]].children.push(
                {
                    value: school.districtCode,
                    label: school.districtName,
                    children: [
                        {
                            value: school._id,
                            label: school.schoolName,
                        }
                    ]
                }
            )
            districts[school.districtCode] = result[provinces[school.provinceCode]].children[cities[school.cityCode]].children.length - 1;
            continue;
        }
        // 区存在时
        result[provinces[school.provinceCode]].children[cities[school.cityCode]].children[districts[school.districtCode]].children.push({
            value: school._id,
            label: school.schoolName,
        })
    }
    data = {
        schools: schools,
        schoolsIndex: result
    }
    await redis.setAsync('schools_console:data', JSON.stringify(data))
    await redis.setAsync('schools_console:time', JSON.stringify({time: new Date().getTime()}), 'EX', 30)

    ctx.state.code = 1
    ctx.state.message = "success get data from mongodb"
    ctx.state.data = Object.assign({}, ctx.state.data, data)
    await next()
}
module.exports = { createSchool, deleteSchool, modifySchool, modifySchoolMemo, findSchool, findSchools, searchSchools, findSchoolsByArea, listAllSchool }