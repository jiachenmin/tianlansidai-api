'use strict';
const path      = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn    = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

class Permission extends CommonDao {
    constructor(model) {
        super(model);
    }
    getSchema () {
        return Schema;
    }
    getCollect () {
        let file = __filename.split(path.sep);
        file     = file[file.length-1].split('.')[0];
        return file;//设定表名
    }
    getConn () {
        return dbconn.mongoConn;
    }
    /*
    getByQuery(query, fileds, opt, callbac){
        return this.model.find(query, fileds, opt).populate("resource").populate("role").exec();
    }
    */
}
const Schema = Permission.SchemaExt({
    permission: {type:Number},//-1 不可见，1 仅可见，2 可操作
    resource: {type:ObjectId,ref:'resource'},//资源id
    role:{type:ObjectId,ref:'role'},//赋予的角色
    businessStatus:{type:Number,default:1}//业务状态，1 新建，2 开启，-1 关闭
});
module.exports = new Permission(null);