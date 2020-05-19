const moment = require('moment');
const Crypto = require("crypto");
const config = require('../../config.js');
const Joi = require('joi');
const adminModel = require('../../models/admin.js')
const jwt = require('jsonwebtoken');

async function login(ctx, next) {

    var username = ctx.request.body.username
    var password = ctx.request.body.password

    const schema = Joi.object().keys({
        username: Joi.string().required(),
        password: Joi.string().required()
    });

    const { error, value } = Joi.validate({
        username: username,
        password: password
    }, schema);

    if (error) {
        ctx.state.code = -1
        throw new Error(error)
    }

    let admin = await adminModel.getOneByQuery({ phone: username, password: password }, '');
    if (admin == null) {
        ctx.state.code = 4;
        ctx.state.message = "账号或密码错误";
        throw new Error(ctx.state.message)
    }

    let content = {
        _id: admin._id
    }
    let token = jwt.sign(content, config.jwt.secret, {
            expiresIn: config.jwt.expires
        });

    ctx.state.code = 0;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        token: token,
        expires: config.jwt.expires,
        admin: admin || {}
    })

    await next()
}

async function validation(ctx, next) {
    
    let token = ctx.request.body.token|| ctx.request.query.token || ctx.req.headers["x-access-token"]

    if (!token) {
        ctx.state.code = 4;
        throw new Error("token not found!")   
    }

    const schema = Joi.object().keys({
        token: Joi.string(),
    });

    var { error, value } = Joi.validate({
        token: token,
    }, schema);

    if (error) {
        ctx.state.code = -1
        ctx.state.message = error
        throw new Error(error)
    }

    let decoded = await jwt.verify(token, config.jwt.secret)
    ctx.state._id = decoded._id
    ctx.state.iat = decoded.iat
    ctx.state.exp = decoded.exp

    await next()
}

async function logout(ctx, next) {
    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
    })
}

module.exports = { login, validation, logout }
 