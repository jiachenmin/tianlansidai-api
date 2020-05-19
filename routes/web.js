const config = require('../config');
const web = require('../controllers').web;
const weapp = require('../controllers').weapp;


const router = require('koa-router')({
    prefix: '/web'   // 定义所有路由的前缀都已 /web 开头
});

router.get('/hospital', web.hospital.getHospitalByCode)                                         // 基于 code 获取医院
    .get('/hospital/appointment-statistics', web.hospital.listHospitalAppointmentStatistics)    // 获取医院某一天的可预约时段以及数量
    .post('/hospital/appointment', web.hospital.createHospitalAppointment)                      // 提交预约
    .get('/hospital/appointment-of-my', web.hospital.listHospitalAppointmentByPhone)            // 基于手机号获取我的预约
    .get('/hospital/appointments', web.hospital.listHospitalAppointmentByHospitalCode)            // 基于 code 获取医院的预约
    .get('/school', weapp.school.getSchools)                                                    // 获取所有的学校

module.exports = router;