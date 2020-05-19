
const config = require('../config.js')
const consul = require('consul')({
    host: config.consul.host,
    port: config.consul.port,
    promisify: true
})
const CONSUL_ID = require('uuid').v4()

async function register() {
    
    // 命名规范：{产品线}.{子系统}.{模块}  P.S.M
    await consul.agent.service.register({
      name: `azure-ribbon.api.${config.name}`,
      id: CONSUL_ID,
      host: config.host,
      port: config.port,
      tags: [config.name],
      check: {
          http: `http://${config.host}:${config.port}`,
          ttl: '10s',
          deregistercriticalserviceafter: '5s'
      }
    });
    console.log(`registed consul agent id= ${CONSUL_ID}`)
    
    setInterval(async () => {
        try{
            await consul.agent.check.pass({
                id: `service:${CONSUL_ID}`,
                note: '我还可以治疗一下！'
            });
        }catch(error) {
            console.log(error)
        }

    }, 2 * 1000);
}

async function deregister() {
    await consul.agent.service.deregister({id: CONSUL_ID})
}

async function watch () {
    let known_data_instances = [];

    const watcher = await consul.watch({
        method: consul.health.service,
        options: {
            service: `${CONSUL_ID}`,
            passing: true
        }
    });

    watcher.on('change', async (data) => {
        known_data_instances = [];
        data.forEach(entry => {
            known_data_instances.push(`http://${entry.Service.Address}:${entry.Service.Port}/`);
        });
        console.log(`known_data_instances: ${known_data_instances}`)
    });

    watcher.on('error', err => {
        console.error('watch error', err);
    });
}

module.exports = { register, deregister, watch }