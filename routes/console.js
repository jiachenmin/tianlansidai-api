const config = require('../config');
const consoleController = require('../controllers').console;

const router = require('koa-router')({
    prefix: '/console'   // 定义所有路由的前缀都已 /consoleController 开头
});

// 管理员用户
router.post('/user/login', consoleController.user.login)
router.post('/user/logout', consoleController.user.logout)
//查看宝贝
router.get('/child', consoleController.user.validation, consoleController.child.childList)
    .get('/child/:id', consoleController.user.validation, consoleController.child.findChild)
    .post('/childs', consoleController.user.validation, consoleController.child.findChildByIds)
    .get('/childs', consoleController.user.validation, consoleController.child.listChild)
    .get('/child/survey', consoleController.user.validation, consoleController.child.getSurveyMission)

// 用户中心 用户-组织
router.post('/admin', consoleController.user.validation, consoleController.admin.createAdmin)
    .delete('/admin/:id', consoleController.user.validation, consoleController.admin.deleteAdmin)
    .put('/admin/:id', consoleController.user.validation, consoleController.admin.modifyAdmin)
    .put('/admin/:id/commonfields', consoleController.user.validation, consoleController.admin.modifyAdminCommonFields)
    .get('/admin/:id', consoleController.user.validation, consoleController.admin.findAdmin)
    .get('/admin', consoleController.user.validation, consoleController.admin.findAdmins)

router.post('/organization/', consoleController.user.validation, consoleController.organization.createOrganization)
    .delete('/organization/:id', consoleController.user.validation, consoleController.organization.deleteOrganization)
    .put('/organization/:id', consoleController.user.validation, consoleController.organization.modifyOrganization)
    .get('/organization/:id', consoleController.user.validation, consoleController.organization.findOrganization)
    .get('/organization', consoleController.user.validation, consoleController.organization.findOrganizations)
    .get('/organizationTrees', consoleController.user.validation, consoleController.organization.organizationTrees)

// 内容管理 栏目-内容
router.post('/column', consoleController.user.validation, consoleController.column.createColumn)
    .delete('/column/:id', consoleController.user.validation, consoleController.column.deleteColumn)
    .put('/column/:id', consoleController.user.validation, consoleController.column.modifyColumn)
    .get('/column/:id', consoleController.user.validation, consoleController.column.findColumn)
    .get('/column', consoleController.user.validation, consoleController.column.findColumns)

router.post('/article', consoleController.user.validation, consoleController.article.createArticle)
    .delete('/article/:id', consoleController.user.validation, consoleController.article.deleteArticle)
    .put('/article/:id', consoleController.user.validation, consoleController.article.modifyArticle)
    .get('/article/:id', consoleController.user.validation, consoleController.article.findArticle)
    .get('/articles', consoleController.user.validation, consoleController.article.findArticles)
    .get('/articles/column', consoleController.user.validation, consoleController.article.articleList)
    .get('/articles/all', consoleController.user.validation, consoleController.article.articleAllTitle)

//资源中心
router.get('/resource/type', consoleController.user.validation, consoleController.resource.getType)
    .post('/resource/type', consoleController.user.validation, consoleController.resource.createType)
    .post('/resource', consoleController.user.validation, consoleController.resource.addResource)
    .get('/resource/list', consoleController.user.validation, consoleController.resource.getResourceList)
    .delete('/resource/:id', consoleController.user.validation, consoleController.resource.deleteResource)

//权限中心
router.post('/permission/role', consoleController.user.validation, consoleController.permission.createRole)             //添加角色
    .get('/permission/role', consoleController.user.validation, consoleController.permission.getRole)                   //获取角色树
    .delete('/permission/role/:id', consoleController.user.validation, consoleController.permission.deleteRole)        //删除角色
    .put('/permission/role/:id', consoleController.user.validation, consoleController.permission.modifyRole)           //修改角色

    .post('/permission', consoleController.user.validation, consoleController.permission.createPermission)              //创建权限
    .delete('/permission/:id', consoleController.user.validation, consoleController.permission.deletePermission)        //删除权限
    .put('/permission/:id', consoleController.user.validation, consoleController.permission.modifyPermission)           //修改权限
    .get('/permission/list', consoleController.user.validation, consoleController.permission.getPermissionList)         //获取角色的权限列表（搜索）
    .get('/permission/persons', consoleController.user.validation, consoleController.permission.getPermissionPersons)   //获取角色下的人员列表 (搜索)
    .post('/permission/persons', consoleController.user.validation, consoleController.permission.addPermissionPersons)  //给人员分配角色

