'use strict'
const path = require("path")
const mongoose = require('mongoose')
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js')
const MissingParameter = require('../common/errorhandler.js').MissingParameter
const config = require('../config')
const moment = require('moment')
const ObjectId = mongoose.Schema.Types.ObjectId

class DB extends CommonDao {
    constructor(model) {
        super(model)
    }

    getSchema() {
        return Schema
    }

    getCollect() {
        let file = __filename.split(path.sep)
        file = file[file.length - 1].split('.')[0]
        return file//设定表名
    }

    getConn() {
        return dbconn.mongoConn
    }
}

const Schema = DB.SchemaExt({
    areaId: {type: ObjectId, ref: 'area'}, // 区域 ID
    territoryId: {type: ObjectId, ref: 'territory'}, // 区 ID
    provinceName: {type: String}, // 省份
    provinceCode: {type: String}, // 省份代码
    cityName: {type: String}, // 城市
    cityCode: {type: String}, // 城市代码
    districtName: {type: String}, // 区
    districtCode: {type: String}, // 区代码
    roomName: {type: String}, // 小屋
    roomCode: {type: String}, // 小屋代码
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        },
    },
    phone: {type: String, default: ""},
    businessTime: {type: String, default: ""},
    address: {type: String, default: ""}
});

Schema.index({location: '2dsphere'}, {background: true});

module.exports = new DB(null)