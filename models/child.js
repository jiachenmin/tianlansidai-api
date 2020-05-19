'use strict';
const path = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
const config = require('../config');
const moment = require('moment');
const ObjectId = mongoose.Schema.Types.ObjectId;

class Child extends CommonDao {
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
        return this.model.find(query, fileds, opt).populate('schoolId').exec();
    }

    getOneByQueryPopulate(query, fileds, opt) {
        return this.model.findOne(query, fileds, opt).populate('schoolId').exec();
    }
}

const Schema = Child.SchemaExt({
    icon: {type: String},
    name: {type: String, default: "default"},
    gender: {type: Number},//1 male 2 female
    // studentCode: {type: String},
    identityCode: {type: String},
    gradeName: {type: String},
    className: {type: String},
    schoolId: {type: ObjectId, ref: "school"},
    parentId: [{
        type: ObjectId, ref: "user"
    }],
    qrcode: {type: Object},
    birthTime: {type: Date, default: null}
});

Schema.post('save', async function (one) {
    const Parent = require('./user');
    let result = await Parent.update({_id: one.parentId}, {
        $addToSet: {
            children: one._id
        }
    }, {});
});

Schema.post('findOneAndUpdate', async function (doc) {
    if (doc && doc.status == -1) {
        const Parent = require('./user');
        let result = await Parent.updateOne({_id: doc.parentId}, {
            $pull: {
                children: doc._id
            }
        }, {});
    }
});

Schema.index({parentId: 1})

module.exports = new Child(null);
