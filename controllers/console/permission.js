const roleProxy = require("../../models/role.js")
const permissionProxy = require("../../models/permission.js")
const resourceProxy = require("../../models/resource.js")
const Joi = require("joi")
const adminProxy = require('../../models/admin.js');
const view_permissionProxy = require("../../models/view_permission.js");
const mongoose = require('mongoose')

async function createRole(ctx, next) {
    let params = {
        parent: ctx.request.body.parent,
        name: ctx.request.body.name,
        number: ctx.request.body.number,
        memo: ctx.request.body.memo
    }
    let schemaObj = {
        parent: Joi.string().length(24).default(null),
        name: Joi.string().required(),
        number: Joi.string(),
        memo: Joi.string()
    }
    const schema = Joi.object().keys(schemaObj)
    let { error, value } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }

    let parentObj = null;
    if (value.parent) {
        parentObj = await roleProxy.getOneByQuery({ _id: value.parent, status: 1 })
        if (!parentObj) {
            ctx.state.code = 4;
            ctx.state.message = "父角色不存在!"
            throw new Error("父角色不存在!")
        }
    }
    let result = await roleProxy.save(value)
    if (parentObj) {
        parentObj.child.push(result._id)
        await roleProxy.save(parentObj)
    }
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = result
    return await next()
}

async function getRole(ctx, next) {
    let roleList = await roleProxy.getByQueryPopulate({ status: 1, parent: null })
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = roleList
    return await next()
}

