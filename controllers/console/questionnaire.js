const Joi = require('joi');
const QuestionnaireModel = require('../../models/questionnaire');

async function createQuestionnaire(ctx, next) {

    let qid = ctx.request.body.qid;
    let name = ctx.request.body.name;
    let parentId = ctx.request.body.parentId;
    let memo = ctx.request.body.memo;

    const schema = Joi.object().keys({
        // qid: Joi.string().min(6).max(10),
        name: Joi.string().min(2).max(10).required()
    });

    const { error, value } = Joi.validate({
        // qid: qid,
        name: name
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    };
    
    let questionnaire = await QuestionnaireModel.save({
        qid: qid,
        name: name,
        parentId: parentId,
        memo: memo,
    });

    ctx.state.code = 1;
    ctx.state.message = "创建成功";
    ctx.state.data = Object.assign({}, ctx.state.data, {
        questionnaire: questionnaire
    })

    await next();
}

async function deleteQuestionnaire(ctx, next) {

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

    await QuestionnaireModel.delete({ _id: id });

    ctx.state.code = 1;
    ctx.state.message = "删除成功";
    await next();
}


async function modifyQuestionnaire(ctx, next) {

    let id = ctx.params.id;
    let qid = ctx.request.body.qid;
    let name = ctx.request.body.name;
    let parentId = ctx.request.body.parentId;
    let memo = ctx.request.body.memo;

    const schema = Joi.object().keys({
        id: Joi.string().length(24).required(),
        qid: Joi.string().min(6).max(10),
        name: Joi.string().min(2).max(10).required()
    });

    const { error, value } = Joi.validate({
        id: id,
        qid: qid,
        name: name
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let questionnaire = await QuestionnaireModel.getById({ _id: id })
    if (questionnaire == null) {
        ctx.state.code = -1;
        ctx.state.message = "未找到该问卷";
        throw new Error(ctx.state.message)
    }

    await QuestionnaireModel.update({ _id: id }, {
        $set: {
            qid: qid,
            name: name,
            parentId: parentId,
            memo: memo,
        }
    }, {});

    ctx.state.code = 1;
    ctx.state.message = "更新成功";
    await next();
}

async function getOneQuestionnaire(ctx, next) {

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

    let questionnaire = await QuestionnaireModel.getById(id);

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        questionnaire: questionnaire
    });

    await next();
}

async function getQuestionnaires(ctx, next) {

    let questionnaires = await QuestionnaireModel.getByQuery({status: 1}, '_id qid name status', { sort: { seq: 1 } });
    let total = await QuestionnaireModel.countByQuery({status: 1});

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        questionnaires: questionnaires || [],
        total: total
    });
    await next();
}


module.exports = { createQuestionnaire, deleteQuestionnaire, getOneQuestionnaire, getQuestionnaires, modifyQuestionnaire }