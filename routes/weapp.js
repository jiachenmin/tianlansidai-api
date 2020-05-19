const qcloud = require('../common/qcloud.js');
const weapp = require('../controllers').weapp;

const {auth: {wxLogin, authorizationMiddleware, validationMiddleware, getUser}} = qcloud

const router = require('koa-router')({
    prefix: '/weapp' // 定义所有路由的前缀都已 /weapp 开头
});

// 登录
router.get('/login', authorizationMiddleware, weapp.user.login, weapp.mine.getDoctor, weapp.mine.getRoomStaff, weapp.mine.getchildren, weapp.mine.index)

// “我的” 相关
router.get('/verifyCode/:telNo', validationMiddleware, weapp.mine.gainVerifyCode)
    .get('/bindTelNo/:code', validationMiddleware, weapp.mine.bindingTelNo)
    .get('/mine', validationMiddleware, weapp.mine.getDoctor, weapp.mine.getRoomStaff, weapp.mine.getchildren, weapp.mine.index)
    .get('/questionnaire', validationMiddleware, weapp.mine.getQuestionnaire)
    // .post('/addChild', validationMiddleware, weapp.mine.addChild)
    .get('/staff/mineCheckups', validationMiddleware, weapp.check.staffCheckups)
    .get('/room', validationMiddleware, weapp.room.roomList)

// 优惠券
router.post('/couponCollect', validationMiddleware, weapp.coupon.newCollectForOne)        // 领取优惠券
    .post('/couponUse', validationMiddleware, weapp.coupon.useCoupon)               // 使用优惠券
    .get('/couponList', validationMiddleware, weapp.coupon.getList)                 // 现有优惠券列表
    .get('/collectList', validationMiddleware, weapp.coupon.getCanCollectListNew)      // 可领取列表
    .get('/couponInfo', validationMiddleware, weapp.coupon.couponInfo)              // 优惠券详情
    .get('/getStaffCoupons', validationMiddleware, weapp.coupon.getStaffCoupon)     // 获取小屋人员核销的优惠券列表node

//视力普查
router.put('/survey/child', validationMiddleware, weapp.survey.addChildren)             //添加宝贝，修改宝贝信息
    .post('/survey/child/delete', validationMiddleware, weapp.survey.deleteChild)       //删除宝贝
    .get('/child/:id', validationMiddleware, weapp.survey.childInfo)                   //宝贝信息
    .put('/survey/feedback/:id', validationMiddleware, weapp.survey.createFeedback)     //填写反馈
    .get('/survey', validationMiddleware, weapp.survey.getSurveyMission)                //家长端，普查列表
    .get('/check/all', validationMiddleware, weapp.check.getAllCheckupTerm)             // 小屋工作人员用的，获取所有项目组及下面的所有项目
    .get('/check/groups', validationMiddleware, weapp.check.getCheckupGroups)           // 医生用的，获得所有项目组（只有组）
    .get('/check/terms/:gid', validationMiddleware, weapp.check.getCheckupTermByGroup)  // 医生用的，获得对应组下面的所有项目
    .get('/doctor/survey', validationMiddleware, weapp.doctor.getDoctor, weapp.survey.getDoctorSurvey) //医生用，普查列表
    .post('/check/commit/room', validationMiddleware, weapp.check.checkupCommitRoom)             //检查结果提交小屋用
    .post('/check/commit', validationMiddleware, weapp.check.checkupCommit)             //检查结果提交
    .get('/survey/intervention/:childId', validationMiddleware, weapp.survey.getInterventionPlan) //获取干预方案和体检结果
	.get('/survey/doctor/checkcount', validationMiddleware, weapp.doctor.getDoctor, weapp.survey.getCheckCount)
//视力卡
router.get('/card', validationMiddleware, weapp.card.getCard) //视力卡列表

//收藏相关
router.put('/collect', validationMiddleware, weapp.collect.addCollect)
    .get('/collect', validationMiddleware, weapp.collect.getCollect)
    .get('/article/:aId', /* validationMiddleware, */getUser,weapp.collect.articleInfo)
    .get('/collect/:id', validationMiddleware, weapp.collect.deleteCollect)
//首页接口
router.get('/home', /* validationMiddleware, */weapp.home.homepage)
    .get('/column/article/:cId', validationMiddleware, weapp.home.getColumnArticle)
    .get('/reportPageBanner', /* validationMiddleware, */weapp.home.reportPageBanner)

// sts
router.get('/sts', validationMiddleware, weapp.sts.getSts)

// 选学校
router.get('/schools', validationMiddleware, weapp.school.getSchools)

// 绑定手机号
router.put('/user', validationMiddleware, weapp.user.decrypteMobile, weapp.user.updateUserPhone)

// @ 单后台支持多小程序 @ 开始
// 登录并入库
router.get('/multi-mini-program/login', wxLogin, weapp.user.login4MultiMiniProgram)
// 登录但不入库
router.get('/multi-mini-program/loginNotInDB', wxLogin, weapp.user.loginNotInDB4MultiMiniProgram)
// 绑定手机号
router.put('/multi-mini-program/userphone', validationMiddleware, weapp.user.decryptePhone4MultiMiniProgram, weapp.user.updateUserPhone4MultiMiniProgram)
// 更新匹配用户的信息
router.put('/multi-mini-program/userinfo', validationMiddleware, weapp.user.decrypteUserInfo4MultiMiniProgram, weapp.user.updateUserInfo4MultiMiniProgram)
// 通过手机号获取用户
router.put('/multi-mini-program/getUserByPhone', validationMiddleware, weapp.user.decryptePhone4MultiMiniProgram, weapp.user.getUserByPhone)

// 将当前用户绑定到另外一个用户上
router.put('/multi-mini-program/linkTwoUsers', validationMiddleware, weapp.user.linkTwoUsers)


// @ 单后台支持多小程序 @ 结束
module.exports = router;