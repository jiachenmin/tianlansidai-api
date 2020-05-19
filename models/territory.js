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

    // async create (doc = MissingParameter()) {
    // let self = this
    // const session = await dbconn.mongoConn.startSession()
    // session.startTransaction();
    // let createResult = await this.model.create([doc], {session})
    // await require('./area').update({_id: doc.areaId}, {
    //     $push
    // })
    // await session.commitTransaction();
    // session.endSession();
    // return createResult
    // }
}
const Schema = DB.SchemaExt({
    areaId: { type: ObjectId, ref: 'area' }, // 区域 ID
    provinceName: { type: String }, // 省份
    provinceCode: { type: String }, // 省份代码
    cityName: { type: String }, // 城市
    cityCode: { type: String }, // 城市代码
    districtName: { type: String }, // 区
    districtCode: { type: String }, // 区代码
})

module.exports = new DB(null)
