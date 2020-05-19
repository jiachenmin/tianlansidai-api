const Joi = require('joi');
const AdminModel = require('../../models/admin.js')


async function createAdmin(ctx, next) {

    let name = ctx.request.body.name
    let phone = ctx.request.body.phone
    let email = ctx.request.body.email
    let password = ctx.request.body.password
    let remark = ctx.request.body.remark
    let organizationId = ctx.request.body.organizationId
    let seq = ctx.request.body.seq

    const schema = Joi.object().keys({
        name: Joi.string().min(2).max(10),
        organizationId: Joi.string().required(),
        phone: Joi.string().regex(/^1[3|4|5|7|8][0-9]{9}$/),
        password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/)
    });

    const { error, value } = Joi.validate({
        name: name,
        phone: phone,
        password: password,
        organizationId: organizationId,
    }, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = error
        throw new Error(error)
    }

    let admin = await AdminModel.save({
        organizationId: organizationId,
        name: name,
        phone: phone,
        password: password,
        seq: seq,
        email: email,
        memo: remark
    })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        admin: admin
    })

    await next()
}

async function deleteAdmin(ctx, next) {

    let adminId = ctx.params.id

    const schema = Joi.object().keys({
        adminId: Joi.string().length(24),
    });

    const { error, value } = Joi.validate({
        adminId: adminId,
    }, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = error
        throw new Error(error)
    }

    await AdminModel.delete({ _id: adminId })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {})
    await next()
}


async function modifyAdmin(ctx, next) {

    let adminId = ctx.params.id
    let name = ctx.request.body.name
    let phone = ctx.request.body.phone
    let email = ctx.request.body.email
    let password = ctx.request.body.password
    let remark = ctx.request.body.remark
    let organizationId = ctx.request.body.organizationId
    let isLock = ctx.request.body.isLock || 1;
    let seq = ctx.request.body.seq


    const schema = Joi.object().keys({
        adminId: Joi.string().length(24),
        name: Joi.string().min(2).max(10),
        // seq: Joi.number().integer().min(1).max(1000),
        name: Joi.string().min(2).max(10),
        organizationId: Joi.string().required(),
        phone: Joi.string().regex(/^1[3|4|5|7|8][0-9]{9}$/),
        password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/)
    });

    const { error, value } = Joi.validate({
        adminId: adminId,
        name: name,
        phone: phone,
        password: password,
        organizationId: organizationId,
    }, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = error
        throw new Error(error)
    }

    let admin = await AdminModel.getById({ _id: adminId })
    if (admin == null) {
        ctx.state.code = -1
        throw new Error("admin not found!")
    }

    await AdminModel.update({ _id: adminId }, {
        $set: {
            isLock: isLock,
            organizationId: organizationId,
            name: name,
            phone: phone,
            password: password,
            seq: seq,
            email: email,
            memo: remark
        }
    }, {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {})
    await next()
}

async function modifyAdminCommonFields(ctx, next) {

    let adminId = ctx.params.id
    let name = ctx.request.body.name
    let phone = ctx.request.body.phone
    let email = ctx.request.body.email
    let remark = ctx.request.body.remark
    let organizationId = ctx.request.body.organizationId
    let isLock = ctx.request.body.isLock || 1;
    let seq = ctx.request.body.seq


    const schema = Joi.object().keys({
        adminId: Joi.string().length(24),
        name: Joi.string().min(2).max(10),
        // seq: Joi.number().integer().min(1).max(1000),
        name: Joi.string().min(2).max(10),
        organizationId: Joi.string().required(),
        phone: Joi.string().regex(/^1[3|4|5|7|8][0-9]{9}$/),
    });

    const { error, value } = Joi.validate({
        adminId: adminId,
        name: name,
        phone: phone,
        organizationId: organizationId,
    }, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = error
        throw new Error(error)
    }

    let admin = await AdminModel.getById({ _id: adminId })
    if (admin == null) {
        ctx.state.code = -1
        throw new Error("admin not found!")
    }

    await AdminModel.update({ _id: adminId }, {
        $set: {
            isLock: isLock,
            organizationId: organizationId,
            name: name,
            phone: phone,
            seq: seq,
            email: email,
            memo: remark
        }
    }, {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {})
    await next()
}

async function findAdmin(ctx, next) {

    let adminId = ctx.params.id;

    const schema = Joi.object().keys({
        adminId: Joi.string().length(24),
    });

    const { error, value } = Joi.validate({
        adminId: adminId,
    }, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = error
        throw new Error(error)
    }

    let admin = await AdminModel.getOneByQuery({ _id: admin_id, status: 1 }, '_id name phone isLock email organizationId memo seq password', {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        admin: admin
    })

    await next()
}

async function findAdmins(ctx, next) {

    let page = ctx.query.page
    let count = ctx.query.count
    let keyWords = ctx.query.keyWords
    let organizationId = ctx.query.organizationId

    let query = {
        status: 1
    };
    if (keyWords) {
        query.name = { $nin: [keyWords, null] };
    }
    if (organizationId) {
        query.organizationId = organizationId;
    }
    let skip = (page - 1) * count;

    let admins = await AdminModel.getByQuery(query, '_id name phone isLock email organizationId memo seq password', { sort: { modifyAt: 1 }, $skip: skip, $limit: count })
    let total = await AdminModel.countByQuery(query);

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        admins: admins || [],
        total: total
    })
    await next()
}


module.exports = { createAdmin, deleteAdmin, modifyAdmin, modifyAdminCommonFields, findAdmin, findAdmins }