//元数据中心
router.post('/metedata/type', consoleController.user.validation, consoleController.metadata.createMetadataType)
    .get('/metedata/type', consoleController.user.validation, consoleController.metadata.getMetadataType)
    .post('/metedata', consoleController.user.validation, consoleController.metadata.createMetadata)
    .get('/metedata/list', consoleController.user.validation, consoleController.metadata.metadataList)
    .get('/metedata/detail/:id', consoleController.user.validation, consoleController.metadata.metadataDetail)
    .delete('/metedata/delete/:id', consoleController.user.validation, consoleController.metadata.deleteMetadata)
    .put('/metedata/modify/:id', consoleController.user.validation, consoleController.metadata.operatingMetadata)
    .delete('/metedata/type/delete/:id', consoleController.user.validation, consoleController.metadata.deleteMetadataType)
    .put('/metedata/type/modify/:id', consoleController.user.validation, consoleController.metadata.operatingMetadataType)

//干预方案
router.post('/intervention/version', consoleController.user.validation, consoleController.intervention.createInterventionVersion)   //添加方案版本
    .get('/intervention/version', consoleController.user.validation, consoleController.intervention.getInterventionVersion)         //获取方案版本列表
    .delete('/intervention/version/:id', consoleController.user.validation, consoleController.intervention.deleteInterventionVersion)              //删除干预方案版本
    .put('/intervention/version/:id', consoleController.user.validation, consoleController.intervention.modifyInterventionVersion)                 //修改方案版本

    .post('/intervention', consoleController.user.validation, consoleController.intervention.createIntervention)                    //添加干预方案
    .delete('/intervention/:id', consoleController.user.validation, consoleController.intervention.deleteIntervention)              //删除干预方案
    .put('/intervention/:id', consoleController.user.validation, consoleController.intervention.modifyIntervention)                 //修改方案
    .get('/intervention', consoleController.user.validation, consoleController.intervention.getInterventions)                       //方案列表

//普查任务
router.post('/survey', consoleController.user.validation, consoleController.survey.createSurveyMission)
    .put('/survey/:id', consoleController.user.validation, consoleController.survey.modifySurveyMission)
    .delete('/survey/:id', consoleController.user.validation, consoleController.survey.deleteMission)
    .get('/survey/list', consoleController.user.validation, consoleController.survey.surveyMissionList)


// 运营区域
router.post('/area', consoleController.user.validation, consoleController.area.createArea)
    .delete('/area/:id', consoleController.user.validation, consoleController.area.deleteArea)
    .put('/area/:id', consoleController.user.validation, consoleController.area.modifyArea)
    .get('/area/:id', consoleController.user.validation, consoleController.area.findArea)
    .get('/areas', consoleController.user.validation, consoleController.area.findAreas)
    .get('/areas/search', consoleController.user.validation, consoleController.area.searchAreas)

// 省市区划
router.get('/regions', consoleController.user.validation, consoleController.region.findRegions)

// 区域下的片区
router.post('/territory', consoleController.user.validation, consoleController.territory.createTerritory)
    .delete('/territory/:id', consoleController.user.validation, consoleController.territory.deleteTerritory)
    .put('/territory/:id', consoleController.user.validation, consoleController.territory.modifyTerritory)
    .get('/territory/:id', consoleController.user.validation, consoleController.territory.findTerritory)
    .get('/territories', consoleController.user.validation, consoleController.territory.findTerritories)
    .get('/territories/search', consoleController.user.validation, consoleController.territory.searchTerritories)

// 小屋管理
router.post('/room', consoleController.user.validation, consoleController.territory.checkTerritory, consoleController.room.createRoom)
    .delete('/room/:id', consoleController.user.validation, consoleController.room.deleteRoom)
    .put('/room/:id', consoleController.user.validation, consoleController.room.modifyRoom)
    .get('/room/:id', consoleController.user.validation, consoleController.room.findRoom)
    .get('/rooms', consoleController.user.validation, consoleController.room.findRooms)
    .get('/rooms/search', consoleController.user.validation, consoleController.room.searchRooms)

