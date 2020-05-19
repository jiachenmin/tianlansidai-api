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
    regionCode: { type: String, unique: true }, 
    parentCode: { type: String },
    regionName: { type: String }, 
    open: { type: Boolean, default: false },
    hasSchool: { type: Boolean, default: false },
    
});

Schema.index({parentCode: 1})
Schema.index({regionName: 1})

Schema.index({open: 1})
Schema.index({hasSchool: 1})

module.exports = new DB(null);