var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
var config = require('../../config')
var sliderWidth = 96;
Page({

    data: {
        eventtime:{},//这里放的是整个页面数据
        pageEt:{},//这里是根据用户点击确定是happenning还是impend进行赋值渲染
        activeIndex: 0,
        sliderOffset: 0,
        sliderLeft: 0,
        userInfo: {},
        logged: false,
        takeSession: false
    },
    onLoad: function () {
        var that = this
        const session = qcloud.Session.get()
        if (session) { //session存在
            this.setData({
                userInfo: session.userinfo,
                logged: true
            })
        }
        that.user_get_acts()
    },
    user_get_acts:function (){
        var that = this
        qcloud.request({
            url: `${config.service.host}/baoming/index/get_active_events` ,
            data: {
                open_id: that.data.userInfo.openId
            },
            method: 'POST',
            header: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            success(result) {
                that.setData({
                    Hselected: '#EBEBEB',
                    Iselected: '#33FF00',
                    eventtime: result.data,
                    pageEt: result.data.events
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },
    onShareAppMessage: function () {
    }
})
