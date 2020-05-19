const Joi = require('joi');
const TerritoryModel = require('../../models/territory.js')
const RegionModel = require('../../models/region.js')

async function createTerritory(ctx, next) {
  
    let areaId = ctx.request.body.areaId
    let provinceName = ctx.request.body.provinceName
    let provinceCode = ctx.request.body.provinceCode
    let cityName = ctx.request.body.cityName
    let cityCode = ctx.request.body.cityCode
    let districtName = ctx.request.body.districtName
    let districtCode = ctx.request.body.districtCode
    let memo = ctx.request.body.memo

    const schema = Joi.object().keys({
        areaId: Joi.string().length(24).required(),
        provinceName: Joi.string().min(2).max(10).required(),
        provinceCode: Joi.string().min(2).max(10).required(),
        cityName: Joi.string().min(2).max(10).required(),
        cityCode: Joi.string().min(2).max(10).required(),
        districtName: Joi.string().min(2).max(10).required(),
        districtCode: Joi.string().min(2).max(10).required(),
        memo: Joi.string().default('').allow('').min(0).max(200),
    });

    const {error, value} = Joi.validate({
        areaId: areaId,
        provinceName: provinceName,
        provinceCode: provinceCode,
        cityName: cityName,
        cityCode: cityCode,
        districtName: districtName,
        districtCode: districtCode,
        memo: memo,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let territory = await TerritoryModel.save({
        areaId: value.areaId,
        provinceName: value.provinceName,
        provinceCode: value.provinceCode,
        cityName: value.cityName,
        cityCode: value.cityCode,
        districtName: value.districtName,
        districtCode: value.districtCode,
        memo: value.memo,
    })

    await RegionModel.updateMany({
        $or: [{
            regionCode: provinceCode
        }, {
            regionCode: cityCode
        }, {
            regionCode: districtCode
        }]
    }, {
        $set: {
            open: true
        }
    })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        territory: territory || {}
    })
    await next()
}

async function deleteTerritory(ctx, next) {

    let territoryId = ctx.params.id

    const schema = Joi.object().keys({
        territoryId: Joi.string().length(24).required(),
    });

    const {error, value} = Joi.validate({
        territoryId: territoryId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    await TerritoryModel.delete({_id: value.territoryId})
  
    ctx.state.code = 1
    ctx.state.message = "删除成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {
    })
    await next()
}


async function modifyTerritory(ctx, next) {

    let territoryId = ctx.params.id
    let areaId = ctx.request.body.areaId
    let provinceName = ctx.request.body.provinceName
    let provinceCode = ctx.request.body.provinceCode
    let cityName = ctx.request.body.cityName
    let cityCode = ctx.request.body.cityCode
    let districtName = ctx.request.body.districtName
    let districtCode = ctx.request.body.districtCode
    
    let memo = ctx.request.body.memo

    const schema = Joi.object().keys({
        territoryId: Joi.string().length(24).required(),
        areaId: Joi.string().length(24).required(),
        provinceName: Joi.string().min(2).max(10).required(),
        provinceCode: Joi.string().min(2).max(10).required(),
        cityName: Joi.string().min(2).max(10).required(),
        cityCode: Joi.string().min(2).max(10).required(),
        districtName: Joi.string().min(2).max(10).required(),
        districtCode: Joi.string().min(2).max(10).required(),
        memo: Joi.string().min(2).max(200),
    });

    const { value, error } = Joi.validate({
        territoryId: territoryId,
        areaId: areaId,
        provinceName: provinceName,
        provinceCode: provinceCode,
        cityName: cityName,
        cityCode: cityCode,
        districtName: districtName,
        districtCode: districtCode,
        memo: memo,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let territory = await TerritoryModel.getById({_id: territoryId, status: 1})
    if (territory == null) {
        ctx.state.code = 4
        ctx.state.message = "记录不存在"
        throw new Error(ctx.state.message)
    }

    await TerritoryModel.updateOne({_id: territoryId}, {
        $set: {
            areaId: value.areaId,
            provinceName: value.provinceName,
            provinceCode: value.provinceCode,
            cityName: value.cityName,
            cityCode: value.cityCode,
            districtName: value.districtName,
            districtCode: value.districtCode,
            memo: value.memo,
        }
    }, {})

    ctx.state.code = 1
    ctx.state.message = "更新成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {
    })
    await next()
}

async function findTerritory(ctx, next) {

    let territoryId = ctx.params.id

    const schema = Joi.object().keys({
        territoryId: Joi.string().length(24).required(),
    });

    const {error, value} = Joi.validate({
        territoryId: territoryId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let territory = await TerritoryModel.getOneByQuery({_id: value.territoryId, status: 1}, '', {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        territory: territory || {}
    })
    
    await next()
}

async function findTerritories(ctx, next) {

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
        sort: {provinceName: 1}
    }
    let query = {
        areaId: value.areaId,
        status: 1
    }
    let territories = await TerritoryModel.getByQuery(query, '', opt)
    let total = await TerritoryModel.countByQuery(query)
   
    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        territories: territories || [],
        total: total
    })
    await next()
}

async function searchTerritories(ctx, next) {
    await next()
}

async function checkTerritory(ctx, next) {

    let districtCode = ctx.request.query.districtCode || ctx.request.body.districtCode

    const schema = Joi.object().keys({
        districtCode: Joi.string().min(2).max(10).required(),
    })

    const { error, value } = Joi.validate({
        districtCode: districtCode,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let territory = await TerritoryModel.getOneByQuery({
        districtCode: value.districtCode,
    })

    if(territory == null) {
        throw new Error ('territory not found!')
    }

    ctx.state.territoryId = territory._id.toString()
    await next()
}

module.exports = {createTerritory, deleteTerritory, modifyTerritory, findTerritory, findTerritories, searchTerritories, checkTerritory }