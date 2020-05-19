'use strict'
const path = require("path")
const mongoose = require('mongoose')
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js')
const ObjectId = mongoose.Schema.Types.ObjectId

class DB extends CommonDao {
    constructor(model) {
        super(model)
    }

    getSchema () {
        return Schema
    }

    getCollect () {
        let file = __filename.split(path.sep)
        file = file[file.length - 1].split('.')[0]
        return file//设定表名
    }

    getConn () {
        return dbconn.mongoConn
    }
}

const Schema = DB.SchemaExt({
    areaId: { type: ObjectId, ref: 'area' },                // 区域 ID
    territoryId: { type: ObjectId, ref: 'territory' },      // 区 ID
    provinceName: { type: String },                         // 省份
    provinceCode: { type: String },                         // 省份代码
    cityName: { type: String },                             // 城市
    cityCode: { type: String },                             // 城市代码
    districtName: { type: String },                         // 区
    districtCode: { type: String },                         // 区代码
    hospitalName: { type: String },                        // 医院
    hospitalCode: { type: String },                        // 医院代码
    location: {                                             // 位置
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true },
    },
    phone: { type: String, default: "" },                   // 手机号
    businessTime: { type: Object, default: {} },            // 业务时间
    address: { type: String, default: "" }                  // 地址
});

Schema.index({ location: '2dsphere' }, { background: true });

module.exports = new DB(null)