async function deleteRole(ctx, next) {
    const schema = Joi.object().keys({
        roleId: Joi.string().length(24).required(),
    })
    let { error, value } = Joi.validate({ roleId: ctx.params.id }, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    await roleProxy.delete({ _id: value.roleId })
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    return await next()
}

async function modifyRole(ctx, next) {
    let params = {
        parent: ctx.request.body.parent,
        name: ctx.request.body.name,
        number: ctx.request.body.number,
        memo: ctx.request.body.memo
    }

    const schema = Joi.object().keys({
        parent: Joi.string().length(24),
        name: Joi.string().required(),
        number: Joi.string(),
        memo: Joi.string()
    })

    let { error, value } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    await roleProxy.updateOne({ _id: value.roleId }, {
        $set: {
            parent: ctx.request.body.parent,
            name: ctx.request.body.name,
            number: ctx.request.body.number,
            memo: ctx.request.body.memo,
        }
    })
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    return await next()
}

async function createPermission(ctx, next) {
    let params = {
        resource: ctx.request.body.resource,
        role: ctx.request.body.role,
        permission: ctx.request.body.permission,
        memo: ctx.request.body.memo
    }
    let schemaObj = {
        resource: Joi.string().length(24).required(),
        role: Joi.string().length(24).required(),
        permission: Joi.number().valid(-1, 1, 2),
        memo: Joi.string().allow("")
    }
    let permissionId = ctx.request.body.permissionId
    let businessStatus = ctx.request.body.businessStatus
    if(!!permissionId && permissionId.trim()){
        params.permissionId = permissionId.trim()
        params.businessStatus = businessStatus
        schemaObj.permissionId = Joi.string().length(24).required()
        schemaObj.businessStatus = Joi.number().integer().valid(2, 3).required()
    }
    const schema = Joi.object().keys(schemaObj)
    let { error, value } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    let resource = await resourceProxy.getOneByQuery({ _id: value.resource, status: 1 }, {})
    let role = await roleProxy.getOneByQuery({ _id: value.role, status: 1 }, {})
    if (!resource || !role) {
        ctx.state.code = 4;
        ctx.state.message = "资源或角色不存在!"
        ctx.state.data = {}
        throw new Error(ctx.state.message)
    }
    if(value.permissionId){//修改
        let saved = await permissionProxy.getById(value.permissionId)
        if(!saved){
            ctx.state.code = 4;
            ctx.state.message = "改权限不存在!"
            ctx.state.data = {}
            throw new Error(ctx.state.message)
        }
        saved.resource = value.resource
        saved.permission = value.permission
        saved.role = value.role
        saved.businessStatus = value.businessStatus
        saved.memo = value.memo
        saved.modifyAt = new Date()
        saved = await permissionProxy.save(saved)
        ctx.state.code = 1;
        ctx.state.message = "success!"
        ctx.state.data = saved
        return await next()
    }
    let result = await permissionProxy.save(value)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = result
    return await next()
}

async function deletePermission(ctx, next) {
    const schema = Joi.object().keys({
        permissionId: Joi.string().length(24).required(),
    })
    let { error, value } = Joi.validate({ permissionId: ctx.params.id }, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    await permissionProxy.delete({ _id: value.permissionId })
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    return await next()
}

async function modifyPermission(ctx, next) {
    let params = {
        permissionId: ctx.params.id,
        opCode: ctx.request.query.opCOde
    }
    const schema = Joi.object().keys({
        permissionId: Joi.string().length(24).required(),
        opCode: Joi.number().valid(-1, 1, 2).required()
    })
    let { error, value } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    await permissionProxy.updateOne({ _id: value.permissionId }, { $set: { businessStatus: value.opCode } })
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    return await next()
}

async function getPermissionList(ctx, next) {

    let params = {
        roleId: ctx.request.query.roleId,
        keyWord: ctx.request.query.keyWord,
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum
    }

    const schema = Joi.object().keys({
        roleId: Joi.string().length(24).required(),
        keyWord: Joi.string().default(""),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().default(10)
    })

    let { error, value } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    params = Object.assign(params, value)
    params.keyWord = params.keyWord.trim()
    const skipCount = params.pageSize * (params.pageNum - 1)

    let queryStr = { role: params.roleId, status: 1 }
    if (params.keyWord) {
        queryStr["$or"] = [{ resource: { $elemMatch: { name: new RegExp(params.keyWord, 'ig') } } }, { resource: { $elemMatch: { number: new RegExp(params.keyWord, 'ig') } } }]
    }
    let result = await view_permissionProxy.getByQuery(queryStr, {}, {
        sort: { _id: -1 },
        skip: skipCount,
        limit: params.pageSize
    });
    let total = await view_permissionProxy.countByQuery(queryStr)

    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, { total: total, list: result })
    return await next()
}

async function getPermissionPersons(ctx, next) {
    let params = {
        roleId: ctx.request.query.typeId,
        keyWord: ctx.request.query.keyWord,
        pageSize: ctx.request.query.pageSize,
        pageNum: ctx.request.query.pageNum
    }
    const schema = Joi.object().keys({
        roleId: Joi.string().length(24),
        keyWord: Joi.string().default(""),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().default(10)
    })
    let { error, value } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    params = Object.assign(params, value)
    params.keyWord = params.keyWord.trim()
    const skipCount = params.pageSize * (params.pageNum - 1)

    let queryStr = { status: 1 }
    if (params.roleId) {
        queryStr.role = params.roleId
    }
    if (params.keyWord) {
        queryStr['$or'] = [{ seq: new RegExp(params.keyWord, 'ig') }, { name: new RegExp(params.keyWord, 'ig') }]
    }
    let result = await adminProxy.getByQuery(queryStr, {}, { sort: { _id: -1 }, skip: skipCount, limit: params.pageSize })
    let total = await adminProxy.countByQuery(queryStr)
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = Object.assign({}, { total: total, list: result })
    return await next()
}

async function addPermissionPersons(ctx, next) {
    let params = {
        adminId: ctx.request.body.adminId,
        roleId: ctx.request.body.roleId,
        opType: ctx.request.body.opType//1、添加  2、删除
    }
    const schema = Joi.object().keys({
        adminId: Joi.string().length(24).required(),
        roleId: Joi.string().length(24).required(),
        opType: Joi.number().valid(1, 2).required()
    })
    let { error, value } = Joi.validate(params, schema)
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数不合法!"
        throw new Error(error)
    }
    let adminUser = await adminProxy.getOneByQuery({ _id: value.adminId, status: 1 })
    if (!adminUser) {
        ctx.state.code = 4;
        ctx.state.message = "管理员不存在!"
        throw new Error(ctx.state.message)
    }
    let role = await roleProxy.getOneByQuery({ _id: value.roleId, status: 1 })
    if (!role) {
        ctx.state.code = 4;
        ctx.state.message = "角色不存在!"
        throw new Error(ctx.state.message)
    }
    if (1 == value.opType) {
        if (-1 == adminUser.role.indexOf(value.roleId)) {
            adminUser.role.push(value.roleId)
            await adminProxy.save(adminUser)
        }

    } else {
        let index = adminUser.role.indexOf(value.roleId)
        if (-1 != index) {
            adminUser.role.splice(index, 1)
            await adminProxy.save(adminUser)
        }
    }
    ctx.state.code = 1;
    ctx.state.message = "success!"
    ctx.state.data = {}
    return await next()
}

async function deletePermissionPersons(ctx, next) {

}

module.exports = {
    createRole,
    getRole,
    createPermission,
    deletePermission,
    modifyPermission,
    getPermissionList,
    getPermissionPersons,
    addPermissionPersons,
    deletePermissionPersons,
    deleteRole,
    modifyRole,
}