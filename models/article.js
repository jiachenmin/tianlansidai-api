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
    columnId: {type: ObjectId, default: null, ref: "column"},
    title: {type: String, default: ""},
    code: {type: String, default: ""},
    html: {type: String, default: ""},
    imageUrl: {type: String, default: ""},
    resume: {type: String, default: ""},
    businessStatus: {type: Number, default: 1}//业务状态，1-新建 2-开启 3-关闭
});
module.exports = new Resource(null);