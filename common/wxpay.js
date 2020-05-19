const md5 = require('md5');
const sha1 = require('sha1');
const request = require('request');
const _ = require('underscore');
const xml2js = require('xml2js');
const https = require('https');
const url_mod = require('url');
const Promise = require("bluebird");
const httpPOST = Promise.promisify(request.post);
const httpGET = Promise.promisify(request.get);
const config  = require('../config.js');
const wxPay = config.wxPay;

const signTypes = {
  MD5: md5,
  SHA1: sha1
};

const RETURN_CODES = {
  SUCCESS: 'SUCCESS',
  FAIL: 'FAIL'
};

const URLS = {
  UNIFIED_ORDER: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
  ORDER_QUERY: 'https://api.mch.weixin.qq.com/pay/orderquery',
  REFUND: 'https://api.mch.weixin.qq.com/secapi/pay/refund',
  REFUND_QUERY: 'https://api.mch.weixin.qq.com/pay/refundquery',
  DOWNLOAD_BILL: 'https://api.mch.weixin.qq.com/pay/downloadbill',
  SHORT_URL: 'https://api.mch.weixin.qq.com/tools/shorturl',
  CLOSE_ORDER: 'https://api.mch.weixin.qq.com/pay/closeorder',
  REDPACK_SEND: 'https://api.mch.weixin.qq.com/mmpaymkttransfers/sendredpack',
  REDPACK_QUERY: 'https://api.mch.weixin.qq.com/mmpaymkttransfers/gethbinfo',
  TRANSFERS: 'https://api.mch.weixin.qq.com/mmpaymkttransfers/promotion/transfers'
};


class Payment {

    constructor(){
        
        this.appId =config.appId;

        this.partnerKey = wxPay.partnerKey;
        this.mchId = wxPay.mchId;
        this.subMchId = wxPay.subMchId;
        this.notifyUrl = wxPay.notifyUrl;
        this.passphrase = wxPay.passphrase || wxPay.mchId;
        this.pfx = wxPay.pfx;
    }

    async _httpRequest (url, data) {

        let ret = await httpPOST({
            url: url,
            method: 'POST',
            body: data
        });
        let body = ret.body;
        return body;
    };

    async _httpsRequest(url, data) {

        let parsed_url = url_mod.parse(url);
        let ret = await httpPOST({
            host: parsed_url.host,
            port: 443,
            path: parsed_url.path,
            pfx: this.pfx,
            passphrase: this.passphrase,
            method: 'POST'
        });
        let body = ret.body;
        return body;
    }

    _generateTimeStamp () {
        return parseInt(+new Date() / 1000, 10) + '';
    }

