'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

class DB extends CommonDao {
    constructor(model) {
        super(model);
    }

    getSchema() {
        return Schema;
    }

    getCollect() {
        let file = __filename.split(path.sep);
        file = file[file.length - 1].split('.')[0];
        return file;//设定表名
    }

    getConn() {
        return dbconn.mongoConn;
    }


    listAllByQuery(query, fileds, opt) {
        // opt = {limit: count, skip: (page - 1) * count}
        return this.model.find(query, fileds, opt).exec();
    }

    getByQuery(query, fileds, opt, callback) {
        return this.model.find(query, fileds, opt).populate({
            path: 'coupons',
            match: { status: 1 }
        }).exec();
    }
}

const Schema = DB.SchemaExt({
    openId: { type: String, default: "", unique: true },
    nickName: { type: String, default: "" },
    gender: { type: Number },
    language: { type: String, default: "" },
    city: { type: String, default: "" },
    province: { type: String, default: "" },
    country: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    sessionKey: { type: String, default: "" },
    watermark: { type: Object },
    lastVisitTime: { type: Date },
    unionId: { type: String, default: "" },
    skey: { type: String, default: "" },
    phone: { type: String, alias: 'telNo', default: "" },
    coupons: [{ type: ObjectId, ref: 'coupon_instance' }],
    children: [{ type: ObjectId, ref: 'child' }],
    // TLSD普查报告小程序
    openId_wx91bf0f7a528dafe5: { type: String, default: "", unique: true },
    

    sessionKey_wx91bf0f7a528dafe5: { type: String, default: "" },
    skey_wx91bf0f7a528dafe5: { type: String, default: "" },
    lastVisitTime_wx91bf0f7a528dafe5: { type: Date },
    //天蓝丝带公众号
    openId_wxb5d799965c32b6af: { type: String, default: "", unique: true },
    subscribe: {type: Number, default: 0},
    subscribeTime: {type: Date, default: Date.now}
});

module.exports = new DB(null);