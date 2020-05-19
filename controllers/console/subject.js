const Joi = require('joi');
const SubjectModel = require('../../models/subject')

async function createSubject(ctx, next) {

    let qid = ctx.request.body.qid;
    let sid = ctx.request.body.sid;
    let code = ctx.request.body.code;
    let question = ctx.request.body.question;
    let stype = ctx.request.body.stype;
    let options = ctx.request.body.options;
    let memo = ctx.request.body.memo;
    let isMust = ctx.request.body.isMust;

    const schema = Joi.object().keys({
        qid: Joi.string().length(24)
    })

    const { error, value } = Joi.validate({
        qid: qid
    }, schema)

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    let subject = await SubjectModel.save({
        qid: qid,
        sid: sid,
        code: code,
        question: question,
        stype: stype,
        options: options,
        memo: memo,
        isMust: isMust,
    })

    ctx.state.code = 1
    ctx.state.message = "创建成功"
    ctx.state.data = Object.assign({}, ctx.state.data, {
        subject: subject
    })
    await next()
}

async function deleteSubject(ctx, next) {

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

    await SubjectModel.delete({ _id: id });

    ctx.state.code = 1;
    ctx.state.message = "删除成功";
    await next();
}

async function modifySubject(ctx, next) {

    let id = ctx.params.id;
    let qid = ctx.request.body.qid;
    let sid = ctx.request.body.sid;
    let code = ctx.request.body.code;
    let question = ctx.request.body.question;
    let stype = ctx.request.body.stype;
    let options = ctx.request.body.options;
    let isUse = ctx.request.body.isUse;
    let memo = ctx.request.body.memo;
    let isMust = ctx.request.body.isMust;

    const schema = Joi.object().keys({
        id: Joi.string().length(24).required(),
        qid: Joi.string().length(24),
        isUse: Joi.number().integer().min(1).max(2)
    });

    const { error, value } = Joi.validate({
        id: id,
        qid: qid,
        isUse: isUse
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    let subject = await SubjectModel.getById({ _id: id })
    if (subject == null) {
        ctx.state.code = -1;
        ctx.state.message = "未找到该问题";
        throw new Error(ctx.state.message)
    }

    await SubjectModel.update({ _id: id }, {
        $set: {
            qid: qid,
            sid: sid,
            code: code,
            question: question,
            stype: stype,
            options: options,
            isUse: isUse,
            memo: memo,
            isMust: isMust,
        }
    }, {});

    ctx.state.code = 1;
    ctx.state.message = "更新成功";
    await next();
}

async function getOneSubject(ctx, next) {

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

    let subject = await SubjectModel.getById(id);

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        subject: subject
    });

    await next();
}

async function getSubjects(ctx, next) {
    // let terms = await SubjectModel.getByQuery({}, '_id groupId part code name seq status', {sort: {seq: 1}});

    // ctx.state.code = 1;
    // ctx.state.data = Object.assign({}, ctx.state.data, {
    //     terms: terms || []
    // });
    // await next();

    let qid = ctx.params.qid;
    let count = ctx.query.count;
    let page = ctx.query.page;

    const schema = Joi.object().keys({
        qid: Joi.string().length(24).required(),
        count: Joi.number().min(1).max(100).required(),
        page: Joi.number().min(1).required(),
    });

    const { error, value } = Joi.validate({
        qid: qid,
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
        sort: { seq: 1 }
    };
    let subjects = await SubjectModel.getByQuery({ qid: qid }, '', opt);

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        subjects: subjects || []
    });
    await next();
}

async function searchSubjects(ctx, next) {

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

    let subjects, query, total;
    if (Number.isInteger(keywords)) {
        query = {
            sid: new RegExp(keywords, "i"),
            status: 1
        };
        subjects = await SubjectModel.getByQuery(query, '', opt);
        total = await SubjectModel.countByQuery(query);
    } else {
        query = {
            question: new RegExp(keywords, "i"),
            status: 1
        };
        subjects = await SubjectModel.getByQuery(query, '', opt);
        total = await SubjectModel.countByQuery(query);
    }

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        subjects: subjects || [],
        total: total
    })
    await next()
}



module.exports = { createSubject, deleteSubject, getOneSubject, getSubjects, modifySubject, searchSubjects }