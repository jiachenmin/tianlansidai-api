'use strict';
const path      = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn    = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

class DB extends CommonDao {
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



const Schema = DB.SchemaExt({
    areaId: { type: ObjectId, ref: 'area' }, // 区域 ID
    territoryId: { type: ObjectId, ref: 'territory' }, // 运营区ID
    provinceName: {type: String}, // 省份
    provinceCode: {type: String}, // 省份代码
    cityName: {type: String}, // 城市
    cityCode: {type: String}, // 城市代码
    districtName: { type: String }, // 行政区
    districtCode: { type: String }, // 行政区代码
    schoolName: {type: String}, // 学校
    schoolCode: {type: String}, // 学校代码
    schoolStage: {type: Number, default: 3, enum:[3,4,5]}, // 1.学前/2.幼儿园/3.小学/4.初中/5.高中/6.大学
    location: {
        type: {
          type: String,
          enum: ['Point'],
        },
        coordinates: {
          type: [Number],
        },
      }
});

Schema.index({ location: '2dsphere' }, {background : true});

module.exports = new DB(null);