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
    getById (id = MissingParameter()) {
        return this.model.findOne({_id: id}).populate({
            path: 'children',
            match: { status: 1 },
            select: '',
            options: {sort: { name: 1 }},
            populate: {
                path: 'children',
                match: { status: 1 },
                select: '',
                options: {sort: { name: 1 }},
                populate: {
                    path: 'children',
                    match: { status: 1 },
                    select: '',
                    options: {sort: { name: 1 }},
                }
            }
        }).exec();
    }
    getByQuery(query, fileds, opt) {
        return this.model.find(query, fileds, opt).populate({
            path: 'children',
            match: { status: 1 },
            select: '',
            options: {sort: { name: 1 }},
            populate: {
                path: 'children',
                match: { status: 1 },
                select: '',
                options: {sort: { name: 1 }},
                populate: {
                    path: 'children',
                    match: { status: 1 },
                    select: '',
                    options: {sort: { name: 1 }},
                }
            }
        }).exec();
    }
}
const Schema = DB.SchemaExt({
    name: { 
        type: String, 
        default: '', 
        required: [true, 'area name required'],
    }, // 中文名称
    code: { type: String }, // 英文编号
    parentId: { type: ObjectId, default: null, ref: 'area' },
    children: [{ type: ObjectId, ref: 'area' }],
});

Schema.post('save', async function(doc) {
    
    if (doc && doc.parentId) {
        const areaModel = require('./area')
        await areaModel.updateOne({_id: doc.parentId}, {
            $addToSet: {
                children: doc._id
            }
        }, {})
    }
});

// delete
Schema.post('findOneAndUpdate', async function(doc) {
    if (doc && doc.status == -1 && doc.parentId) {
       const areaModel = require('./area')
       await areaModel.updateOne({_id: doc.parentId}, {
           $pull: {
               children: doc._id
           }
       }, {})
    }
});



module.exports = new DB(null);