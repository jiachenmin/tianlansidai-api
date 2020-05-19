// const Sandbox = require('sandbox')

// var s = new Sandbox();
// s.run('1 + 1 + " apples"', function(output) {
//   // output.result == "2 apples"
//   console.log(output)
// });


// const redis = require('../models/index.js').redisConn;

// (async () => {
//     try {
//       let n = JSON.parse(null)
//       if (n == null) {
//         console.log(111)
//       }

//       // let result = await redis.setAsync("hs", JSON.stringify({a: 1, b:2}));
//       // console.log(result)
//       // result = await redis.getAsync("aa");
//       // console.log(result)
//     } catch (error) {
//       console.log(error)
//     }
// })()

// var user = {
//   a: 1,
//   b: 2
// }

// for (var key in user) {
//   console.log(user[key])
// }

// (async () => {
//     try {
//       const userModel = require('../models/user')
//       let user = await userModel.save({})
//       console.log(user)
//     } catch (error) {
//       console.log(error)
//     }
// })()

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const URL = 'http://www.stats.gov.cn/tjsj/tjbz/xzqhdm/201703/t20170310_1471429.html';

(async ()=> {
    function getSpaceLength(tag) {
        if (!tag) return false;
        if (tag.nodeType) tag = $(tag);
        return tag.text().trim().match(/\s+/)[0].length
    }

    const data = (await axios.get(URL)).data; //异步获得整个页面数据
    const $ = cheerio.load(data);
    const tagArr = Array.from($('.TRS_PreAppend .MsoNormal'));
    let dataObj = {}, lengthArr = [];//总数据Object和区分数据的长度数组

    tagArr.slice(0, 3).forEach(tag => { //总共只有省市区三个关键长度所以，取前三条数组就好了
        let tempLen = getSpaceLength(tag);
        if (lengthArr.indexOf(tempLen) < 0) lengthArr.push(tempLen);
    })

    const [provinceKey, cityKey, areaKey] = lengthArr;
    function getObj(tag, key, type) {
        if (!tag) return false;
        let tempArr = tag.text().trim().match(/\S+/g),
            tempCode = tempArr[0],
            tempName = tempArr[1];

        return {
            code: tempCode,
            name: tempName,
            key: tempCode.slice(key, key + 2),
            type: type
        }
    }
    let tempProvinceObj, tempCityObj, tempAreaObj, tempObj, key;//省，市，区县，临时obj, 关键Key
    tagArr.forEach(item => {
        switch (getSpaceLength(item)) {
            case provinceKey:
                key = 0;
                tempObj = getObj(item, key, 1);
                dataObj[tempObj.key] = tempProvinceObj = tempObj;
                break;
            case cityKey:
                key = 2;
                tempObj = getObj(item, key, 2);
                tempProvinceObj[tempObj.key] = tempCityObj = tempObj;
                break;
            case areaKey:
                key = 4;
                tempObj = getObj(item, key, 3);
                tempCityObj[tempObj.key] = tempAreaObj = tempObj;
                break;
            default:
                break;
        }
    })
    console.log(dataObj)
    // fs.writeFile('province.json', JSON.stringify(dataObj), 'utf8', err => {
    //     if (err) throw err;
    //     console.log('It\'s saved!');
    // });
    
})()
