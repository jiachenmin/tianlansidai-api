const Joi = require('joi');
const OrganizationModel = require('../../models/organization.js')
const _ = require('lodash')

async function createOrganization(ctx, next) {

    let name = ctx.request.body.name || ''
    let seq = ctx.request.body.seq
    let remark = ctx.request.body.remark || ''
    let parentId = ctx.request.body.parentId || null

    const schema = Joi.object().keys({
        name: Joi.string().min(2).max(10),
    });

    const { error, value } = Joi.validate({
        name: name,
    }, schema);

    if (error) {
        ctx.state.code = -1
        throw new Error(error)
    }

    let organization = await OrganizationModel.save({
        name: name,
        seq: seq,
        memo: remark,
        parentId: parentId
    })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        organization: organization
    })

    await next()
}

async function deleteOrganization(ctx, next) {

    let organizationId = ctx.params.id || '';

    const schema = Joi.object().keys({
        organizationId: Joi.string().length(24),
    });

    const { error, value } = Joi.validate({
        organizationId: organizationId,
    }, schema);
    
    if (error) {
        ctx.state.code = -1
        throw new Error(error)
    }

    await OrganizationModel.delete({ _id: organizationId })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
    })
    await next()
}


async function modifyOrganization(ctx, next) {

    let organizationId = ctx.params.id;
    let name = ctx.request.body.name || ''
    let seq = ctx.request.body.seq
    let remark = ctx.request.body.remark || ''

    const schema = Joi.object().keys({
        organizationId: Joi.string().length(24),
        name: Joi.string().min(2).max(10),
        seq: Joi.number().integer().min(1).max(1000),
    });

    const { error, value } = Joi.validate({
        organizationId: organizationId,
        name: name,
    }, schema);

    if (error) {
        ctx.state.code = -1
        throw new Error(error)
    }

    let organization = await OrganizationModel.getById({ _id: organizationId })
    if (organization == null) {
        ctx.state.code = -1
        ctx.state.message = "organization not found!"
        throw new Error(ctx.state.message)
    }
    
    await OrganizationModel.update({ _id: organizationId }, {
        $set: {
            name: name,
            seq: seq,
            memo: remark,
        }
    }, {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
    })
    await next()
}

async function findOrganization(ctx, next) {

    let organizationId = ctx.params.id;

    const schema = Joi.object().keys({
        organizationId: Joi.string().length(24),
    });

    const { error, value } = Joi.validate({
        organizationId: organizationId,
    }, schema);

    if (error) {
        ctx.state.code = -1
        throw new Error(error)
    }

    let organization = await OrganizationModel.getOneByQuery({ _id: organizationId, status: 1 }, '_id parentId name seq status remark', {})

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        organization: organization
    })

    await next()
}

async function findOrganizations(ctx, next) {

    let organizations = await OrganizationModel.getByQuery({ parentId: { $in: [''] } }, '_id parentId name seq status remark', { sort: { modifyAt: 1 } })

    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        organizations: organizations || []
    })
    await next()
}

async function organizationTrees(ctx, next) {

    let organizations = await OrganizationModel.getByQuery({ status: 1, parentId: null }, '_id parentId name seq status remark', { sort: { modifyAt: 1 } })
    let result = []
    for (let i = 0; i < organizations.length; i++) {
        let organization = organizations[i];
        let children = await OrganizationModel.getByQuery({ status: 1, parentId: organization._id }, '_id parentId name seq status remark', { sort: { modifyAt: 1 } })
        organization = JSON.parse(JSON.stringify(organization))
        organization.children = children
        result.push(organization)
    }
    ctx.state.code = 1
    ctx.state.data = Object.assign({}, ctx.state.data, {
        organizations: result || []
    })
    await next()
}


module.exports = { createOrganization, deleteOrganization, modifyOrganization, findOrganization, findOrganizations, organizationTrees }