const userModel = require('../../models/user.js')
const checkGroupModel = require('../../models/checkup_group.js')
const checkTermModel = require('../../models/checkup_term.js')
const resultModel = require('../../models/survey_result.js')
const childModel = require('../../models/child.js')
const moment = require('moment')
const doctorProxy = require('../../models/doctor.js')
const roomPersonProxy = require('../../models/room_person.js')
const Joi = require('joi')
const redis = require('../../models/index.js').redisConn

const LOG = require('../../common/log.js')

async function getCheckupGroups (ctx, next) {
    let groups = await checkGroupModel.getAll();
    if (!groups) {
        ctx.state.code = -1;
        ctx.state.message = "没有体检项目";
        throw new Error(error)
    }

    let sendGroups = [];
    groups.forEach(oneGroup => {
        let oneSend = {
            name: oneGroup.name,
            gid: oneGroup._id,
        };
        sendGroups = sendGroups.concat(oneSend);
    });

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        groups: sendGroups,
    });

    await next();
}

async function getAllCheckupTerm (ctx, next) {

    let ogTime = await redis.getAsync('allCheckupTerm:time')
    if (!ogTime) {
        await redis.setAsync('allCheckupTerm:time', JSON.stringify({ time: new Date().getTime() }), 'EX', 30)
    } else {
        let outGroups = JSON.parse(await redis.getAsync('allCheckupTerm:data'))
        if (!outGroups) outGroups = []

        ctx.state.code = 1;
        ctx.state.data = Object.assign({}, ctx.state.data, {
            groups: outGroups
        });
        return await next()
    }
    let groups = await checkGroupModel.getByQuery({}, '', { sort: { seq: 1 } });
    if (!groups) {
        ctx.state.code = -1;
        ctx.state.message = "没有体检项目";
        throw new Error(error)
    }
    let outGroups = []
    for (let i = 0; i < groups.length; i++) {
        let oneGroup = groups[i]
        let allTerms = await checkTermModel.getByQuery({ groupId: oneGroup._id, isUse: 1 }, 'name', { sort: { seq: 1, part: -1 } })
        let termNames = new Set([])
        for (let p = 0; p < allTerms.length; p++) {
            termNames.add(allTerms[p].name)
        }
        let outTg = []
        for (let name of termNames) {
            let terms = await checkTermModel.getByQuery({ name: name, groupId: oneGroup._id }, 'name value part memo', { sort: { seq: 1, part: -1 } })
            terms = terms.map((term) => {
                return {
                    name: (() => {
                        if (term.part == 1) return "左眼"
                        if (term.part == 2) return "右眼"
                        return ""
                    })(),
                    value: term._id,
                    memo: term.memo.trim() ? JSON.parse(term.memo.trim()) : ""
                }
            })
            outTg.push({
                name: name,
                value: terms
            })
        }

        outGroups.push({
            id: oneGroup._id,
            name: oneGroup.name,
            value: outTg
        })
    }

    await redis.setAsync('allCheckupTerm:data', JSON.stringify(outGroups))

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        groups: outGroups
    });

    await next();
}

async function getCheckupTermByGroup (ctx, next) {
    let gid = ctx.params.gid;

    const schema = Joi.object().keys({
        gid: Joi.string().length(24),
    });

    const { error, value } = Joi.validate({
        gid: gid
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    let group = await checkGroupModel.getById({ _id: gid });
    if (!group) {
        ctx.state.code = -1;
        ctx.state.message = "没有该体检项目";
        throw new Error(error)
    }

    let termIds = group.terms;

    let termGroups = await checkTermModel.distinct({ groupId: { $in: termIds }, isUse: 1 }, 'name');
    // console.log(termGroups);

    let terms = await checkTermModel.getByQuery({ groupId: { $in: termIds }, isUse: 1 }, '', { sort: { seq: 1 } });
    let outTg = [];
    (termGroups || []).forEach(oneTg => {
        let outTerms = [];
        (terms || []).forEach(oneTerm => {
            if (oneTg == oneTerm.name) {
                let name = "";
                switch (oneTerm.part) {
                    case 1:
                        name = "左眼";
                        break;
                    case 2:
                        name = "右眼";
                        break;
                }
                let termObj = {
                    name: name,
                    value: oneTerm._id,
                };
                outTerms = outTerms.concat(termObj);
            }
        });
        let tgObj = {
            name: oneTg,
            value: outTerms
        }
        outTg = outTg.concat(tgObj);
    });
    let outGroup = {
        name: group.name,
        value: outTg
    };

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        group: outGroup
    });

    await next();
}

