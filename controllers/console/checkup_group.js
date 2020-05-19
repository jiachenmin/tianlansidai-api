const Joi = require('joi');
const CheckUpGroupModel = require('../../models/checkup_group');

async function createGroup(ctx, next) {
    let gid = ctx.request.body.gid
    let name = ctx.request.body.name
    let seq = ctx.request.body.seq
    let parentId = ctx.request.body.parentId
    let memo = ctx.request.body.memo

    const schema = Joi.object().keys({
        gid: Joi.string().min(6).max(10),
        name: Joi.string().min(2).max(10).required(),
        seq: Joi.number().integer().min(1).max(1000)
    });

    const { error, value } = Joi.validate({
        gid: gid,
        name: name,
        seq: seq
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    };

    let group = await CheckUpGroupModel.save({
        gid: gid,
        name: name,
        seq: seq,
        parentId: parentId,
        memo: memo,
    });

    ctx.state.code = 1;
    ctx.state.message = "创建成功";
    ctx.state.data = Object.assign({}, ctx.state.data, {
        group: group
    })

    await next()
}

async function deleteGroup(ctx, next) {

    let id = ctx.params.id

    const schema = Joi.object().keys({
        id: Joi.string().length(24).required()
    });

    const { error, value } = Joi.validate({
        id: id
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    await CheckUpGroupModel.delete({ _id: id });

    ctx.state.code = 1;
    ctx.state.message = "删除成功";
    await next();
}


async function modifyGroup(ctx, next) {
    let id = ctx.params.id;
    let gid = ctx.request.body.gid;
    let name = ctx.request.body.name;
    let seq = ctx.request.body.seq;
    let parentId = ctx.request.body.parentId;
    let memo = ctx.request.body.memo;

    const schema = Joi.object().keys({
        id: Joi.string().length(24).required(),
        gid: Joi.string().min(6).max(10),
        name: Joi.string().min(2).max(10).required(),
        seq: Joi.number().integer().min(1).max(1000)
    });

    const { error, value } = Joi.validate({
        id: id,
        gid: gid,
        name: name,
        seq: seq
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let group = await CheckUpGroupModel.getById({ _id: id })
    if (group == null) {
        ctx.state.code = -1;
        ctx.state.message = "未找到该组";
        throw new Error(ctx.state.message)
    }

    await CheckUpGroupModel.update({ _id: id }, {
        $set: {
            gid: gid,
            name: name,
            seq: seq,
            parentId: parentId,
            memo: memo,
        }
    }, {});

    ctx.state.code = 1;
    ctx.state.message = "更新成功";
    await next();
}

async function getOneGroup(ctx, next) {

    let groupId = ctx.params.id;

    const schema = Joi.object().keys({
        groupId: Joi.string().length(24).required()
    });

    const { error, value } = Joi.validate({
        groupId: groupId
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    let group = await CheckUpGroupModel.getById(groupId);

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        group: group
    });

    await next();
}

async function getGroups(ctx, next) {

    let groups = await CheckUpGroupModel.getByQuery({status: 1}, '_id gid name seq status', { sort: { seq: 1 } });
    let total = await CheckUpGroupModel.countByQuery({status: 1});

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        groups: groups || [],
        total: total
    });
    await next();
}


module.exports = { createGroup, deleteGroup, getOneGroup, getGroups, modifyGroup }