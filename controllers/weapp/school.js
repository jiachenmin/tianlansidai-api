const Joi = require('joi')
const schoolModel = require('../../models/school.js')
const redis = require('../../models/index.js').redisConn

async function getSchools(ctx, next) {

    let schoolsTime =  await redis.getAsync('schools:time')
    if (!schoolsTime) {
        await redis.setAsync('schools:time', JSON.stringify({time: new Date().getTime()}), 'EX', 30)
    } else {
        let schoolsData =  JSON.parse(await redis.getAsync('schools:data'))
        if(!schoolsData) schoolsData = {}
        ctx.state.code = 1;
        ctx.state.data = Object.assign({}, ctx.state.data, schoolsData);
        return await next()
    }

    let cities = await schoolModel.distinct({status: 1}, 'cityName');
    let area = {}
    let school = {}
    for(let i=0; i< cities.length; ++i) {
        let city = cities[i]
        if(!area[city]) {
            area[city] = []
        }
        let districts = await schoolModel.distinct({cityName: city, status: 1}, 'districtName');
        for(let j=0; j< districts.length; ++j) {
            let district = districts[j]
            let oneSchool = await schoolModel.getOneByQuery({cityName: city, districtName: district, status: 1});
            area[city].push({
                territoryId: oneSchool.territoryId,
                name: district
            })
            let schoolNames = await schoolModel.distinct({cityName: city, districtName: district, status: 1}, 'schoolName');
            for(let k=0; k<schoolNames.length; ++k) {
               let schoolName = schoolNames[k]
               let anotherSchool = await schoolModel.getOneByQuery({cityName: city, districtName: district, schoolName: schoolName, status: 1}, 'territoryId schoolName memo');
               if(anotherSchool && anotherSchool.territoryId) {
                    if (!school[anotherSchool.territoryId]) {
                        school[anotherSchool.territoryId] = []
                    }
                    school[anotherSchool.territoryId].push(anotherSchool)
               }
            }
        }
    }

    ctx.state.code = 1
    ctx.state.message = "ok"
    data = {
        city: cities,
        area: area,
        school: school,
    }
    await redis.setAsync('schools:data', JSON.stringify(data))
    ctx.state.data = Object.assign({}, ctx.state.data, data)

    await next()
}


module.exports = { getSchools }