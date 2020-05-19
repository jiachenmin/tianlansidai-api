'use strict';

const config = require('../config.js')

exports.getToken = function (userid, salt) {
    
    function getMd5(data) {
        var Buffer = require("buffer").Buffer;
        var buf = new Buffer(data);
        var str = buf.toString("binary");
        var crypto = require("crypto");
        return crypto.createHash("md5").update(str).digest("hex");
    }
    
    var saltUseridMd5 = getMd5(userid + salt);
    var saltUseridMd5Sub = saltUseridMd5.substr(7, 17);//截取8-24位
    var saltUseridMd5SubMd5 = getMd5(saltUseridMd5Sub + config.key);
    var token = saltUseridMd5SubMd5;
    return token
}