// 医院管理
router.post('/hospital', consoleController.user.validation, consoleController.territory.checkTerritory, consoleController.hospital.createHospital)
    .delete('/hospital/:id', consoleController.user.validation, consoleController.hospital.deleteHospital)
    .put('/hospital/:id', consoleController.user.validation, consoleController.hospital.modifyHospital)
    .get('/hospital/:id', consoleController.user.validation, consoleController.hospital.findHospital)
    .get('/hospitals', consoleController.user.validation, consoleController.hospital.findHospitals)
    .get('/hospitals/search', consoleController.user.validation, consoleController.hospital.searchHospitals)

// 医院预约管理
router.get('/hospital-appointment/:id', consoleController.user.validation, consoleController.hospital_appointment.findById)
    .post('/hospital-appointments', consoleController.user.validation, consoleController.hospital_appointment.listByHospitalId)
    .get('/hospital-appointments/search', consoleController.user.validation, consoleController.hospital_appointment.listByKeyword)

// 小屋工作人员管理
router.post('/roomPerson', consoleController.user.validation, consoleController.room_person.createRoomPerson)
    .delete('/roomPerson/:id', consoleController.user.validation, consoleController.room_person.deleteRoomPerson)
    .put('/roomPerson/:id', consoleController.user.validation, consoleController.room_person.modifyRoomPerson)
    .get('/roomPerson/:id', consoleController.user.validation, consoleController.room_person.findRoomPerson)
    .get('/roomPersons', consoleController.user.validation, consoleController.room_person.findRoomPersons)
    .get('/roomPersons/search', consoleController.user.validation, consoleController.room_person.searchRoomPersons)

// 学校管理
router.post('/school', consoleController.user.validation, consoleController.territory.checkTerritory, consoleController.school.createSchool)
    .delete('/school/:id', consoleController.user.validation, consoleController.school.deleteSchool)
    .put('/school-memo/:id', consoleController.user.validation, consoleController.school.modifySchoolMemo)
    .put('/school/:id', consoleController.user.validation, consoleController.school.modifySchool)
    .get('/school/:id', consoleController.user.validation, consoleController.school.findSchool)
    .get('/schools', consoleController.user.validation, consoleController.school.findSchools)
    .get('/schools/search', consoleController.user.validation, consoleController.school.searchSchools)
    .get('/schools/area', consoleController.user.validation, consoleController.school.findSchoolsByArea)
    .get('/schools/all', consoleController.user.validation, consoleController.school.listAllSchool)

// 医生管理
router.post('/doctor', consoleController.user.validation, consoleController.territory.checkTerritory, consoleController.doctor.createDoctor)
    .delete('/doctor/:id', consoleController.user.validation, consoleController.doctor.deleteDoctor)
    .put('/doctor/:id', consoleController.user.validation, consoleController.doctor.modifyDoctor)
    .get('/doctor/:id', consoleController.user.validation, consoleController.doctor.findDoctor)
    .get('/doctors', consoleController.user.validation, consoleController.doctor.findDoctors)
    .get('/doctors/search', consoleController.user.validation, consoleController.doctor.searchDoctors)
    .get('/doctors/area', consoleController.user.validation, consoleController.doctor.findDoctorsByArea)

// 健康检查组
router.post('/checkup_group', consoleController.user.validation, consoleController.checkup_group.createGroup)
    .delete('/checkup_group/:id', consoleController.user.validation, consoleController.checkup_group.deleteGroup)
    .put('/checkup_group/:id', consoleController.user.validation, consoleController.checkup_group.modifyGroup)
    .get('/checkup_group/:id', consoleController.user.validation, consoleController.checkup_group.getOneGroup)
    .get('/checkup_groups', consoleController.user.validation, consoleController.checkup_group.getGroups)

// 健康检查项目
router.post('/checkup_term', consoleController.user.validation, consoleController.checkup_term.createTerm)
    .delete('/checkup_term/:id', consoleController.user.validation, consoleController.checkup_term.deleteTerm)
    .put('/checkup_term/:id', consoleController.user.validation, consoleController.checkup_term.modifyTerm)
    .get('/checkup_term/:id', consoleController.user.validation, consoleController.checkup_term.getOneTerm)
    .get('/checkup_terms/:gid', consoleController.user.validation, consoleController.checkup_term.getTerms)
    .post('/checkup_terms/search', consoleController.user.validation, consoleController.checkup_term.searchTerms)