async function checkupCommit (ctx, next) {
    let user = ctx.state.user //|| { _id: "5ca496e6deaea140b4a5eecc", phone: "18511982106" }
    let childId = ctx.request.body.childId;
    let checkType = ctx.request.body.checkType; // 1.学校普查，2.小屋体检->改到别的接口了！
    let surveyMission = ctx.request.body.mission; // 1.时必填
    let roomId = ctx.request.body.roomId; // 2.时必填
    let results = ctx.request.body.result; // {key: value ...}, key: termId, value:number
    let checkupGroupId = ctx.request.body.checkupGroupId;
    let submitter;

    const schema = Joi.object().keys({
        childId: Joi.string().length(24).required(),
        checkupGroupId: Joi.string().length(24).required(),
        checkType: Joi.number().valid(1, 2).required(),
    });

    const { error, value } = Joi.validate({
        childId: childId,
        checkType: checkType,
        checkupGroupId: checkupGroupId,
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }
    /*
    for (let temkey in results) {
        if (!results[temkey] && results[temkey] != 0) {
            delete results[temkey]
        }
    }
    */
    /*
    for (let temkey in results){
        if(results[temkey].trim() == ""){
            delete results[temkey]
        }
    }
    */
    if (Object.keys(results).length == 0) {
        ctx.state.code = 4;
        ctx.state.message = "检查不能结果为空";
        throw new Error("检查不能结果为空")
    }
    let doctorOrroomPerson = null;
    if (1 == checkType) {
        doctorOrroomPerson = await doctorProxy.getOneByQuery({ phone: user.phone })
    } else {
        doctorOrroomPerson = await roomPersonProxy.getOneByQuery({ phone: user.phone })
    }
    if (null == doctorOrroomPerson) {
        ctx.state.code = 4;
        ctx.state.message = "不具有提交权限";
        throw new Error("不具有提交权限")
    }
    submitter = doctorOrroomPerson._id

    let nowS = new Date().getTime();
    let toSave = [];
    let resKeys;

    // switch (checkType) {
    //     case 1:
    if (!surveyMission) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }
    const schema1 = Joi.object().keys({
        surveyMission: Joi.string().length(24),
    });

    const { error1, value1 } = Joi.validate({
        surveyMission: surveyMission,
    }, schema1);

    if (error1) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    let date1 = moment().subtract(1, 'days').toDate();
    let dbResult = await resultModel.getOneByQuery({ surveyMission: surveyMission, child: value.childId }, '', {});
    resKeys = Object.keys(results);
    resKeys.forEach(oneKey => {
        let oneRes = {
            checkupGroup: value.checkupGroupId,
            checkupTerm: oneKey,
            value: results[oneKey],
            doctor: submitter,
        };
        toSave = toSave.concat(oneRes);
    });
    if (!dbResult) {
        await resultModel.save({
            type: checkType,
            surveyMission: surveyMission,
            child: childId,
            result: toSave,
        });
    } else {
        let hasChecked = dbResult.result
        let hasCheckedTermIds = []
        hasChecked.forEach(function (item) {
            hasCheckedTermIds.push(item.checkupTerm.toString())
        })
        toSave.forEach(function (current) {
            let index = hasCheckedTermIds.indexOf(current.checkupTerm.toString())
            if (-1 == index) {
                hasChecked.push(current)
            } else {
                hasChecked[index].checkupGroup = current.checkupGroup
                hasChecked[index].checkupTerm = current.checkupTerm
                hasChecked[index].value = current.value
                hasChecked[index].doctor = current.doctor
            }
        })
        await resultModel.updateOne({ _id: dbResult._id }, {
            $set: {
                result: hasChecked,
            }
        }, {})
    }
    //         break;

    //     case 2:
    //         roomId = doctorOrroomPerson.roomId;
    //         if (!roomId) {
    //             ctx.state.code = 4;
    //             ctx.state.message = "参数错误";
    //             throw new Error(error)
    //         }
    //         const schema2 = Joi.object().keys({
    //             roomId: Joi.string().length(24),
    //         });

    //         const { error2, value2 } = Joi.validate({
    //             roomId: roomId,
    //         }, schema2);

    //         if (error2) {
    //             ctx.state.code = 4;
    //             ctx.state.message = "参数错误";
    //             throw new Error(error)
    //         }

    //         let dbResultRoom = await resultModel.getByQuery({ childId: childId, roomId: roomId, creeateTime: { $gte: date1, $lt: new Date() } }, '', {});
    //         resKeys = Object.keys(results);
    //         resKeys.forEach(oneKey => {
    //             let oneRes = {
    //                 checkupGroup:value.checkupGroupId,
    //                 checkupTerm: oneKey,
    //                 value: results[oneKey],
    //                 staff: submitter,
    //             };
    //             toSave = toSave.concat(oneRes);
    //         });
    //         if (!dbResultRoom) {
    //             await resultModel.save({
    //                 type: checkType,
    //                 roomId: roomId,
    //                 child: childId,
    //                 result: toSave,
    //             });
    //         } else {
    //             // toSave = toSave.concat(dbResultRoom.result);
    //             // await resultModel.updateOne({ _id: dbResultRoom._id }, {
    //             //     $set: {
    //             //         result: toSave,
    //             //     }
    //             // }, {})
    //             ctx.state.code = -1;
    //             ctx.state.message = "今日检查已提交";
    //             throw new Error(error)
    //         }
    //         break;
    // }

    ctx.state.code = 1;
    ctx.state.message = "提交成功";

    await next();
}

