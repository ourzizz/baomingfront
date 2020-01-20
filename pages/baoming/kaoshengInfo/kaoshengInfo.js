/**
 * 填报人信息填写点击保存后姓名和身份证就变成不可修改字段
 * 代码长度增加后耦合性非常头疼
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
        step:0,
        activeIndex: -1,
        kaosheng_flg:"new",
        kaoshengInfo: {
            photoUrl:"null"
        },
        kaoshengInfoCopy:{},//填报人副本用于对比原始数据找出修改部分
        userInfo:{},
        logged:false,
        localImagePath:'', //小程序wxml页面显示的图片列表,如果是修改那么就是从服务器请求的url，否则为本地选中的图片列表
        imageName:'', //upload返回的是url和name，以前开发保留了name用逗号连接存到数据库，这个列表是存储使用的,服务器发来的namelist
        tempFilePath:'', //待上传列表
        tree_list:[],//职位表树形结构列表
        layer:[], //存储层级代码长度
        baomingInfo:{},//给后台增改(一旦报名不能删除) 包括报考职位代码 确认状态 审核情况 未通过原因
        baomingInfoCopy:{},//副本 涉及到改的都需要副本对比
        zhiweiPath:[],//view填报人只管查看已经勾选的报考地区-单位-职位信息
        operas:[
            {step:0,name:"信息填写",onoff:true},//step1一直开放
            {step:1,name:"上传照片",onoff:false},//默认关闭 已经填过信息或者保存成功的填报人开启上传
            {step:2,name:"选择职位",onoff:false},
            {step:3,name:"信息确认",onoff:false},
            {step:4,name:"查看信息",onoff:false},
        ]
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
                that.init_kaoshengInfo(result.data.kaoshengInfo)
                that.init_baomingInfo(result.data.baomingInfo)
                that.init_fillTable(result.data.config,result.data.kaoshengInfo,result.data.filltable)
                that.init_zhiwei(result.data.zhiwei)
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    init_kaoshengInfo:function(kaoshengInfo){
        let that = this
        wx.hideToast()
        if (kaoshengInfo == null) {//填报人没有填写过任何信息
            that.setData({
                kaosheng_flg: "new",
                // kaoshengInfo:{photoUrl:'null',ksid:ksid,sfzid:'522401198508292031',name:'测试',telphone:'13308570523'},
                kaoshengInfo: { photoUrl: 'null', ksid: that.data.options.ksid },
            })
        } else {//有填报人信息
            that.data.imageName = kaoshengInfo.photoUrl.replace(cosPath, '')
            that.data.operas[1].onoff = true
            if (kaoshengInfo.photoUrl != 'null') {//填报人已经上传图片 开放选择职位步骤
                that.data.operas[2].onoff = true
            }
            that.setData({
                kaosheng_flg: "edit",
                kaoshengInfo: kaoshengInfo,
            })
        }
        that.data.kaoshengInfoCopy = JSON.parse(JSON.stringify(kaoshengInfo));
        that.setData({
            operas: that.data.operas
        }) 
    },

    init_baomingInfo: function (baomingInfo) {
        let that = this
        if (baomingInfo === null) {//无报名信息=>填报人以往报过其他考试 本考试未报名,报名未确认
            baomingInfo = { open_id: this.data.options.openId, ksid: this.data.options.ksid, code: "", bmconfirm: 0 }
        } else {
            that.getPath(baomingInfo.code)
            that.data.operas[1].onoff = true //有报名信息证明 填写 照片 职位都完成了 需要打开全部环节
            that.data.operas[2].onoff = true
            that.data.operas[3].onoff = true
            that.data.operas[4].onoff = true
            that.data.zhiweiPath = baomingInfo.zhiweiPath.split(',')
        }
        that.data.baomingInfoCopy = JSON.parse(JSON.stringify(baomingInfo));
        that.setData({
            baomingInfo: baomingInfo,
            operas: that.data.operas
        }) 
    },

    init_zhiwei: function (zhiwei) {
        let that = this
        that.data.tree_list = zhiwei
        that.init_tree_list(that.data.tree_list)
        that.setData({
            tree_list: that.data.tree_list,
            zhiweiPath: that.data.zhiweiPath
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
    },//}}}

    init_tree_list:function(tree_list){
        var layer = this.data.layer
        this.data.tree_list.forEach(element => {
            //遍历一遍tree 计算每个节点layer 生成layer数组确定数组索引为层级 元素为长度 
            var idx = -1
            for(var i=0;i<layer.length;i++){
                if(layer[i] === element.code.length){
                    idx = i
                }
            }
            if(idx === -1){
                element.layer = layer.length
                layer.push(element.code.length)
            }else{
                element.layer = idx 
            }

            if(element.layer === 0){
                element.show_self = true
            }else{
                element.show_self = false
            }
            element.show_sons = false
        });
    },

    operate_tree: function (event) {
        var tree_list = this.data.tree_list
        var idx = event.currentTarget.dataset.idx
        if (tree_list[idx].show_sons == true) {
            this.close_node(tree_list[idx])
        } else {
            this.open_node(tree_list[idx])
        }
        this.setData({
            tree_list: tree_list,
            activeIndex: idx,
        })
    },

    open_node: function (node) {//打开一个节点，所有同级的下级全部折叠
        var tree_list = this.data.tree_list
        var parentCode = node.code
        node.show_sons = true;
        tree_list.forEach(element => {
            if (element.pptr === parentCode) {
                element.show_self = true
                if(element.cptr != 0 && element.show_sons ==true){
                    this.open_node(element)
                }
            }
        });
    },

    close_node: function (node) {
        var tree_list = this.data.tree_list
        node.show_sons = false //这里应该给idx 设置treelist
        var parentCode = node.code
        tree_list.forEach(element => {
            if (element.code.indexOf(parentCode)!==-1 && element.layer>node.layer) {
                element.show_self = false
            }
        });
    },


    set_idx: function (event) {
        var idx = event.currentTarget.dataset.idx
        this.setData({
            activeIndex: idx
        })
    },

    radioChange: function (e) {
        var path = []
        var idx = this.data.activeIndex
        var code = e.detail.value
        var that = this
        this.getPath(code)
        this.data.tree_list.forEach(element => {
            if(element.code !== code){
                element.checked = false
            }else{
                element.checked = true
            }
            this.init_tree_list()
        });
        this.data.baomingInfo.code = code
        this.data.baomingInfo.zhiweiPath = this.data.zhiweiPath.toString(),
        this.setData({
            tree_list:this.data.tree_list,
            zhiweiPath:this.data.zhiweiPath,
        })
        wx.showModal({
            title: '职位确认',
            content: this.data.zhiweiPath.toString(),
            success(res) {
                if (res.confirm) {
                    that.submit_zhiwei()
                } else if (res.cancel) {
                    return
                }
            }
        }) //}}}
    },

    getPath:function(code){ //"1240202201"
        var layer = this.data.layer 
        var tempCode = ""
        this.data.zhiweiPath = []
        for(var i=0;i<layer.length;i++){
            tempCode = code.substr(0,layer[i])
            this.data.tree_list.forEach(element => {
                if (element.code === tempCode) {
                    this.data.zhiweiPath.push(element.description)
                }
            });
        }
    },

    baoming_confirm: function () {
        let that = this
        wx.showModal({
            title: '请确认',
            content: '确认后所有信息将被锁定不可修改',
            success(res) {
                if (res.confirm) {
                    qcloud.request({
                        url: `${config.service.host}/baoming/kaoshengInfo/bmconfirm`,
                        data: {
                            baomingInfo: JSON.stringify(that.data.baomingInfo)
                        },
                        method: 'POST',
                        header: { 'content-type': 'application/x-www-form-urlencoded' },
                        success(result) {//更新后 更新所有副本
                            that.data.baomingInfo.bmconfirm = '1'
                            that.setData({
                                baomingInfo: that.data.baomingInfo
                            })
                        },
                        fail(error) {
                            that.jump()
                        }
                    })
                } else if (res.cancel) {
                    return
                }
            }
        }) //}}}
    },

    input_change: function (e) {
        var kaoshengInfo = this.data.kaoshengInfo
        this.data.kaoshengInfo[e.currentTarget.dataset.keyname] = e.detail.value;
    },

    check_message: function () {//{{{
        var fb = this.data.filltable
        let kaoshengInfo = this.data.kaoshengInfo
        for(var i=0,max=fb.length;i<max;i++){
            if(fb[i].regexpr != ''){ //正则表达式为空表示不验证
                var regx = new RegExp(fb[i].regexpr,'g')
                if(!regx.exec(kaoshengInfo[fb[i].keyname])){
                    util.showModel('信息填写错误',fb[i].errmsg)
                    return false
                }
            }
        }
        return true 
    },//}}}

    //用户点击提交
    submit:function (){//{{{
        if (this.check_message()) {
            if(this.data.kaosheng_flg === "new"){//新增填报人信息
                this.new_kaosheng()
            }else{//更新数据库
                this.update_kaosheng()
            }
        }else{
        }
    },//}}}

    submit_zhiwei:function(){
        let that = this
        util.showBusy("保存数据")
        if(this.data.baomingInfo.code !== this.data.baomingInfoCopy.code){//报考职位有变化
            let bmtemp = {}
            bmtemp.open_id = that.data.baomingInfo.open_id
            bmtemp.ksid = that.data.baomingInfo.ksid
            bmtemp.code = that.data.baomingInfo.code
            bmtemp.zhiweiPath = that.data.baomingInfo.zhiweiPath
            qcloud.request({
                url: `${config.service.host}/baoming/kaoshengInfo/baoming`,
                data: {
                    baomingInfo: JSON.stringify(bmtemp)
                },
                method: 'POST',
                header: { 'content-type': 'application/x-www-form-urlencoded' },
                success(result) {//更新后 更新所有副本
                    wx.hideToast()
                    that.data.operas[3].onoff = true
                    that.setData({
                        baomingInfo:result.data,
                        operas:that.data.operas
                    })
                },
                fail(error) {
                    that.jump()
                }
            })
        }
    },

    get_modify:function(){
        var ksCopy = this.data.kaoshengInfo
        var ksOrigin = this.data.kaoshengInfoCopy
        var keys = Object.getOwnPropertyNames(this.data.kaoshengInfo);
        var Modify = {}
        for (var i = 0, max = keys.length; i < max; i++) {
            var propName = keys[i];
            if (propName !== 'sfzid' && propName !== 'name') {//身份证和姓名为不可修改字段
                if (ksCopy[propName] !== ksOrigin[propName]) {
                    Modify[propName] = ksCopy[propName]
                }
            }
        }
        return Modify;
    },

    //保存修改的信息
    update_kaosheng:function (Modify){//{{{
        var that = this
        var Modify = this.get_modify()
        if(Modify === 'NULL'){
            return
        }
        util.showBusy("正在更新数据")
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/update_kaosheng`,
            data: {
                open_id: that.data.options.openId,
                ksid:that.data.options.ksid,
                kaoshengInfo: JSON.stringify(Modify),
            },
            method: 'POST',
            header: { 'content-type': 'application/x-www-form-urlencoded' },
            success(result) {//更新后 更新所有副本
                that.init_kaoshengInfo(result.data.kaoshengInfo) 
                that.filltable_bind_kaosheng(result.data.kaoshengInfo) 
                wx.hideToast()
            },
            fail(error) {
                that.jump()
            }
        })
    },//}}}

    //新建填报人信息
    new_kaosheng: function () {//{{{
        let that = this
        wx.showModal({
            title: '请确认' + that.data.kaoshengInfo.name + that.data.kaoshengInfo.sfzid  ,
            content: '提交后姓名身份证信息将被锁定不可修改',
            success(res) {
                if (res.confirm) {
                    let kaoshengInfo = that.data.kaoshengInfo
                    kaoshengInfo.open_id = that.data.userInfo.openId
                    util.showBusy('保存数据中')
                    qcloud.request({
                        url: `${config.service.host}/baoming/kaoshengInfo/store_kaosheng`,
                        data: {
                            kaoshengInfo: JSON.stringify(kaoshengInfo),
                            ksid:that.data.options.ksid
                        },
                        method: 'POST',
                        header: { 'content-type': 'application/x-www-form-urlencoded' },
                        success(result) {
                            wx.hideToast()
                            if(result.data.kaoshengInfo === 'null'){
                                wx.showModal({
                                    title: '重复报名',
                                    content: '同一姓名、身份证号码只能报名一次',
                                }) //}}}
                            }else{
                                that.data.operas[1].onoff = true
                                that.setData({
                                    kaoshengInfo:result.data.kaoshengInfo,
                                    operas:that.data.operas
                                })
                            }
                            that.filltable_bind_kaosheng(result.data.kaoshengInfo)
                        },
                        fail(error) {
                        }
                    })
                } else if (res.cancel) {
                    return
                }
            }
        }) //}}}
        
    },//}}}


    //新上传的图片放到db中
    img_to_db:function (open_id,ksid,imgUrl){//{{{
        //请求后台update图片数据
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/update_db_img`,
            data: {
                open_id:open_id,
                ksid:ksid,
                imgUrl:imgUrl
            },
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },//}}}

    //修改信息，用户上传图片,本文件中只允许上传一张照片
    chooseImage: function (event) {//{{{
        var that = this;
        wx.chooseImage({
            count: 1, // 一次最多可以选择2张图片一起上传
            sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album'], // 可以指定来源是相册还是相机，默认二者都有
            success: function (res) {
                that.data.localImagePath = res.tempFilePaths[0];
                that.setData({
                    localImagePath:that.data.localImagePath
                });
                //文件上传中禁止点发布，否则上传不完整
                util.showBusy('正在上传')
                that.upload_cos(that.data.localImagePath)
            }
        })
    },//}}}

    //新上传到cos cos返回图片名称 再同步到db中
    upload_cos:function (filePath){//{{{
        let that = this
        wx.uploadFile({
            url: config.service.uploadUrl,
            filePath: filePath,
            name: 'file',
            success: function(res) {
                res = JSON.parse(res.data)
                that.delete_cos_img(that.data.imageName)//删除上一张图片
                that.data.imageName = res.data.name
                that.img_to_db(that.data.kaoshengInfo.open_id ,that.data.kaoshengInfo.ksid,res.data.imgUrl)//因为第一步必须填报信息，上传cos的同时直接进数据库避免僵尸图片产生
                that.data.kaoshengInfo.photoUrl = res.data.imgUrl
                that.data.operas[2].onoff = true
                that.setData({
                    kaoshengInfo:that.data.kaoshengInfo,
                    operas:that.data.operas
                })
                wx.hideToast()
            },
            fail: function(e) {
                util.showModel('上传图片失败')
            }
        })//end_uploadFile
    },//}}}
    //从cos中删除图片，一次一张
    delete_cos_img:function (img_name){//{{{
        var that = this
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/delete_cos_img`,
            data: {img_name:img_name},
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
                console.log(result)
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },//}}}

    previewImage: function () {//{{{
        var localImagePaths = [];
        localImagePaths[0] = this.data.kaoshengInfo.photoUrl;
        wx.previewImage({
            current: 0,
            urls: localImagePaths
        });
    },//}}}

    set_step:function(event){
        var step = event.currentTarget.dataset.step
        this.setData({
            step:step
        })
    },
})