/**
 * 考生信息填写点击保存后姓名和身份证就变成不可修改字段
 */
var qcloud = require('../../../vendor/wafer2-client-sdk/index')
var config = require('../../../config')
var util = require('../../../utils/util.js')
var cls = require('../../../utils/myclass.js')
var cosPath = "http://bjks-1252192276.cos.ap-chengdu.myqcloud.com"
var app = getApp()
Page({
    data: {
        filltable: [
            { key: 'name', onoff:'on', lable: '姓名', value: '',placeholder:'不可修改字段' },
            { key: 'sfzid', onoff:'on', lable: '身份证号', value: '', placeholder:'不可修改字段'},
            { key: 'politics', onoff:'on', lable: '政治面貌', value: '', placeholder:'中共党员、中共预备党员、共青团员、群众；'},
            { key: 'birthday', onoff:'on', lable: '出生日期', value: '',placeholder:'例19900821' },
            { key: 'sex', onoff:'on', lable: '性别', value: '',placeholder:'男或女'},
            { key: 'telphone', onoff:'on', lable: '电话', value: '', placeholder:'联系电话'},
            { key: 'email', onoff:'on', lable: '电子邮箱', value: '', placeholder:'邮箱'},
            { key: 'address', onoff:'on', lable: '家庭住址', value: '', placeholder:'家庭住址'},
            { key: 'marital', onoff:'on', lable: '婚姻状况', value: '', placeholder:'未婚、已婚、离异、丧偶'},
            { key: 'degree', onoff:'on', lable: '学位', value: '',placeholder:'学位'},
            { key: 'education', onoff:'on', lable: '学历', value: '',placeholder:'学历'},
            { key: 'studentPlace', onoff:'on', lable: '生源地', value: '',placeholder:'生源地'},
            { key: 'school', onoff:'on', lable: '毕业学校', value: '',placeholder:'毕业学校' },
            { key: 'graduationDate', onoff:'on', lable: '毕业日期', value: '',placeholder:'毕业时间' },
            { key: 'major', onoff:'on', lable: '所学专业', value: '',placeholder:'须与毕业证一致' },
            { key: 'danwei', onoff:'on', lable: '工作单位', value: '',placeholder:'工作单位' },
            { key: 'danweiagree', onoff:'on', lable: '是否同意报考', value: '',placeholder:'填是否' },
            { key: 'jobtime', onoff:'on', lable: '工作时间', value: '',placeholder:'参加工作时间' },
            { key: 'placeOfBirth', onoff:'on', lable: '户籍地', value: '',placeholder:'户籍地' },
            { key: 'nationality', onoff:'on', lable: '民族', value: '',placeholder:'民族' },
            { key: 'certificate', onoff:'on', lable: '资格证书', value: '',placeholder:'资格证书' },
            { key: 'resume', onoff:'on', lable: '简历', value: '',placeholder:'简历从高中开始填写' }
        ],
        ksid: '',
        options:{},
        config:{}, //填报页面的配置属性
        step:0,
        activeIndex: -1,
        kaosheng_flg:"new",
        kaoshengInfo: {
            photoUrl:"null"
        },
        kaoshengInfoCopy:{},//考生副本用于对比原始数据找出修改部分
        userInfo:{},
        logged:false,
        localImagePath:'', //小程序wxml页面显示的图片列表,如果是修改那么就是从服务器请求的url，否则为本地选中的图片列表
        imageName:'', //upload返回的是url和name，以前开发保留了name用逗号连接存到数据库，这个列表是存储使用的,服务器发来的namelist
        tempFilePath:'', //待上传列表
        tree_list:[],//职位表树形结构列表
        layer:[], //存储层级代码长度
        baomingInfo:{},//给后台增改(一旦报名不能删除) 包括报考职位代码 确认状态 审核情况 未通过原因
        baomingInfoCopy:{},//副本 涉及到改的都需要副本对比
        zhiweiPath:[],//view考生只管查看已经勾选的报考地区-单位-职位信息
    },

    init_kaoshengInfo:function(openId,ksid){
        let that = this
        util.showBusy("下载数据中")
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/get_kaoshengInfo`,
            data: {
                open_id:openId,
                ksid:ksid,
            },
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
                wx.hideToast()
                if(result.data.kaoshengInfo == null){//考生没有填写过任何信息
                    that.setData({
                        kaosheng_flg:"new",
                        kaoshengInfo:{photoUrl:'null',ksid:ksid},
                    }) 
                }else{//有考生信息
                    that.data.imageName = result.data.kaoshengInfo.photoUrl.replace(cosPath,'')
                    that.setData({
                        kaosheng_flg:"edit",
                        kaoshengInfo:result.data.kaoshengInfo,
                    }) 
                }
                that.init_fillTable(that.data.kaoshengInfo)
                that.data.kaoshengInfoCopy = JSON.parse(JSON.stringify(result.data.kaoshengInfo));
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    init_baomingInfo:function(openId,ksid){
        let that = this
        util.showBusy("下载数据中")
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/get_baomingInfo`,
            data: {
                open_id:openId,
                ksid:ksid,
            },
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
                wx.hideToast()
                if (result.data.baomingInfo === null) {//无报名信息=>考生以往报过其他考试 本考试未报名,报名未确认
                    result.data.baomingInfo = {open_id:openId,ksid:ksid,code:"",bmconfirm:0}
                }else{
                  that.data.zhiweiPath = result.data.baomingInfo.zhiweiPath.split(',')
                }
                that.data.baomingInfoCopy = JSON.parse(JSON.stringify(result.data.baomingInfo));
                that.setData({
                    zhiweiPath:that.data.zhiweiPath,
                    baomingInfo:result.data.baomingInfo,
                }) 
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },


    init_fillTable:function(kaoshengInfo){
        const map = new Map(Object.entries(kaoshengInfo))
        var ft = this.data.filltable
        for(var i=0;i<ft.length;i++){
            ft[i].value = map.get(ft[i].key)
        }
        this.setData({
            filltable:ft
        })
    },

    init_config:function(ksid){
        let that = this
        util.showBusy("下载数据中")
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/get_config`,
            data: {
                ksid:ksid,
            },
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
                var filltable = that.data.filltable
                var activekeys = result.data.config.activekeys
                filltable.forEach(element => {
                    if(activekeys.search(element.key) == -1){
                        element.onoff = 'off'
                    }
                });
                that.setData({
                    config:result.data.config,
                    filltable:filltable
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    onLoad: function (options) {//{{{ 需要向后台请求考生基本信息 和报考信息
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
        this.init_config(options.ksid)
        this.init_kaoshengInfo(options.openId,options.ksid) //onLoad里面init考生顺带顺带表单初始化 没有办法避免耦合
        this.init_baomingInfo(options.openId,options.ksid)//异步执行，baoming职位依赖职位列别所以必须放在职位请求成功回调执行，否者会出现不显示职位路径的情况
    },//}}}
})
