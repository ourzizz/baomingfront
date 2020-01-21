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
            url: `${config.service.host}/baoming/index/get_all_act` ,
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
                    pageEt: result.data
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },
    bindGetUserInfo: function (event) {
        var that = this
        // if (this.data.logged) {
        //     this.jump(event)
        //     return
        // }
        util.showBusy('正在登录')
        const session = qcloud.Session.get()
        if (session) {
            qcloud.loginWithCode({
                success: res => {
                    this.setData({
                        userInfo: res,
                        logged: true
                    })
                    util.showSuccess('登录成功')
                    that.jump(event)
                },
                fail: err => {
                    console.error(err)
                    util.showModel('登录错误', err.message)
                }
            })
        } else {
            qcloud.login({
                success: res => {
                    this.setData({
                        userInfo: res,
                        logged: true
                    })
                    that.jump(event)
                    util.showSuccess('登录成功')
                },
                fail: err => {
                    console.error(err)
                    util.showModel('登录错误', err.message)
                }
            })
        }
    },
    tabClick: function (e) {
        this.setData({
            sliderOffset: e.currentTarget.offsetLeft,
            activeIndex: e.currentTarget.id
        });
    },

    jump:function(event){
        var ksid = event.currentTarget.dataset.ks_id
        var type = event.currentTarget.dataset.type
        var openId = this.data.userInfo.openId
        var configid = event.currentTarget.dataset.configid
        var url = ""
        switch (type) {
            case 'fill':
                url = '/pages/baoming/kaoshengInfo/kaoshengInfo?openId=' + openId + '&ksid=' + ksid + '&configId=' + configid
                break;
            case 'show':
                url = '/pages/baoming/showinfo/showinfo?openId=' + openId + '&ksid=' + ksid + '&configId=' + configid
                break;
            case 'chengji':
                url = '/pages/baoming/chengji/chengji?openId=' + openId + '&ksid=' + ksid
                break;
        }
        console.log(url)
        wx.navigateTo({
            url: url
        })
    },
    onShareAppMessage: function () {
    }
})
