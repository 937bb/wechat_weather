/*
 * @Descripttion: 
 * @version: 
 * @Author: 937bb
 * @Date: 2022-08-22 09:21:23
 * @LastEditors: 937bb
 * @LastEditTime: 2022-08-25 22:25:14
 */

const express = require('express')
const sha1 = require('sha1');
const request = require('request');
const router = express.Router()
const {
  getUserDataAsync,
  parseXMLAsync,
  formatMessage
} = require('../utils/getWechatData.js')
const schedule = require('node-schedule');
const {
  logFunction
} = require('../utils/log4js')
const cityNumList = require('../utils/cityNum.js');


let config = { //配置信息
  appID: "wx204b87a72dbd27d9", //（必填）
  appsecret: "be10c100d5d9c6e24286548bc2c5427a", //（必填）
  //这里你得填写你自己设置的Token值
  token: "wangjiahao", //（必填）
  grant_type: 'client_credential', //默认不用修改
  access_token: '', //不用管
  city: '济南', //（必填）
  cityNum: '370100', // 在utils/cityNum中找到自己的城市编码（必填,）
  touser: 'oHQaO5xNbT7xDIaytwv-9Cd7Cv_I', //推送目标的OpenId  微信公众测试号中 微信扫码后的编码 （必填）
  template_id: 'UcB_OhfA2kHFpzMqV5eOCqsRHivPN7C3V5-N0c4gx-Q', // 消息模板编号 （必填）
  scheduler_time: '10 0 8 * * *' //（每天早上八点零分十秒,如要修改请看项目说明文件 或 百度搜索 node schedule 即可）
};

class Wechat {
  constructor(city, cityNum, touser, template_id) {
    this.city = city
    this.cityNum = cityNum
    this.requestData = { //发送模板消息的数据
      touser: touser,
      template_id: template_id, //模板编号
      data: {
        week: { // 今天周几
          value: '',
          color: '#173177'
        },
        date: { //今天日期
          value: '',
          color: '#273177'
        },
        city: {
          value: '',
          color: '#373177'
        },
        dayweather: { //白天天气
          value: '',
          color: '#473177'
        },
        nightweather: { //晚上天气
          value: '',
          color: '#473177'
        },
        daytemp: { //今日白天温度
          value: '',
          color: '#573177'
        },
        nighttemp: { //今日夜间温度
          value: '',
          color: '#573177'
        },
        daywind: { //今日白天风向
          value: '',
          color: '#673177'
        },
        nightwind: { //今日夜间风向
          value: '',
          color: '#673177'
        },
        daypower: { //今日白天风力
          value: '',
          color: '#773177'
        },
        nightpower: { //今日夜间风力
          value: '',
          color: '#773177'
        },
        // 已经结婚几天
        marriage: {
          value: '',
          color: '#873177'
        },
        // 距离下次结婚纪念日
        nextdays: {
          value: '',
          color: '#873177'
        },
        Sentence: {
          value: '',
          color: '#CC3333'
        },
        SentenceAuthor: {
          value: '',
          color: '#CC3333'
        }
      }
    }
  }
  getWeather() {
    return new Promise((resolve, reject) => {
      console.log(this.cityNum)
      // return false
      request({
          url: 'https://restapi.amap.com/v3/weather/weatherInfo',
          method: 'GET',
          json: true,
          qs: {
            key: 'a7f29b747354aa3dd8680cc8b3207288',
            city: this.cityNum,
            extensions: 'all',
            output: 'JSON'
          }
        },
        (err, rep, body) => {
          if (body.status == 1) {
            // console.log(body)

            // 今日日期 yy-mm-dd
            var date = new Date();
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var day = date.getDate();
            if (month < 10) {
              month = "0" + month;
            }
            if (day < 10) {
              day = "0" + day;
            }
            this.requestData.data.date.value = year + "-" + month + "-" + day;

            // 今天星期几
            this.requestData.data.week.value = "星期" + "日一二三四五六".charAt(new Date().getDay());

            // 获取今天的天气
            body.forecasts[0].casts.map((v, i) => {
              if (v.date == this.requestData.data.date.value) {
                this.requestData.data.city.value = this.city
                this.requestData.data.dayweather.value = body.forecasts[0].casts[i].dayweather //白天天气
                this.requestData.data.nightweather.value = body.forecasts[0].casts[i].nightweather //晚上天气
                this.requestData.data.daytemp.value = body.forecasts[0].casts[i].daytemp + '℃' //今日白天温度
                this.requestData.data.nighttemp.value = body.forecasts[0].casts[i].nighttemp + '℃' //今日夜间温度
                this.requestData.data.daywind.value = body.forecasts[0].casts[i].daywind + '风'
                this.requestData.data.nightwind.value = body.forecasts[0].casts[i].nightwind + '风'
                this.requestData.data.daypower.value = body.forecasts[0].casts[i].daypower + '级' //今日白天风力
                this.requestData.data.nightpower.value = body.forecasts[0].casts[i].nightpower + '级' //今日夜间风力
              }
            })

            // 开始时间
            let startDate = Date.parse('2021-11-19');
            // 今天
            let endDate = Date.parse(year + "-" + month + "-" + day);
            // 明年11月19日
            // 今年
            let thisYear = new Date().getFullYear();
            let nextDate = new Date(thisYear + 1, 11, 19)
            // 今天距离明年11月19日的天数
            this.requestData.data.nextdays.value = Math.ceil((nextDate.getTime() - endDate) / (24 * 60 * 60 * 1000)) + 1
            // 已经结婚几天
            this.requestData.data.marriage.value = (endDate - startDate) / (1 * 24 * 60 * 60 * 1000) + 1
            // console.log(this.requestData.data);
            resolve(true)
          } else {
            reject(false)
          }
        })
    })
  }

