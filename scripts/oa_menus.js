const wx = require('../common/offiaccount');
const moment = require('moment');

(async () => {

    let res = await wx.createMenus({
        "button": [

            {
                "name": "天蓝丝带",
                "sub_button": [
                    {
                        "type": "view",
                        "name": "近视防控",
                        "url": "https://mp.weixin.qq.com/s/negjrOG9t2KG2Td0xc_AMA"
                    },
                    {
                        "type": "miniprogram",
                        "name": "视力普查",
                        "url": "https://mp.weixin.qq.com/s/WmArw_itrMt-vvwAaITxUg",
                        "appid": "wx16cdc62d6cb425b9",
                        "pagepath": "pages/index/index"
                    },
                    {
                        "type": "view",
                        "name": "启动仪式",
                        "url": "https://mp.weixin.qq.com/s/tlHVbJv7SkU0AH2rDzEzng"
                    },
                    {
                        "type": "view",
                        "name": "领取报告",
                        "url": "https://mp.weixin.qq.com/s/WmArw_itrMt-vvwAaITxUg"
                    },
                ]
            },
            {
                "name": "爱眼科普",
                "sub_button": [
                    {
                        "type": "view",
                        "name": "公益广告",
                        "url": "https://v.qq.com/x/page/e0820sykqfs.html"
                    },
                    {
                        "type": "view",
                        "name": "近视科普",
                        "url": "https://mp.weixin.qq.com/s/b51DXWXSIGL4NaWdH9J19Q"
                    },
                    {
                        "type": "view",
                        "name": "弱视科普",
                        "url": "https://mp.weixin.qq.com/s/Zz7uzIQDhUf56bGrstEBbQ"
                    }]
            },
            {
                "name": "关于我们",
                "sub_button": [
                    {
                        "type": "view",
                        "name": "天蓝丝带",
                        "url": "https://mp.weixin.qq.com/s/SFbP_WxXIOXiAAbA-_kjnw"
                    },
                    {
                        "type": "view",
                        "name": "项目介绍",
                        "url": "https://mp.weixin.qq.com/s/w6G-11pJPyd0P17aKtcpHg"
                    },
                    {
                        "type": "view",
                        "name": "腾讯捐款",
                        "url": "https://ssl.gongyi.qq.com/m/weixin/detail.htm?pid=209513"
                    }]
            },
        ]
    });

    console.log('res', res)

})();