/**
 * 填报人信息填写点击保存后姓名和身份证就变成不可修改字段
 */
var qcloud = require('../../../vendor/wafer2-client-sdk/index')
var config = require('../../../config')
var util = require('../../../utils/util.js')
var cls = require('../../../utils/myclass.js')
var cosPath = "http://bjks-1252192276.cos.ap-chengdu.myqcloud.com"
var app = getApp()
Page({
    data: {
        filltable: [], //下一步这里要做成数据库 直接配置生成 
        ksid: '',
        options:{},
        config:{}, //填报页面的配置属性
        kaoshengInfo: {
            photoUrl:"null"
        },
        baomingInfo:{},//给后台增改(一旦报名不能删除) 包括报考职位代码 确认状态 审核情况 未通过原因
        baomingInfoCopy:{},//副本 涉及到改的都需要副本对比
        zhiweiPath:[],//view填报人只管查看已经勾选的报考地区-单位-职位信息
    },

    init_page:function(openId,ksid){
        let that = this
        util.showBusy("下载数据中")
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/get_kaosheng_kaoshi`,
            data: {
                open_id:openId,
                ksid:ksid,
            },
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
                wx.hideToast()
                that.init_fillTable(result.data.config,result.data.kaoshengInfo,result.data.filltable)
                that.setData({
                    kaoshengInfo:result.data.kaoshengInfo,
                    baomingInfo:result.data.baomingInfo,
                    zhiweiPath:result.data.baomingInfo.zhiweiPath.split(',')
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },
   
    filltable_bind_kaosheng: function (kaoshengInfo){
        if (!Object.entries)
        Object.entries = function( obj ){
            var ownProps = Object.keys( obj ),
            i = ownProps.length,
            resArray = new Array(i); // preallocate the Array
                while (i--)
                resArray[i] = [ownProps[i], obj[ownProps[i]]];
                return resArray;
        };
        const map = new Map(Object.entries(kaoshengInfo))
        var ft = this.data.filltable
        for(var i=0;i<ft.length;i++){
            ft[i].value = map.get(ft[i].keyname)
        }
        this.setData({
            filltable:ft
        })

    },

    init_fillTable: function (config,kaoshengInfo,filltable) {
        var rsfb = filltable
        var that = this
        var activekeys = config.activekeys
        if (!Object.entries) //避免es6不兼容的pc端登录
            Object.entries = function (obj) {
                var ownProps = Object.keys(obj),
                    i = ownProps.length,
                    resArray = new Array(i); // preallocate the Array
                while (i--)
                    resArray[i] = [ownProps[i], obj[ownProps[i]]];
                return resArray;
            };
        for (var i = 0; i < rsfb.length; i++) {//配置本考试所打开的所有字段为on
            if (activekeys.search(rsfb[i].keyname) !== -1) {//存在
                that.data.filltable.push(rsfb[i])
            } 
        }
        if(!util.isEmptyObject(kaoshengInfo)){
            this.filltable_bind_kaosheng(kaoshengInfo)
        }
        that.setData({
            filltable: that.data.filltable,
            config: config
        })
    },

    onLoad: function (options) {//{{{ 需要向后台请求填报人基本信息 和报考信息
        let that = this
        this.data.ksid = options.ksid
        const session = qcloud.Session.get()
        if (session) { //session存在
            this.setData({
                userInfo: session.userinfo,
                logged: true,
                options:options
            })
        }
        this.init_page(options.openId,options.ksid) //onLoad里面init填报人顺带顺带表单初始化 没有办法避免耦合
    }
})