    _generateNonceStr (length) {

        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var maxPos = chars.length;
        var noceStr = '';
        var i;
        for (i = 0; i < (length || 32); i++) {
            noceStr += chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return noceStr;
    }

    _extendWithDefault (obj, keysNeedExtend) {
        var defaults = {
            appid: this.appId,
            mch_id: this.mchId,
            sub_mch_id: this.subMchId,
            nonce_str: this._generateNonceStr(),
            notify_url: this.notifyUrl,
            op_user_id: this.mchId,
            pfx: this.pfx
        };
        var extendObject = {};
        keysNeedExtend.forEach(function(k) {
            if (defaults[k]) {
                extendObject[k] = defaults[k];
            }
        });
        return _.extend(extendObject, obj);
    }

    buildXml (obj) {

        var builder = new xml2js.Builder({
          allowSurrogateChars: true
        });
        var xml = builder.buildObject({
          xml: obj
        });
        return xml;
    }

    _toQueryString (object) {
        return Object.keys(object).filter(function(key) {
          return object[key] !== undefined && object[key] !== '';
        }).sort().map(function(key) {
          return key + '=' + object[key];
        }).join('&');
    }

    _getSign (pkg, signType) {

        pkg = _.clone(pkg);
        delete pkg.sign;
        signType = signType || 'MD5';
        var string1 = this._toQueryString(pkg);
        var stringSignTemp = string1 + '&key=' + this.partnerKey;
        var signValue = signTypes[signType](stringSignTemp).toUpperCase();
        return signValue;
    }

    _parseCsv (text) {

        var rows = text.trim().split(/\r?\n/);
      
        function toArr(rows) {
          var titles = rows[0].split(',');
          var bodys = rows.splice(1);
          var data = [];
      
          bodys.forEach(function(row) {
            var rowData = {};
            row.split(',').forEach(function(cell, i) {
              rowData[titles[i]] = cell.split('`')[1];
            });
            data.push(rowData);
          });
          return data;
        }
      
        return {
          list: toArr(rows.slice(0, rows.length - 2)),
          stat: toArr(rows.slice(rows.length - 2, rows.length))[0]
        };
    }

    async shortUrl (params) {
        return await this._signedQuery(URLS.SHORT_URL, params, {
            required: ['long_url']
        });
    }

    async _parseString (xml, options) {
        return new Promise(function(resolve, reject) {
            xml2js.parseString(xml, options, function(err, result) {
                if (!err) {
                    resolve(result);
                } else {
                    reject(err);
                }
            });
        });
    }

    async validate (xml) {

        var json = await this._parseString(xml, {
            trim: true,
            explicitArray: false
        });
        var error;
        var data = json ? json.xml : {};
    
        if (data.return_code == RETURN_CODES.FAIL) {
            error = new Error(data.return_msg);
            error.name = 'ProtocolError';
        } else if (data.result_code == RETURN_CODES.FAIL) {
            error = new Error(data.err_code);
            error.name = 'BusinessError';
        } else if (data.appid && this.appId !== data.appid) {
            error = new Error();
            error.name = 'InvalidAppId';
        } else if (data.mch_id && this.mchId !== data.mch_id) {
            error = new Error();
            error.name = 'InvalidMchId';
        } else if (data.mchid && this.mchId !== data.mchid) {
            error = new Error();
            error.name = 'InvalidMchId';
        } else if (this.subMchId && this.subMchId !== data.sub_mch_id) {
            error = new Error();
            error.name = 'InvalidSubMchId';
        } else if (data.sign && this._getSign(data) !== data.sign) {
            error = new Error();
            error.name = 'InvalidSignature';
        }
        if(error) throw error;
        return data;
    }

    async _signedQuery (url, params, options) {

        var self = this;
        var required = options.required || [];
      
        if (url == URLS.REDPACK_SEND) {
          params = this._extendWithDefault(params, [
            'mch_id',
            'nonce_str'
          ]);
        } else if (url == URLS.TRANSFERS) {
          params = this._extendWithDefault(params, [
            'nonce_str'
          ]);
        } else {
          params = this._extendWithDefault(params, [
            'appid',
            'mch_id',
            'sub_mch_id',
            'nonce_str'
          ]);
        }
      
        params = _.extend({
          'sign': this._getSign(params)
        }, params);
      
        if (params.long_url) {
          params.long_url = encodeURIComponent(params.long_url);
        }
      
        for (var key in params) {
          if (params[key] !== undefined && params[key] !== null) {
            params[key] = params[key].toString();
          }
        }
      
        var missing = [];
        required.forEach(function(key) {
          var alters = key.split('|');
          for (var i = alters.length - 1; i >= 0; i--) {
            if (params[alters[i]]) {
              return;
            }
          }
          missing.push(key);
        });
      
        if (missing.length) {
          return callback('missing params ' + missing.join(','));
        }
      
        var request = (options.https ? this._httpsRequest : this._httpRequest).bind(this); 
        let ret = await request(url, this.buildXml(params));
        return this.validate(ret);
    }

    async unifiedOrder (params) {

        var requiredData = ['body', 'out_trade_no', 'total_fee', 'spbill_create_ip', 'trade_type'];
        if (params.trade_type == 'JSAPI') {
          requiredData.push('openid|sub_openid');
        } else if (params.trade_type == 'NATIVE') {
          requiredData.push('product_id');
        }
        params.notify_url = params.notify_url || this.notifyUrl;
        let ret = await this._signedQuery(URLS.UNIFIED_ORDER, params, {
          required: requiredData
        });
        return ret;
    }

    async getBrandWCPayRequestParams (order) {
       
        var default_params = {
          appId: this.appId,
          timeStamp: this._generateTimeStamp(),
          nonceStr: this._generateNonceStr(),
          signType: 'MD5'
        };
      
        order = this._extendWithDefault(order, [
          'notify_url'
        ]);

        let data = await this.unifiedOrder(order);
      
        var params = _.extend(default_params, {
        package: 'prepay_id=' + data.prepay_id
        });
    
        params.paySign = this._getSign(params);
    
        if (order.trade_type == 'NATIVE') {
        params.code_url = data.code_url;
        }else if(order.trade_type == 'MWEB'){
        params.mweb_url = data.mweb_url;
        }
        params.timestamp = params.timeStamp;
        return params;
    }
    
    async closeOrder (params) {
        return await this._signedQuery(URLS.CLOSE_ORDER, params, {
          required: ['out_trade_no']
        });
    }

    async downloadBill (params) {
        var rawData = await this._signedQuery(URLS.DOWNLOAD_BILL, params, {
            required: ['bill_date', 'bill_type']
        });
        return this._parseCsv(rawData);
    }
}

module.exports = new Payment();

//------------------------------------------------------
// Payment.prototype.sendRedPacket = function(order, callback) {
//   var self = this;
//   var default_params = {
//     wxappid: this.appId
//   };

//   order = _.extend(order, default_params);

//   var requiredData = ['mch_billno', 'send_name', 're_openid', 'total_amount', 'total_num', 'wishing', 'client_ip', 'act_name', 'remark'];

//   this._signedQuery(URLS.REDPACK_SEND, order, {
//     https: true,
//     required: requiredData
//   }, callback);
// };

// Payment.prototype.redPacketQuery = function(order, callback) {
//   var self = this;
//   var default_params = {
//     bill_type: 'MCHT'
//   };

//   order = _.extend(order, default_params);

//   var requiredData = ['mch_billno'];

//   this._signedQuery(URLS.REDPACK_QUERY, order, {
//     https: true,
//     required: requiredData
//   }, callback);
// };

// Payment.prototype.transfers = function(order, callback) {
//   var self = this;
//   var default_params = {
//     mchid: this.mchId,
//     mch_appid: this.appId
//   };

//   order = _.extend(order, default_params);

//   var requiredData = ['mch_appid', 'partner_trade_no', 'openid', 'check_name', 'amount', 'desc', 'spbill_create_ip'];

//   this._signedQuery(URLS.TRANSFERS, order, {
//     https: true,
//     required: requiredData
//   }, callback);
// };

// /**
//  * Generate parameters for `WeixinJSBridge.invoke('editAddress', parameters)`.
//  *
//  * @param  {String}   data.url  Referer URL that call the API. *Note*: Must contain `code` and `state` in querystring.
//  * @param  {String}   data.accessToken
//  * @param  {Function} callback(err, params)
//  *
//  * @see https://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=7_9
//  */

// Payment.prototype.getEditAddressParams = function(data, callback) {
//   if (!(data.url && data.accessToken)) {
//     var err = new Error('Missing url or accessToken');
//     return callback(err);
//   }

//   var params = {
//     appId: this.appId,
//     scope: 'jsapi_address',
//     signType: 'SHA1',
//     timeStamp: this._generateTimeStamp(),
//     nonceStr: this._generateNonceStr(),
//   };
//   var signParams = {
//     appid: params.appId,
//     url: data.url,
//     timestamp: params.timeStamp,
//     noncestr: params.nonceStr,
//     accesstoken: data.accessToken,
//   };
//   var string = this._toQueryString(signParams);
//   params.addrSign = signTypes[params.signType](string);
//   callback(null, params);
// };

// Payment.prototype.orderQuery = function(params, callback) {
//   this._signedQuery(URLS.ORDER_QUERY, params, {
//     required: ['transaction_id|out_trade_no']
//   }, callback);
// };

// Payment.prototype.refund = function(params, callback) {
//   params = this._extendWithDefault(params, [
//     'op_user_id'
//   ]);

//   this._signedQuery(URLS.REFUND, params, {
//     https: true,
//     required: ['transaction_id|out_trade_no', 'out_refund_no', 'total_fee', 'refund_fee']
//   }, callback);
// };

// Payment.prototype.refundQuery = function(params, callback) {
//   this._signedQuery(URLS.REFUND_QUERY, params, {
//     required: ['transaction_id|out_trade_no|out_refund_no|refund_id']
//   }, callback);
// };






/**
 * Promisify for public functions
 */
// if (global.Promise) {
//   for (let key in Payment.prototype) {
//     let func = Payment.prototype[key]
//     let syncFuncs = ['buildXml']
//     if (typeof func == 'function' && key.indexOf('_') !== 0 && syncFuncs.indexOf(key) === -1) {
//       Payment.prototype[key] = function () {
//         let args = Array.prototype.slice.call(arguments)
//         let originCallback = args[args.length - 1]
//         return new Promise((resolve, reject) => {
//           let handleResult = function (err, result) {
//             if (err) {
//               reject(err)
//             } else {
//               resolve(result)
//             }
//           }
//           if (typeof originCallback !== 'function') {
//             args.push(handleResult)
//           } else {
//             args[args.length - 1] = function (err, result) {
//               handleResult(err, result)
//               originCallback(err, result)
//             }
//           }
//           func.apply(this, args)
//         })
//       }
//     }
//   }
// }