async function checkupCommitRoom (ctx, next) {
    let user = ctx.state.user //|| { _id: "5ca496e6deaea140b4a5eecc", phone: "18511982106" }
    let childId = ctx.request.body.childId;
    let results = ctx.request.body.result;
    let submitter;

    const schema = Joi.object().keys({
        childId: Joi.string().length(24).required(),
    });

    const { error, value } = Joi.validate({
        childId: childId,
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }
    if (Object.keys(results).length == 0) {
        ctx.state.code = 4;
        ctx.state.message = "检查不能结果为空";
        throw new Error("检查不能结果为空")
    }

    let doctorOrroomPerson = await roomPersonProxy.getOneByQuery({ phone: user.phone })

    if (null == doctorOrroomPerson) {
        ctx.state.code = 4;
        ctx.state.message = "不具有提交权限";
        throw new Error("不具有提交权限")
    }
    submitter = doctorOrroomPerson._id

    let nowS = new Date().getTime();
    let toSave = [];
    let resKeys;


    roomId = doctorOrroomPerson.roomId;
    if (!roomId) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    let date1 = moment().subtract(1, 'days').toDate();
    let dbResultRoom = await resultModel.getOneByQuery({ child: childId, roomId: roomId, createAt: { $gte: date1, $lt: new Date() } }, '', {});
    resKeys = Object.keys(results);
    resKeys.forEach(oneKey => {
        let tmp = oneKey.split('-');
        let oneRes = {
            checkupGroup: tmp[0],
            checkupTerm: tmp[1],
            value: results[oneKey],
            staff: submitter,
        };
        toSave = toSave.concat(oneRes);
    });
    if (!dbResultRoom) {
        await resultModel.save({
            type: 2,
            roomId: roomId,
            child: childId,
            result: toSave,
            businessStatus: 5
        });

        ctx.state.code = 1;
        ctx.state.message = "提交成功";

    } else {
        // toSave = toSave.concat(dbResultRoom.result);
        await resultModel.updateOne({ _id: dbResultRoom._id }, {
            $set: {
                result: toSave,
            }
        }, {})
        ctx.state.code = 1;
        ctx.state.message = "今日检查已提交，本次提交更新数据";
        // throw new Error(error)
    }

    await next();
}

async function staffCheckups (ctx, next) {
    let count = ctx.query.count
    let page = ctx.query.page

    const schema = Joi.object().keys({
        count: Joi.number().default(10).min(10).max(100).required(),
        page: Joi.number().default(1).min(1).max(100).required(),
    });

    const { error, value } = Joi.validate({
        count: count,
        page: page
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    }

    let opt = {
        limit: value.count,
        skip: (value.page - 1) * value.count,
        createAt: { seq: -1 }
    }

    let user = ctx.state.user || { _id: "5ca496e6deaea140b4a5eecc", phone: "18511982106" }

    let staff = await roomPersonProxy.getOneByQuery({ phone: user.phone })

    if (null == staff) {
        ctx.state.code = 4;
        ctx.state.message = "抱歉，您不是小屋的工作人员";
        throw new Error("Sorry, You're not a room staff.")
    }

    let submitter = staff._id;

    let resultList = await resultModel.getByQuery({ result: { $elemMatch: { staff: submitter } } }, '', opt);
    let res = [];
    //-------------------处理体检结果   start--------------------//
    for (let j = 0; j < resultList.length; j++) {
        let returnCheckResult = []
        let checkresult = {}
        let surveyResultSaved = resultList[j];
        // let surveyResultSaved = await surveyResultProxy.getOneByQueryPopulate({
        //     child: value.child,
        //     surveyMission: value.surveyMission
        // })
        if (!surveyResultSaved) {
            ctx.state.code = 4;
            ctx.state.message = "检查结果未提交!"
            throw new Error("检查结果未提交!")
        }
        let resultObj = {}
        let terms = await checkTermModel.getAll();

        for (let i = 0; i < surveyResultSaved.result.length; i++) {
            let oneCheck = surveyResultSaved.result[i]
            checkresult[oneCheck.checkupTerm] = oneCheck.value
            // let termObj = await checkTermModel.getOneByQueryPopulate({ _id: oneCheck.checkupTerm })
            let termObj = getTerm(oneCheck.checkupTerm, terms)
            if (!termObj) {
                returnCheckResult.push({
                    time: moment(surveyResultSaved.createAt).format("YYYY年MM月DD日"),
                    checkType: surveyResultSaved.type,
                    childId: surveyResultSaved.child._id,
                    childName: surveyResultSaved.child.name,
                    value: oneCheck.value
                })
            } else {
                returnCheckResult.push({
                    time: moment(surveyResultSaved.createAt).format("YYYY年MM月DD日"),
                    checkType: surveyResultSaved.type,
                    childId: surveyResultSaved.child._id,
                    childName: surveyResultSaved.child.name,
                    checkupGroupId: termObj.groupId._id,
                    checkupTermId: termObj._id,
                    checkupGroupName: termObj.groupId.name,
                    checkupTermName: termObj.name,
                    checkupTermPart: termObj.part,
                    value: oneCheck.value
                })
            }
        }


        returnCheckResult.forEach(function (item) {
            if (item.checkupTermName) {
                if (!resultObj[item.checkupTermName]) {
                    resultObj[item.checkupTermName] = []
                }
                resultObj[item.checkupTermName].push({
                    checkupTermName: item.checkupTermName,
                    checkupTermPart: item.checkupTermPart,
                    value: item.value
                })
            }
        })

        let resultArr = []
        for (let key in resultObj) {
            let left = 0.0;
            let right = 0.0;
            resultObj[key].forEach((s) => {
                if (s.checkupTermPart == 1) {
                    left = s.value;
                }
                if (s.checkupTermPart == 2) {
                    right = s.value;
                }
            })
            resultArr.push({
                checkupTermName: key,
                values: resultObj[key],
                left: left,
                right: right
            })
        }

        // console.log("=================>" + surveyResultSaved.child);
        let child = await childModel.getById({ _id: surveyResultSaved.child });
        let tmpObj = {};
        if (!child) {
            // 为了应付测试数据，实际应该走不到这里！

            await LOG.Info({
                message: 'In staffCheckups child is null!',
                method: String(ctx.method),
                // start: String(start),
                // uuid: String(uuid),
                originalUrl: String(ctx.originalUrl),
                query: JSON.stringify(ctx.request.query || {}),
                requestBody: JSON.stringify(ctx.request.body || {}),
            }, [{ 'fileName': __filename, 'httpType': 'request' }])

            tmpObj = {
                time: moment(surveyResultSaved.createAt).format("YYYY年MM月DD日"),
                // suggestion: finalInterventionPlan,
                checkResult: resultArr,
                // parentName: [],
                // parentPhone: [],
                childName: null,
                checkupType: 2
            }
        } else {
            // let parents = await userModel.getByQuery({ _id: { $in: child.parentId } });
            // let parentName = [], parentPhone = [];
            // for (let p = 0; p < parents.length; p++) {
            //     const one = parents[p];
            //     parentName.push(one.nickName);
            //     parentPhone.push(one.phone);
            // }
            tmpObj = {
                time: moment(surveyResultSaved.createAt).format("YYYY年MM月DD日"),
                // suggestion: finalInterventionPlan,
                checkResult: resultArr,
                // parentName: parentName,
                // parentPhone: parentPhone,
                childName: child.name,
                checkupType: 2
            }
        }
        res.push(tmpObj);
    }
    //-------------------处理体检结果   end--------------------//

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        results: res
    });

    await next();
}

function getTerm (termId, terms) {
    // console.log(terms.length+"------------"+termId);
    for (let index = 0; index < terms.length; index++) {
        const element = terms[index];
        if (element._id.toString() == termId.toString()) {
            return element
        }
    }
    return null
}

module.exports = { getCheckupGroups, getAllCheckupTerm, getCheckupTermByGroup, checkupCommit, checkupCommitRoom, staffCheckups }