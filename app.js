
let envs = ['prod', 'test', 'dev']
if (envs.indexOf(process.env.NODE_ENV) <= -1) {
   console.log('本地开发 请使用 NODE_ENV=dev node app.js 启动项目')
   process.exit()
}

const Koa = require('koa')
const app = new Koa()
const cors = require('koa2-cors')
const response = require('./middlewares/response')
const bodyParser = require('./middlewares/bodyparser')
const config = require('./config.js')
const routers = require('./routes')
const Utils = require('./common/utils.js')
const Models = require('./models/index.js')
const xmlParser = require('koa-xml-body')
const koaSwagger = require('koa2-swagger-ui')
const chalk = require('chalk')
const uuid = require('uuid')
require('./common/time.js')
const LOG = require('./common/log.js')
const v8 = require('v8')
const pidUsage = require('pidusage')
let server;

; (async () => {

  process.on('uncaughtException', async (err) => {
    await LOG.Info({
      message: 'uncaughtException',
      errStack: err.stack,
      errMessage: err.message
    }, [{ 'fileName': __filename }])
    console.log(err)
  })
  process.on('unhandledRejection', async (reason, p) => {
    await LOG.Info({
      message: 'unhandledRejection',
      Promise: p,
      reason: reason
    }, [{ 'fileName': __filename }])
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
  })

  if (process.env.NODE_ENV === 'prod') {
    const consul = require('./common/consul')
    await consul.register()
    await consul.watch()
    process.on('SIGINT', async () => {
      await consul.deregister()
      if (server) {
        server.close()
        console.log(`server closed!`)
      }
      process.exit()
    })
  }

  if (process.env.NODE_APP_INSTANCE === 0) {
    console.log(`process.env.NODE_APP_INSTANCE: 0`)
  } else if (process.env.NODE_APP_INSTANCE === undefined) {
    console.log(`process.env.NODE_APP_INSTANCE: undefined`)
  } else {
    console.log(`process.env.NODE_APP_INSTANCE: ${process.env.NODE_APP_INSTANCE}`)
  }

  // cpu usage 日志
  let previousCpuUsage = process.cpuUsage()
  let previousHrTime = process.hrtime()

  setInterval(async ()=>{
    const currentCpuUsage = process.cpuUsage(previousCpuUsage)
    const currentHrTime = process.hrtime(previousHrTime)
    const duration = currentHrTime[0] * 1e6 + currentHrTime[1] * 1e3

    previousCpuUsage = currentCpuUsage
    previousHrTime = currentHrTime

    LOG.Info({
      userCpuUsage: (currentCpuUsage.user / duration) + '',
      systemCpuUsage: (currentCpuUsage.system / duration) + ''
    }, [{ 'fileName': __filename, 'type': 'cpuUsage' }]);

    let arr = v8.getHeapSpaceStatistics()
    let lr = {}
    for (let i = 0; i < arr.length; i++) {
      const element = arr[i];
      lr[element.space_name + '-space_size'] = element.space_size + ''
      lr[element.space_name + '-space_used_size'] = element.space_used_size + ''
      lr[element.space_name + '-space_available_size'] = element.space_available_size + ''
      lr[element.space_name + '-physical_space_size'] = element.physical_space_size + ''
    }
    lr.timestamp = new Date().getTime() + ''
    LOG.Info(lr, [{ 'fileName': __filename, 'type': 'heapSpaceStatistics' }]);

    pidUsage(process.pid, async(err, stats)=>{
      LOG.Info({
        cpu: stats.cpu + '',
        memory: stats.memory + '',
        ppid: stats.ppid + '',
        pid: stats.pid + '',
        ctime: stats.ctime + '',
        elapsed: stats.elapsed + '',
        timestamp: stats.timestamp + '',
      }, [{ 'fileName': __filename, 'type': 'pidUsage' }]);
    })

  }, 1000 * 60);



  app
    .use(cors({
      origin: '*'
    }))
    .use(async (ctx, next) => {
      if (ctx.method == 'HEAD') {
        ctx.status = 200
        return
      }
      await next()
    })
    .use(async (ctx, next) => {
      ctx.state.start = Date.now();
      ctx.state.uuid = uuid.v4();
      await next()
    })
    .use(koaSwagger({
      routePrefix: '/swagger', // host at /swagger instead of default /docs
      swaggerOptions: {
        url: 'http://localhost:3000/swagger.json', // example path to json
      },
    }),
    )
    .use(xmlParser({
      encoding: 'utf8',
      xmlOptions: {
        trim: true,
        explicitArray: false
      },
      onerror: (err, ctx) => {
        ctx.throw(err.status, err.message);
      }
    }))
    .use(bodyParser())
    .use(async (ctx, next) => {

      const start = ctx.state.start;
      const uuid = ctx.state.uuid;

      if (ctx.path !== '/console/logs/getLogs') {

        console.log(`${chalk.gray('-->')} ${chalk.green(ctx.method)} ${uuid} ${chalk.yellow(ctx.path)} ${chalk.yellow(ctx.originalUrl)} ${JSON.stringify({
          query: ctx.request.query || {},
          body: ctx.request.body || {},
        }, null, 2)}`);

        LOG.Info({
          message: '',
          method: String(ctx.method),
          start: String(start),
          uuid: String(uuid),
          path: String(ctx.path),
          originalUrl: String(ctx.originalUrl),
          query: JSON.stringify(ctx.request.query || {}),
          requestBody: JSON.stringify(ctx.request.body || {}),
        }, [{ 'fileName': __filename, 'httpType': 'request' }])
      }

      await next();
      const end = Date.now()
      const ms = end - start;
      ctx.set('X-Response-Time', `${ms}ms`);
      ctx.set('X-Response-uuid', `uuid`);


      if (ctx.path !== '/console/logs/getLogs') {

        if (ctx.url.indexOf('qcode') > 0) {
          console.log(`${chalk.gray('<--')} ${chalk.green(ctx.method)} ${uuid} ${chalk.yellow(ctx.path)} ${chalk.yellow(ctx.originalUrl)} ${ctx.status} ${ms}ms`);
        } else {
          console.log(`${chalk.gray('<--')} ${chalk.green(ctx.method)} ${uuid} ${chalk.yellow(ctx.path)} ${chalk.yellow(ctx.originalUrl)} ${ctx.status} ${ms}ms ${JSON.stringify(ctx.body)}`);
        }

        LOG.Info({
          message: '',
          method: String(ctx.method),
          start: String(start),
          end: String(end),
          ms: String(ms),
          uuid: String(uuid),
          path: String(ctx.path),
          originalUrl: String(ctx.originalUrl),
          query: JSON.stringify(ctx.request.query || {}),
          requestBody: JSON.stringify(ctx.request.body || {}),
          status: String(ctx.status),
          body: JSON.stringify(ctx.body)
        }, [{ 'fileName': __filename, 'httpType': 'response' }])
      }
    })
    .use(response) // 使用响应处理中间件


  for (router in routers) {
    app
      .use(routers[router].routes())
      .use(routers[router].allowedMethods());
  }

  if (!module.parent) {
    try {
      server = await app.listen(config.port)
      console.info(`listening on port ${config.port}`)
    } catch (error) {
      console.log(error)
    }
  }

})()

