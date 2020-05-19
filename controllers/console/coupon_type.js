const Joi = require('joi');
const CouponTypeModel = require('../../models/coupon_type');

async function createCouponType(ctx, next) {
    let ctid = ctx.request.body.ctid;
    let name = ctx.request.body.name;
    let parentId = ctx.request.body.parentId;
    let memo = ctx.request.body.memo;

    const schema = Joi.object().keys({
        ctid: Joi.string().min(6).max(10),
        name: Joi.string().min(2).max(10).required()
    });

    const { error, value } = Joi.validate({
        ctid: ctid,
        name: name
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    };
    
    let couponType = await CouponTypeModel.save({
        ctid: ctid,
        name: name,
        parentId: parentId,
        memo: memo,
    });

    ctx.state.code = 1
    ctx.state.message = "创建成功";
    ctx.state.data = Object.assign({}, ctx.state.data, {
        couponType: couponType
    })

    await next()
}

async function deleteCouponType(ctx, next) {

    let id = ctx.params.id;

    const schema = Joi.object().keys({
        id: Joi.string().length(24).required()
    });

    const { error, value } = Joi.validate({
        id: id
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        return await next();
    }

    await CouponTypeModel.delete({ _id: id });

    ctx.state.code = 1;
    ctx.state.message = "删除成功";
    await next();
}


async function modifyCouponType(ctx, next) {
    let id = ctx.params.id;
    let ctid = ctx.request.body.ctid;
    let name = ctx.request.body.name;
    let parentId = ctx.request.body.parentId;
    let memo = ctx.request.body.memo;

    const schema = Joi.object().keys({
        id: Joi.string().length(24).required(),
        ctid: Joi.string().min(6).max(10),
        name: Joi.string().min(2).max(10).required()
    });

    const { error, value } = Joi.validate({
        id: id,
        ctid: ctid,
        name: name
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    let couponType = await CouponTypeModel.getById({ _id: id })
    if (couponType == null) {
        ctx.state.code = -1;
        ctx.state.message = "未找到该问卷";
        throw new Error(ctx.state.message)
    }

    await CouponTypeModel.update({ _id: id }, {
        $set: {
            ctid: ctid,
            name: name,
            parentId: parentId,
            memo: memo,
        }
    }, {});

    ctx.state.code = 1;
    ctx.state.message = "更新成功";
    await next();
}

async function getOneCouponType(ctx, next) {

    let id = ctx.params.id;

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

    let couponType = await CouponTypeModel.getById(id);

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        couponType: couponType
    });

    await next();
}

async function getCouponTypes(ctx, next) {

    let couponTypes = await CouponTypeModel.getByQuery({ status: 1 }, '_id ctid name status', { sort: { seq: 1 } });
    let total = await CouponTypeModel.countByQuery({status: 1});

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        couponTypes: couponTypes || [],
        total: total
    });
    await next();
}


module.exports = { createCouponType, deleteCouponType, getOneCouponType, getCouponTypes, modifyCouponType }