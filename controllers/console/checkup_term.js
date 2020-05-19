const Joi = require('joi');
const CheckUpTermModel = require('../../models/checkup_term')

async function createTerm(ctx, next) {
    let gid = ctx.request.body.gid;
    let name = ctx.request.body.name;
    let seq = ctx.request.body.seq;
    let part = ctx.request.body.part;
    let code = ctx.request.body.code;
    let memo = ctx.request.body.memo;
    
    const schema = Joi.object().keys({
        gid: Joi.string().length(24),
        name: Joi.string().min(2).max(10),
        part: Joi.number().integer().min(1).max(2),
        code: Joi.string().min(6).max(10).required(),
        seq: Joi.number().integer().min(1).max(1000)
    });

    const {error, value} = Joi.validate({
        gid: gid,
        name: name,
        part: part,
        code: code,
        seq: seq
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    };

    await CheckUpTermModel.save({
        groupId: gid,
        name: name,
        part: part,
        code: code,
        seq: seq,
        memo: memo,
    });

    ctx.state.code = 1;
    ctx.state.message = "创建成功";

    await next();
}

async function deleteTerm(ctx, next) {

    let id = ctx.params.id || '';

    const schema = Joi.object().keys({
        id: Joi.string().length(24).required()
    });

    const {error, value} = Joi.validate({
        id: id
    }, schema);
    
    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        return await next();
    }

    await CheckUpTermModel.delete({_id: id});

    ctx.state.code = 1;
    ctx.state.message = "删除成功";
    await next();
}

async function modifyTerm(ctx, next) {
    let id = ctx.params.id;
    let gid = ctx.request.body.gid;
    let name = ctx.request.body.name;
    let seq = ctx.request.body.seq;
    let part = ctx.request.body.part;
    let code = ctx.request.body.code;
    let isUse = ctx.request.body.isUse;
    let memo = ctx.request.body.memo;

    const schema = Joi.object().keys({
        id: Joi.string().length(24).required(),
        gid: Joi.string().length(24),
        name: Joi.string().min(2).max(10),
        part: Joi.number().integer().min(1).max(2),
        code: Joi.string().min(6).max(10).required(),
        isUse: Joi.number().integer().min(1).max(2),
        seq: Joi.number().integer().min(1).max(1000)
    });

    const {error, value} = Joi.validate({
        id: id,
        gid: gid,
        name: name,
        part: part,
        code: code,
        isUse: isUse,
        seq: seq
    }, schema);

    if  (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }
    
    let term = await CheckUpTermModel.getById({_id: id})
    if (term == null) {
        ctx.state.code = -1;
        ctx.state.message = "未找到该项目";
        throw new Error(ctx.state.message)
    }

    await CheckUpTermModel.update({_id: id}, {
        $set: {
            groupId: gid,
            name: name,
            part: part,
            code: code,
            isUse: isUse,
            seq: seq,
            memo: memo,
        }
    }, {});

    ctx.state.code = 1;
    ctx.state.message = "更新成功";
    await next();
}

async function getOneTerm(ctx, next) {

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

    let term = await CheckUpTermModel.getById(id);

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        term: term
    });
    
    await next();
}

async function getTerms(ctx, next) {
    // let terms = await CheckUpTermModel.getByQuery({}, '_id groupId part code name seq status', {sort: {seq: 1}});

    // ctx.state.code = 1;
    // ctx.state.data = Object.assign({}, ctx.state.data, {
    //     terms: terms || []
    // });
    // await next();

    let gid = ctx.params.gid;
    let count = ctx.query.count;
    let page = ctx.query.page;
    
    const schema = Joi.object().keys({
        gid: Joi.string().length(24).required(),
        count: Joi.number().min(1).max(100).required(),
        page: Joi.number().min(1).required(),
    });

    const {error, value} = Joi.validate({
        gid: gid,
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
        groupId: gid,
        status: 1
    };
    let terms = await CheckUpTermModel.getByQuery(query, '', opt);
    let total = await CheckUpTermModel.countByQuery(query);
   
    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        terms: terms || [],
        total: total
    });
    await next();
}

async function searchTerms(ctx, next) {

    let keywords = ctx.request.body.keywords
    let count = ctx.request.body.count
    let page = ctx.request.body.page

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
        name: new RegExp(keywords, "ig") ,
        status: 1
    };

    let terms = await CheckUpTermModel.getByQuery(query, '', opt)
    let total = await CheckUpTermModel.countByQuery(query);

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        terms: terms || [],
        total: total
    })
    await next()
}


module.exports = {createTerm, deleteTerm, getOneTerm, getTerms, modifyTerm, searchTerms}