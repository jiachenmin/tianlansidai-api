'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

class InterventionType extends CommonDao {
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

const Schema = InterventionType.SchemaExt({
    name: {type: String, default: "default"},//名字
    number: {type: String},//编号
    businessStatus: {type: Number, default: 1},//1新建，2启用，3停用
    memo: {type: String, default:''},//备注
});
module.exports = new InterventionType(null);