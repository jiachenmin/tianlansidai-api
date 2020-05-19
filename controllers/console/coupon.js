const Joi = require('joi');
const CouponModel = require('../../models/coupon')

async function createCoupon(ctx, next) {

    let ctid = ctx.request.body.ctid;
    let seq = ctx.request.body.seq;
    let code = ctx.request.body.code;
    let title = ctx.request.body.title;
    let content = ctx.request.body.content;
    let introduceUrl = ctx.request.body.introduceUrl;
    let collectRuleString = ctx.request.body.collectRule;
    let useRuleString = ctx.request.body.useRule;
    let memo = ctx.request.body.memo;
    
    const schema = Joi.object().keys({
        ctid: Joi.string().length(24)
    });

    const {error, value} = Joi.validate({
        ctid: ctid
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    };
    
    let collectRule = JSON.parse(collectRuleString);
    let useRule = JSON.parse(useRuleString);

    let coupon = await CouponModel.save({
        ctid: ctid,
        seq: seq,
        code: code,
        title: title,
        content: content,
        introduceUrl: introduceUrl,
        collectRule: collectRule,
        useRule: useRule,
        memo: memo,
    });

    ctx.state.code = 1;
    ctx.state.message = "创建成功";
    ctx.state.data = Object.assign({}, ctx.state.data, {
        coupon: coupon
    })

    await next()
}

async function deleteCoupon(ctx, next) {

    let id = ctx.params.id;

    const schema = Joi.object().keys({
        id: Joi.string().length(24).required()
    });

    const {error, value} = Joi.validate({
        id: id
    }, schema);
    
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    await CouponModel.delete({_id: id});

    ctx.state.code = 1;
    ctx.state.message = "删除成功";
    await next();
}

async function modifyCoupon(ctx, next) {
    let id = ctx.params.id;
    let ctid = ctx.request.body.ctid;
    let seq = ctx.request.body.seq;
    let code = ctx.request.body.code;
    let title = ctx.request.body.title;
    let content = ctx.request.body.content;
    let introduceUrl = ctx.request.body.introduceUrl;
    let collectRuleString = ctx.request.body.collectRule;
    let useRuleString = ctx.request.body.useRule;
    let isUse = ctx.request.body.isUse;
    let memo = ctx.request.body.memo;

    const schema = Joi.object().keys({
        id: Joi.string().length(24).required(),
        ctid: Joi.string().length(24),
        isUse: Joi.number().integer().min(1).max(2)
    });

    const {error, value} = Joi.validate({
        id: id,
        ctid: ctid,
        isUse: isUse
    }, schema);

    if  (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(errors)
    }
    
    let coupon = await CouponModel.getById({_id: id})
    if (coupon == null) {
        ctx.state.code = -1;
        ctx.state.message = "未找到该优惠券";
        throw new Error(ctx.state.message)
    }

    let collectRule = JSON.parse(collectRuleString);
    let useRule = JSON.parse(useRuleString);
    
    await CouponModel.update({_id: id}, {
        $set: {
            ctid: ctid,
            seq: seq,
            code: code,
            title: title,
            content: content,
            introduceUrl: introduceUrl,
            collectRule: collectRule,
            useRule: useRule,
            isUse: isUse,
            memo: memo,
        }
    }, {});

    ctx.state.code = 1;
    ctx.state.message = "更新成功";
    await next();
}

async function getOneCoupon(ctx, next) {

    let id = ctx.params.id;

    const schema = Joi.object().keys({
        id: Joi.string().length(24).required()
    });

    const {error, value} = Joi.validate({
        id: id
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    let coupon = await CouponModel.getById(id);

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        coupon: coupon
    });
    
    await next();
}

async function getCoupons(ctx, next) {
    // let terms = await CouponModel.getByQuery({}, '_id groupId part code name seq status', {sort: {seq: 1}});

    // ctx.state.code = 1;
    // ctx.state.data = Object.assign({}, ctx.state.data, {
    //     terms: terms || []
    // });
    // await next();

    let ctid = ctx.query.ctid;
    let count = ctx.query.count;
    let page = ctx.query.page;
    
    const schema = Joi.object().keys({
        ctid: Joi.string().length(24).required(),
        count: Joi.number().min(1).max(100).required(),
        page: Joi.number().min(1).required(),
    });

    const {error, value} = Joi.validate({
        ctid: ctid,
        count: count,
        page: page
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    let opt = {
        limit: value.count, 
        skip: (value.page - 1) * value.count, 
        sort: {seq: 1}
    };
    let query = {
        ctid: ctid,
        status: 1
    };
    let coupons = await CouponModel.getByQuery(query, '', opt);
    let total = await CouponModel.countByQuery(query);
   
    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        coupons: coupons || [],
        total: total
    });
    await next();
}

async function searchCoupon(ctx, next) {

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
    };
    let query = {
        $or: [{code: new RegExp(keywords, 'ig')}, {title: new RegExp(keywords, 'ig')}],
        status: 1
    };

    let coupons = await CheckUpTermModel.getByQuery(query, '', opt)
    let total = await CheckUpTermModel.countByQuery(query);

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        coupons: coupons || [],
        total: total
    })
    await next()
}

async function getAllCoupons(ctx, next) {
    
    let query = {
        status: 1
    };
    let coupons = await CouponModel.getByQuery(query, '_id, title', {});
   
    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        coupons: coupons || [],
    });
    await next();
}

module.exports = {createCoupon, deleteCoupon, getOneCoupon, getCoupons, modifyCoupon, searchCoupon, getAllCoupons}