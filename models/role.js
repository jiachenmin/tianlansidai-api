'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

class Role extends CommonDao {
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

    getByQueryPopulate(query, fileds, opt) {
        return this.model.find(query, fileds, opt).populate('parent').populate('child').exec();
    }
}

const Schema = Role.SchemaExt({
    name: {type: String, default: "default"},//角色名字
    number: {type: String, default: ""},//角色编号
    child: [{type: ObjectId, ref: "role"}],//子角色
    parent: {type: ObjectId, ref: "role"},//父角色
    memo: {type: String, default: ""},//备注
});
module.exports = new Role(null);