  getToken() {
    return new Promise((resolve, reject) => {
      request(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appID}&secret=${config.appsecret}`, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          // console.log(body) // 请求成功的处理逻辑
          config.access_token = JSON.parse(body).access_token;
          resolve(true)
        } else {
          reject(false)
        }
      })
    })
  }

  getDaySentence() {
    return new Promise((resolve, reject) => {
      request({
        url: 'https://saying.api.azwcl.com/saying/get',
        method: 'GET',
        json: true,
        qs: {}
      }, (err, rep, body) => {
        if (body.code == 200) {
          console.log(body.data)
          this.requestData.data.Sentence.value = body.data.content
          this.requestData.data.SentenceAuthor.value = body.data.author + '：'
          resolve(true)
        } else {
          reject(false)
        }
      })
    })
  }


  sendTemplateMsg(msg) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${config.access_token}`; //发送模板消息的接口
    if (msg == '我爱你') {
      this.requestData.template_id = 'PJ37uWVYX2mjPb3pi6fYJ-FA31CTPS1D1LJ52cDdVoc' //msg存在切换指定模板
    } else if (msg == '天气') {
      this.requestData.template_id = 'Bt3mIob5DVocAUxVZMiNVg-EQV8hVlgByiRxLB8fry4' //msg
    } else {
      this.requestData.template_id = config.template_id
    }
    return new Promise((resolve, reject) => {
      request({
        url: url,
        method: 'POST',
        body: this.requestData,
        json: true
      }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log('模板消息推送成功');

          resolve(true)
        } else {
          reject(false)
        }
      });
    })
  }
}

let wechatFun = new Wechat(config.city, config.cityNum, config.touser, config.template_id)


