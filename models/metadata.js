'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

class Metadata extends CommonDao {
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

const Schema = Metadata.SchemaExt({
    name: {type: String, default: "default"},//名字
    number: {type: String, unique: true},//编号
    typeId: {type: String},//类型id
    content: {type: String},//内容
    businessStatus: {type: Number, default: 1}//业务状态，1 新建，2 开启，-1 关闭
});
module.exports = new Metadata(null);
