
const swaggerJSDoc = require('swagger-jsdoc');
const config = require('../config.js');

const swaggerSpec = swaggerJSDoc({
  swaggerDefinition: {
    info: {
      title: 'azure ribbon api', // Title (required)
      version: '1.0.0', // Version (required)
      description: 'azure ribbon api description', // Description (optional)
    },
    host: `localhost:${config.port}`, // Host (optional)
    basePath: '/', // Base path (optional)
  },
  apis: ['./routes/*.js', './controllers/console/*.js'],
});


const router = require('koa-router')({
    prefix: '/'   // 定义所有路由的前缀都已 / 开头
});


/**
 * @swagger
 * /:
 *   get:
 *     description: Returns the homepage
 *     responses:
 *       200:
 *         description: hello world
 */
router.all('/', async (ctx, next) => {
  ctx.state.code = 1
  ctx.state.message = ""
  ctx.status = 200
  ctx.state.data = Object.assign({}, ctx.state.data, {});
  await next()
})

router.get('swagger.json', async(ctx, next) => {
  ctx.set('Content-Type', 'application/json');
  ctx.state.code = 0;
  ctx.body = swaggerSpec;
  return
});


module.exports = router