// 调查问卷
router.post('/questionnaire', consoleController.user.validation, consoleController.questionnaire.createQuestionnaire)
    .delete('/questionnaire/:id', consoleController.user.validation, consoleController.questionnaire.deleteQuestionnaire)
    .put('/questionnaire/:id', consoleController.user.validation, consoleController.questionnaire.modifyQuestionnaire)
    .get('/questionnaire/:id', consoleController.user.validation, consoleController.questionnaire.getOneQuestionnaire)
    .get('/questionnaires', consoleController.user.validation, consoleController.questionnaire.getQuestionnaires)

// 问卷题目
router.post('/subject', consoleController.user.validation, consoleController.subject.createSubject)
    .delete('/subject/:id', consoleController.user.validation, consoleController.subject.deleteSubject)
    .put('/subject/:id', consoleController.user.validation, consoleController.subject.modifySubject)
    .get('/subject/:id', consoleController.user.validation, consoleController.subject.getOneSubject)
    .get('/subjects/:qid', consoleController.user.validation, consoleController.subject.getSubjects)
    .post('/subjects/search', consoleController.user.validation, consoleController.subject.searchSubjects)

//优惠券类型
router.post('/couponType', consoleController.user.validation, consoleController.coupon_type.createCouponType)
    .delete('/couponType/:id', consoleController.user.validation, consoleController.coupon_type.deleteCouponType)
    .put('/couponType/:id', consoleController.user.validation, consoleController.coupon_type.modifyCouponType)
    .get('/couponType/:id', consoleController.user.validation, consoleController.coupon_type.getOneCouponType)
    .get('/couponTypes', consoleController.user.validation, consoleController.coupon_type.getCouponTypes)

//优惠券
router.post('/coupon', consoleController.user.validation, consoleController.coupon.createCoupon)
    .delete('/coupon/:id', consoleController.user.validation, consoleController.coupon.deleteCoupon)
    .put('/coupon/:id', consoleController.user.validation, consoleController.coupon.modifyCoupon)
    .get('/coupon/:id', consoleController.user.validation, consoleController.coupon.getOneCoupon)
    .get('/coupons', consoleController.user.validation, consoleController.coupon.getCoupons)
    .get('/coupons/search', consoleController.user.validation, consoleController.coupon.searchCoupon)
    .get('/coupons/all', consoleController.user.validation, consoleController.coupon.getAllCoupons)


// sts
router.get('/sts', consoleController.user.validation, consoleController.sts.getSts)

// 运维管理
// router.post('/devops/update', consoleController.devops.update)
router.get('/logs/getLogs', consoleController.user.validation, consoleController.log.getLogs)

//运营相关
router.get('/operation/:surveyId/statistics', consoleController.user.validation, consoleController.analyze.surveyStudentStatistics)//普查数据统计
//router.get('/operation/:surveyId/exception', consoleController.user.validation, consoleController.analyze.getExceptionReport)//异常数据报告
router.post('/operation/revise/:resultId', consoleController.user.validation, consoleController.analyze.revise)//修正体检结果
router.get('/operation/result/:surveyId', consoleController.user.validation, consoleController.analyze.surveyResult)//体检结果列表
router.post('/operation/mobile/:userId', consoleController.user.validation, consoleController.analyze.updateMobile)//修改手机号
router.post('/operation/bind', consoleController.user.validation, consoleController.analyze.operationBind)//绑定，解绑
router.get('/operation/parent/search', consoleController.user.validation, consoleController.analyze.searchParent)//家长信息搜索
router.get('/operation/result/set-tag/:surveyId', consoleController.user.validation, consoleController.analyze.setTagBySurveyResult)//遍历普查结果，设置标签
router.get('/operation/result/send-message/:surveyId', consoleController.user.validation, consoleController.analyze.sendMessage)//遍历普查结果，发送服务号消息给家长


//学校分布
router.get('/analysis/school', consoleController.user.validation, consoleController.analyze.schoolArrangement)
    .get('/analysis/children', consoleController.user.validation, consoleController.analyze.childrenArrangement)
    .get('/analysis/intervention', consoleController.user.validation, consoleController.analyze.planArrangement)
    .get('/analysis/common', consoleController.user.validation, consoleController.analyze.commonArrangement)
module.exports = router;

















