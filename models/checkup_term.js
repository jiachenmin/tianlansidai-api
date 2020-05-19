'use strict';
const path      = require("path");
const mongoose = require('mongoose');
const CommonDao = require('./commondao.js')
const dbconn    = require('./index.js');
const MissingParameter = require('../common/errorhandler.js').MissingParameter;
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

    getOneByQueryPopulate(query, fileds, opt) {
        return this.model.findOne(query, fileds, opt).populate("groupId").exec();
    }

    // async create (doc = MissingParameter()) {
    //     let self = this
    //     const session = await dbconn.mongoConn.startSession()
    //     session.startTransaction();
    //     let createResult = await this.model.create([doc], {session})
    //     await session.commitTransaction();
    //     session.endSession();
    //     return createResult
    // }
}
const Schema = DB.SchemaExt({
    groupId: {type: ObjectId, ref: 'checkup_group' }, // 体检项目组 ID
    part: {type: Number, default:1},
    seq: {type: Number, default:1},
    code: {type: String, default: ''},
    name: {type: String, default: ''},
    isUse: {type: Number, default:1},
    memo: {type: String, default:''},
});

Schema.index({name: 1})
Schema.index({groupId: 1})
Schema.index({isUse: 1})
Schema.index({seq: 1, part: 1})

Schema.post('save', async function(one) {
    const CheckUpGroup = require('./checkup_group');
    let result = await CheckUpGroup.update({_id: one.groupId}, {
        $addToSet: {
            terms: one._id
        }
    }, {});
});

Schema.post('findOneAndUpdate', async function(doc) {
    if (doc && doc.status == -1) {
       const CheckUpGroup = require('./checkup_group');
    //    console.log(doc._id)
       let result = await CheckUpGroup.updateOne({_id: doc.groupId}, {
           $pull: {
               terms: doc._id
           }
       }, {});
    }
});

module.exports = new DB(null);