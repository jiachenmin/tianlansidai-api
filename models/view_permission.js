'use strict';
const path      = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn    = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

/*
* 视图创建语句
* db.createView("view_permissions","permissions",[{$lookup:{from:"resources",localField:"resource",foreignField:"_id",as:"resource"}}])
* */

class View_permission extends CommonDao {
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
}
const Schema = View_permission.SchemaExt({
    permission: {type:Number},//-1 不可见，1 仅可见，2 可操作
    resource: {type:Object},
    role:{type:ObjectId,ref:'role'},
    businessStatus:{type:Number,default:1}//业务状态，1 新建，2 开启，-1 关闭
});
module.exports = new View_permission(null);