const userModel = require('../../models/user.js')
const smsManager = require('../../common/sms.js')
const doctorModel = require('../../models/doctor.js')
const staffModel = require('../../models/room_person.js')
const childModel = require('../../models/child.js')
const questionnaireModel = require('../../models/questionnaire.js')
const subjectModel = require('../../models/subject.js')
const schoolModel = require('../../models/school.js')
const metadataModel = require('../../models/metadata.js')

const Joi = require('joi')
const mongoose = require('mongoose')

const CodeLength = 6; // 验证码默认长度
const CodeWords = "0845216397"; // 验证码默认构成字符串
const CodeTime = 60; // 验证码有效时间，秒 

let templateCodes = {
    registe: 'SMS_162710069', // 用户注册验证码
}

async function gainVerifyCode(ctx, next) {
    let telNo = ctx.params.telNo;
    let user = ctx.state.user;

    // 1.先对爪机号做下简单验证
    const schema = Joi.object().keys({
        telNo: Joi.string().length(11).regex(/^1[3|4|5|7|8][0-9]{9}$/).required(),
    });

    const { error, value } = Joi.validate({
        telNo: telNo
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }

    // 2.生成验证码并绑定用户
    let tmpData = user.addData;
    let sendParam = code = ct = null;
    let nowS = new Date().getTime();
    // 2.1. 如果在限时内再次获取给同一个，超过给新的
    if (!tmpData || (tmpData.codeTime + CodeTime > nowS)) {
        code = getCode();
        ct = nowS;
    } else {
        code = tmpData.code;
        ct = tmpData.codeTime;
    }

    // 3.发送短信
    sendParam = {
        PhoneNumbers: telNo,
        TemplateCode: templateCodes['registe'],
        TemplateParam: { code: code },
    };
    let sendResult = await smsManager.sendSms(sendParam);

    // 4.在user上追加临时数据
    user = Object.assign(user, {
        addData: {
            telNo: telNo,
            code: code,
            codeTime: ct,
        }
    });
    ctx.state.user = user;

    await next();
}

async function bindingTelNo(ctx, next) {
    let user = ctx.state.user;
    let verifyCode = ctx.params.code;
    let tmpData = user.addData;
    let nowS = new Date().getTime();

    const schema = Joi.object().keys({
        verifyCode: Joi.string().length(CodeLength),
    });

    const { error, value } = Joi.validate({
        verifyCode: verifyCode
    }, schema);

    if (error) {
        ctx.state.code = 4;
        ctx.state.message = "参数错误";
        throw new Error(error)
    }
    if (tmpData.codeTime + CodeTime > nowS) {
        ctx.state.code = -1;
        ctx.state.message = "验证码已过期";
        throw new Error(error)
    }
    if (tmpData.code != verifyCode) {
        ctx.state.code = -1;
        ctx.state.message = "验证码错误";
        throw new Error(error)
    }

    let telNo = tmpData.telNo;
    // 更新数据，进行绑定
    await userModel.updateOne({ openId: user.openId }, {
        $set: {
            telNo: telNo
        }
    });

    user.telNo = telNo;
    delete user.addData;
    ctx.state.user = user;

    await next();
}

async function index(ctx, next) {
    let user = ctx.state.user;

    await next();
}

function getCode(words = CodeWords, length = CodeLength) {
    let code = "";
    for (let i = 0; i < length; i++) {
        let bit = Math.floor(Math.random() * 10);
        code.concat(CodeWords.charAt(bit));
    }
    return code;
}

async function getDoctor(ctx, next) {
    let user = ctx.state.user;
    let telNo = user.telNo;

    let doctor = await doctorModel.getOneByQuery({ phone: telNo });

    if (!doctor) {
        ctx.state.data = Object.assign({}, ctx.state.data, {
            doctor: null,
        });
    } else {
        ctx.state.data = Object.assign({}, ctx.state.data, {
            doctor: doctor,
        });
    }

    await next();
}

async function getRoomStaff(ctx, next) {

    let user = ctx.state.user;
    let telNo = user.telNo;

    let staff = await staffModel.getOneByQuery({ phone: telNo });

    if (!staff) {
        ctx.state.data = Object.assign({}, ctx.state.data, {
            staff: null,
        });
    } else {
        ctx.state.data = Object.assign({}, ctx.state.data, {
            staff: staff,
        });
    }

    await next();
}

async function getchildren(ctx, next) {

    let user = ctx.state.user;
    let childrenIds = user.children;

    let dbChildren = await childModel.getByQuery({ parentId: user._id, status: 1 }, '', {});
    // console.log(dbChildren + "-----------------------11111");
    let allSchool = await schoolModel.getAll();

    let children = [];
    dbChildren.forEach(oneChild => {
        let gender = "";
        switch (oneChild.gender) {
            case 1:
                gender = "男";
                break;
            default:
                gender = "女";
                break;
        }
        let school = getSchoolName(oneChild.schoolId, allSchool);
        // console.log(school+"------------------22222");
        let outChild = {
            _id: oneChild._id,
            name: oneChild.name,
            icon: oneChild.icon,
            gender: gender,
            school: school,
            identityCode: oneChild.identityCode.substr(0,3) + '******' + oneChild.identityCode.substr(14,18),
            qrcode: oneChild.qrcode,
            gradeName: oneChild.gradeName,
            className: oneChild.className,
        };
        console.log(JSON.stringify(outChild));
        children = children.concat(outChild);
    })
    console.log(children)
    if (children.length > 0) {
        ctx.state.data = Object.assign({}, ctx.state.data, {
            childrenInfos: children,
        });
    } else {
        ctx.state.data = Object.assign({}, ctx.state.data, {
            childrenInfos: null,
        });
    }

    await next();
}

function getSchoolName(schoolId, allSchool) {
    // console.log("------------------11111");
    console.log("schoolId: " + schoolId);
    for (let index = 0; index < allSchool.length; index++) {
        const oneSchool = allSchool[index];
        if (schoolId.toString() == oneSchool._id.toString()) {
            console.log("name: " + oneSchool.schoolName);
            return oneSchool.schoolName;
        }
    }
    return "";
}

async function addChild(ctx, next) {
    let user = ctx.state.user;
    // let icon = todo;
    let name = ctx.request.body.name;
    let gender = ctx.request.body.gender;
    // let studentCode = ctx.request.body.studentCode;
    let identityCode = ctx.request.body.identityCode;
    let schoolId = ctx.request.body.schoolId;
    let cityId = ctx.request.body.cityId;

    const schema = Joi.object().keys({
        // icon
        name: Joi.string().min(2).max(10),
        gender: Joi.number().integer().min(1).max(2),
        // studentCode: Joi.string().min(6).max(14),
        identityCode: Joi.string().length(18).regex(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/),
        schoolId: Joi.string().min(6).max(14),
        cityId: Joi.string().length(6),
    });

    const { error, value } = Joi.validate({
        // icon: icon,
        name: name,
        gender: gender,
        // studentCode: studentCode,
        identityCode: identityCode,
        schoolId: schoolId,
        cityId: cityId,
    }, schema);

    if (error) {
        ctx.state.code = 4
        ctx.state.message = "参数错误"
        throw new Error(error)
    };

    await CheckUpTermModel.save({
        // icon: icon,
        name: name,
        gender: gender,
        // studentCode: studentCode,
        identityCode: identityCode,
        schoolId: schoolId,
        cityId: cityId,
        parentId: user._id,
    });

    ctx.state.code = 1;
    ctx.state.message = "创建成功";

    await next();
}

async function getQuestionnaire(ctx, next) {
    // let qid = ctx.params.qid;
    // let qid = '5cb02ae45f87e029f8b6114e';
    let queryStr = { number: "CURRENT_QUESTIONNAIRE" };
    let qid = await metadataModel.getOneByQuery(queryStr, 'content', {});
    console.log("-----------CURRENT_QUESTIONNAIRE----qid: " + qid + "----" + qid.content + "----------");

    // const schema = Joi.object().keys({
    //     qid: Joi.string().length(24),
    // });

    // const { error, value } = Joi.validate({
    //     qid: qid
    // }, schema);

    // if (error) {
    //     ctx.state.code = 4;
    //     ctx.state.message = "参数错误";
    //     throw new Error(error)
    // }

    let questionnaire = await questionnaireModel.getById({ _id: qid.content });
    if (!questionnaire) {
        ctx.state.code = 4;
        ctx.state.message = "未找到该调查问卷";
        throw new Error(error)
    }

    let subjectIds = questionnaire.subjects;
    let subjects = await subjectModel.getByQuery({ _id: { $in: subjectIds } }, '', { sort: { sid: 1 } });
    let outSubjects = [];
    (subjects || []).forEach(subject => {
        let oneSubject;
        // console.log(subject.options+"------------------11111");
        switch (subject.stype) {
            case 2:
                oneSubject = {
                    sid: subject._id,
                    title: subject.question,
                    type: subject.stype,
                    isMust: subject.isMust,
                    value: []
                };
                outSubjects = outSubjects.concat(oneSubject);
                break;

            default:
                let option = JSON.parse(subject.options);
                let optionObj = [];
                let optionKeys = Object.keys(option);
                // console.log(optionKeys+"------------------22222");
                optionKeys.forEach(oneKey => {
                    let oneObj = {
                        name: oneKey + ":" + option[oneKey],
                        value: oneKey
                    };
                    optionObj = optionObj.concat(oneObj);
                });
                oneSubject = {
                    sid: subject._id,
                    title: subject.question,
                    type: subject.stype,
                    isMust: subject.isMust,
                    value: optionObj
                };
                outSubjects = outSubjects.concat(oneSubject);
                break;
        }
    });

    ctx.state.code = 1;
    ctx.state.data = Object.assign({}, ctx.state.data, {
        questionnaire: questionnaire,
        subjects: outSubjects,
    });

    await next();
}

module.exports = { gainVerifyCode, bindingTelNo, getDoctor, getRoomStaff, getchildren, index, addChild, getQuestionnaire }