'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

class Resource extends CommonDao {
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
}

const Schema = Resource.SchemaExt({
    organizationId: {type: String, default: ""},
    name: {type: String, default: ""},
    seq: {type: String, default: ""},
    phone: {type: String, default: ""},
    password: {type: String, default: ""},
    email: {type: String, default: ""},
    remark: {type: String, default: ""},
    isLock: {type: Number, default: 2},
    role: [{type: ObjectId, ref: "role"}],//用户角色
    businessStatus: {type: Number, default: 1},//-1 已停用，1 新创建，2 启用
    access: {type: Object, default: {}},

});
module.exports = new Resource(null);