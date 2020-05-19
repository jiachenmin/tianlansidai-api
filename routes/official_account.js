const config = require('../config');
const consoleController = require('../controllers').official_account;

const router = require('koa-router')({
    prefix: '/official-account'   // 定义所有路由的前缀都已 /consoleController 开头
});


router.get('/message', consoleController.message.wxCheckSign)
    .post('/message', consoleController.message.wxMessageEvent)
    .post('/createMenus', consoleController.message.createMenus);


module.exports = router;