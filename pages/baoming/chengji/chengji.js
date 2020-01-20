//import { ftruncate } from "fs";
var qcloud = require('../../../vendor/wafer2-client-sdk/index')
var config = require('../../../config')
var util = require('../../../utils/util.js')
var cls = require('../../../utils/myclass.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    baomingInfo:{}
  },

  onLoad:function(options){
    let that = this
    util.showBusy("下载数据中")
    qcloud.request({
        url: `${config.service.host}/baoming/kaoshengInfo/get_baomingInfo`,
        data: {
            open_id:options.openId,
            ksid:options.ksid,
        },
        method: 'POST',
        header: { 'content-type':'application/x-www-form-urlencoded' },
        success(result) {
            wx.hideToast()
            that.setData({
              baomingInfo:result.data.baomingInfo
            })
        },
        fail(error) {
            util.showModel('请求失败', error);
            console.log('request fail', error);
        }
    })
  }

})