let scheduleCronstyle = () => {
  // console.log('scheduleCronstyle:', new Date())
  //每天早上8点0分10秒开始推送 （最新天气是8点更新 晚10秒可获取最新数据）
  schedule.scheduleJob(config.scheduler_time, async () => {

    try {
      wechatFun.city = config.city
      wechatFun.cityNum = config.cityNum
      wechatFun.requestData.touser = config.touser
      await wechatFun.getWeather()
      await wechatFun.getToken()
      await wechatFun.getDaySentence()
      await wechatFun.sendTemplateMsg()


      // 日志记录发送
      logFunction('schedule', {
        time: new Date(),
        touser: config.touser
      })
    } catch (e) {
      logFunction('schedule', {
        info: e,
        cityNum: config.cityNum,
        touser: config.touser,
      }, 'error')

    }
  });
}

scheduleCronstyle()

// 验证url时 post改为get，验证通过后再改回post
router.post('/wechatData', async (req, res) => {
  if (req.method == 'POST') {
    const xmlData = await getUserDataAsync(req)
    const jsData = await parseXMLAsync(xmlData)
    const message = await formatMessage(jsData)
    if (message.MsgType == 'text' && !message.Status) {
      wechatFun.requestData.touser = message.FromUserName

      let msg = ''

      if (message.Content == '我爱你') {
        msg = '我爱你'
        wechatFun.city = config.city
        wechatFun.cityNum = config.cityNum
      } else if (message.Content.indexOf('天气') > -1) {
        let foryes = false
        msg = '天气'

        wechatFun.city = message.Content.slice(0, message.Content.indexOf('天气'))

        await cityNumList.map((v) => {
          if (v.name == wechatFun.city) {
            wechatFun.cityNum = v.adcode
            foryes = true
          }
        })

        if (!foryes) {
          let send = `<xml>
          <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
          <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
          <CreateTime>${Date.now()}</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <Content><![CDATA[请输入地级市名称加天气，如："济南天气"，"北京天气"，"深圳天气"等]]></Content>
          </xml>`
          res.send(send)
          logFunction('keyword', {
            time: new Date(),
            touser: message.FromUserName,
            msg: '天气关键词不正确',
            keyword: message.Content
          }, 'error')
          return false
        }
      } else {
        let send = `<xml>
          <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
          <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
          <CreateTime>${Date.now()}</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <Content><![CDATA[未找到当前关键词，请重新输入；已有功能如下：'每日天气推送'，'我爱你主动回复'，'天气查询']]></Content>
          </xml>`
        res.send(send)
        logFunction('keyword', {
          time: new Date(),
          touser: message.FromUserName,
          msg: '关键词不正确',
          keyword: msg
        }, 'error')
        return false
      }
      try {
        await wechatFun.getWeather()
        await wechatFun.getToken()
        await wechatFun.getDaySentence()
        await wechatFun.sendTemplateMsg(msg)

        logFunction('keyword', {
          time: new Date(),
          touser: message.FromUserName,
          keyword: message.Content
        }, 'trace')
        res.send(`success`)

      } catch (err) {
        logFunction('keyword', {
          time: new Date(),
          touser: message.FromUserName,
          msg: err,
          keyword: message.Content
        }, 'error')
      }
    } else if (message.Content) {

      logFunction('keyword', {
        time: new Date(),
        touser: message.FromUserName,
        msg: '不是文字信息',
        keyword: message.Content
      }, 'error')
    }
  } else {
    const token = config.token; //获取配置的token
    const signature = req.query.signature; //获取微信发送请求参数signature
    const nonce = req.query.nonce; //获取微信发送请求参数nonce
    const timestamp = req.query.timestamp; //获取微信发送请求参数timestamp
    const str = [token, timestamp, nonce].sort().join(''); //排序token、timestamp、nonce后转换为组合字符串
    const sha = sha1(str); //加密组合字符串
    if (sha === signature) {
      const echostr = req.query.echostr; //获取微信请求参数echostr
      res.send(echostr + ''); //正常返回请求参数echostr
    } else {
      res.send('验证失败');
    }
  }
})





module.exports = router;