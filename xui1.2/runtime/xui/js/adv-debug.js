    /*support
    tab: to 4 space
    enter: add head space
    {enter: add head+4 space
    }:add head-4 space
    */
Class("xui.UI.TextEditor", ["xui.UI.Widget","xui.absValue"] ,{
    Instance:{
        activate:function(){
            var profile = this.get(0);
            profile.getSubNode('INPUT').focus();
            return this;
        },
        _setCtrlValue:function(value){
            if(_.isNull(value) || !_.isDefined(value))value='';
            return this.each(function(profile){
                var node=profile.getSubNode('INPUT').get(0);
                if(node.value.replace(/(\r\n|\r)/g, "\n")!=value.replace(/(\r\n|\r)/g, "\n")){
                    var st=node.scrollTop;
                    node.value=value;
                    node.scrollTop=st;
                }
            });
        },
        _getCtrlValue:function(value){
            var profile = this.get(0);
            return profile.getSubNode('INPUT').attr('value').replace(/(\r\n|\r)/g, "\n").replace(/( +)(\n)/g, "$2").replace(/\t/g, "    ");
        }
    },
    Initialize:function(){
        //modify default template for shell
        var t = this.getTemplate();
        _.merge(t.FRAME.BORDER,{
            BOX:{
                tagName:'div',
                INPUT:{
                    tagName:'textarea',
                    tabindex:'{tabindex}',
                    style:'{_css}'
                }
            },
            BAK1:{},
            BAK2:{tagName:'div'}
        },'all');
        this.setTemplate(t);
    },
    Static:{
        Appearances:{
            BOX:{
                width:'100%',
                height:'100%',
                left:0,
                top:0,
                //for firefox bug: cursor not show
                position:'absolute',
                overflow:(xui.browser.gek&&xui.browser.ver<3)?'auto':'hidden',
                'z-index':'10'
            },
            INPUT:{
                'font-family': 'Courier New, Courier, monospace',
                'font-size':'12px',
                'line-height':'14px',
                position:'absolute',
                'background-color':'#fff',
                left:0,
                top:0,
                border:0,
                margin:0,
                padding:0,
                overflow:'auto',
                'overflow-y':'auto',
                'overflow-x':'hidden',
                resize:'none'
            },
            'BAK1, BAK2':{
                'font-family': 'Courier New, Courier, monospace',
                'font-size':'12px',
                position:'absolute',
                visibility:'hidden',
                left:'-10000px',
                top:'-10000px'
            }
        },
        Behaviors:{
            INPUT:{
                onFocus:function(profile,e,src){
                    profile.box._onchange(profile,xui.use(src).get(0));
                },
                onChange:function(profile, e, src){
                    profile.boxing().setUIValue(xui.use(src).get(0).value);
                    profile.box._onchange(profile,xui.use(src).get(0));
                },
                afterKeydown:function(profile, e, src){
                    var pro=profile.properties,str,t;
                    if(pro.disabled || pro.readonly)return;
                    if(profile.$change)delete profile.$change;
                    var key = xui.Event.getKey(e),
                    node=xui.use(src).get(0),
                    k=key.key;
                    switch(k){
                        case 'tab':
                            var r=xui.use(src).caret(),
                                sel=node.value.slice(r[0],r[1]);
                            if(/(\n|\r)/.test(sel)){
                                //previous
                                str=node.value.slice(0,r[0]);
                                if(sel.charAt(0)!='\n' && sel.charAt(0)!='\r'){
                                    //change sel
                                    sel=str.slice(r[0]=str.lastIndexOf('\n'))+sel;
                                }
                                //
                                if(xui.browser.ie){
                                    t= (t=str.match(/\r/g))?t.length:0;
                                    r[0]-=t;
                                    t= (t=(node.value.slice(0,r[1])).match(/\r/g))?t.length:0;
                                    r[1]-=t;
                                }

                                //re caret
                                xui.use(src).caret(r[0],r[1]);

                                if(key.shiftKey){
                                    sel=sel.replace(/(\n|\n\r)    /g,'$1');
                                }else{
                                    sel=sel.replace(/(\n|\n\r)/g,'$1    ');
                                }
                                //insert
                                profile.box.insertAtCaret(profile,sel);

                                r[1]=r[0]+sel.length;
                                if(xui.browser.ie){
                                    t= (t=sel.match(/\r/g))?t.length:0;
                                    r[1]-=t;
                                }
                                //caret
                                xui.use(src).caret(r[0],r[1]);
                            }else{
                                if(key.shiftKey){
                                    xui.use(src).caret(r[0]-4,r[0]-4);
                                    r[0]-=4;
                                    r[1]-=4;
                                }else{
                                    profile.box.insertAtCaret(profile,'    ');
                                    r[0]+=4;
                                    r[1]+=4;
                                }
                            }
                            profile.$pos=r;
                            return false;
                        case 'enter':
                            var paras = profile.box.getParas(profile);
                            str = paras[1];
                            var len = str.length - _.str.ltrim(str).length;

                            if(str.charAt(str.length-1)=="{")
                                len +=4;
                            if(len){
                                profile.box.insertAtCaret(profile, '\n'+_.str.repeat(' ',len));
                                profile.$enter=true;
                                return false;
                            }
                            break;
                        default:
                            if(profile.tips){
                                profile.tips.destroy();
                                profile.tips=null;
                            }
                    }
                    node=null;
                },
                afterKeypress:function(profile, e, src){
                    if(profile.properties.disabled || profile.properties.readonly)return;
                    var key = xui.Event.getKey(e), k=key.key;
                    var me=arguments.callee, map=me.map || (me.map={space:1,enter:1,backspace:1,tab:1,"delete":1});
                    if(k.length==1 || map[k])
                        profile.$change=true;

                    switch(k){
                        case 'tab':
                            if(xui.browser.opr)
                                _.asyRun(function(){
                                    xui.use(src).caret(profile.$pos[0], profile.$pos[1]);
                                });
                            return false;
                        case 'enter':
                            if(profile.$enter){
                                delete profile.$enter;
                                return false;
                            }
                        case '}':
                            if(key.shiftKey){
                                var paras = profile.box.getParas(profile);
                                var
                                loc = paras[0],
                                str = paras[1],
                                pos=paras[2],
                                input=paras[3];
                                if(/ {4}$/.test(str)){
                                    var st=xui(src).scrollTop();
                                    input.value =
                                    input.value.substr(0,loc).replace(/ {4}$/,'}') +
                                    input.value.substr(loc, input.value.length);

                                    //fire event manully
                                    xui(input).onChange();

                                    profile.box.setCaretTo(input, loc - 4 + 1, st);

                                    return false;
                                }
                            }
                            break;
                    }
                },
                afterKeyup:function(profile, e, src){
                    var key = xui.Event.getKey(e),k=key.key;
                    var me=arguments.callee, map=me.map || (me.map={space:1,enter:1,backspace:1,tab:1,"delete":1});
                    if(k.length==1 || map[k])
                        profile.$change=true;

                    if(profile.$change){
                        delete profile.$change;
                        profile.box._onchange(profile,xui.use(src).get(0));
                    }
                }
            }
        },
        DataModel:{
            selectable:true,
            left:0,
            top:0,
            width:200,
            height:200,
            position:'absolute',
            disabled:{
                ini:false,
                action: function(v){
                    b.boxing().setReadonly(v);
                }
            },
            readonly:{
                ini:false,
                action: function(v){
                    this.getSubNode('INPUT').attr('readonly',v).css('background',v?'#EBEADB':'');
                }
            }
        },
        EventHandlers:{
            onChange:function(profile, oV, nV){}
        },
        RenderTrigger:function(){
            var ns=this;
            if(ns.properties.readonly)
                ns.boxing().setReadonly(true,true);

            var ie=xui.browser.ie,
                src=ns.getSubNode('INPUT').get(0),
                f=function(o){
                    //only for value in IE
                    if(ie && o.propertyName!='value')return true;

                    var src=ie?o.srcElement:this;
                    ns.box._onchange(ns,src);
                };
            if(ie){
                src.attachEvent("onpropertychange",f);
                src.attachEvent("ondrop",f);
                ns.$ondestory=function(){
                    src.detachEvent("onpropertychange",f);
                    src.detachEvent("ondrop",f);
                }
            }else{
                src.addEventListener("input",f,false);
                src.addEventListener("dragdrop",f,false);
                ns.$ondestory=function(){
                    var ns=this,
                        src=ns.getSubNode('INPUT').get(0);
                    if(src){
                        src.removeEventListener("input",f,false);
                        src.addEventListener("dragdrop",f,false);
                        src=null;
                    }
                }
                ns.getSubNode('BOX').$firfox2();
            }
        },
        _onchange:function(profile,src){
            if(profile.onChange){
                var v=src.id;
                _.resetRun(profile.$xid+'_drop', function(){
                    v=xui.Dom.byId(v).value||'';
                    profile.$prevV=profile.$prevV||'';
                    if(v!=profile.$prevV){
                        profile.boxing().onChange(profile, profile.$prevV, v);
                        profile.$prevV=v;
                    }
                });
            }
        },
        _prepareData:function(profile){
            var d=arguments.callee.upper.call(this, profile);
            if(xui.browser.kde)
                d._css='resize:none;';
            return d;
        },
        //
        _onresize:function(profile,width,height){
            var size = arguments.callee.upper.apply(this,arguments);
            profile.getSubNode('BOX').cssSize(size);
            profile.getSubNode('INPUT').cssSize(size);
        },
        //for
        insertAtCaret:function(profile, text) {
            var input = profile.getSubNode('INPUT'),
                scrollTop = input.scrollTop() || null,
                ret;
            //fire onChange manully
            input.onChange();
            //replace text
            ret=input.caret(text);
            //set cursor
    	    this.setCaretTo(input.get(0), ret||0, scrollTop);
    	},
        //set cursor to textarea
        setCaretTo:function(input, pos, scrollTop){
            input.focus()
            var s,c,h,o=xui([input]);

            //opera not support scrollTop in textarea
            if(_.isNumb(scrollTop))
                o.scrollTop(scrollTop);

            if(scrollTop===true){
                if(o.get(0).tagName.toLowerCase() == 'textarea' && o.scrollHeight() !== o.offsetHeight()){
                    s = o.attr('value').substr(0,pos);
                    c = o.clone().id('').css({visibility:'hidden',position:'absolute',left:5000+'px'}).attr('value',s);
                    xui('body').append(c);
                    h = Math.max((c.scrollHeight() > c.offsetHeight()) ? c.scrollHeight() - 30 : 0,0);
                    o.scrollTop(h);
                    c.remove();
                }
            }
            o.caret(pos,pos);
        },
        /*
        return array
        [0] char number before caret
        [1] line number of caret
        [2] absPos of caret
        [3] text before caret
        */
        getParas:function(profile){
            var o = profile.getSubNode('INPUT'), 
                me=arguments.callee, 
                reg = me.reg ||(me.reg=/\r\n/g),
                v = o.get(0).value,
                loc = o.caret();

            if(loc[0]<0)loc[0]=0;

            //for ie/opera
            var l=0, m = v.substr(0,loc[0]).match(reg);
            if(m)l=m.length;
            v = v.replace(reg,'\n');
            var txt = v.substr(0,loc[0]-l);

            var
            li = txt.lastIndexOf('\n') ,
            line = txt.substr(li+1, loc[0]-li),
            w=o.innerWidth(),
            bak1 = profile.getSubNode('BAK1'),
            bak2 = profile.getSubNode('BAK2')
            ;
            if(txt.charAt(txt.length-1)=='\n')txt+='*';

            bak2.width(w);
            var
            x = bak1.html(line.replace(/ /g,'&nbsp;'),false).width(),
            y = bak2.html(txt.replace(/\n/g,'<br />'),false).height() - o.scrollTop();

            if(x>w){
                bak2.html(line,false);
                var lbak = line;
                var bl = bak2.height();
                while(lbak){
                    //delete last words
                    lbak=lbak.replace(/ [^ ]*$/,'');
                    bak2.html(lbak,false);
                    if(bak2.height()!=bl)break;
                }
                lbak = line.substr(lbak.length, line.length-lbak.length);
                x = bak1.html(lbak,true).width();
            }

            bak1.html('',false);
            bak2.html('',false);

            var pos = profile.getRoot().offset();
            pos.left+=x;
            pos.top+=y;
            return [loc[0],line,pos,o.get(0),txt];
        }
    }
});
Class('xui.UI.TimeLine', ['xui.UI','xui.absList',"xui.absValue"], {
    Dependency:['xui.Date'],
    Instance:{
        _setCtrlValue:function(value){
            if(!value)return;
            if(value.indexOf(':')==-1)return;
            var profile=this.get(0),
                p=profile.properties,
                box=this.constructor,
                a=value.split(':'),
                from=new Date(parseInt(a[0],10)),
                to=new Date(parseInt(a[1],10)),
                pxStart=box._getX(profile,from),
                pxEnd=box._getX(profile,to),
                task;

            if(p.items.length===0)
                this.insertItems([{id:'$', caption:p.dftTaskName, from:parseInt(a[0],10), to:parseInt(a[1],10)}],null,true);
            else
                box._resetItem(profile,{left:pxStart,width:pxEnd-pxStart},profile.getSubNodeByItemId('ITEM',p.items[0].id)._get(0));
        },
        visibleTask:function(){
            var profile=this.get(0),
                p=profile.properties,
                date=xui.Date,
                items=p.items,sv,target;

            if(!p.multiTasks){
                sv=items.length?items[0].from:p.$UIvalue?p.$UIvalue.split(':')[0]:0;
                if(sv){
                    target=new Date(+sv);
                    if(profile.renderId){
                        if(target<p.dateStart || target>date.add(p.dateStart,'ms',p.width*p._rate)){
                            p.dateStart=target;
                            var k=p.$UIvalue;
                            this.refresh().setUIValue(k,true);
                        }
                    }else{
                        p.dateStart=target;
                    }
                }
            }
            return this;
        },
        _afterInsertItems:function(profile){
            if(!profile.renderId)return;
           profile.box._reArrage(profile);
        },
        _afterRemoveItems:function(profile){
            profile.box._reArrage(profile);
        },
        _cache:function(){
            var profile=this.get(0),
                cls=this.constructor,
                picker=cls._picker;
            if(picker && picker.renderId)
                profile.getSubNode('POOL').append(picker.getRoot().css('display','none'));
        },
        getTimeRange:function(){
            var profile=this.get(0), p=profile.properties;
            return [p._smallLabelStart, p._smallLabelEnd];
        },
        iniContent:function(){
            return this.each(function(profile){
                var p=profile.properties;
                profile.boxing()._getContent(p._smallLabelStart,p._smallLabelEnd,p._rate,'ini');
                profile._iniOK=true
            });
        },

        addTasks:function(arr){
            return this.insertItems(arr,null,true);
        },
        removeTasks:function(ids){
            this.removeItems(ids);
            return this;
        },
        _getContent:function(from,to,rate,type){
//console.log('getContent',from,to,rate,type);
            return this.each(function(profile){
                if(profile.onGetContent){
                    var ins=profile.boxing(),
                        callback=function(arr){
                            if(type=='ini')
                                ins.clearItems();
                            ins.addTasks(arr);
                        };
                    if(profile.onGetContent){
                        var r = ins.onGetContent(profile, from, to, rate, type, callback);
                        if(r)callback(r);
                    }
                }
            });
        },
        scrollToLeft:function(callback){
            var profile=this.get(0);
            if(profile.pauseA||profile.pause)return;

            var t=profile.properties,
                date=xui.Date,
                rate=t._rate,
                o=profile.box._getMoveNodes(profile),
                x1=t._band_left,
                x2=0;
            ;
            if(t.minDate && t._smallLabelStart<t.minDate)
                x2-=date.diff(t._smallLabelStart,t.minDate,'ms')/rate;

            profile.pause=true;
            o.animate({left:[x1,x2]}, null, function(){
                if(typeof callback=='function')
                    callback();
                profile.pause=false;
            },Math.max(300,(x2-x1)/10),0,'sineInOut').start();
        },
        scrollToRight:function(callback){
            var profile=this.get(0);                    
            if(profile.pauseA||profile.pause)return;
            var t=profile.properties,
                date=xui.Date,
                rate=t._rate,
                o=profile.box._getMoveNodes(profile),
                x1=t._band_left,
                x2=t.width-t._band_width;
            ;
            if(t.maxDate && t._smallLabelEnd>t.maxDate)
               x2+=date.diff(t.maxDate,t._smallLabelEnd,'ms')/rate;

            if(x1>x2){
                profile.pause=true;
                o.animate({left:[x1,x2]}, null, function(){
                    if(typeof callback=='function')
                        callback();
                    profile.pause=false;
                },Math.max(300,(x2-x1)/10),0,'sineInOut').start();
            }
        }
    },
    Static:{
        Templates:{
            tagName:'div',
            style:'{_style}',
            className:'{_className}',
            BORDER:{
                tagName:'div',
                style:'height:{_bHeight}px;width:{_bWidth}px;',
                POOL:{
                    tagName:'div',
                    style:'position:absolute;left:0;top:0;width:0;height:0;display:none;'
                },
                TBAR:{
                    tagName:'div',
                    className:'xui-uibar-top',
                    style:'{_bardisplay};',
                    TBART:{
                        cellpadding:"0",
                        cellspacing:"0",
                        width:'100%',
                        border:'0',
                        tagName:'table',
                        className:'xui-uibar-t',
                        TBARTR:{
                            tagName:'tr',
                            TBARTDL:{
                                tagName:'td',
                                className:'xui-uibar-tdl'
                            },
                            TBARTDM:{
                                $order:1,
                                width:'100%',
                                tagName:'td',
                                className:'xui-uibar-tdm'
                            },
                            TBARTDR:{
                                $order:2,
                                tagName:'td',
                                className:'xui-uibar-tdr'
                            }
                        }
                    },
                    BARCMDL:{
                        tagName:'div',
                        className:'xui-uibar-cmdl',
                        DATE:{$order:0,style:'{dateDisplay}'},
                        PRE:{$order:2},
                        'ZOOMIN':{$order:3,style:'{zoomDisplay}'},
                        'ZOOMOUT':{$order:4,style:'{zoomDisplay}'},
                        NEXT:{$order:5}
                    },
                    BARCMDR:{
                        tagName: 'div',
                        className:'xui-uibar-cmdr',
                        OPT:{
                            className:'xui-uicmd-opt',
                            style:'{optDisplay}',
                            $order:0
                        },
                        CLOSE:{
                            $order:4,
                            className:'xui-uicmd-close ',
                            style:'{closeDisplay}'
                        }
                    }
                },
                MAIN:{
                    $order:2,
                    tagName:'div',
                    className:'xui-uicon-main',
                    MAINI:{
                        tagName:'div',
                        className:'xui-uicon-maini',
                        MAINC:{
                            tagName:'div',
                            MAINP:{
                                tagName:'div',
                                VIEW:{
                                    tagName:'div',
                                    style:'left:{_band_left}px;width:{_band_width}px;',
                                    BAND:{
                                        $order:2,
                                        tagName:'div',
                                        tabindex: '{tabindex}',
                                        BIGLABEL:{
                                            tagName:'div',
                                            style:'{_showBigLabel}',
                                            text:"{_bigMarks}"
                                        },
                                        SMALLLABEL:{
                                            $order:1,
                                            tagName:'div',
                                            text:"{_smallMarks}"
                                        }
                                    },
                                    CON:{
                                        $order:3,
                                        tagName:'div',
                                        style:'height:{_viewHeight}px;',
                                        BG:{
                                            tagName:'div',
                                            style:'height:{_viewHeight}px;'
                                        },
                                        LINES:{
                                            $order:1,
                                            tagName:'div'
                                        },
                                        ITEMS:{
                                            $order:2,
                                            tagName:'div',
                                            style:'height:{_viewHeight}px;',
                                            text:'{items}'
                                        }
                                    },
                                    ACTIVE:{
                                        $order:4,
                                        tagName:'div'
                                    }
                                },
                                SCROLL:{
                                    $order:2,
                                    tagName:'div',
                                    SCROLLI:{
                                        tagName:'div'
                                    }
                                }
                            }
                        }
                    }
                },
                TAIL:{
                    $order:4,
                    tagName:'div',
                    className:'xui-uicon-main',
                    TIPS:{
                        className:'xui-uicon-maini',
                        style:'z-index:2;{_tipsdisplay};',
                        tagName:'div'
                    }
                },
                BBAR:{
                    $order:5,
                    tagName:'div',
                    style:'{_bardisplay};',
                    className:'xui-uibar-bottom-s',
                    BBART:{
                        cellpadding:"0",
                        cellspacing:"0",
                        width:'100%',
                        border:'0',
                        tagName:'table',
                        className:'xui-uibar-t',
                        BBARTR:{
                            tagName:'tr',
                            BBARTDL:{
                                tagName:'td',
                                className:'xui-uibar-tdl'
                            },
                            BBARTDM:{
                                $order:1,
                                width:'100%',
                                tagName:'td',
                                className:'xui-uibar-tdm'
                            },
                            BBARTDR:{
                                $order:2,
                                tagName:'td',
                                className:'xui-uibar-tdr'
                            }
                        }
                    }
                }
            },
            $submap : {
                _bigMarks:{
                    LABELT:{
                        id:null,
                        className:null,
                        tagName:'div',
                        style:'width:{width}px;left:{left}px;',
                        text:'{text}'
                    }
                },
                _smallMarks:{
                    LABELB:{
                        id:null,
                        className:null,
                        tagName:'div',
                        style:'width:{width}px;left:{left}px;',
                        text:'{text}'
                    }
                },
                bgitems:{
                    BGITEM:{
                        tagName:'div',
                        style:'left:{_left}px;width:{_width}px;'
                    }
                },
                items:{
                    ITEM:{
                        tagName:'div',
                        className:'{itemClass} {disabled} {readonly} {_excls}',
                        style:'left:{_left}px;width:{_width}px;{_top};{_zindex}{itemStyle}',
                        HEAD:{
                            tagName:'div',
                            TSKBAR:{
                                tagName:'div',
                                style:'width:{_perw}%;'
                            },
                            HANDLER:{
                                $order:2,
                                tagName:'div',
                                LEFT:{
                                    tagName:'div'
                                },
                                RIGHT:{
                                    tagName:'div'
                                }
                            }
                        },
                        BODY:{
                            $order:1,
                            tagName:'div',
                            style:'{_background}',
                            CON:{
                                $order:3,
                                tagName:'div',
                                text:'{caption}'
                            }
                        }
                    }
                }
            }
        },
        Behaviors:{
            DroppableKeys:['VIEW'],
            HoverEffected:{PRE:'PRE',NEXT:'NEXT',ZOOMIN:'ZOOMIN',ZOOMOUT:'ZOOMOUT',DATE:'DATE',OPT:'OPT',CLOSE:'CLOSE'},
            ClickEffected:{PRE:'PRE',NEXT:'NEXT',ZOOMIN:'ZOOMIN',ZOOMOUT:'ZOOMOUT',DATE:'DATE',OPT:'OPT',CLOSE:'CLOSE'},
            onSize:xui.UI.$onSize,
            CLOSE:{
                onClick:function(profile, e, src){
                    if(profile.properties.disabled||profile.properties.readonly)return;
                    var instance = profile.boxing();

                    if(false===instance.beforeClose(profile, src)) return;

                    instance.destroy();

                    //for design mode in firefox
                    return false;
                }
            },
            OPT:{
                onClick:function(profile, e, src){
                    if(profile.properties.disabled||profile.properties.readonly)return;
                    profile.boxing().onShowOptions(profile, e, src);
                }
            },
            BAND:{
                onKeydown:function(profile, e, src){
                    if(profile.pauseA||profile.pause)return;
                    profile.pause=true;

                    // speed
                    var t=profile.properties,
                        date=xui.Date,
                        rate=t._rate,
                        maxOffset = 30,
                        o=profile.box._getMoveNodes(profile),
                        x=o.left(),
                        xx=t._band_left,
                        off=t._scroll_offset
                        ;

                    off = t._scroll_offset = off>maxOffset ? off :off*1.05;

                    switch(xui.Event.getKey(e).key){
                        case 'left':
                        case 'up':
                            if(t.minDate && date.add(t.dateStart,'ms',(xx-x-off)*rate)<t.minDate)
                                off=date.diff(t.minDate, t.dateStart,'ms')/rate + (xx-x);
                            if(off<0)off=0;
                            o.left(x + off);
                            break;
                        case 'right':
                        case 'down':
                            if(t.maxDate && date.add(t.dateStart,'ms',(xx-x+off+t.width)*rate)>t.maxDate)
                                off=date.diff(t.dateStart,t.maxDate,'ms')/rate - (xx-x+t.width);
                            if(off<0)off=0;
                            o.left(x - off);
                            break;
                    }

                    if((x + maxOffset > 0) || (x + o.width() - t.width - maxOffset < 0))
                        profile.box._rePosition(profile);
                    profile.pause=false;
                    return false;
                },
                onKeyup:function(profile, e){
                    var p=profile.properties;
                    p._scroll_offset = p._scrollRate;
                    profile.box._rePosition(profile);
                },
                onMousedown:function(profile, e, src){
                    if(xui.Event.getBtn(e)!="left")return;
                    if(profile.pauseA||profile.pause)return;
                    var t=profile.properties,
                        r=-t._band_left,
                        date=xui.Date,
                        rate=t._rate,
                        ep=xui.Event.getPos(e),
                        l=t._band_width-r-t.width;
                    ;
                    if(t.minDate && t._smallLabelStart<t.minDate)
                        r-=date.diff(t._smallLabelStart,t.minDate,'ms')/rate;
                    if(t.maxDate && t._smallLabelEnd>t.maxDate)
                        l-=date.diff(t.maxDate,t._smallLabelEnd,'ms')/rate;
                    if(r<0)r=0;
                    if(l<0)l=0;

                    xui.use(src).startDrag(e, {
                        targetReposition:false,
                        dragType:'blank',
                        dragDefer:2,
                        horizontalOnly:true,
                        targetLeft:ep.left,
                        targetTop:ep.top,
                        maxLeftOffset:l,
                        maxRightOffset:r
                     });
                     xui.use(src).focus();
                },
                onDragstop:function(profile, e, src){
                    profile.box._rePosition(profile);
                },
                onDrag:function(profile, e, src){
                    var ns=profile.box._getMoveNodes(profile),
                        dd=xui.DragDrop.getProfile();
                    ns.left(profile.properties._band_left +  dd.offset.x);
                },
                onContextmenu:function(profile, e, src){
                    return profile.boxing().onContextmenu(profile, e, src)!==false;
                }
            },
            SCROLL:{
                onScroll:function(profile, e, src){
                    profile.getSubNodes(['ITEMS','LINES']).top(-xui.use(src).scrollTop() );
                }
            },
            VIEW:{
                onMouseover:function(profile,e,src){
                    if(xui.DragDrop.getProfile().isWorking)return;
                    profile.$itemspos = xui.use(src).offset();
                },
                onMousemove:function(profile,e){
                    var ddd=xui.DragDrop.getProfile();
                    if(ddd.isWorking){
                        //ondrag add here, for performance of 'dont-use-droppable situation'.
                        if(profile.$$ondrag)
                            profile.box._moveActive(profile, profile.$active, ddd.x-profile.$dd_ox, profile.properties._unitPixs, 'move');
                    }else{
                        var t=profile.properties,
                            date=xui.Date,
                            s=t._smallLabelStart,
                            r=t._rate,
                            u=t._timeFormat,
                            p2=profile.$itemspos;
                        if(p2 && t.showTips){
                            var p1=xui.Event.getPos(e);
                            profile.box._setTips(profile, date.getText(date.add(s, 'ms', (p1.left-p2.left)*r),u));
                        }
                    }
                },
                onMouseout:function(profile,e,src){
                    if(xui.DragDrop.getProfile().isWorking)return;
                    if(profile.properties.showTips)
                        profile.box._setTips(profile, '');
                }
            },
            ITEMS:{
                onMousedown:function(profile, e, src){
                    if(xui.Event.getBtn(e)!="left")return;
                    var pro=profile.properties;
                    if(pro.disabled || pro.readonly)return;
                    if(profile.pauseA||profile.pause)return;
                    if(xui.Event.getSrc(e)!=xui.use(src).get(0))return;

                    var o = profile.getSubNode('ACTIVE');
                    o.css({width:0,visibility:'hidden'}).offset({left :xui.Event.getPos(e).left,  top :null});

                    profile.__actives=1;
                    o.startDrag(e, {
                        dragDefer:1,
                        dragType:'none'
                     });
                },
                onMouseup:function(profile){
                    if(profile.__actives)
                        delete profile.__actives;
                }
            },
            ACTIVE:{
                onDragbegin:function(profile, e, src){
                    profile.$dd_ox = xui.DragDrop.getProfile().x;
                    profile.$dd_oleft = parseInt(xui.use(src).get(0).style.left,10)||0;
                    xui.use(src).css('cursor','e-resize')
                    .parent().css('cursor','e-resize');
                },
                onDrag:function(profile, e, src){
                    var x=profile.$dd_oleft,
                        ddx=xui.DragDrop.getProfile().x,
                        w,offset;
                    if((offset =ddx-profile.$dd_ox)>=0){
                        w = offset;
                    }else{
                        x = x+offset; w = -offset;
                    }
                    profile.box._moveActive(profile, xui.use(src).get(0), x, w, 'all');
                },
                onDragstop:function(profile, e, src){
                    var r = profile.box._deActive(profile);
                    xui.use(src).css('cursor','').parent().css('cursor','');

                    var box=profile.box,
                        from=box._getTime(profile, r.left),
                        to=box._getTime(profile, r.left+r.width),
                        p=profile.properties,
                        task,t,
                        b=profile.boxing();

                    if(profile.properties.multiTasks){
                        task={id:_.id(),caption:p.dftTaskName,from:from,to:to};
                        if(profile.beforeNewTask && false===b.beforeNewTask(profile, task)){}else
                            b.addTasks([task]);
                    }else
                        b.setUIValue(from+":"+to);

                    profile.$dd_ox =profile.$dd_oleft=null;
                }
            },
            PRE:{
                onClick:function(profile, e){
                    profile.boxing().scrollToLeft(function(){
                        profile.box._rePosition(profile);
                    });
                 }
            },
            NEXT:{
                onClick:function(profile, e){
                    profile.boxing().scrollToRight(function(){
                        profile.box._rePosition(profile);
                    });
                }
            },
            ZOOMIN:{
                onClick:function(profile, e){
                    if(profile.pauseA||profile.pause)return;
                    var p=profile.properties,
                        box=profile.box,
                        z=box.$zoom,
                        index = _.arr.indexOf(z,p._unitParas),
                        o;
                    if(index > 0){
                        //profile.pause=true;
                        p.timeSpanKey =  z[index- 1][0];
                        box._refresh(profile,true);
                    }
                }
            },
            ZOOMOUT:{
                onClick:function(profile, e){
                    if(profile.pauseA||profile.pause)return;
                    var p=profile.properties,
                        box=profile.box,
                        z=box.$zoom,
                        index = _.arr.indexOf(z,p._unitParas),
                        o;
                    if(index < z.length -1){
                        //profile.pause=true;
                        p.timeSpanKey = z[index + 1][0];
                        box._refresh(profile,true);
                    }
                }
            },
            DATE:{
                onClick:function(profile, e, src){
                    if(profile.pauseA||profile.pause)return;
                    var cls=profile.box,
                        box=profile.boxing(),
                        from=profile.properties.dateStart,
                        o,node;

                    if(cls._picker && cls._picker.renderId){
                       o=cls._picker.boxing();
                    }else{
                        o=xui.create('DatePicker');
                        cls._picker=o.get(0);
                        o.beforeClose(function(){
                            this.boxing()._cache();
                            return false;
                        })
                        .beforeUIValueSet(function(p, ov, v){
                            var profile=this,
                                box=profile.boxing(),
                                p=profile.properties;
                            p.dateStart=v;
                            box._cache();
                        });
                    }
                    o.setValue(from,true).setHost(profile);
                    node=o.reBoxing();
                    node.popToTop(src);

                    //for on blur disappear
                    node.setBlurTrigger(profile.key+" - "+profile.$xid, function(){
                        box._cache();
                    });

                    //for esc
                    xui.Event.keyboardHook('esc',0,0,0,function(){
                        box._cache();
                        //unhook
                        xui.Event.keyboardHook('esc');
                    });
                }
            },
            ITEM:{
                onClick:function(profile, e, src){
                    if(profile.onClickTask)
                        profile.boxing().onClickTask(profile, profile.getItemByDom(src), e, src);
                },
                onDblclick:function(profile, e, src){
                    if(profile.onDblclickTask)
                        profile.boxing().onDblclickTask(profile, profile.getItemByDom(src), e, src);
                },
                onDragbegin:function(profile, e, src){
                    var t=profile.getItemByDom(src),
                        type=profile.$dd_type,
                        cursor=type?'e-resize':'move',
                        ac=profile.$active;
                    profile.$dd_ox = xui.DragDrop.getProfile().x;
                    profile.$dd_oleft = parseInt(xui.use(src).get(0).style.left,10);
                    profile.$dd_owidth = Math.min(t._realwidth, parseInt(xui.use(src).get(0).style.width,10));
                    xui([ac]).css('display','block').cssPos({left :profile.$dd_oleft,  top :null}).width(profile.$dd_owidth-2);
                    xui([ac,ac.parentNode]).css('cursor',cursor);
                },
                onDrag:function(profile, e, src){
                    var x,w,
                        offset =xui.DragDrop.getProfile().x-profile.$dd_ox,
                        ddl=profile.$dd_oleft,
                        ddw=profile.$dd_owidth,
                        type=profile.$dd_type,
                        mtype=type;
                    if(type=="left"){
                        if(offset < ddw){
                            x = ddl + offset;
                            w = ddl + ddw - x;
                        }else{
                            mtype='right';
                            x = ddl + ddw;
                            w = offset - ddw;
                        }
                    }else if(type == "right"){
                        if(-offset < ddw){
                            x = ddl;
                            w = ddw + offset;
                        }else{
                            mtype='left';
                            x = ddl + offset + ddw;
                            w = -offset - ddw;
                        }
                    }else{
                        mtype='move';
                        x = ddl + offset;
                        w = ddw;
                    }
                    profile.box._moveActive(profile, profile.$active, x, w, mtype);
                },
                onDragstop:function(profile, e, src){
                    var box=profile.box,
                        r = profile.box._deActive(profile),
                        ac=profile.$active;

                        var from=box._getTime(profile, r.left),
                            to=box._getTime(profile,r.left+r.width);
                    if(profile.properties.multiTasks){
                        if(profile.beforeTaskUpdated && false===profile.boxing().beforeTaskUpdated(profile, profile.getItemByDom(src), from, to)){}else
                            box._resetItem(profile,r,src);
                    }else
                        profile.boxing().setUIValue(from+":"+to);

                    profile.$dd_type = null;

                    xui([ac,ac.parentNode]).css('cursor','');
                },
                onContextmenu:function(profile, e, src){
                    return profile.boxing().onContextmenu(profile, e, src)!==false;
                }
            },
            HEAD:{
                onMousedown:function(profile, e, src){
                    if(xui.Event.getBtn(e)!="left")return;
                    var ps=profile.properties, item=profile.getItemByDom(src);
                    if(ps.disabled  || item.disabled)return;
                    if(ps.readonly  || item.readonly)return;
                    if(profile.beforeDragTask && false===profile.boxing().beforeDragTask(profile, item, e, src))
                        return;
                    if(ps.readonly||item.readonly)return;
                    xui.use(src).parent().startDrag(e, {
                        dragDefer:1,
                        dragType:'none'
                    });
                },
                onClick:function(){
                    return false;
                }
            },
            LEFT:{
                onMousedown:function(profile, e, src){
                    if(xui.Event.getBtn(e)!="left")return;
                    var ps=profile.properties, item=profile.getItemByDom(src);
                    if(ps.disabled || ps.readonly || item.readonly || item.disabled)return;
                    profile.$dd_type='left';
                    xui.use(src).parent(3).startDrag(e, {
                        dragDefer:1,
                        dragType:'none'
                    });
                }
            },
            RIGHT:{
                onMousedown:function(profile, e, src){
                    if(xui.Event.getBtn(e)!="left")return;
                    var ps=profile.properties, item=profile.getItemByDom(src);
                    if(ps.disabled || ps.readonly || item.readonly || item.disabled)return;
                    profile.$dd_type='right';
                    xui.use(src).parent(3).startDrag(e, {
                        dragDefer:1,
                        dragType:'none'
                    });
                }
            }
        },
        DataModel:{
            readonly:false,
            // control width and height
            width : 400,
            height : 200,
            //invisible band count (left,right)
            //if it's zero, leftSpanCount will be equal to the visible span count(based on widget width)
            leftSpanCount:{
                ini:0,
                inner:1
            },
            rightSpanCount:{
                ini:0,
                inner:1
            },
            increment:0,
            zoomable:{
                ini:true,
                action:function(v){
                    if(this.properties.timeSpanKey)
                        this.getSubNodes(['ZOOMIN','ZOOMOUT']).css('display',v?'':'none');
                }
            },
            dftTaskName:'task',
            taskHeight:{
                ini:25,
                action:function(v){
                    this.getSubNode('ITEM',true).height(v);
                }
            },

            //time span key
            timeSpanKey : {
                ini:'1 d',
                combobox:['10 ms', '100 ms','1 s','10 s', '1 n','5 n', '10 n', '30 n', '1 h', '2 h', '6 h', '1 d', '1 w', '15 d', '1 m',  '1 q',  '1 y',  '1 de',  '1 c'],
                action:function(){
                    this.box._refresh(this,true);
                }
            },
            // how much px to represent a unit
            // defalut value is from timeSpanKey
            unitPixs : 0,

/*
*inner properties
*defalut value is from timeSpanKey
*/
            //time span count
            smallLabelCount:{
                inner:1
            },
            //time span unit
            smallLabelUnit:{
                inner:1,
                listbox:_.toArr(xui.Date.$TIMEUNIT,true)
            },
            //small label format
            smallLabelFormat:{
                inner:1,
                listbox:_.toArr(xui.Date.$TEXTFORMAT,true)
            },
            bigLabelCount:{
                inner:1
            },
            //time span unit
            bigLabelUnit:{
                inner:1,
                listbox:_.toArr(xui.Date.$TIMEUNIT,true)
            },

            //big label format
            bigLabelFormat:{
                inner:1,
                listbox:_.toArr(xui.Date.$TEXTFORMAT,true)
            },
            //time format
            timeFormat:{
                inner:1,
                listbox:_.toArr(xui.Date.$TEXTFORMAT,true)
            },
/*inner properties*/
            //bar
            showBar:{
                ini:true,
                action:function(v){
                    this.getSubNode('TBAR').css('display',v?'':'none');
                    var p=this.properties,w=p.width,h=p.height;
                    p.width=p.height=0;
                    xui.UI.$tryResize(this,w,h,true);
                    p.width=w,p.height=h;
                }
            },
            //tips
            showTips:{
                ini:true,
                action:function(v){
                    this.getSubNode('TIPS').css('display',v?'':'none');
                    var p=this.properties,w=p.width,h=p.height;
                    p.width=p.height=0;
                    xui.UI.$tryResize(this,w,h,true);
                    p.width=w,p.height=h;
                }
            },
            //big label
            showBigLabel: {
                ini:true,
                action:function(v){
                    this.getSubNode('BIGLABEL').css('display',v?'':'none');
                    var p=this.properties,w=p.width,h=p.height;
                    p.width=p.height=0;
                    xui.UI.$tryResize(this,w,h,true);
                    p.width=w,p.height=h;
                }
            },

            _scrollRate:5,

            multiTasks: {
                ini:false,
                action:function(){
                    this.box._refresh(this,true);
                }
            },
            taskMinSize:60,
            minDate:{
                ini:null
            },
            maxDate:{
                ini:null
            },
            dateBtn:{
                ini:true,
                action:function(v){
                    this.getSubNode('DATE').css('display',v?'':'none');
                }
            },
            closeBtn:{
                ini:false,
                action:function(v){
                    this.getSubNode('CLOSE').css('display',v?'':'none');
                }
            },
            optBtn:{
                ini:false,
                action:function(v){
                    this.getSubNode('OPT').css('display',v?'':'none');
                }
            },
            dateStart : {
                ini:new Date,
                action:function(){
                    this.box._refresh(this,true);
                }
            }
        },
        EventHandlers:{
            beforeClose:function(profile, src){},
            onShowOptions:function(profile, e, src){},
            onGetContent:function(profile, from, to, minMs, type, callback){},
            onStartDateChanged:function(profile, odate, date){},
            beforeTaskUpdated:function(profile, task, from, to){},
            beforeNewTask:function(profile, task){},
            beforeDragTask:function(profile, task, e, src){},
            onClickTask:function(profile, task, e, src){},
            onDblclickTask:function(profile, task, e, src){}
        },
        Appearances:{
            MAINI:{
                'padding-top':'4px'
            },
            MAINC:{
                border:'solid 1px #648CB4',
                background:'#fff'
            },
            'BARCMDL span':{
                $order:0,
                width:'15px',
                height:'15px',
                margin:'2px',
                'vertical-align': 'middle',
                cursor:'default'
            },
            BAND:{
                'outline-offset':'-1px',
                '-moz-outline-offset':(xui.browser.gek && xui.browser.ver<3)?'-1px !important':null,
                'font-size':'0',
                'line-height':'0'                
            },
            'MAINP, VIEW, BAND, CON, BIGLABEL, SMALLLABEL':{
                position:'relative'
            },
            'MAINP, VIEW':{
                width:xui.browser.ie6?'100%':null,
                overflow:'hidden'
            },
            SCROLL:{
                'z-index':500,
                position:'absolute',
                'font-size':'0',
                'line-height':'0',
                right:0,
                width:'18px',
                overflow:'auto',
                'overflow-x': 'hidden'
            },
            SCROLLI:{
                height:'1000px',
                width:'1px'
            },
            BG:{
                'z-index':2,
                position:'absolute',
                left:0,
                top:0,
                width:'100%'
            },
            LINES:{
                'z-index':3,
                position:'absolute',
                left:0,
                top:0,
                width:'100%'
            },
            ITEMS:{
                'z-index':4,
                position:'absolute',
                left:0,
                top:0,
                width:'100%',
                overflow:'hidden'
            },
            'LINES div':{
                position:'relative',
                'border-bottom':'solid 1px #7BA3CB'
            },
            'BIGLABEL, SMALLLABEL':{
                height:'16px',
                'background-color':'#C8E2FC',
                cursor:'move',
                'border-bottom':'solid 1px #7BA3CB'
            },
            'BIGLABEL div, SMALLLABEL div':{
                height:'16px',
                'border-left':'solid 1px #7BA3CB',
                'text-align':'center',
                position:'absolute',
                cursor:'move',
                top:0,
                overflow:'visible'
            },
            'BIGLABEL div':{
                $order:2,
                'text-align':'left',
                'padding-left':'4px'
            },
            TIPS:{
                position:'relative',
                height:'14px',
                'font-size':'12px',
                'line-height':'14px',
                'text-align':'center'
            },
            ACTIVE:{
                'z-index':300,
                'border-left': '1px dashed',
                'border-right': '1px dashed',
                position:'absolute',
                top:0,
                left:'-1000px',
                width:0,
                background:0,
                visibility:'hidden',
                height:'100%'
            },
            'ZOOMIN, ZOOMOUT, DATE, PRE, NEXT':{
                background: xui.UI.$bg('icons.gif', 'no-repeat', true)
            },
            ZOOMIN:{
                $order:1,
                'background-position':'-360px -70px'
            },
            'ZOOMIN-mouseover':{
                $order:2,
                'background-position': '-360px -90px'
            },
            'ZOOMIN-mousedown':{
                $order:3,
                'background-position': '-360px -110px'
            },
            ZOOMOUT:{
                $order:1,
                'background-position':'-380px -70px'
            },
            'ZOOMOUT-mouseover':{
                $order:2,
                'background-position': '-380px -90px'
            },
            'ZOOMOUT-mousedown':{
                $order:3,
                'background-position': '-380px -110px'
            },
            DATE:{
                $order:1,
                'background-position':'-340px -70px'
            },
            'DATE-mouseover':{
                $order:2,
                'background-position':' -340px -90px'
            },
            'DATE-mousedown':{
                $order:3,
                'background-position':' -340px -110px'
            },
            PRE:{
                $order:1,
                'background-position':'-260px -70px',
                top:'0'
            },
            'PRE-mouseover':{
                $order:2,
                'background-position': '-260px -90px'
            },
            'PRE-mousedown':{
                $order:3,
                'background-position': '-260px -110px'
            },
            NEXT:{
                $order:1,
                position:'absolute',
                'background-position':'-280px -70px',
                top:'0'
            },
            'NEXT-mouseover':{
                $order:2,
                'background-position': '-280px -90px'
            },
            'NEXT-mousedown':{
                $order:3,
                'background-position': '-280px -110px'
            },
            BGITEM:{
                position:'absolute',
                top:0,
                height:'100%'
            },
            ITEM:{
                position:'absolute',
                overflow:'hidden'
            },
            'HEAD, BODY':{
                position:'relative',
                overflow:'hidden',
                'z-index':'1',
                border:'solid 1px #648CB4'
            },
            BODY:{
                $order:2,
                cursor:'pointer',
                'background-color': '#F9F7D1',
                'border-top':'none'
            },
            'HEAD, HANDLER, TSKBAR, LEFT, RIGHT':{
                'font-size':'1px',
                'line-height':'1px'
            },
            HEAD:{
                cursor:'move',
                'background-color': '#FFF'
            },
            HANDLER:{
                position:'relative',
                height:'7px',
                background:xui.UI.$bg('handler.gif', 'repeat #E8EEF7', true),
                'border-top':'solid 1px #648CB4'
            },
            TSKBAR:{
                position:'relative',
                height:'1px',
                'background-color': '#648CB4',
                width:'100%'
            },
            'LEFT, RIGHT':{
                position:'absolute',
                top:0,
                height:'100%',
                width:'6px',
                'z-index':10
            },
            'LEFT':{
                cursor:'e-resize',
                left:'-1px'
            },
            'RIGHT':{
                cursor:'w-resize',
                right:'-1px'
            },
            CON:{
                position:'relative',
                overflow:'hidden'
            },
            'ITEM-readonly HANDLER, ITEM-disabled HANDLER, ITEM-readonly LEFT, ITEM-disabled LEFT, ITEM-readonly RIGHT, ITEM-disabled RIGHT':{
                $order:2,
                display:'none'
            },
            'ITEM-readonly HEAD, ITEM-disabled HEAD':{
                cursor:'default'
            },
            'ITEM-readonly CON, ITEM-disabled CON':{
                $order:2,
                'background-color':'#E8EEF7'
            }
        },
        RenderTrigger:function(){
            var self=this, p=self.properties,cls=self.box;
            self.$active = self.getSubNode('ACTIVE').get(0);
            cls._ajustHeight(self);
        },
        _onDropMarkShow:function(){xui.DragDrop.setDragIcon('add');return false},
        _onDropMarkClear:function(){xui.DragDrop.setDragIcon('none');return false},
        _onDragEnter:function(profile,e,src){
            var t=profile.properties,
                ep=xui.Event.getPos(e),
                _left = t._unitPixs/2
            ;
            xui(profile.$active).css('visibility','visible');
            profile.$dd_ox =xui.use(src).offset().left+_left;

            profile.$$ondrag=true;
        },
        _onDragLeave:function(profile){
            profile.$$ondrag=profile.$dd_ox=null;

            profile.box._deActive(profile);
        },
        _onDrop:function(profile){
            profile.$$ondrag=profile.$dd_ox=null;

            var r = profile.box._deActive(profile),
                task={id:_.id(),caption:profile.properties.dftTaskName},
                box=profile.box,
                b=profile.boxing();

            task.from = box._getTime(profile, r.left);
            task.to = box._getTime(profile, r.left+r.width);
            task._dropData=xui.DragDrop.getProfile().dragData;

            if(profile.beforeNewTask && false===b.beforeNewTask(profile, task)){}else
                b.addTasks([task]);
        },
        _prepareData:function(profile){
            var p=profile.properties,
                d={},
                date=xui.Date,
                us=date.$TIMEUNIT,
                nodisplay='display:none',
                zoom=profile.box.$zoom,
                m=0,u,
                i,t,label,temp,_date,width,rate,
                _unitParas,
                _dateStart,
                _barCount,_leftBarCount,_rightBarCount,_barCountall,

                smallMarks,smallLabelStart,smallLabelEnd,smallLabelUnit,smallLabelCount,smallLabelFormat
                ;


            d.dateDisplay = p.dateBtn?'':nodisplay;
            d.closeDisplay = p.closeBtn?'':nodisplay;
            d.optDisplay = p.optBtn?'':nodisplay;
            d._showBigLabel=p.showBigLabel?'':nodisplay;

            // for quick move
            p._scroll_offset = p._scrollRate;

            p._lines=[{}];

            //border
            d._bWidth = p.width;
            d._bHeight = p.height;
            //view
            p._viewHeight = d._bHeight;
            d._tipsdisplay=p.showTips?'':nodisplay;
            d._bardisplay = p.showBar?'':nodisplay;

            //get unitparas from timespan key
            if(p.timeSpanKey){
                _.arr.each(zoom,function(o){
                    if(o[0]===p.timeSpanKey){
                        _unitParas=p._unitParas=o;
                        return false;
                    }
                });
                //give a default key
                if(!_unitParas)
                    _unitParas=p._unitParas=zoom[p.timeSpanKey='1 d'];
            }
            //if no timeSpanKey( _unitParas) input,
            d.zoomDisplay = (p.zoomable && _unitParas)?'':nodisplay

            if(_unitParas){
                p._unitPixs = p.unitPixs||_unitParas[1];
                p._smallLabelCount = p.smallLabelCount||_unitParas[2];
                p._smallLabelUnit = p.smallLabelUnit||_unitParas[3];
                p._smallLabelFormat = p.smallLabelFormat||_unitParas[4];
                p._bigLabelCount = p.bigLabelCount||_unitParas[5];
                p._bigLabelUnit = p.bigLabelUnit||_unitParas[6];
                p._bigLabelFormat = p.bigLabelFormat||_unitParas[7];
                p._timeFormat = p.timeFormat||_unitParas[8];
            }
            u=p._unitPixs;
            smallLabelCount = p._smallLabelCount;
            smallLabelUnit = p._smallLabelUnit;
            smallLabelFormat = p._smallLabelFormat;

            // get bar count in view
            _barCount = (Math.ceil(p.width / u)||0);
            _leftBarCount = p.leftSpanCount?p.leftSpanCount:_barCount;
            _rightBarCount = p.rightSpanCount?p.rightSpanCount:_barCount;
            _barCountall =  _barCount + _leftBarCount + _rightBarCount;

            // ms per px
            rate = p._rate = us[smallLabelUnit]*smallLabelCount/u;

            //adjust dateStart
            if(p.maxDate&& date.add(p.dateStart,'ms',p.width*rate) > p.maxDate)
                p.dateStart=date.add(p.maxDate,'ms',-p.width*rate);
            if(p.minDate&& p.dateStart<p.minDate)
                p.dateStart=p.minDate;

            // get the round start from the approximate start
            _dateStart = date.getTimSpanStart(p.dateStart, smallLabelUnit, smallLabelCount);
            // rel start in band
            smallLabelStart=p._smallLabelStart = date.add(_dateStart, smallLabelUnit, -_leftBarCount*smallLabelCount);
            // rel to in band
            smallLabelEnd = p._smallLabelEnd = date.add(smallLabelStart, smallLabelUnit, _barCountall*smallLabelCount);

            // get band with
            p._band_width = Math.ceil(date.diff(smallLabelStart,smallLabelEnd, 'ms')/rate);

            // set band left
            p._band_left_fix = p._band_left = - Math.ceil(date.diff(smallLabelStart, p.dateStart, 'ms')/rate);

            // build bars
            smallMarks = p._smallMarks = [];

            temp=0;
            label=date.get(smallLabelStart, smallLabelFormat);
            for(i=0; i< _barCountall; i++){
                _date = date.add(smallLabelStart, smallLabelUnit, smallLabelCount*(i+1));
                width = Math.ceil(date.diff(smallLabelStart, _date, 'ms')/rate);
                smallMarks.push({
                    left : temp,
                    width : width - temp,
                    text : label
                });
                temp=width;
                label=date.getText(_date, smallLabelFormat);
            }


            if(p.showBigLabel){
                var _barCount2,off,
                    bigMarks,bigLabelStart,bigLabelEnd,

                    bigLabelCount = p._bigLabelCount,
                    bigLabelUnit = p._bigLabelUnit,
                    bigLabelFormat = p._bigLabelFormat
                    ;

                bigMarks = p._bigMarks = [];
                bigLabelStart=p._bigLabelStart =date.getTimSpanStart(smallLabelStart, bigLabelUnit, bigLabelCount);
                bigLabelEnd=p._bigLabelEnd = date.getTimSpanEnd(smallLabelEnd, bigLabelUnit, bigLabelCount);
                _barCount2 = date.diff(bigLabelStart, bigLabelEnd, bigLabelUnit)/bigLabelCount;
                off=date.diff(smallLabelStart, bigLabelStart, 'ms')/rate;
                label=date.getText(bigLabelStart, bigLabelFormat);
                temp=0;
                for(i=0; i< _barCount2; i++){
                    _date = date.add(bigLabelStart, bigLabelUnit, bigLabelCount*(i+1));
                    width = date.diff(bigLabelStart, _date, 'ms')/rate;
                    bigMarks.push({
                        left : Math.ceil(temp + off),
                        width : Math.ceil(width - temp),
                        text : label
                    });
                    temp=width;
                    label=date.getText(_date, bigLabelFormat);
                }
            }
            return arguments.callee.upper.call(this, profile, d);
        },
        _prepareItem:function(profile, item, oitem, pid){
            var self=this,
                t=profile.properties,
                index;
            if(!item.id)item.id=_.id();
            if(!item.caption)item.caption=t.dftTaskName;
            // caculate left and width
            item._realleft=item._left=self._getX(profile, item.from);
            item._realwidth=item._width=Math.max(self._getX(profile, item.to) - item._left, 0);
            if(item._width<=t.taskMinSize){
                item._width=t.taskMinSize;
            }
            // if too long, cut left
            if(item._left<0){
                item._left=0;
            }
            // if too long, cut right
            if(item._left+item._width>t._band_width){
                item._width=t._band_width-item._left;
            }
            item._perw=+(item._realwidth/item._width*100).toFixed(2);
            if(item._perw>=100)item._perw=100;

            // caculate top and set task to lines cache
            index = self._getLinePos(profile, item);

            item._top = 'top:' + (t.taskHeight+1) * (index-1) + 'px';
            item._zindex = 'z-index:'+index;

            item._background = item.background?'background:'+item.background+';':'';
            
            item._excls=item.disabled?profile.getClass('ITEM','-disabled'):item.readonly?profile.getClass('ITEM','-readonly'):'';

            t._lines = t._lines || [{}];

            //set double link
            t._lines[index][item.id]=item;
            item._line = index;

            oitem._realleft=item._realleft;
            oitem._left=item._left;
            oitem._width=item._width;
            oitem._realwidth=item._realwidth;
            oitem._perw=item._perw;
            oitem._line=item._line;
        },
        $zoom:[
            /*
            *[
            *  id,
            *  small span unit count,
            *  small span unit,
            *  small span to big span function,
            *  small span lable format,
            *  big span lable format,
            *  value format
            *]
            */
            ['10 ms', 54, 10, 'ms', 'ms', 100, 'ms','hnsms','hnsms'],
            ['100 ms',54,  100, 'ms', 'ms', 1, 's','hns','hnsms'],
            ['1 s',30,  1, 's','s', 10, 's','hns','hnsms'],
            ['10 s', 30, 10, 's', 's',60, 's','hns','hnsms'],
            ['1 n',30,  1, 'n','n', 10, 'n','dhn','hns'],
            ['5 n', 30, 5, 'n','n', 30, 'n','mdhn','hns'],
            ['10 n', 30, 10, 'n','n', 60, 'n','mdhn','hns'],
            ['30 n', 30, 30, 'n','n', 4, 'h','ymdh','mdhn'],
            ['1 h', 30, 1, 'h','h',  6, 'h','ymdh','mdhn'],
            ['2 h', 30, 2, 'h','h', 12, 'h','ymdh','mdhn'],
            ['6 h', 30, 6, 'h','h', 24, 'h','ymd','mdhn'],
            ['1 d', 24, 1, 'd','w', 1, 'ww','ymd','ymdh'],
            ['1 w', 30, 1, 'ww','ww', 4, 'ww','ymd','ymd'],
            ['15 d', 30, 15, 'd','d', 2, 'm','ymd','ymd'],

//Not every unit width is the same value:
            ['1 m',  30,1, 'm','m', 1, 'q','yq','ymd'],
            ['1 q',  30,1, 'q','q', 1, 'y','y','ymd'],
            ['1 y',  48,1, 'y','y', 10, 'y','y','ym'],
            ['1 de',  48, 1, 'de','de', 100, 'y','y','ym'],
            ['1 c',  48, 1, 'c', 'c', 1000, 'y','y','y']

        ],
        _getTips:function(profile){
            var t,s='$dd_tooltip';
            if(t = profile[s] || (profile[s] = profile.getSubNode('TIPS').get(0).childNodes[0]))
                return t.nodeValue;
            else
                return profile.getSubNode('TIPS').get(0).innerHTML;
        },
        _rr:/\<[^>]*\>/g,
        _setTips:function(profile, text, force){
            if(!force && profile.pauseA)return;
            var t,s='$dd_tooltip';
            text=text.replace(this._rr,'');
            if(t = profile[s] || (profile[s] = profile.getSubNode('TIPS').get(0).childNodes[0])){
                if(t.nodeValue!=text)t.nodeValue=text;
            }else
                profile.getSubNode('TIPS').get(0).innerHTML=text;
        },
        _getX:function(profile, time){
            var t=profile.properties,d=new Date;
            d.setTime(time);
            return (Math.ceil(xui.Date.diff(t._smallLabelStart, d, 'ms')||0) / t._rate);
        },
        _getTime:function(profile, x, flag){
            var t=profile.properties;
            t = xui.Date.add(t._smallLabelStart, 'ms', x*t._rate);
            return flag?t:t.getTime();
        },
        _moveActive:function(profile, src, x, w, mtype){
            var p=Math.ceil,
                t=profile.properties,
                d=xui.Date,
                s=t._smallLabelStart,
                r=t._rate,
                u=t._timeFormat,
                ms='ms',
                y=src.style,
                z='px',
                m,n,increment,
                xx=x
                ww=w;
            if(!y.visibility || y.visibility=='hidden')
                y.visibility='visible';

            if(increment=t.increment){
                if(mtype=='move'){
                    x=Math.floor(xx/increment)*increment;
                }else{
                    if(mtype=='left'||mtype=='all'){
                        x=Math.floor(xx/increment)*increment;
                        w=ww-(x-xx);
                    }
                    if(mtype=='right'||mtype=='all'){
                        m=Math.floor((w+increment-1)/increment);
                        w=m*increment;
                    }                    
                }
            }

            m = (p(x)||0);
            n = ((p(w)||0)-2);

            if(n>0){
                y.left= m+z;
                y.width= n+z;
                if(t.showTips)
                    profile.box._setTips(profile, d.getText(d.add(s, ms, x*r),u)
                        + " - "
                        + d.getText(d.add(s, ms, (x+w)*r),u)
                    )
            }
            y=src=null;
        },
        _deActive:function(profile){
            var t=profile.$active.style, x=parseInt(t.left,10)||0, w=(parseInt(t.width,10)||0)+2;
            t.visibility='hidden';
            t.left=xui.Dom.HIDE_VALUE;
            t.width=0;
            t=null;
            if(profile.properties.showTips)
                profile.box._setTips(profile, '');
            return {left :x, width :w};
        },
        _minusLeft:function(profile,marks,node,offsetCount){
            var t=profile.properties;
            while((offsetCount--)>0){
                node.first().remove();
                temp=marks.shift();
            }
        },
        _minusRight:function(profile,marks,node,offsetCount){
            var t=profile.properties;
            while((offsetCount--)>0){
                node.last().remove();
                temp=marks.pop();
            }
        },
        _addLeft:function(profile, tag, node, offsetCount,  offset){
            // get additional bars
            var t=profile.properties,
                date=xui.Date,
                key=tag+'Marks',
                marks=t[key],
                labelStart=t[tag+'LabelStart'],
                labelUnit=t[tag+'LabelUnit'],
                labelCount=t[tag+'LabelCount'],
                labelFormat=t[tag+'LabelFormat'],
                rate=t._rate,
                addLb=[],
                temp,label,_date,i;

            temp=0;
            label=date.getText(labelStart, labelFormat);
            for(i=0; i< offsetCount; i++){
                _date = date.add(labelStart, labelUnit, labelCount*(i+1));
                width = date.diff(labelStart, _date, 'ms')/rate;
                addLb.push({
                    left : Math.ceil(temp + (offset||0)-0.0000000000003),
                    width : Math.ceil(width - temp),
                    text : label
                });
                temp=width;
                label=date.getText(_date, labelFormat);
            }
            addLb.reverse();
            // add to band UI
            node.prepend(profile._buildItems(key, addLb,false));
            // add to memory list
            _.arr.insertAny(marks,addLb.reverse(),0);
        },
        _addRight:function(profile, labelEnd, tag, node, offsetCount,  offset){
            var t=profile.properties,
                date=xui.Date,
                key=tag+'Marks',
                marks=t[key],
                labelStart=t[tag+'LabelStart'],
                labelUnit=t[tag+'LabelUnit'],
                labelCount=t[tag+'LabelCount'],
                labelFormat=t[tag+'LabelFormat'],
                rate=t._rate,
                addLb=[],_d1,
                _date,i;
            _d1=labelEnd;
            for(i=0; i<offsetCount; i++){
                _date = date.add(labelEnd, labelUnit, labelCount*(i+1));
                addLb.push({
                    left : Math.ceil(date.diff(labelStart,_d1,'ms')/rate+ (offset||0)-0.0000000000003),
                    width : Math.ceil(date.diff(_d1, _date, 'ms')/rate),
                    text : date.getText(_d1, labelFormat)
                });
                _d1=_date;
            }
            // build
            // add to band UI
            node.append(profile._buildItems(key, addLb,false));
            // add to memory list
            _.arr.insertAny(marks,addLb,-1);
        },
        _getMoveNodes:function(profile){
            return profile.$moveban = profile.$moveban || profile.getSubNode('VIEW');
        },
        //if left is numb, force to move
        _rePosition:function(profile, left){
            profile.pause=true;
            var self=this,
                date = xui.Date,
                t=profile.properties,
                rate=t._rate,
                label,m,n,
                labelsBottom = profile.getSubNode('SMALLLABEL'),
                band = self._getMoveNodes(profile),
                x = left || band.left(),
                //ralated to the fix position
                offset = x - t._band_left_fix;

            // if offset out a bar width
            if(Math.abs(offset)/t._unitPixs >=1 || left){
                var offsetCount = parseInt(offset/t.unitPixs,10),
                    bak_s = t._smallLabelStart,
                    bak_e = t._smallLabelEnd,
                    _c=-offsetCount*t._smallLabelCount,
                    offsetPxs,
                    _smallLabelStart,
                    _smallLabelEnd;

                _smallLabelStart=t._smallLabelStart = date.add(t._smallLabelStart, t._smallLabelUnit, _c);
                _smallLabelEnd=t._smallLabelEnd = date.add(t._smallLabelEnd, t._smallLabelUnit, _c);
                offsetPxs = Math.ceil(date.diff(_smallLabelStart, bak_s, 'ms')/rate);

                band.left(x - offsetPxs);

                // reset band paras
                t._band_width = Math.ceil(date.diff(_smallLabelStart, _smallLabelEnd, 'ms')/rate);

                //reset tasks position var
                _.arr.each(t.items,function(o){
                    o._left += offsetPxs;
                    o._realleft += offsetPxs;
                    profile.box._trimTask(profile,o);
                });
                labelsBottom.children().each(function(o){
                    o.style.left = (parseFloat(o.style.left)||0) + offsetPxs + "px";
                });
                _.arr.each(t._smallMarks,function(o){
                    o.left += offsetPxs;
                });

                // delete out, andd add to blank
                if(offsetCount>0){
                    self._minusRight(profile,t._smallMarks, labelsBottom,offsetCount);
                    self._addLeft(profile, '_small', labelsBottom, offsetCount);
                }else{
                    self._minusLeft(profile,t._smallMarks, labelsBottom, -offsetCount);
                    self._addRight(profile, bak_e, '_small', labelsBottom, -offsetCount);
                }

                if(t.multiTasks){
                    var arr=[];
                    // remove tasks
                    _.arr.each(t.items,function(o){
                        if(o._left >= t._band_width ||  (o._left+o._width) <= 0){
                            //delete from lines
                            delete t._lines[o._line][o.id];
                            arr.push(o.id);
                        }
                    });
                    profile.boxing().removeItems(arr);

                    profile.boxing()._getContent(offsetCount>0 ? _smallLabelStart : bak_e,
                        offsetCount>0 ? bak_s : _smallLabelEnd,
                        t._rate,
                        offsetCount>0 ? 'left' : 'right');

                    //adjust the items
                    self._reArrage(profile);
                }

                if(t.showBigLabel){
                    var labelsTop = profile.getSubNode('BIGLABEL'),
                        bigLabelUnit=t._bigLabelUnit,
                        bigLabelCount=t._bigLabelCount,
                        off,
                        offsetCount2,offsetCount3,
                        bigLabelStart,bigLabelEnd;
                    bak_e=t._bigLabelEnd;

                    labelsTop.children().each(function(o){
                        o.style.left = (parseFloat(o.style.left)||0) + offsetPxs + "px";
                    });
                    _.arr.each(t._bigMarks,function(o){
                        o.left += offsetPxs;
                    });
                    bigLabelStart=date.getTimSpanStart(_smallLabelStart, bigLabelUnit, bigLabelCount);

                    offsetCount2 = Math.ceil(date.diff(_smallLabelStart, t._bigLabelStart, bigLabelUnit)/bigLabelCount);
                    offsetCount3 = Math.ceil(date.diff(t._bigLabelEnd, _smallLabelEnd, bigLabelUnit)/bigLabelCount);

                    //reset offset of big and small
                    if(offsetCount2){
                        off = date.diff(_smallLabelStart, bigLabelStart, 'ms')/rate;
                        t._bigLabelStart=bigLabelStart;
                        if(offsetCount2>0)
                            self._addLeft(profile, '_big',labelsTop, offsetCount2, off);
                        else
                            self._minusLeft(profile,t._bigMarks, labelsTop, -offsetCount2);
                    }
                    //reset offset of big and small
                    if(offsetCount3){
                        off = date.diff(_smallLabelStart, bigLabelStart, 'ms')/rate;
                        t._bigLabelEnd=date.add(t._bigLabelEnd, bigLabelUnit, offsetCount3*bigLabelCount);
                        if(offsetCount3<0)
                            self._minusRight(profile,t._bigMarks, labelsTop, -offsetCount3);
                        else
                            self._addRight(profile, bak_e, '_big',labelsTop, offsetCount3, off);
                    }
                }
            }
            // reset date start point
            t._band_left = band.left();
            var od=t.dateStart;
            t.dateStart = self._getTime(profile, -t._band_left, 1);

            if(profile.onStartDateChanged){
                profile.boxing().onStartDateChanged(profile,od,t.dateStart);
            }

            profile.pause = false;
        },
        _trimTask:function(profile, o){
            //****
            // if too long, cut left
            var x=o._realleft,
                w=o._realwidth,
                pro=profile.properties,
                bw=pro._band_width;

            if(w<=pro.taskMinSize){
                w=pro.taskMinSize;
            }
            if(x < 0){
                if(x+w<0)
                    w=0;
                else
                    w = w + x;
                x = 0;
            }
            if(x>bw)x=bw;
            this._setItemNode(profile, o,'left',x+'px');

            // 直接设置            
            o._left=x;

            // if too long, cut right
            if(x + w > bw)
                w = bw - x;
            // 只有改变才设置
            if(w>=0){
                if(o._width!=w){
                    o._width=w;
                    this._setItemNode(profile, o,'width',w+'px');
                }
            }

        },
        _setItemNode:function(profile, item, key, value){
            var t=profile.getSubNodeByItemId('ITEM',item.id).get(0);
            t.style[key]=value;
        },
        _getLinePos:function(profile,o){
            var t=profile.properties,
                b=false,
                index=0;
            _.arr.each(t._lines,function(v,i){
                if(i===0)return;
                b=true;
                _.each(v,function(v){
                    if(o.id!==v.id)
                        if(((o._left + o._width)>=v._left) && ((v._left + v._width)>=o._left))
                            return b=false;
                });
                if(b){index=i;return false;}
            });
            if(!b)
                index = t._lines.push({})-1;
            return index;
        },
        // _reArrage tasks for top position
        _reArrage:function(profile){
            var self=this, o, h,
                t=profile.properties;
            t._lines.length = 1;
            t.items.sort(function(x,y){
                return x.from>y.from?1:x.from==y.from?0:-1;
            });
            //re caculate from current line
            _.arr.each(t.items,function(v){
                if(v._line===0)return;

                //get pos from current line
                index = self._getLinePos(profile, v);
                t._lines[index][v.id]=v;
                // if has space, reset position
                if(v._line !== index){
                    // reset double link
                    v._line = index;
                    // set top
                    if(t.multiTasks){
                        self._setItemNode(profile, v, 'top', (t.taskHeight+1) * (index-1) +'px');
                        self._setItemNode(profile, v, 'zIndex', index);
                    }
                };
            });

            h = t._linesHeight = t._lines.length * (t.taskHeight+1);

            self._ajustHeight(profile);
        },
        _resetItem:function(profile,o,src){
            var p=profile.properties,
                t=profile.getItemByDom(src),
                bandW=p._band_width,
                f=function(k,i){return profile.getSubNodeByItemId(k,i)},
                timeline=profile.box,
                max=Math.max,
                temp;

            if(o.left){
                t._realleft=t._left=o.left;
                t.from = timeline._getTime(profile,o.left);

                xui.use(src).get(0).style.left=t._left+'px';
            }
            if(o.width){
                t.to = timeline._getTime(profile,o.left+o.width);

                t._realwidth=t._width=o.width;

                if(t._width<=p.taskMinSize){
                    t._width=p.taskMinSize;
                }else{
                    // if too long ,cut right
                    if(o.left + o.width > bandW)
                        t._width = bandW - o.left;
                }                
                xui.use(src).get(0).style.width=t._width+'px';

                temp=+(t._realwidth/t._width*100).toFixed(2);
                if(temp>=100)temp=100;                
                if(temp!=t._perw){
                    t._perw=temp;
                    xui.use(src).first(2).get(0).style.width=temp+'%';
                }
            }
            // _reArrage top position
            timeline._reArrage(profile);
        },
        _ajustHeight:function(profile){
            var p=profile.properties,
                f=function(p){return profile.getSubNode(p)},
                view = f('CON'),
                items = f('ITEMS'),
                lines = f('LINES'),
                h,b,
                ih=p._linesHeight||0,
                vh=view.height();

            h=Math.max(ih,vh);

            b=ih>vh;
            f('SCROLLI').height(h);
            f('SCROLL').css('display',b?'block':'none');
            items.height(h);
            lines.height(h);
            items.top(b?-f('SCROLL').scrollTop():0);
            lines.top(b?-f('SCROLL').scrollTop():0);
            
            var len=parseInt(h/p.taskHeight,10)+1, 
                size=f('LINES').get(0).childNodes.length;
            if(size<len){
                f('LINES').append(xui.create(_.str.repeat('<div style="height:'+p.taskHeight+'px;"></div>',len-size)));
            }
        },
        _showTips:function(profile, node, pos){
            if(profile.properties.disableTips)return;
            if(profile.onShowTips)
                return profile.boxing().onShowTips(profile, node, pos);
            if(!xui.Tips)return;

             var t=profile.properties,
                id=node.id,
                format=t._timeFormat,
                sid=profile.getSubId(id),
                map=profile.SubSerialIdMapItem,
                item=map&&map[sid],
                date=xui.Date;

            if(t.disabled)return;
            if(item && item.disabled)return;
            if(item){
                item.tips = '<p style="font-weight:bold">'+item.caption +'</p>'+ date.getText(new Date(item.from),format)+" - "+date.getText(new Date(item.to),format);
                xui.Tips.show(pos, item);
                return true;
            }else
                return false;
        },
        _beforeSerialized:function(profile){
            var w=profile.properties.width,
                o=arguments.callee.upper.call(this, profile);
            o.properties.width=w;
            return o;
        },
        _onresize:function(profile,width,height){
            var pro=profile.properties,
                f=function(k){return profile.getSubNode(k)},
                _bbarH=f('BBAR').height(),
                _tipsH=f('TAIL').height(),
                off2=f('CON').offset(null, profile.getRoot()),
                off3=2,h2,
                t;

            //for border, view and items
            if(height && profile._$h != height){
                f('BORDER').height(profile._$h = t = height);
                f('CON').height(t=t - (pro.showTips?_tipsH:0) -off2.top - (pro.showBar?_bbarH:0) -off3);
                h2=f('BAND').height();

                f('SCROLL').top(h2).height(t+h2);
                profile.getSubNodes(['BG','ITEMS','SCROLL']).height(t);
                this._ajustHeight(profile);
                
                if(xui.browser.ie6)
                    f('ACTIVE').height(f('VIEW').height()+2);
            }
            if(width && profile._$w != width){
                // special: modified widget width here
                f('BORDER').width(profile._$w =  pro.width = width);
                var ins=profile.boxing(),
                    items = ins.getItems('data'),
                    bak_s = pro._smallLabelStart,
                    bak_e = pro._smallLabelEnd,
                    offset, uivalue;
                this._refresh(profile);
                offset = bak_s - pro._smallLabelStart;

                if(!pro.multiTasks)
                    uivalue=pro.$UIvalue;

                // reset all items
                ins.setItems(items);
                
                if(!pro.multiTasks){
                    ins.setUIValue(uivalue, true);
                }else{
                    var arr=[];
                    // filter tasks
                    _.arr.each(pro.items,function(o){
                        if(o._left >= pro._band_width ||  (o._left+o._width) <= 0){
                            //delete from lines
                            delete pro._lines[o._line][o.id];
                            arr.push(o.id);
                        }
                    });
                    ins.removeItems(arr);
                }

                if(offset>0){
                    // first time, call iniContent
                    if(!profile._iniOK){
                        ins.iniContent();
                    }else{
                        ins._getContent(pro._smallLabelStart, bak_s, pro._rate, 'left');
                        ins._getContent(bak_e, pro._smallLabelEnd, pro._rate, 'right');
                    }
                }
                //adjust the items
                this._reArrage(profile);
            }
        },
        _refresh:function(profile,force){
            var pro=profile.properties, ins=profile.boxing(), nodes, uivalue;

            if(!pro.multiTasks)
                uivalue=pro.$UIvalue;

            //clear items first
            ins.clearItems();

            //ins.refresh()
            this._prepareData(profile);

            //refresh labels
            nodes=profile._buildItems('_smallMarks', pro._smallMarks,false);
            profile.getSubNode('SMALLLABEL').empty().append(nodes);
            if(pro.showBigLabel){
                nodes=profile._buildItems('_bigMarks', pro._bigMarks,false);
                profile.getSubNode('BIGLABEL').empty().append(nodes);
            }

            //view/band set left
            profile.getSubNode('VIEW').left(pro._band_left).width(pro._band_width);

            //if singleTask, setUIValue
            if(!pro.multiTasks){
                ins.setUIValue(uivalue, true);
            //if multiTasks, call iniContent to get tasks
            }else{
                if(force)
                    ins.iniContent();
            }
            return this;
        }
    }
});Class("xui.UI.TagEditor", ['xui.UI',"xui.absValue"], {
    Dependency:['xui.UI.Input'],
    Instance:{
        activate:function(){
            // activate the first input
            var i=this.getTagInput(0);
            if(i && i.get(0))
                i.activate();
            return this;
        },
        getTagInput:function(index){
            var prf=this.get(0),r=null;
            if(prf.__inputs){
                if(_.isNumb(index)){
                    if(r=prf.__inputs[index])
                        r=r.boxing();
                }else{
                    r=xui.UI.Input.pack(prf.__inputs,false);
                }
            }
            return r;
        },
        _setDirtyMark:function(){
            arguments.callee.upper.apply(this, arguments);

            return this.each(function(profile){
                //format statux
                if(profile.beforeFormatMark && false===box.beforeFormatMark(profile, profile._inValid==2)){}
                else{
                    profile.getSubNode('ERROR').css('display',profile._inValid==2?'block':'none');
                }
            });
        }
    },
    Static:{
        $valuemode:'multi',
        Templates:{
            tagName : 'div',
            style:'{_style}',
            className:'{_className}',
            BORDER:{
               tagName:'div',
               className:'{_bordertype}',
                ITEMS:{
                   $order:10,
                   tagName:'div',
                   style:'{_padding}',
                   text:"{items}"
                }
            },
            ERROR:{
                $order:2
            }
        },
        Appearances:{
            KEY:{
                'font-size':'12px'
            },
            ITEMS:{
                position:'relative',
                overflow:'hidden'
            },
            BORDER:{
                position:'relative',
                overflow:'hidden'
            },
            ERROR:{
                width:'16px',
                height:'16px',
                position:'absolute',
                right:'2px',
                top:'2px',
                display:'none',
                'font-size':0,
                background: xui.UI.$bg('icons.gif', 'no-repeat left -244px', true),
                'z-index':'50'
            }
        },
        Behaviors:{
            onSize:xui.UI.$onSize
        },
        DataModel:{
            selectable:true,
            borderType:{
                ini:'flat',
                listbox:['none','flat','inset','outset'],
                action:function(v){
                    var ns=this,
                        p=ns.properties,
                        node=ns.getSubNode('BORDER'),
                        reg=/^xui-uiborder-/,
                        pretag='xui-uiborder-',
                        root=ns.getRoot();
                    node.removeClass(reg);
                    node.addClass(pretag+v);

                    //force to resize
                    xui.UI.$tryResize(ns,root.get(0).style.width,root.get(0).style.height,true);
                }
            },
            valueSeparator:{
                ini:',',
                action:function(){
                    //this.properties._valueSeparator=new RegExp("["+this.properties.valueSeparator+"\\s]+");
                }
            },
            padding:{
                ini:"4px",
                action:function(v){
                    this.getSubNode("ITEMS").css("padding",v);
                }
            },
            valueFormat:{
                ini:'',
                action:function(v){
                    var i=this.boxing().getTagInput();
                    if(i)i.setValueFormat(v);
                }
            },
            required:{
                ini:false
            },
            tagCount:{
                ini:3,
                action:function(v){
                    this.boxing().refresh();
                }
            },
            tagMaxlength:{
                ini:6,
                action:function(v){
                    var i=this.boxing().getTagInput();
                    if(i)i.setMaxlength(v);
                }
            },
            tagInputWidth:{
                ini:80,
                action:function(v){
                    var i=this.boxing().getTagInput();
                    if(i)i.setWidth(v);
                }
            },
            tagInputHeight:{
                ini:22,
                action:function(v){
                    var i=this.boxing().getTagInput();
                    if(i)i.setHeight(v);
                }
            },
            tagSpacing:{
                ini:6,
                action:function(v){
                    var i=this.boxing().getTagInput();
                    if(i)i.setCustomStyle("KEY","margin-right:"+(parseInt(v,10)||0)+"px;margin-bottom:"+(parseInt(v,10)||0)+"px;");
                }
            },
            width:300,
            height:32
        },
        RenderTrigger:function(){            
            this.$onValueSet=this.$onUIValueSet=function(v){
                v=v.split(this.properties.valueSeparator);
                _.arr.each(this.__inputs,function(o,i){
                    o.boxing().setValue(v[i]||"",true);
                });
            };

            var i=this.boxing().getTagInput();
            if(i)i.render(true);
        },
        _checkValid:function(profile, value){
            if(profile.properties.required && 
                (!value || !value.replace(new RegExp("\\s*\\"+profile.properties.valueSeparator+"\\s*","img"),""))
            ){
                profile._inValid=2;
                return false;
            }else
                profile._inValid=3;
            return true;
        },
        _ensureValue:function(profile, value){
            var prop=profile.properties, nv=[];
            if(!value)
                value="";
            // ensure array
            if(_.isStr(value))
                value=value.split(prop.valueSeparator);
            // ensure count
            for(var i=0,vv;i<prop.tagCount;i++){
                vv=value[i];
                // ensure string
                if(!vv)
                    vv="";
                // ensure string maxlength
                if(vv.length>prop.tagMaxlength)
                    vv=vv.slice(0,prop.tagMaxlength);
                vv=_.str.trim(vv);
                if(vv)
                    nv.push(vv);
            }
            return nv.join(prop.valueSeparator);
        },
        _prepareData:function(profile){
            var data=arguments.callee.upper.call(this, profile);
            data._bordertype='xui-uiborder-'+data.borderType;
            
            
            
            var prop=profile.properties,
                inputs=[],properties,events,CS,iprf;
            if(prop.padding)
                data._padding = "padding:"+prop.padding;
            
            //prop._valueSeparator = new RegExp("["+prop.valueSeparator+"\\s]+");
            
            var vs = this._ensureValue(profile,prop.value).split(prop.valueSeparator);
            
            if(prop.tagSpacing)
                CS={
                    KEY:"margin-right:"+prop.tagSpacing+"px;margin-bottom:"+prop.tagSpacing+"px;"
                };

            properties = {
               position:'relative',
               width:prop.tagInputWidth,
               height:prop.tagInputHeight,
               maxlength:prop.tagMaxlength,
               valueFormat:prop.valueFormat,
               dirtyMark:false 
            };
            
            for(var i=0;i<prop.tagCount;i++){
                properties.value=vs[i]||"";
                
                iprf=(new xui.UI.Input(properties,events,null,profile.theme,CS)).get(0);
                
                iprf.$onUIValueSet=function(v){
                    var pf=this,index,arr=[];
                    _.arr.each(profile.__inputs,function(o,i){
                         arr.push(_.str.trim(o.boxing().getUIValue()||""));
                         if(o===pf)index=i;
                    });
                    _.filter(arr,function(o,i){
                        return o.replace(/\s+/g,'')!=='';
                    });
                    var sp=profile.properties.valueSeparator,uiv=arr.join(sp);
                    var oi=profile._inValid;
                    profile.boxing().setUIValue(uiv);
                    
                    // input/textarea is special, ctrl value will be set before the $UIvalue
                    prop.$UIvalue=uiv;
                    if(oi!==profile._inValid) if(profile.renderId)profile.boxing()._setDirtyMark();
                    
                    // ensure no valueSeparator
                    return uiv.split(sp)[index]||"";
                };

                inputs.push(iprf);
            }

            // to html, but not render
            data.items=xui.UI.Input.pack(inputs,false).toHtml();
            
            // keep refrence
            profile.__inputs=inputs;
            
            return data;
        },
        _onresize:function(profile,width,height){
            var size=profile.properties.borderType!='none'?2:0;
            if(height)
                profile.getSubNode('BORDER').height(height=='auto'?height:(height-size));
            if(width)
                profile.getSubNode('BORDER').width(width=='auto'?width:(width-size));
        }
    }
});

Class("xui.UI.Poll", "xui.UI.List",{
    Instance:{
        fillContent:function(id, obj){
            var profile=this.get(0),t,item;
            if(profile.renderId){
                if(item=profile.getItemByItemId(id)){
                    t=profile.getSubNodeByItemId('BODY',id).html('');
                    if(obj){
                        item._obj = obj;
                        item._fill=true;
                        if(typeof obj=='string')t.html(obj);
                        else t.append(obj.render(true));
                    }else
                        item._obj=item._fill=null;
                }
            }
            return this;
        },
        _setOptCap:function(item, value){
            return this.each(function(pro){
                var items = pro.properties.items,
                i = pro.queryItems(pro.properties.items, function(o){
                    return o.id==item.id;
                },false,true);
                if(i && (i=i[0])){
                    i.caption=value;
                    if(pro.renderId)
                        pro.getSubNodeByItemId('CAPTION',i.id).html(value);
                }
            });
        },
        getBindEditor:function(){
            return this.get(0)._bind;
        },
        _insertOpt:function(opt){
            if(!opt.id)opt.id='$'+_();
            this.insertItems([opt]);
            return this;
        },
        _removeOpt:function(id){
            this.removeItems([id],'OUTER');
            return this;
        },
        _setDirtyMark:function(){return this}
    },
    Initialize:function(){
        var self=this;
        self.addTemplateKeys(['EDIT']);
        //modify default template fro shell
        var t = self.getTemplate();
        t.TITLE={
            $order:2,
            tagName : 'DIV',
            style:'{titleDisplay}',
            text : '{title}',
            className:"xui-uibg-bar xui-uiborder-outset {disabled} {_cls}"
        };
        t.TAIL={
            $order:20,
            tagName : 'DIV',
            className:"xui-uibg-bar xui-uiborder-outset {disabled}",
            text:"{cmds}"
        };
        t.$submap={
            items:{
                OUTER:{
                    tagName:'div',
                    className:'xui-uibg-bar xui-uiborder-outset',
                    TOGGLE:{
                        className:'xui-uicmd-toggle',
                        style:'{_togdisplay}'
                    },
                    ITEM:{
                        tabindex: '{_tabindex}',
                        className:'{itemClass} {disabled}',
                        style:'{itemStyle}',
                        OPTION:{
                            $order:0,
                            tagName : 'DIV',
                            MARK2:{$order:1,className:'{_optclass}'}
                        },
                        CAPTION:{
                            $order:1,
                            tagName : 'DIV',
                            text : '{caption}',
                            className:"{disabled} {_itemcls}"
                        },
                        CHART:{
                            $order:2,
                            tagName : 'DIV',
                            style:'{_display}',
                            CAST:{
                                $order:0,
                                text:'{message}'
                            },
                            PROGRESS:{
                                $order:1,
                                style:'background-position: -{_per}px -200px;',
                                PROGRESSI:{}
                            },
                            DEL:{
                                $order:2,
                                className:'xui-ui-btn',
                                style:'{_del}',
                                DELI:{
                                    className:'xui-ui-btni',
                                    DELC:{
                                        className:'xui-ui-btnc',
                                        DELA:{
                                            tagName:'button',
                                            text:'{removeText}'
                                        }
                                    }
                                }
                            }
                        },
                        CLEAR:{
                            $order:3,
                            tagName : 'DIV'
                        }
                    },
                    BODY:{
                        $order:1,
                        tagName : 'DIV',
                        text:'{_body}'
                    }
                }
            },
            cmds:{
                CMD:{
                    className:'xui-ui-btn',
                    CMDI:{
                        className:'xui-ui-btni',
                        CMDC:{
                            className:'xui-ui-btnc',
                            CMDA:{
                                tabindex: '{_tabindex}',
                                text:'{caption}'
                            }
                        }
                    }
                }
            }
        };
        t.ITEMS.className='';
        self.setTemplate(t);

        //for modify
        var inlineEdit=function(profile,node,flag,value,item){
            var o,useC,prop=profile.properties,
                callback=function(v){
                    var b=profile.boxing();
                    switch(flag){
                        //edit option
                        case '1':
                            if(b.beforeOptionChanged(profile, item, v)!==false)
                                b._setOptCap(item,v);
                        break;
                        //new option
                        case '2':
                            if(b.beforeOptionAdded(profile, v)!==false ){
                                var id="["+v.replace(/[^\w_]*/g,'')+"]";
                                b._insertOpt({caption:v,id:id});
                                if(!profile.properties.editable){
                                    profile.boxing().fireItemClickEvent(id);
                                }
                            }
                        break;
                        //edit title
                        default:
                            if(b.beforeTitleChanged(profile, v)!==false)
                                b.setTitle(v);
                    }
                };

            if(profile.onCustomEdit)
                if(o=profile._bind=profile.boxing().onCustomEdit(profile, node, flag, value, item, callback))
                    useC=true;
            if(!useC){
                o=profile._bind;
                if(!o){
                    var pp={type:prop.editorType,commandBtn:'save',left:-10000,top:-10000};
                    profile._bind=o=xui.create('ComboInput', pp);
                    o.onHotKeydown(function(p,key){
                        if(key.key=='enter'){
                            p.boxing().onCommand(p);
                            return false;
                        }else if(key.key=='esc'){
                            o.hide();
                            return false;
                        }
                    })
                    profile.getRoot().append(o);
                }

                var r=node.cssRegion(true,profile.getRoot());
                if(r.height>o.getHeight())
                    o.setHeight(r.height);
                else
                    r.top-=3;
                if(r.top<0)r.top=0;

                o.setValue(value||'',true)
                .setWidth(r.width + (parseInt(node.css('paddingLeft'),10)||0)+ (parseInt(node.css('paddingRight'),10)||0))
                .onCommand(function(p){
                    var pro=p.properties,v=pro.$UIvalue, ov=pro.value;
                    if(v!=ov)
                        callback(v);
                    _.asyRun(function(){
                        o.hide();
                    });
                })
                .reBoxing()
                .setBlurTrigger(o.KEY+":"+o.$xid, function(){
                    o.hide();
                })
                .show(r.left+'px',r.top+'px');

                _.asyRun(function(){
                    o.activate()
                });
            }
        };

        t = self.getBehavior();
        var old=t.ITEM.onClick;
        t.ITEM.onClick = function(profile, e, src){
            var p = profile.properties,
                item = profile.getItemByDom(src),
                editable=item.id=='$custom' || item.editable;
            if(p.disabled)return;

            if(p.editable)
                inlineEdit(profile, profile.getSubNodeByItemId('CAPTION',item.id), editable?'2':'1', editable?'':item.caption, item);
            else{
                if(editable)
                    inlineEdit(profile, profile.getSubNodeByItemId('CAPTION',item.id), '2');
                else
                    old.apply(this, arguments);
            }
        };
        t.TITLE={
            onClick : function(profile, e, src){
                var p = profile.properties,
                    item = profile.getItemByDom(src);
                if(p.disabled)return;

                if(p.editable)
                    inlineEdit(profile, profile.getSubNode('TITLE'), '3', p.title);
            }
        };
        t.DEL={
            onClick : function(profile, e, src){
                var p = profile.properties,
                    b = profile.boxing(),
                    item = profile.getItemByDom(src);
                if(p.disabled)return;
                if(b.beforeOptionRemoved(profile, item)!==false )
                    b._removeOpt(item.id);
                return false;
            }
        }
        t.CMD={
            onClick : function(profile, e, src){
                var p = profile.properties,
                    key = profile.getSubId(src);
                if(p.disabled)return;
                profile.boxing().onClickButton(profile, key, src);
            }
        };
        t.TOGGLE={
            onClick:function(profile, e, src){
                var properties = profile.properties,
                    items=properties.items,
                    item = profile.getItemByDom(src),
                    itemId = profile.getSubId(src),
                    node = xui.use(src),
                    body = profile.getSubNode('BODY',itemId),t
                    ;
                if(item._show){
                    node.tagClass('-checked',false);
                    body.css('display','none');
                }else{
                    node.tagClass('-checked');
                    body.css('display','block');
                    //fill value
                    if(!item._fill){
                        item._fill=true;
                        var callback=function(o){
                            profile.boxing().fillContent(item.id, item._body=o);
                        };
                        if(profile.onGetContent){
                            var r = profile.boxing().onGetContent(profile, item, callback);
                            if(r) callback(r);
                        }else
                            callback(profile.box._buildBody(profile, item));
                    }
                }

                item._show=!item._show;

                //prevent href default action
                //return false;
            }
        };

        self.setBehavior(t);
    },
    Static:{
        _DIRTYKEY:'MARK2',
        _ITEMKEY:'OUTER',
        Appearances:{
            KEY:{
                'font-size':'12px',
                zoom:xui.browser.ie?1:null
            },
            'TITLE, ITEMS, TAIL':{
                position:'relative',
                overflow:'auto',
                'line-height':'14px'
            },
            TAIL:{
                zoom:xui.browser.ie?1:null,
                'padding':'5px 0 5px 40px'
            },
            CMD:{
                margin:'3px',
                'white-space':'nowrap',
                'vertical-align':'middle'
            },
            TITLE:{
                'font-weight':'bold',
                padding:'4px'
            },
            ITEMS:{
                'overflow-x': 'hidden',
                zoom:xui.browser.ie?1:null
            },
            OUTER:{
                position:'relative',
                zoom:xui.browser.ie?1:null,
                'padding-left':'15px'
            },
            TOGGLE:{
                position:'absolute',
                left:0,
                top:'4px'
            },
            BODY:{
                display:'none',
                'padding-left':'27px'
            },
            ITEM:{
                display:'block',
                position:'relative',
                zoom:xui.browser.ie?1:null,
                padding:'4px 2px 4px 2px'
            },
            OPTION:{
                position:'absolute',
                left:'2px',
                top:'4px'
            },
            CAPTION:{
                'float':'left',
                zoom:xui.browser.ie?1:null,
                'margin-left':'24px',
                //{*1*}for: ie6 double margin bug
                display:xui.browser.ie6?'inline':null
            },
            'EDIT, EDITS':{
                $order:2,
                'float':'none',
                'background-color':'#EBEADB',
                cursor:'pointer',
                //{*1*}for: ie6 double margin bug
                display:xui.browser.ie6?'block':null
            },

            CHART:{
                'float':'right'
            },
            CLEAR:{
                clear:'both',
                'text-align':'right'
            },
            'PROGRESS, PROGRESSI':{
                background: xui.UI.$bg('icons.gif', 'no-repeat', true),
                width:'200px',
                height:'14px',
                border:0,
                'vertical-align':'middle',
                'line-height':0,
                'font-size':0
            },
            PROGRESS:{
                $order:1,
                'margin-left':'2px',
                'background-position':'-180px -200px'
            },
            PROGRESSI:{
                $order:1,
                'background-position':'-200px -216px'
            },
            DEL:{
                margin:'0 0 0 4px'
            }
        },
        DataModel:{
            $checkbox:1,
            selectable:true,
            noCtrlKey:null,
            title:{
                action:function(v){
                    this.getSubNode('TITLE').html(v);
                }
            },
            selMode:{
                ini:'single',
                listbox:['single','multi'],
                action:function(){
                    this.boxing().refresh();
                }
            },
            cmds:{
                ini:[]
            },
            noTitle:{
              ini:false,
              action:function(v){
                 this.getSubNode('TITLE').css('display',v?'none':'');
              }
            },
            toggle:{
                ini:false,
                action:function(v){
                    this.getSubNode('TOGGLE',true).css('display',v?'':'none');
                }
            },
            removeText:{
                ini:'remove',
                action:function(v){
                    this.getSubNode('DEL',true).text(v);
                }
            },
            editable:{
                ini:false,
                action:function(v){
                    var self=this,t,cls;
                    self.getSubNode('DEL',true).css('display',v?'':'none');
                    t=self.getSubNode('CAPTION',true).merge(self.getSubNode('TITLE'));
                    cls=self.getClass('EDIT');
                    if(v)
                        t.addClass(cls);
                    else
                        t.removeClass(cls);
                }
            },
            newOption:{
                ini:'',
                action:function(v){
                    var self=this,
                        id='$custom',
                        sid='_special',
                        t,
                        cs=self._cs;
                    if(!v){
                        if(cs)
                            cs.remove();
                    }else{
                        if(!cs){
                            t={
                                id:id,
                                caption:v
                            };
                            t[xui.UI.$tag_subId]=sid;
                            cs=self._buildItems('items',self.box._prepareItems(self,[t]));
                            self.getSubNode('ITEMS').addNext(self._cs=cs);
                        }else
                            self.getSubNodeByItemId('CAPTION',sid).html(v);
                    }
                }
            },
            editorType:'none'
        },
        Behaviors:{
            HoverEffected:{DEL:'DEL',CMD:'CMD',ITEM:'MARK2'},
            ClickEffected:{DEL:'DEL',CMD:'CMD',ITEM:'MARK2'}
        },
        EventHandlers:{
            beforeTitleChanged:function(profile, value){},
            beforeOptionAdded:function(profile, value){},
            beforeOptionRemoved:function(profile, item){},
            beforeOptionChanged:function(profile, item, value){},
            onCustomEdit:function(profile, node, flag, value, item, callback){},
            onClickButton:function(profile, key, src){},
            onGetContent:function(profile,item,callback){}
        },
        RenderTrigger:function(){
            var self=this,t=self.properties.newOption;
            if(t)
                self.boxing().setNewOption(t,true);
        },
        _prepareData:function(profile){
            var data=arguments.callee.upper.call(this, profile),
                p=profile.properties
            if(p.editable)
                data._cls = profile.getClass('EDIT');
            data.titleDisplay=p.noTitle?'display:none':'';

            var cmds = p.cmds, o;
            if(cmds && cmds.length){
                var sid=xui.UI.$tag_subId,a;
                a=data.cmds=[];
                for(var i=0,t=cmds,l=t.length;i<l;i++){
                    if(typeof t[i]=='string')t[i]={id:t[i]};
                    if(!t[i].caption)t[i].caption=t[i].id;
                    t[i].id=t[i].id.replace(/[^\w]/g,'_');

                    o=xui.UI.adjustData(profile,t[i]);
                    a.push(o);
                    o._tabindex=p.tabindex;
                    o[sid]=o.id;
                }
            }
            return data;
        },
        _prepareItem:function(profile, item){
            var p = profile.properties, f=profile.CF;
            item._tabindex = p.tabindex;

            if(typeof f.formatCaption == 'function')
                item.caption = f.formatCaption(item.caption);

            item._body= item._body || 'Loading...'
            if(item.id!='$custom'){
                item._togdisplay=((p.toggle && item.toggle!==false) || item.toggle)?'':'display:none;';
                item._optclass=p.selMode=='multi'?'xui-uicmd-check':'xui-uicmd-radio';
                item._display='';
                item.percent = parseFloat(item.percent)||0;
                if(item.percent<0)item.percent=0;
                if(item.percent>1)item.percent=1;
                item._per = 200*(1-item.percent);
            }else{
                item._optclass='xui-uicmd-add';
                item._togdisplay=item._display='display:none;';
                item._per = 0;
                item._itemcls=profile.getClass('EDITS');
            }
            item.removeText=p.removeText;
            item._del='display:none;';
            if((('editable' in item) && item.editable)||p.editable){
                item._itemcls=profile.getClass('EDIT');
                item._del = '';
            }

        },
        _buildBody:function(profile,item){
            return item.text?'<pre>'+item.text.replace(/</g,"&lt;")+'</pre>':'';
        },
        _onresize:function(){}
    }
});
Class("xui.UI.FoldingList", ["xui.UI.List"],{
    Instance:{
        fillContent:function(id, obj){
            var profile=this.get(0),t,item;
            if(profile.renderId){
                if(item=profile.getItemByItemId(id)){                    
                    t=profile.getSubNodeByItemId('BODYI',id).html('');
                    if(obj){
                        item._obj = obj;
                        item._fill=true;
                        if(typeof obj=='string')t.html(obj);
                        else t.append(obj.render(true));
                    }else
                        item._obj=item._fill=null;
                }
            }
            return this;
        },
        toggle:function(id){
            var profile=this.get(0);
            if(profile.renderId){
                var properties = profile.properties,
                    items=properties.items,
                    item = profile.getItemByItemId(id),
                    subId = profile.getSubIdByItemId(id),
                    node = profile.getSubNode('ITEM',subId),
                    toggle = profile.getSubNode('TOGGLE',subId),
                    nodenext = node.next(),t
                    ;
                if(item._show){
                    if(properties.activeLast && items.length)
                        if(items[items.length-1].id==item.id)
                            return false;
    
                    node.tagClass('-checked',false);
                    toggle.tagClass('-checked',false);
                    if(nodenext)
                        nodenext.tagClass('-prechecked',false);
                }else{
                    node.tagClass('-checked');
                    toggle.tagClass('-checked');
                    if(nodenext)
                        nodenext.tagClass('-prechecked');
                    //fill value
                    if(!item._fill){
                        var callback=function(o){
                            profile.boxing().fillContent(item.id, item._body=o);
                        };
                        if(profile.onGetContent){
                            var r = profile.boxing().onGetContent(profile, item, callback);
                            if(r) callback(r);
                        }else
                            callback(profile.box._buildBody(profile, item));
                    }
                }
                item._show=!item._show
             }
            return this;
        }
    },
    Initialize:function(){
        //modify default template fro shell
        var t = this.getTemplate();
        t.$submap={
            items:{
                ITEM:{
                    tagName : 'div',
                    className:'{_checked} {_precheked} {itemClass} {disabled} {readonly}',
                    style:'{itemStyle}',
                    HEAD:{
                        tagName : 'div',
                        HL:{tagName : 'div'},
                        HR:{tagName : 'div'},
                        TITLE:{
                            tabindex: '{_tabindex}',
                            TLEFT:{
                                $order:0,
                                tagName:'div',
                                TOGGLE:{
                                    $order:0,
                                    className:'xui-uicmd-toggle {_tlgchecked}'
                                },
                                CAP1:{
                                    $order:1,
                                    text:'{title}'
                                }
                            },
                            TRIGHT:{
                                $order:1,
                                tagName:'div',
                                style:'{_capDisplay}',
                                CAP2:{
                                    $order:0,
                                    text:'{caption}'
                                },
                                OPT:{
                                    $order:1,
                                    className:'xui-uicmd-opt',
                                    style:'{_opt}'
                                }
                            }/*,
                            TCLEAR:{
                                $order:2,
                                tagName:'div'
                            }*/
                        }
                    },
                    BODY:{
                        $order:1,
                        tagName : 'div',
                        className:'xui-uibg-base',
                        BODYI:{
                            $order:0,
                            tagName : 'div',
                            text:'{_body}'
                        },
                        CMDS:{
                            $order:1,
                            tagName : 'div',
                            text:"{cmds}"
                        }
                    },
                    TAIL:{
                        $order:4,
                        tagName : 'div',
                        TL:{tagName : 'div'},
                        TR:{tagName : 'div'}
                    }
                }
            },
            'items.cmds':{
                $order:2,
                CMD:{
                    className:'xui-ui-btn',
                    CMDI:{
                        className:'xui-ui-btni',
                        CMDC:{
                            className:'xui-ui-btnc',
                            CMDA:{
                                tabindex: '{_tabindex}',
                                text:'{caption}'
                            }
                        }
                    }
                }
            }
        };
        this.setTemplate(t);
    },
    Static:{
        Appearances:{
            KEY:{
                padding:'2px'
            },
            ITEMS:{
                border:0,
                position:'relative',
                zoom:xui.browser.ie?1:null,
                'padding-top':'8px'//,
                //for ie6 1px bug,  HR/TR(position:absolute;right:0;)
                //'margin-right':xui.browser.ie6?'expression(this.parentNode.offsetWidth?(this.parentNode.offsetWidth-(parseInt(this.parentNode.style.paddingLeft,10)||0)-(parseInt(this.parentNode.style.paddingRight,10)||0) )%2+"px":"auto")':null
            },
            ITEM:{
                border:0,
                //for ie6 bug
                zoom:xui.browser.ie?1:null,
                'margin-top':'-9px',
                padding:0,
                'font-family': '"Verdana", "Helvetica", "sans-serif"',
                position:'relative',
                overflow:'hidden'
            },
            'HEAD, BODY, BODYI, TAIL':{
                position:'relative'
            },

            CMDS:{
                'font-size':0,
                'line-height':0,
                padding:'2px 0 0 4px',
                'text-align':'right',
                position:'relative',
                background: xui.UI.$bg('border_left.gif', 'repeat-y left top #EEE'),
                zoom:xui.browser.ie?1:null
            },
            CMD:{
                margin:'2px 4px 2px 4px'
            },
            BODY:{
                display:'none',
                'border-right': 'solid 1px #CCC',
                zoom:xui.browser.ie?1:null,
                position:'relative',
                overflow:'auto',
                background: xui.UI.$bg('border_left.gif', 'repeat-y left top')
            },
            BODYI:{
                padding:'2px 8px 0 8px',
                background: xui.UI.$bg('border_left.gif', 'repeat-y left top'),
                position:'relative'
            },
            'BODY, BODYI':{
                'font-size':0,
                'line-height':0
            },
            'ITEM-checked':{
                $order:2,
                'margin-bottom':'12px'
             },
            'ITEM-checked BODY':{
                $order:2,
                display:'block'
            },
            'HL, HR, TL, TR':{
                position:'absolute',
                'font-size':0,
                'line-height':0,
                width:'8px',
                background: xui.UI.$bg('corner.gif', 'no-repeat')
            },
            'HL, HR':{
                height:'30px'
            },
            'ITEM-prechecked HL':{
                $order:1,
                'background-position': 'left top'
            },
            'ITEM-prechecked HR':{
                $order:1,
                'background-position': 'right top'
            },
            'TL, TR':{
                height:'20px'
            },
            HL:{
                $order:1,
                top:0,
                left:0,
                'background-position': 'left -37px'
            },
            HR:{
                $order:1,
                top:0,
                right:0,
                'background-position': 'right -37px'
            },
            TL:{
                $order:1,
                bottom:0,
                left:0,
                'background-position': 'left bottom'
            },
            TR:{
                $order:1,
                bottom:0,
                right:0,
                'background-position': 'right bottom'
            },
            HEAD:{
                position:'relative',
                zoom:xui.browser.ie?1:null,
                background: xui.UI.$bg('border_top.gif', '#fff repeat-x left top'),
                overflow:'hidden'
            },
            TITLE:{
                $order:1,
                height:'26px',
                display:'block',
                position:'relative',
                'white-space':'nowrap',
                overflow:'hidden'
            },
            TAIL:{
                'font-size':0,
                'line-height':0,
                position:'relative',
                height:'5px',
                background: xui.UI.$bg('border_bottom.gif', 'repeat-x left bottom #EEE')
            },
            'CAP1, CAP2':{
                padding:'3px',
                'vertical-align':'middle'
            },
            CAP1:{
                color:'#666',
                cursor:'pointer',
                'white-space':'nowrap',
            	font: 'bold 12px arial,sans-serif',
            	color: '#00681C'
            },
            'ITEM-checked CAP1':{
                $order:2,
                'font-weight':'normal'
            },
            TLEFT:{
                //position:xui.browser.ie6?'relative':null,
                //'float':'left',
                position:'absolute',
                left:'4px',
                top:'2px',

                'white-space':'nowrap',
                overflow:'hidden'
            },
            TRIGHT:{
                //position:xui.browser.ie6?'relative':null,
                //'float':'right',

                position:'absolute',
                right:'4px',
                top:'2px',

                'white-space':'nowrap',
                overflow:'hidden'
            }
        },
        Behaviors:{
            HoverEffected:{ITEM:null,HEAD:'HEAD',OPT:'OPT',CMD:'CMD'},
            ClickEffected:{ITEM:null,HEAD:'HEAD',CMD:'CMD'},
            ITEM:{onClick:null,onKeydown:null},
            HEAD:{
                onClick:function(profile, e, src){
                    profile.boxing().toggle(profile.getItemIdByDom(src));
                    return false;
                }
            },
            CMD:{
                onClick:function(profile,e,src){
                    if(profile.onClickButton)
                        profile.boxing().onClickButton(profile,profile.getItemByDom(xui.use(src).parent().get(0)), xui.use(src).id().split('_')[1],src);
                    return false;
                }
            },
            OPT:{
                onMousedown:function(){
                    return false;
                },
                onClick:function(profile, e, src){
                    profile.boxing().onShowOptions(profile, profile.getItemByDom(src), e, src);
                    return false;
                }
            }
        },
        DataModel:({
            value:null,
            borderType:null,
            cmds:{
                ini:[]
            },
            activeLast:false
        }),
        EventHandlers:{
            onGetContent:function(profile,item,onEnd){},
            onClickButton:function(profile,item,cmdkey,src){},
            onShowOptions:function(profile,item,e,src){}
        },
         RenderTrigger:function(){
            var self=this, pro=self.properties, items=pro.items, item;
            if(pro.activeLast && items.length>0){
                item=items[items.length-1];
                self.boxing().fillContent(item.id, item._body);
            }
        },
        _prepareItems:function(profile, arr, pid){
            if(arr.length){
                arr[0]._precheked = profile.getClass('ITEM','-prechecked');
                if(profile.properties.activeLast){
                    //for properties.data
                    var item = arr[arr.length-1];
                    item._show = true;
                    item._fill = true;
                    item._body = profile.onGetContent?profile.boxing().onGetContent(profile,item) : profile.box._buildBody(profile, item);
                }
            }
            return arguments.callee.upper.apply(this, arguments);
        },
        _prepareItem:function(profile, item){
            var p = profile.properties,o,
                dpn = 'display:none';
            item._tabindex = p.tabindex;
            if(!item.caption)
                item._capDisplay=dpn;
            else
                item.caption = item.caption.replace(/</g,"&lt;");
            item._opt = item.optBtn?'':dpn;
            item._body= item._body || 'Loading...'

            if(item._show){
                item._checked = profile.getClass('ITEM','-checked');
                item._tlgchecked = profile.getClass('TOGGLE','-checked');
            }
            var cmds = item.cmds || p.cmds;
            if(cmds && cmds.length){
                var sid=xui.UI.$tag_subId,a;
                a=item.cmds=[];
                for(var i=0,t=cmds,l=t.length;i<l;i++){
                    if(typeof t[i]=='string')t[i]={id:t[i]};
                    if(!t[i].caption)t[i].caption=t[i].id;
                    t[i].id=t[i].id.replace(/[^\w]/g,'_');

                    o=xui.UI.adjustData(profile,t[i]);
                    a.push(o);
                    o[sid]=item[sid] + '_' + o.id;
                }
            }
        },
        _buildBody:function(profile,item){
            return item.text?'<pre>'+item.text.replace(/</g,"&lt;")+'</pre>':'';
        },
        _onresize:function(){}
    }
});
/*
300: ruler width
30: ruler height
15: ruler shadow height

15: indicator width => 8: indicator offset
14: indicator height
*/
Class("xui.UI.Range", ["xui.UI","xui.absValue"],{
    Instance:{
        _setCtrlValue:function(value){
            return this.each(function(profile){
                var p=profile.properties,
                    tpl=p.captionTpl,
                    fun=function(k){return profile.getSubNode(k)},
                    fun1=function(a,i){a.cssPos({left:profile[i], top: box._x2y(profile[i])}) },
                    fun2=function(o,v){o.get(0).style.width = v +'px'},
                    title = fun('CAPTION'),
                    a=fun('IND1'),
                    b=fun('IND2'),
                    r1 = fun('RULER1'),
                    r3 = fun('RULER3'),
                    box = profile.box,
                    arr = box._v2a(value);

                profile._rate= 300/(p.max-p.min);
                //use Math.round
                profile._v1= Math.round((arr[0]-p.min) /  (p.max-p.min) *300) ;
                profile._v2= Math.round((1-(p.max - arr[1]) /  (p.max-p.min)) *300);

                //text value
                title.html(box._buildTpl(p.singleValue,tpl, arr,p.unit),false);
                //indicator position
                fun1(a, '_v1');
                fun1(b,'_v2');
                //background div width
                fun2(r1, profile._v1+8);
                fun2(r3, profile._v2+8);
            });
        },
        _setDirtyMark:function(){
            return arguments.callee.upper.apply(this,['BOX']);
        }
    },
    Static:{
        Templates:{
            style:'{_style}',
            className:'{_className}',
            BOX:{
                tagName:'div',
                RULER:{
                    tagName:'div',
                    IND1:{
                        tabindex:'{tabindex}',
                        style:'{_single}'
                    },
                    IND2:{
                        tabindex:'{tabindex}'
                    },
                    RULER1:{
                        $order:2,
                        style:'{_single}'
                    },
                    RULER3:{}
                },
                TAIL:{
                    tagName:'div',
                    CAPTION:{
                        tagName:'div'
                    },
                    MIN:{
                        text:'{min}'
                    },
                    MAX:{
                        text:'{max}'
                    }
                }
            }
        },
        Appearances:{
            'KEY, RULER, IND1, IND1':{
                'font-size':0,
                'line-height':0,
                position:'relative'
            },
            BOX:{
                position:'absolute',
                left:0,
                top:0,
                width:'316px'
            },
            'CAPTION, IND1, TAIL, MIN':{
                'font-size':'12px',
                'line-height':'14px'
            },
            RULER:{
                $order:1,
                position:'relative',
                height:'30px',
                overflow:'visible',
                'margin-bottom':'3px',
                background: xui.UI.$bg('bg.png'),
                _background:'none',
                _filter: xui.UI.$ieBg('bg.png')
            },
            'RULER1, RULER3':{
                position:'absolute',
                left:0,
                top:0,
                height:'30px',
                width:'300px'
            },
            RULER1:{
                background: xui.UI.$bg('bg.png'),
                _background:'none',
                _filter: xui.UI.$ieBg('bg.png')
            },
            RULER3:{
                background: xui.UI.$bg('front.png'),
                _background:'none',
                _filter: xui.UI.$ieBg('front.png')
            },
            'IND1,IND2':{
                display:xui.$inlineBlock,
                zoom:xui.browser.ie6?1:null,
                'z-index':'2',
                width:'15px',
                height:'14px',
                position:'absolute'
            },
            IND1:{
                background: xui.UI.$bg('icons.gif', 'no-repeat left -225px', true),
                left:'0px',
                top:'11px'
            },
            IND2:{
                background: xui.UI.$bg('icons.gif', 'no-repeat -15px -225px', true),
                left:'300px',
                top:'1px'
            },
            TAIL:{
                $order:2,
                width:'300px',
                position:'relative'
            },
            CAPTION:{
                position:'relative',
                'text-align':'center'
            },
            MIN:{
                position:'absolute',
                left:0,
                top:0
            },
            MAX:{
                position:'absolute',
                right:0,
                top:0
            }
        },
        Behaviors:{
            IND1:{
                onKeydown:function(profile, e, src){
                    if(profile.properties.disabled || profile.properties.readonly)return;
                    profile.box._keydown.apply(profile.box,[profile, e, src,0]);
                },
                onMousedown:function(profile, e, src){
                    if(profile.properties.disabled || profile.properties.readonly)return;
                    if(xui.Event.getBtn(e)!="left")return;
                    var p=profile.properties,
                        box=profile.box,
                        arr = box._v2a(p.$UIvalue);

                    xui.use(src).startDrag(e,{
                        widthIncrement:p.steps?p.width/p.steps:null,
                        dragType:'move',
                        targetReposition:true,
                        horizontalOnly:true,
                        maxLeftOffset: (profile._v1),
                        maxRightOffset: (profile._v2-profile._v1),
                        dragCursor:'default'
                    });
                    xui.use(src).css('zIndex',10).focus();
                    profile.getSubNode('IND2').css('zIndex',5);
                },
                onDrag:function(profile, e, src){
                    var d=xui.DragDrop.getProfile();
                    profile.box._ondrag.apply(profile.box,[profile,d.curPos.left,src,0]);
                },
                onDragstop:function(profile, e, src){
                    var p=profile.properties,
                        box=profile.boxing(),
                        rate = profile._rate,
                        d=xui.DragDrop.getProfile(),
                        f,
                        arr = p.$UIvalue.split(':');
                    profile._v1=d.curPos.left;
                    arr[0]= ((profile._v1)/rate + p.min);
                    box.setUIValue(arr.join(':'));

                    if(profile._v1==profile._v2){
                        xui.use(src).css('zIndex',10);
                        profile.getSubNode('IND2').css('zIndex',5);
                    }
                }
            },
            IND2:{
                onKeydown:function(profile, e, src){
                    if(profile.properties.disabled || profile.properties.readonly)return;
                    profile.box._keydown.apply(profile.box,[profile, e, src,1]);
                },
                onMousedown:function(profile, e, src){
                    if(profile.properties.disabled || profile.properties.readonly)return;
                    if(xui.Event.getBtn(e)!="left")return;
                    var p=profile.properties,
                        box=profile.box,
                        arr = box._v2a(p.$UIvalue);

                    xui.use(src).startDrag(e,{
                        widthIncrement:p.steps?p.width/p.steps:null,
                        dragType:'move',
                        targetReposition:true,
                        horizontalOnly:true,
                        maxLeftOffset: (profile._v2-profile._v1),
                        maxRightOffset: (300 - profile._v2),
                        dragCursor:'default'
                    });
                    xui.use(src).css('zIndex',10).focus();
                    profile.getSubNode('IND1').css('zIndex',5);
                },
                onDrag:function(profile, e, src){
                    var d=xui.DragDrop.getProfile();
                    profile.box._ondrag.apply(profile.box,[profile,d.curPos.left,src,1]);
                },
                onDragstop:function(profile, e, src){
                    var p=profile.properties,
                        box=profile.boxing(),
                        rate = profile._rate,
                        d=xui.DragDrop.getProfile(),
                        f,
                        arr = p.$UIvalue.split(':');
                    profile._v2=d.curPos.left;
                    arr[1]= ((profile._v2)/rate + p.min);
                    box.setUIValue(arr.join(':'));
                }
            }
        },
        DataModel:{
            position:'absolute',
            
            width:{
                ini:300,
                readonly:true
            },
            height:{
                ini:46,
                readonly:true
            },
            min:{
                ini:0,
                action:function(){
                    var self=this,t,pro=self.properties,b=self.boxing();
                    b.refresh();
                    if(pro.$UIvalue!=(t=this.box._ensureValue(self,pro.$UIvalue)))
                        b.setValue(t);
                }
            },
            max:{
                ini:100,
                action:function(){
                    var self=this,t,pro=self.properties,b=self.boxing();
                    b.refresh();
                    if(pro.$UIvalue!=(t=this.box._ensureValue(self,pro.$UIvalue)))
                        b.setValue(t);
                }
            },
            unit:{
                ini:'',
                action:function(){
                    this.boxing()._setCtrlValue(this.properties.$UIvalue);
                }
            },
            steps:0,
            captionTpl:{
                ini:'{fromvalue}{unit} - {tovalue}{unit}',
                action:function(){
                    this.boxing()._setCtrlValue(this.properties.$UIvalue);
                }
            },
            value:'0:100',
            singleValue:{
                ini:false,
                action:function(v){
                    this.boxing().refresh();
                }
            }
        },
        _prepareData:function(profile){
            var d=arguments.callee.upper.call(this, profile);
            var p=profile.properties,
                arr=profile.box._v2a(p.value);
            d._single = p.singleValue?'display:none':'';

            p.min=parseFloat(p.min);
            p.max=parseFloat(p.max);

            d.min = d.min + p.unit;
            d.max = d.max + p.unit;
            return d;
        },
        _ensureValue:function(profile, value){
            if(!value)value="";
            var p = profile.properties,
                a = value.split(':'),
                min=p.min,
                max=p.max,
                b=[],
                f1=function(a){return parseFloat(a)},
                f2=function(a){return Math.min(max, Math.max(min,a))};
            
            b[0]= f1(a[0]);
            b[1]= f1(a[1]);
            b[0] = Math.min(b[0],b[1]);
            if(!min)min=b[0];
            if(!max)max=b[1];
            b[0]= f2(b[0]);
            b[1]= f2(b[1]);            
            return b.join(':');
        },
        _v2a:function(value){
            return typeof value == 'string'? value.split(':') : value;
        },
        _buildTpl:function(single,tpl,arr,unit){
            return single?
              arr[1] + unit
            : tpl.replace(/\{fromvalue\}/g,arr[0]).replace(/\{tovalue\}/g,arr[1]).replace(/\{unit\}/g,unit);
        },
        _x2y:function(x){
            return (15 + 1 - (x) * (15/300));
        },
        _keydown:function(profile, e, src,type){
            var key=xui.Event.getKey(e);
            if(key.key=='left' || key.key=='right'){
                var s=xui.use(src).get(0).style, left=parseInt(s.left,10), pro=profile.properties, steps=pro.steps, span=300/steps, v,f=function(key){
                    return parseInt(profile.getSubNode(key).get(0).style.left,10);
                };
                left += key.key=='left'?-1:1;
                if(steps){
                    left = left-left%span;
                    if(key.key=='right')
                        left += span;
                }
                if(!pro.singleValue)
                    if(type===0){
                        v=f('IND2');
                        if(left>v)left=v;
                    }else{
                        v=f('IND1');
                        if(left<v)left=v;
                    }
                if(left<0)left=0;
                if(left>300)left=300;
                
                s.left=left+'px';

                profile.box._ondrag.apply(profile.box,[profile,left,src,type]);

                var  rate = profile._rate,
                    arr = pro.$UIvalue.split(':');
                if(type===0){
                    profile._v1=left;
                    arr[0]= ((profile._v1)/rate + pro.min);
                }else{
                    profile._v2=left;
                    arr[1]= ((profile._v2)/rate + pro.min);
                }
                profile.boxing().setUIValue(arr.join(':'));                
            }
        },
        _ondrag:function(profile, left, src, tag){
            var p=profile.properties,
                d=xui.DragDrop.getProfile(),
                box=profile.box,
                fun=function(k){return profile.getSubNode(k)},
                fun2=function(o,v){o.get(0).style.width = v +'px'},
                cap = fun('CAPTION'),
                r1 = fun('RULER1'),
                r3 = fun('RULER3'),
                t,f,
                arr=this._v2a(p.$UIvalue);

             //adjust top
            xui.use(src).get(0).style.top = this._x2y(left) + 'px';

            t = ((left)/profile._rate + p.min);

            if(tag){
                arr[1] = t;
                fun2(r3, left + 8);
            }else{
                arr[0] = t;
                fun2(r1, left + 8);
            }
             cap.html(box._buildTpl(p.singleValue, p.captionTpl, arr,p.unit),false);
        },
        _onresize:function(){}
    }
});Class('xui.UI.Calendar', 'xui.UI.DatePicker', {
    Instance:{
        setDayInfo:function(key,index,value){
            var node=this.getSubNode(key, ""+index);
            if(node.get(0)){
                node.get(0).innerHTML=value;
            }
            return this;
        },
        addContents : function(index,node){
            this.getSubNode('DC',""+index).append(node);
            return this;
        },
        clearContents : function(index){
            this.getSubNode('DC',""+index).empty();
            return this;
        }
    },
    Initialize:function(){
        var self=this,
            id=xui.UI.$ID,
            tag=xui.UI.$tag_special,
            cls=xui.UI.$CLS,
            key=self.KEY;

        self.addTemplateKeys(['H', 'W','COL','DH','DAYBOX','DC','TBODY', 'THEADER', 'TD','DF1','DF2','DF3','DF4']);
        var colgroup = '<colgroup id="'+key+'-COL:'+id+':"  class="'+tag+'COL_CS'+tag+'"  style="'+tag+'COL_CS'+tag+'"><col width="2%"/><col width="14%"/><col width="14%"/><col width="14%"/><col width="14%"/><col width="14%"/><col width="14%"/><col width="14%"/></colgroup>',
            thead1='<thead ID="'+key+'-THEADER:'+id+':" class="'+tag+'THEADER_CS'+tag+'"  style="'+tag+'THEADER_CS'+tag+'" ><tr height="1%"><th id="'+key+'-H:'+id+':7" class="xui-node xui-node-th '+cls+'-h '+tag+'H_CC'+tag+'"  style="'+tag+'H_CS'+tag+'"></th>',
            thead2='</tr></thead>',
            th='<th id="'+key+'-H:'+id+':@" class="xui-node xui-node-th '+cls+'-h '+tag+'H_CC'+tag+'"  style="'+tag+'H_CS'+tag+'">@</th>',
            tbody1 = '<tbody id="'+key+'-TBODY:'+id +':"  class="'+tag+'TBODY_CS'+tag+'"  style="'+tag+'TBODY_CS'+tag+'">',
            tbody2 = '</tbody>',
            tr1='<tr>',
            tr2='</tr>',
            td1='<th id="'+key+'-W:'+id+':@"  class="xui-node xui-node-th '+cls+'-w '+tag+'W_CC'+tag+'" style="'+tag+'W_CS'+tag+'">@</th>',
            td2='<td id="'+key+'-TD:'+id+':@" class="xui-node xui-node-td '+cls+'-td '+tag+'TD_CC'+tag+'"  style="'+tag+'TD_CS'+tag+'" '+xui.$IEUNSELECTABLE()+'  >'+
                '<div id="'+key+'-DAYBOX:'+id+':@" class="xui-node xui-node-div '+cls+'-daybox '+tag+'DAY_CC'+tag+'"  style="'+tag+'DAY_CS'+tag+'" '+xui.$IEUNSELECTABLE()+' >'+
                    '<div id="'+key+'-DH:'+id+':@" class="xui-node xui-node-div '+cls+'-dh '+tag+'DH_CC'+tag+'"  style="'+tag+'DH_CS'+tag+'"></div>'+
                    '<div id="'+key+'-DF1:'+id+':@" class="xui-node xui-node-div '+cls+'-df1 '+tag+'DF1_CC'+tag+'" style="'+tag+'DF1_CS'+tag+'"></div>'+
                    '<div id="'+key+'-DF2:'+id+':@" class="xui-node xui-node-div '+cls+'-df2 '+tag+'DF2_CC'+tag+'" style="'+tag+'DF2_CS'+tag+'"></div>'+
                    '<div id="'+key+'-DF3:'+id+':@" class="xui-node xui-node-div '+cls+'-df3 '+tag+'DF3_CC'+tag+'" style="'+tag+'DF3_CS'+tag+'"></div>'+
                    '<div id="'+key+'-DF4:'+id+':@" class="xui-node xui-node-div '+cls+'-df4 '+tag+'DF4_CC'+tag+'"  style="'+tag+'DF4_CS'+tag+'"></div>'+
                    '<div id="'+key+'-DC:'+id+':@" class="xui-node xui-node-div '+cls+'-dc '+tag+'DC_CC'+tag+'"  style="'+tag+'DC_CS'+tag+'"></div>'+
                '</div>'+
                '</td>',
            body,i,j,k,l,a=[],b=[];
        for(i=0;i<7;i++)
            b[b.length]= th.replace(/@/g,i);

        k=l=0;
        for(i=0;i<48;i++){
            j=i%8;
            a[a.length]= (j==0?tr1:'') + (j==0?td1:td2).replace(/@/g,j==0?l:k) + (j==7?tr2:'');
            if(j!==0)k++;
            else l++;
        }

        body=colgroup+thead1+b.join('')+thead2+tbody1+a.join('')+tbody2;

        self.setTemplate({
            tagName : 'div',
            style:'{_style}',
            className:'{_className}',
            onselectstart:'return false',
            BORDER:{
                tagName : 'div',
                BODY:{
                    $order:1,
                    tagName:'table',
                    cellpadding:"0",
                    cellspacing:"0",
                    width:'100%',
                    text:body
                }
            }
        });
        delete self.$Keys.YEAR;
        delete self.$Keys.MONTH;
    },
    Static:{
        Behaviors:{        
            DroppableKeys:['DAYBOX'],
            HoverEffected:{},
            ClickEffected:{},
            onSize:xui.UI.$onSize,
            TD:{onClick:null,
                onDblclick:function(profile, e, src){
                    var p=profile.properties,
                        index=profile.getSubId(src);
                    if(p.disabled)return false;
                    profile.boxing().onDblclick(profile, index, e, src);
                }
            }
        },
        DataModel:{
            handleHeight : null,
            tipsHeight :null,
            closeBtn:null,
            timeInput:null,
            dataBinder:null,
            dateField:null,

            dock:'fill',
            width:200,
            height:200
        },
        EventHandlers:{
            onDblclick:function(profile, item, e, src){},
            beforeClose:null
        },
        _getLabelNodes:function(profile){
            return profile.$day1 || (profile.$day1=profile.getSubNode('DF1',true));
        },
        _getDayNodes:function(profile){
            return profile.$day2 || (profile.$day2=profile.getSubNode('DAYBOX',true));
        },
        Appearances:{
            'DAYBOX, DC':{
                position:'relative'
            },
            'DF1, DF2, DF3, DF4':{
                position:'absolute',
                'white-space':'nowrap'
            },
            DF1:{
                left:'2px',
                top:'2px'
            },
            DF2:{
                right:'2px',
                top:'2px'
            },
            DF3:{
                left:'2px',
                bottom:'2px'
            },
            DF4:{
                right:'2px',
                bottom:'2px'
            },
            DAYBOX:{
                overflow:'hidden'
            },
            DC:{
                'text-align':'left'
            },
            TD:{
                "background-color":"#F9F7D1"
            },
            'TD-checked':{
                $order:1//,
                //"background-color":"#FFFB1E"
            },
            'TD-free':{
                $order:1,
                "background-color":"#FFF"
            }
        },
        _onresize:function(profile,width,height){
            var p=profile.properties,
                f=function(k){return profile.getSubNode(k)},
                t;
            //for border, view and items
            if(height){
                f('BORDER').height(t=height);
                f('BODY').height(t);
                t=(t-16)/6-1;
                profile.box._getDayNodes(profile).height(t);
            }
        }
    }
});/*! jQuery v1.8.3 jquery.com | jquery.org/license */
(function(e,t){function _(e){var t=M[e]={};return v.each(e.split(y),function(e,n){t[n]=!0}),t}function H(e,n,r){if(r===t&&e.nodeType===1){var i="data-"+n.replace(P,"-$1").toLowerCase();r=e.getAttribute(i);if(typeof r=="string"){try{r=r==="true"?!0:r==="false"?!1:r==="null"?null:+r+""===r?+r:D.test(r)?v.parseJSON(r):r}catch(s){}v.data(e,n,r)}else r=t}return r}function B(e){var t;for(t in e){if(t==="data"&&v.isEmptyObject(e[t]))continue;if(t!=="toJSON")return!1}return!0}function et(){return!1}function tt(){return!0}function ut(e){return!e||!e.parentNode||e.parentNode.nodeType===11}function at(e,t){do e=e[t];while(e&&e.nodeType!==1);return e}function ft(e,t,n){t=t||0;if(v.isFunction(t))return v.grep(e,function(e,r){var i=!!t.call(e,r,e);return i===n});if(t.nodeType)return v.grep(e,function(e,r){return e===t===n});if(typeof t=="string"){var r=v.grep(e,function(e){return e.nodeType===1});if(it.test(t))return v.filter(t,r,!n);t=v.filter(t,r)}return v.grep(e,function(e,r){return v.inArray(e,t)>=0===n})}function lt(e){var t=ct.split("|"),n=e.createDocumentFragment();if(n.createElement)while(t.length)n.createElement(t.pop());return n}function Lt(e,t){return e.getElementsByTagName(t)[0]||e.appendChild(e.ownerDocument.createElement(t))}function At(e,t){if(t.nodeType!==1||!v.hasData(e))return;var n,r,i,s=v._data(e),o=v._data(t,s),u=s.events;if(u){delete o.handle,o.events={};for(n in u)for(r=0,i=u[n].length;r<i;r++)v.event.add(t,n,u[n][r])}o.data&&(o.data=v.extend({},o.data))}function Ot(e,t){var n;if(t.nodeType!==1)return;t.clearAttributes&&t.clearAttributes(),t.mergeAttributes&&t.mergeAttributes(e),n=t.nodeName.toLowerCase(),n==="object"?(t.parentNode&&(t.outerHTML=e.outerHTML),v.support.html5Clone&&e.innerHTML&&!v.trim(t.innerHTML)&&(t.innerHTML=e.innerHTML)):n==="input"&&Et.test(e.type)?(t.defaultChecked=t.checked=e.checked,t.value!==e.value&&(t.value=e.value)):n==="option"?t.selected=e.defaultSelected:n==="input"||n==="textarea"?t.defaultValue=e.defaultValue:n==="script"&&t.text!==e.text&&(t.text=e.text),t.removeAttribute(v.expando)}function Mt(e){return typeof e.getElementsByTagName!="undefined"?e.getElementsByTagName("*"):typeof e.querySelectorAll!="undefined"?e.querySelectorAll("*"):[]}function _t(e){Et.test(e.type)&&(e.defaultChecked=e.checked)}function Qt(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=Jt.length;while(i--){t=Jt[i]+n;if(t in e)return t}return r}function Gt(e,t){return e=t||e,v.css(e,"display")==="none"||!v.contains(e.ownerDocument,e)}function Yt(e,t){var n,r,i=[],s=0,o=e.length;for(;s<o;s++){n=e[s];if(!n.style)continue;i[s]=v._data(n,"olddisplay"),t?(!i[s]&&n.style.display==="none"&&(n.style.display=""),n.style.display===""&&Gt(n)&&(i[s]=v._data(n,"olddisplay",nn(n.nodeName)))):(r=Dt(n,"display"),!i[s]&&r!=="none"&&v._data(n,"olddisplay",r))}for(s=0;s<o;s++){n=e[s];if(!n.style)continue;if(!t||n.style.display==="none"||n.style.display==="")n.style.display=t?i[s]||"":"none"}return e}function Zt(e,t,n){var r=Rt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function en(e,t,n,r){var i=n===(r?"border":"content")?4:t==="width"?1:0,s=0;for(;i<4;i+=2)n==="margin"&&(s+=v.css(e,n+$t[i],!0)),r?(n==="content"&&(s-=parseFloat(Dt(e,"padding"+$t[i]))||0),n!=="margin"&&(s-=parseFloat(Dt(e,"border"+$t[i]+"Width"))||0)):(s+=parseFloat(Dt(e,"padding"+$t[i]))||0,n!=="padding"&&(s+=parseFloat(Dt(e,"border"+$t[i]+"Width"))||0));return s}function tn(e,t,n){var r=t==="width"?e.offsetWidth:e.offsetHeight,i=!0,s=v.support.boxSizing&&v.css(e,"boxSizing")==="border-box";if(r<=0||r==null){r=Dt(e,t);if(r<0||r==null)r=e.style[t];if(Ut.test(r))return r;i=s&&(v.support.boxSizingReliable||r===e.style[t]),r=parseFloat(r)||0}return r+en(e,t,n||(s?"border":"content"),i)+"px"}function nn(e){if(Wt[e])return Wt[e];var t=v("<"+e+">").appendTo(i.body),n=t.css("display");t.remove();if(n==="none"||n===""){Pt=i.body.appendChild(Pt||v.extend(i.createElement("iframe"),{frameBorder:0,width:0,height:0}));if(!Ht||!Pt.createElement)Ht=(Pt.contentWindow||Pt.contentDocument).document,Ht.write("<!doctype html><html><body>"),Ht.close();t=Ht.body.appendChild(Ht.createElement(e)),n=Dt(t,"display"),i.body.removeChild(Pt)}return Wt[e]=n,n}function fn(e,t,n,r){var i;if(v.isArray(t))v.each(t,function(t,i){n||sn.test(e)?r(e,i):fn(e+"["+(typeof i=="object"?t:"")+"]",i,n,r)});else if(!n&&v.type(t)==="object")for(i in t)fn(e+"["+i+"]",t[i],n,r);else r(e,t)}function Cn(e){return function(t,n){typeof t!="string"&&(n=t,t="*");var r,i,s,o=t.toLowerCase().split(y),u=0,a=o.length;if(v.isFunction(n))for(;u<a;u++)r=o[u],s=/^\+/.test(r),s&&(r=r.substr(1)||"*"),i=e[r]=e[r]||[],i[s?"unshift":"push"](n)}}function kn(e,n,r,i,s,o){s=s||n.dataTypes[0],o=o||{},o[s]=!0;var u,a=e[s],f=0,l=a?a.length:0,c=e===Sn;for(;f<l&&(c||!u);f++)u=a[f](n,r,i),typeof u=="string"&&(!c||o[u]?u=t:(n.dataTypes.unshift(u),u=kn(e,n,r,i,u,o)));return(c||!u)&&!o["*"]&&(u=kn(e,n,r,i,"*",o)),u}function Ln(e,n){var r,i,s=v.ajaxSettings.flatOptions||{};for(r in n)n[r]!==t&&((s[r]?e:i||(i={}))[r]=n[r]);i&&v.extend(!0,e,i)}function An(e,n,r){var i,s,o,u,a=e.contents,f=e.dataTypes,l=e.responseFields;for(s in l)s in r&&(n[l[s]]=r[s]);while(f[0]==="*")f.shift(),i===t&&(i=e.mimeType||n.getResponseHeader("content-type"));if(i)for(s in a)if(a[s]&&a[s].test(i)){f.unshift(s);break}if(f[0]in r)o=f[0];else{for(s in r){if(!f[0]||e.converters[s+" "+f[0]]){o=s;break}u||(u=s)}o=o||u}if(o)return o!==f[0]&&f.unshift(o),r[o]}function On(e,t){var n,r,i,s,o=e.dataTypes.slice(),u=o[0],a={},f=0;e.dataFilter&&(t=e.dataFilter(t,e.dataType));if(o[1])for(n in e.converters)a[n.toLowerCase()]=e.converters[n];for(;i=o[++f];)if(i!=="*"){if(u!=="*"&&u!==i){n=a[u+" "+i]||a["* "+i];if(!n)for(r in a){s=r.split(" ");if(s[1]===i){n=a[u+" "+s[0]]||a["* "+s[0]];if(n){n===!0?n=a[r]:a[r]!==!0&&(i=s[0],o.splice(f--,0,i));break}}}if(n!==!0)if(n&&e["throws"])t=n(t);else try{t=n(t)}catch(l){return{state:"parsererror",error:n?l:"No conversion from "+u+" to "+i}}}u=i}return{state:"success",data:t}}function Fn(){try{return new e.XMLHttpRequest}catch(t){}}function In(){try{return new e.ActiveXObject("Microsoft.XMLHTTP")}catch(t){}}function $n(){return setTimeout(function(){qn=t},0),qn=v.now()}function Jn(e,t){v.each(t,function(t,n){var r=(Vn[t]||[]).concat(Vn["*"]),i=0,s=r.length;for(;i<s;i++)if(r[i].call(e,t,n))return})}function Kn(e,t,n){var r,i=0,s=0,o=Xn.length,u=v.Deferred().always(function(){delete a.elem}),a=function(){var t=qn||$n(),n=Math.max(0,f.startTime+f.duration-t),r=n/f.duration||0,i=1-r,s=0,o=f.tweens.length;for(;s<o;s++)f.tweens[s].run(i);return u.notifyWith(e,[f,i,n]),i<1&&o?n:(u.resolveWith(e,[f]),!1)},f=u.promise({elem:e,props:v.extend({},t),opts:v.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:qn||$n(),duration:n.duration,tweens:[],createTween:function(t,n,r){var i=v.Tween(e,f.opts,t,n,f.opts.specialEasing[t]||f.opts.easing);return f.tweens.push(i),i},stop:function(t){var n=0,r=t?f.tweens.length:0;for(;n<r;n++)f.tweens[n].run(1);return t?u.resolveWith(e,[f,t]):u.rejectWith(e,[f,t]),this}}),l=f.props;Qn(l,f.opts.specialEasing);for(;i<o;i++){r=Xn[i].call(f,e,l,f.opts);if(r)return r}return Jn(f,l),v.isFunction(f.opts.start)&&f.opts.start.call(e,f),v.fx.timer(v.extend(a,{anim:f,queue:f.opts.queue,elem:e})),f.progress(f.opts.progress).done(f.opts.done,f.opts.complete).fail(f.opts.fail).always(f.opts.always)}function Qn(e,t){var n,r,i,s,o;for(n in e){r=v.camelCase(n),i=t[r],s=e[n],v.isArray(s)&&(i=s[1],s=e[n]=s[0]),n!==r&&(e[r]=s,delete e[n]),o=v.cssHooks[r];if(o&&"expand"in o){s=o.expand(s),delete e[r];for(n in s)n in e||(e[n]=s[n],t[n]=i)}else t[r]=i}}function Gn(e,t,n){var r,i,s,o,u,a,f,l,c,h=this,p=e.style,d={},m=[],g=e.nodeType&&Gt(e);n.queue||(l=v._queueHooks(e,"fx"),l.unqueued==null&&(l.unqueued=0,c=l.empty.fire,l.empty.fire=function(){l.unqueued||c()}),l.unqueued++,h.always(function(){h.always(function(){l.unqueued--,v.queue(e,"fx").length||l.empty.fire()})})),e.nodeType===1&&("height"in t||"width"in t)&&(n.overflow=[p.overflow,p.overflowX,p.overflowY],v.css(e,"display")==="inline"&&v.css(e,"float")==="none"&&(!v.support.inlineBlockNeedsLayout||nn(e.nodeName)==="inline"?p.display="inline-block":p.zoom=1)),n.overflow&&(p.overflow="hidden",v.support.shrinkWrapBlocks||h.done(function(){p.overflow=n.overflow[0],p.overflowX=n.overflow[1],p.overflowY=n.overflow[2]}));for(r in t){s=t[r];if(Un.exec(s)){delete t[r],a=a||s==="toggle";if(s===(g?"hide":"show"))continue;m.push(r)}}o=m.length;if(o){u=v._data(e,"fxshow")||v._data(e,"fxshow",{}),"hidden"in u&&(g=u.hidden),a&&(u.hidden=!g),g?v(e).show():h.done(function(){v(e).hide()}),h.done(function(){var t;v.removeData(e,"fxshow",!0);for(t in d)v.style(e,t,d[t])});for(r=0;r<o;r++)i=m[r],f=h.createTween(i,g?u[i]:0),d[i]=u[i]||v.style(e,i),i in u||(u[i]=f.start,g&&(f.end=f.start,f.start=i==="width"||i==="height"?1:0))}}function Yn(e,t,n,r,i){return new Yn.prototype.init(e,t,n,r,i)}function Zn(e,t){var n,r={height:e},i=0;t=t?1:0;for(;i<4;i+=2-t)n=$t[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}function tr(e){return v.isWindow(e)?e:e.nodeType===9?e.defaultView||e.parentWindow:!1}var n,r,i=e.document,s=e.location,o=e.navigator,u=e.jQuery,a=e.$,f=Array.prototype.push,l=Array.prototype.slice,c=Array.prototype.indexOf,h=Object.prototype.toString,p=Object.prototype.hasOwnProperty,d=String.prototype.trim,v=function(e,t){return new v.fn.init(e,t,n)},m=/[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source,g=/\S/,y=/\s+/,b=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,w=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,E=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,S=/^[\],:{}\s]*$/,x=/(?:^|:|,)(?:\s*\[)+/g,T=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,N=/"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g,C=/^-ms-/,k=/-([\da-z])/gi,L=function(e,t){return(t+"").toUpperCase()},A=function(){i.addEventListener?(i.removeEventListener("DOMContentLoaded",A,!1),v.ready()):i.readyState==="complete"&&(i.detachEvent("onreadystatechange",A),v.ready())},O={};v.fn=v.prototype={constructor:v,init:function(e,n,r){var s,o,u,a;if(!e)return this;if(e.nodeType)return this.context=this[0]=e,this.length=1,this;if(typeof e=="string"){e.charAt(0)==="<"&&e.charAt(e.length-1)===">"&&e.length>=3?s=[null,e,null]:s=w.exec(e);if(s&&(s[1]||!n)){if(s[1])return n=n instanceof v?n[0]:n,a=n&&n.nodeType?n.ownerDocument||n:i,e=v.parseHTML(s[1],a,!0),E.test(s[1])&&v.isPlainObject(n)&&this.attr.call(e,n,!0),v.merge(this,e);o=i.getElementById(s[2]);if(o&&o.parentNode){if(o.id!==s[2])return r.find(e);this.length=1,this[0]=o}return this.context=i,this.selector=e,this}return!n||n.jquery?(n||r).find(e):this.constructor(n).find(e)}return v.isFunction(e)?r.ready(e):(e.selector!==t&&(this.selector=e.selector,this.context=e.context),v.makeArray(e,this))},selector:"",jquery:"1.8.3",length:0,size:function(){return this.length},toArray:function(){return l.call(this)},get:function(e){return e==null?this.toArray():e<0?this[this.length+e]:this[e]},pushStack:function(e,t,n){var r=v.merge(this.constructor(),e);return r.prevObject=this,r.context=this.context,t==="find"?r.selector=this.selector+(this.selector?" ":"")+n:t&&(r.selector=this.selector+"."+t+"("+n+")"),r},each:function(e,t){return v.each(this,e,t)},ready:function(e){return v.ready.promise().done(e),this},eq:function(e){return e=+e,e===-1?this.slice(e):this.slice(e,e+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(l.apply(this,arguments),"slice",l.call(arguments).join(","))},map:function(e){return this.pushStack(v.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:f,sort:[].sort,splice:[].splice},v.fn.init.prototype=v.fn,v.extend=v.fn.extend=function(){var e,n,r,i,s,o,u=arguments[0]||{},a=1,f=arguments.length,l=!1;typeof u=="boolean"&&(l=u,u=arguments[1]||{},a=2),typeof u!="object"&&!v.isFunction(u)&&(u={}),f===a&&(u=this,--a);for(;a<f;a++)if((e=arguments[a])!=null)for(n in e){r=u[n],i=e[n];if(u===i)continue;l&&i&&(v.isPlainObject(i)||(s=v.isArray(i)))?(s?(s=!1,o=r&&v.isArray(r)?r:[]):o=r&&v.isPlainObject(r)?r:{},u[n]=v.extend(l,o,i)):i!==t&&(u[n]=i)}return u},v.extend({noConflict:function(t){return e.$===v&&(e.$=a),t&&e.jQuery===v&&(e.jQuery=u),v},isReady:!1,readyWait:1,holdReady:function(e){e?v.readyWait++:v.ready(!0)},ready:function(e){if(e===!0?--v.readyWait:v.isReady)return;if(!i.body)return setTimeout(v.ready,1);v.isReady=!0;if(e!==!0&&--v.readyWait>0)return;r.resolveWith(i,[v]),v.fn.trigger&&v(i).trigger("ready").off("ready")},isFunction:function(e){return v.type(e)==="function"},isArray:Array.isArray||function(e){return v.type(e)==="array"},isWindow:function(e){return e!=null&&e==e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return e==null?String(e):O[h.call(e)]||"object"},isPlainObject:function(e){if(!e||v.type(e)!=="object"||e.nodeType||v.isWindow(e))return!1;try{if(e.constructor&&!p.call(e,"constructor")&&!p.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(n){return!1}var r;for(r in e);return r===t||p.call(e,r)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw new Error(e)},parseHTML:function(e,t,n){var r;return!e||typeof e!="string"?null:(typeof t=="boolean"&&(n=t,t=0),t=t||i,(r=E.exec(e))?[t.createElement(r[1])]:(r=v.buildFragment([e],t,n?null:[]),v.merge([],(r.cacheable?v.clone(r.fragment):r.fragment).childNodes)))},parseJSON:function(t){if(!t||typeof t!="string")return null;t=v.trim(t);if(e.JSON&&e.JSON.parse)return e.JSON.parse(t);if(S.test(t.replace(T,"@").replace(N,"]").replace(x,"")))return(new Function("return "+t))();v.error("Invalid JSON: "+t)},parseXML:function(n){var r,i;if(!n||typeof n!="string")return null;try{e.DOMParser?(i=new DOMParser,r=i.parseFromString(n,"text/xml")):(r=new ActiveXObject("Microsoft.XMLDOM"),r.async="false",r.loadXML(n))}catch(s){r=t}return(!r||!r.documentElement||r.getElementsByTagName("parsererror").length)&&v.error("Invalid XML: "+n),r},noop:function(){},globalEval:function(t){t&&g.test(t)&&(e.execScript||function(t){e.eval.call(e,t)})(t)},camelCase:function(e){return e.replace(C,"ms-").replace(k,L)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,n,r){var i,s=0,o=e.length,u=o===t||v.isFunction(e);if(r){if(u){for(i in e)if(n.apply(e[i],r)===!1)break}else for(;s<o;)if(n.apply(e[s++],r)===!1)break}else if(u){for(i in e)if(n.call(e[i],i,e[i])===!1)break}else for(;s<o;)if(n.call(e[s],s,e[s++])===!1)break;return e},trim:d&&!d.call("\ufeff\u00a0")?function(e){return e==null?"":d.call(e)}:function(e){return e==null?"":(e+"").replace(b,"")},makeArray:function(e,t){var n,r=t||[];return e!=null&&(n=v.type(e),e.length==null||n==="string"||n==="function"||n==="regexp"||v.isWindow(e)?f.call(r,e):v.merge(r,e)),r},inArray:function(e,t,n){var r;if(t){if(c)return c.call(t,e,n);r=t.length,n=n?n<0?Math.max(0,r+n):n:0;for(;n<r;n++)if(n in t&&t[n]===e)return n}return-1},merge:function(e,n){var r=n.length,i=e.length,s=0;if(typeof r=="number")for(;s<r;s++)e[i++]=n[s];else while(n[s]!==t)e[i++]=n[s++];return e.length=i,e},grep:function(e,t,n){var r,i=[],s=0,o=e.length;n=!!n;for(;s<o;s++)r=!!t(e[s],s),n!==r&&i.push(e[s]);return i},map:function(e,n,r){var i,s,o=[],u=0,a=e.length,f=e instanceof v||a!==t&&typeof a=="number"&&(a>0&&e[0]&&e[a-1]||a===0||v.isArray(e));if(f)for(;u<a;u++)i=n(e[u],u,r),i!=null&&(o[o.length]=i);else for(s in e)i=n(e[s],s,r),i!=null&&(o[o.length]=i);return o.concat.apply([],o)},guid:1,proxy:function(e,n){var r,i,s;return typeof n=="string"&&(r=e[n],n=e,e=r),v.isFunction(e)?(i=l.call(arguments,2),s=function(){return e.apply(n,i.concat(l.call(arguments)))},s.guid=e.guid=e.guid||v.guid++,s):t},access:function(e,n,r,i,s,o,u){var a,f=r==null,l=0,c=e.length;if(r&&typeof r=="object"){for(l in r)v.access(e,n,l,r[l],1,o,i);s=1}else if(i!==t){a=u===t&&v.isFunction(i),f&&(a?(a=n,n=function(e,t,n){return a.call(v(e),n)}):(n.call(e,i),n=null));if(n)for(;l<c;l++)n(e[l],r,a?i.call(e[l],l,n(e[l],r)):i,u);s=1}return s?e:f?n.call(e):c?n(e[0],r):o},now:function(){return(new Date).getTime()}}),v.ready.promise=function(t){if(!r){r=v.Deferred();if(i.readyState==="complete")setTimeout(v.ready,1);else if(i.addEventListener)i.addEventListener("DOMContentLoaded",A,!1),e.addEventListener("load",v.ready,!1);else{i.attachEvent("onreadystatechange",A),e.attachEvent("onload",v.ready);var n=!1;try{n=e.frameElement==null&&i.documentElement}catch(s){}n&&n.doScroll&&function o(){if(!v.isReady){try{n.doScroll("left")}catch(e){return setTimeout(o,50)}v.ready()}}()}}return r.promise(t)},v.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(e,t){O["[object "+t+"]"]=t.toLowerCase()}),n=v(i);var M={};v.Callbacks=function(e){e=typeof e=="string"?M[e]||_(e):v.extend({},e);var n,r,i,s,o,u,a=[],f=!e.once&&[],l=function(t){n=e.memory&&t,r=!0,u=s||0,s=0,o=a.length,i=!0;for(;a&&u<o;u++)if(a[u].apply(t[0],t[1])===!1&&e.stopOnFalse){n=!1;break}i=!1,a&&(f?f.length&&l(f.shift()):n?a=[]:c.disable())},c={add:function(){if(a){var t=a.length;(function r(t){v.each(t,function(t,n){var i=v.type(n);i==="function"?(!e.unique||!c.has(n))&&a.push(n):n&&n.length&&i!=="string"&&r(n)})})(arguments),i?o=a.length:n&&(s=t,l(n))}return this},remove:function(){return a&&v.each(arguments,function(e,t){var n;while((n=v.inArray(t,a,n))>-1)a.splice(n,1),i&&(n<=o&&o--,n<=u&&u--)}),this},has:function(e){return v.inArray(e,a)>-1},empty:function(){return a=[],this},disable:function(){return a=f=n=t,this},disabled:function(){return!a},lock:function(){return f=t,n||c.disable(),this},locked:function(){return!f},fireWith:function(e,t){return t=t||[],t=[e,t.slice?t.slice():t],a&&(!r||f)&&(i?f.push(t):l(t)),this},fire:function(){return c.fireWith(this,arguments),this},fired:function(){return!!r}};return c},v.extend({Deferred:function(e){var t=[["resolve","done",v.Callbacks("once memory"),"resolved"],["reject","fail",v.Callbacks("once memory"),"rejected"],["notify","progress",v.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return v.Deferred(function(n){v.each(t,function(t,r){var s=r[0],o=e[t];i[r[1]](v.isFunction(o)?function(){var e=o.apply(this,arguments);e&&v.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[s+"With"](this===i?n:this,[e])}:n[s])}),e=null}).promise()},promise:function(e){return e!=null?v.extend(e,r):r}},i={};return r.pipe=r.then,v.each(t,function(e,s){var o=s[2],u=s[3];r[s[1]]=o.add,u&&o.add(function(){n=u},t[e^1][2].disable,t[2][2].lock),i[s[0]]=o.fire,i[s[0]+"With"]=o.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=l.call(arguments),r=n.length,i=r!==1||e&&v.isFunction(e.promise)?r:0,s=i===1?e:v.Deferred(),o=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?l.call(arguments):r,n===u?s.notifyWith(t,n):--i||s.resolveWith(t,n)}},u,a,f;if(r>1){u=new Array(r),a=new Array(r),f=new Array(r);for(;t<r;t++)n[t]&&v.isFunction(n[t].promise)?n[t].promise().done(o(t,f,n)).fail(s.reject).progress(o(t,a,u)):--i}return i||s.resolveWith(f,n),s.promise()}}),v.support=function(){var t,n,r,s,o,u,a,f,l,c,h,p=i.createElement("div");p.setAttribute("className","t"),p.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",n=p.getElementsByTagName("*"),r=p.getElementsByTagName("a")[0];if(!n||!r||!n.length)return{};s=i.createElement("select"),o=s.appendChild(i.createElement("option")),u=p.getElementsByTagName("input")[0],r.style.cssText="top:1px;float:left;opacity:.5",t={leadingWhitespace:p.firstChild.nodeType===3,tbody:!p.getElementsByTagName("tbody").length,htmlSerialize:!!p.getElementsByTagName("link").length,style:/top/.test(r.getAttribute("style")),hrefNormalized:r.getAttribute("href")==="/a",opacity:/^0.5/.test(r.style.opacity),cssFloat:!!r.style.cssFloat,checkOn:u.value==="on",optSelected:o.selected,getSetAttribute:p.className!=="t",enctype:!!i.createElement("form").enctype,html5Clone:i.createElement("nav").cloneNode(!0).outerHTML!=="<:nav></:nav>",boxModel:i.compatMode==="CSS1Compat",submitBubbles:!0,changeBubbles:!0,focusinBubbles:!1,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,boxSizingReliable:!0,pixelPosition:!1},u.checked=!0,t.noCloneChecked=u.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!o.disabled;try{delete p.test}catch(d){t.deleteExpando=!1}!p.addEventListener&&p.attachEvent&&p.fireEvent&&(p.attachEvent("onclick",h=function(){t.noCloneEvent=!1}),p.cloneNode(!0).fireEvent("onclick"),p.detachEvent("onclick",h)),u=i.createElement("input"),u.value="t",u.setAttribute("type","radio"),t.radioValue=u.value==="t",u.setAttribute("checked","checked"),u.setAttribute("name","t"),p.appendChild(u),a=i.createDocumentFragment(),a.appendChild(p.lastChild),t.checkClone=a.cloneNode(!0).cloneNode(!0).lastChild.checked,t.appendChecked=u.checked,a.removeChild(u),a.appendChild(p);if(p.attachEvent)for(l in{submit:!0,change:!0,focusin:!0})f="on"+l,c=f in p,c||(p.setAttribute(f,"return;"),c=typeof p[f]=="function"),t[l+"Bubbles"]=c;return v(function(){var n,r,s,o,u="padding:0;margin:0;border:0;display:block;overflow:hidden;",a=i.getElementsByTagName("body")[0];if(!a)return;n=i.createElement("div"),n.style.cssText="visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px",a.insertBefore(n,a.firstChild),r=i.createElement("div"),n.appendChild(r),r.innerHTML="<table><tr><td></td><td>t</td></tr></table>",s=r.getElementsByTagName("td"),s[0].style.cssText="padding:0;margin:0;border:0;display:none",c=s[0].offsetHeight===0,s[0].style.display="",s[1].style.display="none",t.reliableHiddenOffsets=c&&s[0].offsetHeight===0,r.innerHTML="",r.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",t.boxSizing=r.offsetWidth===4,t.doesNotIncludeMarginInBodyOffset=a.offsetTop!==1,e.getComputedStyle&&(t.pixelPosition=(e.getComputedStyle(r,null)||{}).top!=="1%",t.boxSizingReliable=(e.getComputedStyle(r,null)||{width:"4px"}).width==="4px",o=i.createElement("div"),o.style.cssText=r.style.cssText=u,o.style.marginRight=o.style.width="0",r.style.width="1px",r.appendChild(o),t.reliableMarginRight=!parseFloat((e.getComputedStyle(o,null)||{}).marginRight)),typeof r.style.zoom!="undefined"&&(r.innerHTML="",r.style.cssText=u+"width:1px;padding:1px;display:inline;zoom:1",t.inlineBlockNeedsLayout=r.offsetWidth===3,r.style.display="block",r.style.overflow="visible",r.innerHTML="<div></div>",r.firstChild.style.width="5px",t.shrinkWrapBlocks=r.offsetWidth!==3,n.style.zoom=1),a.removeChild(n),n=r=s=o=null}),a.removeChild(p),n=r=s=o=u=a=p=null,t}();var D=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,P=/([A-Z])/g;v.extend({cache:{},deletedIds:[],uuid:0,expando:"jQuery"+(v.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(e){return e=e.nodeType?v.cache[e[v.expando]]:e[v.expando],!!e&&!B(e)},data:function(e,n,r,i){if(!v.acceptData(e))return;var s,o,u=v.expando,a=typeof n=="string",f=e.nodeType,l=f?v.cache:e,c=f?e[u]:e[u]&&u;if((!c||!l[c]||!i&&!l[c].data)&&a&&r===t)return;c||(f?e[u]=c=v.deletedIds.pop()||v.guid++:c=u),l[c]||(l[c]={},f||(l[c].toJSON=v.noop));if(typeof n=="object"||typeof n=="function")i?l[c]=v.extend(l[c],n):l[c].data=v.extend(l[c].data,n);return s=l[c],i||(s.data||(s.data={}),s=s.data),r!==t&&(s[v.camelCase(n)]=r),a?(o=s[n],o==null&&(o=s[v.camelCase(n)])):o=s,o},removeData:function(e,t,n){if(!v.acceptData(e))return;var r,i,s,o=e.nodeType,u=o?v.cache:e,a=o?e[v.expando]:v.expando;if(!u[a])return;if(t){r=n?u[a]:u[a].data;if(r){v.isArray(t)||(t in r?t=[t]:(t=v.camelCase(t),t in r?t=[t]:t=t.split(" ")));for(i=0,s=t.length;i<s;i++)delete r[t[i]];if(!(n?B:v.isEmptyObject)(r))return}}if(!n){delete u[a].data;if(!B(u[a]))return}o?v.cleanData([e],!0):v.support.deleteExpando||u!=u.window?delete u[a]:u[a]=null},_data:function(e,t,n){return v.data(e,t,n,!0)},acceptData:function(e){var t=e.nodeName&&v.noData[e.nodeName.toLowerCase()];return!t||t!==!0&&e.getAttribute("classid")===t}}),v.fn.extend({data:function(e,n){var r,i,s,o,u,a=this[0],f=0,l=null;if(e===t){if(this.length){l=v.data(a);if(a.nodeType===1&&!v._data(a,"parsedAttrs")){s=a.attributes;for(u=s.length;f<u;f++)o=s[f].name,o.indexOf("data-")||(o=v.camelCase(o.substring(5)),H(a,o,l[o]));v._data(a,"parsedAttrs",!0)}}return l}return typeof e=="object"?this.each(function(){v.data(this,e)}):(r=e.split(".",2),r[1]=r[1]?"."+r[1]:"",i=r[1]+"!",v.access(this,function(n){if(n===t)return l=this.triggerHandler("getData"+i,[r[0]]),l===t&&a&&(l=v.data(a,e),l=H(a,e,l)),l===t&&r[1]?this.data(r[0]):l;r[1]=n,this.each(function(){var t=v(this);t.triggerHandler("setData"+i,r),v.data(this,e,n),t.triggerHandler("changeData"+i,r)})},null,n,arguments.length>1,null,!1))},removeData:function(e){return this.each(function(){v.removeData(this,e)})}}),v.extend({queue:function(e,t,n){var r;if(e)return t=(t||"fx")+"queue",r=v._data(e,t),n&&(!r||v.isArray(n)?r=v._data(e,t,v.makeArray(n)):r.push(n)),r||[]},dequeue:function(e,t){t=t||"fx";var n=v.queue(e,t),r=n.length,i=n.shift(),s=v._queueHooks(e,t),o=function(){v.dequeue(e,t)};i==="inprogress"&&(i=n.shift(),r--),i&&(t==="fx"&&n.unshift("inprogress"),delete s.stop,i.call(e,o,s)),!r&&s&&s.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return v._data(e,n)||v._data(e,n,{empty:v.Callbacks("once memory").add(function(){v.removeData(e,t+"queue",!0),v.removeData(e,n,!0)})})}}),v.fn.extend({queue:function(e,n){var r=2;return typeof e!="string"&&(n=e,e="fx",r--),arguments.length<r?v.queue(this[0],e):n===t?this:this.each(function(){var t=v.queue(this,e,n);v._queueHooks(this,e),e==="fx"&&t[0]!=="inprogress"&&v.dequeue(this,e)})},dequeue:function(e){return this.each(function(){v.dequeue(this,e)})},delay:function(e,t){return e=v.fx?v.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,n){var r,i=1,s=v.Deferred(),o=this,u=this.length,a=function(){--i||s.resolveWith(o,[o])};typeof e!="string"&&(n=e,e=t),e=e||"fx";while(u--)r=v._data(o[u],e+"queueHooks"),r&&r.empty&&(i++,r.empty.add(a));return a(),s.promise(n)}});var j,F,I,q=/[\t\r\n]/g,R=/\r/g,U=/^(?:button|input)$/i,z=/^(?:button|input|object|select|textarea)$/i,W=/^a(?:rea|)$/i,X=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,V=v.support.getSetAttribute;v.fn.extend({attr:function(e,t){return v.access(this,v.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){v.removeAttr(this,e)})},prop:function(e,t){return v.access(this,v.prop,e,t,arguments.length>1)},removeProp:function(e){return e=v.propFix[e]||e,this.each(function(){try{this[e]=t,delete this[e]}catch(n){}})},addClass:function(e){var t,n,r,i,s,o,u;if(v.isFunction(e))return this.each(function(t){v(this).addClass(e.call(this,t,this.className))});if(e&&typeof e=="string"){t=e.split(y);for(n=0,r=this.length;n<r;n++){i=this[n];if(i.nodeType===1)if(!i.className&&t.length===1)i.className=e;else{s=" "+i.className+" ";for(o=0,u=t.length;o<u;o++)s.indexOf(" "+t[o]+" ")<0&&(s+=t[o]+" ");i.className=v.trim(s)}}}return this},removeClass:function(e){var n,r,i,s,o,u,a;if(v.isFunction(e))return this.each(function(t){v(this).removeClass(e.call(this,t,this.className))});if(e&&typeof e=="string"||e===t){n=(e||"").split(y);for(u=0,a=this.length;u<a;u++){i=this[u];if(i.nodeType===1&&i.className){r=(" "+i.className+" ").replace(q," ");for(s=0,o=n.length;s<o;s++)while(r.indexOf(" "+n[s]+" ")>=0)r=r.replace(" "+n[s]+" "," ");i.className=e?v.trim(r):""}}}return this},toggleClass:function(e,t){var n=typeof e,r=typeof t=="boolean";return v.isFunction(e)?this.each(function(n){v(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if(n==="string"){var i,s=0,o=v(this),u=t,a=e.split(y);while(i=a[s++])u=r?u:!o.hasClass(i),o[u?"addClass":"removeClass"](i)}else if(n==="undefined"||n==="boolean")this.className&&v._data(this,"__className__",this.className),this.className=this.className||e===!1?"":v._data(this,"__className__")||""})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;n<r;n++)if(this[n].nodeType===1&&(" "+this[n].className+" ").replace(q," ").indexOf(t)>=0)return!0;return!1},val:function(e){var n,r,i,s=this[0];if(!arguments.length){if(s)return n=v.valHooks[s.type]||v.valHooks[s.nodeName.toLowerCase()],n&&"get"in n&&(r=n.get(s,"value"))!==t?r:(r=s.value,typeof r=="string"?r.replace(R,""):r==null?"":r);return}return i=v.isFunction(e),this.each(function(r){var s,o=v(this);if(this.nodeType!==1)return;i?s=e.call(this,r,o.val()):s=e,s==null?s="":typeof s=="number"?s+="":v.isArray(s)&&(s=v.map(s,function(e){return e==null?"":e+""})),n=v.valHooks[this.type]||v.valHooks[this.nodeName.toLowerCase()];if(!n||!("set"in n)||n.set(this,s,"value")===t)this.value=s})}}),v.extend({valHooks:{option:{get:function(e){var t=e.attributes.value;return!t||t.specified?e.value:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,s=e.type==="select-one"||i<0,o=s?null:[],u=s?i+1:r.length,a=i<0?u:s?i:0;for(;a<u;a++){n=r[a];if((n.selected||a===i)&&(v.support.optDisabled?!n.disabled:n.getAttribute("disabled")===null)&&(!n.parentNode.disabled||!v.nodeName(n.parentNode,"optgroup"))){t=v(n).val();if(s)return t;o.push(t)}}return o},set:function(e,t){var n=v.makeArray(t);return v(e).find("option").each(function(){this.selected=v.inArray(v(this).val(),n)>=0}),n.length||(e.selectedIndex=-1),n}}},attrFn:{},attr:function(e,n,r,i){var s,o,u,a=e.nodeType;if(!e||a===3||a===8||a===2)return;if(i&&v.isFunction(v.fn[n]))return v(e)[n](r);if(typeof e.getAttribute=="undefined")return v.prop(e,n,r);u=a!==1||!v.isXMLDoc(e),u&&(n=n.toLowerCase(),o=v.attrHooks[n]||(X.test(n)?F:j));if(r!==t){if(r===null){v.removeAttr(e,n);return}return o&&"set"in o&&u&&(s=o.set(e,r,n))!==t?s:(e.setAttribute(n,r+""),r)}return o&&"get"in o&&u&&(s=o.get(e,n))!==null?s:(s=e.getAttribute(n),s===null?t:s)},removeAttr:function(e,t){var n,r,i,s,o=0;if(t&&e.nodeType===1){r=t.split(y);for(;o<r.length;o++)i=r[o],i&&(n=v.propFix[i]||i,s=X.test(i),s||v.attr(e,i,""),e.removeAttribute(V?i:n),s&&n in e&&(e[n]=!1))}},attrHooks:{type:{set:function(e,t){if(U.test(e.nodeName)&&e.parentNode)v.error("type property can't be changed");else if(!v.support.radioValue&&t==="radio"&&v.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}},value:{get:function(e,t){return j&&v.nodeName(e,"button")?j.get(e,t):t in e?e.value:null},set:function(e,t,n){if(j&&v.nodeName(e,"button"))return j.set(e,t,n);e.value=t}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(e,n,r){var i,s,o,u=e.nodeType;if(!e||u===3||u===8||u===2)return;return o=u!==1||!v.isXMLDoc(e),o&&(n=v.propFix[n]||n,s=v.propHooks[n]),r!==t?s&&"set"in s&&(i=s.set(e,r,n))!==t?i:e[n]=r:s&&"get"in s&&(i=s.get(e,n))!==null?i:e[n]},propHooks:{tabIndex:{get:function(e){var n=e.getAttributeNode("tabindex");return n&&n.specified?parseInt(n.value,10):z.test(e.nodeName)||W.test(e.nodeName)&&e.href?0:t}}}}),F={get:function(e,n){var r,i=v.prop(e,n);return i===!0||typeof i!="boolean"&&(r=e.getAttributeNode(n))&&r.nodeValue!==!1?n.toLowerCase():t},set:function(e,t,n){var r;return t===!1?v.removeAttr(e,n):(r=v.propFix[n]||n,r in e&&(e[r]=!0),e.setAttribute(n,n.toLowerCase())),n}},V||(I={name:!0,id:!0,coords:!0},j=v.valHooks.button={get:function(e,n){var r;return r=e.getAttributeNode(n),r&&(I[n]?r.value!=="":r.specified)?r.value:t},set:function(e,t,n){var r=e.getAttributeNode(n);return r||(r=i.createAttribute(n),e.setAttributeNode(r)),r.value=t+""}},v.each(["width","height"],function(e,t){v.attrHooks[t]=v.extend(v.attrHooks[t],{set:function(e,n){if(n==="")return e.setAttribute(t,"auto"),n}})}),v.attrHooks.contenteditable={get:j.get,set:function(e,t,n){t===""&&(t="false"),j.set(e,t,n)}}),v.support.hrefNormalized||v.each(["href","src","width","height"],function(e,n){v.attrHooks[n]=v.extend(v.attrHooks[n],{get:function(e){var r=e.getAttribute(n,2);return r===null?t:r}})}),v.support.style||(v.attrHooks.style={get:function(e){return e.style.cssText.toLowerCase()||t},set:function(e,t){return e.style.cssText=t+""}}),v.support.optSelected||(v.propHooks.selected=v.extend(v.propHooks.selected,{get:function(e){var t=e.parentNode;return t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex),null}})),v.support.enctype||(v.propFix.enctype="encoding"),v.support.checkOn||v.each(["radio","checkbox"],function(){v.valHooks[this]={get:function(e){return e.getAttribute("value")===null?"on":e.value}}}),v.each(["radio","checkbox"],function(){v.valHooks[this]=v.extend(v.valHooks[this],{set:function(e,t){if(v.isArray(t))return e.checked=v.inArray(v(e).val(),t)>=0}})});var $=/^(?:textarea|input|select)$/i,J=/^([^\.]*|)(?:\.(.+)|)$/,K=/(?:^|\s)hover(\.\S+|)\b/,Q=/^key/,G=/^(?:mouse|contextmenu)|click/,Y=/^(?:focusinfocus|focusoutblur)$/,Z=function(e){return v.event.special.hover?e:e.replace(K,"mouseenter$1 mouseleave$1")};v.event={add:function(e,n,r,i,s){var o,u,a,f,l,c,h,p,d,m,g;if(e.nodeType===3||e.nodeType===8||!n||!r||!(o=v._data(e)))return;r.handler&&(d=r,r=d.handler,s=d.selector),r.guid||(r.guid=v.guid++),a=o.events,a||(o.events=a={}),u=o.handle,u||(o.handle=u=function(e){return typeof v=="undefined"||!!e&&v.event.triggered===e.type?t:v.event.dispatch.apply(u.elem,arguments)},u.elem=e),n=v.trim(Z(n)).split(" ");for(f=0;f<n.length;f++){l=J.exec(n[f])||[],c=l[1],h=(l[2]||"").split(".").sort(),g=v.event.special[c]||{},c=(s?g.delegateType:g.bindType)||c,g=v.event.special[c]||{},p=v.extend({type:c,origType:l[1],data:i,handler:r,guid:r.guid,selector:s,needsContext:s&&v.expr.match.needsContext.test(s),namespace:h.join(".")},d),m=a[c];if(!m){m=a[c]=[],m.delegateCount=0;if(!g.setup||g.setup.call(e,i,h,u)===!1)e.addEventListener?e.addEventListener(c,u,!1):e.attachEvent&&e.attachEvent("on"+c,u)}g.add&&(g.add.call(e,p),p.handler.guid||(p.handler.guid=r.guid)),s?m.splice(m.delegateCount++,0,p):m.push(p),v.event.global[c]=!0}e=null},global:{},remove:function(e,t,n,r,i){var s,o,u,a,f,l,c,h,p,d,m,g=v.hasData(e)&&v._data(e);if(!g||!(h=g.events))return;t=v.trim(Z(t||"")).split(" ");for(s=0;s<t.length;s++){o=J.exec(t[s])||[],u=a=o[1],f=o[2];if(!u){for(u in h)v.event.remove(e,u+t[s],n,r,!0);continue}p=v.event.special[u]||{},u=(r?p.delegateType:p.bindType)||u,d=h[u]||[],l=d.length,f=f?new RegExp("(^|\\.)"+f.split(".").sort().join("\\.(?:.*\\.|)")+"(\\.|$)"):null;for(c=0;c<d.length;c++)m=d[c],(i||a===m.origType)&&(!n||n.guid===m.guid)&&(!f||f.test(m.namespace))&&(!r||r===m.selector||r==="**"&&m.selector)&&(d.splice(c--,1),m.selector&&d.delegateCount--,p.remove&&p.remove.call(e,m));d.length===0&&l!==d.length&&((!p.teardown||p.teardown.call(e,f,g.handle)===!1)&&v.removeEvent(e,u,g.handle),delete h[u])}v.isEmptyObject(h)&&(delete g.handle,v.removeData(e,"events",!0))},customEvent:{getData:!0,setData:!0,changeData:!0},trigger:function(n,r,s,o){if(!s||s.nodeType!==3&&s.nodeType!==8){var u,a,f,l,c,h,p,d,m,g,y=n.type||n,b=[];if(Y.test(y+v.event.triggered))return;y.indexOf("!")>=0&&(y=y.slice(0,-1),a=!0),y.indexOf(".")>=0&&(b=y.split("."),y=b.shift(),b.sort());if((!s||v.event.customEvent[y])&&!v.event.global[y])return;n=typeof n=="object"?n[v.expando]?n:new v.Event(y,n):new v.Event(y),n.type=y,n.isTrigger=!0,n.exclusive=a,n.namespace=b.join("."),n.namespace_re=n.namespace?new RegExp("(^|\\.)"+b.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,h=y.indexOf(":")<0?"on"+y:"";if(!s){u=v.cache;for(f in u)u[f].events&&u[f].events[y]&&v.event.trigger(n,r,u[f].handle.elem,!0);return}n.result=t,n.target||(n.target=s),r=r!=null?v.makeArray(r):[],r.unshift(n),p=v.event.special[y]||{};if(p.trigger&&p.trigger.apply(s,r)===!1)return;m=[[s,p.bindType||y]];if(!o&&!p.noBubble&&!v.isWindow(s)){g=p.delegateType||y,l=Y.test(g+y)?s:s.parentNode;for(c=s;l;l=l.parentNode)m.push([l,g]),c=l;c===(s.ownerDocument||i)&&m.push([c.defaultView||c.parentWindow||e,g])}for(f=0;f<m.length&&!n.isPropagationStopped();f++)l=m[f][0],n.type=m[f][1],d=(v._data(l,"events")||{})[n.type]&&v._data(l,"handle"),d&&d.apply(l,r),d=h&&l[h],d&&v.acceptData(l)&&d.apply&&d.apply(l,r)===!1&&n.preventDefault();return n.type=y,!o&&!n.isDefaultPrevented()&&(!p._default||p._default.apply(s.ownerDocument,r)===!1)&&(y!=="click"||!v.nodeName(s,"a"))&&v.acceptData(s)&&h&&s[y]&&(y!=="focus"&&y!=="blur"||n.target.offsetWidth!==0)&&!v.isWindow(s)&&(c=s[h],c&&(s[h]=null),v.event.triggered=y,s[y](),v.event.triggered=t,c&&(s[h]=c)),n.result}return},dispatch:function(n){n=v.event.fix(n||e.event);var r,i,s,o,u,a,f,c,h,p,d=(v._data(this,"events")||{})[n.type]||[],m=d.delegateCount,g=l.call(arguments),y=!n.exclusive&&!n.namespace,b=v.event.special[n.type]||{},w=[];g[0]=n,n.delegateTarget=this;if(b.preDispatch&&b.preDispatch.call(this,n)===!1)return;if(m&&(!n.button||n.type!=="click"))for(s=n.target;s!=this;s=s.parentNode||this)if(s.disabled!==!0||n.type!=="click"){u={},f=[];for(r=0;r<m;r++)c=d[r],h=c.selector,u[h]===t&&(u[h]=c.needsContext?v(h,this).index(s)>=0:v.find(h,this,null,[s]).length),u[h]&&f.push(c);f.length&&w.push({elem:s,matches:f})}d.length>m&&w.push({elem:this,matches:d.slice(m)});for(r=0;r<w.length&&!n.isPropagationStopped();r++){a=w[r],n.currentTarget=a.elem;for(i=0;i<a.matches.length&&!n.isImmediatePropagationStopped();i++){c=a.matches[i];if(y||!n.namespace&&!c.namespace||n.namespace_re&&n.namespace_re.test(c.namespace))n.data=c.data,n.handleObj=c,o=((v.event.special[c.origType]||{}).handle||c.handler).apply(a.elem,g),o!==t&&(n.result=o,o===!1&&(n.preventDefault(),n.stopPropagation()))}}return b.postDispatch&&b.postDispatch.call(this,n),n.result},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return e.which==null&&(e.which=t.charCode!=null?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,n){var r,s,o,u=n.button,a=n.fromElement;return e.pageX==null&&n.clientX!=null&&(r=e.target.ownerDocument||i,s=r.documentElement,o=r.body,e.pageX=n.clientX+(s&&s.scrollLeft||o&&o.scrollLeft||0)-(s&&s.clientLeft||o&&o.clientLeft||0),e.pageY=n.clientY+(s&&s.scrollTop||o&&o.scrollTop||0)-(s&&s.clientTop||o&&o.clientTop||0)),!e.relatedTarget&&a&&(e.relatedTarget=a===e.target?n.toElement:a),!e.which&&u!==t&&(e.which=u&1?1:u&2?3:u&4?2:0),e}},fix:function(e){if(e[v.expando])return e;var t,n,r=e,s=v.event.fixHooks[e.type]||{},o=s.props?this.props.concat(s.props):this.props;e=v.Event(r);for(t=o.length;t;)n=o[--t],e[n]=r[n];return e.target||(e.target=r.srcElement||i),e.target.nodeType===3&&(e.target=e.target.parentNode),e.metaKey=!!e.metaKey,s.filter?s.filter(e,r):e},special:{load:{noBubble:!0},focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(e,t,n){v.isWindow(this)&&(this.onbeforeunload=n)},teardown:function(e,t){this.onbeforeunload===t&&(this.onbeforeunload=null)}}},simulate:function(e,t,n,r){var i=v.extend(new v.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?v.event.trigger(i,null,t):v.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},v.event.handle=v.event.dispatch,v.removeEvent=i.removeEventListener?function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)}:function(e,t,n){var r="on"+t;e.detachEvent&&(typeof e[r]=="undefined"&&(e[r]=null),e.detachEvent(r,n))},v.Event=function(e,t){if(!(this instanceof v.Event))return new v.Event(e,t);e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.returnValue===!1||e.getPreventDefault&&e.getPreventDefault()?tt:et):this.type=e,t&&v.extend(this,t),this.timeStamp=e&&e.timeStamp||v.now(),this[v.expando]=!0},v.Event.prototype={preventDefault:function(){this.isDefaultPrevented=tt;var e=this.originalEvent;if(!e)return;e.preventDefault?e.preventDefault():e.returnValue=!1},stopPropagation:function(){this.isPropagationStopped=tt;var e=this.originalEvent;if(!e)return;e.stopPropagation&&e.stopPropagation(),e.cancelBubble=!0},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=tt,this.stopPropagation()},isDefaultPrevented:et,isPropagationStopped:et,isImmediatePropagationStopped:et},v.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){v.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,s=e.handleObj,o=s.selector;if(!i||i!==r&&!v.contains(r,i))e.type=s.origType,n=s.handler.apply(this,arguments),e.type=t;return n}}}),v.support.submitBubbles||(v.event.special.submit={setup:function(){if(v.nodeName(this,"form"))return!1;v.event.add(this,"click._submit keypress._submit",function(e){var n=e.target,r=v.nodeName(n,"input")||v.nodeName(n,"button")?n.form:t;r&&!v._data(r,"_submit_attached")&&(v.event.add(r,"submit._submit",function(e){e._submit_bubble=!0}),v._data(r,"_submit_attached",!0))})},postDispatch:function(e){e._submit_bubble&&(delete e._submit_bubble,this.parentNode&&!e.isTrigger&&v.event.simulate("submit",this.parentNode,e,!0))},teardown:function(){if(v.nodeName(this,"form"))return!1;v.event.remove(this,"._submit")}}),v.support.changeBubbles||(v.event.special.change={setup:function(){if($.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio")v.event.add(this,"propertychange._change",function(e){e.originalEvent.propertyName==="checked"&&(this._just_changed=!0)}),v.event.add(this,"click._change",function(e){this._just_changed&&!e.isTrigger&&(this._just_changed=!1),v.event.simulate("change",this,e,!0)});return!1}v.event.add(this,"beforeactivate._change",function(e){var t=e.target;$.test(t.nodeName)&&!v._data(t,"_change_attached")&&(v.event.add(t,"change._change",function(e){this.parentNode&&!e.isSimulated&&!e.isTrigger&&v.event.simulate("change",this.parentNode,e,!0)}),v._data(t,"_change_attached",!0))})},handle:function(e){var t=e.target;if(this!==t||e.isSimulated||e.isTrigger||t.type!=="radio"&&t.type!=="checkbox")return e.handleObj.handler.apply(this,arguments)},teardown:function(){return v.event.remove(this,"._change"),!$.test(this.nodeName)}}),v.support.focusinBubbles||v.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){v.event.simulate(t,e.target,v.event.fix(e),!0)};v.event.special[t]={setup:function(){n++===0&&i.addEventListener(e,r,!0)},teardown:function(){--n===0&&i.removeEventListener(e,r,!0)}}}),v.fn.extend({on:function(e,n,r,i,s){var o,u;if(typeof e=="object"){typeof n!="string"&&(r=r||n,n=t);for(u in e)this.on(u,n,r,e[u],s);return this}r==null&&i==null?(i=n,r=n=t):i==null&&(typeof n=="string"?(i=r,r=t):(i=r,r=n,n=t));if(i===!1)i=et;else if(!i)return this;return s===1&&(o=i,i=function(e){return v().off(e),o.apply(this,arguments)},i.guid=o.guid||(o.guid=v.guid++)),this.each(function(){v.event.add(this,e,i,r,n)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,n,r){var i,s;if(e&&e.preventDefault&&e.handleObj)return i=e.handleObj,v(e.delegateTarget).off(i.namespace?i.origType+"."+i.namespace:i.origType,i.selector,i.handler),this;if(typeof e=="object"){for(s in e)this.off(s,n,e[s]);return this}if(n===!1||typeof n=="function")r=n,n=t;return r===!1&&(r=et),this.each(function(){v.event.remove(this,e,r,n)})},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},live:function(e,t,n){return v(this.context).on(e,this.selector,t,n),this},die:function(e,t){return v(this.context).off(e,this.selector||"**",t),this},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return arguments.length===1?this.off(e,"**"):this.off(t,e||"**",n)},trigger:function(e,t){return this.each(function(){v.event.trigger(e,t,this)})},triggerHandler:function(e,t){if(this[0])return v.event.trigger(e,t,this[0],!0)},toggle:function(e){var t=arguments,n=e.guid||v.guid++,r=0,i=function(n){var i=(v._data(this,"lastToggle"+e.guid)||0)%r;return v._data(this,"lastToggle"+e.guid,i+1),n.preventDefault(),t[i].apply(this,arguments)||!1};i.guid=n;while(r<t.length)t[r++].guid=n;return this.click(i)},hover:function(e,t){return this.mouseenter(e).mouseleave(t||e)}}),v.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){v.fn[t]=function(e,n){return n==null&&(n=e,e=null),arguments.length>0?this.on(t,null,e,n):this.trigger(t)},Q.test(t)&&(v.event.fixHooks[t]=v.event.keyHooks),G.test(t)&&(v.event.fixHooks[t]=v.event.mouseHooks)}),function(e,t){function nt(e,t,n,r){n=n||[],t=t||g;var i,s,a,f,l=t.nodeType;if(!e||typeof e!="string")return n;if(l!==1&&l!==9)return[];a=o(t);if(!a&&!r)if(i=R.exec(e))if(f=i[1]){if(l===9){s=t.getElementById(f);if(!s||!s.parentNode)return n;if(s.id===f)return n.push(s),n}else if(t.ownerDocument&&(s=t.ownerDocument.getElementById(f))&&u(t,s)&&s.id===f)return n.push(s),n}else{if(i[2])return S.apply(n,x.call(t.getElementsByTagName(e),0)),n;if((f=i[3])&&Z&&t.getElementsByClassName)return S.apply(n,x.call(t.getElementsByClassName(f),0)),n}return vt(e.replace(j,"$1"),t,n,r,a)}function rt(e){return function(t){var n=t.nodeName.toLowerCase();return n==="input"&&t.type===e}}function it(e){return function(t){var n=t.nodeName.toLowerCase();return(n==="input"||n==="button")&&t.type===e}}function st(e){return N(function(t){return t=+t,N(function(n,r){var i,s=e([],n.length,t),o=s.length;while(o--)n[i=s[o]]&&(n[i]=!(r[i]=n[i]))})})}function ot(e,t,n){if(e===t)return n;var r=e.nextSibling;while(r){if(r===t)return-1;r=r.nextSibling}return 1}function ut(e,t){var n,r,s,o,u,a,f,l=L[d][e+" "];if(l)return t?0:l.slice(0);u=e,a=[],f=i.preFilter;while(u){if(!n||(r=F.exec(u)))r&&(u=u.slice(r[0].length)||u),a.push(s=[]);n=!1;if(r=I.exec(u))s.push(n=new m(r.shift())),u=u.slice(n.length),n.type=r[0].replace(j," ");for(o in i.filter)(r=J[o].exec(u))&&(!f[o]||(r=f[o](r)))&&(s.push(n=new m(r.shift())),u=u.slice(n.length),n.type=o,n.matches=r);if(!n)break}return t?u.length:u?nt.error(e):L(e,a).slice(0)}function at(e,t,r){var i=t.dir,s=r&&t.dir==="parentNode",o=w++;return t.first?function(t,n,r){while(t=t[i])if(s||t.nodeType===1)return e(t,n,r)}:function(t,r,u){if(!u){var a,f=b+" "+o+" ",l=f+n;while(t=t[i])if(s||t.nodeType===1){if((a=t[d])===l)return t.sizset;if(typeof a=="string"&&a.indexOf(f)===0){if(t.sizset)return t}else{t[d]=l;if(e(t,r,u))return t.sizset=!0,t;t.sizset=!1}}}else while(t=t[i])if(s||t.nodeType===1)if(e(t,r,u))return t}}function ft(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function lt(e,t,n,r,i){var s,o=[],u=0,a=e.length,f=t!=null;for(;u<a;u++)if(s=e[u])if(!n||n(s,r,i))o.push(s),f&&t.push(u);return o}function ct(e,t,n,r,i,s){return r&&!r[d]&&(r=ct(r)),i&&!i[d]&&(i=ct(i,s)),N(function(s,o,u,a){var f,l,c,h=[],p=[],d=o.length,v=s||dt(t||"*",u.nodeType?[u]:u,[]),m=e&&(s||!t)?lt(v,h,e,u,a):v,g=n?i||(s?e:d||r)?[]:o:m;n&&n(m,g,u,a);if(r){f=lt(g,p),r(f,[],u,a),l=f.length;while(l--)if(c=f[l])g[p[l]]=!(m[p[l]]=c)}if(s){if(i||e){if(i){f=[],l=g.length;while(l--)(c=g[l])&&f.push(m[l]=c);i(null,g=[],f,a)}l=g.length;while(l--)(c=g[l])&&(f=i?T.call(s,c):h[l])>-1&&(s[f]=!(o[f]=c))}}else g=lt(g===o?g.splice(d,g.length):g),i?i(null,o,g,a):S.apply(o,g)})}function ht(e){var t,n,r,s=e.length,o=i.relative[e[0].type],u=o||i.relative[" "],a=o?1:0,f=at(function(e){return e===t},u,!0),l=at(function(e){return T.call(t,e)>-1},u,!0),h=[function(e,n,r){return!o&&(r||n!==c)||((t=n).nodeType?f(e,n,r):l(e,n,r))}];for(;a<s;a++)if(n=i.relative[e[a].type])h=[at(ft(h),n)];else{n=i.filter[e[a].type].apply(null,e[a].matches);if(n[d]){r=++a;for(;r<s;r++)if(i.relative[e[r].type])break;return ct(a>1&&ft(h),a>1&&e.slice(0,a-1).join("").replace(j,"$1"),n,a<r&&ht(e.slice(a,r)),r<s&&ht(e=e.slice(r)),r<s&&e.join(""))}h.push(n)}return ft(h)}function pt(e,t){var r=t.length>0,s=e.length>0,o=function(u,a,f,l,h){var p,d,v,m=[],y=0,w="0",x=u&&[],T=h!=null,N=c,C=u||s&&i.find.TAG("*",h&&a.parentNode||a),k=b+=N==null?1:Math.E;T&&(c=a!==g&&a,n=o.el);for(;(p=C[w])!=null;w++){if(s&&p){for(d=0;v=e[d];d++)if(v(p,a,f)){l.push(p);break}T&&(b=k,n=++o.el)}r&&((p=!v&&p)&&y--,u&&x.push(p))}y+=w;if(r&&w!==y){for(d=0;v=t[d];d++)v(x,m,a,f);if(u){if(y>0)while(w--)!x[w]&&!m[w]&&(m[w]=E.call(l));m=lt(m)}S.apply(l,m),T&&!u&&m.length>0&&y+t.length>1&&nt.uniqueSort(l)}return T&&(b=k,c=N),x};return o.el=0,r?N(o):o}function dt(e,t,n){var r=0,i=t.length;for(;r<i;r++)nt(e,t[r],n);return n}function vt(e,t,n,r,s){var o,u,f,l,c,h=ut(e),p=h.length;if(!r&&h.length===1){u=h[0]=h[0].slice(0);if(u.length>2&&(f=u[0]).type==="ID"&&t.nodeType===9&&!s&&i.relative[u[1].type]){t=i.find.ID(f.matches[0].replace($,""),t,s)[0];if(!t)return n;e=e.slice(u.shift().length)}for(o=J.POS.test(e)?-1:u.length-1;o>=0;o--){f=u[o];if(i.relative[l=f.type])break;if(c=i.find[l])if(r=c(f.matches[0].replace($,""),z.test(u[0].type)&&t.parentNode||t,s)){u.splice(o,1),e=r.length&&u.join("");if(!e)return S.apply(n,x.call(r,0)),n;break}}}return a(e,h)(r,t,s,n,z.test(e)),n}function mt(){}var n,r,i,s,o,u,a,f,l,c,h=!0,p="undefined",d=("sizcache"+Math.random()).replace(".",""),m=String,g=e.document,y=g.documentElement,b=0,w=0,E=[].pop,S=[].push,x=[].slice,T=[].indexOf||function(e){var t=0,n=this.length;for(;t<n;t++)if(this[t]===e)return t;return-1},N=function(e,t){return e[d]=t==null||t,e},C=function(){var e={},t=[];return N(function(n,r){return t.push(n)>i.cacheLength&&delete e[t.shift()],e[n+" "]=r},e)},k=C(),L=C(),A=C(),O="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+",_=M.replace("w","w#"),D="([*^$|!~]?=)",P="\\["+O+"*("+M+")"+O+"*(?:"+D+O+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+_+")|)|)"+O+"*\\]",H=":("+M+")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:"+P+")|[^:]|\\\\.)*|.*))\\)|)",B=":(even|odd|eq|gt|lt|nth|first|last)(?:\\("+O+"*((?:-\\d)?\\d*)"+O+"*\\)|)(?=[^-]|$)",j=new RegExp("^"+O+"+|((?:^|[^\\\\])(?:\\\\.)*)"+O+"+$","g"),F=new RegExp("^"+O+"*,"+O+"*"),I=new RegExp("^"+O+"*([\\x20\\t\\r\\n\\f>+~])"+O+"*"),q=new RegExp(H),R=/^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,U=/^:not/,z=/[\x20\t\r\n\f]*[+~]/,W=/:not\($/,X=/h\d/i,V=/input|select|textarea|button/i,$=/\\(?!\\)/g,J={ID:new RegExp("^#("+M+")"),CLASS:new RegExp("^\\.("+M+")"),NAME:new RegExp("^\\[name=['\"]?("+M+")['\"]?\\]"),TAG:new RegExp("^("+M.replace("w","w*")+")"),ATTR:new RegExp("^"+P),PSEUDO:new RegExp("^"+H),POS:new RegExp(B,"i"),CHILD:new RegExp("^:(only|nth|first|last)-child(?:\\("+O+"*(even|odd|(([+-]|)(\\d*)n|)"+O+"*(?:([+-]|)"+O+"*(\\d+)|))"+O+"*\\)|)","i"),needsContext:new RegExp("^"+O+"*[>+~]|"+B,"i")},K=function(e){var t=g.createElement("div");try{return e(t)}catch(n){return!1}finally{t=null}},Q=K(function(e){return e.appendChild(g.createComment("")),!e.getElementsByTagName("*").length}),G=K(function(e){return e.innerHTML="<a href='#'></a>",e.firstChild&&typeof e.firstChild.getAttribute!==p&&e.firstChild.getAttribute("href")==="#"}),Y=K(function(e){e.innerHTML="<select></select>";var t=typeof e.lastChild.getAttribute("multiple");return t!=="boolean"&&t!=="string"}),Z=K(function(e){return e.innerHTML="<div class='hidden e'></div><div class='hidden'></div>",!e.getElementsByClassName||!e.getElementsByClassName("e").length?!1:(e.lastChild.className="e",e.getElementsByClassName("e").length===2)}),et=K(function(e){e.id=d+0,e.innerHTML="<a name='"+d+"'></a><div name='"+d+"'></div>",y.insertBefore(e,y.firstChild);var t=g.getElementsByName&&g.getElementsByName(d).length===2+g.getElementsByName(d+0).length;return r=!g.getElementById(d),y.removeChild(e),t});try{x.call(y.childNodes,0)[0].nodeType}catch(tt){x=function(e){var t,n=[];for(;t=this[e];e++)n.push(t);return n}}nt.matches=function(e,t){return nt(e,null,null,t)},nt.matchesSelector=function(e,t){return nt(t,null,null,[e]).length>0},s=nt.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(i===1||i===9||i===11){if(typeof e.textContent=="string")return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=s(e)}else if(i===3||i===4)return e.nodeValue}else for(;t=e[r];r++)n+=s(t);return n},o=nt.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?t.nodeName!=="HTML":!1},u=nt.contains=y.contains?function(e,t){var n=e.nodeType===9?e.documentElement:e,r=t&&t.parentNode;return e===r||!!(r&&r.nodeType===1&&n.contains&&n.contains(r))}:y.compareDocumentPosition?function(e,t){return t&&!!(e.compareDocumentPosition(t)&16)}:function(e,t){while(t=t.parentNode)if(t===e)return!0;return!1},nt.attr=function(e,t){var n,r=o(e);return r||(t=t.toLowerCase()),(n=i.attrHandle[t])?n(e):r||Y?e.getAttribute(t):(n=e.getAttributeNode(t),n?typeof e[t]=="boolean"?e[t]?t:null:n.specified?n.value:null:null)},i=nt.selectors={cacheLength:50,createPseudo:N,match:J,attrHandle:G?{}:{href:function(e){return e.getAttribute("href",2)},type:function(e){return e.getAttribute("type")}},find:{ID:r?function(e,t,n){if(typeof t.getElementById!==p&&!n){var r=t.getElementById(e);return r&&r.parentNode?[r]:[]}}:function(e,n,r){if(typeof n.getElementById!==p&&!r){var i=n.getElementById(e);return i?i.id===e||typeof i.getAttributeNode!==p&&i.getAttributeNode("id").value===e?[i]:t:[]}},TAG:Q?function(e,t){if(typeof t.getElementsByTagName!==p)return t.getElementsByTagName(e)}:function(e,t){var n=t.getElementsByTagName(e);if(e==="*"){var r,i=[],s=0;for(;r=n[s];s++)r.nodeType===1&&i.push(r);return i}return n},NAME:et&&function(e,t){if(typeof t.getElementsByName!==p)return t.getElementsByName(name)},CLASS:Z&&function(e,t,n){if(typeof t.getElementsByClassName!==p&&!n)return t.getElementsByClassName(e)}},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace($,""),e[3]=(e[4]||e[5]||"").replace($,""),e[2]==="~="&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),e[1]==="nth"?(e[2]||nt.error(e[0]),e[3]=+(e[3]?e[4]+(e[5]||1):2*(e[2]==="even"||e[2]==="odd")),e[4]=+(e[6]+e[7]||e[2]==="odd")):e[2]&&nt.error(e[0]),e},PSEUDO:function(e){var t,n;if(J.CHILD.test(e[0]))return null;if(e[3])e[2]=e[3];else if(t=e[4])q.test(t)&&(n=ut(t,!0))&&(n=t.indexOf(")",t.length-n)-t.length)&&(t=t.slice(0,n),e[0]=e[0].slice(0,n)),e[2]=t;return e.slice(0,3)}},filter:{ID:r?function(e){return e=e.replace($,""),function(t){return t.getAttribute("id")===e}}:function(e){return e=e.replace($,""),function(t){var n=typeof t.getAttributeNode!==p&&t.getAttributeNode("id");return n&&n.value===e}},TAG:function(e){return e==="*"?function(){return!0}:(e=e.replace($,"").toLowerCase(),function(t){return t.nodeName&&t.nodeName.toLowerCase()===e})},CLASS:function(e){var t=k[d][e+" "];return t||(t=new RegExp("(^|"+O+")"+e+"("+O+"|$)"))&&k(e,function(e){return t.test(e.className||typeof e.getAttribute!==p&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r,i){var s=nt.attr(r,e);return s==null?t==="!=":t?(s+="",t==="="?s===n:t==="!="?s!==n:t==="^="?n&&s.indexOf(n)===0:t==="*="?n&&s.indexOf(n)>-1:t==="$="?n&&s.substr(s.length-n.length)===n:t==="~="?(" "+s+" ").indexOf(n)>-1:t==="|="?s===n||s.substr(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r){return e==="nth"?function(e){var t,i,s=e.parentNode;if(n===1&&r===0)return!0;if(s){i=0;for(t=s.firstChild;t;t=t.nextSibling)if(t.nodeType===1){i++;if(e===t)break}}return i-=r,i===n||i%n===0&&i/n>=0}:function(t){var n=t;switch(e){case"only":case"first":while(n=n.previousSibling)if(n.nodeType===1)return!1;if(e==="first")return!0;n=t;case"last":while(n=n.nextSibling)if(n.nodeType===1)return!1;return!0}}},PSEUDO:function(e,t){var n,r=i.pseudos[e]||i.setFilters[e.toLowerCase()]||nt.error("unsupported pseudo: "+e);return r[d]?r(t):r.length>1?(n=[e,e,"",t],i.setFilters.hasOwnProperty(e.toLowerCase())?N(function(e,n){var i,s=r(e,t),o=s.length;while(o--)i=T.call(e,s[o]),e[i]=!(n[i]=s[o])}):function(e){return r(e,0,n)}):r}},pseudos:{not:N(function(e){var t=[],n=[],r=a(e.replace(j,"$1"));return r[d]?N(function(e,t,n,i){var s,o=r(e,null,i,[]),u=e.length;while(u--)if(s=o[u])e[u]=!(t[u]=s)}):function(e,i,s){return t[0]=e,r(t,null,s,n),!n.pop()}}),has:N(function(e){return function(t){return nt(e,t).length>0}}),contains:N(function(e){return function(t){return(t.textContent||t.innerText||s(t)).indexOf(e)>-1}}),enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return t==="input"&&!!e.checked||t==="option"&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},parent:function(e){return!i.pseudos.empty(e)},empty:function(e){var t;e=e.firstChild;while(e){if(e.nodeName>"@"||(t=e.nodeType)===3||t===4)return!1;e=e.nextSibling}return!0},header:function(e){return X.test(e.nodeName)},text:function(e){var t,n;return e.nodeName.toLowerCase()==="input"&&(t=e.type)==="text"&&((n=e.getAttribute("type"))==null||n.toLowerCase()===t)},radio:rt("radio"),checkbox:rt("checkbox"),file:rt("file"),password:rt("password"),image:rt("image"),submit:it("submit"),reset:it("reset"),button:function(e){var t=e.nodeName.toLowerCase();return t==="input"&&e.type==="button"||t==="button"},input:function(e){return V.test(e.nodeName)},focus:function(e){var t=e.ownerDocument;return e===t.activeElement&&(!t.hasFocus||t.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},active:function(e){return e===e.ownerDocument.activeElement},first:st(function(){return[0]}),last:st(function(e,t){return[t-1]}),eq:st(function(e,t,n){return[n<0?n+t:n]}),even:st(function(e,t){for(var n=0;n<t;n+=2)e.push(n);return e}),odd:st(function(e,t){for(var n=1;n<t;n+=2)e.push(n);return e}),lt:st(function(e,t,n){for(var r=n<0?n+t:n;--r>=0;)e.push(r);return e}),gt:st(function(e,t,n){for(var r=n<0?n+t:n;++r<t;)e.push(r);return e})}},f=y.compareDocumentPosition?function(e,t){return e===t?(l=!0,0):(!e.compareDocumentPosition||!t.compareDocumentPosition?e.compareDocumentPosition:e.compareDocumentPosition(t)&4)?-1:1}:function(e,t){if(e===t)return l=!0,0;if(e.sourceIndex&&t.sourceIndex)return e.sourceIndex-t.sourceIndex;var n,r,i=[],s=[],o=e.parentNode,u=t.parentNode,a=o;if(o===u)return ot(e,t);if(!o)return-1;if(!u)return 1;while(a)i.unshift(a),a=a.parentNode;a=u;while(a)s.unshift(a),a=a.parentNode;n=i.length,r=s.length;for(var f=0;f<n&&f<r;f++)if(i[f]!==s[f])return ot(i[f],s[f]);return f===n?ot(e,s[f],-1):ot(i[f],t,1)},[0,0].sort(f),h=!l,nt.uniqueSort=function(e){var t,n=[],r=1,i=0;l=h,e.sort(f);if(l){for(;t=e[r];r++)t===e[r-1]&&(i=n.push(r));while(i--)e.splice(n[i],1)}return e},nt.error=function(e){throw new Error("Syntax error, unrecognized expression: "+e)},a=nt.compile=function(e,t){var n,r=[],i=[],s=A[d][e+" "];if(!s){t||(t=ut(e)),n=t.length;while(n--)s=ht(t[n]),s[d]?r.push(s):i.push(s);s=A(e,pt(i,r))}return s},g.querySelectorAll&&function(){var e,t=vt,n=/'|\\/g,r=/\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,i=[":focus"],s=[":active"],u=y.matchesSelector||y.mozMatchesSelector||y.webkitMatchesSelector||y.oMatchesSelector||y.msMatchesSelector;K(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||i.push("\\["+O+"*(?:checked|disabled|ismap|multiple|readonly|selected|value)"),e.querySelectorAll(":checked").length||i.push(":checked")}),K(function(e){e.innerHTML="<p test=''></p>",e.querySelectorAll("[test^='']").length&&i.push("[*^$]="+O+"*(?:\"\"|'')"),e.innerHTML="<input type='hidden'/>",e.querySelectorAll(":enabled").length||i.push(":enabled",":disabled")}),i=new RegExp(i.join("|")),vt=function(e,r,s,o,u){if(!o&&!u&&!i.test(e)){var a,f,l=!0,c=d,h=r,p=r.nodeType===9&&e;if(r.nodeType===1&&r.nodeName.toLowerCase()!=="object"){a=ut(e),(l=r.getAttribute("id"))?c=l.replace(n,"\\$&"):r.setAttribute("id",c),c="[id='"+c+"'] ",f=a.length;while(f--)a[f]=c+a[f].join("");h=z.test(e)&&r.parentNode||r,p=a.join(",")}if(p)try{return S.apply(s,x.call(h.querySelectorAll(p),0)),s}catch(v){}finally{l||r.removeAttribute("id")}}return t(e,r,s,o,u)},u&&(K(function(t){e=u.call(t,"div");try{u.call(t,"[test!='']:sizzle"),s.push("!=",H)}catch(n){}}),s=new RegExp(s.join("|")),nt.matchesSelector=function(t,n){n=n.replace(r,"='$1']");if(!o(t)&&!s.test(n)&&!i.test(n))try{var a=u.call(t,n);if(a||e||t.document&&t.document.nodeType!==11)return a}catch(f){}return nt(n,null,null,[t]).length>0})}(),i.pseudos.nth=i.pseudos.eq,i.filters=mt.prototype=i.pseudos,i.setFilters=new mt,nt.attr=v.attr,v.find=nt,v.expr=nt.selectors,v.expr[":"]=v.expr.pseudos,v.unique=nt.uniqueSort,v.text=nt.getText,v.isXMLDoc=nt.isXML,v.contains=nt.contains}(e);var nt=/Until$/,rt=/^(?:parents|prev(?:Until|All))/,it=/^.[^:#\[\.,]*$/,st=v.expr.match.needsContext,ot={children:!0,contents:!0,next:!0,prev:!0};v.fn.extend({find:function(e){var t,n,r,i,s,o,u=this;if(typeof e!="string")return v(e).filter(function(){for(t=0,n=u.length;t<n;t++)if(v.contains(u[t],this))return!0});o=this.pushStack("","find",e);for(t=0,n=this.length;t<n;t++){r=o.length,v.find(e,this[t],o);if(t>0)for(i=r;i<o.length;i++)for(s=0;s<r;s++)if(o[s]===o[i]){o.splice(i--,1);break}}return o},has:function(e){var t,n=v(e,this),r=n.length;return this.filter(function(){for(t=0;t<r;t++)if(v.contains(this,n[t]))return!0})},not:function(e){return this.pushStack(ft(this,e,!1),"not",e)},filter:function(e){return this.pushStack(ft(this,e,!0),"filter",e)},is:function(e){return!!e&&(typeof e=="string"?st.test(e)?v(e,this.context).index(this[0])>=0:v.filter(e,this).length>0:this.filter(e).length>0)},closest:function(e,t){var n,r=0,i=this.length,s=[],o=st.test(e)||typeof e!="string"?v(e,t||this.context):0;for(;r<i;r++){n=this[r];while(n&&n.ownerDocument&&n!==t&&n.nodeType!==11){if(o?o.index(n)>-1:v.find.matchesSelector(n,e)){s.push(n);break}n=n.parentNode}}return s=s.length>1?v.unique(s):s,this.pushStack(s,"closest",e)},index:function(e){return e?typeof e=="string"?v.inArray(this[0],v(e)):v.inArray(e.jquery?e[0]:e,this):this[0]&&this[0].parentNode?this.prevAll().length:-1},add:function(e,t){var n=typeof e=="string"?v(e,t):v.makeArray(e&&e.nodeType?[e]:e),r=v.merge(this.get(),n);return this.pushStack(ut(n[0])||ut(r[0])?r:v.unique(r))},addBack:function(e){return this.add(e==null?this.prevObject:this.prevObject.filter(e))}}),v.fn.andSelf=v.fn.addBack,v.each({parent:function(e){var t=e.parentNode;return t&&t.nodeType!==11?t:null},parents:function(e){return v.dir(e,"parentNode")},parentsUntil:function(e,t,n){return v.dir(e,"parentNode",n)},next:function(e){return at(e,"nextSibling")},prev:function(e){return at(e,"previousSibling")},nextAll:function(e){return v.dir(e,"nextSibling")},prevAll:function(e){return v.dir(e,"previousSibling")},nextUntil:function(e,t,n){return v.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return v.dir(e,"previousSibling",n)},siblings:function(e){return v.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return v.sibling(e.firstChild)},contents:function(e){return v.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:v.merge([],e.childNodes)}},function(e,t){v.fn[e]=function(n,r){var i=v.map(this,t,n);return nt.test(e)||(r=n),r&&typeof r=="string"&&(i=v.filter(r,i)),i=this.length>1&&!ot[e]?v.unique(i):i,this.length>1&&rt.test(e)&&(i=i.reverse()),this.pushStack(i,e,l.call(arguments).join(","))}}),v.extend({filter:function(e,t,n){return n&&(e=":not("+e+")"),t.length===1?v.find.matchesSelector(t[0],e)?[t[0]]:[]:v.find.matches(e,t)},dir:function(e,n,r){var i=[],s=e[n];while(s&&s.nodeType!==9&&(r===t||s.nodeType!==1||!v(s).is(r)))s.nodeType===1&&i.push(s),s=s[n];return i},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)e.nodeType===1&&e!==t&&n.push(e);return n}});var ct="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",ht=/ jQuery\d+="(?:null|\d+)"/g,pt=/^\s+/,dt=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,vt=/<([\w:]+)/,mt=/<tbody/i,gt=/<|&#?\w+;/,yt=/<(?:script|style|link)/i,bt=/<(?:script|object|embed|option|style)/i,wt=new RegExp("<(?:"+ct+")[\\s/>]","i"),Et=/^(?:checkbox|radio)$/,St=/checked\s*(?:[^=]|=\s*.checked.)/i,xt=/\/(java|ecma)script/i,Tt=/^\s*<!(?:\[CDATA\[|\-\-)|[\]\-]{2}>\s*$/g,Nt={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]},Ct=lt(i),kt=Ct.appendChild(i.createElement("div"));Nt.optgroup=Nt.option,Nt.tbody=Nt.tfoot=Nt.colgroup=Nt.caption=Nt.thead,Nt.th=Nt.td,v.support.htmlSerialize||(Nt._default=[1,"X<div>","</div>"]),v.fn.extend({text:function(e){return v.access(this,function(e){return e===t?v.text(this):this.empty().append((this[0]&&this[0].ownerDocument||i).createTextNode(e))},null,e,arguments.length)},wrapAll:function(e){if(v.isFunction(e))return this.each(function(t){v(this).wrapAll(e.call(this,t))});if(this[0]){var t=v(e,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstChild&&e.firstChild.nodeType===1)e=e.firstChild;return e}).append(this)}return this},wrapInner:function(e){return v.isFunction(e)?this.each(function(t){v(this).wrapInner(e.call(this,t))}):this.each(function(){var t=v(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=v.isFunction(e);return this.each(function(n){v(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){v.nodeName(this,"body")||v(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(e){(this.nodeType===1||this.nodeType===11)&&this.appendChild(e)})},prepend:function(){return this.domManip(arguments,!0,function(e){(this.nodeType===1||this.nodeType===11)&&this.insertBefore(e,this.firstChild)})},before:function(){if(!ut(this[0]))return this.domManip(arguments,!1,function(e){this.parentNode.insertBefore(e,this)});if(arguments.length){var e=v.clean(arguments);return this.pushStack(v.merge(e,this),"before",this.selector)}},after:function(){if(!ut(this[0]))return this.domManip(arguments,!1,function(e){this.parentNode.insertBefore(e,this.nextSibling)});if(arguments.length){var e=v.clean(arguments);return this.pushStack(v.merge(this,e),"after",this.selector)}},remove:function(e,t){var n,r=0;for(;(n=this[r])!=null;r++)if(!e||v.filter(e,[n]).length)!t&&n.nodeType===1&&(v.cleanData(n.getElementsByTagName("*")),v.cleanData([n])),n.parentNode&&n.parentNode.removeChild(n);return this},empty:function(){var e,t=0;for(;(e=this[t])!=null;t++){e.nodeType===1&&v.cleanData(e.getElementsByTagName("*"));while(e.firstChild)e.removeChild(e.firstChild)}return this},clone:function(e,t){return e=e==null?!1:e,t=t==null?e:t,this.map(function(){return v.clone(this,e,t)})},html:function(e){return v.access(this,function(e){var n=this[0]||{},r=0,i=this.length;if(e===t)return n.nodeType===1?n.innerHTML.replace(ht,""):t;if(typeof e=="string"&&!yt.test(e)&&(v.support.htmlSerialize||!wt.test(e))&&(v.support.leadingWhitespace||!pt.test(e))&&!Nt[(vt.exec(e)||["",""])[1].toLowerCase()]){e=e.replace(dt,"<$1></$2>");try{for(;r<i;r++)n=this[r]||{},n.nodeType===1&&(v.cleanData(n.getElementsByTagName("*")),n.innerHTML=e);n=0}catch(s){}}n&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(e){return ut(this[0])?this.length?this.pushStack(v(v.isFunction(e)?e():e),"replaceWith",e):this:v.isFunction(e)?this.each(function(t){var n=v(this),r=n.html();n.replaceWith(e.call(this,t,r))}):(typeof e!="string"&&(e=v(e).detach()),this.each(function(){var t=this.nextSibling,n=this.parentNode;v(this).remove(),t?v(t).before(e):v(n).append(e)}))},detach:function(e){return this.remove(e,!0)},domManip:function(e,n,r){e=[].concat.apply([],e);var i,s,o,u,a=0,f=e[0],l=[],c=this.length;if(!v.support.checkClone&&c>1&&typeof f=="string"&&St.test(f))return this.each(function(){v(this).domManip(e,n,r)});if(v.isFunction(f))return this.each(function(i){var s=v(this);e[0]=f.call(this,i,n?s.html():t),s.domManip(e,n,r)});if(this[0]){i=v.buildFragment(e,this,l),o=i.fragment,s=o.firstChild,o.childNodes.length===1&&(o=s);if(s){n=n&&v.nodeName(s,"tr");for(u=i.cacheable||c-1;a<c;a++)r.call(n&&v.nodeName(this[a],"table")?Lt(this[a],"tbody"):this[a],a===u?o:v.clone(o,!0,!0))}o=s=null,l.length&&v.each(l,function(e,t){t.src?v.ajax?v.ajax({url:t.src,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0}):v.error("no ajax"):v.globalEval((t.text||t.textContent||t.innerHTML||"").replace(Tt,"")),t.parentNode&&t.parentNode.removeChild(t)})}return this}}),v.buildFragment=function(e,n,r){var s,o,u,a=e[0];return n=n||i,n=!n.nodeType&&n[0]||n,n=n.ownerDocument||n,e.length===1&&typeof a=="string"&&a.length<512&&n===i&&a.charAt(0)==="<"&&!bt.test(a)&&(v.support.checkClone||!St.test(a))&&(v.support.html5Clone||!wt.test(a))&&(o=!0,s=v.fragments[a],u=s!==t),s||(s=n.createDocumentFragment(),v.clean(e,n,s,r),o&&(v.fragments[a]=u&&s)),{fragment:s,cacheable:o}},v.fragments={},v.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){v.fn[e]=function(n){var r,i=0,s=[],o=v(n),u=o.length,a=this.length===1&&this[0].parentNode;if((a==null||a&&a.nodeType===11&&a.childNodes.length===1)&&u===1)return o[t](this[0]),this;for(;i<u;i++)r=(i>0?this.clone(!0):this).get(),v(o[i])[t](r),s=s.concat(r);return this.pushStack(s,e,o.selector)}}),v.extend({clone:function(e,t,n){var r,i,s,o;v.support.html5Clone||v.isXMLDoc(e)||!wt.test("<"+e.nodeName+">")?o=e.cloneNode(!0):(kt.innerHTML=e.outerHTML,kt.removeChild(o=kt.firstChild));if((!v.support.noCloneEvent||!v.support.noCloneChecked)&&(e.nodeType===1||e.nodeType===11)&&!v.isXMLDoc(e)){Ot(e,o),r=Mt(e),i=Mt(o);for(s=0;r[s];++s)i[s]&&Ot(r[s],i[s])}if(t){At(e,o);if(n){r=Mt(e),i=Mt(o);for(s=0;r[s];++s)At(r[s],i[s])}}return r=i=null,o},clean:function(e,t,n,r){var s,o,u,a,f,l,c,h,p,d,m,g,y=t===i&&Ct,b=[];if(!t||typeof t.createDocumentFragment=="undefined")t=i;for(s=0;(u=e[s])!=null;s++){typeof u=="number"&&(u+="");if(!u)continue;if(typeof u=="string")if(!gt.test(u))u=t.createTextNode(u);else{y=y||lt(t),c=t.createElement("div"),y.appendChild(c),u=u.replace(dt,"<$1></$2>"),a=(vt.exec(u)||["",""])[1].toLowerCase(),f=Nt[a]||Nt._default,l=f[0],c.innerHTML=f[1]+u+f[2];while(l--)c=c.lastChild;if(!v.support.tbody){h=mt.test(u),p=a==="table"&&!h?c.firstChild&&c.firstChild.childNodes:f[1]==="<table>"&&!h?c.childNodes:[];for(o=p.length-1;o>=0;--o)v.nodeName(p[o],"tbody")&&!p[o].childNodes.length&&p[o].parentNode.removeChild(p[o])}!v.support.leadingWhitespace&&pt.test(u)&&c.insertBefore(t.createTextNode(pt.exec(u)[0]),c.firstChild),u=c.childNodes,c.parentNode.removeChild(c)}u.nodeType?b.push(u):v.merge(b,u)}c&&(u=c=y=null);if(!v.support.appendChecked)for(s=0;(u=b[s])!=null;s++)v.nodeName(u,"input")?_t(u):typeof u.getElementsByTagName!="undefined"&&v.grep(u.getElementsByTagName("input"),_t);if(n){m=function(e){if(!e.type||xt.test(e.type))return r?r.push(e.parentNode?e.parentNode.removeChild(e):e):n.appendChild(e)};for(s=0;(u=b[s])!=null;s++)if(!v.nodeName(u,"script")||!m(u))n.appendChild(u),typeof u.getElementsByTagName!="undefined"&&(g=v.grep(v.merge([],u.getElementsByTagName("script")),m),b.splice.apply(b,[s+1,0].concat(g)),s+=g.length)}return b},cleanData:function(e,t){var n,r,i,s,o=0,u=v.expando,a=v.cache,f=v.support.deleteExpando,l=v.event.special;for(;(i=e[o])!=null;o++)if(t||v.acceptData(i)){r=i[u],n=r&&a[r];if(n){if(n.events)for(s in n.events)l[s]?v.event.remove(i,s):v.removeEvent(i,s,n.handle);a[r]&&(delete a[r],f?delete i[u]:i.removeAttribute?i.removeAttribute(u):i[u]=null,v.deletedIds.push(r))}}}}),function(){var e,t;v.uaMatch=function(e){e=e.toLowerCase();var t=/(chrome)[ \/]([\w.]+)/.exec(e)||/(webkit)[ \/]([\w.]+)/.exec(e)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(e)||/(msie) ([\w.]+)/.exec(e)||e.indexOf("compatible")<0&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(e)||[];return{browser:t[1]||"",version:t[2]||"0"}},e=v.uaMatch(o.userAgent),t={},e.browser&&(t[e.browser]=!0,t.version=e.version),t.chrome?t.webkit=!0:t.webkit&&(t.safari=!0),v.browser=t,v.sub=function(){function e(t,n){return new e.fn.init(t,n)}v.extend(!0,e,this),e.superclass=this,e.fn=e.prototype=this(),e.fn.constructor=e,e.sub=this.sub,e.fn.init=function(r,i){return i&&i instanceof v&&!(i instanceof e)&&(i=e(i)),v.fn.init.call(this,r,i,t)},e.fn.init.prototype=e.fn;var t=e(i);return e}}();var Dt,Pt,Ht,Bt=/alpha\([^)]*\)/i,jt=/opacity=([^)]*)/,Ft=/^(top|right|bottom|left)$/,It=/^(none|table(?!-c[ea]).+)/,qt=/^margin/,Rt=new RegExp("^("+m+")(.*)$","i"),Ut=new RegExp("^("+m+")(?!px)[a-z%]+$","i"),zt=new RegExp("^([-+])=("+m+")","i"),Wt={BODY:"block"},Xt={position:"absolute",visibility:"hidden",display:"block"},Vt={letterSpacing:0,fontWeight:400},$t=["Top","Right","Bottom","Left"],Jt=["Webkit","O","Moz","ms"],Kt=v.fn.toggle;v.fn.extend({css:function(e,n){return v.access(this,function(e,n,r){return r!==t?v.style(e,n,r):v.css(e,n)},e,n,arguments.length>1)},show:function(){return Yt(this,!0)},hide:function(){return Yt(this)},toggle:function(e,t){var n=typeof e=="boolean";return v.isFunction(e)&&v.isFunction(t)?Kt.apply(this,arguments):this.each(function(){(n?e:Gt(this))?v(this).show():v(this).hide()})}}),v.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=Dt(e,"opacity");return n===""?"1":n}}}},cssNumber:{fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":v.support.cssFloat?"cssFloat":"styleFloat"},style:function(e,n,r,i){if(!e||e.nodeType===3||e.nodeType===8||!e.style)return;var s,o,u,a=v.camelCase(n),f=e.style;n=v.cssProps[a]||(v.cssProps[a]=Qt(f,a)),u=v.cssHooks[n]||v.cssHooks[a];if(r===t)return u&&"get"in u&&(s=u.get(e,!1,i))!==t?s:f[n];o=typeof r,o==="string"&&(s=zt.exec(r))&&(r=(s[1]+1)*s[2]+parseFloat(v.css(e,n)),o="number");if(r==null||o==="number"&&isNaN(r))return;o==="number"&&!v.cssNumber[a]&&(r+="px");if(!u||!("set"in u)||(r=u.set(e,r,i))!==t)try{f[n]=r}catch(l){}},css:function(e,n,r,i){var s,o,u,a=v.camelCase(n);return n=v.cssProps[a]||(v.cssProps[a]=Qt(e.style,a)),u=v.cssHooks[n]||v.cssHooks[a],u&&"get"in u&&(s=u.get(e,!0,i)),s===t&&(s=Dt(e,n)),s==="normal"&&n in Vt&&(s=Vt[n]),r||i!==t?(o=parseFloat(s),r||v.isNumeric(o)?o||0:s):s},swap:function(e,t,n){var r,i,s={};for(i in t)s[i]=e.style[i],e.style[i]=t[i];r=n.call(e);for(i in t)e.style[i]=s[i];return r}}),e.getComputedStyle?Dt=function(t,n){var r,i,s,o,u=e.getComputedStyle(t,null),a=t.style;return u&&(r=u.getPropertyValue(n)||u[n],r===""&&!v.contains(t.ownerDocument,t)&&(r=v.style(t,n)),Ut.test(r)&&qt.test(n)&&(i=a.width,s=a.minWidth,o=a.maxWidth,a.minWidth=a.maxWidth=a.width=r,r=u.width,a.width=i,a.minWidth=s,a.maxWidth=o)),r}:i.documentElement.currentStyle&&(Dt=function(e,t){var n,r,i=e.currentStyle&&e.currentStyle[t],s=e.style;return i==null&&s&&s[t]&&(i=s[t]),Ut.test(i)&&!Ft.test(t)&&(n=s.left,r=e.runtimeStyle&&e.runtimeStyle.left,r&&(e.runtimeStyle.left=e.currentStyle.left),s.left=t==="fontSize"?"1em":i,i=s.pixelLeft+"px",s.left=n,r&&(e.runtimeStyle.left=r)),i===""?"auto":i}),v.each(["height","width"],function(e,t){v.cssHooks[t]={get:function(e,n,r){if(n)return e.offsetWidth===0&&It.test(Dt(e,"display"))?v.swap(e,Xt,function(){return tn(e,t,r)}):tn(e,t,r)},set:function(e,n,r){return Zt(e,n,r?en(e,t,r,v.support.boxSizing&&v.css(e,"boxSizing")==="border-box"):0)}}}),v.support.opacity||(v.cssHooks.opacity={get:function(e,t){return jt.test((t&&e.currentStyle?e.currentStyle.filter:e.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":t?"1":""},set:function(e,t){var n=e.style,r=e.currentStyle,i=v.isNumeric(t)?"alpha(opacity="+t*100+")":"",s=r&&r.filter||n.filter||"";n.zoom=1;if(t>=1&&v.trim(s.replace(Bt,""))===""&&n.removeAttribute){n.removeAttribute("filter");if(r&&!r.filter)return}n.filter=Bt.test(s)?s.replace(Bt,i):s+" "+i}}),v(function(){v.support.reliableMarginRight||(v.cssHooks.marginRight={get:function(e,t){return v.swap(e,{display:"inline-block"},function(){if(t)return Dt(e,"marginRight")})}}),!v.support.pixelPosition&&v.fn.position&&v.each(["top","left"],function(e,t){v.cssHooks[t]={get:function(e,n){if(n){var r=Dt(e,t);return Ut.test(r)?v(e).position()[t]+"px":r}}}})}),v.expr&&v.expr.filters&&(v.expr.filters.hidden=function(e){return e.offsetWidth===0&&e.offsetHeight===0||!v.support.reliableHiddenOffsets&&(e.style&&e.style.display||Dt(e,"display"))==="none"},v.expr.filters.visible=function(e){return!v.expr.filters.hidden(e)}),v.each({margin:"",padding:"",border:"Width"},function(e,t){v.cssHooks[e+t]={expand:function(n){var r,i=typeof n=="string"?n.split(" "):[n],s={};for(r=0;r<4;r++)s[e+$t[r]+t]=i[r]||i[r-2]||i[0];return s}},qt.test(e)||(v.cssHooks[e+t].set=Zt)});var rn=/%20/g,sn=/\[\]$/,on=/\r?\n/g,un=/^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,an=/^(?:select|textarea)/i;v.fn.extend({serialize:function(){return v.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?v.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||an.test(this.nodeName)||un.test(this.type))}).map(function(e,t){var n=v(this).val();return n==null?null:v.isArray(n)?v.map(n,function(e,n){return{name:t.name,value:e.replace(on,"\r\n")}}):{name:t.name,value:n.replace(on,"\r\n")}}).get()}}),v.param=function(e,n){var r,i=[],s=function(e,t){t=v.isFunction(t)?t():t==null?"":t,i[i.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};n===t&&(n=v.ajaxSettings&&v.ajaxSettings.traditional);if(v.isArray(e)||e.jquery&&!v.isPlainObject(e))v.each(e,function(){s(this.name,this.value)});else for(r in e)fn(r,e[r],n,s);return i.join("&").replace(rn,"+")};var ln,cn,hn=/#.*$/,pn=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,dn=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,vn=/^(?:GET|HEAD)$/,mn=/^\/\//,gn=/\?/,yn=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,bn=/([?&])_=[^&]*/,wn=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,En=v.fn.load,Sn={},xn={},Tn=["*/"]+["*"];try{cn=s.href}catch(Nn){cn=i.createElement("a"),cn.href="",cn=cn.href}ln=wn.exec(cn.toLowerCase())||[],v.fn.load=function(e,n,r){if(typeof e!="string"&&En)return En.apply(this,arguments);if(!this.length)return this;var i,s,o,u=this,a=e.indexOf(" ");return a>=0&&(i=e.slice(a,e.length),e=e.slice(0,a)),v.isFunction(n)?(r=n,n=t):n&&typeof n=="object"&&(s="POST"),v.ajax({url:e,type:s,dataType:"html",data:n,complete:function(e,t){r&&u.each(r,o||[e.responseText,t,e])}}).done(function(e){o=arguments,u.html(i?v("<div>").append(e.replace(yn,"")).find(i):e)}),this},v.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(e,t){v.fn[t]=function(e){return this.on(t,e)}}),v.each(["get","post"],function(e,n){v[n]=function(e,r,i,s){return v.isFunction(r)&&(s=s||i,i=r,r=t),v.ajax({type:n,url:e,data:r,success:i,dataType:s})}}),v.extend({getScript:function(e,n){return v.get(e,t,n,"script")},getJSON:function(e,t,n){return v.get(e,t,n,"json")},ajaxSetup:function(e,t){return t?Ln(e,v.ajaxSettings):(t=e,e=v.ajaxSettings),Ln(e,t),e},ajaxSettings:{url:cn,isLocal:dn.test(ln[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded; charset=UTF-8",processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":Tn},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":e.String,"text html":!0,"text json":v.parseJSON,"text xml":v.parseXML},flatOptions:{context:!0,url:!0}},ajaxPrefilter:Cn(Sn),ajaxTransport:Cn(xn),ajax:function(e,n){function T(e,n,s,a){var l,y,b,w,S,T=n;if(E===2)return;E=2,u&&clearTimeout(u),o=t,i=a||"",x.readyState=e>0?4:0,s&&(w=An(c,x,s));if(e>=200&&e<300||e===304)c.ifModified&&(S=x.getResponseHeader("Last-Modified"),S&&(v.lastModified[r]=S),S=x.getResponseHeader("Etag"),S&&(v.etag[r]=S)),e===304?(T="notmodified",l=!0):(l=On(c,w),T=l.state,y=l.data,b=l.error,l=!b);else{b=T;if(!T||e)T="error",e<0&&(e=0)}x.status=e,x.statusText=(n||T)+"",l?d.resolveWith(h,[y,T,x]):d.rejectWith(h,[x,T,b]),x.statusCode(g),g=t,f&&p.trigger("ajax"+(l?"Success":"Error"),[x,c,l?y:b]),m.fireWith(h,[x,T]),f&&(p.trigger("ajaxComplete",[x,c]),--v.active||v.event.trigger("ajaxStop"))}typeof e=="object"&&(n=e,e=t),n=n||{};var r,i,s,o,u,a,f,l,c=v.ajaxSetup({},n),h=c.context||c,p=h!==c&&(h.nodeType||h instanceof v)?v(h):v.event,d=v.Deferred(),m=v.Callbacks("once memory"),g=c.statusCode||{},b={},w={},E=0,S="canceled",x={readyState:0,setRequestHeader:function(e,t){if(!E){var n=e.toLowerCase();e=w[n]=w[n]||e,b[e]=t}return this},getAllResponseHeaders:function(){return E===2?i:null},getResponseHeader:function(e){var n;if(E===2){if(!s){s={};while(n=pn.exec(i))s[n[1].toLowerCase()]=n[2]}n=s[e.toLowerCase()]}return n===t?null:n},overrideMimeType:function(e){return E||(c.mimeType=e),this},abort:function(e){return e=e||S,o&&o.abort(e),T(0,e),this}};d.promise(x),x.success=x.done,x.error=x.fail,x.complete=m.add,x.statusCode=function(e){if(e){var t;if(E<2)for(t in e)g[t]=[g[t],e[t]];else t=e[x.status],x.always(t)}return this},c.url=((e||c.url)+"").replace(hn,"").replace(mn,ln[1]+"//"),c.dataTypes=v.trim(c.dataType||"*").toLowerCase().split(y),c.crossDomain==null&&(a=wn.exec(c.url.toLowerCase()),c.crossDomain=!(!a||a[1]===ln[1]&&a[2]===ln[2]&&(a[3]||(a[1]==="http:"?80:443))==(ln[3]||(ln[1]==="http:"?80:443)))),c.data&&c.processData&&typeof c.data!="string"&&(c.data=v.param(c.data,c.traditional)),kn(Sn,c,n,x);if(E===2)return x;f=c.global,c.type=c.type.toUpperCase(),c.hasContent=!vn.test(c.type),f&&v.active++===0&&v.event.trigger("ajaxStart");if(!c.hasContent){c.data&&(c.url+=(gn.test(c.url)?"&":"?")+c.data,delete c.data),r=c.url;if(c.cache===!1){var N=v.now(),C=c.url.replace(bn,"$1_="+N);c.url=C+(C===c.url?(gn.test(c.url)?"&":"?")+"_="+N:"")}}(c.data&&c.hasContent&&c.contentType!==!1||n.contentType)&&x.setRequestHeader("Content-Type",c.contentType),c.ifModified&&(r=r||c.url,v.lastModified[r]&&x.setRequestHeader("If-Modified-Since",v.lastModified[r]),v.etag[r]&&x.setRequestHeader("If-None-Match",v.etag[r])),x.setRequestHeader("Accept",c.dataTypes[0]&&c.accepts[c.dataTypes[0]]?c.accepts[c.dataTypes[0]]+(c.dataTypes[0]!=="*"?", "+Tn+"; q=0.01":""):c.accepts["*"]);for(l in c.headers)x.setRequestHeader(l,c.headers[l]);if(!c.beforeSend||c.beforeSend.call(h,x,c)!==!1&&E!==2){S="abort";for(l in{success:1,error:1,complete:1})x[l](c[l]);o=kn(xn,c,n,x);if(!o)T(-1,"No Transport");else{x.readyState=1,f&&p.trigger("ajaxSend",[x,c]),c.async&&c.timeout>0&&(u=setTimeout(function(){x.abort("timeout")},c.timeout));try{E=1,o.send(b,T)}catch(k){if(!(E<2))throw k;T(-1,k)}}return x}return x.abort()},active:0,lastModified:{},etag:{}});var Mn=[],_n=/\?/,Dn=/(=)\?(?=&|$)|\?\?/,Pn=v.now();v.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=Mn.pop()||v.expando+"_"+Pn++;return this[e]=!0,e}}),v.ajaxPrefilter("json jsonp",function(n,r,i){var s,o,u,a=n.data,f=n.url,l=n.jsonp!==!1,c=l&&Dn.test(f),h=l&&!c&&typeof a=="string"&&!(n.contentType||"").indexOf("application/x-www-form-urlencoded")&&Dn.test(a);if(n.dataTypes[0]==="jsonp"||c||h)return s=n.jsonpCallback=v.isFunction(n.jsonpCallback)?n.jsonpCallback():n.jsonpCallback,o=e[s],c?n.url=f.replace(Dn,"$1"+s):h?n.data=a.replace(Dn,"$1"+s):l&&(n.url+=(_n.test(f)?"&":"?")+n.jsonp+"="+s),n.converters["script json"]=function(){return u||v.error(s+" was not called"),u[0]},n.dataTypes[0]="json",e[s]=function(){u=arguments},i.always(function(){e[s]=o,n[s]&&(n.jsonpCallback=r.jsonpCallback,Mn.push(s)),u&&v.isFunction(o)&&o(u[0]),u=o=t}),"script"}),v.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(e){return v.globalEval(e),e}}}),v.ajaxPrefilter("script",function(e){e.cache===t&&(e.cache=!1),e.crossDomain&&(e.type="GET",e.global=!1)}),v.ajaxTransport("script",function(e){if(e.crossDomain){var n,r=i.head||i.getElementsByTagName("head")[0]||i.documentElement;return{send:function(s,o){n=i.createElement("script"),n.async="async",e.scriptCharset&&(n.charset=e.scriptCharset),n.src=e.url,n.onload=n.onreadystatechange=function(e,i){if(i||!n.readyState||/loaded|complete/.test(n.readyState))n.onload=n.onreadystatechange=null,r&&n.parentNode&&r.removeChild(n),n=t,i||o(200,"success")},r.insertBefore(n,r.firstChild)},abort:function(){n&&n.onload(0,1)}}}});var Hn,Bn=e.ActiveXObject?function(){for(var e in Hn)Hn[e](0,1)}:!1,jn=0;v.ajaxSettings.xhr=e.ActiveXObject?function(){return!this.isLocal&&Fn()||In()}:Fn,function(e){v.extend(v.support,{ajax:!!e,cors:!!e&&"withCredentials"in e})}(v.ajaxSettings.xhr()),v.support.ajax&&v.ajaxTransport(function(n){if(!n.crossDomain||v.support.cors){var r;return{send:function(i,s){var o,u,a=n.xhr();n.username?a.open(n.type,n.url,n.async,n.username,n.password):a.open(n.type,n.url,n.async);if(n.xhrFields)for(u in n.xhrFields)a[u]=n.xhrFields[u];n.mimeType&&a.overrideMimeType&&a.overrideMimeType(n.mimeType),!n.crossDomain&&!i["X-Requested-With"]&&(i["X-Requested-With"]="XMLHttpRequest");try{for(u in i)a.setRequestHeader(u,i[u])}catch(f){}a.send(n.hasContent&&n.data||null),r=function(e,i){var u,f,l,c,h;try{if(r&&(i||a.readyState===4)){r=t,o&&(a.onreadystatechange=v.noop,Bn&&delete Hn[o]);if(i)a.readyState!==4&&a.abort();else{u=a.status,l=a.getAllResponseHeaders(),c={},h=a.responseXML,h&&h.documentElement&&(c.xml=h);try{c.text=a.responseText}catch(p){}try{f=a.statusText}catch(p){f=""}!u&&n.isLocal&&!n.crossDomain?u=c.text?200:404:u===1223&&(u=204)}}}catch(d){i||s(-1,d)}c&&s(u,f,c,l)},n.async?a.readyState===4?setTimeout(r,0):(o=++jn,Bn&&(Hn||(Hn={},v(e).unload(Bn)),Hn[o]=r),a.onreadystatechange=r):r()},abort:function(){r&&r(0,1)}}}});var qn,Rn,Un=/^(?:toggle|show|hide)$/,zn=new RegExp("^(?:([-+])=|)("+m+")([a-z%]*)$","i"),Wn=/queueHooks$/,Xn=[Gn],Vn={"*":[function(e,t){var n,r,i=this.createTween(e,t),s=zn.exec(t),o=i.cur(),u=+o||0,a=1,f=20;if(s){n=+s[2],r=s[3]||(v.cssNumber[e]?"":"px");if(r!=="px"&&u){u=v.css(i.elem,e,!0)||n||1;do a=a||".5",u/=a,v.style(i.elem,e,u+r);while(a!==(a=i.cur()/o)&&a!==1&&--f)}i.unit=r,i.start=u,i.end=s[1]?u+(s[1]+1)*n:n}return i}]};v.Animation=v.extend(Kn,{tweener:function(e,t){v.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;r<i;r++)n=e[r],Vn[n]=Vn[n]||[],Vn[n].unshift(t)},prefilter:function(e,t){t?Xn.unshift(e):Xn.push(e)}}),v.Tween=Yn,Yn.prototype={constructor:Yn,init:function(e,t,n,r,i,s){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=s||(v.cssNumber[n]?"":"px")},cur:function(){var e=Yn.propHooks[this.prop];return e&&e.get?e.get(this):Yn.propHooks._default.get(this)},run:function(e){var t,n=Yn.propHooks[this.prop];return this.options.duration?this.pos=t=v.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):this.pos=t=e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):Yn.propHooks._default.set(this),this}},Yn.prototype.init.prototype=Yn.prototype,Yn.propHooks={_default:{get:function(e){var t;return e.elem[e.prop]==null||!!e.elem.style&&e.elem.style[e.prop]!=null?(t=v.css(e.elem,e.prop,!1,""),!t||t==="auto"?0:t):e.elem[e.prop]},set:function(e){v.fx.step[e.prop]?v.fx.step[e.prop](e):e.elem.style&&(e.elem.style[v.cssProps[e.prop]]!=null||v.cssHooks[e.prop])?v.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},Yn.propHooks.scrollTop=Yn.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},v.each(["toggle","show","hide"],function(e,t){var n=v.fn[t];v.fn[t]=function(r,i,s){return r==null||typeof r=="boolean"||!e&&v.isFunction(r)&&v.isFunction(i)?n.apply(this,arguments):this.animate(Zn(t,!0),r,i,s)}}),v.fn.extend({fadeTo:function(e,t,n,r){return this.filter(Gt).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=v.isEmptyObject(e),s=v.speed(t,n,r),o=function(){var t=Kn(this,v.extend({},e),s);i&&t.stop(!0)};return i||s.queue===!1?this.each(o):this.queue(s.queue,o)},stop:function(e,n,r){var i=function(e){var t=e.stop;delete e.stop,t(r)};return typeof e!="string"&&(r=n,n=e,e=t),n&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,n=e!=null&&e+"queueHooks",s=v.timers,o=v._data(this);if(n)o[n]&&o[n].stop&&i(o[n]);else for(n in o)o[n]&&o[n].stop&&Wn.test(n)&&i(o[n]);for(n=s.length;n--;)s[n].elem===this&&(e==null||s[n].queue===e)&&(s[n].anim.stop(r),t=!1,s.splice(n,1));(t||!r)&&v.dequeue(this,e)})}}),v.each({slideDown:Zn("show"),slideUp:Zn("hide"),slideToggle:Zn("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){v.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),v.speed=function(e,t,n){var r=e&&typeof e=="object"?v.extend({},e):{complete:n||!n&&t||v.isFunction(e)&&e,duration:e,easing:n&&t||t&&!v.isFunction(t)&&t};r.duration=v.fx.off?0:typeof r.duration=="number"?r.duration:r.duration in v.fx.speeds?v.fx.speeds[r.duration]:v.fx.speeds._default;if(r.queue==null||r.queue===!0)r.queue="fx";return r.old=r.complete,r.complete=function(){v.isFunction(r.old)&&r.old.call(this),r.queue&&v.dequeue(this,r.queue)},r},v.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},v.timers=[],v.fx=Yn.prototype.init,v.fx.tick=function(){var e,n=v.timers,r=0;qn=v.now();for(;r<n.length;r++)e=n[r],!e()&&n[r]===e&&n.splice(r--,1);n.length||v.fx.stop(),qn=t},v.fx.timer=function(e){e()&&v.timers.push(e)&&!Rn&&(Rn=setInterval(v.fx.tick,v.fx.interval))},v.fx.interval=13,v.fx.stop=function(){clearInterval(Rn),Rn=null},v.fx.speeds={slow:600,fast:200,_default:400},v.fx.step={},v.expr&&v.expr.filters&&(v.expr.filters.animated=function(e){return v.grep(v.timers,function(t){return e===t.elem}).length});var er=/^(?:body|html)$/i;v.fn.offset=function(e){if(arguments.length)return e===t?this:this.each(function(t){v.offset.setOffset(this,e,t)});var n,r,i,s,o,u,a,f={top:0,left:0},l=this[0],c=l&&l.ownerDocument;if(!c)return;return(r=c.body)===l?v.offset.bodyOffset(l):(n=c.documentElement,v.contains(n,l)?(typeof l.getBoundingClientRect!="undefined"&&(f=l.getBoundingClientRect()),i=tr(c),s=n.clientTop||r.clientTop||0,o=n.clientLeft||r.clientLeft||0,u=i.pageYOffset||n.scrollTop,a=i.pageXOffset||n.scrollLeft,{top:f.top+u-s,left:f.left+a-o}):f)},v.offset={bodyOffset:function(e){var t=e.offsetTop,n=e.offsetLeft;return v.support.doesNotIncludeMarginInBodyOffset&&(t+=parseFloat(v.css(e,"marginTop"))||0,n+=parseFloat(v.css(e,"marginLeft"))||0),{top:t,left:n}},setOffset:function(e,t,n){var r=v.css(e,"position");r==="static"&&(e.style.position="relative");var i=v(e),s=i.offset(),o=v.css(e,"top"),u=v.css(e,"left"),a=(r==="absolute"||r==="fixed")&&v.inArray("auto",[o,u])>-1,f={},l={},c,h;a?(l=i.position(),c=l.top,h=l.left):(c=parseFloat(o)||0,h=parseFloat(u)||0),v.isFunction(t)&&(t=t.call(e,n,s)),t.top!=null&&(f.top=t.top-s.top+c),t.left!=null&&(f.left=t.left-s.left+h),"using"in t?t.using.call(e,f):i.css(f)}},v.fn.extend({position:function(){if(!this[0])return;var e=this[0],t=this.offsetParent(),n=this.offset(),r=er.test(t[0].nodeName)?{top:0,left:0}:t.offset();return n.top-=parseFloat(v.css(e,"marginTop"))||0,n.left-=parseFloat(v.css(e,"marginLeft"))||0,r.top+=parseFloat(v.css(t[0],"borderTopWidth"))||0,r.left+=parseFloat(v.css(t[0],"borderLeftWidth"))||0,{top:n.top-r.top,left:n.left-r.left}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||i.body;while(e&&!er.test(e.nodeName)&&v.css(e,"position")==="static")e=e.offsetParent;return e||i.body})}}),v.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(e,n){var r=/Y/.test(n);v.fn[e]=function(i){return v.access(this,function(e,i,s){var o=tr(e);if(s===t)return o?n in o?o[n]:o.document.documentElement[i]:e[i];o?o.scrollTo(r?v(o).scrollLeft():s,r?s:v(o).scrollTop()):e[i]=s},e,i,arguments.length,null)}}),v.each({Height:"height",Width:"width"},function(e,n){v.each({padding:"inner"+e,content:n,"":"outer"+e},function(r,i){v.fn[i]=function(i,s){var o=arguments.length&&(r||typeof i!="boolean"),u=r||(i===!0||s===!0?"margin":"border");return v.access(this,function(n,r,i){var s;return v.isWindow(n)?n.document.documentElement["client"+e]:n.nodeType===9?(s=n.documentElement,Math.max(n.body["scroll"+e],s["scroll"+e],n.body["offset"+e],s["offset"+e],s["client"+e])):i===t?v.css(n,r,i,u):v.style(n,r,i,u)},n,o?i:t,o,null)}})}),e.jQuery=e.$=v,typeof define=="function"&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return v})})(window);/*
 FusionCharts JavaScript Library
 Copyright FusionCharts Technologies LLP
 License Information at <http://www.fusioncharts.com/license>

 @version fusioncharts/3.3.1-sr3.21100

 @attributions (infers respective third-party copyrights)
 Raphael 2.1.0 (modified as "Red Raphael") <http://raphaeljs.com/license.html>
 SWFObject v2.2 (modified) <http://code.google.com/p/swfobject/>
 JSON v2 <http://www.JSON.org/js.html>
 jQuery 1.8.3 <http://jquery.com/>
 Firebug Lite 1.3.0 <http://getfirebug.com/firebuglite>
*/
(function(){if(!window.FusionCharts||!window.FusionCharts.version){var a={},f=window,g=f.document,h=f.navigator,j=a.modules={},d=a.interpreters={},o=Object.prototype.toString,c=/msie/i.test(h.userAgent)&&!f.opera,b=/loaded|complete/,i=!!g.createElementNS&&!!g.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect,t=!1,e=function(){var b=a.ready;a.ready=!0;if(a.raiseEvent)a.readyNotified=!0,a.raiseEvent("ready",{version:a.core.version,now:!b},a.core);a.readyNow=!b},m=function(a,b){var e,
k;if(b instanceof Array)for(e=0;e<b.length;e+=1)typeof b[e]!=="object"?a[e]=b[e]:(typeof a[e]!=="object"&&(a[e]=b[e]instanceof Array?[]:{}),m(a[e],b[e]));else for(e in b)typeof b[e]==="object"?(k=o.call(b[e]),k==="[object Object]"?(typeof a[e]!=="object"&&(a[e]={}),m(a[e],b[e])):k==="[object Array]"?(a[e]instanceof Array||(a[e]=[]),m(a[e],b[e])):a[e]=b[e]):a[e]=b[e];return a};a.extend=function(a,b,e,k){var i;if(e&&a.prototype)a=a.prototype;if(k===!0)m(a,b);else for(i in b)a[i]=b[i];return a};a.uniqueId=
function(){return"chartobject-"+(a.uniqueId.lastId+=1)};a.uniqueId.lastId=0;a.policies={options:{swfSrcPath:["swfSrcPath",void 0],product:["product","v3"],insertMode:["insertMode","replace"],safeMode:["safeMode",!0],overlayButton:["overlayButton",void 0],containerBackgroundColor:["backgroundColor","#ffffff"],chartType:["type",void 0]},attributes:{lang:["lang","EN"],"class":["className","FusionCharts"],id:["id",void 0]},width:["width","100%"],height:["height","100%"],src:["swfUrl",""]};d.stat=["swfUrl",
"id","width","height","debugMode","registerWithJS","backgroundColor","scaleMode","lang","detectFlashVersion","autoInstallRedirect"];a.parsePolicies=function(b,e,i){var k,c,d;for(c in e)if(a.policies[c]instanceof Array)d=i[e[c][0]],b[c]=d===void 0?e[c][1]:d;else for(k in typeof b[c]!=="object"&&(b[c]={}),e[c])d=i[e[c][k][0]],b[c][k]=d===void 0?e[c][k][1]:d};a.parseCommands=function(a,b,e){var i,c;typeof b==="string"&&(b=d[b]||[]);i=0;for(c=b.length;i<c;i++)a[b[i]]=e[i];return a};a.core=function(b){if(!(this instanceof
a.core)){if(arguments.length===1&&b instanceof Array&&b[0]==="private"){if(j[b[1]])return;j[b[1]]={};b[3]instanceof Array&&(a.core.version[b[1]]=b[3]);return typeof b[2]==="function"?b[2].call(a,j[b[1]]):a}if(arguments.length===1&&typeof b==="string")return a.core.items[b];a.raiseError&&a.raiseError(this,"25081840","run","",new SyntaxError('Use the "new" keyword while creating a new FusionCharts object'))}var e={};this.__state={};if(arguments.length===1&&typeof arguments[0]==="object")e=arguments[0];
else if(a.parseCommands(e,d.stat,arguments),a.core.options.sensePreferredRenderer&&e.swfUrl&&e.swfUrl.match&&!e.swfUrl.match(/[^a-z0-9]+/ig))e.type=e.swfUrl;arguments.length>1&&typeof arguments[arguments.length-1]==="object"&&(delete e[d.stat[arguments.length-1]],a.extend(e,arguments[arguments.length-1]));this.id=typeof e.id==="undefined"?this.id=a.uniqueId():e.id;this.args=e;if(a.core.items[this.id]instanceof a.core)a.raiseWarning(this,"06091847","param","",Error('A FusionChart oject with the specified id "'+
this.id+'" already exists. Renaming it to '+(this.id=a.uniqueId())));if(e.type&&e.type.toString){if(!a.renderer.userSetDefault&&(c||i))e.renderer=e.renderer||"javascript";e.swfUrl=(a.core.options.swfSrcPath||e.swfSrcPath||a.core.options.scriptBaseUri).replace(/\/\s*$/g,"")+"/"+e.type.replace(/\.swf\s*?$/ig,"")+".swf"}a.parsePolicies(this,a.policies,e);this.attributes.id=this.id;this.resizeTo(e.width,e.height,!0);a.raiseEvent("BeforeInitialize",e,this);a.core.items[this.id]=this;a.raiseEvent("Initialized",
e,this);return this};a.core.prototype={};a.core.prototype.constructor=a.core;a.extend(a.core,{id:"FusionCharts",version:[3,3,1,"sr3",21100],items:{},options:{sensePreferredRenderer:!0},getObjectReference:function(b){return a.core.items[b].ref}},!1);f.FusionCharts=a.core;f.FusionMaps&&f.FusionMaps.legacy&&(a.core(["private","modules.core.geo",f.FusionMaps.legacy,f.FusionMaps.version]),t=!0);!b.test(g.readyState)&&!g.loaded?function(){function i(){if(!arguments.callee.done){arguments.callee.done=!0;
m&&clearTimeout(m);if(!t)f.FusionMaps&&f.FusionMaps.legacy&&a.core(["private","modules.core.geo",f.FusionMaps.legacy,f.FusionMaps.version]),f.FusionMaps=a.core;setTimeout(e,1)}}function d(){b.test(g.readyState)?i():m=setTimeout(d,10)}var m;g.addEventListener?g.addEventListener("DOMContentLoaded",i,!1):g.attachEvent&&f.attachEvent("onLoad",i);if(c)try{f.location.protocol==="https:"?g.write('<script id="__ie_onload_fusioncharts" defer="defer" src="//:"><\/script>'):g.write('<script id="__ie_onload_fusioncharts" defer="defer" src="javascript:void(0)"><\/script>'),
g.getElementById("__ie_onload_fusioncharts").onreadystatechange=function(){this.readyState=="complete"&&i()}}catch(k){}/WebKit/i.test(h.userAgent)&&(m=setTimeout(d,10));f.onload=function(a){return function(){i();a&&a.call&&a.call(f)}}(f.onload)}():(a.ready=!0,setTimeout(e,1));f.FusionMaps=a.core}})();
(function(){var a=FusionCharts(["private","EventManager"]);if(a!==void 0){window.FusionChartsEvents={BeforeInitialize:"beforeinitialize",Initialized:"initialized",Loaded:"loaded",BeforeRender:"beforerender",Rendered:"rendered",DataLoadRequested:"dataloadrequested",DataLoadRequestCancelled:"dataloadrequestcancelled",DataLoadRequestCompleted:"dataloadrequestcompleted",BeforeDataUpdate:"beforedataupdate",DataUpdateCancelled:"dataupdatecancelled",DataUpdated:"dataupdated",DataLoadCancelled:"dataloadcancelled",
DataLoaded:"dataloaded",DataLoadError:"dataloaderror",NoDataToDisplay:"nodatatodisplay",DataXMLInvalid:"dataxmlinvalid",InvalidDataError:"invaliddataerror",DrawComplete:"drawcomplete",Resized:"resized",BeforeDispose:"beforedispose",Disposed:"disposed",Exported:"exported"};var f=function(a,d,h,c){try{a[0].call(d,h,c||{})}catch(b){setTimeout(function(){throw b;},0)}},g=function(j,d,h){if(j instanceof Array)for(var c=0,b;c<j.length;c+=1){if(j[c][1]===d.sender||j[c][1]===void 0)if(b=j[c][1]===d.sender?
d.sender:a.core,f(j[c],b,d,h),d.detached===!0)j.splice(c,1),c-=1,d.detached=!1;if(d.cancelled===!0)break}},h={unpropagator:function(){return(this.cancelled=!0)===!1},detacher:function(){return(this.detached=!0)===!1},undefaulter:function(){return(this.prevented=!0)===!1},listeners:{},lastEventId:0,addListener:function(j,d,g){if(j instanceof Array)for(var c=0;c<j.length;c+=1)h.addListener(j[c],d,g);else typeof j!=="string"?a.raiseError(g||a.core,"03091549","param","::EventTarget.addListener",Error("Unspecified Event Type")):
typeof d!=="function"?a.raiseError(g||a.core,"03091550","param","::EventTarget.addListener",Error("Invalid Event Listener")):(j=j.toLowerCase(),h.listeners[j]instanceof Array||(h.listeners[j]=[]),h.listeners[j].push([d,g]))},removeListener:function(j,d,g){var c;if(typeof d!=="function")a.raiseError(g||a.core,"03091560","param","::EventTarget.removeListener",Error("Invalid Event Listener"));else if(j instanceof Array)for(c=0;c<j.length;c+=1)h.removeListener(j[c],d,g);else if(typeof j!=="string")a.raiseError(g||
a.core,"03091559","param","::EventTarget.removeListener",Error("Unspecified Event Type"));else if(j=j.toLowerCase(),j=h.listeners[j],j instanceof Array)for(c=0;c<j.length;c+=1)j[c][0]===d&&j[c][1]===g&&(j.splice(c,1),c-=1)},triggerEvent:function(j,d,o,c,b){if(typeof j!=="string")a.raiseError(d,"03091602","param","::EventTarget.dispatchEvent",Error("Invalid Event Type"));else{j=j.toLowerCase();d={eventType:j,eventId:h.lastEventId+=1,sender:d||Error("Orphan Event"),cancel:!1,stopPropagation:this.unpropagator,
prevented:!1,preventDefault:this.undefaulter,detached:!1,detachHandler:this.detacher};if(c)d.originalEvent=c;g(h.listeners[j],d,o);g(h.listeners["*"],d,o);b&&d.prevented===!1&&f(b,d.sender,d,o);return!0}}};a.raiseEvent=function(a,d,g,c,b){return h.triggerEvent(a,g,d,c,b)};a.addEventListener=function(a,d){return h.addListener(a,d)};a.removeEventListener=function(a,d){return h.removeListener(a,d)};a.extend(a.core,{addEventListener:a.addEventListener,removeEventListener:a.removeEventListener},!1);a.extend(a.core,
{addEventListener:function(a,d){return h.addListener(a,d,this)},removeEventListener:function(a,d){return h.removeListener(a,d,this)}},!0);a.addEventListener("BeforeDispose",function(a){var d,g;for(d in h.listeners)for(g=0;g<h.listeners[d].length;g+=1)h.listeners[d][g][1]===a.sender&&h.listeners[d].splice(g,1)});if(a.ready&&!a.readyNotified)a.readyNotified=!0,a.raiseEvent("ready",{version:a.core.version,now:a.readyNow},a.core)}})();
(function(){var a=FusionCharts(["private","ErrorHandler"]);if(a!==void 0){var f={type:"TypeException",range:"ValueRangeException",impl:"NotImplementedException",param:"ParameterException",run:"RuntimeException",comp:"DesignTimeError",undefined:"UnspecifiedException"},g=function(j,d,h,c,b,i){var t="#"+d+" "+(j?j.id:"unknown-source")+c+" "+i+" >> ";b instanceof Error?(b.name=f[h],b.module="FusionCharts"+c,b.level=i,b.message=t+b.message,t=b.message,window.setTimeout(function(){throw b;},0)):t+=b;d=
{id:d,nature:f[h],source:"FusionCharts"+c,message:t};a.raiseEvent(i,d,j);if(typeof window["FC_"+i]==="function")window["FC_"+i](d)};a.raiseError=function(a,d,h,c,b){g(a,d,h,c,b,"Error")};a.raiseWarning=function(a,d,h,c,b){g(a,d,h,c,b,"Warning")};var h={outputHelpers:{text:function(a,d){h.outputTo("#"+a.eventId+" ["+(a.sender.id||a.sender).toString()+'] fired "'+a.eventType+'" event. '+(a.eventType==="error"||a.eventType==="warning"?d.message:""))},event:function(a,d){this.outputTo(a,d)},verbose:function(a,
d){h.outputTo(a.eventId,a.sender.id,a.eventType,d)}},outputHandler:function(j,d){typeof h.outputTo!=="function"?a.core.debugMode.outputFailed=!0:(a.core.debugMode.outputFailed=!1,h.currentOutputHelper(j,d))},currentOutputHelper:void 0,outputTo:void 0,enabled:!1};h.currentOutputHelper=h.outputHelpers.text;a.extend(a.core,{debugMode:{syncStateWithCharts:!0,outputFormat:function(a){if(a&&typeof a.toLowerCase==="function"&&typeof h.outputHelpers[a=a.toLowerCase()]==="function")return h.currentOutputHelper=
h.outputHelpers[a],!0;return!1},outputTo:function(g){typeof g==="function"?h.outputTo=g:g===null&&(a.core.debugMode.enabled(!1),delete h.outputTo)},enabled:function(g,d,f){var c;if(typeof g==="object"&&arguments.length===1)c=g,g=c.state,d=c.outputTo,f=c.outputFormat;if(typeof g==="function"){if(typeof d==="string"&&(arguments.length===2||c))f=d;d=g;g=!0}if(typeof g==="boolean"&&g!==h.enabled)a.core[(h.enabled=g)?"addEventListener":"removeEventListener"]("*",h.outputHandler);if(typeof d==="function")h.outputTo=
d;a.core.debugMode.outputFormat(f);return h.enabled},_enableFirebugLite:function(){window.console&&window.console.firebug?a.core.debugMode.enabled(console.log,"verbose"):a.loadScript("firebug-lite.js",function(){a.core.debugMode.enabled(console.log,"verbose")},"{ startOpened: true }")}}},!1)}})();
FusionCharts(["private","modules.mantle.ajax",function(){var a=this,f=window,g=parseFloat(navigator.appVersion.split("MSIE")[1]),h=g>=5.5&&g<=7?!0:!1,j=f.location.protocol==="file:",d=f.ActiveXObject,o=(!d||!j)&&f.XMLHttpRequest,c={objects:0,xhr:0,requests:0,success:0,failure:0,idle:0},b=function(){var a;if(o)return b=function(){c.xhr++;return new o},b();try{a=new d("Msxml2.XMLHTTP"),b=function(){c.xhr++;return new d("Msxml2.XMLHTTP")}}catch(t){try{a=new d("Microsoft.XMLHTTP"),b=function(){c.xhr++;
return new d("Microsoft.XMLHTTP")}}catch(e){a=!1}}return a},f=a.ajax=function(a,b){this.onSuccess=a;this.onError=b;this.open=!1;c.objects++;c.idle++};f.stats=function(b){return b?c[b]:a.extend({},c)};f.prototype.headers={"If-Modified-Since":"Sat, 29 Oct 1994 19:43:31 GMT","X-Requested-With":"XMLHttpRequest","X-Requested-By":"FusionCharts",Accept:"text/plain, */*","Content-Type":"application/x-www-form-urlencoded; charset=UTF-8"};f.prototype.transact=function(i,d,e,m){var u=this,l=u.xmlhttp,g=u.headers,
k=u.onError,p=u.onSuccess,i=i==="POST",f,o;if(!l||h)l=b(),u.xmlhttp=l;l.onreadystatechange=function(){try{if(l.readyState===4)!l.status&&j||l.status>=200&&l.status<300||l.status===304||l.status===1223||l.status===0?(p&&p(l.responseText,u,m,d),c.success++):k&&(k(Error("XmlHttprequest Error"),u,m,d),c.failure++),c.idle--,u.open=!1}catch(a){k&&k(a,u,m,d),window.FC_DEV_ENVIRONMENT&&setTimeout(function(){throw a;},0),c.failure++}};try{l.overrideMimeType&&l.overrideMimeType("text/plain");if(i)if(l.open("POST",
d,!0),typeof e==="string")f=e;else{f=[];for(o in e)f.push(o+"="+(e[o]+"").replace(/\=/g,"%3D").replace(/\&/g,"%26"));f=f.join("&")}else l.open("GET",d,!0),f=null;for(o in g)l.setRequestHeader(o,g[o]);l.send(f);c.requests++;c.idle++;u.open=!0}catch(B){a.raiseError(a.core,"1110111515A","run","XmlHttprequest Error",B.message)}return l};f.prototype.get=function(a,b){return this.transact("GET",a,void 0,b)};f.prototype.post=function(a,b,e){return this.transact("POST",a,b,e)};f.prototype.abort=function(){var a=
this.xmlhttp;this.open=!1;return a&&typeof a.abort==="function"&&a.readyState&&a.readyState!==0&&a.abort()};f.prototype.dispose=function(){this.open&&this.abort();delete this.onError;delete this.onSuccess;delete this.xmlhttp;delete this.open;c.objects--;return null}}]);
(function(){var a=FusionCharts(["private","modules.mantle.runtime;1.1"]);if(a!==void 0){var f=/(^|[\/\\])(fusioncharts\.js|fusioncharts\.debug\.js|fusioncharts\.core\.js|fusioncharts\.min\.js)([\?#].*)?$/ig;a.getScriptBaseUri=function(a){var b=document.getElementsByTagName("script"),e=b.length,i,c;for(c=0;c<e;c+=1)if(i=b[c].getAttribute("src"),!(i===void 0||i===null||i.match(a)===null))return i.replace(a,"$1")};a.core.options.scriptBaseUri=function(){var b=a.getScriptBaseUri(f);if(b===void 0)return a.raiseError(FusionCharts,
"1603111624","run",">GenericRuntime~scriptBaseUri","Unable to locate FusionCharts script source location (URL)."),"";return b}();var g=/[\\\"<>;&]/,h=/^[^\S]*?(sf|f|ht)(tp|tps):\/\//i,j=FusionChartsEvents.ExternalResourceLoad="externalresourceload",d={},o={},c={},b={};a.isXSSSafe=function(a,b){if(b&&h.exec(a)!==null)return!1;return g.exec(a)===null};a.loadScript=function(e,i,m,k,g){if(!e)return!1;var h=i&&i.success||i,t=i&&i.failure,f,x={type:"script",success:!1},w=function(){b[f]=clearTimeout(b[f]);
x.success?h&&h(e,f):t&&t(e,f);a.raiseEvent(j,x,a.core)},g=g?"":a.core.options.scriptBaseUri;f=g+e;a.isXSSSafe(f,!1)||(f=typeof window.encodeURIComponent==="function"?window.encodeURIComponent(f):window.escape(f));x.path=g;x.src=f;x.file=e;if(c[f]===!0&&k)return x.success=!0,x.notReloaded=!0,typeof i==="function"&&(i(),a.raiseEvent(j,x,a.core)),!0;if(d[f]&&k)return!1;d[f]=!0;o[f]&&o[f].parentNode&&o[f].parentNode.removeChild(o[f]);i=o[f]=document.createElement("script");i.type="text/javascript";i.src=
f;m&&(i.innerHTML=m);if(typeof h==="function")c[f]=!1,b[f]=clearTimeout(b[f]),i.onload=function(){c[f]=!0;x.success=!0;w()},i.onerror=function(){c[f]=!1;d[f]=!1;w()},i.onreadystatechange=function(){if(this.readyState==="complete"||this.readyState==="loaded")c[f]=!0,x.success=!0,w()};document.getElementsByTagName("head")[0].appendChild(i);typeof t==="function"&&(b[f]=setTimeout(function(){c[f]||w()},a.core.options.html5ResourceLoadTimeout||15E3));return!0};a.capitalizeString=function(a,b){return a?
a.replace(b?/(^|\s)([a-z])/g:/(^|\s)([a-z])/,function(a,b,e){return b+e.toUpperCase()}):a};var i=a.purgeDOM=function(a){var b=a.attributes,e,k;if(b)for(e=b.length-1;e>=0;e-=1)k=b[e].name,typeof a[k]==="function"&&(a[k]=null);if(b=a.childNodes){b=b.length;for(e=0;e<b;e+=1)i(a.childNodes[e])}},t=function(a,b,e){for(var i in a){var c;if(a[i]instanceof Array)b[a[i][0]]=e[i];else for(c in a[i])b[a[i][c][0]]=e[i][c]}},e=/[^\%\d]*$/ig,m=/^(FusionCharts|FusionWidgets|FusionMaps)/;a.extend(a.core,{dispose:function(){a.raiseEvent("BeforeDispose",
{},this);a.renderer.dispose(this);delete a.core.items[this.id];a.raiseEvent("Disposed",{},this);for(var b in this)delete this[b]},clone:function(b,e){var i=typeof b,c={},d=a.extend({},this.args,!1,!1);t(a.policies,d,this);t(a.renderer.getRendererPolicy(this.options.renderer),d,this);delete d.id;delete d.animate;delete d.stallLoad;c.link=d.link;d=a.extend({},d,!1,!1);d.link=c.link;switch(i){case "object":a.extend(d,b);break;case "boolean":e=b}return e?d:new a.core(d)},isActive:function(){if(!this.ref||
document.getElementById(this.id)!==this.ref||typeof this.ref.signature!=="function")return!1;try{return m.test(this.ref.signature())}catch(a){return!1}},resizeTo:function(b,i,c){var d={width:b,height:i};if(typeof b==="object")d.width=b.width,d.height=b.height,c=i;if(d.width&&typeof d.width.toString==="function")this.width=d.width.toString().replace(e,"");if(d.height&&typeof d.height.toString==="function")this.height=d.height.toString().replace(e,"");c!==!0&&a.renderer.resize(this,d)},chartType:function(a){var b=
this.src,e;if(typeof a==="string")this.src=a,this.isActive()&&this.render();return(e=(e=b.substring(b.indexOf(".swf"),0))?e:b).substring(e.lastIndexOf("/")+1).toLowerCase().replace(/^fcmap_/i,"")}},!0);window.getChartFromId=window.getMapFromId=function(b){a.raiseWarning(this,"11133001041","run","GenericRuntime~getObjectFromId()",'Use of deprecated getChartFromId() or getMapFromId(). Replace with "FusionCharts()" or FusionCharts.items[].');return a.core.items[b]instanceof a.core?a.core.items[b].ref:
window.swfobject.getObjectById(b)}}})();
(function(){var a=FusionCharts(["private","RendererManager"]);if(a!==void 0){a.policies.options.containerElementId=["renderAt",void 0];a.policies.options.renderer=["renderer",void 0];a.normalizeCSSDimension=function(a,i,c){var a=a===void 0?c.offsetWidth||parseFloat(c.style.width):a,i=i===void 0?c.offsetHeight||parseFloat(c.style.height):i,e;c.style.width=a=a.toString?a.toString():"0";c.style.height=i=i.toString?i.toString():"0";if(a.match(/^\s*\d*\.?\d*\%\s*$/)&&!a.match(/^\s*0\%\s*$/)&&c.offsetWidth===
0)for(e=c;e=e.offsetParent;)if(e.offsetWidth>0){a=(e.offsetWidth*parseFloat(a.match(/\d*/)[0])/100).toString();break}if(i.match(/^\s*\d*\.?\d*\%\s*$/)&&!i.match(/^\s*0\%\s*$/)&&c.offsetHeight<=20)for(e=c;e=e.offsetParent;)if(e.offsetHeight>0){i=(e.offsetHeight*parseFloat(i.match(/\d*/)[0])/100).toString();break}e={width:a.replace?a.replace(/^\s*(\d*\.?\d*)\s*$/ig,"$1px"):a,height:i.replace?i.replace(/^\s*(\d*\.?\d*)\s*$/ig,"$1px"):i};c.style.width=e.width;c.style.height=e.height;return e};var f=function(){a.raiseError(this,
"25081845","run","::RendererManager",Error("No active renderer"))},g={undefined:{render:f,remove:f,update:f,resize:f,config:f,policies:{}}},h={},j=a.renderer={register:function(b,i){if(!b||typeof b.toString!=="function")throw"#03091436 ~renderer.register() Invalid value for renderer name.";b=b.toString().toLowerCase();if(g[b]!==void 0)return a.raiseError(a.core,"03091438","param","::RendererManager>register",'Duplicate renderer name specified in "name"'),!1;g[b]=i;return!0},userSetDefault:!1,setDefault:function(b){if(!b||
typeof b.toString!=="function")return a.raiseError(a.core,"25081731","param","::RendererManager>setDefault",'Invalid renderer name specified in "name"'),!1;if(g[b=b.toString().toLowerCase()]===void 0)return a.raiseError(a.core,"25081733","range","::RendererManager>setDefault","The specified renderer does not exist."),!1;this.userSetDefault=!1;a.policies.options.renderer=["renderer",b];return!0},notifyRender:function(b){var i=a.core.items[b&&b.id];(!i||b.success===!1&&!b.silent)&&a.raiseError(a.core.items[b.id],
"25081850","run","::RendererManager",Error("There was an error rendering the chart. Enable FusionCharts JS debugMode for more information."));if(i.ref=b.ref)b.ref.FusionCharts=a.core.items[b.id];a.raiseEvent("internal.DOMElementCreated",b,i)},protectedMethods:{options:!0,attributes:!0,src:!0,ref:!0,constructor:!0,signature:!0,link:!0,addEventListener:!0,removeEventListener:!0},getRenderer:function(a){return g[a]},getRendererPolicy:function(a){a=g[a].policies;return typeof a==="object"?a:{}},currentRendererName:function(){return a.policies.options.renderer[1]},
update:function(a){h[a.id].update.apply(a,Array.prototype.slice.call(arguments,1))},render:function(a){h[a.id].render.apply(a,Array.prototype.slice.call(arguments,1))},remove:function(a){h[a.id].remove.apply(a,Array.prototype.slice.call(arguments,1))},resize:function(a){h[a.id].resize.apply(a,Array.prototype.slice.call(arguments,1))},config:function(a){h[a.id].config.apply(a,Array.prototype.slice.call(arguments,1))},dispose:function(a){h[a.id].dispose.apply(a,Array.prototype.slice.call(arguments,
1))}},d=function(b){return function(){if(this.ref===void 0||this.ref===null||typeof this.ref[b]!=="function")a.raiseError(this,"25081617","run","~"+b+"()","ExternalInterface call failed. Check whether chart has been rendered.");else return this.ref[b].apply(this.ref,arguments)}};a.addEventListener("BeforeInitialize",function(b){var b=b.sender,i;if(typeof b.options.renderer==="string"&&g[b.options.renderer.toLowerCase()]===void 0)b.options.renderer=a.policies.options.renderer[1];b.options.renderer=
b.options.renderer.toLowerCase();h[b.id]=g[b.options.renderer];if(h[b.id].initialized!==!0&&typeof h[b.id].init==="function")h[b.id].init(),h[b.id].initialized=!0;a.parsePolicies(b,h[b.id].policies||{},b.args);for(var c in h[b.id].prototype)b[c]=h[b.id].prototype[c];for(i in h[b.id].events)b.addEventListener(i,h[b.id].events[i])});a.addEventListener("Loaded",function(b){var i=b.sender,b=b.sender.ref;i instanceof a.core&&delete i.__state.rendering;if(!(b===void 0||b===null||typeof b.getExternalInterfaceMethods!==
"function")){var c;try{c=b.getExternalInterfaceMethods(),c=typeof c==="string"?c.split(","):[]}catch(e){c=[],a.raiseError(i,"13111126041","run","RendererManager^Loaded",Error("Error while retrieving data from the chart-object."+(e.message&&e.message.indexOf("NPObject")>=0?" Possible cross-domain security restriction.":"")))}for(b=0;b<c.length;b+=1)i[c[b]]===void 0&&(i[c[b]]=d(c[b]))}});var o=function(a,i){if(typeof a[i]==="function")return function(){return a[i].apply(a,arguments)};return a[i]};a.addEventListener("loaded",
function(b){var i=b.sender;if(i.ref){var c=a.renderer.protectedMethods,e=a.renderer.getRenderer(i.options.renderer).protectedMethods,d;for(d in b.sender)if(e&&!c[d]&&!(e[d]||i.ref[d]!==void 0))try{i.ref[d]=o(b.sender,d)}catch(f){}}});var c=function(a,i){var c=document.getElementById(a),e=i.getAttribute("id");if(c===null)return!1;if(a===e)return!0;for(var e=i.getElementsByTagName("*"),d=0;d<e.length;d+=1)if(e[d]===c)return!1;return!0};a.extend(a.core,{render:function(b){var i,d;((i=window[this.id])&&
i.FusionCharts&&i.FusionCharts===this||(i=this.ref)&&i.FusionCharts&&i.FusionCharts===this)&&a.renderer.dispose(this);window[this.id]!==void 0&&a.raiseError(this,"25081843","comp",".render",Error("#25081843:IECompatibility() Chart Id is same as a JavaScript variable name. Variable naming error. Please use unique name for chart JS variable, chart-id and container id."));d=this.options.insertMode.toLowerCase()||"replace";if(b===void 0)b=this.options.containerElementId;typeof b==="string"&&(b=document.getElementById(b));
if(b===void 0||b===null)return a.raiseError(this,"03091456","run",".render()",Error("Unable to find the container DOM element.")),this;if(c(this.id,b))return a.raiseError(this,"05102109","run",".render()",Error("A duplicate object already exists with the specific Id: "+this.id)),this;i=document.createElement(this.options.containerElementType||"span");i.setAttribute("id",this.id);if(d!=="append"&&d!=="prepend")for(;b.hasChildNodes();)b.removeChild(b.firstChild);d==="prepend"&&b.firstChild?b.insertBefore(i,
b.firstChild):b.appendChild(i);this.options.containerElement=b;this.options.containerElementId=b.id;if(d=i.style)d.position="relative",d.textAlign="left",d.lineHeight="100%",d.display="inline-block",d.zoom="1",d.fontWeight="normal",d.fontVariant="normal",d.fontStyle="normal",d.textDecoration="none",d["*DISPLAY"]="inline";a.normalizeCSSDimension(this.width,this.height,i);this.__state.rendering=!0;a.raiseEvent("BeforeRender",{container:b,width:this.width,height:this.height,renderer:this.options.renderer},
this);a.renderer.render(this,i,a.renderer.notifyRender);return this},remove:function(){a.renderer.remove(this);return this},configure:function(b,i){var c;b&&(typeof b==="string"?(c={},c[b]=i):c=b,a.renderer.config(this,c))}},!0);a.extend(a.core,{setCurrentRenderer:function(){var a=j.setDefault.apply(j,arguments);j.userSetDefault=!0;return a},getCurrentRenderer:function(){return j.currentRendererName.apply(j,arguments)},render:function(){var b=["swfUrl","id","width","height","renderAt","dataSource",
"dataFormat"],i={},c;if(arguments[0]instanceof a.core)return arguments[0].render(),arguments[0];for(c=0;c<arguments.length&&c<b.length;c+=1)i[b[c]]=arguments[c];typeof arguments[arguments.length-1]==="object"&&(delete i[b[c-1]],a.extend(i,arguments[arguments.length-1]));if(i.dataFormat===void 0)i.dataFormat=FusionChartsDataFormats.XMLURL;return(new a.core(i)).render()}},!1)}})();
(function(){var a=FusionCharts(["private","DataHandlerManager"]);if(a!==void 0){window.FusionChartsDataFormats={};var f=a.transcoders={},g={},h={},j=/url$/i,d=function(b,c,d,e){var m=!1,f=d.obj,g=d.format,d=d.silent;a.raiseEvent("DataLoadRequestCompleted",{source:"XmlHttpRequest",url:e,data:b,dataFormat:g,cancelDataLoad:function(){m=!0;c.abort();this.cancelDataLoad=function(){return!1};return!0},xmlHttpRequestObject:c.xhr},f);m!==!0?f.setChartData(b,g,d):a.raiseEvent("DataLoadCancelled",{source:"XmlHttpRequest",
url:e,dataFormat:g,xmlHttpRequestObject:c.xhr},f)},o=function(b,c,d,e){d=d.obj;b={source:"XmlHttpRequest",url:e,xmlHttpRequestObject:c.xhr,error:b,httpStatus:c.xhr&&c.xhr.status?c.xhr.status:-1};a.raiseEvent("DataLoadError",b,d);typeof window.FC_DataLoadError==="function"&&window.FC_DataLoadError(d.id,b)};a.policies.options.dataSource=["dataSource",void 0];a.policies.options.dataFormat=["dataFormat",void 0];a.policies.options.dataConfiguration=["dataConfiguration",void 0];a.policies.options.showDataLoadingMessage=
["showDataLoadingMessage",!0];a.addDataHandler=function(b,c){if(typeof b!=="string"||f[b.toLowerCase()]!==void 0)a.raiseError(a.core,"03091606","param","::DataManager.addDataHandler",Error("Invalid Data Handler Name"));else{var d={},e=b.toLowerCase();f[e]=c;c.name=b;d["set"+b+"Url"]=function(a){return this.setChartDataUrl(a,b)};d["set"+b+"Data"]=function(a,e){return this.setChartData(a,b,!1,e)};d["get"+b+"Data"]=function(){return this.getChartData(b)};window.FusionChartsDataFormats[b]=e;window.FusionChartsDataFormats[b+
"URL"]=e+"URL";a.extend(a.core,d,!0)}};a.addEventListener("BeforeInitialize",function(a){var a=a.sender,c=a.options.dataSource;g[a.id]="";h[a.id]={};if(c!==void 0&&c!==null){a.__state.dataSetDuringConstruction=!0;if(typeof a.options.dataFormat!=="string")switch(typeof c){case "function":c=a.options.dataSource=c(a);a.options.dataFormat="JSON";break;case "string":a.options.dataFormat=/^\s*?\{[\s\S]*\}\s*?$/g.test(a.options.dataFormat)?"JSON":"XML";break;case "object":a.options.dataFormat="JSON"}a.setChartData(c,
a.options.dataFormat)}});a.addEventListener("BeforeDispose",function(a){var c=a.sender;delete g[a.sender.id];delete h[a.sender.id];c&&c.__state&&c.__state.dhmXhrObj&&c.__state.dhmXhrObj.abort()});a.extend(a.core,{setChartDataUrl:function(b,c,f){if(c===void 0||c===null||typeof c.toString!=="function")a.raiseError(a.core,"03091609","param",".setChartDataUrl",Error("Invalid Data Format"));else{var c=c.toString().toLowerCase(),e,m=this,g=m.options&&m.options.renderer==="flash"&&m.options.useLegacyXMLTransport||
!1;j.test(c)?e=c.slice(0,-3):(e=c,c+="url");a.raiseEvent("DataLoadRequested",{source:"XmlHttpRequest",url:b,dataFormat:e,cancelDataLoadRequest:function(){g=!0;a.raiseEvent("DataLoadRequestCancelled",{source:"XmlHttpRequest",url:b,dataFormat:e},m);try{this.__state&&this.__state.dhmXhrObj&&this.__state.dhmXhrObj.abort()}catch(c){}this.cancelDataLoadRequest=function(){return!1};return!0}},m);if(g){if(this.__state&&this.__state.dhmXhrObj)try{this.__state.dhmXhrObj.abort()}catch(h){}}else{this.options.dataSource=
b;if(!this.__state.dhmXhrObj)this.__state.dhmXhrObj=new a.ajax(d,o);this.__state.dhmXhrObj.get(typeof window.decodeURIComponent==="function"?window.decodeURIComponent(b):window.unescape(b),{obj:this,format:e,silent:f})}}},setChartData:function(b,c,d){if(c===void 0||c===null||typeof c.toString!=="function")a.raiseError(a.core,"03091610","param",".setChartData",Error("Invalid Data Format"));else{var c=c.toString().toLowerCase(),e;if(j.test(c))this.setChartDataUrl(b,c,d);else{this.options.dataSource=
b;e=c;this.options.dataFormat=c;var c=f[e],m=!1;if(typeof c==="undefined")a.raiseError(a.core,"03091611","param",".setChartData",Error("Data Format not recognized"));else if(c=c.encode(b,this,this.options.dataConfiguration)||{},c.format=c.dataFormat=e,c.dataSource=b,c.cancelDataUpdate=function(){m=!0;this.cancelDataUpdate=function(){return!1};return!0},a.raiseEvent("BeforeDataUpdate",c,this),delete c.cancelDataUpdate,m===!0)a.raiseEvent("DataUpdateCancelled",c,this);else{g[this.id]=c.data||"";h[this.id]=
{};if(d!==!0)this.options.safeMode===!0&&this.__state.rendering===!0&&!this.isActive()?(this.__state.updatePending=c,a.raiseWarning(this,"23091255","run","::DataHandler~update","Renderer update was postponed due to async loading.")):(delete this.__state.updatePending,a.renderer.update(this,c));this.__state.dataReady=void 0;a.raiseEvent("DataUpdated",c,this)}}}},getChartData:function(b,c){var e;var d;if(b===void 0||typeof b.toString!=="function"||(d=f[b=b.toString().toLowerCase()])===void 0)a.raiseError(this,
"25081543","param","~getChartData()",Error('Unrecognized data-format specified in "format"'));else return e=typeof h[this.id][b]==="object"?h[this.id][b]:h[this.id][b]=d.decode(g[this.id],this,this.options.dataConfiguration),d=e,Boolean(c)===!0?d:d.data},dataReady:function(){return this.__state.dataReady}},!0);a.extend(a.core,{transcodeData:function(b,c,d,e,m){if(!c||typeof c.toString!=="function"||!d||typeof d.toString!=="function"||f[d=d.toString().toLowerCase()]===void 0||f[c=c.toString().toLowerCase()]===
void 0)a.raiseError(this,"14090217","param","transcodeData()",Error("Unrecognized data-format specified during transcoding."));else{b=f[c].encode(b,this,m);d=f[d].decode(b.data,this,m);if(!(d.error instanceof Error))d.error=b.error;return e?d:d.data}}},!1);a.addEventListener("Disposed",function(a){delete h[a.sender.id]});a.addEventListener("Loaded",function(b){b=b.sender;b instanceof a.core&&b.__state.updatePending!==void 0&&(a.renderer.update(b,b.__state.updatePending),delete b.__state.updatePending)});
a.addEventListener("NoDataToDisplay",function(a){a.sender.__state.dataReady=!1});var c=a._interactiveCharts={selectscatter:[!0,!1],dragcolumn2d:[!0,!0],dragarea:[!0,!0],dragline:[!0,!0],dragnode:[!0,!0]};a.addEventListener("Loaded",function(b){var b=b.sender,d=b.__state,f,e;if(b.chartType&&c[b.chartType()]&&c[b.chartType()][0]){for(f in a.transcoders)e=a.transcoders[f].name,e="get"+e+"Data",b[e]=function(e,b){return function(c){return c===!1?b.apply(this):this.ref.getUpdatedXMLData?a.core.transcodeData(this.ref.getUpdatedXMLData(),
"xml",e):this.getData?this.getData(e):b.apply(this)}}(f,b.constructor.prototype[e]),b[e]._dynamicdatarouter=!0;d.dynamicDataRoutingEnabled=!0}else if(d.dynamicDataRoutingEnabled){for(f in a.transcoders)e=a.transcoders[f].name,e="get"+e+"Data",b.hasOwnProperty(e)&&b[e]._dynamicdatarouter&&delete b[e];d.dynamicDataRoutingEnabled=!1}})}})();
var swfobject=window.swfobject=function(){function a(){if(!D){try{var a=n.getElementsByTagName("body")[0].appendChild(n.createElement("span"));a.parentNode.removeChild(a)}catch(e){return}D=!0;for(var a=E.length,b=0;b<a;b++)E[b]()}}function f(a){D?a():E[E.length]=a}function g(a){if(typeof w.addEventListener!=v)w.addEventListener("load",a,!1);else if(typeof n.addEventListener!=v)n.addEventListener("load",a,!1);else if(typeof w.attachEvent!=v)u(w,"onload",a);else if(typeof w.onload=="function"){var e=
w.onload;w.onload=function(){e();a()}}else w.onload=a}function h(){var a=n.getElementsByTagName("body")[0],e=n.createElement(y);e.setAttribute("type",B);var b=a.appendChild(e);if(b){var c=0;(function(){if(typeof b.GetVariable!=v){var d;try{d=b.GetVariable("$version")}catch(k){}if(d)d=d.split(" ")[1].split(","),q.pv=[parseInt(d[0],10),parseInt(d[1],10),parseInt(d[2],10)]}else if(c<10){c++;setTimeout(arguments.callee,10);return}a.removeChild(e);b=null;j()})()}else j()}function j(){var a=s.length;if(a>
0)for(var e=0;e<a;e++){var i=s[e].id,f=s[e].callbackFn,g=s[e].userData||{};g.success=!1;g.id=i;if(q.pv[0]>0){var h=m(i);if(h)if(l(s[e].swfVersion)&&!(q.wk&&q.wk<312)){if(k(i,!0),f)g.success=!0,g.ref=d(i),f(g)}else if(s[e].expressInstall&&o()){g={};g.data=s[e].expressInstall;g.width=h.getAttribute("width")||"0";g.height=h.getAttribute("height")||"0";if(h.getAttribute("class"))g.styleclass=h.getAttribute("class");if(h.getAttribute("align"))g.align=h.getAttribute("align");for(var u={},h=h.getElementsByTagName("param"),
j=h.length,p=0;p<j;p++)h[p].getAttribute("name").toLowerCase()!="movie"&&(u[h[p].getAttribute("name")]=h[p].getAttribute("value"));c(g,u,i,f)}else b(h),f&&f(g)}else if(k(i,!0),f){if((i=d(i))&&typeof i.SetVariable!=v)g.success=!0,g.ref=i;f(g)}}}function d(a){var e,b=null;if(!document.embeds||!(e=document.embeds[a]))if(!((e=m(a))&&e.nodeName=="OBJECT"))e=window[a];if(!e)return b;typeof e.SetVariable!=v?b=e:(a=e.getElementsByTagName(y)[0])&&(b=a);return b}function o(){return!H&&l("6.0.65")&&(q.win||
q.mac)&&!(q.wk&&q.wk<312)}function c(a,e,b,c){H=!0;K=c||null;M={success:!1,id:b};var d=m(b);if(d){d.nodeName=="OBJECT"?(G=i(d),I=null):(G=d,I=b);a.id=x;if(typeof a.width==v||!/%$/.test(a.width)&&parseInt(a.width,10)<310)a.width="310";if(typeof a.height==v||!/%$/.test(a.height)&&parseInt(a.height,10)<137)a.height="137";n.title=n.title.slice(0,47)+" - Flash Player Installation";c=q.ie&&q.win?"ActiveX":"PlugIn";c="MMredirectURL="+w.location.toString().replace(/&/g,"%26")+"&MMplayerType="+c+"&MMdoctitle="+
n.title;typeof e.flashvars!=v?e.flashvars+="&"+c:e.flashvars=c;if(q.ie&&q.win&&d.readyState!=4)c=n.createElement("div"),b+="SWFObjectNew",c.setAttribute("id",b),d.parentNode.insertBefore(c,d),d.style.display="none",function(){d.readyState==4?d.parentNode.removeChild(d):setTimeout(arguments.callee,10)}();t(a,e,b)}}function b(a){if(q.ie&&q.win&&a.readyState!=4){var e=n.createElement("div");a.parentNode.insertBefore(e,a);e.parentNode.replaceChild(i(a),e);a.style.display="none";(function(){a.readyState==
4?a.parentNode.removeChild(a):setTimeout(arguments.callee,10)})()}else a.parentNode.replaceChild(i(a),a)}function i(a){var e=n.createElement("div");if(q.win&&q.ie)e.innerHTML=a.innerHTML;else if(a=a.getElementsByTagName(y)[0])if(a=a.childNodes)for(var b=a.length,c=0;c<b;c++)!(a[c].nodeType==1&&a[c].nodeName=="PARAM")&&a[c].nodeType!=8&&e.appendChild(a[c].cloneNode(!0));return e}function t(a,e,b){var c,b=m(b);if(q.wk&&q.wk<312)return c;if(b){if(typeof a.id==v)a.id=b.id;if(q.ie&&q.win){var d="",i;for(i in a)if(a[i]!=
Object.prototype[i])i.toLowerCase()=="data"?e.movie=a[i]:i.toLowerCase()=="styleclass"?d+=' class="'+a[i]+'"':i.toLowerCase()!="classid"&&(d+=" "+i+'="'+a[i]+'"');i="";for(var k in e)e[k]!=Object.prototype[k]&&(i+='<param name="'+k+'" value="'+e[k]+'" />');b.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+d+">"+i+"</object>";J[J.length]=a.id;c=m(a.id)}else{k=n.createElement(y);k.setAttribute("type",B);for(var g in a)a[g]!=Object.prototype[g]&&(g.toLowerCase()=="styleclass"?
k.setAttribute("class",a[g]):g.toLowerCase()!="classid"&&k.setAttribute(g,a[g]));for(d in e)e[d]!=Object.prototype[d]&&d.toLowerCase()!="movie"&&(a=k,i=d,g=e[d],c=n.createElement("param"),c.setAttribute("name",i),c.setAttribute("value",g),a.appendChild(c));b.parentNode.replaceChild(k,b);c=k}}return c}function e(a){var e=m(a);if(e&&e.nodeName=="OBJECT")q.ie&&q.win?(e.style.display="none",function(){if(e.readyState==4){var b=m(a);if(b){for(var c in b)typeof b[c]=="function"&&(b[c]=null);b.parentNode.removeChild(b)}}else setTimeout(arguments.callee,
10)}()):e.parentNode.removeChild(e)}function m(a){var e=null;try{e=n.getElementById(a)}catch(b){}return e}function u(a,e,b){a.attachEvent(e,b);F[F.length]=[a,e,b]}function l(a){var e=q.pv,a=a.split(".");a[0]=parseInt(a[0],10);a[1]=parseInt(a[1],10)||0;a[2]=parseInt(a[2],10)||0;return e[0]>a[0]||e[0]==a[0]&&e[1]>a[1]||e[0]==a[0]&&e[1]==a[1]&&e[2]>=a[2]?!0:!1}function r(a,e,b,c){if(!q.ie||!q.mac){var d=n.getElementsByTagName("head")[0];if(d){b=b&&typeof b=="string"?b:"screen";c&&(L=C=null);if(!C||L!=
b)c=n.createElement("style"),c.setAttribute("type","text/css"),c.setAttribute("media",b),C=d.appendChild(c),q.ie&&q.win&&typeof n.styleSheets!=v&&n.styleSheets.length>0&&(C=n.styleSheets[n.styleSheets.length-1]),L=b;q.ie&&q.win?C&&typeof C.addRule==y&&C.addRule(a,e):C&&typeof n.createTextNode!=v&&C.appendChild(n.createTextNode(a+" {"+e+"}"))}}}function k(a,e){if(N){var b=e?"visible":"hidden";D&&m(a)?m(a).style.visibility=b:r("#"+a,"visibility:"+b)}}function p(a){return/[\\\"<>\.;]/.exec(a)!=null&&
typeof encodeURIComponent!=v?encodeURIComponent(a):a}var v="undefined",y="object",B="application/x-shockwave-flash",x="SWFObjectExprInst",w=window,n=document,A=navigator,z=!1,E=[function(){z?h():j()}],s=[],J=[],F=[],G,I,K,M,D=!1,H=!1,C,L,N=!0,q=function(){var a=typeof n.getElementById!=v&&typeof n.getElementsByTagName!=v&&typeof n.createElement!=v,e=A.userAgent.toLowerCase(),b=A.platform.toLowerCase(),c=b?/win/.test(b):/win/.test(e),b=b?/mac/.test(b):/mac/.test(e),e=/webkit/.test(e)?parseFloat(e.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,
"$1")):!1,d=!+"\u000b1",i=[0,0,0],k=null;if(typeof A.plugins!=v&&typeof A.plugins["Shockwave Flash"]==y){if((k=A.plugins["Shockwave Flash"].description)&&!(typeof A.mimeTypes!=v&&A.mimeTypes[B]&&!A.mimeTypes[B].enabledPlugin))z=!0,d=!1,k=k.replace(/^.*\s+(\S+\s+\S+$)/,"$1"),i[0]=parseInt(k.replace(/^(.*)\..*$/,"$1"),10),i[1]=parseInt(k.replace(/^.*\.(.*)\s.*$/,"$1"),10),i[2]=/[a-zA-Z]/.test(k)?parseInt(k.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}else if(typeof w.ActiveXObject!=v)try{var g=new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
if(g){try{k=g.GetVariable("$version")}catch(f){}k&&(d=!0,k=k.split(" ")[1].split(","),i=[parseInt(k[0],10),parseInt(k[1],10),parseInt(k[2],10)])}}catch(h){}return{w3:a,pv:i,wk:e,ie:d,win:c,mac:b}}();(function(){q.w3&&((typeof n.readyState!=v&&n.readyState=="complete"||typeof n.readyState==v&&(n.getElementsByTagName("body")[0]||n.body))&&a(),D||(typeof n.addEventListener!=v&&n.addEventListener("DOMContentLoaded",a,!1),q.ie&&q.win&&(n.attachEvent("onreadystatechange",function(){n.readyState=="complete"&&
(n.detachEvent("onreadystatechange",arguments.callee),a())}),w==top&&function(){if(!D){try{n.documentElement.doScroll("left")}catch(e){setTimeout(arguments.callee,0);return}a()}}()),q.wk&&function(){D||(/loaded|complete/.test(n.readyState)?a():setTimeout(arguments.callee,0))}(),g(a)))})();(function(){q.ie&&q.win&&window.attachEvent("onunload",function(){for(var a=F.length,b=0;b<a;b++)F[b][0].detachEvent(F[b][1],F[b][2]);a=J.length;for(b=0;b<a;b++)e(J[b]);for(var c in q)q[c]=null;q=null;for(var d in swfobject)swfobject[d]=
null;swfobject=null})})();return{FusionChartsModified:!0,registerObject:function(a,e,b,c,d){var i=d||{};if(q.w3&&a&&e)i.id=a,i.swfVersion=e,i.expressInstall=b,i.callbackFn=c,i.userData=d,s[s.length]=i,k(a,!1);else if(c)i.success=!1,i.id=a,c(i)},getObjectById:function(a){if(q.w3)return d(a)},embedSWF:function(a,e,b,d,i,g,h,m,u,j,p){var r=p||{};r.success=!1;r.id=e;q.w3&&!(q.wk&&q.wk<312)&&a&&e&&b&&d&&i?(k(e,!1),f(function(){b+="";d+="";var f={};if(u&&typeof u===y)for(var p in u)f[p]=u[p];f.data=a;f.width=
b;f.height=d;p={};if(m&&typeof m===y)for(var n in m)p[n]=m[n];if(h&&typeof h===y)for(var q in h)typeof p.flashvars!=v?p.flashvars+="&"+q+"="+h[q]:p.flashvars=q+"="+h[q];if(l(i))n=t(f,p,e),f.id==e&&k(e,!0),r.success=!0,r.ref=n;else if(g&&o()){f.data=g;c(f,p,e,j);return}else k(e,!0);j&&j(r)})):j&&j(r)},switchOffAutoHideShow:function(){N=!1},ua:q,getFlashPlayerVersion:function(){return{major:q.pv[0],minor:q.pv[1],release:q.pv[2]}},hasFlashPlayerVersion:l,createSWF:function(a,e,b){if(q.w3)return t(a,
e,b)},showExpressInstall:function(a,e,b,d){q.w3&&o()&&c(a,e,b,d)},removeSWF:function(a){q.w3&&e(a)},createCSS:function(a,e,b,c){q.w3&&r(a,e,b,c)},addDomLoadEvent:f,addLoadEvent:g,getQueryParamValue:function(a){var e=n.location.search||n.location.hash;if(e){/\?/.test(e)&&(e=e.split("?")[1]);if(a==null)return p(e);for(var e=e.split("&"),b=0;b<e.length;b++)if(e[b].substring(0,e[b].indexOf("="))==a)return p(e[b].substring(e[b].indexOf("=")+1))}return""},expressInstallCallback:function(){if(H){var a=m(x);
if(a&&G){a.parentNode.replaceChild(G,a);if(I&&(k(I,!0),q.ie&&q.win))G.style.display="block";K&&K(M)}H=!1}}}}();
FusionCharts(["private","modules.renderer.flash",function(){var a=this,f=window,g=document,h=function(a){return typeof a==="function"},j=f.encodeURIComponent?function(a){return f.encodeURIComponent(a)}:function(a){return f.escape(a)};try{a.swfobject=f.swfobject,f.swfobject.createCSS("object.FusionCharts:focus, embed.FusionCharts:focus","outline: none")}catch(d){}a.core.options.requiredFlashPlayerVersion="8";a.core.options.flashInstallerUrl="http://get.adobe.com/flashplayer/";a.core.options.installRedirectMessage=
"You need Adobe Flash Player 8 (or above) to view the charts on this page. It is a free, lightweight and safe installation from Adobe Systems Incorporated.\n\nWould you like to go to Adobe's website and install Flash Player?";a.core.hasRequiredFlashVersion=function(e){if(typeof e==="undefined")e=a.core.options.requiredFlashPlayerVersion;return f.swfobject?f.swfobject.hasFlashPlayerVersion(e):void 0};var o=!1,c=/.*?\%\s*?$/g,b={chartWidth:!0,chartHeight:!0,mapWidth:!0,mapHeight:!0},i=function(e,b){if(!(b&&
b.source==="XmlHttpRequest")){var c=e.sender;if(c.ref&&h(c.ref.dataInvokedOnSWF)&&c.ref.dataInvokedOnSWF()&&h(c.ref.getXML))a.raiseWarning(c,"08300116","run","::DataHandler~__fusioncharts_vars","Data was set in UTF unsafe manner"),c.setChartData(f.unescape(e.sender.ref.getXML({escaped:!0})),FusionChartsDataFormats.XML,!0),c.flashVars.dataXML=c.getChartData(FusionChartsDataFormats.XML),delete c.flashVars.dataURL;e.sender.removeEventListener("DataLoaded",i)}};f.__fusioncharts_dimension=function(){return function(e){var b,
d;return!((b=a.core(e))instanceof a.core&&b.ref&&(d=b.ref.parentNode))?{}:{width:d.offsetWidth*(c.test(b.width)?parseInt(b.width,10)/100:1),height:d.offsetHeight*(c.test(b.height)?parseInt(b.height,10)/100:1)}}}();f.__fusioncharts_vars=function(e,b){var c=a.core.items[e];if(!(c instanceof a.core))return setTimeout(function(){var b;if(b=e!==void 0){var c=f.swfobject.getObjectById(e),d,i,g;b={};var m;if(!c&&typeof c.tagName!=="string")b=void 0;else{if((d=c.parentNode)&&d.tagName&&d.tagName.toLowerCase()===
"object"&&d.parentNode)d=d.parentNode;if(d){b.renderAt=d;if(!(c.tagName.toLowerCase()!=="object"&&c.getAttribute&&(m=c.getAttribute("flashvars")||""))&&c.hasChildNodes&&c.hasChildNodes()){g=c.childNodes;d=0;for(c=g.length;d<c;d+=1)if(g[d].tagName==="PARAM"&&(i=g[d].getAttribute("name"))&&i.toLowerCase()==="flashvars")m=g[d].getAttribute("value")||""}if(m&&h(m.toString)){m=m.split(/\=|&/g);b.flashVars={};d=0;for(c=m.length;d<c;d+=2)b.flashVars[m[d]]=m[d+1]}}else b=void 0}}b||a.raiseError(a.core,"25081621",
"run","::FlashRenderer","FusionCharts Flash object is accessing flashVars of non-existent object.")},0),!1;if(typeof b==="object"){if(c.ref&&h(c.ref.dataInvokedOnSWF)&&c.ref.dataInvokedOnSWF()){if(b.dataURL!==void 0)c.addEventListener("DataLoaded",i);else if(b.dataXML!==void 0)b.dataXML=f.unescape(b.dataXML);c.__state.flashUpdatedFlashVars=!0}else delete b.dataURL,delete b.dataXML;a.extend(c.flashVars,b);return!0}if(c.__state.dataSetDuringConstruction&&c.flashVars.dataXML===void 0&&c.options.dataSource!==
void 0&&typeof c.options.dataFormat==="string")c.flashVars.dataXML=c.options.dataSource;c.__state.flashInvokedFlashVarsRequest=!0;return c.flashVars};f.__fusioncharts_event=function(e,b){setTimeout(function(){a.raiseEvent(e.type,b,a.core.items[e.sender])},0)};var t=function(e){e=e.sender;if(e.options.renderer==="flash"){if(e.width===void 0)e.width=a.renderer.policies.flashVars.chartWidth[1];if(e.height===void 0)e.height=a.renderer.policies.flashVars.chartHeight[1];if(e.flashVars.DOMId===void 0)e.flashVars.DOMId=
e.id;a.extend(e.flashVars,{registerWithJS:"1",chartWidth:e.width,chartHeight:e.height,InvalidXMLText:"Invalid data."});if(Boolean(e.options.autoInstallRedirect)===!0&&!f.swfobject.hasFlashPlayerVersion(a.core.options.requiredFlashPlayerVersion.toString())&&o===!1&&(o=!0,a.core.options.installRedirectMessage&&f.confirm(a.core.options.installRedirectMessage)))f.location.href=a.core.options.flashInstallerUrl;if(e.options.dataFormat===void 0&&e.options.dataSource===void 0)e.options.dataFormat=FusionChartsDataFormats.XMLURL,
e.options.dataSource="Data.xml"}};a.renderer.register("flash",{dataFormat:"xml",init:function(){a.addEventListener("BeforeInitialize",t)},policies:{params:{scaleMode:["scaleMode","noScale"],scale:["scaleMode","noScale"],wMode:["wMode","opaque"],menu:["menu",void 0],bgColor:["backgroundColor","#ffffff"],allowScriptAccess:["allowScriptAccess","always"],quality:["quality","best"],swLiveConnect:["swLiveConnect",void 0],base:["base",void 0],align:["align",void 0],salign:["sAlign",void 0]},flashVars:{lang:["lang",
"EN"],debugMode:["debugMode",void 0],scaleMode:["scaleMode","noScale"],animation:["animate",void 0]},options:{autoInstallRedirect:["autoInstallRedirect",!1],useLegacyXMLTransport:["_useLegacyXMLTransport",!1]}},render:function(e,c){Boolean(this.flashVars.animation)===!0&&delete this.flashVars.animation;this.src||a.raiseError(this,"03102348","run","::FlashRenderer.render",'Could not find a valid "src" attribute. swfUrl or chart type missing.');var d={},i=this.flashVars.dataXML,g=this.flashVars.dataURL,
k,h;a.extend(d,this.flashVars);if(this.flashVars.stallLoad===!0){if(this.options.dataFormat===FusionChartsDataFormats.XML)i=this.options.dataSource;if(this.options.dataFormat===FusionChartsDataFormats.XMLURL)g=this.options.dataSource}if(a.core.debugMode.enabled()&&a.core.debugMode.syncStateWithCharts&&d.debugMode===void 0&&this.options.safeMode)d.debugMode="1";this.__state.lastRenderedSrc=this.src;d.dataXML=j(i)||"";d.dataURL=a.isXSSSafe(g)?g||"":j(g)||"";for(k in b)d.hasOwnProperty(k)&&(d[k]=j(d[k]));
if(!f.swfobject||!f.swfobject.embedSWF||!f.swfobject.FusionChartsModified)f.swfobject=a.swfobject;o&&!a.core.options.installRedirectMessage&&(h={silent:!0});f.swfobject&&f.swfobject.embedSWF?f.swfobject.embedSWF(this.src,e.id,this.width,this.height,a.core.options.requiredFlashPlayerVersion,void 0,d,this.params,this.attributes,c,h):a.raiseError(this,"1113061611","run","FlashRenderer~render",Error("Could not find swfobject library or embedSWF API"))},update:function(a){var b=this.ref,c=a.data;this.flashVars.dataXML=
c;a.error===void 0?this.isActive()&&h(b.setDataXML)?this.src!==this.__state.lastRenderedSrc?this.render():b.setDataXML(c,!1):(delete this.flashVars.dataURL,delete this.flashVars.animation):this.isActive()&&h(b.showChartMessage)?b.showChartMessage("InvalidXMLText"):(this.flashVars.dataXML="<Invalid"+a.format.toUpperCase()+">",delete this.flashVars.dataURL,delete this.flashVars.animation)},resize:function(){this.flashVars.chartWidth=this.width;this.flashVars.chartHeight=this.height;if(this.ref!==void 0)this.ref.width=
this.width,this.ref.height=this.height,h(this.ref.resize)&&this.ref.resize(this.ref.offsetWidth,this.ref.offsetHeight)},config:function(e){a.extend(this.flashVars,e)},dispose:function(){var a;f.swfobject.removeSWF(this.id);(a=this.ref)&&a.parentNode&&a.parentNode.removeChild(a)},protectedMethods:{flashVars:!0,params:!0,setDataXML:!0,setDataURL:!0,hasRendered:!0,getXML:!0,getDataAsCSV:!0,print:!0,exportChart:!0},events:{Loaded:function(a){a.sender.flashVars.animation="0"},DataLoadRequested:function(e,
b){var c=e.sender,d=b.url,g=!1;if(b.dataFormat===FusionChartsDataFormats.XML&&(f.location.protocol==="file:"&&Boolean(c.options.safeMode)||Boolean(c.options.useLegacyXMLTransport)))c.ref?c.ref.setDataURL?c.ref.setDataURL(d,!1):a.raiseError(this,"0109112330","run",">FlashRenderer^DataLoadRequested",Error("Unable to fetch URL due to security restriction on Flash Player. Update global security settings.")):c.flashVars.dataURL=d,e.stopPropagation(),g=!0,b.cancelDataLoadRequest(),c.addEventListener("DataLoaded",
i);if(c.ref&&c.showChartMessage)delete c.flashVars.stallLoad,c.options.showDataLoadingMessage&&c.ref.showChartMessage("XMLLoadingText");else if(!g)c.flashVars.stallLoad=!0},DataLoadRequestCancelled:function(a){a=a.sender;a.ref&&h(a.showChartMessage)&&a.ref.showChartMessage();delete a.flashVars.stallLoad},DataLoadError:function(a,b){var c=a.sender;c.ref&&h(c.ref.showChartMessage)&&b.source==="XmlHttpRequest"?c.ref.showChartMessage("LoadDataErrorText"):(delete c.flashVars.dataURL,c.flashVars.dataXML=
"<JSON parsing error>",delete c.flashVars.stallLoad)},DataLoadRequestCompleted:function(a,b){b.source==="XmlHttpRequest"&&delete a.sender.flashVars.stallLoad}},prototype:{getSWFHTML:function(){var a=g.createElement("span"),b=g.createElement("span"),c="RnVzaW9uQ2hhcnRz"+(new Date).getTime();a.appendChild(b);b.setAttribute("id",c);a.style.display="none";g.getElementsByTagName("body")[0].appendChild(a);f.swfobject.embedSWF(this.src,c,this.width,this.height,"8.0.0",void 0,this.flashVars,this.params,this.attrs);
b=a.innerHTML.replace(c,this.id);f.swfobject.removeSWF(c);a.parentNode.removeChild(a);return b},setTransparent:function(a){typeof a!=="boolean"&&a!==null&&(a=!0);this.params.wMode=a===null?"window":a===!0?"transparent":"opaque"},registerObject:function(){},addVariable:function(){a.raiseWarning(this,"1012141919","run","FlashRenderer~addVariable()",'Use of deprecated "addVariable()". Replace with "configure()".');a.core.prototype.configure.apply(this,arguments)},setDataXML:function(b){a.raiseWarning(this,
"11033001081","run","GenericRuntime~setDataXML()",'Use of deprecated "setDataXML()". Replace with "setXMLData()".');b===void 0||b===null||!h(b.toString)?a.raiseError(this,"25081627","param","~setDataXML",'Invalid data type for parameter "xml"'):this.ref===void 0||this.ref===null||!h(this.ref.setDataXML)?this.setChartData(b.toString(),FusionChartsDataFormats.XML):this.ref.setDataXML(b.toString())},setDataURL:function(b){a.raiseWarning(this,"11033001082","run","GenericRuntime~setDataURL()",'Use of deprecated "setDataURL()". Replace with "setXMLUrl()".');
b===void 0||b===null||!h(b.toString)?a.raiseError(this,"25081724","param","~setDataURL",'Invalid data type for parameter "url"'):this.ref===void 0||this.ref===null||!h(this.ref.setDataURL)?this.setChartData(b.toString(),FusionChartsDataFormats.XMLURL):this.ref.setDataURL(b.toString())}}});a.renderer.setDefault("flash")}]);
FusionCharts(["private","modules.renderer.js",function(){var a=this,f=window,g=document,h=a.core.options;/msie/i.test(navigator.userAgent);g.createElementNS&&g.createElementNS("http://www.w3.org/2000/svg","svg");var j=function(){},d=a.hcLib={cmdQueue:[]},o=d.moduleCmdQueue={jquery:[],base:[],charts:[],powercharts:[],widgets:[],maps:[]},c=d.moduleDependencies={},b=d.moduleMeta={jquery:"jquery.min.js",base:"FusionCharts.HC.js",charts:"FusionCharts.HC.Charts.js",powercharts:"FusionCharts.HC.PowerCharts.js",
widgets:"FusionCharts.HC.Widgets.js",maps:"FusionCharts.HC.Maps.js"},i={},t=d.getDependentModuleName=function(a){var b=[],e,d;for(e in c)if((d=c[e][a])!==void 0)b[d]=e;return b};d.injectModuleDependency=function(a,b,e){var i=!1;b===void 0&&(b=a);c[a]||(c[a]={},o[a]||(o[a]=[],d.moduleMeta[a]=h.html5ScriptNamePrefix+b+h.html5ScriptNameSuffix),i=!0);c[a][b]=e||0;return i};var e=d.hasModule=function(b){var c,e;if(b instanceof Array){c=0;for(e=b.length;c<e;c+=1)if(!Boolean(a.modules["modules.renderer.js-"+
b])||b==="jquery"&&!Boolean(f.jQuery))return!1;return!0}if(b==="jquery")return Boolean(f.jQuery);return Boolean(a.modules["modules.renderer.js-"+b])};d.needsModule=function(a,b){return(d.moduleDependencies[a]&&d.moduleDependencies[a][b])!==void 0};var m=d.loadModule=function(c,d,g,f){c instanceof Array||(c=[c]);var h=c.length,m=0,j=function(){if(m>=h)d&&d();else{var l=c[m],o=b[l],u;m+=1;if(l)if(e(l)){j();return}else{if(i[l]){a.raiseError(f||a.core,"1112201445A","run","JavaScriptRenderer~loadModule() ",
"required resources are absent or blocked from loading.");g&&g(l);return}}else g&&g(l);u=l==="jquery"?a.core.options.jQuerySourceFileName:a.core.options["html5"+a.capitalizeString(l)+"Src"];a.loadScript(u==void 0?o:u,{success:function(){e(l)?j():g&&g(l)},failure:g&&function(){g(l)}},void 0,!0)}};j()},u=d.executeWaitingCommands=function(a){for(var b;b=a.shift();)typeof b==="object"&&j[b.cmd].apply(b.obj,b.args)};d.cleanupWaitingCommands=function(a){for(var b=a.chartType(),b=t(b),c,e=[],d;c=b.shift();){for(c=
o[c]||[];d=c.shift();)typeof d==="object"&&d.obj!==a&&e.push(d);c.concat(e);e=[]}};var l=function(a){delete a.sender.jsVars._reflowData;a.sender.jsVars._reflowData={};delete a.sender.jsVars._reflowClean},r=function(){var a=function(){};a.prototype={LoadDataErrorText:"Error in loading data.",XMLLoadingText:"Retrieving data. Please wait",InvalidXMLText:"Invalid data.",ChartNoDataText:"No data to display.",ReadingDataText:"Reading data. Please wait",ChartNotSupported:"Chart type not supported.",PBarLoadingText:"",
LoadingText:"Loading chart. Please wait",RenderChartErrorText:"Unable to render chart."};return a.prototype.constructor=a}();a.extend(a.core.options,{html5ScriptNameSuffix:".js",html5ScriptNamePrefix:"FusionCharts.HC.",jQuerySourceFileName:"jquery.min.js"});a.extend(j,{dataFormat:"json",ready:!1,policies:{jsVars:{},options:{showLoadingMessage:["showLoadingMessage",!0]}},init:function(){f.jQuery?e("base")?j.ready=!0:m("base",function(){j.ready=!0;u(d.cmdQueue)},void 0,a.core):m("jquery",function(){jQuery.noConflict();
if(f.$===void 0)f.$=jQuery;j.init()},void 0,a.core)},render:function(a){var b=a,c=this.jsVars,e=c.msgStore;if(b&&this.options.showLoadingMessage)b.innerHTML='<small style="display: inline-block; *zoom:1; *display:inline; width: 100%; font-family: Verdana; font-size: 10px; color: #666666; text-align: center; padding-top: '+(parseInt(b.style.height,10)/2-5)+'px">'+(e.PBarLoadingText||e.LoadingText)+"</small>",b.style.backgroundColor=c.transparent?"transparent":this.options.containerBackgroundColor||
"#ffffff";d.cmdQueue.push({cmd:"render",obj:this,args:arguments})},update:function(){d.cmdQueue.push({cmd:"update",obj:this,args:arguments})},resize:function(){d.cmdQueue.push({cmd:"resize",obj:this,args:arguments})},dispose:function(){var a=d.cmdQueue,b,c;b=0;for(c=a.length;b<c;b+=1)a[b].obj===this&&(a.splice(b,1),c-=1,b-=1)},load:function(){d.cmdQueue.push({cmd:"load",obj:this,args:arguments})},config:function(a,b){var c,e=this.jsVars,d=e.msgStore,e=e.cfgStore;typeof a==="string"&&arguments.length>
1&&(c=a,a={},a[c]=b);for(c in a)d[c]!==void 0?d[c]=a[c]:e[c.toLowerCase()]=a[c]},protectedMethods:{},events:{BeforeInitialize:function(a){var b=a.sender,a=b.jsVars,c=this.chartType();a.fcObj=b;a.msgStore=a.msgStore||new r;a.cfgStore=a.cfgStore||{};a.previousDrawCount=-1;a.drawCount=0;a._reflowData={};if(!(a.userModules instanceof Array)&&(b=a.userModules,a.userModules=[],typeof b==="string"))a.userModules=a.userModules.concat(b.split(","));if(!d.chartAPI||!d.chartAPI[c])a.needsLoaderCall=!0},Initialized:function(a){var a=
a.sender,b=a.jsVars;b.needsLoaderCall&&(delete b.needsLoaderCall,j.load.call(a))},BeforeDataUpdate:l,BeforeDispose:l,BeforeRender:function(a){var b=a.sender.jsVars;delete b.drLoadAttempted;delete b.waitingModule;delete b.waitingModuleError;l.apply(this,arguments)},DataLoadRequested:function(a){var a=a.sender,b=a.jsVars;delete b.loadError;a.ref&&a.options.showDataLoadingMessage?b.hcObj&&!b.hasNativeMessage&&b.hcObj.showLoading?b.hcObj.showMessage(b.msgStore.XMLLoadingText):a.ref.showChartMessage?a.ref.showChartMessage("XMLLoadingText"):
b.stallLoad=!0:b.stallLoad=!0},DataLoadRequestCompleted:function(a){delete a.sender.id.stallLoad},DataLoadError:function(a){var b=a.sender,c=b.jsVars;delete c.stallLoad;c.loadError=!0;b.ref&&typeof b.ref.showChartMessage==="function"&&b.ref.showChartMessage("LoadDataErrorText");l.apply(this,arguments)}},_call:function(a,b,c){a.apply(c||f,b||[])}});a.extend(j.prototype,{getSWFHTML:function(){a.raiseWarning(this,"11090611381","run","JavaScriptRenderer~getSWFHTML()","getSWFHTML() is not supported for JavaScript charts.")},
addVariable:function(){a.raiseWarning(this,"11090611381","run","JavaScriptRenderer~addVariable()",'Use of deprecated "addVariable()". Replace with "configure()".');a.core.prototype.configure.apply(this,arguments)},getXML:function(){a.raiseWarning(this,"11171116291","run","JavaScriptRenderer~getXML()",'Use of deprecated "getXML()". Replace with "getXMLData()".');return this.getXMLData.apply(this,arguments)},setDataXML:function(){a.raiseWarning(this,"11171116292","run","JavaScriptRenderer~setDataXML()",
'Use of deprecated "setDataXML()". Replace with "setXMLData()".');return this.setXMLData.apply(this,arguments)},setDataURL:function(){a.raiseWarning(this,"11171116293","run","JavaScriptRenderer~setDataURL()",'Use of deprecated "SetDataURL()". Replace with "setXMLUrl()".');return this.setXMLUrl.apply(this,arguments)},hasRendered:function(){return this.jsVars.hcObj&&this.jsVars.hcObj.hasRendered},setTransparent:function(a){var b;if(b=this.jsVars)typeof a!=="boolean"&&a!==null&&(a=!0),b.transparent=
a===null?!1:a===!0?!0:!1}});a.extend(a.core,{_fallbackJSChartWhenNoFlash:function(){f.swfobject.hasFlashPlayerVersion(a.core.options.requiredFlashPlayerVersion)||a.renderer.setDefault("javascript")},_enableJSChartsForSelectedBrowsers:function(b){b===void 0||b===null||a.renderer.setDefault(RegExp(b).test(navigator.userAgent)?"javascript":"flash")},_doNotLoadExternalScript:function(a){var c,e;for(c in a)e=c.toLowerCase(),b[e]&&(i[e]=Boolean(a[c]))},_preloadJSChartModule:function(){throw"NotImplemented()";
}});a.renderer.register("javascript",j);f.swfobject&&f.swfobject.hasFlashPlayerVersion&&!f.swfobject.hasFlashPlayerVersion(a.core.options.requiredFlashPlayerVersion)&&(a.raiseWarning(a.core,"1204111846","run","JSRenderer","Switched to JavaScript as default rendering due to absence of required Flash Player."),a.renderer.setDefault("javascript"))}]);
(function(){var a=FusionCharts(["private","XMLDataHandler"]);if(a!==void 0){var f=function(a){return{data:a,error:void 0}};a.addDataHandler("XML",{encode:f,decode:f})}})();var JSON;JSON||(JSON={});
(function(){function a(a){return a<10?"0"+a:a}function f(a){j.lastIndex=0;return j.test(a)?'"'+a.replace(j,function(a){var b=c[a];return typeof b==="string"?b:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function g(a,c){var e,h,j,l,r=d,k,p=c[a];p&&typeof p==="object"&&typeof p.toJSON==="function"&&(p=p.toJSON(a));typeof b==="function"&&(p=b.call(c,a,p));switch(typeof p){case "string":return f(p);case "number":return isFinite(p)?String(p):"null";case "boolean":case "null":return String(p);
case "object":if(!p)return"null";d+=o;k=[];if(Object.prototype.toString.apply(p)==="[object Array]"){l=p.length;for(e=0;e<l;e+=1)k[e]=g(e,p)||"null";j=k.length===0?"[]":d?"[\n"+d+k.join(",\n"+d)+"\n"+r+"]":"["+k.join(",")+"]";d=r;return j}if(b&&typeof b==="object"){l=b.length;for(e=0;e<l;e+=1)typeof b[e]==="string"&&(h=b[e],(j=g(h,p))&&k.push(f(h)+(d?": ":":")+j))}else for(h in p)Object.prototype.hasOwnProperty.call(p,h)&&(j=g(h,p))&&k.push(f(h)+(d?": ":":")+j);j=k.length===0?"{}":d?"{\n"+d+k.join(",\n"+
d)+"\n"+r+"}":"{"+k.join(",")+"}";d=r;return j}}if(typeof Date.prototype.toJSON!=="function")Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+a(this.getUTCMonth()+1)+"-"+a(this.getUTCDate())+"T"+a(this.getUTCHours())+":"+a(this.getUTCMinutes())+":"+a(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()};var h=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
j=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,d,o,c={"\u0008":"\\b","\t":"\\t","\n":"\\n","\u000c":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},b;if(typeof JSON.stringify!=="function")JSON.stringify=function(a,c,e){var f;o=d="";if(typeof e==="number")for(f=0;f<e;f+=1)o+=" ";else typeof e==="string"&&(o=e);if((b=c)&&typeof c!=="function"&&(typeof c!=="object"||typeof c.length!=="number"))throw Error("JSON.stringify");return g("",
{"":a})};if(typeof JSON.parse!=="function")JSON.parse=function(a,b){function c(a,d){var i,g,f=a[d];if(f&&typeof f==="object")for(i in f)Object.prototype.hasOwnProperty.call(f,i)&&(g=c(f,i),g!==void 0?f[i]=g:delete f[i]);return b.call(a,d,f)}var d,a=String(a);h.lastIndex=0;h.test(a)&&(a=a.replace(h,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return d=eval("("+a+")"),typeof b==="function"?c({"":d},""):d;throw new SyntaxError("JSON.parse");}})();
(function(){var a=FusionCharts(["private","JSON_DataHandler"]);if(a!==void 0){window.JSON===void 0&&a.raiseError(this,"1113062012","run","JSONDataHandler",Error("Could not find library support for JSON parsing."));a.core.options.allowIESafeXMLParsing=["_allowIESafeXMLParsing",!0];var f=function(a){if(a===null||a===void 0||typeof a.toString!=="function")return"";return a=a.toString().replace(/&/g,"&amp;").replace(/\'/g,"&#39;").replace(/\"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")},g=function(){var g=
{arr:{set:!0,trendlines:!0,vtrendlines:!0,line:{trendlines:!0,vtrendlines:!0},data:!0,dataset:!0,lineset:!0,categories:!0,category:!0,linkeddata:!0,application:!0,definition:!0,axis:!0,connectors:!0,connector:{connectors:!0},trendset:!0,row:{rows:!0},column:{columns:!0},label:{labels:!0},color:{colorrange:!0},dial:{dials:!0},pointer:{pointers:!0},point:{trendpoints:!0},process:{processes:!0},task:{tasks:!0},milestone:{milestones:!0},datacolumn:{datatable:!0},text:{datacolumn:!0},item:{legend:!0},
alert:{alerts:!0},groups:{annotations:!0},items:{groups:!0},shapes:!0,shape:{shapes:!0},entitydef:!0,entity:{entitydef:!0}},tag:{chart:"linkedchart",map:"linkedmap",set:"data",vline:{chart:"data",graph:"data",dataset:"data",categories:"category",linkedchart:"data"},apply:{application:"application"},style:{definition:"definition"},marker:{application:"application",definition:"definition"},entity:{entitydef:"entitydef",data:"data"},shape:{shapes:"shapes"},connector:{connectors:{chart:"connector",linkedchart:"connector",
map:"connectors",linkedmap:"connectors"}},annotationgroup:{annotations:"groups"},annotation:{groups:"items"}},attr:{vline:{vline:"true"}},ins:{chart:!0,map:!0,graph:!0},dsv:{dataset:"data",categories:"category"},text:{target:"target",value:"value"},group:{styles:{definition:!0,application:!0},chart:{value:!0,target:!0},graph:{value:!0,target:!0},linkedchart:{value:!0,target:!0},markers:{definition:!0,application:!0,shapes:!0,connectors:!0},map:{entitydef:!0,data:!0},linkedmap:{entitydef:!0,data:!0}}},
d={append:function(a,b,d,f){g.arr[d]&&(g.arr[d]===!0||g.arr[d][f]===!0)?(b[d]instanceof Array||(b[d]=[]),b[d].push(a)):b[d]=a},child:function(c,b,i,f){var e,h,o,l,r,k;for(e=0;e<b.length;e+=1)switch(o=b[e],h=o.nodeName.toLowerCase(),o.nodeType){case 1:l=d.attr(o.attributes);k=g.ins[h];k===!0&&(r=l,l={},l[h]=r);k=g.attr[h];typeof k==="object"&&a.extend(l,k);if(k=g.tag[h])if(typeof k==="object"&&typeof k[i]==="object")for(r in r=void 0,k[i]){if(f[r]){h=k[i][r];break}}else typeof k==="object"&&typeof k[i]===
"string"?h=k[i]:typeof k==="string"&&(h=k);o.childNodes.length&&((k=g.group[i])&&k[h]?d.child(c,o.childNodes,h,f):d.child(l,o.childNodes,h,f));k=g.group[i];(!k||!k[h])&&d.append(l,c,h,i);break;case 3:if(k=g.text[i])h=k,l=o.data,d.append(l,c,h,i);k=g.dsv[i];if(typeof k==="string"&&f.chart&&parseInt(f.chart.compactdatamode,10))h=k,l=o.data,c[h]=c[h]?c[h]+l:l}},attr:function(a){var b,d={};if(!a||!a.length)return d;for(b=0;b<a.length;b+=1)d[a[b].nodeName.toLowerCase()]=a[b].value||a[b].nodeValue;return d}},
f=function(c){var b={},g,h,e,j,u,l,r,k;if(typeof c!=="object"&&typeof c.toString!=="function")return f.errorObject=new TypeError("xml2json.parse()"),b;for(var c=c.toString().replace(/<\!--[\s\S]*?--\>/g,"").replace(/<\?xml[\s\S]*?\?>/ig,"").replace(/&(?!([^;\n\r]+?;))/g,"&amp;$1"),c=c.replace(/^\s\s*/,""),p=/\s/,v=c.length;p.test(c.charAt(v-=1)););c=c.slice(0,v+1);if(!c)return b;try{if(window.DOMParser)g=(new window.DOMParser).parseFromString(c,"text/xml");else if(document.body&&a.core.options.allowIESafeXMLParsing){var y=
document.createElement("xml");y.innerHTML=c;document.body.appendChild(y);g=y.XMLDocument;document.body.removeChild(y)}else g=new ActiveXObject("Microsoft.XMLDOM"),g.async="false",g.loadXML(c);if(!g||!g.childNodes||!(g.childNodes.length===1&&(h=g.childNodes[0])&&h.nodeName&&(e=h.nodeName.toLowerCase())&&(e==="chart"||e==="map"||e==="graph")))return f.errorObject=new TypeError("xml2json.parse()"),b;else if(e==="graph"){j=g.createElement("chart");for(k=(l=h.attributes)&&l.length||0;k--;)j.setAttribute(l[k].name,
l[k].value),l.removeNamedItem(l[k].name);if(k=(r=h.childNodes)&&r.length||0)k-=1,u=h.removeChild(r[k]),j.appendChild(u);for(;k--;)u=h.removeChild(r[k]),j.insertBefore(u,j.firstChild);g.replaceChild(j,h);h=j}}catch(B){f.errorObject=B}h?(h.attributes&&(b[e]=d.attr(h.attributes)),h.childNodes&&d.child(b,h.childNodes,e,b),delete f.errorObject):f.errorObject=new TypeError("xml2json.parse()");return b};return function(a){delete f.errorObject;return{data:f(a),error:f.errorObject}}}(),h=function(){var a=
{items:{explode:{data:"set",groups:{annotations:"annotationgroup"},items:{groups:"annotation"}},text:{chart:{target:"target",value:"value"},graph:{target:"target",value:"value"}},dsv:{dataset:{data:"dataset"},categories:{category:"categories"}},attr:{chart:{chart:"chart"},graph:{graph:"graph"},map:{map:"map"},linkedmap:{map:"map"},linkedchart:{chart:"chart"}},group:{styles:{definition:"style",application:"apply"},map:{data:"entity",entitydef:"entity"},markers:{definition:"marker",application:"marker",
shapes:"shape",connectors:"connector"}}},qualify:function(a,c,b){return typeof this.items[a][b]==="object"?this.items[a][b][c]:this.items[a][b]}},d=function(g,c,b,h){var t="",e="",m="",u="",l,r,k;c&&typeof c.toLowerCase==="function"&&(c=c.toLowerCase());if(b===void 0&&g[c])for(l in g[c])if(r=l.toLowerCase(),r==="compactdatamode")h.applyDSV=g[c][l]==1;if(g instanceof Array)for(l=0;l<g.length;l+=1)u+=typeof g[l]==="string"?f(g[l]):d(g[l],c,b,h);else{for(l in g)r=l.toLowerCase(),g[l]instanceof Array&&
(k=a.qualify("group",r,c))?e+="<"+r+">"+d(g[l],k,c,h)+"</"+r+">":typeof g[l]==="object"?(k=a.qualify("attr",r,c))?(m=d(g[l],k,c,h).replace(/\/\>/ig,""),c=r):e+=d(g[l],r,c,h):h.applyDSV&&(k=a.qualify("dsv",r,c))?e+=g[l]:(k=a.qualify("text",r,c))?e+="<"+k+">"+g[l]+"</"+k+">":r==="vline"&&Boolean(g[l])?c="vline":t+=" "+r+'="'+f(g[l]).toString().replace(/\"/ig,"&quot;")+'"';if(k=a.qualify("explode",b,c))c=k;u=(m!==""?m:"<"+c)+t+(e!==""?">"+e+"</"+c+">":" />")}return u};return function(a){delete d.errorObject;
if(a&&typeof a==="string")try{a=JSON.parse(a)}catch(c){d.errorObject=c}return{data:d(a,a&&a.graph?"graph":a&&a.map?"map":"chart",void 0,{}),error:d.errorObject}}}();a.addDataHandler("JSON",{encode:h,decode:g})}})();
FusionCharts(["private","CSVDataHandler",function(){var a=this,f;f=function(a){this.data=[];this.columnCount=this.rowCount=0;this.configure(a)};f.decodeLiterals=function(a,h){if(a===void 0||a===null||!a.toString)return h;return a.replace("{tab}","\t").replace("{quot}",'"').replace("{apos}","'")};f.prototype.set=function(a,h,f){var d;if(this.rowCount<=a){for(d=this.rowCount;d<=a;d+=1)this.data[d]=[];this.rowCount=a+1}if(this.columnCount<=h)this.columnCount=h+1;this.data[a][h]=f};f.prototype.setRow=
function(a,h){var f;if(this.rowCount<=a){for(f=this.rowCount;f<=a;f+=1)this.data[f]=[];this.rowCount=a+1}if(this.columnCount<h.length)this.columnCount=h.length;this.data[a]=h};f.prototype.get=function(a,h){var f=this.data;return f[a]&&f[a][h]};f.prototype.configure=function(a){var h=f.decodeLiterals;this.delimiter=h(a.delimiter,",");this.qualifier=h(a.qualifier,'"');this.eolCharacter=h(a.eolCharacter,"\r\n")};f.prototype.clear=function(){this.data=[];this.columnCount=this.rowCount=0};f.prototype.toString=
function(){var a,f,j="";for(a=0;a<this.rowCount;a+=1)f=this.qualifier+this.data[a].join(this.qualifier+this.delimiter+this.qualifier)+this.qualifier,j+=f==='""'?this.eolCharacter:f+this.eolCharacter;this.rowCount>0&&(j=j.slice(0,j.length-2));return j};a.addDataHandler("CSV",{encode:function(g,f){a.raiseError(f,"0604111215A","run","::CSVDataHandler.encode()","FusionCharts CSV data-handler only supports encoding of data.");throw"FeatureNotSupportedException()";},decode:function(g){var g=a.core.transcodeData(g,
"xml","json")||{},h,j,d,o,c,b,i,t,e=g.chart||g.map||g.graph||{},m=Boolean(e.exporterrorcolumns||0),u=g.categories&&g.categories[0]&&g.categories[0].category||[];j=g.map&&!g.chart;var l=!1,r=!1,k=!1,p,v,y,B,x,w,n,A,z,E,s;h=new f({separator:e.exportdataseparator,qualifier:e.exportdataqualifier});if(j)h.setRow(0,["Id"," Short Name","Long Name","Value","Formatted Value"]);else if((p=g.dials&&g.dials.dial||g.pointers&&g.pointers.pointer||g.value)!==void 0)if(typeof p==="string")h.set(0,0,p),typeof g.target===
"string"&&h.set(0,1,g.target);else{h.setRow(0,["Id","Value"]);c=0;i=1;for(b=p.length;c<b;c+=1,i+=1)h.setRow(i,[i,p[c].value])}else if(p=g.dataset||!(g.data instanceof Array)&&[]){d=1;(v=g.lineset)&&(p=p.concat(v));(y=g.axis)&&(p=p.concat(y));x=u.length;if(!(w=p.length))for(c=0;c<x;c+=1)n=u[c],h.set(c+1,0,n.label||n.name);for(c=0;c<w;c+=1){A=p;A[c].dataset?(A=A[c].dataset,o=0,B=A.length):(A=p,o=c,B=o+1);for(;o<B&&!l&&!k;o+=1,d+=1){z=A[o];h.set(0,d,z.seriesname);if(typeof z.data==="string")z.data=z.data.split(e.dataseparator||
"|");i=b=0;for(E=z.data&&z.data.length||0;b<E||b<x;b+=1){n=u[b];j=i+1;s=z.data&&z.data[i]||{};if(s.x!==void 0&&s.y!==void 0){l=!0;break}if(s.rowid!==void 0&&s.columnid!==void 0){k=!0;break}if(b<x&&!n.vline){h.set(j,0,n.label||n.name);n=parseFloat(s?s.value:"");n=isNaN(n)?"":n;h.set(j,d,n);if(r||m||s.errorvalue)r||(r=!0,h.set(0,d+1,"Error")),t=1,h.set(j,d+1,s.errorvalue);i+=1}}t&&(d+=t,t=0)}}v&&(p=p.slice(0,-v.length));y&&p.slice(0,-y.length)}else if(p=g.data){h.set(0,1,e.yaxisname||"Value");c=0;for(x=
p.length;c<x;c+=1)s=p[c],s.vline||(n=parseFloat(s.value?s.value:""),n=isNaN(n)?"":n,h.setRow(c+1,[s.label||s.name,n]))}if(l){h.clear();r=!1;t=0;h.setRow(0,["Series","x","y"]);c=0;j=1;p=g.dataset;for(B=p.length;c<B;c+=1){b=0;z=p[c]&&p[c].data||[];for(w=z.length;b<w;b+=1,j+=1){s=z[b]||{};n=[p[c].seriesname,s.x,s.y];s.z!==void 0&&(n.push(s.z),t||(h.set(0,3,"z"),t=1));if(r||m||s.errorvalue!==void 0||s.horizontalerrorvalue!==void 0||s.verticalerrorvalue!==void 0)n.push(s.errorvalue,s.horizontalerrorvalue===
void 0?s.errorvalue:s.horizontalerrorvalue,s.verticalerrorvalue===void 0?s.errorvalue:s.verticalerrorvalue),r||(h.set(0,t+3,"Error"),h.set(0,t+4,"Horizontal Error"),h.set(0,t+5,"Vertical Error")),r=!0;h.setRow(j,n)}}}else if(k){h.clear();m={};l={};c=0;b=1;u=g.rows&&g.rows.row||[];for(t=u.length;c<t;c+=1,b+=1)n=u[c],n.id&&(m[n.id.toLowerCase()]=b,h.set(b,0,n.label||n.id));c=0;b=1;u=g.columns&&g.columns.column||[];for(t=u.length;c<t;c+=1,b+=1)n=u[c],n.id&&(l[n.id.toLowerCase()]=b,h.set(0,b,n.label||
n.id));z=g.dataset&&g.dataset[0]&&g.dataset[0].data||[];c=0;for(t=z.length;c<t;c+=1){s=z[c];j=s.rowid.toLowerCase();d=s.columnid.toLowerCase();if(!m[j])m[j]=h.rowCount,h.set(h.rowCount,0,s.rowid);if(!l[d])l[d]=h.columnCount,h.set(0,h.columnCount,s.columnid);h.set(m[j],l[d],s.value)}}h.rowCount>0&&h.get(0,0)===void 0&&h.set(0,0,e.xaxisname||"Label");return{data:h.toString(),error:void 0}}});a.core.addEventListener("Loaded",function(a){a=a.sender;if(a.options.renderer==="javascript"&&!a.getDataAsCSV)a.getDataAsCSV=
a.ref.getDataAsCSV=a.getCSVData})}]);
(function(){var a=FusionCharts(["private","DynamicChartAttributes"]);a!==void 0&&a.extend(a.core,{setChartAttribute:function(a,g){if(typeof a==="string"){var h=a,a={};a[h]=g}else if(a===null||typeof a!=="object")return;var h=0,j=this.getChartData(FusionChartsDataFormats.JSON),d,o=j.chart||j.graph||j.map||{};for(d in a)h+=1,a[d]===null?delete o[d.toLowerCase()]:o[d.toLowerCase()]=a[d];if(h>0){if(typeof o.animation==="undefined")o.animation="0";this.setChartData(j,FusionChartsDataFormats.JSON)}},getChartAttribute:function(f){var g=
(g=this.getChartData(FusionChartsDataFormats.JSON)).chart||g.graph||g.map;if(arguments.length===0||f===void 0||g===void 0)return g;var h,j;if(typeof f==="string")h=g[f.toString().toLowerCase()];else if(f instanceof Array){h={};for(j=0;j<f.length;j+=1)h[f[j]]=g[f[j].toString().toLowerCase()]}else a.raiseError(this,"25081429","param","~getChartAttribute()",'Unexpected value of "attribute"');return h}},!0)})();
(function(){var a=FusionCharts(["private","api.LinkManager"]);if(a!==void 0){a.policies.link=["link",void 0];var f=window.FusionChartsDOMInsertModes={REPLACE:"replace",APPEND:"append",PREPEND:"prepend"},g={},h=function(d,f){this.items={};this.root=d;this.parent=f;f instanceof a.core?this.level=this.parent.link.level+1:(g[d.id]=[{}],this.level=0)},j=function(a,g){return(a.options.containerElement===g.options.containerElement||a.options.containerElementId===g.options.containerElementId)&&a.options.insertMode===
f.REPLACE};h.prototype.configuration=function(){return g[this.root.id][this.level]||(g[this.root.id][this.level]={})};a.extend(a.core,{configureLink:function(d,f){var c;if(d instanceof Array){for(c=0;c<d.length;c+=1)typeof g[this.link.root.id][c]!=="object"&&(g[this.link.root.id][c]={}),a.extend(g[this.link.root.id][c],d[c]);g[this.link.root.id].splice(d.length)}else if(typeof d==="object"){if(typeof f!=="number")f=this.link.level;g[this.link.root.id][f]===void 0&&(g[this.link.root.id][f]={});a.extend(g[this.link.root.id][f],
d)}else a.raiseError(this,"25081731","param","~configureLink()","Unable to update link configuration from set parameters")}},!0);a.addEventListener("BeforeInitialize",function(d){if(d.sender.link instanceof h){if(d.sender.link.parent instanceof a.core)d.sender.link.parent.link.items[d.sender.id]=d.sender}else d.sender.link=new h(d.sender)});a.addEventListener("LinkedChartInvoked",function(d,f){var c=d.sender,b=c.clone({dataSource:f.data,dataFormat:f.linkType,link:new h(c.link.root,c)},!0),g=f.alias;
if(g){if(!b.swfSrcPath&&b.swfUrl)b.swfSrcPath=b.swfUrl.replace(/(.*?)?[^\/]*\.swf.*?/ig,"$1");b.type=g}c.args&&parseInt(c.args.animate,10)!==0&&delete b.animate;a.extend(b,c.link.configuration());a.raiseEvent("BeforeLinkedItemOpen",{level:c.link.level},c.link.root);a.core.items[b.id]instanceof a.core&&a.core.items[b.id].dispose();b=new a.core(b);if(!j(b,c)&&(!c.options.overlayButton||!c.options.overlayButton.message)){if(typeof c.options.overlayButton!=="object")c.options.overlayButton={};c.options.overlayButton.message=
"Close"}b.render();a.raiseEvent("LinkedItemOpened",{level:c.link.level,item:b},c.link.root)});a.addEventListener("OverlayButtonClick",function(d,f){if(f.id==="LinkManager"){var c=d.sender,b=c.link.level-1,g=c.link.parent,h=c.link.root;a.raiseEvent("BeforeLinkedItemClose",{level:b,item:c},h);setTimeout(function(){a.core.items[c.id]&&c.dispose();a.raiseEvent("LinkedItemClosed",{level:b},h)},0);!g.isActive()&&j(c,g)&&g.render()}});a.addEventListener("Loaded",function(d){if((d=d.sender)&&d.link!==void 0&&
d.link.root!==d&&d.link.parent instanceof a.core)if(d.ref&&typeof d.ref.drawOverlayButton==="function"){var f=a.extend({show:!0,id:"LinkManager"},d.link.parent.options.overlayButton);a.extend(f,d.link.parent.link.configuration().overlayButton||{});d.ref.drawOverlayButton(f)}else a.raiseWarning(d,"04091602","run","::LinkManager^Loaded","Unable to draw overlay button on object. -"+d.id)});a.addEventListener("BeforeDispose",function(d){var f=d.sender;f&&f.link instanceof h&&(f.link.parent instanceof
a.core&&delete f.link.parent.link.items[d.sender.id],delete g[f.id])});FusionChartsEvents.LinkedItemOpened="linkeditemopened";FusionChartsEvents.BeforeLinkedItemOpen="beforelinkeditemopen";FusionChartsEvents.LinkedItemClosed="linkeditemclosed";FusionChartsEvents.BeforeLinkedItemClose="beforelinkeditemclose"}})();
(function(){var a=FusionCharts(["private","PrintManager"]);if(a!==void 0){var f={enabled:!1,invokeCSS:!0,processPollInterval:2E3,message:"Chart is being prepared for print.",useExCanvas:!1,bypass:!1},g={getCanvasElementOf:function(b,c,d){if(b.__fusioncharts__canvascreated!==!0){var g=document.createElement("canvas"),h=a.core.items[b.id].attributes["class"];f.useExCanvas&&G_vmlCanvasManager&&G_vmlCanvasManager.initElement(g);g.setAttribute("class",h);g.__fusioncharts__reference=b.id;b.parentNode.insertBefore(g,
b.nextSibling);b.__fusioncharts__canvascreated=!0}b.nextSibling.setAttribute("width",c||b.offsetWidth||2);b.nextSibling.setAttribute("height",d||b.offsetHeight||2);return b.nextSibling},removeCanvasElementOf:function(a){var b=a.ref&&a.ref.parentNode?a.ref.parentNode:a.options.containerElement||window.getElementById(a.options.containerElementId);if(b){var c=b.getElementsByTagName("canvas"),d,f;f=0;for(d=c.length;f<d;f+=1)if(c[f].__fusioncharts__reference===a.id&&(b.removeChild(c[f]),a.ref))a.ref.__fusioncharts__canvascreated=
!1}},rle2rgba:function(a,b,c){typeof c!=="string"&&(c="FFFFFF");var a=a.split(/[;,_]/),d,f,g,h,i,j=0;for(f=0;f<a.length;f+=2){a[f]===""&&(a[f]=c);a[f]=("000000"+a[f]).substr(-6);g=parseInt("0x"+a[f].substring(0,2),16);h=parseInt("0x"+a[f].substring(2,4),16);i=parseInt("0x"+a[f].substring(4,6),16);for(d=0;d<a[f+1];d+=1)b[j]=g,b[j+1]=h,b[j+2]=i,b[j+3]=255,j+=4}return b},rle2array:function(a,b){typeof b!=="string"&&(b="FFFFFF");var c=a.split(";"),d,f;for(d in c){c[d]=c[d].split(/[_,]/);for(f=0;f<c[d].length;f+=
2)c[d][f]=c[d][f]===""?b:("000000"+c[d][f]).substr(-6)}return c},drawText:function(b,c,d,f){b=b.getContext("2d");d=d||2;f=f||2;b.clearRect(0,0,d,f);b.textBaseline="middle";b.textAlign="center";b.font="8pt verdana";b.fillStyle="#776666";typeof b.fillText==="function"?b.fillText(c,d/2,f/2):typeof b.mozDrawText==="function"?(b.translate(d/2,f/2),b.mozDrawText(c)):a.raiseWarning(a.core,"25081803","run","::PrintManager>lib.drawText","Canvas text drawing is not supported in browser");return!0},appendCSS:function(a){var b=
document.createElement("style");b.setAttribute("type","text/css");typeof b.styleSheet==="undefined"?b.appendChild(document.createTextNode(a)):b.styleSheet.cssText=a;return document.getElementsByTagName("head")[0].appendChild(b)}};g.drawRLE=function(a,b,c,d,f){c=c||2;d=d||2;a.setAttribute("width",c);a.setAttribute("height",d);a=a.getContext("2d");if(typeof a.putImageData==="function"&&typeof a.createImageData==="function")c=a.createImageData(c,d),g.rle2rgba(b,c.data,f),a.putImageData(c,0,0);else for(f in c=
g.rle2array(b,f),d=f=b=0,c)for(d=b=0;d<c[f].length;d+=2)a.fillStyle="#"+c[f][d],a.fillRect(b,f,c[f][d+1],1),b+=parseInt(c[f][d+1],10);return!0};var h={styles:{print:"canvas.FusionCharts{display:none;}@media print{object.FusionCharts{display:none;}canvas.FusionCharts{display:block;}}",error:"canvas.FusionCharts{display:none;}",normal:""},cssNode:void 0},j={},d={},o=0,c;h.invoke=function(a){typeof this.styles[a]!=="undefined"&&(a=this.styles[a]);if(typeof a!=="undefined")this.cssNode!==void 0&&this.cssNode.parentNode!==
void 0&&this.cssNode.parentNode.removeChild(this.cssNode),h.cssNode=g.appendCSS(a)};var b=function(b){var d=b.sender.ref,i,l;if(d===void 0||typeof d.prepareImageDataStream!=="function"||d.prepareImageDataStream()===!1)c(b.sender);else{j[b.sender.id]||(j[b.sender.id]=d,o+=1,o===1&&a.raiseEvent("PrintReadyStateChange",{ready:!1,bypass:f.bypass},b.sender));try{i=d.offsetWidth,l=d.offsetHeight,g.drawText(g.getCanvasElementOf(d,i,l),f.message,i,l)}catch(r){h.invoke("error"),a.raiseError(b.sender,"25081807",
"run","::PrintManager>onDrawComplete","There was an error while showing message to user via canvas.")}}},i=function(b,c){try{g.drawRLE(g.getCanvasElementOf(b.sender.ref,c.width,c.height),c.stream,c.width,c.height,c.bgColor)===!0&&j[b.sender.id]&&(delete j[b.sender.id],o-=1,o===0&&a.raiseEvent("PrintReadyStateChange",{ready:!0,bypass:f.bypass},b.sender))}catch(d){h.invoke("error"),a.raiseError(b.sender,"25081810","run","::PrintManager>onImageStreamReady","There was an error while drawing canvas.")}},
t=function(a){g.removeCanvasElementOf(a.sender)};c=function(c){var f;if(c instanceof a.core)d[c.id]=c;else for(f in d)b({sender:d[f]},{}),delete d[f]};a.extend(a.core,{printManager:{configure:function(b){a.extend(f,b||{})},isReady:function(){if(f.bypass)return!0;if(o>0||!f.enabled)return!1;var b,c;for(b in a.core.items)if((c=a.core.items[b].ref)!==void 0&&c.hasRendered&&c.hasRendered()===!1)return!1;return!0},enabled:function(d){if(d===void 0)return f.enabled;if(a.renderer.currentRendererName()!==
"flash"||typeof document.createElement("canvas").getContext!=="function")return f.bypass=!0,a.raiseEvent("PrintReadyStateChange",{ready:!0,bypass:f.bypass}),a.raiseWarning(a.core,"25081816","run",".printManager.enabled","printManager is not compatible with your browser"),f.enabled;f.bypass=!1;var j=d?"addEventListener":"removeEventListener";a.core[j]("ImageStreamReady",i);a.core[j]("DrawComplete",b);a.core[j]("BeforeDispose",t);if(d===!0){var o;f.invokeCSS===!0&&h.invoke("print");for(o in a.core.items)c(a.core.items[o]),
c()}else{var l;h.invoke("error");for(l in a.core.items)g.removeCanvasElementOf(a.core.items[l]);f.bypass||a.raiseEvent("PrintReadyStateChange",{ready:!1,bypass:f.bypass});h.invoke("normal")}return f.enabled=d},managedPrint:function(b){f.bypass?window.print():a.core.printManager.isReady()?typeof b==="object"&&b.ready!==!0||(a.removeEventListener("PrintReadyStateChange",a.core.printManager.managedPrint),window.print()):a.core.printManager.enabled(!0)!==!0?window.print():a.addEventListener("PrintReadyStateChange",
a.core.printManager.managedPrint)}}},!1);FusionChartsEvents.PrintReadyStateChange="printreadystatechange"}})();/*
 FusionCharts JavaScript Library
 Copyright FusionCharts Technologies LLP
 License Information at <http://www.fusioncharts.com/license>

 @version fusioncharts/3.3.1-sr3.21100
*/
(function(){var g=FusionCharts(["private","modules.renderer.js-lib"]);if(g!==void 0){var h=window,m="",U="0",w=".",S=document,ia=!!S.createElementNS&&!!S.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect,b=/msie/i.test(navigator.userAgent)&&!window.opera,B=/\s+/g,e=/^#?/,r=/^rgba/i,x=/[#\s]/ig,$=/\{br\}/ig,fa=/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i,s=Math.abs,ka=Math.pow,G=Math.round,V=ka(2,-24),K=Object.prototype.toString,Y=S.documentElement.ontouchstart!==void 0,O=Math,s=O.abs,l=O.max,
n=O.min,F={pageX:0,pageY:0},aa=function(a){var b=a.data,c=b.chart,d=c.paper,f=a.type,e=a.target||a.originalTarget||a.srcElement||a.relatedTarget||a.fromElement,p=Y&&i(a)||F,z=c.elements.resizeBox,t=a.layerX||p.layerX,k=a.layerY||p.layerY,q=t-b.ox,u=k-b.oy,j=b.bBox,da=b.ox,A=b.oy,j=b.zoomX,N=b.zoomY,O=b.canvasY,ca=b.canvasX,ea=b.canvasW,v=b.canvasH,r=b.canvasX2,g=b.canvasY2,x=b.strokeWidth,q=b.chartPosLeft,u=b.chartPosTop,da=b.attr;t===void 0&&(t=(a.pageX||p.pageX)-q,k=(a.pageY||p.pageY)-u);switch(f){case "dragstart":b.oy=
k;b.ox=t;b.allowMove=!1;if(!z)z=c.elements.resizeBox=d.rect(c.layers.tracker).attr(da);if(t>ca&&t<r&&k>O&&k<g)b.allowMove=!0;if(e&&e.ishot)b.allowMove=!1;z.attr({x:0,y:0,width:0,height:0}).show();break;case "dragend":j=z.getBBox();a={chart:c,selectionLeft:j.x,selectionTop:j.y,selectionHeight:j.height,selectionWidth:j.width};b.allowMove&&b.callback(a);z.hide();delete b.oy;delete b.ox;break;default:if(!b.allowMove)break;q=t-b.ox;u=k-b.oy;da=b.ox;A=b.oy;q=-(da-n(da-(da-l(da+q,ca)),r));u=-(A-n(A-(A-l(A+
u,O)),g));z.attr({x:(j?n(da,da+q):ca)+x*0.5,y:(N?n(A,A+u):O)+x*0.5,width:j?s(q):ea,height:N?s(u):v})}},D=function(a){var b=a.target||a.originalTarget||a.srcElement||a.relatedTarget||a.fromElement,c=a.data,d=a.type,f=a.layerX,e=a.layerY;f===void 0&&(f=a.pageX-c.chartPosLeft,e=a.pageY-c.chartPosTop);if(d==="mousedown")b.ishot=f>c.canvasX&&f<c.canvasX2&&e>c.canvasY&&e<c.canvasY2;d==="mouseup"&&setTimeout(function(){b.ishot=!1},1)},O=function(){var a="innerWidth",b="innerHeight",c=S.documentElement||
S.body,d=c;"innerWidth"in h?d=h:(a="clientWidth",b="clientHeight");return function(){return{width:d[a],height:d[b],scrollTop:c.scrollTop,scrollLeft:c.scrollLeft}}}(),M=function(a,b){for(var c={left:a.offsetLeft||0,top:a.offsetTop||0},a=a.offsetParent;a;)c.left+=a.offsetLeft||0,c.top+=a.offsetTop||0,a!==S.body&&a!==S.documentElement&&!b&&(c.left-=a.scrollLeft,c.top-=a.scrollTop),a=a.offsetParent;return c},Z=function(a,b){return!a&&a!==!1&&a!==0?b:a},R=function(){var a,b,c;b=0;for(c=arguments.length;b<
c;b+=1)if((a=arguments[b])||!(a!==!1&&a!==0))return a;return m},v=function(){var a,b,c;b=0;for(c=arguments.length;b<c;b+=1)if((a=arguments[b])||!(a!==!1&&a!==0))return a},C={mousedown:"touchstart",mousemove:"touchmove",mouseup:"touchend"},f=function(a,b,c,d){jQuery(a).bind(Y&&C[b]||b,d,c)},j=function(a,b,c){var d=S.removeEventListener?"removeEventListener":"detachEvent";S[d]&&!a[d]&&(a[d]=function(){});jQuery(a).unbind(Y&&C[b]||b,c)},i=function(a){var b=a.sourceEvent||a.originalEvent;return Y&&b&&
b.touches&&b.touches[0]||a},c=function(){var a,b,c;b=0;for(c=arguments.length;b<c;b+=1)if((a=arguments[b])||!(a!==!1&&a!==0))if(!isNaN(a=Number(a)))return a},d=function(a,b){a=!a&&a!==!1&&a!==0?NaN:Number(a);return isNaN(a)?null:b?s(a):a},a=function(a){return typeof a==="string"?a.replace($,"<br />"):m},k=function(a,b,c){var d,f;if(b instanceof Array)for(d=0;d<b.length;d+=1)if(typeof b[d]!=="object")c&&b[d]===void 0||(a[d]=b[d]);else{if(a[d]===null||typeof a[d]!=="object")a[d]=b[d]instanceof Array?
[]:{};k(a[d],b[d],c)}else for(d in b)if(b[d]!==null&&typeof b[d]==="object")if(f=K.call(b[d]),f==="[object Object]"){if(a[d]===null||typeof a[d]!=="object")a[d]={};k(a[d],b[d],c)}else if(f==="[object Array]"){if(a[d]===null||!(a[d]instanceof Array))a[d]=[];k(a[d],b[d],c)}else a[d]=b[d];else a[d]=b[d];return a},q=function(a,b,c){if(typeof a!=="object"&&typeof b!=="object")return null;if(typeof b!=="object"||b===null)return a;typeof a!=="object"&&(a=b instanceof Array?[]:{});k(a,b,c);return a},u=function(a,
b){var c;if(b instanceof Array)for(c=b.length-1;c>=0;c-=1)typeof b[c]!=="object"?b[c]===!0&&a&&a.splice&&a.splice(c,1):K.call(b[c])===K.call(a[c])&&u(a[c],b[c]);else for(c in b)typeof b[c]!=="object"?b[c]===!0&&a&&a.splice&&a.splice(c,1):K.call(b[c])===K.call(a[c])&&u(a[c],b[c]);return a},N=function(){var a=/^@window_/g;return function(b,c){var d=b.replace(/\[[\'\"]/g,".").replace(/[\'\"]\]/g,m).replace(/\[/g,".@window_").replace(/\]/g,m).split("."),f=h,e,p;p=m;var z,t,k;t=d.length;for(k=0;k<t;k+=
1){z=d[k];e=f;if(z.match(a))p=h[z.replace(a,m)],f=f[p];else if(f===void 0||f===null)throw(p||z).replace(a,m)+" is not defined";else f=f[z];p=z}f&&(typeof f.call==="function"||f===h.alert)?f===h.alert?f(c):f.call(e,c):setTimeout(function(){throw z.replace(a,m)+"() is not a function";},0)}}(),ca=function(){var a="FusionChartslinkEval"+parseInt(+new Date,10);return function(b){try{h[a]=new Function(b),eval("window['"+a+"']();")}catch(c){setTimeout(function(){throw c;},0)}ia?delete h[a]:h[a]=null}}(),
J=function(){if(Array.isArray)return Array.isArray;var a=Object.prototype.toString,b=a.call([]);return function(c){return a.call(c)===b}}(),Ja=function(a,b){a=Number(a);a=isNaN(a)?100:a;b!==void 0&&(a=a*b/100);return a%101},pa=function(a,b,d){var a=a.split(","),f;d!==void 0&&(d=c(d.split(",")[0]));a[0]=Ja(a[0],d);for(f=1;f<b;f+=1)a[f]=a[0]*Ja(a[f],d)/100;return a.join(",")},va=function(a,b,c){var d=0,f=0,e=0;c&&c.match(r)&&(c=c.split(","),d=c[0].slice(c[0].indexOf("(")+1),f=c[1],e=c[2],!b&&b!==0&&
(b=parseInt(c[3].slice(0,c[3].indexOf(")"))*100,10)));if(a)if(a.match(r))c=a.split(","),d=c[0].slice(c[0].indexOf("(")+1),f=c[1],e=c[2];else{a=a.replace(x,m).split(",")[0];switch(a.length){case 3:a=a[0]+a[0]+a[1]+a[1]+a[2]+a[2];break;case 6:break;default:a=(a+"FFFFFF").slice(0,6)}d=parseInt(a.slice(0,2),16);f=parseInt(a.slice(2,4),16);e=parseInt(a.slice(4,6),16)}!b&&b!=0&&(b=100);typeof b==="string"&&(b=b.split(",")[0]);b=parseInt(b,10)/100;return"rgba("+d+","+f+","+e+","+b+")"},X=function(a){return a.replace(x,
m).replace(e,"#")},Ca=function(a,b){b=b<0||b>100?100:b;b/=100;var a=a.replace(x,m),c=parseInt(a,16),d=Math.floor(c/65536),f=Math.floor((c-d*65536)/256);return("000000"+(d*b<<16|f*b<<8|(c-d*65536-f*256)*b).toString(16)).slice(-6)},ma=function(a,b){b=b<0||b>100?100:b;b/=100;var a=a.replace(x,m),c=parseInt(a,16),d=Math.floor(c/65536),f=Math.floor((c-d*65536)/256);return("000000"+(256-(256-d)*b<<16|256-(256-f)*b<<8|256-(256-(c-d*65536-f*256))*b).toString(16)).slice(-6)},ta={circle:"circle",triangle:"triangle",
square:"square",diamond:"diamond",poly:"poly_",spoke:"spoke_"},Aa={font:"font",fontFamily:"font-family","font-family":"font-family",fontWeight:"font-weight","font-weight":"font-weight",fontSize:"font-size","font-size":"font-size",lineHeight:"line-height","line-height":"line-height",textDecoration:"text-decoration","text-decoration":"text-decoration",color:"color",whiteSpace:"white-space","white-space":"white-space",padding:"padding",margin:"margin",background:"background",backgroundColor:"background-color",
"background-color":"background-color",backgroundImage:"background-image","background-image":"background-image",backgroundPosition:"background-position","background-position":"background-position",backgroundPositionLeft:"background-position-left","background-position-left":"background-position-left",backgroundPositionTop:"background-position-top","background-position-top":"background-position-top",backgroundRepeat:"background-repeat","background-repeat":"background-repeat",border:"border",borderColor:"border-color",
"border-color":"border-color",borderStyle:"border-style","border-style":"border-style",borderThickness:"border-thickness","border-thickness":"border-thickness",borderTop:"border-top","border-top":"border-top",borderTopColor:"border-top-color","border-top-color":"border-top-color",borderTopStyle:"border-top-style","border-top-style":"border-top-style",borderTopThickness:"border-top-thickness","border-top-thickness":"border-top-thickness",borderRight:"border-right","border-right":"border-right",borderRightColor:"border-right-color",
"border-right-color":"border-right-color",borderRightStyle:"border-right-style","border-right-style":"border-right-style",borderRightThickness:"border-right-thickness","border-right-thickness":"border-right-thickness",borderBottom:"border-bottom","border-bottom":"border-bottom",borderBottomColor:"border-bottom-color","border-bottom-color":"border-bottom-color",borderBottomStyle:"border-bottom-style","border-bottom-style":"border-bottom-style",borderBottomThickness:"border-bottom-thickness","border-bottom-thickness":"border-bottom-thickness",
borderLeft:"border-left","border-left":"border-left",borderLeftColor:"border-left-color","border-left-color":"border-left-color",borderLeftStyle:"border-left-style","border-left-Style":"border-left-style",borderLeftThickness:"border-left-thickness","border-left-thickness":"border-left-thickness"},Ka=function(){var a=document.createElement("span"),d,f={lineHeight:!0,"line-height":!0},e=function(){return c(parseInt(a.style.fontSize,10),10)*1.4+"px"};a.innerHTML="fy";d=window.getComputedStyle?function(){var b=
window.getComputedStyle(a,null);return b&&b.getPropertyValue("line-height")?b.getPropertyValue("line-height"):e.apply(this,arguments)}:a.currentStyle?function(){return a.currentStyle.lineHeight}:e;return function(c){var k,p="";for(k in c)!f[k]&&Aa[k]&&(p+=Aa[k]+" : "+c[k]+";");b&&!ia?a.style.setAttribute("cssText",p):a.setAttribute("style",p);k=d();parseFloat(k)||(k=e());return c.lineHeight=k}}(),bb=function(){var b={top:{align:"center",verticalAlign:"top",textAlign:"center"},right:{align:"right",
verticalAlign:"middle",textAlign:"left"},bottom:{align:"center",verticalAlign:"bottom",textAlign:"center"},left:{align:"left",verticalAlign:"middle",textAlign:"right"}},d=/([^\,^\s]+)\)$/g,f=function(a,b){var d;if(/^(bar|bar3d)$/.test(a))this.isBar=!0,this.yPos="bottom",this.yOppPos="top",this.xPos="left",this.xOppPos="right";d=parseInt(b.labelstep,10);this.labelStep=d>1?d:1;this.showLabel=c(b.showlabels,b.shownames,1);this.is3D=/3d$/.test(a)};f.prototype={isBar:!1,yPos:"left",yOppPos:"right",xPos:"bottom",
xOppPos:"top",addAxisGridLine:function(a,c,f,p,z,t,e,k){var q=f===""?!1:!0,u=p>0||t.match(d)[1]>0?!0:!1,j;if(q||u){u||(t="rgba(0,0,0,0)",p=0.1);j={isGrid:!0,width:p,dashStyle:z,color:t,value:c,zIndex:e===void 0?2:e};if(q)c=a.opposite?k?this.xOppPos:this.yOppPos:k?this.xPos:this.yPos,c=b[c],j.label={text:f,style:a.labels.style,textAlign:c.textAlign,align:c.align,verticalAlign:c.verticalAlign,rotation:0,x:0,y:0};a.plotLines.push(j)}return j},addAxisAltGrid:function(a,b){if(!this.is3D){var d=c(a._lastValue,
a.min),p=v(a._altGrid,!1);p&&a.plotBands.push({isGrid:!0,color:a.alternateGridColor,to:b,from:d,zIndex:1});a._lastValue=b;a._altGrid=!p}},addXaxisCat:function(a,c,d,p){var z=b[a.opposite?this.xOppPos:this.xPos],c={isGrid:!0,width:0.1,color:"rgba(0,0,0,0)",value:c,label:{text:p,style:a.labels.style,textAlign:z.textAlign,align:z.align,verticalAlign:z.verticalAlign,rotation:0,x:0,y:0}};if(d%this.labelStep!==0)c.stepped=!0,c.label.style=a.steppedLabels.style;a.plotLines.push(c)},addVline:function(b,d,
f,p){var z=p._FCconf,t=z.isBar,p=p.chart.plotBorderWidth,e=p%2,k=z.divlineStyle,q=a(d.label),u=Boolean(c(d.showlabelborder,z.showVLineLabelBorder,1)),j=Boolean(c(d.showlabelbackground,1)),i=v(d.labelhalign,t?"left":"center"),N=v(d.labelvalign,t?"middle":"bottom").toLowerCase(),l=c(d.labelposition,0),O=c(d.lineposition,0.5),ca=c(d.showvlines,z.showVLines,1),n=c(d.alpha,z.vLineAlpha,80),Fa=v(d.color,z.vLineColor,"333333").replace(/^#?/,"#"),F=j?v(d.labelbgcolor,z.vLineLabelBgColor,"333333").replace(/^#?/,
"#"):m,r=Fa,g=c(d.thickness,z.vLineThickness,1),x=g*0.5,I=Boolean(Number(v(d.dashed,0))),E=c(d.dashlen,5),y=c(d.dashgap,2),ha=z.smartLabel,W=parseInt(k.fontSize,10)+2,o=0,Q=c(d.rotatelabel,z.rotateVLineLabels)?270:0,O=O<0||O>1?0.5:O,l=l<0||l>1?0:l;ha.setStyle(k);ha=ha.getOriSize(q);Fa=va(Fa,ca?n:"0");if(t){switch(N){case "top":W-=ha.height+x+2;break;case "middle":W-=ha.height*0.5+1;break;default:W+=x}d.labelhalign||(o-=ha.width*l)}else{switch(N){case "top":W-=ha.height+2+(p||1)*(1-l)+l;break;case "middle":W-=
ha.height*0.5+p*(1-l*2);break;default:W+=(p-e)*l}switch(i){case "left":o+=g;break;case "right":o-=g+1}}b.plotLines.push({isVline:!0,color:Fa,width:g,value:f-1+O,zIndex:c(d.showontop,z.showVLinesOnTop)?5:3,dashStyle:I?Na(E,y,g):void 0,label:{text:q,align:t?"left":"center",offsetScale:l,rotation:Q,y:W,x:o,textAlign:i,backgroundColor:F,borderWidth:ca&&u?"1px":m,borderType:ca&&u?"solid":m,borderColor:ca&&u?r:m,backgroundOpacity:ca&&j?v(d.labelbgalpha,z.vLineLabelBgAlpha)/100:0,style:{color:ca?r:Fa,fontSize:k.fontSize,
fontFamily:k.fontFamily,lineHeight:k.lineHeight,backgroundColor:F}}})}};return f.prototype.constructor=f}();(function(){function a(b,c,d){var f;if(c<=0)return String(G(b));if(isNaN(c))return b=b.toString(),b.length>12&&b.indexOf(w)!=-1&&(c=12-b.split(w)[0].length,f=ka(10,c),b=String(G(b*f)/f)),b;f=ka(10,c);b=String(G(b*f)/f);if(d==1){b.indexOf(w)==-1&&(b+=".0");d=b.split(w);c-=d[1].length;for(d=1;d<=c;d++)b+=U}return b}function b(a,c,d,f){var e=Number(a);if(isNaN(e))return m;var k=m,q=!1,u=m,j=m,
i=u=0,u=0,i=a.length;a.indexOf(w)!=-1&&(k=a.substring(a.indexOf(w)+1,a.length),i=a.indexOf(w));e<0&&(q=!0,u=1);u=a.substring(u,i);a=u.length;e=f.length-1;i=f[e];if(a<i)j=u;else for(;a>=i;)j=(a-i?d:m)+u.substr(a-i,i)+j,a-=i,i=(e-=1)<=0?f[0]:f[e],a<i&&(j=u.substring(a,0)+j);k!=m&&(j=j+c+k);q==!0&&(j="-"+j);return j}var d={formatnumber:"1",formatnumberscale:"1",defaultnumberscale:m,numberscaleunit:["K","M"],numberscalevalue:[1E3,1E3],numberprefix:m,numbersuffix:m,decimals:m,forcedecimals:U,yaxisvaluedecimals:"2",
decimalseparator:w,thousandseparator:",",thousandseparatorposition:[3],indecimalseparator:m,inthousandseparator:m,sformatnumber:"1",sformatnumberscale:U,sdefaultnumberscale:m,snumberscaleunit:["K","M"],snumberscalevalue:[1E3,1E3],snumberprefix:m,snumbersuffix:m,sdecimals:"2",sforcedecimals:U,syaxisvaluedecimals:"2",xFormatNumber:U,xFormatNumberScale:U,xDefaultNumberScale:m,xNumberScaleUnit:["K","M"],xNumberScaleValue:[1E3,1E3],xNumberPrefix:m,xNumberSuffix:m},f={mscombidy2d:{formatnumberscale:"1"}},
e=function(a,b,t){var e,k,u,j,i,A,l,N,O,ca=b.name,n=q({},d),Fa,F;(u=f[ca])&&(n=q(n,u));this.csConf=n;this.chartAPI=b;Z(a.numberscaleunit)&&(e=a.numberscaleunit.split(","));if(k=Z(a.snumberscaleunit,a.numberscaleunit))k=k.split(",");if(u=Z(a.xnumberscaleunit,a.numberscaleunit))u=u.split(",");if(j=Z(a.ticknumberscaleunit,a.numberscaleunit))j=j.split(",");if(i=Z(a.ynumberscaleunit,a.numberscaleunit))i=i.split(",");Z(a.numberscalevalue)&&(A=a.numberscalevalue.split(","));if(F=Z(a.snumberscalevalue,a.numberscalevalue))F=
F.split(",");if(l=Z(a.xnumberscalevalue,a.numberscalevalue))l=l.split(",");if(N=Z(a.ticknumberscalevalue,a.numberscalevalue))N=N.split(",");if(O=Z(a.ynumberscalevalue,a.numberscalevalue))O=O.split(",");if(Z(a.thousandseparatorposition)){Fa=a.thousandseparatorposition.split(",");for(var r=Fa.length,g,x=c(Fa[r]),x=x?x:d.thousandseparatorposition[0];r;)r-=1,(g=c(Math.abs(Fa[r])))?x=g:g=x,Fa[r]=g}b||(b={});r=c(a.scalerecursively,0);g=c(a.sscalerecursively,r);var x=c(a.xscalerecursively,r),I=c(a.maxscalerecursion,
-1),E=c(a.smaxscalerecursion,I),y=c(a.xmaxscalerecursion,I),ha=Z(a.scaleseparator," "),W=Z(a.sscaleseparator,ha),o=Z(a.xscaleseparator,ha);if(!I||I==0)I=-1;this.baseConf=e={cacheStore:[],formatnumber:v(a.formatnumber,b.formatnumber,n.formatnumber),formatnumberscale:v(a.formatnumberscale,b.formatnumberscale,n.formatnumberscale),defaultnumberscale:R(a.defaultnumberscale,b.defaultnumberscale,n.defaultnumberscale),numberscaleunit:v(e,b.numberscaleunit,n.numberscaleunit).concat(),numberscalevalue:v(A,
b.numberscalevalue,n.numberscalevalue).concat(),numberprefix:R(a.numberprefix,b.numberprefix,n.numberprefix),numbersuffix:R(a.numbersuffix,b.numbersuffix,n.numbersuffix),decimalprecision:parseInt(a.decimals==="auto"?n.decimalprecision:v(a.decimals,a.decimalprecision,b.decimals,n.decimals,b.decimalprecision,n.decimalprecision),10),forcedecimals:v(a.forcedecimals,b.forcedecimals,n.forcedecimals),decimalseparator:v(a.decimalseparator,b.decimalseparator,n.decimalseparator),thousandseparator:v(a.thousandseparator,
b.thousandseparator,n.thousandseparator),thousandseparatorposition:v(Fa,b.thousandseparatorposition,n.thousandseparatorposition),indecimalseparator:R(a.indecimalseparator,b.indecimalseparator,n.indecimalseparator),inthousandseparator:R(a.inthousandseparator,b.inthousandseparator,n.inthousandseparator),scalerecursively:r,maxscalerecursion:I,scaleseparator:ha};this.Y=[];if(!t){t={cacheStore:[],formatnumber:e.formatnumber,formatnumberscale:e.formatnumberscale,defaultnumberscale:e.defaultnumberscale,
numberscaleunit:e.numberscaleunit.concat(),numberscalevalue:e.numberscalevalue.concat(),numberprefix:e.numberprefix,numbersuffix:e.numbersuffix,decimalprecision:e.decimalprecision,forcedecimals:e.forcedecimals,decimalseparator:e.decimalseparator,thousandseparator:e.thousandseparator,thousandseparatorposition:e.thousandseparatorposition,indecimalseparator:e.indecimalseparator,inthousandseparator:e.inthousandseparator,scalerecursively:r,maxscalerecursion:I,scaleseparator:ha};if(!b.useScaleRecursively||
(t.numberscalevalue&&t.numberscalevalue.length)!=(t.numberscaleunit&&t.numberscaleunit.length))t.scalerecursively=r=0;A={cacheStore:[],formatnumber:t.formatnumber,formatnumberscale:t.formatnumberscale,defaultnumberscale:t.defaultnumberscale,numberscaleunit:t.numberscaleunit.concat(),numberscalevalue:t.numberscalevalue.concat(),numberprefix:t.numberprefix,numbersuffix:t.numbersuffix,decimalprecision:parseInt(v(a.yaxisvaluedecimals,t.decimalprecision,2)),forcedecimals:v(a.forceyaxisvaluedecimals,t.forcedecimals),
decimalseparator:t.decimalseparator,thousandseparator:t.thousandseparator,thousandseparatorposition:t.thousandseparatorposition.concat(),indecimalseparator:t.indecimalseparator,inthousandseparator:t.inthousandseparator,scalerecursively:r,maxscalerecursion:I,scaleseparator:ha};F={cacheStore:[],formatnumber:v(a.sformatnumber,b.sformatnumber,d.sformatnumber),formatnumberscale:v(a.sformatnumberscale,b.sformatnumberscale,d.sformatnumberscale),defaultnumberscale:R(a.sdefaultnumberscale,b.sdefaultnumberscale,
t.defaultnumberscale),numberscaleunit:v(k,b.snumberscaleunit,d.snumberscaleunit).concat(),numberscalevalue:v(F,b.snumberscalevalue,d.snumberscalevalue).concat(),numberprefix:R(a.snumberprefix,b.snumberprefix,d.snumberprefix),numbersuffix:R(a.snumbersuffix,b.snumbersuffix,d.snumbersuffix),decimalprecision:parseInt(v(a.syaxisvaluedecimals,a.sdecimals,a.decimals,b.sdecimals,d.sdecimals),10),forcedecimals:v(a.forcesyaxisvaluedecimals,a.sforcedecimals,a.forcedecimals,b.sforcedecimals,d.sforcedecimals),
decimalseparator:v(a.decimalseparator,b.decimalseparator,d.decimalseparator),thousandseparator:v(a.thousandseparator,b.thousandseparator,d.thousandseparator),thousandseparatorposition:t.thousandseparatorposition.concat(),indecimalseparator:v(a.indecimalseparator,b.indecimalseparator,d.indecimalseparator),inthousandseparator:v(a.inthousandseparator,b.inthousandseparator,d.inthousandseparator),scalerecursively:g,maxscalerecursion:E,scaleseparator:W};k=q({},F);k.decimalprecision=parseInt(v(a.sdecimals,
a.decimals,a.syaxisvaluedecimals,b.sdecimals,d.sdecimals),10);k.forcedecimals=v(a.sforcedecimals,a.forcedecimals,a.forcesyaxisvaluedecimals,b.sforcedecimals,d.sforcedecimals);k.cacheStore=[];if(!b.useScaleRecursively||(F.numberscalevalue&&F.numberscalevalue.length)!=(F.numberscaleunit&&F.numberscaleunit.length))F.scalerecursively=g=0;if(/^(bubble|scatter|selectscatter)$/.test(ca))A.formatnumber=v(a.yformatnumber,A.formatnumber),A.formatnumberscale=v(a.yformatnumberscale,A.formatnumberscale),A.defaultnumberscale=
R(a.ydefaultnumberscale,A.defaultnumberscale),A.numberscaleunit=v(i,A.numberscaleunit),A.numberscalevalue=v(O,A.numberscalevalue),A.numberprefix=v(a.ynumberprefix,A.numberprefix),A.numbersuffix=v(a.ynumbersuffix,A.numbersuffix),t.formatnumber=v(a.yformatnumber,t.formatnumber),t.formatnumberscale=v(a.yformatnumberscale,t.formatnumberscale),t.defaultnumberscale=R(a.ydefaultnumberscale,t.defaultnumberscale),t.numberscaleunit=v(a.ynumberscaleunit,t.numberscaleunit.concat()),t.numberscalevalue=v(a.ynumberscalevalue,
t.numberscalevalue.concat()),t.numberprefix=v(a.ynumberprefix,t.numberprefix),t.numbersuffix=v(a.ynumbersuffix,t.numbersuffix);if(/^(mscombidy2d|mscombidy3d)$/.test(ca))F.formatnumberscale=c(a.sformatnumberscale,"1");if(/^(pie2d|pie3d|doughnut2d|doughnut3d|marimekko|pareto2d|pareto3d)$/.test(ca))t.decimalprecision=v(a.decimals,"2");r&&(t.numberscalevalue.push(1),t.numberscaleunit.unshift(t.defaultnumberscale),A.numberscalevalue.push(1),A.numberscaleunit.unshift(A.defaultnumberscale));g&&(F.numberscalevalue.push(1),
F.numberscaleunit.unshift(F.defaultnumberscale),k.numberscalevalue.push(1),k.numberscaleunit.unshift(k.defaultnumberscale));this.Y[0]={yAxisLabelConf:A,dataLabelConf:t};this.Y[1]={yAxisLabelConf:F,dataLabelConf:k};this.paramLabels=t;this.param1=A;this.param2=F;this.paramLabels2=k}this.paramX={cacheStore:[],formatnumber:v(a.xformatnumber,e.formatnumber),formatnumberscale:v(a.xformatnumberscale,e.formatnumberscale),defaultnumberscale:R(a.xdefaultnumberscale,e.defaultnumberscale),numberscaleunit:v(u,
e.numberscaleunit.concat()),numberscalevalue:v(l,e.numberscalevalue.concat()),numberprefix:v(a.xnumberprefix,e.numberprefix),numbersuffix:v(a.xnumbersuffix,e.numbersuffix),decimalprecision:parseInt(v(a.xaxisvaluedecimals,a.xaxisvaluesdecimals,e.decimalprecision,2),10),forcedecimals:v(a.forcexaxisvaluedecimals,0),decimalseparator:e.decimalseparator,thousandseparator:e.thousandseparator,thousandseparatorposition:e.thousandseparatorposition.concat(),indecimalseparator:e.indecimalseparator,inthousandseparator:e.inthousandseparator,
scalerecursively:x,maxscalerecursion:y,scaleseparator:o};if(!b.useScaleRecursively||(this.paramX.numberscalevalue&&this.paramX.numberscalevalue.length)!=(this.paramX.numberscaleunit&&this.paramX.numberscaleunit.length))this.paramX.scalerecursively=x=0;x&&(this.paramX.numberscalevalue.push(1),this.paramX.numberscaleunit.unshift(this.paramX.defaultnumberscale));this.paramScale={cacheStore:[],formatnumber:v(a.tickformatnumber,e.formatnumber),formatnumberscale:v(a.tickformatnumberscale,e.formatnumberscale),
defaultnumberscale:R(a.tickdefaultnumberscale,e.defaultnumberscale),numberscaleunit:v(j,e.numberscaleunit.concat()),numberscalevalue:v(N,e.numberscalevalue.concat()),numberprefix:v(a.ticknumberprefix,e.numberprefix),numbersuffix:v(a.ticknumbersuffix,e.numbersuffix),decimalprecision:parseInt(v(a.tickvaluedecimals,e.decimalprecision,"2")),forcedecimals:v(a.forcetickvaluedecimals,e.forcedecimals,0),decimalseparator:e.decimalseparator,thousandseparator:e.thousandseparator,thousandseparatorposition:e.thousandseparatorposition.concat(),
indecimalseparator:e.indecimalseparator,inthousandseparator:e.inthousandseparator,scalerecursively:r,maxscalerecursion:I,scaleseparator:ha};r&&(this.paramScale.numberscalevalue.push(1),this.paramScale.numberscaleunit.unshift(this.paramScale.defaultnumberscale));this.timeConf={inputDateFormat:v(a.inputdateformat,a.dateformat),outputDateFormat:v(a.outputdateformat,a.inputdateformat,a.dateformat),days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],months:["January","February",
"March","April","May","June","July","August","September","October","November","December"],daySuffix:["st","nd","rd","th","th","th","th","th","th","th","th","th","th","th","th","th","th","th","th","th","st","nd","rd","th","th","th","th","th","th","th","st"]}};e.prototype={cleaneValueCacheStore:{},percentStrCacheStore:{},dispose:function(){this.Y&&delete this.Y;this.cleaneValueCacheStore&&delete this.cleaneValueCacheStore;this.percentStrCacheStore&&delete this.percentStrCacheStore;this.baseConf&&delete this.baseConf;
this.timeConf&&delete this.timeConf;this.paramX&&delete this.paramX;this.paramScale&&delete this.paramScale},parseMLAxisConf:function(a,b){var f=this.baseConf,e=this.csConf,k=this.chartAPI,q=c(a.scalerecursively,f.scalerecursively),u=c(a.maxscalerecursion,f.maxscalerecursion),j=Z(a.scaleseparator,f.scaleseparator),i,l,N,O,n,ca,b=c(b,this.Y.length);Z(a.numberscaleunit)&&(i=a.numberscaleunit.split(","));Z(a.numberscalevalue)&&(l=a.numberscalevalue.split(","));u||(u=-1);if(Z(a.thousandseparatorposition)){N=
a.thousandseparatorposition.split(",");O=N.length;for(ca=d.thousandseparatorposition[0];O--;)(n=c(s(N[O])))?ca=n:n=ca,N[O]=n}f={cacheStore:[],formatnumber:v(a.formatnumber,f.formatnumber),formatnumberscale:v(a.formatnumberscale,f.formatnumberscale),defaultnumberscale:R(a.defaultnumberscale,f.defaultnumberscale),numberscaleunit:v(i,f.numberscaleunit).concat(),numberscalevalue:v(l,f.numberscalevalue).concat(),numberprefix:R(a.numberprefix,f.numberprefix),numbersuffix:R(a.numbersuffix,f.numbersuffix),
forcedecimals:v(a.forcedecimals,f.forcedecimals),decimalprecision:parseInt(a.decimals==="auto"?e.decimalprecision:v(a.decimals,f.decimalprecision),10),decimalseparator:v(a.decimalseparator,f.decimalseparator),thousandseparator:v(a.thousandseparator,f.thousandseparator),thousandseparatorposition:v(N,f.thousandseparatorposition),indecimalseparator:R(a.indecimalseparator,f.indecimalseparator),inthousandseparator:R(a.inthousandseparator,f.inthousandseparator),scalerecursively:q,maxscalerecursion:u,scaleseparator:j};
if(!k.useScaleRecursively||(f.numberscalevalue&&f.numberscalevalue.length)!=(f.numberscaleunit&&f.numberscaleunit.length))f.scalerecursively=q=0;k={cacheStore:[],formatnumber:f.formatnumber,formatnumberscale:f.formatnumberscale,defaultnumberscale:f.defaultnumberscale,numberscaleunit:f.numberscaleunit.concat(),numberscalevalue:f.numberscalevalue.concat(),numberprefix:f.numberprefix,numbersuffix:f.numbersuffix,decimalprecision:parseInt(v(a.yaxisvaluedecimals,f.decimalprecision,2)),forcedecimals:v(a.forceyaxisvaluedecimals,
f.forcedecimals),decimalseparator:f.decimalseparator,thousandseparator:f.thousandseparator,thousandseparatorposition:f.thousandseparatorposition.concat(),indecimalseparator:f.indecimalseparator,inthousandseparator:f.inthousandseparator,scalerecursively:q,maxscalerecursion:u,scaleseparator:j};q&&(f.numberscalevalue.push(1),f.numberscaleunit.unshift(f.defaultnumberscale),k.numberscalevalue.push(1),k.numberscaleunit.unshift(k.defaultnumberscale));this.Y[b]={dataLabelConf:f,yAxisLabelConf:k}},percentValue:function(c){var d=
this.percentStrCacheStore[c];d===void 0&&(d=isNaN(this.paramLabels.decimalprecision)?"2":this.paramLabels.decimalprecision,d=this.percentStrCacheStore[c]=b(a(c,d,this.paramLabels.forcedecimals),this.paramLabels.decimalseparator,this.paramLabels.thousandseparator,this.paramLabels.thousandseparatorposition)+"%");return d},getCleanValue:function(a,b){var c=this.cleaneValueCacheStore[a],d;if(c===void 0){c=a;d=this.baseConf.indecimalseparator;var f=this.baseConf.inthousandseparator;c+=m;Z(f)&&(f=f.replace(/(\W)/ig,
"\\$1"),c=c.toString().replace(RegExp(f,"g"),m));Z(d)&&(c=c.replace(d,w));d=!isNaN(c=parseFloat(c))&&isFinite(c)?c:NaN;this.cleaneValueCacheStore[a]=c=isNaN(d)?null:b?s(d):d}return c},dataLabels:function(a,b){var c=this.Y[b]||(b?this.Y[1]:this.Y[0]),d,c=c&&c.dataLabelConf||this.baseConf;d=c.cacheStore[a];d===void 0&&(d=c.cacheStore[a]=k(a,c));return d},yAxis:function(a,b){var c=this.Y[b]||(b?this.Y[1]:this.Y[0]),d,c=c&&c.yAxisLabelConf||this.baseConf;d=c.cacheStore[a];d===void 0&&(d=c.cacheStore[a]=
k(a,c));return d},xAxis:function(a){var b=this.paramX.cacheStore[a];b===void 0&&(b=this.paramX.cacheStore[a]=k(a,this.paramX));return b},sYAxis:function(a){var b=this.Y[1],c,b=b&&b.yAxisLabelConf||this.baseConf;c=b.cacheStore[a];c===void 0&&(c=b.cacheStore[a]=k(a,b));return c},scale:function(a){var b=this.paramScale.cacheStore[a];b===void 0&&(b=this.paramScale.cacheStore[a]=k(a,this.paramScale));return b},getCleanTime:function(a){var b;this.timeConf.inputDateFormat&&Date.parseExact&&(b=Date.parseExact(a,
this.timeConf.inputDateFormat));return b&&b.getTime()},getDateValue:function(a){a=a&&/^dd/.test(this.timeConf.inputDateFormat)&&a.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,"$2/$1/$3")||a;a=new Date(a);return{ms:a.getTime(),date:a}},getFormatedDate:function(a,b){var c=typeof a==="object"&&a||this.getDateValue(a).date,d=this.timeConf,f=v(b,d.outputDateFormat),e=c.getFullYear(),k=c.getMonth(),q=c.getDate(),u=c.getDay(),j=c.getMinutes(),i=c.getSeconds(),c=c.getHours();f.match(/dnl/)&&(f=f.replace(/dnl/ig,
d.days[u]));f.match(/dns/)&&(f=f.replace(/dns/ig,d.days[u].substr(0,3)));f.match(/dd/)&&(f=f.replace(/dd/ig,q));f.match(/mnl/)&&(f=f.replace(/mnl/ig,d.months[k]));f.match(/mns/)&&(f=f.replace(/mns/ig,d.months[k].substr(0,3)));f.match(/mm/)&&(f=f.replace(/mm/ig,k+1));f.match(/yyyy/)&&(f=f.replace(/yyyy/ig,e));f.match(/yy/)&&(f=f.replace(/yy/ig,(e%1E3%100+"").replace(/^(\d)$/,"0$1")));f.match(/hh12/)&&(f=f.replace(/hh12/ig,c%12||12));f.match(/hh/)&&(f=f.replace(/hh/ig,c));f.match(/mn/)&&(f=f.replace(/mn/ig,
j));f.match(/ss/)&&(f=f.replace(/ss/ig,i));f.match(/ampm/)&&(f=f.replace(/ampm/ig,c<12?"AM":"PM"));f.match(/ds/)&&(f=f.replace(/ds/ig,d.daySuffix[q]));return f}};e.prototype.constructor=e;var k=function(d,f){if(d!==null){var d=Number(d),e=d+m,k;k=f.formatnumberscale==1?f.defaultnumberscale:m;var q;q=(q=e.split(".")[1])?q.length:f.forcedecimals?"2":m;if(f.formatnumberscale==1){var u,e=d;k=f.numberscalevalue;u=f.numberscaleunit;var j={},i=f.defaultnumberscale,A=0,N,l=[],O=[];if(f.scalerecursively){for(A=
0;A<k.length;A++)if(N=c(k[A])||1E3,Math.abs(Number(e))>=N&&A<k.length-1)i=e%N,e=(e-i)/N,i!=0&&(l.push(i),O.push(u[A]));else{l.push(e);O.push(u[A]);break}l.reverse();O.reverse();j.value=l;j.scale=O}else{if(k.length===u.length)for(A=0;A<k.length;A++)if((N=c(k[A])||1E3)&&Math.abs(Number(e))>=N)i=u[A]||m,e=Number(e)/N;else break;j.value=e;j.scale=i}u=j;d=e=u.value;k=u.scale}if(f.scalerecursively&&f.formatnumberscale!=0){k=u.value;u=u.scale;j=f.maxscalerecursion==-1?k.length:Math.min(k.length,f.maxscalerecursion);
if(f.formatnumber==1){e="";for(l=0;l<j;l++)A=l==0?k[l]:Math.abs(k[l]),N=String(A),l==j-1&&(N=a(A,v(f.decimalprecision,q),f.forcedecimals)),e=e+b(N,f.decimalseparator,f.thousandseparator,f.thousandseparatorposition)+u[l]+(l<j-1?f.scaleseparator:"")}else{e="";for(l=0;l<j;l++)e=e+String(l==0?k[l]:Math.abs(k[l]))+u[l]+(l<j-1?f.scaleseparator:"")}e=(f.numberprefix||m)+e+(f.numbersuffix||m);delete k;delete u}else f.formatnumber==1&&(e=a(d,v(f.decimalprecision,q),f.forcedecimals),e=b(e,f.decimalseparator,
f.thousandseparator,f.thousandseparatorposition)),e=(f.numberprefix||m)+e+k+(f.numbersuffix||m);return e}};return e})();var Va=function(){var a=function(a,c,f,d,e){a=Math.abs(c-a);c=a/(f+1);b(a/(f+1))>b(d)&&(e&&Number(c)/Number(d)<(d>1?2:0.5)&&(d/=10),c=(Math.floor(c/d)+1)*d,a=c*(f+1));return a},b=function(a){var a=Math.abs(a),a=String(a),b=0,c=a.indexOf(w);c!=-1&&(b=a.length-c-1);return b};return function(c,d,f,e,p,k,q,u){var j,c=isNaN(c)==!0||c==void 0?0.1:c,d=isNaN(d)==!0||d==void 0?0:d;c==d&&
c==0&&(c=0.1);var k=typeof k===void 0?!0:k,i=Math.max(Math.floor(Math.log(Math.abs(d))/Math.LN10),Math.floor(Math.log(Math.abs(c))/Math.LN10));j=Math.pow(10,i);Math.abs(c)/j<2&&Math.abs(d)/j<2&&(i--,j=Math.pow(10,i));i=Math.pow(10,Math.floor(Math.log(c-d)/Math.LN10));c-d>0&&j/i>=10&&(j=i);var i=(Math.floor(c/j)+1)*j,l;d<0?l=-1*(Math.floor(Math.abs(d/j))+1)*j:k?l=0:(l=Math.floor(Math.abs(d/j)-1)*j,l=l<0?0:l);(typeof p===void 0||p)&&c<=0&&(i=0);p=f==null||f==void 0||f==m?!1:!0;k=e==null||e==void 0||
e==m||isNaN(Number(e))?!1:!0;c=p==!1||p==!0&&Number(f)<c&&c-Number(f)>V?i:Number(f);d=k==!1||k==!0&&Number(e)>d&&Number(e)-d>V?l:Number(e);e=Math.abs(c-d);if(k==!1&&p==!1&&u==!0)if(c>0&&d<0)for(var u=!1,f=j>10?j/10:j,p=a(d,c,q,f,!1)-(q+1)*f,N,A,O,n;u==!1;){if(p+=(q+1)*f,!(b(p/(q+1))>b(f)))if(N=p-e,k=p/(q+1),l=Math.min(Math.abs(d),c),i=l==Math.abs(d)?-1:1,q==0)u=!0;else for(n=1;n<=Math.floor((q+1)/2);n++)A=k*n,!(A-l>N)&&A>l&&(O=p-A,O/k==Math.floor(O/k)&&A/k==Math.floor(A/k)&&(e=p,c=i==-1?O:A,d=i==
-1?-A:-O,u=!0))}else u=a(d,c,q,j,!0),N=u-e,e=u,c>0?c+=N:d-=N;else if(u==!0&&q>0){u=0;for(f=1;;){N=q+u*f;N=N==0?1:N;if(!(b(e/(N+1))>b(j)))break;u=f==-1||u>q?++u:u;if(u>25){N=0;break}f=u<=q?f*-1:1}q=N}return{Max:c,Min:d,Range:e,interval:j,divGap:(c-d)/(q+1)}}}(),Ra=function(){var a=function(a,b){this.title.y=a.offsetHeight/2;if(b!==void 0)this.title.text=b};a.prototype={chart:{events:{},margin:[0,0,0,0],backgroundColor:{FCcolor:{alpha:0}}},credits:{href:"http://www.fusioncharts.com?BS=FCHSEvalMark",
text:"FusionCharts",enabled:!0},legend:{enabled:!1},title:{text:"",style:{fontFamily:"Verdana",fontSize:"10px",color:"#666666"}},plotOptions:{series:{}},series:[{}],exporting:{enabled:!1},nativeMessage:!0};return a.prototype.constructor=a}(),sa={"true":{"true":{"true":"center","false":"center"},"false":{"true":"center","false":"center"}},"false":{"true":{"true":"right","false":"left"},"false":{"true":"left","false":"right"}}},Ma=function(){return function(b,d,f,k,u,j,p){var z,t=f.trendStyle,i,P,l,
N,O,A,n,ca,F,ea,r,g;parseInt(t.fontSize,10);if(!(j?!f.showVLines:!f.showTrendlines)){z=0;for(P=b.length;z<P;z+=1)if(b[z].line){i=0;for(l=b[z].line.length;i<l;i+=1)if(N=b[z].line[i],ea=f.numberFormatter.getCleanValue(v(N.startvalue,N.value,0)),r=f.numberFormatter.getCleanValue(v(N.endvalue,v(N.startvalue,N.value,0))),j?ca=d:k&&N.parentyaxis&&/^s$/i.test(N.parentyaxis)?(ca=d[1],g=1):ca=d[0],A=ca.max,n=ca.min,O=!1,A>=ea&&A>=r&&n<=ea&&n<=r){k&&N.parentyaxis&&/^s$/i.test(N.parentyaxis)?O=v(N.valueonleft,
f.trendlineValuesOnOpp)!=="1":k||(O=v(N.valueonright,f.trendlineValuesOnOpp)==="1");A=Boolean(c(N.istrendzone,j?1:0));if(n=(j?f.showVLineLabels:f.showTrendlineLabels)?a(v(N.displayvalue,f.numberFormatter[j?"xAxis":"dataLabels"](O?r:ea,g))):m){if(F=ea<r,O={text:n,textAlign:u?"center":O?"left":"right",align:u?sa[A][!p][F]:O?"right":"left",verticalAlign:u?"bottom":"middle",rotation:0,x:0,y:0,style:t},n=v(N.color,f.trendlineColor),N.alwaysVisible=A,n)O.style=q({},t),O.style.color=n.replace(e,"#")}else O=
void 0;n=v(N.tooltext);F=c(N.thickness,f.trendlineThickness,1);A?ca.plotBands.push({isTrend:!0,color:va(v(N.color,f.trendlineColor),v(N.alpha,f.trendlineAlpha,40)),from:ea,to:r,label:O,zIndex:!f.is3d&&v(N.showontop,f.showTrendlinesOnTop)==="1"?5:3,tooltext:n,alwaysVisible:N.alwaysVisible}):ca.plotLines.push({isTrend:!0,color:va(v(N.color,f.trendlineColor,f.trendlineColor),v(N.alpha,f.trendlineAlpha,99)),value:ea,to:r,width:F,dashStyle:v(N.dashed,f.trendlinesAreDashed)=="1"?Na(c(N.dashlen,f.trendlinesDashLen),
c(N.dashgap,f.trendlinesDashGap),F):void 0,label:O,zIndex:!f.is3d&&v(N.showontop,f.showTrendlinesOnTop)==="1"?5:3,tooltext:n})}}}}}(),Na=function(a,b,c,f){return f||f===void 0?[a,b]:m},Wa=function(){},Ta=function(a,b,c){var f,d=Ta[a];if(!d)d=function(){},d.prototype=c instanceof Wa?c:new Wa,d.prototype.constructor=d,d=Ta[a]=new d;if(c)d.base=c;d.name=a;for(f in b)switch(typeof b[f]){case "object":if(b[f]instanceof Wa){d[f]=b[f][f];break}default:d[f]=b[f];break;case "undefined":delete d[f]}return this instanceof
Ta?(a=function(){},a.prototype=d,a.prototype.constructor=a,new a):d};g.extend(g.hcLib,{BLANKSTRINGPLACEHOLDER:"#BLANK#",BLANKSTRING:m,COLOR_BLACK:"000000",COLOR_GLASS:"rgba(255, 255, 255, 0.3)",COLOR_WHITE:"FFFFFF",COLOR_TRANSPARENT:"rgba(0,0,0,0)",HASHSTRING:"#",BREAKSTRING:"<br />",STRINGSTRING:"string",OBJECTSTRING:"object",COMMASTRING:",",ZEROSTRING:U,SAMPLESTRING:"Ay0",TESTSTR:"Ag",ONESTRING:"1",DECIMALSTRING:w,STRINGUNDEFINED:"undefined",POSITION_TOP:"top",POSITION_RIGHT:"right",POSITION_BOTTOM:"bottom",
POSITION_LEFT:"left",POSITION_CENTER:"center",POSITION_MIDDLE:"middle",POSITION_START:"start",POSITION_END:"end",FC_CONFIG_STRING:"_FCconf",SHAPE_RECT:"rect",HUNDREDSTRING:"100",PXSTRING:"px",COMMASPACE:", ",TEXTANCHOR:"text-anchor",regex:{stripWhitespace:B,dropHash:e,startsRGBA:r,cleanColorCode:x,breakPlaceholder:$,hexcode:/^#?[0-9a-f]{6}/i},fireEvent:function(a,b,c,f){var d=jQuery.Event(b),e="detached"+b;extend(d,c);a[b]&&(a[e]=a[b],a[b]=null);jQuery(a).trigger(d);a[e]&&(a[b]=a[e],a[e]=null);f&&
!d.isDefaultPrevented()&&f(d)},addEvent:f,removeEvent:j,getTouchEvent:i,extend2:q,deltend:function(a,b){if(typeof a!=="object"||typeof b!=="object")return null;u(a,b);return a},imprint:function(a,b,c){var f;if(typeof a!=="object"||a===null)return b;if(typeof b!=="object"||b===null)return a;for(f in b)if(a[f]===void 0||!c&&a[f]===null)a[f]=b[f];return a},pluck:v,pluckNumber:c,getFirstDefinedValue:function(){var a,b,c;b=0;for(c=arguments.length;b<c;b+=1)if((a=arguments[b])||!(a!==!1&&a!==0&&a!=m))return a},
createElement:function(a,b,c){var a=S.createElement(a),f;for(f in b)a.setAttribute(f,b[f]);c&&c.appendChild&&c.appendChild(a);return a},hashify:function(a){return a&&a.replace(/^#?([a-f0-9]+)/ig,"#$1")||"none"},pluckFontSize:function(){var a,b,c;b=0;for(c=arguments.length;b<c;b+=1)if((a=arguments[b])||!(a!==!1&&a!==0))if(!isNaN(a=Number(a)))return a<1?1:a;return 1},getValidValue:Z,getPosition:M,getViewPortDimension:O,bindSelectionEvent:function(a,b,d){var d=d||{},e=a.options.chart,k=a.container,u=
e.zoomType,p=q({},d.attr||{}),d=p["stroke-width"]=c(p.strokeWidth,p["stroke-width"],1),z=M(k),d={chart:a,zoomX:/x/.test(u),zoomY:/y/.test(u),canvasY:a.canvasTop,canvasX:a.canvasLeft,canvasW:a.canvasWidth,canvasH:a.canvasHeight,canvasX2:a.canvasLeft+a.canvasWidth,canvasY2:a.canvasTop+a.canvasHeight,strokeWidth:d,chartPosLeft:z.left,chartPosTop:z.top,attr:p,callback:b};p.stroke=R(p.stroke,"rgba(51,153,255,0.8)");p.fill=R(p.fill,"rgba(185,213,241,0.3)");p.ishot=!0;k&&(j(k,"dragstart drag dragend",aa),
f(k,"dragstart drag dragend",aa,d));e.link&&(j(a.container,"mouseup mousedown",D),f(a.container,"mouseup mousedown",D,d))},createContextMenu:function(a){var b=a.chart,c=b.smartLabel,f=a.labels,d=a.hover||{fill:"rgba(64, 64, 64, 1)"},e=a.attrs||{fill:"rgba(255, 255, 255, 1)"},k=f&&f.style||{fontSize:"12px",color:"000000"},q=f&&f.attrs||{},t=f&&f.hover||{color:"FFFFFF"},u=a.items,j=a.position,i=a.verticalPadding||5,N=a.horizontalPadding||10,l=g.hcLib.Raphael,A={},O,n,ca;if(b)O=M(b.container);else return!1;
var v=function(){ca=this;var a=A.items,b=a.length,f=0,d=0,ha=0,W=0,o,t=A.group;if(!A.menuItems)A.menuItems=[];for(c.setStyle(k);b--;)o=a[b],o=c.getOriSize(o.text),ha||(ha=o.height+2*i),f+=ha,d=Math.max(d,o.width+2*N);A.height=f;A.width=d;A.itemH=ha;ca.setSize(d+5,f+5);if(!t)t=A.group=ca.group("contextmenu-container");A.menuRect?A.menuRect.attr({width:d,height:f}):A.menuRect=ca.rect(0,0,d,f,0,t).shadow(!0).attr({"stroke-width":1,fill:"rgba(255, 255, 255, 1)"});f=a.length;for(b=0;b<f;b+=1)o=a[b],A.menuItems[b]?
A.menuItems[b].label.attr({text:o.text}):(A.menuItems[b]={},A.menuItems[b].box=ca.rect(0,W,d,ha,0,t).attr({stroke:"none"}).attr(e).click(J).hover(x,h),A.menuItems[b].label=ca.text(N/2,W+ha/2,o.text,t).attr({"text-anchor":"start"}).attr(q).css(k).click(J).hover(x,h),A.menuItems[b].box._itemIdx=b,A.menuItems[b].label._itemIdx=b,W+=ha);for(;A.menuItems[b];)A.menuItems[b].box.remove(),A.menuItems[b].label.remove(),A.menuItems.splice(b,1)},F=function(a){var c=a.x,a=a.y,f={x:c+O.left,y:a+O.top},d=A.width,
e=A.height,W=b.chartHeight;c+d>b.chartWidth&&c-d>0&&(f.x-=d);a+e>W&&a-e>0&&(f.y-=e);return f},r=function(){A.hide()},x=function(){var a=A.menuItems[this._itemIdx];n&&clearTimeout(n);a.box.attr(d);a.label.css(t)},h=function(){var a=A.menuItems[this._itemIdx];a.box.attr(e);a.label.css(k);n=setTimeout(A.hide,800)},J=function(a){var b=A.items[this._itemIdx];b.onclick&&b.onclick.call(b,a);A.hide()};A.showItem=function(a){var b=this.menuItems[a],c=this.height,f=this.itemH;if(b&&b._isHidden){c=this.height=
c+f;this.menuRect.attr({height:c});b.box.show();b.label.show();b._isHidden=!1;b=F(j);this.left=b.x;this.top=b.y;for(a+=1;b=this.menuItems[a];)b.box.attr({y:b.box.attrs.y+f}),b.label.attr({y:b.label.attrs.y+f}),a+=1}};A.hideItem=function(a){var b=this.menuItems[a],c=this.height,f=this.itemH;if(b&&!b._isHidden){b.box.hide();b.label.hide();c=this.height=c-f;this.menuRect.attr({height:c});b._isHidden=!0;b=F(j);this.left=b.x;this.top=b.y;for(a+=1;b=this.menuItems[a];)b.box.attr({y:b.box.attrs.y-f}),b.label.attr({y:b.label.attrs.y-
f}),a+=1}};A.redraw=function(){var a=this.paper;this.items=u;a?v.call(this.paper):j&&j.x!==void 0&&j.y!==void 0?(this.paper=l(0,0,100,100),v.call(this.paper),a=F(j),this.left=a.x,this.top=a.y,this.paper.canvas.style.left=this.left+"px",this.paper.canvas.style.top=this.top+"px"):(this.paper=l(0,0,100,100),v.call(this.paper))};A.show=function(a){this.visible=!0;a&&a.x!==void 0&&a.y!==void 0?(a=F(a),this.paper.canvas.style.left=a.x+"px",this.paper.canvas.style.top=a.y+"px"):(this.paper.canvas.style.left=
this.left+"px",this.paper.canvas.style.top=this.top+"px");A.group.show();setTimeout(function(){l.click(r)},50)};A.hide=function(){this.visible=!1;A.group.hide();A.paper.canvas.style.left=-A.width+"px";A.paper.canvas.style.top=-A.height+"px";l.unclick(r)};A.update=function(a){if(a&&a.length)this.items=a,this.redraw()};A.updatePosition=function(a){var c={left:O.left,top:O.top};O=M(b.container);a?(j=a,a=F(a),this.left=a.x,this.top=a.y):(this.left-=c.left-O.left,this.top-=c.top-O.top)};A.add=function(a){var b=
this.paper,c=this.menuItems,f=c.length;c[f]={};c[f].box=b.rect(0,this.height,this.width,this.itemH,0).attr(e).hover(x,h);A.menuItems[f].label=b.text(this.width/2,this.height+this.itemH/2,a.text).attr(q).css(k).hover(x,h);A.menuItems[f].box._itemIdx=f;A.menuItems[f].label._itemIdx=f;this.height+=this.itemH;this.menuRect.attr({height:this.height})};A.removeItems=function(){for(var a=this.menuItems,b=a&&a.length,c;b--;)c=a[b],c.box&&c.box.remove&&c.box.remove(),c.label&&c.label.remove&&c.label.remove();
delete this.menuItems;delete this.items};A.setPosition=function(a){a.x!==void 0&&a.y!==void 0&&this.paper.setViewBox(a.x,a.y,this.width,this.height)};A.destroy=function(){this.removeItems();this.menuRect.remove()};u&&u.length&&(A.redraw(),A.hide());return A},getDefinedColor:function(a,b){return!a&&a!=0&&a!=!1?b:a},getFirstValue:R,getFirstColor:function(a){a=a.split(",")[0];a=a.replace(B,m);a==m&&(a="000000");return a.replace(e,"#")},getColorCodeString:function(a,b){var c="",f,d,e=0,k=b.split(",");
for(d=k.length;e<d;e+=1)f=k[e].split("-"),c+=f.length===2?f[0].indexOf("dark")!=="-1"?ma(a,100-parseInt(f[1],10))+",":Ca(a,100-parseInt(f[1],10))+",":k[e]+",";return c.substring(0,c.length-1)},pluckColor:function(a){if(Z(a))return a=a.split(",")[0],a=a.replace(B,m),a==m&&(a="000000"),a.replace(e,"#")},trimString:function(a){for(var a=a.replace(/^\s\s*/,""),b=/\s/,c=a.length;b.test(a.charAt(c-=1)););return a.slice(0,c+1)},getFirstAlpha:function(a){a=parseInt(a,10);if(isNaN(a)||a>100||a<0)a=100;return a},
parsePointValue:d,parseUnsafeString:a,toPrecision:function(a,b){var c=ka(10,b);return G(a*c)/c},hasTouch:Y,getSentenceCase:function(a){a=a||m;return a.charAt(0).toUpperCase()+a.substr(1)},getCrispValues:function(a,b,c){var f=c%2/2,c=G(a+f)-f,a=G(a+b+f)-f-c;return{position:c,distance:a}},isArray:J,stubFN:function(){},falseFN:function(){return!1},stableSort:function(a,b){var c=a.length,f;for(f=0;f<c;f++)a[f].ss_i=f;a.sort(function(a,c){var f=b(a,c);return f===0?a.ss_i-c.ss_i:f});for(f=0;f<c;f++)delete a[f].ss_i},
hasSVG:ia,isIE:b,getLinkAction:function(a,b){var f=function(a){return a};return function(){var d=c((a.chart||a.map||{}).unescapelinks,1),e=R(this.link,m),k=v(e,this.options&&this.options.chart&&this.options.chart.link||m,this.series&&this.series.chart&&this.series.chart.options&&this.series.chart.options.chart&&this.series.chart.options.chart.link||m),p=k,q,t,u,j,i,l,O,A,n,F;if(k!==void 0){d&&(k=h.decodeURIComponent?h.decodeURIComponent(k):unescape(k));k=k.replace(/^\s+/,m).replace(/\s+$/,m);if(k.search(/^[a-z]*\s*[\-\:]\s*/i)!==
-1)i=k.split(/\s*[\-\:]\s*/)[0].toLowerCase(),F=i.length;setTimeout(function(){switch(i){case "j":k=k.replace(/^j\s*\-/i,"j-");q=k.indexOf("-",2);q===-1?N(k.slice(2)):N(k.substr(2,q-2).replace(/\s/g,m),k.slice(q+1));break;case "javascript":ca(k.replace(/^javascript\s*\:/i,m));break;case "n":k.replace(/^n\s*\-/i,"n-");h.open(f(k.slice(2),d));break;case "f":k=k.replace(/^f\s*\-/i,"f-");q=k.indexOf("-",2);q!==-1?(t=k.substr(2,q-2))&&h.frames[t]?h.frames[t].location=f(k.slice(q+1),d):h.open(f(k.slice(q+
1),d),t):h.open(f(k.slice(2),d));break;case "p":k=k.replace(/p\s*\-/i,"p-");q=k.indexOf("-",2);u=k.indexOf(",",2);q===-1&&(q=1);j=f(k.slice(q+1),d);h.open(j,k.substr(2,u-2),k.substr(u+1,q-u-1)).focus();break;case "newchart":case "newmap":k.charAt(F)===":"&&(q=k.indexOf("-",F+1),n=k.substring(F+1,q),F=q);q=k.indexOf("-",F+1);l=k.substring(F+1,q).toLowerCase();switch(l){case "xmlurl":case "jsonurl":A=k.substring(q+1,k.length);break;case "xml":case "json":var c=O=k.substring(q+1,k.length),e={chart:{}},
v,c=c.toLowerCase();if(a.linkeddata)for(v=0;v<a.linkeddata.length;v+=1)a.linkeddata[v].id.toLowerCase()===c&&(e=a.linkeddata[v].linkedchart||a.linkeddata[v].linkedmap);A=e;l="json"}g.raiseEvent("LinkedChartInvoked",{alias:n,linkType:l.toUpperCase(),data:A},b);break;default:h.location.href=k}g.raiseEvent("linkclicked",{linkProvided:p,linkInvoked:k,linkAction:i&&i.toLowerCase()},b)},0)}}},graphics:{parseAlpha:pa,convertColor:va,getDarkColor:Ca,getLightColor:ma,mapSymbolName:function(a,b){var c=ta.circle,
a=d(a);a>=3&&(c=(b?ta.spoke:ta.poly)+a);return c},getColumnColor:function(a,b,c,f,d,e,k,q,t){var u,j;u=a.split(",");j=b.split(",");e=e.split(",");k=k.split(",");a=a.replace(/\s/g,m).replace(/\,$/,m);t?q={FCcolor:{color:u[0],alpha:j[0]}}:d?(a=u[0],j=j[0],q={FCcolor:{color:Ca(a,75)+","+ma(a,10)+","+Ca(a,90)+","+ma(a,55)+","+Ca(a,80),alpha:j+","+j+","+j+","+j+","+j,ratio:"0,11,14,57,18",angle:q?"90":"0"}},e=[Ca(a,70)]):(b=pa(b,u.length),q={FCcolor:{color:a,alpha:b,ratio:c,angle:q?-f:f}});return[q,{FCcolor:{color:e[0],
alpha:k[0]}}]},getAngle:function(a,b,c){a=Math.atan(b/a)*180/Math.PI;c==2?a=180-a:c==3?a+=180:c==4&&(a=360-a);return a},parseColor:X,getValidColor:function(a){return fa.test(X(a))&&a},HSBtoRGB:function(a){var b=a[0],c=0,f=0,d=0,e=[],e=a[1]/100,a=a[2]/100,k=b/60-Math.floor(b/60),q=a*(1-e),t=a*(1-k*e),e=a*(1-(1-k)*e);switch(Math.floor(b/60)%6){case 0:c=a;f=e;d=q;break;case 1:c=t;f=a;d=q;break;case 2:c=q;f=a;d=e;break;case 3:c=q;f=t;d=a;break;case 4:c=e;f=q;d=a;break;case 5:c=a,f=q,d=t}return e=[G(c*
255),G(f*255),G(d*255)]},RGBtoHSB:function(a){var b=a[0],c=a[1],a=a[2],f=Math.max(Math.max(b,c),a),d=Math.min(Math.min(b,c),a),e=0,k=0;f==d?e=0:f==b?e=(60*(c-a)/(f-d)+360)%360:f==c?e=60*(a-b)/(f-d)+120:f==a&&(e=60*(b-c)/(f-d)+240);k=f==0?0:(f-d)/f;return[G(e),G(k*100),G(f/255*100)]},RGBtoHex:function(a){return("000000"+(a[0]<<16|a[1]<<8|a[2]).toString(16)).slice(-6)},HEXtoRGB:function(a){var a=parseInt(a,16),b=Math.floor(a/65536),c=Math.floor((a-b*65536)/256);return[b,c,Math.floor(a-b*65536-c*256)]}},
setImageDisplayMode:function(a,b,c,f,d,e,k,q){var t=q.width*(f/100),f=q.height*(f/100),q={},u,j=e-d*2;u=k-d*2;var i=function(a,b,c,f,e,k){var q={};switch(a){case "top":q.y=d;break;case "bottom":q.y=k-f-d;break;case "middle":q.y=(k-f)/2}switch(b){case "left":q.x=d;break;case "right":q.x=e-c-d;break;case "middle":q.x=(e-c)/2}return q};switch(a){case "center":q.width=t;q.height=f;q.y=k/2-f/2;q.x=e/2-t/2;break;case "stretch":q.width=e-d*2;q.height=k-d*2;q.y=d;q.x=d;break;case "tile":q.width=t;q.height=
f;q.tileInfo={};q.tileInfo.xCount=a=Math.ceil(j/t);q.tileInfo.yCount=u=Math.ceil(u/f);alignObj=i(b,c,t*a,f*u,e,k);q.y=alignObj.y;q.x=alignObj.x;break;case "fit":a=t/f>j/u?j/t:u/f;q.width=t*a;q.height=f*a;alignObj=i(b,c,q.width,q.height,e,k);q.y=alignObj.y;q.x=alignObj.x;break;case "fill":a=t/f>j/u?u/f:j/t;q.width=t*a;q.height=f*a;alignObj=i(b,c,q.width,q.height,e,k);q.y=alignObj.y;q.x=alignObj.x;break;default:alignObj=i(b,c,t,f,e,k),q.width=t,q.height=f,q.y=alignObj.y,q.x=alignObj.x}return q},setLineHeight:Ka,
supportedStyle:Aa,getAxisLimits:Va,createTrendLine:Ma,getDashStyle:Na,axisLabelAdder:bb,chartAPI:Ta,createDialog:Ra,defaultPaletteOptions:{bgColor:["CBCBCB,E9E9E9","CFD4BE,F3F5DD","C5DADD,EDFBFE","A86402,FDC16D","FF7CA0,FFD1DD"],bgAngle:[270,270,270,270,270],bgRatio:["0,100","0,100","0,100","0,100","0,100"],bgAlpha:["50,50","60,50","40,20","20,10","30,30"],canvasBgColor:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],canvasBgAngle:[0,0,0,0,0],canvasBgAlpha:["100","100","100","100","100"],canvasBgRatio:[m,
m,m,m,m],canvasBorderColor:["545454","545454","415D6F","845001","68001B"],canvasBorderAlpha:[100,100,100,90,100],showShadow:[0,1,1,1,1],divLineColor:["717170","7B7D6D","92CDD6","965B01","68001B"],divLineAlpha:[40,45,65,40,30],altHGridColor:["EEEEEE","D8DCC5","99C4CD","DEC49C","FEC1D0"],altHGridAlpha:[50,35,10,20,15],altVGridColor:["767575","D8DCC5","99C4CD","DEC49C","FEC1D0"],altVGridAlpha:[10,20,10,15,10],anchorBgColor:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],toolTipBgColor:["FFFFFF","FFFFFF",
"FFFFFF","FFFFFF","FFFFFF"],toolTipBorderColor:["545454","545454","415D6F","845001","68001B"],baseFontColor:["555555","60634E","025B6A","A15E01","68001B"],borderColor:["767575","545454","415D6F","845001","68001B"],borderAlpha:[50,50,50,50,50],legendBgColor:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],legendBorderColor:["545454","545454","415D6F","845001","D55979"],plotGradientColor:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],plotBorderColor:["333333","8A8A8A","FFFFFF","FFFFFF","FFFFFF"],plotFillColor:["767575",
"D8DCC5","99C4CD","DEC49C","FEC1D0"],bgColor3D:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],bgAlpha3D:["100","100","100","100","100"],bgAngle3D:[90,90,90,90,90],bgRatio3D:[m,m,m,m,m],canvasBgColor3D:["DDE3D5","D8D8D7","EEDFCA","CFD2D8","FEE8E0"],canvasBaseColor3D:["ACBB99","BCBCBD","C8A06C","96A4AF","FAC7BC"],divLineColor3D:["ACBB99","A4A4A4","BE9B6B","7C8995","D49B8B"],divLineAlpha3D:[100,100,100,100,100],legendBgColor3D:["F0F3ED","F3F3F3","F7F0E8","EEF0F2","FEF8F5"],legendBorderColor3D:["C6CFB8",
"C8C8C8","DFC29C","CFD5DA","FAD1C7"],toolTipbgColor3D:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"],toolTipBorderColor3D:["49563A","666666","49351D","576373","681C09"],baseFontColor3D:["49563A","4A4A4A","49351D","48505A","681C09"],anchorBgColor3D:["FFFFFF","FFFFFF","FFFFFF","FFFFFF","FFFFFF"]}})}})();
(function(g){g.fn.drag=function(b,r,x){var h=typeof b=="string"?b:"",w=g.isFunction(b)?b:g.isFunction(r)?r:null;h.indexOf("drag")!==0&&(h="drag"+h);x=(b==w?r:x)||{};return w?this.bind(h,x,w):this.trigger(h)};var h=g.event,m=h.dispatch||h.handle,U="ontouchstart"in document.documentElement,w=U?"touchstart":"mousedown",S=U?"touchmove touchend":"mousemove mouseup",ia=function(b,r){var x;if(!r.touchXY||!b.originalEvent)return b;x=b.originalEvent||b.sourceEvent;(x=x.changedTouches||x.touches)&&x.length&&
g.extend(b,x[0]);return b},b=h.special,B=b.drag={defaults:{which:1,distance:0,not:":input",handle:null,relative:!1,drop:!1,click:!1,touchXY:!0},datakey:"dragdata",livekey:"livedrag",add:function(b){var r=g.data(this,B.datakey)||g.data(this,B.datakey,g.extend({related:0},B.defaults)),x=b.data||{};r.related+=1;if(!r.live&&b.selector)r.live=!0,h.add(this,"draginit."+B.livekey,B.delegate);g.each(B.defaults,function(b){x[b]!==void 0&&(r[b]=x[b])})},remove:function(){(g.data(this,B.datakey)||{}).related-=
1},setup:function(){if(!g.data(this,B.datakey)){var b=g.extend({related:0},B.defaults);g.data(this,B.datakey,b);h.add(this,w,B.init,b);this.attachEvent&&this.attachEvent("ondragstart",B.dontstart)}},teardown:function(){(g.data(this,B.datakey)||{}).related||(g.removeData(this,B.datakey),h.remove(this,w,B.init),h.remove(this,"draginit",B.delegate),B.textselect(!0),this.detachEvent&&this.detachEvent("ondragstart",B.dontstart))},init:function(e){var r=e.data,x;if((x=(x=e.originalEvent||e.sourceEvent)?
x.changedTouches||x.touches:[])&&x.length)if(x.length>1)return;else ia(e,r);else if(r.which>0&&e.which!=r.which)return;if(!g(e.target).is(r.not)&&(!r.handle||g(e.target).closest(r.handle,e.currentTarget).length))if(r.propagates=1,r.interactions=[B.interaction(this,r)],r.target=e.target,r.pageX=e.pageX,r.pageY=e.pageY,r.dragging=null,x=B.hijack(e,"draginit",r),r.propagates){if((x=B.flatten(x))&&x.length)r.interactions=[],g.each(x,function(){r.interactions.push(B.interaction(this,r))});r.propagates=
r.interactions.length;r.drop!==!1&&b.drop&&b.drop.handler(e,r);B.textselect(!1);h.add(document,S,B.handler,r);if(!U)return!1}},interaction:function(b,r){return{drag:b,callback:new B.callback,droppable:[],offset:g(b)[r.relative?"position":"offset"]()||{top:0,left:0}}},handler:function(e){var r=e.data,g;if(!r.dragging&&(e.type==="mousemove"||e.type==="touchmove")){if(Math.pow(e.pageX-r.pageX,2)+Math.pow(e.pageY-r.pageY,2)<Math.pow(r.distance,2))return;e.target=r.target;B.hijack(e,"dragstart",r);if(r.propagates)r.dragging=
!0}switch(e.type){case "touchmove":g=e.originalEvent||e.sourceEvent,g=g.touches,r.dragging&&(g&&g.length>1||e.preventDefault(),ia(e,r));case "mousemove":if(r.dragging){B.hijack(e,"drag",r);if(r.propagates){r.drop!==!1&&b.drop&&b.drop.handler(e,r);break}e.type="mouseup"}case "touchend":r.dragging&&ia(e,r);case "mouseup":if(h.remove(document,S,B.handler),r.dragging&&(r.drop!==!1&&b.drop&&b.drop.handler(e,r),B.hijack(e,"dragend",r)),B.textselect(!0),r.click===!1&&r.dragging)jQuery.event.triggered=!0,
setTimeout(function(){jQuery.event.triggered=!1},20),r.dragging=!1}},delegate:function(b){var r=[],x,w=g.data(this,"events")||{};g.each(w.live||[],function(w,s){if(s.preType.indexOf("drag")===0&&(x=g(b.target).closest(s.selector,b.currentTarget)[0]))h.add(x,s.origType+"."+B.livekey,s.origHandler,s.data),g.inArray(x,r)<0&&r.push(x)});if(!r.length)return!1;return g(r).bind("dragend."+B.livekey,function(){h.remove(this,"."+B.livekey)})},hijack:function(b,r,x,h,w){if(x){var s={event:b.originalEvent,type:b.type},
ka=r.indexOf("drop")?"drag":"drop",G,V=h||0,K,Y,h=!isNaN(h)?h:x.interactions.length;b.type=r;b.sourceEvent=s.event;b.originalEvent=null;x.results=[];do if((K=x.interactions[V])&&!(r!=="dragend"&&K.cancelled)){Y=B.properties(b,x,K);K.results=[];g(w||K[ka]||x.droppable).each(function(O,l){G=(Y.target=l)?m.call(l,b,Y):null;if(G===!1){if(ka=="drag")K.cancelled=!0,x.propagates-=1;r=="drop"&&(K[ka][O]=null)}else r=="dropinit"&&K.droppable.push(B.element(G)||l);if(r=="dragstart")K.proxy=g(B.element(G)||
K.drag)[0];K.results.push(G);delete b.result;if(r!=="dropinit")return G});x.results[V]=B.flatten(K.results);if(r=="dropinit")K.droppable=B.flatten(K.droppable);r=="dragstart"&&!K.cancelled&&Y.update()}while(++V<h);b.type=s.type;b.originalEvent=s.event;return B.flatten(x.results)}},properties:function(b,r,g){var h=g.callback;h.drag=g.drag;h.proxy=g.proxy||g.drag;h.startX=r.pageX;h.startY=r.pageY;h.deltaX=b.pageX-r.pageX;h.deltaY=b.pageY-r.pageY;h.originalX=g.offset.left;h.originalY=g.offset.top;h.offsetX=
b.pageX-(r.pageX-h.originalX);h.offsetY=b.pageY-(r.pageY-h.originalY);h.drop=B.flatten((g.drop||[]).slice());h.available=B.flatten((g.droppable||[]).slice());return h},element:function(b){if(b&&(b.jquery||b.nodeType==1))return b},flatten:function(b){return g.map(b,function(b){return b&&b.jquery?g.makeArray(b):b&&b.length?B.flatten(b):b})},textselect:function(b){g(document)[b?"unbind":"bind"]("selectstart",B.dontstart).attr("unselectable",b?"off":"on").css("MozUserSelect",b?"":"none")},dontstart:function(){return!1},
callback:function(){}};B.callback.prototype={update:function(){b.drop&&this.available.length&&g.each(this.available,function(e){b.drop.locate(this,e)})}};b.draginit=b.dragstart=b.dragend=B})(jQuery);
(function(g){function h(h){var w=h||window.event,m=[].slice.call(arguments,1),ia=0,b=0,B=0,h=g.event.fix(w);h.type="wheelchange";h.wheelDelta&&(ia=h.wheelDelta/120);h.detail&&(ia=-h.detail/3);B=ia;w.axis!==void 0&&w.axis===w.HORIZONTAL_AXIS&&(B=0,b=-1*ia);w.wheelDeltaY!==void 0&&(B=w.wheelDeltaY/120);w.wheelDeltaX!==void 0&&(b=-1*w.wheelDeltaX/120);m.unshift(h,ia,b,B);return g.event.handle.apply(this,m)}var m=["DOMMouseScroll","mousewheel"];g.event.special.wheelchange={setup:function(){if(this.addEventListener)for(var g=
m.length;g;)this.addEventListener(m[--g],h,!1);else this.onmousewheel=h},teardown:function(){if(this.removeEventListener)for(var g=m.length;g;)this.removeEventListener(m[--g],h,!1);else this.onmousewheel=null}};g.fn.extend({wheelchange:function(g){return g?this.bind("wheelchange",g):this.trigger("wheelchange")},unwheelchange:function(g){return this.unbind("wheelchange",g)}})})(jQuery);
FusionCharts(["private","modules.renderer.js-smartlabel",function(){var g=this.hcLib,h=g.isIE,m=g.hasSVG,U=Math.max,w=/ HtmlUnit/.test(navigator.userAgent),S=document,ia=/ AppleWebKit\//.test(navigator.userAgent),b=!!S.createElement("canvas").getContext,B=!(!b||!S.createElement("canvas").getContext("2d").measureText),e=function(){function e(b,j,i){if(!b||!b.length)return 0;var c=i.getWidthFunction(),d=0,a=0,a=c(b),k=a/b.length,i=j,d=Math.ceil(j/k);if(a<j)return b.length-1;if(d>b.length)i=j-a,d=b.length;
for(;i>0;)if(i=j-c(b.substr(0,d)),a=Math.floor(i/k))d+=a;else return d;for(;i<0;)if(i=j-c(b.substr(0,d)),a=Math.floor(i/k))d+=a;else break;return d}function x(b,e){e=e>5?e:5;this.maxContainers=e<20?e:20;this.last=this.first=null;this.containers={};this.length=0;this.rootNode=b;if(aa){var i=document.createElementNS("http://www.w3.org/2000/svg","svg");i.setAttributeNS("http://www.w3.org/2000/svg","xlink","http://www.w3.org/1999/xlink");i.setAttributeNS("http://www.w3.org/2000/svg","height","0");i.setAttributeNS("http://www.w3.org/2000/svg",
"width","0");this.svgRoot=i;this.rootNode.appendChild(i)}}function $(b,e,i){if(!(typeof b==="undefined"||typeof b==="object")){this.id=b;var c,d;typeof e==="string"&&(e=S.getElementById(e));if(e&&e.offsetWidth&&e.offsetHeight){if(e.appendChild)e.appendChild(c=document.createElement("div")),c.className="_SmartLabel_Container",c.setAttribute("aria-hidden","true"),c.setAttribute("role","presentation")}else if((b=document.getElementsByTagName("body")[0])&&b.appendChild)c=document.createElement("div"),
c.className="_SmartLabel_Container",c.setAttribute("aria-hidden","true"),c.setAttribute("role","presentation"),Z+=1,b.appendChild(c);c=this.parentContainer=c;c.innerHTML=F;if(w||!c.offsetHeight&&!c.offsetWidth)aa=!0;c.innerHTML="";for(d in ka)c.style[d]=ka[d];this.containerManager=new x(c,10);this.showNoEllipses=!i;this.init=!0;this.style={};this.setStyle()}}var fa=g.supportedStyle,s={fontWeight:1,"font-weight":1,fontStyle:1,"font-style":1,fontSize:1,"font-size":1,fontFamily:1,"font-family":1},ka=
{position:"absolute",top:"-9999em",whiteSpace:"nowrap",padding:"0px",width:"1px",height:"1px",overflow:"hidden"},G=ia?0:4.5,V=0,K=/\b_SmartLabel\b/,Y=/\b_SmartLabelBR\b/,O=/(\<[^\<\>]+?\>)|(&(?:[a-z]+|#[0-9]+);|.)/ig,l=RegExp("\\<span[^\\>]+?_SmartLabel[^\\>]{0,}\\>(.*?)\\<\\/span\\>","ig"),n=/<[^>][^<]*[^>]+>/i,F="WgI",aa=!1,D=0,M=0,Z=0,R,v,C;S.getElementsByClassName?(R="getElementsByClassName",v="_SmartLabel",C=!0):(R="getElementsByTagName",v="span",C=!1);x.prototype={get:function(b){var e=this.containers,
i=this.length,c=this.maxContainers,d,a="",k="",k=this.getCanvasFont(b);for(d in fa)b[d]!==void 0&&(a+=fa[d]+":"+b[d]+";");if(!a)return!1;if(e[a]){if(a=e[a],this.first!==a)a.prev&&(a.prev.next=a.next),a.next&&(a.next.prev=a.prev),a.next=this.start,a.prev=null,this.last===a&&(this.last=a.prev),this.start=a}else{if(i>=c)for(b=i-c+1;b--;)this.removeContainer(this.last);a=this.addContainer(a,k)}return a},getCanvasFont:function(f){var e,i=[];if(!b||!B)return!1;for(e in s)f[e]!==void 0&&i.push(f[e]);return i.join(" ")},
setMax:function(b){var e=this.length,b=b>5?b:5,b=b<20?b:20;if(b<e){for(e-=b;e--;)this.removeContainer(this.last);this.length=b}this.maxContainers=b},addContainer:function(b,e){var i,c;this.containers[b]=c={next:null,prev:null,node:null,ellipsesWidth:0,lineHeight:0,dotWidth:0,avgCharWidth:4,keyStr:b,canvasStr:e,charCache:{}};c.next=this.start;c.next&&(c.next.prev=c);this.start=c;this.length+=1;i=c.node=S.createElement("span");this.rootNode.appendChild(i);h&&!m?i.style.setAttribute("cssText",b):i.setAttribute("style",
b);i.setAttribute("aria-hidden","true");i.setAttribute("role","presentation");i.style.display="inline-block";i.innerHTML=F;c.lineHeight=i.offsetHeight;c.avgCharWidth=i.offsetWidth/3;aa?(i=c.svgText=S.createElementNS("http://www.w3.org/2000/svg","text"),i.setAttribute("style",b),this.svgRoot.appendChild(i),i.textContent=F,c.lineHeight=i.getBBox().height,c.avgCharWidth=(i.getBBox().width-G)/3,i.textContent="...",c.ellipsesWidth=i.getBBox().width-G,i.textContent=".",c.dotWidth=i.getBBox().width-G):e?
(i=c.canvas=S.createElement("canvas"),i.style.height=i.style.width="0px",this.rootNode.appendChild(i),c.context=i=i.getContext("2d"),i.font=e,c.ellipsesWidth=i.measureText("...").width,c.dotWidth=i.measureText(".").width):(i.innerHTML="...",c.ellipsesWidth=i.offsetWidth,i.innerHTML=".",c.dotWidth=i.offsetWidth,i.innerHTML="");return c},removeContainer:function(b){var e=b.keyStr;if(e&&this.length&&b)this.length-=1,b.prev&&(b.prev.next=b.next),b.next&&(b.next.prev=b.prev),this.first===b&&(this.first=
b.next),this.last===b&&(this.last=b.prev),delete this.containers[e],delete b}};x.prototype.constructor=x;$.prototype={dispose:function(){var b=this.container,e;if(this.init){if(b&&(e=b.parentNode))e.removeChild(b),delete this.container;delete this.id;delete this.style;delete this.parentContainer;delete this.showNoEllipses}},useEllipsesOnOverflow:function(b){if(this.init)this.showNoEllipses=!b},getWidthFunction:function(){var b=this.context,e=this.container,i=this.containerObj.svgText;return i?function(b){var f;
i.textContent=b;b=i.getBBox();f=b.width-G;if(f<1)f=b.width;return f}:b?function(c){return b.measureText(c).width}:function(b){e.innerHTML=b;return e.offsetWidth}},getSmartText:function(b,j,i,c){if(!this.init)return!1;if(b===void 0||b===null)b="";var d={text:b,maxWidth:j,maxHeight:i,width:null,height:null,oriTextWidth:null,oriTextHeight:null,oriText:b,isTruncated:!1},a=!1,k,q=0,u,N,ca=-1,F=-1,g=-1;k=this.container;var h=this.context,x=0,w=0,s,B,G=[],m=0,ka=this.showNoEllipses?"":"...",ca=this.lineHeight,
fa=function(a){for(var a=a.replace(/^\s\s*/,""),b=/\s/,c=a.length;b.test(a.charAt(c-=1)););return a.slice(0,c+1)};B=this.getWidthFunction();if(k){if(!aa){k.innerHTML=b;d.oriTextWidth=N=k.offsetWidth;d.oriTextHeight=a=k.offsetHeight;if(a<=i&&N<=j)return d.width=d.oriTextWidth=N,d.height=d.oriTextHeight=a,d;if(ca>i)return d.text="",d.width=d.oriTextWidth=0,d.height=d.oriTextHeight=0,d}b=fa(b).replace(/(\s+)/g," ");a=n.test(b);N=this.showNoEllipses?j:j-V;if(a){q=b.replace(O,"$2");b=b.replace(O,'$1<span class="_SmartLabel">$2</span>');
b=b.replace(/(\<br\s*\/*\>)/g,"<span class='_SmartLabel _SmartLabelBR'>$1</span>");k.innerHTML=b;m=k[R](v);h=[];F=ca=-1;a=0;for(B=m.length;a<B;a+=1)if(b=m[a],C||K.test(b.className))if(fa=b.innerHTML,fa!=""){if(fa==" ")F=h.length;else if(fa=="-")ca=h.length;h.push({spaceIdx:F,dashIdx:ca,elem:b});G.push(fa)}delete m;m=0;a=h.length;D=h[0].elem.offsetWidth;if(D>j)return d.text="",d.width=d.oriTextWidth=d.height=d.oriTextHeight=0,d;else D>N&&!this.showNoEllipses&&(N=j-2*M,N>D?ka="..":(N=j-M,N>D?ka=".":
(N=0,ka="")));if(c)for(;m<a;m+=1)b=h[m].elem,c=b.offsetLeft+b.offsetWidth,c>N&&(s||(s=m),k.offsetWidth>j&&(u=m,m=a));else for(;m<a;m+=1)if(b=h[m].elem,B=b.offsetHeight+b.offsetTop,c=b.offsetLeft+b.offsetWidth,G=null,c>N){if(s||(s=m),c>j)F=h[m].spaceIdx,ca=h[m].dashIdx,F>g?(h[F].elem.innerHTML="<br/>",g=F):ca>g?(h[ca].elem.innerHTML=ca===m?"<br/>-":"-<br/>",g=ca):b.parentNode.insertBefore(G=document.createElement("br"),b),b.offsetHeight+b.offsetTop>i?(G?G.parentNode.removeChild(G):g===ca?h[ca].elem.innerHTML=
"-":h[F].elem.innerHTML=" ",u=m,m=a):s=null}else B>i&&(u=m,m=a);if(u<a){d.isTruncated=!0;s=s?s:u;for(m=a-1;m>=s;m-=1)b=h[m].elem,b.parentNode.removeChild(b);for(;m>=0;m-=1)b=h[m].elem,Y.test(b.className)?b.parentNode.removeChild(b):m=0}d.text=k.innerHTML.replace(l,"$1");if(d.isTruncated)d.text+=ka,d.tooltext=q}else{G=b.split("");a=G.length;k="";u=[];s=G[0];this.cache[s]?D=this.cache[s].width:(D=B(s),this.cache[s]={width:D});if(N>D)u=b.substr(0,e(b,N,this)).split(""),m=u.length;else if(D>j)return d.text=
"",d.width=d.oriTextWidth=d.height=d.oriTextHeight=0,d;else ka&&(N=j-2*M,N>D?ka="..":(N=j-M,N>D?ka=".":(N=0,ka="")));x=B(u.join(""));w=this.lineHeight;if(c){for(;m<a;m+=1)if(s=u[m]=G[m],this.cache[s]?D=this.cache[s].width:(D=B(s),this.cache[s]={width:D}),x+=D,x>N&&(k||(k=u.slice(0,-1).join("")),x>j))return d.text=fa(k)+ka,d.tooltext=d.oriText,d.width=B(d.text),d.height=this.lineHeight,d;d.text=u.join("");d.width=x;d.height=this.lineHeight}else{for(;m<a;m+=1)if(s=u[m]=G[m],s===" "&&!h&&(s="&nbsp;"),
this.cache[s]?D=this.cache[s].width:(D=B(s),this.cache[s]={width:D}),x+=D,x>N&&(k||(k=u.slice(0,-1).join("")),x>j))if(F=b.substr(0,u.length).lastIndexOf(" "),ca=b.substr(0,u.length).lastIndexOf("-"),F>g?(x=B(u.slice(g+1,F).join("")),u.splice(F,1,"<br/>"),g=F,c=F+1):ca>g?(ca===u.length-1?(x=B(u.slice(g+1,F).join("")),u.splice(ca,1,"<br/>-")):(x=B(u.slice(g+1,F).join("")),u.splice(ca,1,"-<br/>")),g=ca,c=ca+1):(u.splice(u.length-1,1,"<br/>"+G[m]),c=m),w+=this.lineHeight,w>i)return d.text=fa(k)+ka,d.tooltext=
d.oriText,d.width=q,d.height=w-this.lineHeight,d;else q=U(q,x),k=null,s=e(b.substr(c),N,this),x=B(b.substr(c,s||1)),u.length<c+s&&(u=u.concat(b.substr(u.length,c+s-u.length).split("")),m=u.length-1);q=U(q,x);d.text=u.join("");d.width=q;d.height=w}return d}d.height=k.offsetHeight;d.width=k.offsetWidth}else d.error=Error("Body Tag Missing!");return d},setStyle:function(b){if(!this.init)return!1;if(b!==this.style||this.styleNotSet){if(!b)b=this.style;this.style=b;(this.containerObj=b=this.containerManager.get(b))?
(this.container=b.node,this.context=b.context,this.cache=b.charCache,this.lineHeight=b.lineHeight,V=b.ellipsesWidth,M=b.dotWidth,this.styleNotSet=!1):this.styleNotSet=!0}},getTextSize:function(b,e,i){if(!this.init)return!1;var c={text:b,width:null,height:null,oriTextWidth:null,oriTextHeight:null,isTruncated:!1},d=this.container;if(d&&(d.innerHTML=b,c.oriTextWidth=d.offsetWidth,c.oriTextHeight=d.offsetHeight,c.width=Math.min(c.oriTextWidth,e),c.height=Math.min(c.oriTextHeight,i),c.width<c.oriTextWidth||
c.height<c.oriTextHeight))c.isTruncated=!0;return c},getOriSize:function(b){if(!this.init)return!1;var e={text:b,width:null,height:null},i=this.container,c=this.getWidthFunction(),d=0;if(aa){b=b.split(/(\<br\s*\/*\>)/g);i=b.length;for(e.height=this.lineHeight*i;i--;)d=U(d,c(b[i]));e.width=d}else if(i)i.innerHTML=b,e.width=i.offsetWidth,e.height=i.offsetHeight;return e}};return $.prototype.constructor=$}();g.SmartLabelManager=e}]);
FusionCharts(["private","modules.renderer.js-numberformatter",function(){var g=this.hcLib,h=g.pluckNumber,m=g.extend2,U=g.getValidValue,h=g.pluckNumber,w=g.pluck,S=g.getFirstValue,ia=Math.abs,b=Math.pow,B=Math.round,e="",r="0",x=".",$="-",fa=function(b){return b&&b.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&")};g.NumberFormatter=function(){function g(O,l,n){var F;if(l<=0)return B(O)+e;if(isNaN(l))return O+=e,O.length>12&&O.indexOf(x)!=-1&&(l=12-O.split(x)[0].length,F=b(10,l),O=B(O*F)/F+e),O;F=b(10,l);
O=B(O*F)/F+e;if(n==1){O.indexOf(x)==-1&&(O+=".0");n=O.split(x);l-=n[1].length;for(n=1;n<=l;n++)O+=r}return O}function ka(b,l,n,F){var g=Number(b);if(isNaN(g))return e;var h=e,r=!1,s=e,m=e,v=s=0,s=0,v=b.length;b.indexOf(x)!=-1&&(h=b.substring(b.indexOf(x)+1,b.length),v=b.indexOf(x));g<0&&(r=!0,s=1);s=b.substring(s,v);b=s.length;g=F.length-1;v=F[g];if(b<v)m=s;else for(;b>=v;)m=(b-v?n:e)+s.substr(b-v,v)+m,b-=v,v=(g-=1)<=0?F[0]:F[g],b<v&&(m=s.substring(b,0)+m);h!=e&&(m=m+l+h);r==!0&&(m=$+m);return m}
var G={formatnumber:"1",formatnumberscale:"1",defaultnumberscale:e,numberscaleunit:["K","M"],numberscalevalue:[1E3,1E3],numberprefix:e,numbersuffix:e,decimals:e,forcedecimals:r,yaxisvaluedecimals:"2",decimalseparator:x,thousandseparator:",",thousandseparatorposition:[3],indecimalseparator:e,inthousandseparator:e,sformatnumber:"1",sformatnumberscale:r,sdefaultnumberscale:e,snumberscaleunit:["K","M"],snumberscalevalue:[1E3,1E3],snumberprefix:e,snumbersuffix:e,sdecimals:"2",sforcedecimals:r,syaxisvaluedecimals:"2",
xFormatNumber:r,xFormatNumberScale:r,xDefaultNumberScale:e,xNumberScaleUnit:["K","M"],xNumberScaleValue:[1E3,1E3],xNumberPrefix:e,xNumberSuffix:e},V={mscombidy2d:{formatnumberscale:"1"}},K=function(b,e,n){var F,g,r,s,x,B,v,C,f,j=e.name,i=m({},G),c,d;(r=V[j])&&(i=m(i,r));this.csConf=i;this.chartAPI=e;U(b.numberscaleunit)&&(F=b.numberscaleunit.split(","));if(g=U(b.snumberscaleunit,b.numberscaleunit))g=g.split(",");if(r=U(b.xnumberscaleunit,b.numberscaleunit))r=r.split(",");if(s=U(b.ticknumberscaleunit,
b.numberscaleunit))s=s.split(",");if(x=U(b.ynumberscaleunit,b.numberscaleunit))x=x.split(",");U(b.numberscalevalue)&&(B=b.numberscalevalue.split(","));if(d=U(b.snumberscalevalue,b.numberscalevalue))d=d.split(",");if(v=U(b.xnumberscalevalue,b.numberscalevalue))v=v.split(",");if(C=U(b.ticknumberscalevalue,b.numberscalevalue))C=C.split(",");if(f=U(b.ynumberscalevalue,b.numberscalevalue))f=f.split(",");if(U(b.thousandseparatorposition)){c=b.thousandseparatorposition.split(",");for(var a=c.length,k,q=
G.thousandseparatorposition[0];a--;)k=parseInt(c[a],10),k>0||(k=q),q=c[a]=k}e||(e={});a=h(b.scalerecursively,0);k=h(b.sscalerecursively,a);var q=h(b.xscalerecursively,a),u=h(b.maxscalerecursion,-1),N=h(b.smaxscalerecursion,u),ca=h(b.xmaxscalerecursion,u),J=U(b.scaleseparator," "),Ja=U(b.sscaleseparator,J),ka=U(b.xscaleseparator,J);u||(u=-1);this.baseConf=F={cacheStore:[],formatnumber:w(b.formatnumber,e.formatnumber,i.formatnumber),formatnumberscale:w(b.formatnumberscale,e.formatnumberscale,i.formatnumberscale),
defaultnumberscale:S(b.defaultnumberscale,e.defaultnumberscale,i.defaultnumberscale),numberscaleunit:w(F,e.numberscaleunit,i.numberscaleunit).concat(),numberscalevalue:w(B,e.numberscalevalue,i.numberscalevalue).concat(),numberprefix:S(b.numberprefix,e.numberprefix,i.numberprefix),numbersuffix:S(b.numbersuffix,e.numbersuffix,i.numbersuffix),decimalprecision:parseInt(b.decimals==="auto"?i.decimalprecision:w(b.decimals,b.decimalprecision,e.decimals,i.decimals,e.decimalprecision,i.decimalprecision),10),
forcedecimals:w(b.forcedecimals,e.forcedecimals,i.forcedecimals),decimalseparator:w(b.decimalseparator,e.decimalseparator,i.decimalseparator),thousandseparator:w(b.thousandseparator,e.thousandseparator,i.thousandseparator),thousandseparatorposition:w(c,e.thousandseparatorposition,i.thousandseparatorposition),indecimalseparator:S(b.indecimalseparator,e.indecimalseparator,i.indecimalseparator),inthousandseparator:S(b.inthousandseparator,e.inthousandseparator,i.inthousandseparator),scalerecursively:a,
maxscalerecursion:u,scaleseparator:J};if(U(F.inthousandseparator))this.baseConf._REGinthousandseparator=RegExp(fa(F.inthousandseparator),"g");if(U(F.indecimalseparator))this.baseConf._REGindecimalseparator=RegExp(fa(F.indecimalseparator));this.Y=[];if(!n){n={cacheStore:[],formatnumber:F.formatnumber,formatnumberscale:F.formatnumberscale,defaultnumberscale:F.defaultnumberscale,numberscaleunit:F.numberscaleunit.concat(),numberscalevalue:F.numberscalevalue.concat(),numberprefix:F.numberprefix,numbersuffix:F.numbersuffix,
decimalprecision:F.decimalprecision,forcedecimals:F.forcedecimals,decimalseparator:F.decimalseparator,thousandseparator:F.thousandseparator,thousandseparatorposition:F.thousandseparatorposition,indecimalseparator:F.indecimalseparator,inthousandseparator:F.inthousandseparator,scalerecursively:a,maxscalerecursion:u,scaleseparator:J};if(!e.useScaleRecursively||(n.numberscalevalue&&n.numberscalevalue.length)!=(n.numberscaleunit&&n.numberscaleunit.length))n.scalerecursively=a=0;B={cacheStore:[],formatnumber:n.formatnumber,
formatnumberscale:n.formatnumberscale,defaultnumberscale:n.defaultnumberscale,numberscaleunit:n.numberscaleunit.concat(),numberscalevalue:n.numberscalevalue.concat(),numberprefix:n.numberprefix,numbersuffix:n.numbersuffix,decimalprecision:parseInt(w(b.yaxisvaluedecimals,n.decimalprecision,2)),forcedecimals:w(b.forceyaxisvaluedecimals,n.forcedecimals),decimalseparator:n.decimalseparator,thousandseparator:n.thousandseparator,thousandseparatorposition:n.thousandseparatorposition.concat(),indecimalseparator:n.indecimalseparator,
inthousandseparator:n.inthousandseparator,scalerecursively:a,maxscalerecursion:u,scaleseparator:J};d={cacheStore:[],formatnumber:w(b.sformatnumber,e.sformatnumber,G.sformatnumber),formatnumberscale:w(b.sformatnumberscale,e.sformatnumberscale,G.sformatnumberscale),defaultnumberscale:S(b.sdefaultnumberscale,e.sdefaultnumberscale,n.defaultnumberscale),numberscaleunit:w(g,e.snumberscaleunit,G.snumberscaleunit).concat(),numberscalevalue:w(d,e.snumberscalevalue,G.snumberscalevalue).concat(),numberprefix:S(b.snumberprefix,
e.snumberprefix,G.snumberprefix),numbersuffix:S(b.snumbersuffix,e.snumbersuffix,G.snumbersuffix),decimalprecision:parseInt(w(b.syaxisvaluedecimals,b.sdecimals,b.decimals,e.sdecimals,G.sdecimals),10),forcedecimals:w(b.forcesyaxisvaluedecimals,b.sforcedecimals,b.forcedecimals,e.sforcedecimals,G.sforcedecimals),decimalseparator:w(b.decimalseparator,e.decimalseparator,G.decimalseparator),thousandseparator:w(b.thousandseparator,e.thousandseparator,G.thousandseparator),thousandseparatorposition:n.thousandseparatorposition.concat(),
indecimalseparator:w(b.indecimalseparator,e.indecimalseparator,G.indecimalseparator),inthousandseparator:w(b.inthousandseparator,e.inthousandseparator,G.inthousandseparator),scalerecursively:k,maxscalerecursion:N,scaleseparator:Ja};g=m({},d);g.decimalprecision=parseInt(w(b.sdecimals,b.decimals,b.syaxisvaluedecimals,e.sdecimals,G.sdecimals),10);g.forcedecimals=w(b.sforcedecimals,b.forcedecimals,b.forcesyaxisvaluedecimals,e.sforcedecimals,G.sforcedecimals);g.cacheStore=[];if(!e.useScaleRecursively||
(d.numberscalevalue&&d.numberscalevalue.length)!=(d.numberscaleunit&&d.numberscaleunit.length))d.scalerecursively=k=0;if(/^(bubble|scatter|selectscatter)$/.test(j))B.formatnumber=w(b.yformatnumber,B.formatnumber),B.formatnumberscale=w(b.yformatnumberscale,B.formatnumberscale),B.defaultnumberscale=S(b.ydefaultnumberscale,B.defaultnumberscale),B.numberscaleunit=w(x,B.numberscaleunit),B.numberscalevalue=w(f,B.numberscalevalue),B.numberprefix=w(b.ynumberprefix,B.numberprefix),B.numbersuffix=w(b.ynumbersuffix,
B.numbersuffix),n.formatnumber=w(b.yformatnumber,n.formatnumber),n.formatnumberscale=w(b.yformatnumberscale,n.formatnumberscale),n.defaultnumberscale=S(b.ydefaultnumberscale,n.defaultnumberscale),n.numberscaleunit=w(b.ynumberscaleunit,n.numberscaleunit.concat()),n.numberscalevalue=w(b.ynumberscalevalue,n.numberscalevalue.concat()),n.numberprefix=w(b.ynumberprefix,n.numberprefix),n.numbersuffix=w(b.ynumbersuffix,n.numbersuffix);if(/^(mscombidy2d|mscombidy3d)$/.test(j))d.formatnumberscale=h(b.sformatnumberscale,
"1");if(/^(pie2d|pie3d|doughnut2d|doughnut3d|marimekko|pareto2d|pareto3d)$/.test(j))n.decimalprecision=w(b.decimals,"2");a&&(n.numberscalevalue.push(1),n.numberscaleunit.unshift(n.defaultnumberscale),B.numberscalevalue.push(1),B.numberscaleunit.unshift(B.defaultnumberscale));k&&(d.numberscalevalue.push(1),d.numberscaleunit.unshift(d.defaultnumberscale),g.numberscalevalue.push(1),g.numberscaleunit.unshift(g.defaultnumberscale));this.Y[0]={yAxisLabelConf:B,dataLabelConf:n};this.Y[1]={yAxisLabelConf:d,
dataLabelConf:g};this.paramLabels=n;this.param1=B;this.param2=d;this.paramLabels2=g}this.paramX={cacheStore:[],formatnumber:w(b.xformatnumber,F.formatnumber),formatnumberscale:w(b.xformatnumberscale,F.formatnumberscale),defaultnumberscale:S(b.xdefaultnumberscale,F.defaultnumberscale),numberscaleunit:w(r,F.numberscaleunit.concat()),numberscalevalue:w(v,F.numberscalevalue.concat()),numberprefix:w(b.xnumberprefix,F.numberprefix),numbersuffix:w(b.xnumbersuffix,F.numbersuffix),decimalprecision:parseInt(w(b.xaxisvaluedecimals,
b.xaxisvaluesdecimals,F.decimalprecision,2),10),forcedecimals:w(b.forcexaxisvaluedecimals,0),decimalseparator:F.decimalseparator,thousandseparator:F.thousandseparator,thousandseparatorposition:F.thousandseparatorposition.concat(),indecimalseparator:F.indecimalseparator,inthousandseparator:F.inthousandseparator,scalerecursively:q,maxscalerecursion:ca,scaleseparator:ka};if(!e.useScaleRecursively||(this.paramX.numberscalevalue&&this.paramX.numberscalevalue.length)!=(this.paramX.numberscaleunit&&this.paramX.numberscaleunit.length))this.paramX.scalerecursively=
q=0;q&&(this.paramX.numberscalevalue.push(1),this.paramX.numberscaleunit.unshift(this.paramX.defaultnumberscale));this.paramScale={cacheStore:[],formatnumber:w(b.tickformatnumber,F.formatnumber),formatnumberscale:w(b.tickformatnumberscale,F.formatnumberscale),defaultnumberscale:S(b.tickdefaultnumberscale,F.defaultnumberscale),numberscaleunit:w(s,F.numberscaleunit.concat()),numberscalevalue:w(C,F.numberscalevalue.concat()),numberprefix:w(b.ticknumberprefix,F.numberprefix),numbersuffix:w(b.ticknumbersuffix,
F.numbersuffix),decimalprecision:parseInt(w(b.tickvaluedecimals,F.decimalprecision,"2")),forcedecimals:w(b.forcetickvaluedecimals,F.forcedecimals,0),decimalseparator:F.decimalseparator,thousandseparator:F.thousandseparator,thousandseparatorposition:F.thousandseparatorposition.concat(),indecimalseparator:F.indecimalseparator,inthousandseparator:F.inthousandseparator,scalerecursively:a,maxscalerecursion:u,scaleseparator:J};a&&(this.paramScale.numberscalevalue.push(1),this.paramScale.numberscaleunit.unshift(this.paramScale.defaultnumberscale));
this.timeConf={inputDateFormat:w(b.inputdateformat,b.dateformat,"mm/dd/yyyy"),outputDateFormat:w(b.outputdateformat,b.inputdateformat,b.dateformat,"mm/dd/yyyy"),days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],months:["January","February","March","April","May","June","July","August","September","October","November","December"],daySuffix:["","st","nd","rd","th","th","th","th","th","th","th","th","th","th","th","th","th","th","th","th","th","st","nd","rd","th","th","th",
"th","th","th","th","st"]}};K.prototype={cleaneValueCacheStore:{},percentStrCacheStore:{},dispose:function(){this.Y&&delete this.Y;this.cleaneValueCacheStore&&delete this.cleaneValueCacheStore;this.percentStrCacheStore&&delete this.percentStrCacheStore;this.paramLabels&&delete this.paramLabels;this.param1&&delete this.param1;this.param2&&delete this.param2;this.paramLabels2&&delete this.paramLabels2;this.csConf&&delete this.csConf;this.chartAPI&&delete this.chartAPI;this.baseConf&&delete this.baseConf;
this.timeConf&&delete this.timeConf;this.paramX&&delete this.paramX;this.paramScale&&delete this.paramScale},parseMLAxisConf:function(b,e){var n=this.baseConf,g=this.csConf,r=this.chartAPI,s=h(b.scalerecursively,n.scalerecursively),x=h(b.maxscalerecursion,n.maxscalerecursion),m=U(b.scaleseparator,n.scaleseparator),B,v,C,f,j,i,e=h(e,this.Y.length);U(b.numberscaleunit)&&(B=b.numberscaleunit.split(","));U(b.numberscalevalue)&&(v=b.numberscalevalue.split(","));x||(x=-1);if(U(b.thousandseparatorposition)){C=
b.thousandseparatorposition.split(",");f=C.length;for(i=G.thousandseparatorposition[0];f--;)(j=h(ia(C[f])))?i=j:j=i,C[f]=j}n={cacheStore:[],formatnumber:w(b.formatnumber,n.formatnumber),formatnumberscale:w(b.formatnumberscale,n.formatnumberscale),defaultnumberscale:S(b.defaultnumberscale,n.defaultnumberscale),numberscaleunit:w(B,n.numberscaleunit).concat(),numberscalevalue:w(v,n.numberscalevalue).concat(),numberprefix:S(b.numberprefix,n.numberprefix),numbersuffix:S(b.numbersuffix,n.numbersuffix),
forcedecimals:w(b.forcedecimals,n.forcedecimals),decimalprecision:parseInt(b.decimals==="auto"?g.decimalprecision:w(b.decimals,n.decimalprecision),10),decimalseparator:w(b.decimalseparator,n.decimalseparator),thousandseparator:w(b.thousandseparator,n.thousandseparator),thousandseparatorposition:w(C,n.thousandseparatorposition),indecimalseparator:S(b.indecimalseparator,n.indecimalseparator),inthousandseparator:S(b.inthousandseparator,n.inthousandseparator),scalerecursively:s,maxscalerecursion:x,scaleseparator:m};
if(!r.useScaleRecursively||(n.numberscalevalue&&n.numberscalevalue.length)!=(n.numberscaleunit&&n.numberscaleunit.length))n.scalerecursively=s=0;r={cacheStore:[],formatnumber:n.formatnumber,formatnumberscale:n.formatnumberscale,defaultnumberscale:n.defaultnumberscale,numberscaleunit:n.numberscaleunit.concat(),numberscalevalue:n.numberscalevalue.concat(),numberprefix:n.numberprefix,numbersuffix:n.numbersuffix,decimalprecision:parseInt(w(b.yaxisvaluedecimals,n.decimalprecision,2)),forcedecimals:w(b.forceyaxisvaluedecimals,
n.forcedecimals),decimalseparator:n.decimalseparator,thousandseparator:n.thousandseparator,thousandseparatorposition:n.thousandseparatorposition.concat(),indecimalseparator:n.indecimalseparator,inthousandseparator:n.inthousandseparator,scalerecursively:s,maxscalerecursion:x,scaleseparator:m};s&&(n.numberscalevalue.push(1),n.numberscaleunit.unshift(n.defaultnumberscale),r.numberscalevalue.push(1),r.numberscaleunit.unshift(r.defaultnumberscale));this.Y[e]={dataLabelConf:n,yAxisLabelConf:r}},percentValue:function(b){var e=
this.percentStrCacheStore[b];e===void 0&&(e=isNaN(this.paramLabels.decimalprecision)?"2":this.paramLabels.decimalprecision,e=this.percentStrCacheStore[b]=ka(g(b,e,this.paramLabels.forcedecimals),this.paramLabels.decimalseparator,this.paramLabels.thousandseparator,this.paramLabels.thousandseparatorposition)+"%");return e},getCleanValue:function(b,l){var n=this.cleaneValueCacheStore[b];if(n===void 0){var n=b,g=this.baseConf;n+=e;g._REGinthousandseparator&&(n=n.replace(g._REGinthousandseparator,e));
g._REGindecimalseparator&&(n=n.replace(g._REGindecimalseparator,x));n=parseFloat(n);n=isFinite(n)?n:NaN;this.cleaneValueCacheStore[b]=n=isNaN(n)?null:l?ia(n):n}return n},dataLabels:function(b,e){var n=this.Y[e]||(e?this.Y[1]:this.Y[0]),g,n=n&&n.dataLabelConf||this.baseConf;g=n.cacheStore[b];g===void 0&&(g=n.cacheStore[b]=Y(b,n));return g},yAxis:function(b,e){var n=this.Y[e]||(e?this.Y[1]:this.Y[0]),g,n=n&&n.yAxisLabelConf||this.baseConf;g=n.cacheStore[b];g===void 0&&(g=n.cacheStore[b]=Y(b,n));return g},
xAxis:function(b){var e=this.paramX.cacheStore[b];e===void 0&&(e=this.paramX.cacheStore[b]=Y(b,this.paramX));return e},sYAxis:function(b){var e=this.Y[1],n,e=e&&e.yAxisLabelConf||this.baseConf;n=e.cacheStore[b];n===void 0&&(n=e.cacheStore[b]=Y(b,e));return n},scale:function(b){var e=this.paramScale.cacheStore[b];e===void 0&&(e=this.paramScale.cacheStore[b]=Y(b,this.paramScale));return e},getCleanTime:function(b){var e;this.timeConf.inputDateFormat&&Date.parseExact&&(e=Date.parseExact(b,this.timeConf.inputDateFormat));
return e&&e.getTime()},getDateValue:function(b){var e,n,g,b=/^dd/.test(this.timeConf.inputDateFormat)&&b&&b.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,"$2/$1/$3")||b;e=new Date(b);n=e.getTime();!n&&b&&/\:/.test(b)&&(b=b.split(":"),n=h(b[0],0),g=h(b[1],0),b=h(b[2],0),n=n>23?n===24&&g===0&&b===0?n:23:n,g=g>59?59:g,b=b>59?59:b,e=new Date,e.setHours(n),e.setMinutes(g),e.setSeconds(b),n=e.getTime());return{ms:n,date:e}},getFormatedDate:function(b,g){var n=typeof b==="object"&&b||new Date(b),h=this.timeConf,
s=w(g,h.outputDateFormat),x=n.getFullYear(),m=n.getMonth(),B=n.getDate(),G=n.getDay(),v=n.getMinutes(),C=n.getSeconds(),n=n.getHours(),v=v>9?e+v:r+v,C=C>9?e+C:r+C,n=n>9?e+n:r+n;s.match(/dnl/)&&(s=s.replace(/dnl/ig,h.days[G]));s.match(/dns/)&&(s=s.replace(/dns/ig,h.days[G]&&h.days[G].substr(0,3)));s.match(/dd/)&&(s=s.replace(/dd/ig,B));s.match(/mnl/)&&(s=s.replace(/mnl/ig,h.months[m]));s.match(/mns/)&&(s=s.replace(/mns/ig,h.months[m]&&h.months[m].substr(0,3)));s.match(/mm/)&&(s=s.replace(/mm/ig,m+
1));s.match(/yyyy/)&&(s=s.replace(/yyyy/ig,x));s.match(/yy/)&&(s=s.replace(/yy/ig,(x%1E3%100+"").replace(/^(\d)$/,"0$1")));s.match(/hh12/)&&(s=s.replace(/hh12/ig,n%12||12));s.match(/hh/)&&(s=s.replace(/hh/ig,n));s.match(/mn/)&&(s=s.replace(/mn/ig,v));s.match(/ss/)&&(s=s.replace(/ss/ig,C));s.match(/ampm/)&&(s=s.replace(/ampm/ig,n<12?"AM":"PM"));s.match(/ds/)&&(s=s.replace(/ds/ig,h.daySuffix[B]));return s}};K.prototype.constructor=K;var Y=function(b,l){if(b!==null){var b=Number(b),n=b+e,r;r=l.formatnumberscale==
1?l.defaultnumberscale:e;var m;m=(m=n.split(x)[1])?m.length:l.forcedecimals?"2":e;if(l.formatnumberscale==1){var B,n=b;r=l.numberscalevalue;B=l.numberscaleunit;var G={},K=l.defaultnumberscale,R=0,v,C=[],f=[];if(l.scalerecursively){for(R=0;R<r.length;R++)if(v=h(r[R])||1E3,Math.abs(Number(n))>=v&&R<r.length-1)K=n%v,n=(n-K)/v,K!=0&&(C.push(K),f.push(B[R]));else{C.push(n);f.push(B[R]);break}C.reverse();f.reverse();G.value=C;G.scale=f}else{if(r.length===B.length)for(R=0;R<r.length;R++)if((v=h(r[R])||1E3)&&
Math.abs(Number(n))>=v)K=B[R]||e,n=Number(n)/v;else break;G.value=n;G.scale=K}B=G;b=n=B.value;r=B.scale}if(l.scalerecursively&&l.formatnumberscale!=0){r=B.value;B=B.scale;G=l.maxscalerecursion==-1?r.length:Math.min(r.length,l.maxscalerecursion);if(l.formatnumber==1){n="";for(C=0;C<G;C++)R=C==0?r[C]:Math.abs(r[C]),v=R+e,C==G-1&&(v=g(R,w(l.decimalprecision,m),l.forcedecimals)),n=n+ka(v,l.decimalseparator,l.thousandseparator,l.thousandseparatorposition)+B[C]+(C<G-1?l.scaleseparator:"")}else{n="";for(C=
0;C<G;C++)n=n+(C==0?r[C]:Math.abs(r[C])+e)+B[C]+(C<G-1?l.scaleseparator:"")}n=(l.numberprefix||e)+n+(l.numbersuffix||e);delete r;delete B}else l.formatnumber==1&&(n=g(b,w(l.decimalprecision,m),l.forcedecimals),n=ka(n,l.decimalseparator,l.thousandseparator,l.thousandseparatorposition)),n=(l.numberprefix||e)+n+r+(l.numbersuffix||e);return n}};return K}()}]);
FusionCharts(["private","modules.renderer.js-raphael",function(){var g=this.hcLib,h="",m,U=window.Raphael,w,S=window.parent!==window,ia=navigator.userAgent.match(/(iPad|iPhone|iPod)/g)?!0:!1;(function(b){var h=/[\.\/]/,e=function(){},r=function(b,e){return b-e},x,m,w={n:{}},s=g.eve=function(b,e){var g=m,h=Array.prototype.slice.call(arguments,2),B=s.listeners(b),w=0,l,n=[],F={},fa=[],D=x;x=b;for(var M=m=0,U=B.length;M<U;M++)"zIndex"in B[M]&&(n.push(B[M].zIndex),B[M].zIndex<0&&(F[B[M].zIndex]=B[M]));
for(n.sort(r);n[w]<0;)if(l=F[n[w++]],fa.push(l.apply(e,h)),m)return m=g,fa;for(M=0;M<U;M++)if(l=B[M],"zIndex"in l)if(l.zIndex==n[w]){fa.push(l.apply(e,h));if(m)break;do if(w++,(l=F[n[w]])&&fa.push(l.apply(e,h)),m)break;while(l)}else F[l.zIndex]=l;else if(fa.push(l.apply(e,h)),m)break;m=g;x=D;return fa.length?fa:null};s.listeners=function(b){var b=b.split(h),e=w,g,s,r,m,l,n,x,aa=[e],D=[];r=0;for(m=b.length;r<m;r++){x=[];l=0;for(n=aa.length;l<n;l++){e=aa[l].n;g=[e[b[r]],e["*"]];for(s=2;s--;)if(e=g[s])x.push(e),
D=D.concat(e.f||[])}aa=x}return D};s.on=function(b,g){for(var s=b.split(h),r=w,m=0,x=s.length;m<x;m++)r=r.n,!r[s[m]]&&(r[s[m]]={n:{}}),r=r[s[m]];r.f=r.f||[];m=0;for(x=r.f.length;m<x;m++)if(r.f[m]==g)return e;r.f.push(g);return function(b){if(+b==+b)g.zIndex=+b}};s.stop=function(){m=1};s.nt=function(b){if(b)return RegExp("(?:\\.|\\/|^)"+b+"(?:\\.|\\/|$)").test(x);return x};s.off=s.unbind=function(b,e){var g=b.split(h),s,r,m,l,n,x,aa=[w];l=0;for(n=g.length;l<n;l++)for(x=0;x<aa.length;x+=m.length-2){m=
[x,1];s=aa[x].n;if(g[l]!="*")s[g[l]]&&m.push(s[g[l]]);else for(r in s)s.hasOwnProperty(r)&&m.push(s[r]);aa.splice.apply(aa,m)}l=0;for(n=aa.length;l<n;l++)for(s=aa[l];s.n;){if(e){if(s.f){x=0;for(g=s.f.length;x<g;x++)if(s.f[x]==e){s.f.splice(x,1);break}!s.f.length&&delete s.f}for(r in s.n)if(s.n.hasOwnProperty(r)&&s.n[r].f){m=s.n[r].f;x=0;for(g=m.length;x<g;x++)if(m[x]==e){m.splice(x,1);break}!m.length&&delete s.n[r].f}}else for(r in delete s.f,s.n)s.n.hasOwnProperty(r)&&s.n[r].f&&delete s.n[r].f;s=
s.n}};s.once=function(b,e){var g=function(){var r=e.apply(this,arguments);s.unbind(b,g);return r};return s.on(b,g)};s.version="0.3.4";s.toString=function(){return"You are running Eve 0.3.4"};typeof module!="undefined"&&module.exports?module.exports=s:typeof define!="undefined"?define("eve",[],function(){return s}):b.eve=s})(g);m=g.eve;(function(){function b(a){if(b._url)b._url=window.location.href.replace(/#.*?$/,h);if(b.is(a,"function"))return O?a():m.on("raphael.DOMload",a);else if(b.is(a,ta))return b._engine.create[v](b,
a.splice(0,3+b.is(a[0],ma))).add(a);else{var c=Array.prototype.slice.call(arguments,0);if(b.is(c[c.length-1],"function")){var d=c.pop();return O?d.call(b._engine.create[v](b,c)):m.on("raphael.DOMload",function(){d.call(b._engine.create[v](b,c))})}else return b._engine.create[v](b,arguments)}}function g(b){if(Object(b)!==b)return b;var a=new b.constructor,c;for(c in b)b[aa](c)&&(a[c]=g(b[c]));return a}function e(){return this.hex}function r(b,a){for(var c=[],d=0,f=b.length;f-2*!a>d;d+=2){var e=[{x:+b[d-
2],y:+b[d-1]},{x:+b[d],y:+b[d+1]},{x:+b[d+2],y:+b[d+3]},{x:+b[d+4],y:+b[d+5]}];a?d?f-4==d?e[3]={x:+b[0],y:+b[1]}:f-2==d&&(e[2]={x:+b[0],y:+b[1]},e[3]={x:+b[2],y:+b[3]}):e[0]={x:+b[f-2],y:+b[f-1]}:f-4==d?e[3]=e[2]:d||(e[0]={x:+b[d],y:+b[d+1]});c.push(["C",(-e[0].x+6*e[1].x+e[2].x)/6,(-e[0].y+6*e[1].y+e[2].y)/6,(e[1].x+6*e[2].x-e[3].x)/6,(e[1].y+6*e[2].y-e[3].y)/6,e[2].x,e[2].y])}return c}function x(b,a,c,d,e,f,y,o,E){E==null&&(E=1);for(var E=(E>1?1:E<0?0:E)/2,k=[-0.1252,0.1252,-0.3678,0.3678,-0.5873,
0.5873,-0.7699,0.7699,-0.9041,0.9041,-0.9816,0.9816],ha=[0.2491,0.2491,0.2335,0.2335,0.2032,0.2032,0.1601,0.1601,0.1069,0.1069,0.0472,0.0472],q=0,W=0;W<12;W++){var p=E*k[W]+E,u=p*(p*(-3*b+9*c-9*e+3*y)+6*b-12*c+6*e)-3*b+3*c,p=p*(p*(-3*a+9*d-9*f+3*o)+6*a-12*d+6*f)-3*a+3*d;q+=ha[W]*va(u*u+p*p)}return E*q}function U(b,a,c,d,e,f,y,o,E){if(!(E<0||x(b,a,c,d,e,f,y,o)<E)){var k=0.5,ha=1-k,W;for(W=x(b,a,c,d,e,f,y,o,ha);ca(W-E)>0.01;)k/=2,ha+=(W<E?1:-1)*k,W=x(b,a,c,d,e,f,y,o,ha);return ha}}function fa(a,c,d){for(var a=
b._path2curve(a),c=b._path2curve(c),e,f,y,o,E,k,ha,W,q,p,t=d?0:[],Q=0,Ea=a.length;Q<Ea;Q++)if(q=a[Q],q[0]=="M")e=E=q[1],f=k=q[2];else{q[0]=="C"?(q=[e,f].concat(q.slice(1)),e=q[6],f=q[7]):(q=[e,f,e,f,E,k,E,k],e=E,f=k);for(var i=0,z=c.length;i<z;i++)if(p=c[i],p[0]=="M")y=ha=p[1],o=W=p[2];else{p[0]=="C"?(p=[y,o].concat(p.slice(1)),y=p[6],o=p[7]):(p=[y,o,y,o,ha,W,ha,W],y=ha,o=W);var na;var j=q,oa=p;na=d;var ja=b.bezierBBox(j),A=b.bezierBBox(oa);if(b.isBBoxIntersect(ja,A)){for(var ja=x.apply(0,j),A=x.apply(0,
oa),ja=~~(ja/5),A=~~(A/5),H=[],gb=[],P={},jb=na?0:[],Pa=0;Pa<ja+1;Pa++){var g=b.findDotsAtSegment.apply(b,j.concat(Pa/ja));H.push({x:g.x,y:g.y,t:Pa/ja})}for(Pa=0;Pa<A+1;Pa++)g=b.findDotsAtSegment.apply(b,oa.concat(Pa/A)),gb.push({x:g.x,y:g.y,t:Pa/A});for(Pa=0;Pa<ja;Pa++)for(j=0;j<A;j++){var n=H[Pa],ab=H[Pa+1],oa=gb[j],g=gb[j+1],s=ca(ab.x-n.x)<0.001?"y":"x",r=ca(g.x-oa.x)<0.001?"y":"x",L;b:{L=n.x;var l=n.y,h=ab.x,v=ab.y,m=oa.x,qa=oa.y,ga=g.x,Xa=g.y;if(!(u(L,h)<N(m,ga)||N(L,h)>u(m,ga)||u(l,v)<N(qa,
Xa)||N(l,v)>u(qa,Xa))){var cb=(L-h)*(qa-Xa)-(l-v)*(m-ga);if(cb){var hb=((L*v-l*h)*(m-ga)-(L-h)*(m*Xa-qa*ga))/cb,cb=((L*v-l*h)*(qa-Xa)-(l-v)*(m*Xa-qa*ga))/cb,da=+hb.toFixed(2),B=+cb.toFixed(2);if(!(da<+N(L,h).toFixed(2)||da>+u(L,h).toFixed(2)||da<+N(m,ga).toFixed(2)||da>+u(m,ga).toFixed(2)||B<+N(l,v).toFixed(2)||B>+u(l,v).toFixed(2)||B<+N(qa,Xa).toFixed(2)||B>+u(qa,Xa).toFixed(2))){L={x:hb,y:cb};break b}}}L=void 0}L&&P[L.x.toFixed(4)]!=L.y.toFixed(4)&&(P[L.x.toFixed(4)]=L.y.toFixed(4),n=n.t+ca((L[s]-
n[s])/(ab[s]-n[s]))*(ab.t-n.t),oa=oa.t+ca((L[r]-oa[r])/(g[r]-oa[r]))*(g.t-oa.t),n>=0&&n<=1&&oa>=0&&oa<=1&&(na?jb++:jb.push({x:L.x,y:L.y,t1:n,t2:oa})))}na=jb}else na=na?0:[];if(d)t+=na;else{ja=0;for(A=na.length;ja<A;ja++)na[ja].segment1=Q,na[ja].segment2=i,na[ja].bez1=q,na[ja].bez2=p;t=t.concat(na)}}}return t}function s(b,a,c,d,e,f){b!=null?(this.a=+b,this.b=+a,this.c=+c,this.d=+d,this.e=+e,this.f=+f):(this.a=1,this.c=this.b=0,this.d=1,this.f=this.e=0)}function ka(){return this.x+j+this.y+j+this.width+
" \u00d7 "+this.height}function G(b,a,c,d,e,f){function y(b,a){var Ha,c,d,e;d=b;for(c=0;c<8;c++){e=((k*d+E)*d+o)*d-b;if(ca(e)<a)return d;Ha=(3*k*d+2*E)*d+o;if(ca(Ha)<1.0E-6)break;d-=e/Ha}Ha=0;c=1;d=b;if(d<Ha)return Ha;if(d>c)return c;for(;Ha<c;){e=((k*d+E)*d+o)*d;if(ca(e-b)<a)break;b>e?Ha=d:c=d;d=(c-Ha)/2+Ha}return d}var o=3*a,E=3*(d-a)-o,k=1-o-E,ha=3*c,q=3*(e-c)-ha,W=1-ha-q;return function(b,a){var Ha=y(b,a);return((W*Ha+q)*Ha+ha)*Ha}(b,1/(200*f))}function V(b,a){var c=[],d={};this.ms=a;this.times=
1;if(b){for(var e in b)b[aa](e)&&(d[sa(e)]=b[e],c.push(sa(e)));c.sort(z)}this.anim=d;this.top=c[c.length-1];this.percents=c}function K(a,d,e,f,y,E){var e=sa(e),k,ha,q,W,p,u,t=a.ms,Q={},Ea={},j={};if(f){u=0;for(oa=xa.length;u<oa;u++){var z=xa[u];if(z.el.id==d.id&&z.anim==a){z.percent!=e?(xa.splice(u,1),q=1):ha=z;d.attr(z.totalOrigin);break}}}else f=+Ea;u=0;for(var oa=a.percents.length;u<oa;u++)if(a.percents[u]==e||a.percents[u]>f*a.top){e=a.percents[u];p=a.percents[u-1]||0;t=t/a.top*(e-p);W=a.percents[u+
1];k=a.anim[e];break}else f&&d.attr(a.anim[a.percents[u]]);if(k){if(ha)ha.initstatus=f,ha.start=new Date-ha.ms*f;else{for(var ja in k)if(k[aa](ja)&&(Ta[aa](ja)||d.ca[ja]))switch(Q[ja]=d.attr(ja),Q[ja]==null&&(Q[ja]=Wa[ja]),Ea[ja]=k[ja],Ta[ja]){case ma:j[ja]=(Ea[ja]-Q[ja])/t;break;case "colour":Q[ja]=b.getRGB(Q[ja]);u=b.getRGB(Ea[ja]);j[ja]={r:(u.r-Q[ja].r)/t,g:(u.g-Q[ja].g)/t,b:(u.b-Q[ja].b)/t};break;case "path":u=o(Q[ja],Ea[ja]);z=u[1];Q[ja]=u[0];j[ja]=[];u=0;for(oa=Q[ja].length;u<oa;u++){j[ja][u]=
[0];for(var A=1,N=Q[ja][u].length;A<N;A++)j[ja][u][A]=(z[u][A]-Q[ja][u][A])/t}break;case "transform":u=d._;if(oa=na(u[ja],Ea[ja])){Q[ja]=oa.from;Ea[ja]=oa.to;j[ja]=[];j[ja].real=!0;u=0;for(oa=Q[ja].length;u<oa;u++){j[ja][u]=[Q[ja][u][0]];A=1;for(N=Q[ja][u].length;A<N;A++)j[ja][u][A]=(Ea[ja][u][A]-Q[ja][u][A])/t}}else oa=d.matrix||new s,u={_:{transform:u.transform},getBBox:function(){return d.getBBox(1)}},Q[ja]=[oa.a,oa.b,oa.c,oa.d,oa.e,oa.f],gb(u,Ea[ja]),Ea[ja]=u._.transform,j[ja]=[(u.matrix.a-oa.a)/
t,(u.matrix.b-oa.b)/t,(u.matrix.c-oa.c)/t,(u.matrix.d-oa.d)/t,(u.matrix.e-oa.e)/t,(u.matrix.f-oa.f)/t];break;case "csv":oa=i(k[ja])[c](l);z=i(Q[ja])[c](l);if(ja=="clip-rect"){Q[ja]=z;j[ja]=[];for(u=z.length;u--;)j[ja][u]=(oa[u]-Q[ja][u])/t}Ea[ja]=oa;break;default:oa=[][C](k[ja]);z=[][C](Q[ja]);j[ja]=[];for(u=d.ca[ja].length;u--;)j[ja][u]=((oa[u]||0)-(z[u]||0))/t}u=k.easing;ja=b.easing_formulas[u];if(!ja)if((ja=i(u).match(Va))&&ja.length==5){var Pa=ja;ja=function(b){return G(b,+Pa[1],+Pa[2],+Pa[3],
+Pa[4],t)}}else ja=H;u=k.start||a.start||+new Date;z={anim:a,percent:e,timestamp:u,start:u+(a.del||0),status:0,initstatus:f||0,stop:!1,ms:t,easing:ja,from:Q,diff:j,to:Ea,el:d,callback:k.callback,prev:p,next:W,repeat:E||a.times,origin:d.attr(),totalOrigin:y};xa.push(z);if(f&&!ha&&!q&&(z.stop=!0,z.start=new Date-t*f,xa.length==1))return kb();if(q)z.start=new Date-z.ms*f;xa.length==1&&mb(kb)}m("raphael.anim.start."+d.id,d,a)}}function Y(b){for(var a=0;a<xa.length;a++)xa[a].el.paper==b&&xa.splice(a--,
1)}w=b;b.version="2.1.0";b.eve=m;var O,l=/[, ]+/,n={circle:1,rect:1,path:1,ellipse:1,text:1,image:1,group:1},F=/\{(\d+)\}/g,aa="hasOwnProperty",D={doc:document,win:window},M=function(){};b.ca=M.prototype;var Z={was:Object.prototype[aa].call(D.win,"Raphael"),is:D.win.Raphael},R=function(){this.ca=this.customAttributes=new M;this._CustomAttributes=function(){};this._CustomAttributes.prototype=this.ca},v="apply",C="concat",f=b._supportsTouch="createTouch"in D.doc,j=" ",i=String,c="split",d="click dblclick mousedown mousemove mouseout mouseover mouseup touchstart touchmove touchend touchcancel"[c](j),
a=b._touchMap={mousedown:"touchstart",mousemove:"touchmove",mouseup:"touchend"},k=i.prototype.toLowerCase,q=Math,u=q.max,N=q.min,ca=q.abs,J=q.pow,Ja=q.cos,pa=q.sin,va=q.sqrt,X=q.PI,Ca=X/180,ma="number",ta="array",Aa=Object.prototype.toString;b._ISURL=/^url\(['"]?([^\)]+?)['"]?\)$/i;var Ka=/^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\))\s*$/i,
bb={NaN:1,Infinity:1,"-Infinity":1},Va=/^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,Ra=q.round,sa=parseFloat,Ma=parseInt,Na=i.prototype.toUpperCase,Wa=b._availableAttrs={"arrow-end":"none","arrow-start":"none",blur:0,"clip-rect":"0 0 1e9 1e9","clip-path":"",cursor:"default",cx:0,cy:0,fill:"#fff","fill-opacity":1,font:'10px "Arial"',"font-family":'"Arial"',"font-size":"10","font-style":"normal","font-weight":400,gradient:0,height:0,href:"about:blank","letter-spacing":0,"line-height":12,
"vertical-align":"middle",opacity:1,path:"M0,0",r:0,rx:0,ry:0,src:"",stroke:"#000","stroke-dasharray":"","stroke-linecap":"butt","stroke-linejoin":"butt","stroke-miterlimit":0,"stroke-opacity":1,"stroke-width":1,"shape-rendering":"default",target:"_blank","text-anchor":"middle",visibility:"",title:"",transform:"",rotation:0,width:0,x:0,y:0},Ta=b._availableAnimAttrs={blur:ma,"clip-rect":"csv","clip-path":"path",cx:ma,cy:ma,fill:"colour","fill-opacity":ma,"font-size":ma,height:ma,opacity:ma,path:"path",
r:ma,rx:ma,ry:ma,stroke:"colour","stroke-opacity":ma,"stroke-width":ma,transform:"transform",width:ma,x:ma,y:ma},Fa=/[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/,$a={hs:1,rg:1},eb=/,?([achlmqrstvxz]),?/gi,fb=/([achlmrqstvz])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,
Sa=/([rstm])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,Za=/(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/ig;
b._radial_gradient=/^x?r(?:\(([^\)]*?)\))?/;var p={},z=function(b,a){return sa(b)-sa(a)},t=function(){},H=function(b){return b},P=b._rectPath=function(b,a,c,d,e){if(e)return[["M",b+e,a],["l",c-e*2,0],["a",e,e,0,0,1,e,e],["l",0,d-e*2],["a",e,e,0,0,1,-e,e],["l",e*2-c,0],["a",e,e,0,0,1,-e,-e],["l",0,e*2-d],["a",e,e,0,0,1,e,-e],["z"]];return[["M",b,a],["l",c,0],["l",0,d],["l",-c,0],["z"]]},ga=function(b,a,c,d){d==null&&(d=c);return[["M",b,a],["m",0,-d],["a",c,d,0,1,1,0,2*d],["a",c,d,0,1,1,0,-2*d],["z"]]},
qa=b._getPath={group:function(){return!1},path:function(b){return b.attr("path")},circle:function(b){b=b.attrs;return ga(b.cx,b.cy,b.r)},ellipse:function(b){b=b.attrs;return ga(b.cx,b.cy,b.rx,b.ry)},rect:function(b){b=b.attrs;return P(b.x,b.y,b.width,b.height,b.r)},image:function(b){b=b.attrs;return P(b.x,b.y,b.width,b.height)},text:function(b){b=b._getBBox();return P(b.x,b.y,b.width,b.height)}},da=b.mapPath=function(b,a){if(!a)return b;var c,d,e,f,y,E,k,b=o(b);e=0;for(y=b.length;e<y;e++){k=b[e];
f=1;for(E=k.length;f<E;f+=2)c=a.x(k[f],k[f+1]),d=a.y(k[f],k[f+1]),k[f]=c,k[f+1]=d}return b};b.pick=function(){var b,a,c;a=0;for(c=arguments.length;a<c;a+=1)if((b=arguments[a])||!(b!==!1&&b!==0))return b};b._g=D;b.type=D.win.ENABLE_RED_CANVAS&&(D.win.CanvasRenderingContext2D||D.doc.createElement("canvas").getContext)?"CANVAS":D.win.SVGAngle||D.doc.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure","1.1")?"SVG":"VML";if(b.type=="VML"){var A=D.doc.createElement("div");A.innerHTML=
'<v:shape adj="1"/>';A=A.firstChild;A.style.behavior="url(#default#VML)";if(!(A&&typeof A.adj=="object"))return b.type="";A=null}b.svg=!((b.vml=b.type=="VML")||(b.canvas=b.type=="CANVAS"));b._Paper=R;b.fn=R=R.prototype=b.prototype;b._id=0;b._oid=0;b.is=function(b,a){a=k.call(a);if(a=="finite")return!bb[aa](+b);if(a=="array")return b instanceof Array;if(a==="object"&&(b===void 0||b===null))return!1;return a=="null"&&b===null||a==typeof b&&b!==null||a=="object"&&b===Object(b)||a=="array"&&Array.isArray&&
Array.isArray(b)||Aa.call(b).slice(8,-1).toLowerCase()==a};b.angle=function(a,c,d,e,f,y){if(f==null){a-=d;c-=e;if(!a&&!c)return 0;return(q.atan2(-c,-a)*180/X+540)%360}else return b.angle(a,c,f,y)-b.angle(d,e,f,y)};b.rad=function(b){return b%360*Ca};b.deg=function(b){return b*180/X%360};b.snapTo=function(a,c,d){d=b.is(d,"finite")?d:10;if(b.is(a,ta))for(var e=a.length;e--;){if(ca(a[e]-c)<=d)return a[e]}else{a=+a;e=c%a;if(e<d)return c-e;if(e>a-d)return c-e+a}return c};b.createUUID=function(b,a){return function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(b,
a).toUpperCase()}}(/[xy]/g,function(b){var a=q.random()*16|0;return(b=="x"?a:a&3|8).toString(16)});b.setWindow=function(a){m("raphael.setWindow",b,D.win,a);D.win=a;D.doc=D.win.document;b._engine.initWin&&b._engine.initWin(D.win)};var wa=function(a){if(b.vml){var c=/^\s+|\s+$/g,d;try{var e=new ActiveXObject("htmlfile");e.write("<body>");e.close();d=e.body}catch(f){d=createPopup().document.body}var y=d.createTextRange();wa=ba(function(b){try{d.style.color=i(b).replace(c,"");var a=y.queryCommandValue("ForeColor");
return"#"+("000000"+((a&255)<<16|a&65280|(a&16711680)>>>16).toString(16)).slice(-6)}catch(Ha){return"none"}})}else{var o=D.doc.createElement("i");o.title="Rapha\u00ebl Colour Picker";o.style.display="none";D.doc.body.appendChild(o);wa=ba(function(b){o.style.color=b;return D.doc.defaultView.getComputedStyle(o,"").getPropertyValue("color")})}return wa(a)},Ia=function(){return"hsb("+[this.h,this.s,this.b]+")"},Ba=function(){return"hsl("+[this.h,this.s,this.l]+")"},ea=function(){return this.hex},ra=function(a,
c,d){if(c==null&&b.is(a,"object")&&"r"in a&&"g"in a&&"b"in a)d=a.b,c=a.g,a=a.r;if(c==null&&b.is(a,"string"))d=b.getRGB(a),a=d.r,c=d.g,d=d.b;if(a>1||c>1||d>1)a/=255,c/=255,d/=255;return[a,c,d]},T=function(a,c,d,e){a*=255;c*=255;d*=255;a={r:a,g:c,b:d,hex:b.rgb(a,c,d),toString:ea};b.is(e,"finite")&&(a.opacity=e);return a};b.color=function(a){var c;b.is(a,"object")&&"h"in a&&"s"in a&&"b"in a?(c=b.hsb2rgb(a),a.r=c.r,a.g=c.g,a.b=c.b,a.hex=c.hex):b.is(a,"object")&&"h"in a&&"s"in a&&"l"in a?(c=b.hsl2rgb(a),
a.r=c.r,a.g=c.g,a.b=c.b,a.hex=c.hex):(b.is(a,"string")&&(a=b.getRGB(a)),b.is(a,"object")&&"r"in a&&"g"in a&&"b"in a?(c=b.rgb2hsl(a),a.h=c.h,a.s=c.s,a.l=c.l,c=b.rgb2hsb(a),a.v=c.b):(a={hex:"none"},a.r=a.g=a.b=a.h=a.s=a.v=a.l=-1));a.toString=ea;return a};b.hsb2rgb=function(a,b,c,d){if(this.is(a,"object")&&"h"in a&&"s"in a&&"b"in a)c=a.b,b=a.s,a=a.h,d=a.o;a*=360;var e,f,y,a=a%360/60;y=c*b;b=y*(1-ca(a%2-1));c=e=f=c-y;a=~~a;c+=[y,b,0,0,b,y][a];e+=[b,y,y,b,0,0][a];f+=[0,0,b,y,y,b][a];return T(c,e,f,d)};
b.hsl2rgb=function(a,b,c,d){if(this.is(a,"object")&&"h"in a&&"s"in a&&"l"in a)c=a.l,b=a.s,a=a.h;if(a>1||b>1||c>1)a/=360,b/=100,c/=100;a*=360;var e,f,y,a=a%360/60;y=2*b*(c<0.5?c:1-c);b=y*(1-ca(a%2-1));c=e=f=c-y/2;a=~~a;c+=[y,b,0,0,b,y][a];e+=[b,y,y,b,0,0][a];f+=[0,0,b,y,y,b][a];return T(c,e,f,d)};b.rgb2hsb=function(a,b,c){var c=ra(a,b,c),a=c[0],b=c[1],c=c[2],d,e;d=u(a,b,c);e=d-N(a,b,c);return{h:((e==0?0:d==a?(b-c)/e:d==b?(c-a)/e+2:(a-b)/e+4)+360)%6*60/360,s:e==0?0:e/d,b:d,toString:Ia}};b.rgb2hsl=function(a,
b,c){var c=ra(a,b,c),a=c[0],b=c[1],c=c[2],d,e,f;e=u(a,b,c);d=N(a,b,c);f=e-d;d=(e+d)/2;return{h:((f==0?0:e==a?(b-c)/f:e==b?(c-a)/f+2:(a-b)/f+4)+360)%6*60/360,s:f==0?0:d<0.5?f/(2*d):f/(2-2*d),l:d,toString:Ba}};b._path2string=function(){return this.join(",").replace(eb,"$1")};var ba=b._cacher=function(a,b,c){function d(){var e=Array.prototype.slice.call(arguments,0),f=e.join("\u2400"),y=d.cache=d.cache||{},o=d.count=d.count||[];if(y[aa](f)){a:for(var e=o,o=f,E=0,k=e.length;E<k;E++)if(e[E]===o){e.push(e.splice(E,
1)[0]);break a}return c?c(y[f]):y[f]}o.length>=1E3&&delete y[o.shift()];o.push(f);y[f]=a[v](b,e);return c?c(y[f]):y[f]}return d};b._preload=function(a,b){var c=D.doc.createElement("img");c.style.cssText="position:absolute;left:-9999em;top:-9999em";c.onload=function(){b.call(this);this.onload=null;D.doc.body.removeChild(this)};c.onerror=function(){D.doc.body.removeChild(this)};D.doc.body.appendChild(c);c.src=a};b.getRGB=ba(function(a){var d;a&&b.is(a,"object")&&"opacity"in a&&(d=a.opacity);if(!a||
(a=i(a)).indexOf("-")+1)return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:e};if(a=="none")return{r:-1,g:-1,b:-1,hex:"none",toString:e};!($a[aa](a.toLowerCase().substring(0,2))||a.charAt()=="#")&&(a=wa(a));var f,y,o,E;if(a=a.match(Ka)){a[2]&&(o=Ma(a[2].substring(5),16),y=Ma(a[2].substring(3,5),16),f=Ma(a[2].substring(1,3),16));a[3]&&(o=Ma((E=a[3].charAt(3))+E,16),y=Ma((E=a[3].charAt(2))+E,16),f=Ma((E=a[3].charAt(1))+E,16));a[4]&&(E=a[4][c](Fa),f=sa(E[0]),E[0].slice(-1)=="%"&&(f*=2.55),y=sa(E[1]),E[1].slice(-1)==
"%"&&(y*=2.55),o=sa(E[2]),E[2].slice(-1)=="%"&&(o*=2.55),a[1].toLowerCase().slice(0,4)=="rgba"&&(d=sa(E[3])),E[3]&&E[3].slice(-1)=="%"&&(d/=100));if(a[5])return E=a[5][c](Fa),f=sa(E[0]),E[0].slice(-1)=="%"&&(f*=2.55),y=sa(E[1]),E[1].slice(-1)=="%"&&(y*=2.55),o=sa(E[2]),E[2].slice(-1)=="%"&&(o*=2.55),(E[0].slice(-3)=="deg"||E[0].slice(-1)=="\u00b0")&&(f/=360),a[1].toLowerCase().slice(0,4)=="hsba"&&(d=sa(E[3])),E[3]&&E[3].slice(-1)=="%"&&(d/=100),b.hsb2rgb(f,y,o,d);if(a[6])return E=a[6][c](Fa),f=sa(E[0]),
E[0].slice(-1)=="%"&&(f*=2.55),y=sa(E[1]),E[1].slice(-1)=="%"&&(y*=2.55),o=sa(E[2]),E[2].slice(-1)=="%"&&(o*=2.55),(E[0].slice(-3)=="deg"||E[0].slice(-1)=="\u00b0")&&(f/=360),a[1].toLowerCase().slice(0,4)=="hsla"&&(d=sa(E[3])),E[3]&&E[3].slice(-1)=="%"&&(d/=100),b.hsl2rgb(f,y,o,d);a={r:f,g:y,b:o,toString:e};a.hex="#"+(16777216|o|y<<8|f<<16).toString(16).slice(1);b.is(d,"finite")&&(a.opacity=d);return a}return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:e}},b);b.tintshade=ba(function(a,c){var d=b.getRGB(a),
f;f=255;c<0&&(c*=-1,f=0);c>1&&(c=1);f=c===0?d:{r:f-(f-d.r)*c,g:f-(f-d.g)*c,b:f-(f-d.b)*c,toString:e};f.hex=b.rgb(f.r,f.g,f.b);d.error&&(f.error=d.error);"opacity"in d?(f.rgba="rgba("+[f.r,f.g,f.b,d.opacity].join(",")+")",f.opacity=d.opacity):f.rgba="rgb("+[f.r,f.g,f.b].join(",")+")";return f},b);b.hsb=ba(function(a,c,d){return b.hsb2rgb(a,c,d).hex});b.hsl=ba(function(a,c,d){return b.hsl2rgb(a,c,d).hex});b.rgb=ba(function(a,b,c){return"#"+(16777216|c|b<<8|a<<16).toString(16).slice(1)});b.getColor=
function(a){var a=this.getColor.start=this.getColor.start||{h:0,s:1,b:a||0.75},b=this.hsb2rgb(a.h,a.s,a.b);a.h+=0.075;if(a.h>1)a.h=0,a.s-=0.2,a.s<=0&&(this.getColor.start={h:0,s:1,b:a.b});return b.hex};b.getColor.reset=function(){delete this.start};b.parsePathString=function(a){if(!a)return null;var c=la(a);if(c.arr)return za(c.arr);var d={a:7,c:6,h:1,l:2,m:2,r:4,q:4,s:4,t:2,v:1,z:0},e=[];b.is(a,ta)&&b.is(a[0],ta)&&(e=za(a));e.length||i(a).replace(fb,function(a,b,c){var f=[],a=b.toLowerCase();c.replace(Za,
function(a,b){b&&f.push(+b)});a=="m"&&f.length>2&&(e.push([b][C](f.splice(0,2))),a="l",b=b=="m"?"l":"L");if(a=="r")e.push([b][C](f));else for(;f.length>=d[a];)if(e.push([b][C](f.splice(0,d[a]))),!d[a])break});e.toString=b._path2string;c.arr=za(e);return e};b.parseTransformString=ba(function(a){if(!a)return null;var c=[];b.is(a,ta)&&b.is(a[0],ta)&&(c=za(a));c.length||i(a).replace(Sa,function(a,b,d){var e=[];k.call(b);d.replace(Za,function(a,b){b&&e.push(+b)});c.push([b][C](e))});c.toString=b._path2string;
return c});var la=function(a){var b=la.ps=la.ps||{};b[a]?b[a].sleep=100:b[a]={sleep:100};setTimeout(function(){for(var c in b)b[aa](c)&&c!=a&&(b[c].sleep--,!b[c].sleep&&delete b[c])});return b[a]};b.findDotsAtSegment=function(a,b,c,d,e,f,y,E,o){var k=1-o,ha=J(k,3),W=J(k,2),p=o*o,u=p*o,t=ha*a+W*3*o*c+k*3*o*o*e+u*y,ha=ha*b+W*3*o*d+k*3*o*o*f+u*E,W=a+2*o*(c-a)+p*(e-2*c+a),u=b+2*o*(d-b)+p*(f-2*d+b),Q=c+2*o*(e-c)+p*(y-2*e+c),p=d+2*o*(f-d)+p*(E-2*f+d),a=k*a+o*c,b=k*b+o*d,e=k*e+o*y,f=k*f+o*E,E=90-q.atan2(W-
Q,u-p)*180/X;(W>Q||u<p)&&(E+=180);return{x:t,y:ha,m:{x:W,y:u},n:{x:Q,y:p},start:{x:a,y:b},end:{x:e,y:f},alpha:E}};b.bezierBBox=function(a,c,d,e,f,y,o,E){b.is(a,"array")||(a=[a,c,d,e,f,y,o,E]);a=W.apply(null,a);return{x:a.min.x,y:a.min.y,x2:a.max.x,y2:a.max.y,width:a.max.x-a.min.x,height:a.max.y-a.min.y}};b.isPointInsideBBox=function(a,b,c){return b>=a.x&&b<=a.x2&&c>=a.y&&c<=a.y2};b.isBBoxIntersect=function(a,c){var d=b.isPointInsideBBox;return d(c,a.x,a.y)||d(c,a.x2,a.y)||d(c,a.x,a.y2)||d(c,a.x2,
a.y2)||d(a,c.x,c.y)||d(a,c.x2,c.y)||d(a,c.x,c.y2)||d(a,c.x2,c.y2)||(a.x<c.x2&&a.x>c.x||c.x<a.x2&&c.x>a.x)&&(a.y<c.y2&&a.y>c.y||c.y<a.y2&&c.y>a.y)};b.pathIntersection=function(a,b){return fa(a,b)};b.pathIntersectionNumber=function(a,b){return fa(a,b,1)};b.isPointInsidePath=function(a,c,d){var e=b.pathBBox(a);return b.isPointInsideBBox(e,c,d)&&fa(a,[["M",c,d],["H",e.x2+10]],1)%2==1};b._removedFactory=function(a){return function(){m("raphael.log",null,"Rapha\u00ebl: you are calling to method \u201c"+
a+"\u201d of removed object",a)}};var Qa=b.pathBBox=function(a){var b=la(a);if(b.bbox)return b.bbox;if(!a)return{x:0,y:0,width:0,height:0,x2:0,y2:0};for(var a=o(a),c=0,d=0,e=[],f=[],y,E=0,k=a.length;E<k;E++)y=a[E],y[0]=="M"?(c=y[1],d=y[2],e.push(c),f.push(d)):(c=W(c,d,y[1],y[2],y[3],y[4],y[5],y[6]),e=e[C](c.min.x,c.max.x),f=f[C](c.min.y,c.max.y),c=y[5],d=y[6]);a=N[v](0,e);y=N[v](0,f);e=u[v](0,e);f=u[v](0,f);f={x:a,y:y,x2:e,y2:f,width:e-a,height:f-y};b.bbox=g(f);return f},za=function(a){a=g(a);a.toString=
b._path2string;return a},A=b._pathToRelative=function(a){var c=la(a);if(c.rel)return za(c.rel);if(!b.is(a,ta)||!b.is(a&&a[0],ta))a=b.parsePathString(a);var d=[],e=0,f=0,y=0,o=0,E=0;a[0][0]=="M"&&(e=a[0][1],f=a[0][2],y=e,o=f,E++,d.push(["M",e,f]));for(var ha=a.length;E<ha;E++){var W=d[E]=[],q=a[E];if(q[0]!=k.call(q[0]))switch(W[0]=k.call(q[0]),W[0]){case "a":W[1]=q[1];W[2]=q[2];W[3]=q[3];W[4]=q[4];W[5]=q[5];W[6]=+(q[6]-e).toFixed(3);W[7]=+(q[7]-f).toFixed(3);break;case "v":W[1]=+(q[1]-f).toFixed(3);
break;case "m":y=q[1],o=q[2];default:for(var p=1,u=q.length;p<u;p++)W[p]=+(q[p]-(p%2?e:f)).toFixed(3)}else{d[E]=[];q[0]=="m"&&(y=q[1]+e,o=q[2]+f);W=0;for(p=q.length;W<p;W++)d[E][W]=q[W]}q=d[E].length;switch(d[E][0]){case "z":e=y;f=o;break;case "h":e+=+d[E][q-1];break;case "v":f+=+d[E][q-1];break;default:e+=+d[E][q-2],f+=+d[E][q-1]}}d.toString=b._path2string;c.rel=za(d);return d},I=b._pathToAbsolute=function(a){var c=la(a),d;if(c.abs)return za(c.abs);if(!b.is(a,ta)||!b.is(a&&a[0],ta))a=b.parsePathString(a);
if(!a||!a.length)return d=["M",0,0],d.toString=b._path2string,d;var e=0,f=0,y=0,E=0,o=0;d=[];a[0][0]=="M"&&(e=+a[0][1],f=+a[0][2],y=e,E=f,o++,d[0]=["M",e,f]);for(var k=a.length==3&&a[0][0]=="M"&&a[1][0].toUpperCase()=="R"&&a[2][0].toUpperCase()=="Z",ha,q=o,W=a.length;q<W;q++){d.push(o=[]);ha=a[q];if(ha[0]!=Na.call(ha[0]))switch(o[0]=Na.call(ha[0]),o[0]){case "A":o[1]=ha[1];o[2]=ha[2];o[3]=ha[3];o[4]=ha[4];o[5]=ha[5];o[6]=+(ha[6]+e);o[7]=+(ha[7]+f);break;case "V":o[1]=+ha[1]+f;break;case "H":o[1]=
+ha[1]+e;break;case "R":for(var p=[e,f][C](ha.slice(1)),u=2,t=p.length;u<t;u++)p[u]=+p[u]+e,p[++u]=+p[u]+f;d.pop();d=d[C](r(p,k));break;case "M":y=+ha[1]+e,E=+ha[2]+f;default:u=1;for(t=ha.length;u<t;u++)o[u]=+ha[u]+(u%2?e:f)}else if(ha[0]=="R")p=[e,f][C](ha.slice(1)),d.pop(),d=d[C](r(p,k)),o=["R"][C](ha.slice(-2));else{p=0;for(u=ha.length;p<u;p++)o[p]=ha[p]}switch(o[0]){case "Z":e=y;f=E;break;case "H":e=o[1];break;case "V":f=o[1];break;case "M":y=o[o.length-2],E=o[o.length-1];default:e=o[o.length-
2],f=o[o.length-1]}}d.toString=b._path2string;c.abs=za(d);return d},E=function(a,b,c,d,e,f){var y=1/3,o=2/3;return[y*a+o*c,y*b+o*d,y*e+o*c,y*f+o*d,e,f]},y=function(a,b,d,e,f,o,E,k,ha,W){var p=X*120/180,u=Ca*(+f||0),t=[],Q,ja=ba(function(a,b,c){var d=a*Ja(c)-b*pa(c),a=a*pa(c)+b*Ja(c);return{x:d,y:a}});if(W)z=W[0],Q=W[1],o=W[2],Ea=W[3];else{Q=ja(a,b,-u);a=Q.x;b=Q.y;Q=ja(k,ha,-u);k=Q.x;ha=Q.y;Ja(Ca*f);pa(Ca*f);Q=(a-k)/2;z=(b-ha)/2;Ea=Q*Q/(d*d)+z*z/(e*e);Ea>1&&(Ea=va(Ea),d*=Ea,e*=Ea);var Ea=d*d,oa=e*
e,Ea=(o==E?-1:1)*va(ca((Ea*oa-Ea*z*z-oa*Q*Q)/(Ea*z*z+oa*Q*Q))),o=Ea*d*z/e+(a+k)/2,Ea=Ea*-e*Q/d+(b+ha)/2,z=q.asin(((b-Ea)/e).toFixed(9));Q=q.asin(((ha-Ea)/e).toFixed(9));z=a<o?X-z:z;Q=k<o?X-Q:Q;z<0&&(z=X*2+z);Q<0&&(Q=X*2+Q);E&&z>Q&&(z-=X*2);!E&&Q>z&&(Q-=X*2)}if(ca(Q-z)>p){var t=Q,oa=k,j=ha;Q=z+p*(E&&Q>z?1:-1);k=o+d*Ja(Q);ha=Ea+e*pa(Q);t=y(k,ha,d,e,f,0,E,oa,j,[Q,t,o,Ea])}o=Q-z;f=Ja(z);p=pa(z);E=Ja(Q);Q=pa(Q);o=q.tan(o/4);d=4/3*d*o;o*=4/3*e;e=[a,b];a=[a+d*p,b-o*f];b=[k+d*Q,ha-o*E];k=[k,ha];a[0]=2*e[0]-
a[0];a[1]=2*e[1]-a[1];if(W)return[a,b,k][C](t);else{t=[a,b,k][C](t).join()[c](",");W=[];k=0;for(ha=t.length;k<ha;k++)W[k]=k%2?ja(t[k-1],t[k],u).y:ja(t[k],t[k+1],u).x;return W}},ha=function(a,b,c,d,e,f,o,y,E){var k=1-E;return{x:J(k,3)*a+J(k,2)*3*E*c+k*3*E*E*e+J(E,3)*o,y:J(k,3)*b+J(k,2)*3*E*d+k*3*E*E*f+J(E,3)*y}},W=ba(function(a,b,c,d,e,f,o,y){var E=e-2*c+a-(o-2*e+c),k=2*(c-a)-2*(e-c),W=a-c,q=(-k+va(k*k-4*E*W))/2/E,E=(-k-va(k*k-4*E*W))/2/E,p=[b,y],Q=[a,o];ca(q)>"1e12"&&(q=0.5);ca(E)>"1e12"&&(E=0.5);
q>0&&q<1&&(q=ha(a,b,c,d,e,f,o,y,q),Q.push(q.x),p.push(q.y));E>0&&E<1&&(q=ha(a,b,c,d,e,f,o,y,E),Q.push(q.x),p.push(q.y));E=f-2*d+b-(y-2*f+d);k=2*(d-b)-2*(f-d);W=b-d;q=(-k+va(k*k-4*E*W))/2/E;E=(-k-va(k*k-4*E*W))/2/E;ca(q)>"1e12"&&(q=0.5);ca(E)>"1e12"&&(E=0.5);q>0&&q<1&&(q=ha(a,b,c,d,e,f,o,y,q),Q.push(q.x),p.push(q.y));E>0&&E<1&&(q=ha(a,b,c,d,e,f,o,y,E),Q.push(q.x),p.push(q.y));return{min:{x:N[v](0,Q),y:N[v](0,p)},max:{x:u[v](0,Q),y:u[v](0,p)}}}),o=b._path2curve=ba(function(a,b){var c=!b&&la(a);if(!b&&
c.curve)return za(c.curve);var d=I(a),e=b&&I(b),f={x:0,y:0,bx:0,by:0,X:0,Y:0,qx:null,qy:null},o={x:0,y:0,bx:0,by:0,X:0,Y:0,qx:null,qy:null},k=function(a,b){var c,d;if(!a)return["C",b.x,b.y,b.x,b.y,b.x,b.y];!(a[0]in{T:1,Q:1})&&(b.qx=b.qy=null);switch(a[0]){case "M":b.X=a[1];b.Y=a[2];break;case "A":a=["C"][C](y[v](0,[b.x,b.y][C](a.slice(1))));break;case "S":c=b.x+(b.x-(b.bx||b.x));d=b.y+(b.y-(b.by||b.y));a=["C",c,d][C](a.slice(1));break;case "T":b.qx=b.x+(b.x-(b.qx||b.x));b.qy=b.y+(b.y-(b.qy||b.y));
a=["C"][C](E(b.x,b.y,b.qx,b.qy,a[1],a[2]));break;case "Q":b.qx=a[1];b.qy=a[2];a=["C"][C](E(b.x,b.y,a[1],a[2],a[3],a[4]));break;case "L":a=["C"][C]([b.x,b.y,a[1],a[2],a[1],a[2]]);break;case "H":a=["C"][C]([b.x,b.y,a[1],b.y,a[1],b.y]);break;case "V":a=["C"][C]([b.x,b.y,b.x,a[1],b.x,a[1]]);break;case "Z":a=["C"][C]([b.x,b.y,b.X,b.Y,b.X,b.Y])}return a},ha=function(a,b){if(a[b].length>7){a[b].shift();for(var c=a[b];c.length;)a.splice(b++,0,["C"][C](c.splice(0,6)));a.splice(b,1);p=u(d.length,e&&e.length||
0)}},q=function(a,b,c,f,o){if(a&&b&&a[o][0]=="M"&&b[o][0]!="M")b.splice(o,0,["M",f.x,f.y]),c.bx=0,c.by=0,c.x=a[o][1],c.y=a[o][2],p=u(d.length,e&&e.length||0)},W=0,p=u(d.length,e&&e.length||0);for(;W<p;W++){d[W]=k(d[W],f);ha(d,W);e&&(e[W]=k(e[W],o));e&&ha(e,W);q(d,e,f,o,W);q(e,d,o,f,W);var Q=d[W],t=e&&e[W],ja=Q.length,Ea=e&&t.length;f.x=Q[ja-2];f.y=Q[ja-1];f.bx=sa(Q[ja-4])||f.x;f.by=sa(Q[ja-3])||f.y;o.bx=e&&(sa(t[Ea-4])||o.x);o.by=e&&(sa(t[Ea-3])||o.y);o.x=e&&t[Ea-2];o.y=e&&t[Ea-1]}if(!e)c.curve=za(d);
return e?[d,e]:d},null,za);b._parseDots=ba(function(a){for(var c=[],d=0,e=a.length;d<e;d++){var f={},o=a[d].match(/^([^:]*):?([\d\.]*)/);f.color=b.getRGB(o[1]);if(f.color.error)return null;f.opacity=f.color.opacity;f.color=f.color.hex;o[2]&&(f.offset=o[2]+"%");c.push(f)}d=1;for(e=c.length-1;d<e;d++)if(!c[d].offset){a=sa(c[d-1].offset||0);o=0;for(f=d+1;f<e;f++)if(c[f].offset){o=c[f].offset;break}o||(o=100,f=e);o=sa(o);for(o=(o-a)/(f-d+1);d<f;d++)a+=o,c[d].offset=a+"%"}return c});var Q=b._tear=function(a,
b){a==b.top&&(b.top=a.prev);a==b.bottom&&(b.bottom=a.next);a.next&&(a.next.prev=a.prev);a.prev&&(a.prev.next=a.next)};b._tofront=function(a,b){if(b.top===a)return!1;Q(a,b);a.next=null;a.prev=b.top;b.top.next=a;b.top=a;return!0};b._toback=function(a,b){if(b.bottom===a)return!1;Q(a,b);a.next=b.bottom;a.prev=null;b.bottom.prev=a;b.bottom=a;return!0};b._insertafter=function(a,b,c,d){Q(a,c);a.parent=d;b===d.top&&(d.top=a);b.next&&(b.next.prev=a);a.next=b.next;a.prev=b;b.next=a};b._insertbefore=function(a,
b,c,d){Q(a,c);a.parent=d;b===d.bottom&&(d.bottom=a);b.prev&&(b.prev.next=a);a.prev=b.prev;b.prev=a;a.next=b};var ja=b.toMatrix=function(a,b){var c=Qa(a),d={_:{transform:""},getBBox:function(){return c}};gb(d,b);return d.matrix};b.transformPath=function(a,b){return da(a,ja(a,b))};var gb=b._extractTransform=function(a,c){if(c==null)return a._.transform;var c=i(c).replace(/\.{3}|\u2026/g,a._.transform||""),d=b.parseTransformString(c),e=0,f=0,o=0,E=1,y=1,k=a._,o=new s;k.transform=d||[];if(d)for(var f=
0,ha=d.length;f<ha;f++){var q=d[f],W=q.length,p=i(q[0]).toLowerCase(),u=q[0]!=p,Q=u?o.invert():0,t;p=="t"&&W==3?u?(W=Q.x(0,0),p=Q.y(0,0),u=Q.x(q[1],q[2]),Q=Q.y(q[1],q[2]),o.translate(u-W,Q-p)):o.translate(q[1],q[2]):p=="r"?W==2?(t=t||a.getBBox(1),o.rotate(q[1],t.x+t.width/2,t.y+t.height/2),e+=q[1]):W==4&&(u?(u=Q.x(q[2],q[3]),Q=Q.y(q[2],q[3]),o.rotate(q[1],u,Q)):o.rotate(q[1],q[2],q[3]),e+=q[1]):p=="s"?W==2||W==3?(t=t||a.getBBox(1),o.scale(q[1],q[W-1],t.x+t.width/2,t.y+t.height/2),E*=q[1],y*=q[W-1]):
W==5&&(u?(u=Q.x(q[3],q[4]),Q=Q.y(q[3],q[4]),o.scale(q[1],q[2],u,Q)):o.scale(q[1],q[2],q[3],q[4]),E*=q[1],y*=q[2]):p=="m"&&W==7&&o.add(q[1],q[2],q[3],q[4],q[5],q[6]);k.dirtyT=1;a.matrix=o}a.matrix=o;k.sx=E;k.sy=y;k.deg=e;k.dx=f=o.e;k.dy=o=o.f;E==1&&y==1&&!e&&k.bbox?(k.bbox.x+=+f,k.bbox.y+=+o):k.dirtyT=1},Ea=function(a){var b=a[0];switch(b.toLowerCase()){case "t":return[b,0,0];case "m":return[b,1,0,0,1,0,0];case "r":return a.length==4?[b,0,a[2],a[3]]:[b,0];case "s":return a.length==5?[b,1,1,a[3],a[4]]:
a.length==3?[b,1,1]:[b,1]}},na=b._equaliseTransform=function(a,c){for(var c=i(c).replace(/\.{3}|\u2026/g,a),a=b.parseTransformString(a)||[],c=b.parseTransformString(c)||[],d=u(a.length,c.length),e=[],f=[],o=0,E,y,k,q;o<d;o++){k=a[o]||Ea(c[o]);q=c[o]||Ea(k);if(k[0]!=q[0]||k[0].toLowerCase()=="r"&&(k[2]!=q[2]||k[3]!=q[3])||k[0].toLowerCase()=="s"&&(k[3]!=q[3]||k[4]!=q[4]))return;e[o]=[];f[o]=[];E=0;for(y=u(k.length,q.length);E<y;E++)E in k&&(e[o][E]=k[E]),E in q&&(f[o][E]=q[E])}return{from:e,to:f}};
b._getContainer=function(a,c,d,e){var f;f=e==null&&!b.is(a,"object")?D.doc.getElementById(a):a;if(f!=null){if(f.tagName)return c==null?{container:f,width:f.style.pixelWidth||f.offsetWidth,height:f.style.pixelHeight||f.offsetHeight}:{container:f,width:c,height:d};return{container:1,x:a,y:c,width:d,height:e}}};b.pathToRelative=A;b._engine={};b.path2curve=o;b.matrix=function(a,b,c,d,e,f){return new s(a,b,c,d,e,f)};(function(a){function d(a){return a[0]*a[0]+a[1]*a[1]}function e(a){var b=va(d(a));a[0]&&
(a[0]/=b);a[1]&&(a[1]/=b)}a.add=function(a,b,c,d,e,f){var o=[[],[],[]],E=[[this.a,this.c,this.e],[this.b,this.d,this.f],[0,0,1]],b=[[a,c,e],[b,d,f],[0,0,1]];a&&a instanceof s&&(b=[[a.a,a.c,a.e],[a.b,a.d,a.f],[0,0,1]]);for(a=0;a<3;a++)for(c=0;c<3;c++){for(d=e=0;d<3;d++)e+=E[a][d]*b[d][c];o[a][c]=e}this.a=o[0][0];this.b=o[1][0];this.c=o[0][1];this.d=o[1][1];this.e=o[0][2];this.f=o[1][2]};a.invert=function(){var a=this.a*this.d-this.b*this.c;return new s(this.d/a,-this.b/a,-this.c/a,this.a/a,(this.c*
this.f-this.d*this.e)/a,(this.b*this.e-this.a*this.f)/a)};a.clone=function(){return new s(this.a,this.b,this.c,this.d,this.e,this.f)};a.translate=function(a,b){this.add(1,0,0,1,a,b)};a.scale=function(a,b,c,d){b==null&&(b=a);(c||d)&&this.add(1,0,0,1,c,d);this.add(a,0,0,b,0,0);(c||d)&&this.add(1,0,0,1,-c,-d)};a.rotate=function(a,c,d){var a=b.rad(a),c=c||0,d=d||0,e=+Ja(a).toFixed(9),a=+pa(a).toFixed(9);this.add(e,a,-a,e,c,d);this.add(1,0,0,1,-c,-d)};a.x=function(a,b){return a*this.a+b*this.c+this.e};
a.y=function(a,b){return a*this.b+b*this.d+this.f};a.get=function(a){return+this[i.fromCharCode(97+a)].toFixed(4)};a.toString=function(){return b.svg?"matrix("+[this.get(0),this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)].join()+")":[this.get(0),this.get(2),this.get(1),this.get(3),0,0].join()};a.toMatrixString=function(){return"matrix("+[this.get(0),this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)].join()+")"};a.toFilter=function(){return"progid:DXImageTransform.Microsoft.Matrix(M11="+
this.get(0)+", M12="+this.get(2)+", M21="+this.get(1)+", M22="+this.get(3)+", Dx="+this.get(4)+", Dy="+this.get(5)+", sizingmethod='auto expand')"};a.offset=function(){return[this.e.toFixed(4),this.f.toFixed(4)]};a.split=function(){var a={};a.dx=this.e;a.dy=this.f;var c=[[this.a,this.c],[this.b,this.d]];a.scalex=va(d(c[0]));e(c[0]);a.shear=c[0][0]*c[1][0]+c[0][1]*c[1][1];c[1]=[c[1][0]-c[0][0]*a.shear,c[1][1]-c[0][1]*a.shear];a.scaley=va(d(c[1]));e(c[1]);a.shear/=a.scaley;var f=-c[0][1],c=c[1][1];
if(c<0){if(a.rotate=b.deg(q.acos(c)),f<0)a.rotate=360-a.rotate}else a.rotate=b.deg(q.asin(f));a.isSimple=!+a.shear.toFixed(9)&&(a.scalex.toFixed(9)==a.scaley.toFixed(9)||!a.rotate);a.isSuperSimple=!+a.shear.toFixed(9)&&a.scalex.toFixed(9)==a.scaley.toFixed(9)&&!a.rotate;a.noRotation=!+a.shear.toFixed(9)&&!a.rotate;return a};a.toTransformString=function(a){a=a||this[c]();return a.isSimple?(a.scalex=+a.scalex.toFixed(4),a.scaley=+a.scaley.toFixed(4),a.rotate=+a.rotate.toFixed(4),(a.dx||a.dy?"t"+[a.dx,
a.dy]:"")+(a.scalex!=1||a.scaley!=1?"s"+[a.scalex,a.scaley,0,0]:"")+(a.rotate?"r"+[a.rotate,0,0]:"")):"m"+[this.get(0),this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)]}})(s.prototype);A=navigator.userAgent.match(/Version\/(.*?)\s/)||navigator.userAgent.match(/Chrome\/(\d+)/);R.safari=navigator.vendor=="Apple Computer, Inc."&&(A&&A[1]<4||navigator.platform.slice(0,2)=="iP")||navigator.vendor=="Google Inc."&&A&&A[1]<8?function(){var a=this.rect(-99,-99,this.width+99,this.height+99).attr({stroke:"none"});
setTimeout(function(){a.remove()});return!0}:t;for(var oa=function(){this.returnValue=!1},jb=function(){return this.originalEvent.preventDefault()},cb=function(){this.cancelBubble=!0},Pa=function(){return this.originalEvent.stopPropagation()},ab=b.addEvent=function(){if(D.doc.addEventListener)return function(b,c,d,e){var o=f&&a[c]?a[c]:c,E=function(o){var E=D.doc.documentElement.scrollTop||D.doc.body.scrollTop,y=D.doc.documentElement.scrollLeft||D.doc.body.scrollLeft;if(f&&a[aa](c))for(var k=0,q=
o.targetTouches&&o.targetTouches.length;k<q;k++)if(o.targetTouches[k].target==b){q=o;o=o.targetTouches[k];o.originalEvent=q;o.preventDefault=jb;o.stopPropagation=Pa;break}return d.call(e,o,o.clientX+y,o.clientY+E)};b.addEventListener(o,E,!1);return function(){b.removeEventListener(o,E,!1);return!0}};else if(D.doc.attachEvent)return function(a,b,c,d){var e=function(a){var a=a||D.win.event,b=a.clientX+(D.doc.documentElement.scrollLeft||D.doc.body.scrollLeft),e=a.clientY+(D.doc.documentElement.scrollTop||
D.doc.body.scrollTop);a.preventDefault=a.preventDefault||oa;a.stopPropagation=a.stopPropagation||cb;return c.call(d,a,b,e)};a.attachEvent("on"+b,e);return function(){a.detachEvent("on"+b,e);return!0}}}(),db=[],Xa=function(a){for(var b=a.clientX,c=a.clientY,d=D.doc.documentElement.scrollTop||D.doc.body.scrollTop,e=D.doc.documentElement.scrollLeft||D.doc.body.scrollLeft,o,E=db.length;E--;){o=db[E];if(f)for(var y=a.touches.length,k;y--;){if(k=a.touches[y],k.identifier==o.el._drag.id){b=k.clientX;c=k.clientY;
(a.originalEvent?a.originalEvent:a).preventDefault();break}}else a.preventDefault();var y=o.el.node,q=y.nextSibling,ha=y.parentNode,W=y.style.display;D.win.opera&&ha.removeChild(y);y.style.display="none";k=o.el.paper.getElementByPoint(b,c);y.style.display=W;D.win.opera&&(q?ha.insertBefore(y,q):ha.appendChild(y));k&&m("raphael.drag.over."+o.el.id,o.el,k);b+=e;c+=d;m("raphael.drag.move."+o.el.id,o.move_scope||o.el,b-o.el._drag.x,c-o.el._drag.y,b,c,a)}},hb=function(a){b.unmousemove(Xa).unmouseup(hb);
for(var c=db.length,d;c--;)d=db[c],d.el._drag={},m("raphael.drag.end."+d.el.id,d.end_scope||d.start_scope||d.move_scope||d.el,a);db=[]},Ga=b.el={},t=d.length;t--;)(function(a){b[a]=Ga[a]=function(c,d){if(b.is(c,"function"))this.events=this.events||[],this.events.push({name:a,f:c,unbind:ab(this.shape||this.node||D.doc,a,c,d||this)});return this};b["un"+a]=Ga["un"+a]=function(b){for(var c=this.events||[],d=c.length;d--;)if(c[d].name==a&&c[d].f==b){c[d].unbind();c.splice(d,1);!c.length&&delete this.events;
break}return this}})(d[t]);Ga.data=function(a,c){var d=p[this.id]=p[this.id]||{};if(arguments.length==1){if(b.is(a,"object")){for(var e in a)a[aa](e)&&this.data(e,a[e]);return this}m("raphael.data.get."+this.id,this,d[a],a);return d[a]}d[a]=c;m("raphael.data.set."+this.id,this,c,a);return this};Ga.removeData=function(a){a==null?p[this.id]={}:p[this.id]&&delete p[this.id][a];return this};var L=[],Oa=function(){this.untrack=ab(D.doc,"mouseup",pb,this)},pb=function(){this.untrack();this.untrack=null;
return this.fn&&this.fn.apply(this.scope||this.el,arguments)};Ga.mouseup=function(a,c,d){if(!d)return b.mouseup.apply(this,arguments);L.push(d={el:this,fn:a,scope:c});d.unbind=ab(this.shape||this.node||D.doc,"mousedown",Oa,d);return this};Ga.unmouseup=function(a){for(var c=L.length,d;c--;)L[c].el===this&&L[c].fn===a&&(d=L[c],d.unbind(),d.untrack&&d.untrack(),L.splice(c,1));return d?this:b.unmouseup.apply(this,arguments)};Ga.hover=function(a,b,c,d){return this.mouseover(a,c).mouseout(b,d||c)};Ga.unhover=
function(a,b){return this.unmouseover(a).unmouseout(b)};var ib=[];Ga.drag=function(a,c,d,e,f,o){function E(y){(y.originalEvent||y).preventDefault();var k=D.doc.documentElement.scrollTop||D.doc.body.scrollTop,q=D.doc.documentElement.scrollLeft||D.doc.body.scrollLeft;this._drag.x=y.clientX+q;this._drag.y=y.clientY+k;this._drag.id=y.identifier;!db.length&&b.mousemove(Xa).mouseup(hb);db.push({el:this,move_scope:e,start_scope:f,end_scope:o});c&&m.on("raphael.drag.start."+this.id,c);a&&m.on("raphael.drag.move."+
this.id,a);d&&m.on("raphael.drag.end."+this.id,d);m("raphael.drag.start."+this.id,f||e||this,y.clientX+q,y.clientY+k,y)}this._drag={};ib.push({el:this,start:E});this.mousedown(E);return this};Ga.onDragOver=function(a){a?m.on("raphael.drag.over."+this.id,a):m.unbind("raphael.drag.over."+this.id)};Ga.undrag=function(){for(var a=ib.length;a--;)ib[a].el==this&&(this.unmousedown(ib[a].start),ib.splice(a,1),m.unbind("raphael.drag.*."+this.id));!ib.length&&b.unmousemove(Xa).unmouseup(hb)};Ga.follow=function(a,
c,d){if(a.removed||a.constructor!==b.el.constructor)return this;a.followers.push({el:this,stalk:d={before:"insertBefore",after:"insertAfter"}[d],cb:c});d&&this[d](a);return this};Ga.unfollow=function(a){if(a.removed||a.constructor!==b.el.constructor)return this;for(var c=0,d=a.followers.length;c<d;c++)if(a.followers[c].el===this){a.followers.splice(c,1);break}return this};var La=Array.prototype.splice;R.group=function(){var a;a=arguments;var c=a.length-1,d=a[c];d&&d.constructor===b.el.constructor?
(a[c]=void 0,La.call(a,c,1)):d=void 0;a=b._engine.group(this,a[0],d);this.__set__&&this.__set__.push(a);return a};R.circle=function(){var a;a=arguments;var c=a.length-1,d=a[c];d&&d.constructor===b.el.constructor?(a[c]=void 0,La.call(a,c,1)):d=void 0;a=b._engine.circle(this,a[0]||0,a[1]||0,a[2]||0,d);this.__set__&&this.__set__.push(a);return a};R.rect=function(){var a;a=arguments;var c=a.length-1,d=a[c];d&&d.constructor===b.el.constructor?(a[c]=void 0,La.call(a,c,1)):d=void 0;a=b._engine.rect(this,
a[0]||0,a[1]||0,a[2]||0,a[3]||0,a[4]||0,d);this.__set__&&this.__set__.push(a);return a};R.ellipse=function(){var a;a=arguments;var c=a.length-1,d=a[c];d&&d.constructor===b.el.constructor?(a[c]=void 0,La.call(a,c,1)):d=void 0;a=b._engine.ellipse(this,a[0]||0,a[1]||0,a[2]||0,a[3]||0,d);this.__set__&&this.__set__.push(a);return a};R.path=function(){var a,c=arguments,d=c.length-1;(a=c[d])&&a.constructor===b.el.constructor?(c[d]=void 0,La.call(c,d,1)):a=void 0;(c=c[0])&&!b.is(c,"string")&&b.is(c[0],ta);
a=b._engine.path(b.format[v](b,arguments),this,a);this.__set__&&this.__set__.push(a);return a};R.image=function(){var a;a=arguments;var c=a.length-1,d=a[c];d&&d.constructor===b.el.constructor?(a[c]=void 0,La.call(a,c,1)):d=void 0;a=b._engine.image(this,a[0]||"about:blank",a[1]||0,a[2]||0,a[3]||0,a[4]||0,d);this.__set__&&this.__set__.push(a);return a};R.text=function(){var a;a=arguments;var c=a.length-1,d=a[c];d&&d.constructor===b.el.constructor?(a[c]=void 0,La.call(a,c,1)):d=void 0;a=b._engine.text(this,
a[0]||0,a[1]||0,i(a[2]||""),d);this.__set__&&this.__set__.push(a);return a};R.set=function(a){!b.is(a,"array")&&(a=Array.prototype.splice.call(arguments,0,arguments.length));var c=new Ua(a);this.__set__&&this.__set__.push(c);return c};R.setStart=function(a){this.__set__=a||this.set()};R.setFinish=function(){var a=this.__set__;delete this.__set__;return a};R.setSize=function(a,c){return b._engine.setSize.call(this,a,c)};R.setViewBox=function(a,c,d,e,f){return b._engine.setViewBox.call(this,a,c,d,e,
f)};R.top=R.bottom=null;R.raphael=b;R.getElementByPoint=function(a,b){var c=this.canvas,d=D.doc.elementFromPoint(a,b);if(D.win.opera&&d.tagName=="svg"){var e;e=c.getBoundingClientRect();var f=c.ownerDocument,o=f.body,f=f.documentElement;e={y:e.top+(D.win.pageYOffset||f.scrollTop||o.scrollTop)-(f.clientTop||o.clientTop||0),x:e.left+(D.win.pageXOffset||f.scrollLeft||o.scrollLeft)-(f.clientLeft||o.clientLeft||0)};o=c.createSVGRect();o.x=a-e.x;o.y=b-e.y;o.width=o.height=1;e=c.getIntersectionList(o,null);
e.length&&(d=e[e.length-1])}if(!d)return null;for(;d.parentNode&&d!=c.parentNode&&!d.raphael;)d=d.parentNode;d==this.canvas.parentNode&&(d=c);return d=d&&d.raphael?this.getById(d.raphaelid):null};R.getById=function(a){for(var b=this.bottom;b;){if(b.id==a)return b;b=b.next}return null};R.forEach=function(a,b){for(var c=this.bottom;c;){if(a.call(b,c)===!1)break;c=c.next}return this};R.getElementsByPoint=function(a,b){var c=this.set();this.forEach(function(d){d.isPointInside(a,b)&&c.push(d)});return c};
Ga.isPointInside=function(a,c){var d=this.realPath=this.realPath||qa[this.type](this);return b.isPointInsidePath(d,a,c)};Ga.getBBox=function(a){if(this.removed)return{};var b=this._;if(a){if(b.dirty||!b.bboxwt)this.realPath=qa[this.type](this),b.bboxwt=Qa(this.realPath),b.bboxwt.toString=ka,b.dirty=0;return b.bboxwt}if(b.dirty||b.dirtyT||!b.bbox){if(b.dirty||!this.realPath)b.bboxwt=0,this.realPath=qa[this.type](this);b.bbox=Qa(da(this.realPath,this.matrix));b.bbox.toString=ka;b.dirty=b.dirtyT=0}return b.bbox};
Ga.clone=function(){if(this.removed)return null;var a=this.paper[this.type]().attr(this.attr());this.__set__&&this.__set__.push(a);return a};Ga.glow=function(a){if(this.type=="text")return null;for(var a=a||{},a={width:(a.width||10)+(+this.attr("stroke-width")||1),fill:a.fill||!1,opacity:a.opacity||0.5,offsetx:a.offsetx||0,offsety:a.offsety||0,color:a.color||"#000"},b=a.width/2,c=this.paper,d=c.set(),e=this.realPath||qa[this.type](this),e=this.matrix?da(e,this.matrix):e,f=1;f<b+1;f++)d.push(c.path(e).attr({stroke:a.color,
fill:a.fill?a.color:"none","stroke-linejoin":"round","stroke-linecap":"round","stroke-width":+(a.width/b*f).toFixed(3),opacity:+(a.opacity/b).toFixed(3)}));return d.insertBefore(this).translate(a.offsetx,a.offsety)};var lb=function(a,c,d,e,f,o,y,E,k){return k==null?x(a,c,d,e,f,o,y,E):b.findDotsAtSegment(a,c,d,e,f,o,y,E,U(a,c,d,e,f,o,y,E,k))},d=function(a,c){return function(d,e,f){for(var d=o(d),y,E,k,q,ha="",W={},p=0,u=0,Q=d.length;u<Q;u++){k=d[u];if(k[0]=="M")y=+k[1],E=+k[2];else{q=lb(y,E,k[1],k[2],
k[3],k[4],k[5],k[6]);if(p+q>e){if(c&&!W.start){y=lb(y,E,k[1],k[2],k[3],k[4],k[5],k[6],e-p);ha+=["C"+y.start.x,y.start.y,y.m.x,y.m.y,y.x,y.y];if(f)return ha;W.start=ha;ha=["M"+y.x,y.y+"C"+y.n.x,y.n.y,y.end.x,y.end.y,k[5],k[6]].join();p+=q;y=+k[5];E=+k[6];continue}if(!a&&!c)return y=lb(y,E,k[1],k[2],k[3],k[4],k[5],k[6],e-p),{x:y.x,y:y.y,alpha:y.alpha}}p+=q;y=+k[5];E=+k[6]}ha+=k.shift()+k}W.end=ha;y=a?p:c?W:b.findDotsAtSegment(y,E,k[0],k[1],k[2],k[3],k[4],k[5],1);y.alpha&&(y={x:y.x,y:y.y,alpha:y.alpha});
return y}},nb=d(1),ob=d(),ua=d(0,1);b.getTotalLength=nb;b.getPointAtLength=ob;b.getSubpath=function(a,b,c){if(this.getTotalLength(a)-c<1.0E-6)return ua(a,b).end;a=ua(a,c,1);return b?ua(a,b).end:a};Ga.getTotalLength=function(){if(this.type=="path"){if(this.node.getTotalLength)return this.node.getTotalLength();return nb(this.attrs.path)}};Ga.getPointAtLength=function(a){if(this.type=="path")return ob(this.attrs.path,a)};Ga.getSubpath=function(a,c){if(this.type=="path")return b.getSubpath(this.attrs.path,
a,c)};d=b.easing_formulas={linear:function(a){return a},"<":function(a){return J(a,1.7)},">":function(a){return J(a,0.48)},"<>":function(a){var b=0.48-a/1.04,c=va(0.1734+b*b),a=c-b,a=J(ca(a),1/3)*(a<0?-1:1),b=-c-b,b=J(ca(b),1/3)*(b<0?-1:1),a=a+b+0.5;return(1-a)*3*a*a+a*a*a},backIn:function(a){return a*a*(2.70158*a-1.70158)},backOut:function(a){a-=1;return a*a*(2.70158*a+1.70158)+1},elastic:function(a){if(a==!!a)return a;return J(2,-10*a)*pa((a-0.075)*2*X/0.3)+1},bounce:function(a){a<1/2.75?a*=7.5625*
a:a<2/2.75?(a-=1.5/2.75,a=7.5625*a*a+0.75):a<2.5/2.75?(a-=2.25/2.75,a=7.5625*a*a+0.9375):(a-=2.625/2.75,a=7.5625*a*a+0.984375);return a}};d.easeIn=d["ease-in"]=d["<"];d.easeOut=d["ease-out"]=d[">"];d.easeInOut=d["ease-in-out"]=d["<>"];d["back-in"]=d.backIn;d["back-out"]=d.backOut;var xa=[],mb=S&&ia?function(a){setTimeout(a,16)}:window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(a){setTimeout(a,
16)},kb=function(){for(var a=+new Date,c=0;c<xa.length;c++){var d=xa[c];if(!d.el.removed&&!d.paused){var e=a-d.start,f=d.ms,o=d.easing,y=d.from,E=d.diff,k=d.to,q=d.el,ha={},W,p={},u;d.initstatus?(e=(d.initstatus*d.anim.top-d.prev)/(d.percent-d.prev)*f,d.status=d.initstatus,delete d.initstatus,d.stop&&xa.splice(c--,1)):d.status=(d.prev+(d.percent-d.prev)*(e/f))/d.anim.top;if(!(e<0))if(e<f){var Q=o(e/f),t;for(t in y)if(y[aa](t)){switch(Ta[t]){case ma:W=+y[t]+Q*f*E[t];break;case "colour":W="rgb("+[ya(Ra(y[t].r+
Q*f*E[t].r)),ya(Ra(y[t].g+Q*f*E[t].g)),ya(Ra(y[t].b+Q*f*E[t].b))].join(",")+")";break;case "path":W=[];e=0;for(o=y[t].length;e<o;e++){W[e]=[y[t][e][0]];k=1;for(p=y[t][e].length;k<p;k++)W[e][k]=(+y[t][e][k]+Q*f*E[t][e][k]).toFixed(4);W[e]=W[e].join(j)}W=W.join(j);break;case "transform":if(E[t].real){W=[];e=0;for(o=y[t].length;e<o;e++){W[e]=[y[t][e][0]];k=1;for(p=y[t][e].length;k<p;k++)W[e][k]=y[t][e][k]+Q*f*E[t][e][k]}}else W=function(a){return+y[t][a]+Q*f*E[t][a]},W=[["m",W(0),W(1),W(2),W(3),W(4),
W(5)]];break;case "csv":if(t=="clip-rect"){W=[];for(e=4;e--;)W[e]=+y[t][e]+Q*f*E[t][e]}break;default:o=[][C](y[t]);W=[];for(e=q.ca[t].length;e--;)W[e]=+o[e]+Q*f*E[t][e]}ha[t]=W}q.attr(ha);(function(a,b,c){setTimeout(function(){m("raphael.anim.frame."+a,b,c)})})(q.id,q,d.anim)}else{(function(a,c,d){setTimeout(function(){m("raphael.anim.frame."+c.id,c,d);m("raphael.anim.finish."+c.id,c,d);b.is(a,"function")&&a.call(c)})})(d.callback,q,d.anim);q.attr(k);xa.splice(c--,1);if(d.repeat>1&&!d.next){for(u in k)k[aa](u)&&
(p[u]=d.totalOrigin[u]);d.el.attr(p);K(d.anim,d.el,d.anim.percents[0],null,d.totalOrigin,d.repeat-1)}d.next&&!d.stop&&K(d.anim,d.el,d.next,null,d.totalOrigin,d.repeat)}}}b.svg&&q&&q.paper&&q.paper.safari();xa.length&&mb(kb)},ya=function(a){return a>255?255:a<0?0:a};Ga.animateWith=function(a,c,d,e,f,o){if(this.removed)return o&&o.call(this),this;d=d instanceof V?d:b.animation(d,e,f,o);K(d,this,d.percents[0],null,this.attr());d=0;for(e=xa.length;d<e;d++)if(xa[d].anim==c&&xa[d].el==a){xa[e-1].start=
xa[d].start;break}return this};Ga.onAnimation=function(a){a?m.on("raphael.anim.frame."+this.id,a):m.unbind("raphael.anim.frame."+this.id);return this};V.prototype.delay=function(a){var b=new V(this.anim,this.ms);b.times=this.times;b.del=+a||0;return b};V.prototype.repeat=function(a){var b=new V(this.anim,this.ms);b.del=this.del;b.times=q.floor(u(a,0))||1;return b};b.animation=function(a,c,d,e){if(a instanceof V)return a;if(b.is(d,"function")||!d)e=e||d||null,d=null;var a=Object(a),c=+c||0,f={},o,
y;for(y in a)a[aa](y)&&sa(y)!=y&&sa(y)+"%"!=y&&(o=!0,f[y]=a[y]);return o?(d&&(f.easing=d),e&&(f.callback=e),new V({100:f},c)):new V(a,c)};Ga.animate=function(a,c,d,e){if(this.removed)return e&&e.call(this),this;a=a instanceof V?a:b.animation(a,c,d,e);K(a,this,a.percents[0],null,this.attr());return this};Ga.setTime=function(a,b){a&&b!=null&&this.status(a,N(b,a.ms)/a.ms);return this};Ga.status=function(a,b){var c=[],d=0,e,f;if(b!=null)return K(a,this,-1,N(b,1)),this;else{for(e=xa.length;d<e;d++)if(f=
xa[d],f.el.id==this.id&&(!a||f.anim==a)){if(a)return f.status;c.push({anim:f.anim,status:f.status})}if(a)return 0;return c}};Ga.pause=function(a){for(var b=0;b<xa.length;b++)if(xa[b].el.id==this.id&&(!a||xa[b].anim==a)&&m("raphael.anim.pause."+this.id,this,xa[b].anim)!==!1)xa[b].paused=!0;return this};Ga.resume=function(a){for(var b=0;b<xa.length;b++)if(xa[b].el.id==this.id&&(!a||xa[b].anim==a)){var c=xa[b];m("raphael.anim.resume."+this.id,this,c.anim)!==!1&&(delete c.paused,this.status(c.anim,c.status))}return this};
Ga.stop=function(a){for(var b=0;b<xa.length;b++)xa[b].el.id==this.id&&(!a||xa[b].anim==a)&&m("raphael.anim.stop."+this.id,this,xa[b].anim)!==!1&&xa.splice(b--,1);return this};m.on("raphael.remove",Y);m.on("raphael.clear",Y);Ga.toString=function(){return"Rapha\u00ebl\u2019s object"};Ga.toFront=function(){if(this.removed)return this;var a=b._engine.getNode(this),c=this.parent,d=this.followers,e;b._tofront(this,c)&&c.canvas.appendChild(a);a=0;for(c=d.length;a<c;a++)(e=d[a]).stalk&&e.el[e.stalk](this);
return this};Ga.toBack=function(){if(this.removed)return this;var a=b._engine.getNode(this),c=this.parent,d=this.followers,e;b._toback(this,c)&&c.canvas.insertBefore(a,c.canvas.firstChild);a=0;for(c=d.length;a<c;a++)(e=d[a]).stalk&&e.el[e.stalk](this);return this};Ga.insertAfter=function(a){if(this.removed)return this;var c=b._engine.getNode(this),d=b._engine.getLastNode(a),e=a.parent.canvas,f=this.followers,o;d.nextSibling?e.insertBefore(c,d.nextSibling):e.appendChild(c);b._insertafter(this,a,this.parent,
a.parent);c=0;for(d=f.length;c<d;c++)(o=f[c]).stalk&&o.el[o.stalk](a);return this};Ga.insertBefore=function(a){if(this.removed)return this;var c=b._engine.getNode(this),d=b._engine.getNode(a),e=this.followers,f;a.parent.canvas.insertBefore(c,d);b._insertbefore(this,a,this.parent,a.parent);this.parent=a.parent;c=0;for(d=e.length;c<d;c++)(f=e[c]).stalk&&f.el[f.stalk](a);return this};Ga.appendChild=function(a){if(this.removed||this.type!=="group")return this;var c=this.followers,d,e,f;if(a.parent===
this)return a.toFront(),this;e=b._engine.getNode(a);b._tear(a,a.parent);this.canvas.appendChild(e);a.parent=this;!this.bottom&&(this.bottom=a);a.prev=this.top;a.next=null;this.top&&(this.top.next=a);this.top=a;e=0;for(f=c.length;e<f;e++)(d=c[e]).stalk&&d.el[d.stalk](a);return this};Ga.removeChild=function(a){if(this.removed||this.type!=="group"||a.parent!==this)return this;var c=b._engine.getNode(a),d=this.paper;b._tear(a,this);d.canvas.appendChild(c);this.parent=d;!d.bottom&&(d.bottom=this);(this.prev=
d.top)&&(d.top.next=this);d.top=this;this.next=null;return this};var Ua=function(a){this.items=[];this.length=0;this.type="set";if(a)for(var b=0,c=a.length;b<c;b++)if(a[b]&&(a[b].constructor==Ga.constructor||a[b].constructor==Ua))this[this.items.length]=this.items[this.items.length]=a[b],this.length++},d=Ua.prototype;d.push=function(){for(var a,b,c=0,d=arguments.length;c<d;c++)if((a=arguments[c])&&(a.constructor==Ga.constructor||a.constructor==Ua))b=this.items.length,this[b]=this.items[b]=a,this.length++;
return this};d.pop=function(){this.length&&delete this[this.length--];return this.items.pop()};d.forEach=function(a,b){for(var c=0,d=this.items.length;c<d;c++)if(a.call(b,this.items[c],c)===!1)break;return this};for(var Ya in Ga)Ga[aa](Ya)&&(d[Ya]=function(a){return function(){var b=arguments;return this.forEach(function(c){c[a][v](c,b)})}}(Ya));d.attr=function(a,c){if(a&&b.is(a,ta)&&b.is(a[0],"object"))for(var d=0,e=a.length;d<e;d++)this.items[d].attr(a[d]);else{d=0;for(e=this.items.length;d<e;d++)this.items[d].attr(a,
c)}return this};d.clear=function(){for(;this.length;)this.pop()};d.splice=function(a,b){var a=a<0?u(this.length+a,0):a,b=u(0,N(this.length-a,isNaN(b)&&this.length||b)),c=[],d=[],e=[],f;for(f=2;f<arguments.length;f++)e.push(arguments[f]);for(f=0;f<b;f++)d.push(this[a+f]);for(;f<this.length-a;f++)c.push(this[a+f]);var o=e.length;for(f=0;f<o+c.length;f++)this.items[a+f]=this[a+f]=f<o?e[f]:c[f-o];for(f=this.items.length=this.length-=b-o;this[f];)delete this[f++];return new Ua(d)};d.exclude=function(a){for(var b=
0,c=this.length;b<c;b++)if(this[b]==a)return this.splice(b,1),!0};d.animate=function(a,c,d,e){(b.is(d,"function")||!d)&&(e=d||null);var f=this.items.length,o=f,y=this,E;if(!f)return this;e&&(E=function(){!--f&&e.call(y)});d=b.is(d,"string")?d:E;c=b.animation(a,c,d,E);for(a=this.items[--o].animate(c);o--;)this.items[o]&&!this.items[o].removed&&this.items[o].animateWith(a,c,c);return this};d.insertAfter=function(a){for(var b=this.items.length;b--;)this.items[b].insertAfter(a);return this};d.getBBox=
function(){for(var a=[],b=[],c=[],d=[],e=this.items.length;e--;)if(!this.items[e].removed){var f=this.items[e].getBBox();a.push(f.x);b.push(f.y);c.push(f.x+f.width);d.push(f.y+f.height)}a=N[v](0,a);b=N[v](0,b);c=u[v](0,c);d=u[v](0,d);return{x:a,y:b,x2:c,y2:d,width:c-a,height:d-b}};d.clone=function(a){for(var a=new Ua,b=0,c=this.items.length;b<c;b++)a.push(this.items[b].clone());return a};d.toString=function(){return"Rapha\u00ebl\u2018s set"};b.registerFont=function(a){if(!a.face)return a;this.fonts=
this.fonts||{};var b={w:a.w,face:{},glyphs:{}},c=a.face["font-family"],d;for(d in a.face)a.face[aa](d)&&(b.face[d]=a.face[d]);this.fonts[c]?this.fonts[c].push(b):this.fonts[c]=[b];if(!a.svg){b.face["units-per-em"]=Ma(a.face["units-per-em"],10);for(var e in a.glyphs)if(a.glyphs[aa](e)&&(c=a.glyphs[e],b.glyphs[e]={w:c.w,k:{},d:c.d&&"M"+c.d.replace(/[mlcxtrv]/g,function(a){return{l:"L",c:"C",x:"z",t:"m",r:"l",v:"c"}[a]||"M"})+"z"},c.k))for(var f in c.k)c[aa](f)&&(b.glyphs[e].k[f]=c.k[f])}return a};R.getFont=
function(a,c,d,e){e=e||"normal";d=d||"normal";c=+c||{normal:400,bold:700,lighter:300,bolder:800}[c]||400;if(b.fonts){var f=b.fonts[a];if(!f){var a=RegExp("(^|\\s)"+a.replace(/[^\w\d\s+!~.:_-]/g,"")+"(\\s|$)","i"),o;for(o in b.fonts)if(b.fonts[aa](o)&&a.test(o)){f=b.fonts[o];break}}var y;if(f){o=0;for(a=f.length;o<a;o++)if(y=f[o],y.face["font-weight"]==c&&(y.face["font-style"]==d||!y.face["font-style"])&&y.face["font-stretch"]==e)break}return y}};R.print=function(a,d,e,f,o,y,E){var y=y||"middle",E=
u(N(E||0,1),-1),k=i(e)[c](""),q=0,W=0,ha="";b.is(f,e)&&(f=this.getFont(f));if(f)for(var e=(o||16)/f.face["units-per-em"],p=f.face.bbox[c](l),o=+p[0],Q=p[3]-p[1],t=0,y=+p[1]+(y=="baseline"?Q+ +f.face.descent:Q/2),p=0,ja=k.length;p<ja;p++){if(k[p]=="\n")W=z=q=0,t+=Q;else{var Ea=W&&f.glyphs[k[p-1]]||{},z=f.glyphs[k[p]];q+=W?(Ea.w||f.w)+(Ea.k&&Ea.k[k[p]]||0)+f.w*E:0;W=1}z&&z.d&&(ha+=b.transformPath(z.d,["t",q*e,t*e,"s",e,e,o,y,"t",(a-o)/e,(d-y)/e]))}return this.path(ha).attr({fill:"#000",stroke:"none"})};
R.add=function(a){if(b.is(a,"array"))for(var c=this.set(),d=0,e=a.length,f;d<e;d++)f=a[d]||{},n[aa](f.type)&&c.push(this[f.type]().attr(f));return c};b.format=function(a,c){var d=b.is(c,ta)?[0][C](c):arguments;a&&b.is(a,"string")&&d.length-1&&(a=a.replace(F,function(a,b){return d[++b]==null?"":d[b]}));return a||""};b.fullfill=function(){var a=/\{([^\}]+)\}/g,b=/(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g,c=function(a,c,d){var e=d;c.replace(b,function(a,b,c,d,f){b=b||d;e&&(b in e&&(e=
e[b]),typeof e=="function"&&f&&(e=e()))});return e=(e==null||e==d?a:e)+""};return function(b,d){return String(b).replace(a,function(a,b){return c(a,b,d)})}}();b.ninja=function(){Z.was?D.win.Raphael=Z.is:delete Raphael;return b};b.st=d;(function(a,c,d){function e(){/in/.test(a.readyState)?setTimeout(e,9):b.eve("raphael.DOMload")}if(a.readyState==null&&a.addEventListener)a.addEventListener(c,d=function(){a.removeEventListener(c,d,!1);a.readyState="complete"},!1),a.readyState="loading";e()})(document,
"DOMContentLoaded");Z.was?D.win.Raphael=b:Raphael=b;m.on("raphael.DOMload",function(){O=!0})})();window.Raphael.svg&&function(b){var g=String,e=parseFloat,r=parseInt,h=Math,m=h.max,w=h.abs,s=h.pow,ka=h.sqrt,G=/[, ]+/,V=!(!/AppleWebKit/.test(b._g.win.navigator.userAgent)||/Chrome/.test(b._g.win.navigator.userAgent)&&!(b._g.win.navigator.appVersion.match(/Chrome\/(\d+)\./)[1]<29)),K=b.eve,U={block:"M5,0 0,2.5 5,5z",classic:"M5,0 0,2.5 5,5 3.5,3 3.5,2z",diamond:"M2.5,0 5,2.5 2.5,5 0,2.5z",open:"M6,1 1,3.5 6,6",
oval:"M2.5,0A2.5,2.5,0,0,1,2.5,5 2.5,2.5,0,0,1,2.5,0z"},O=b._shapeRenderingAttrs={speed:"optimizeSpeed",crisp:"crispEdges",precision:"geometricPrecision"},l={};b._url=/msie/i.test(navigator.userAgent)&&!window.opera?"":window.location.href.replace(/#.*?$/,"");b.toString=function(){return"Your browser supports SVG.\nYou are running Rapha\u00ebl "+this.version};var n=b._createNode=function(a,c){if(c){typeof a=="string"&&(a=n(a));for(var d in c)c.hasOwnProperty(d)&&(d.substring(0,6)=="xlink:"?a.setAttributeNS("http://www.w3.org/1999/xlink",
d.substring(6),g(c[d])):a.setAttribute(d,g(c[d])))}else a=b._g.doc.createElementNS("http://www.w3.org/2000/svg",a);return a},F={userSpaceOnUse:"userSpaceOnUse",objectBoundingBox:"objectBoundingBox"},aa={pad:"pad",redlect:"reflect",repeat:"repeat"},D=function(a,c){var d="linear",f=a.id+c,j=0.5,i=0.5,r,l,v,G,C,R=a.node,D=a.paper,O=R.style,K=b._g.doc.getElementById(f);if(!K&&D.defs){c=g(c).replace(b._radial_gradient,function(a,b){d="radial";b=b&&b.split(",")||[];G=b[5];C=b[6];var c=b[0],f=b[1],k=b[2],
u=b[3],g=b[4],n=c&&f,h;k&&(r=/\%/.test(k)?k:e(k));if(G===F.userSpaceOnUse)return n&&(j=c,i=f),u&&g&&(l=u,v=g,n||(j=l,i=v)),"";n&&(j=e(c),i=e(f),c=(i>0.5)*2-1,(h=s(j-0.5,2))+s(i-0.5,2)>0.25&&h<0.25&&(i=ka(0.25-h)*c+0.5)&&i!==0.5&&(i=i.toFixed(5)-1.0E-5*c));u&&g&&(l=e(u),v=e(g),c=(v>0.5)*2-1,(h=s(l-0.5,2))+s(v-0.5,2)>0.25&&h<0.25&&(v=ka(0.25-h)*c+0.5)&&v!==0.5&&(v=v.toFixed(5)-1.0E-5*c),n||(j=l,i=v));return""});c=c.split(/\s*\-\s*/);if(d=="linear"){var K=c.shift(),V=K.match(/\((.*)\)/),M,V=V&&V[1]&&
V[1].split(/\s*\,\s*/),K=-e(K);if(isNaN(K))return null;V&&V.length?(V[0]in F?(G=V.shift(),V[0]in aa&&(C=V.shift())):(V[4]&&(G=V[4]),V[5]&&(C=V[5])),M=[V[0]||"0%",V[1]||"0%",V[2]||"100%",V[3]||"0%"]):(M=[0,0,h.cos(b.rad(K)),h.sin(b.rad(K))],K=1/(m(w(M[2]),w(M[3]))||1),M[2]*=K,M[3]*=K,M[2]<0&&(M[0]=-M[2],M[2]=0),M[3]<0&&(M[1]=-M[3],M[3]=0))}V=b._parseDots(c);if(!V)return null;f=f.replace(/[\(\)\s,\xb0#]/g,"_");a.gradient&&f!==a.gradient.id&&(D.defs.removeChild(a.gradient),delete a.gradient);if(!a.gradient){K=
n(d+"Gradient",{id:f});a.gradient=K;G in F&&K.setAttribute("gradientUnits",g(G));C in aa&&K.setAttribute("spreadMethod",g(C));d==="radial"?(r!==void 0&&K.setAttribute("r",g(r)),l!==void 0&&v!==void 0&&(K.setAttribute("cx",g(l)),K.setAttribute("cy",g(v))),K.setAttribute("fx",g(j)),K.setAttribute("fy",g(i))):n(K,{x1:M[0],y1:M[1],x2:M[2],y2:M[3],gradientTransform:a.matrix.invert()});D.defs.appendChild(K);D=0;for(M=V.length;D<M;D++)K.appendChild(n("stop",{offset:V[D].offset?V[D].offset:D?"100%":"0%",
"stop-color":V[D].color||"#fff","stop-opacity":V[D].opacity===void 0?1:V[D].opacity}))}}n(R,{fill:"url('"+b._url+"#"+f+"')",opacity:1,"fill-opacity":1});O.fill="";O.opacity=1;return O.fillOpacity=1},M=function(a){var b=a.getBBox(1);n(a.pattern,{patternTransform:a.matrix.invert()+" translate("+b.x+","+b.y+")"})},Z=function(a,c,d){if(a.type=="path"){for(var e=g(c).toLowerCase().split("-"),f=a.paper,j=d?"end":"start",i=a.node,s=a.attrs,r=s["stroke-width"],h=e.length,v="classic",m,x,w=3,F=3,G=5;h--;)switch(e[h]){case "block":case "classic":case "oval":case "diamond":case "open":case "none":v=
e[h];break;case "wide":F=5;break;case "narrow":F=2;break;case "long":w=5;break;case "short":w=2}v=="open"?(w+=2,F+=2,G+=2,m=1,x=d?4:1,e={fill:"none",stroke:s.stroke}):(x=m=w/2,e={fill:s.stroke,stroke:"none"});a._.arrows?d?(a._.arrows.endPath&&l[a._.arrows.endPath]--,a._.arrows.endMarker&&l[a._.arrows.endMarker]--):(a._.arrows.startPath&&l[a._.arrows.startPath]--,a._.arrows.startMarker&&l[a._.arrows.startMarker]--):a._.arrows={};if(v!="none"){var h="raphael-marker-"+v,C="raphael-marker-"+j+v+w+F;b._g.doc.getElementById(h)?
l[h]++:(f.defs.appendChild(n(n("path"),{"stroke-linecap":"round",d:U[v],id:h})),l[h]=1);var R=b._g.doc.getElementById(C);R?(l[C]++,w=R.getElementsByTagName("use")[0]):(R=n(n("marker"),{id:C,markerHeight:F,markerWidth:w,orient:"auto",refX:x,refY:F/2}),w=n(n("use"),{"xlink:href":"#"+h,transform:(d?"rotate(180 "+w/2+" "+F/2+") ":"")+"scale("+w/G+","+F/G+")","stroke-width":(1/((w/G+F/G)/2)).toFixed(4)}),R.appendChild(w),f.defs.appendChild(R),l[C]=1);n(w,e);f=m*(v!="diamond"&&v!="oval");d?(d=a._.arrows.startdx*
r||0,r=b.getTotalLength(s.path)-f*r):(d=f*r,r=b.getTotalLength(s.path)-(a._.arrows.enddx*r||0));e={};e["marker-"+j]="url('"+b._url+"#"+C+"')";if(r||d)e.d=Raphael.getSubpath(s.path,d,r);n(i,e);a._.arrows[j+"Path"]=h;a._.arrows[j+"Marker"]=C;a._.arrows[j+"dx"]=f;a._.arrows[j+"Type"]=v;a._.arrows[j+"String"]=c}else d?(d=a._.arrows.startdx*r||0,r=b.getTotalLength(s.path)-d):(d=0,r=b.getTotalLength(s.path)-(a._.arrows.enddx*r||0)),a._.arrows[j+"Path"]&&n(i,{d:Raphael.getSubpath(s.path,d,r)}),delete a._.arrows[j+
"Path"],delete a._.arrows[j+"Marker"],delete a._.arrows[j+"dx"],delete a._.arrows[j+"Type"],delete a._.arrows[j+"String"];for(e in l)l.hasOwnProperty(e)&&!l[e]&&(a=b._g.doc.getElementById(e))&&a.parentNode.removeChild(a)}},R={"":[0],none:[0],"-":[3,1],".":[1,1],"-.":[3,1,1,1],"-..":[3,1,1,1,1,1],". ":[1,3],"- ":[4,3],"--":[8,3],"- .":[4,3,1,3],"--.":[8,3,1,3],"--..":[8,3,1,3,1,3]},v=function(a,c,d){var e=R[g(c).toLowerCase()];if(c=e||c!==void 0&&[].concat(c)){var f=a.attrs["stroke-width"]||"1",d=
{round:f,square:f,butt:0}[a.attrs["stroke-linecap"]||d["stroke-linecap"]]||0,j,i=j=c.length;if(e)for(;j--;)c[j]=c[j]*f+(j%2?1:-1)*d;else for(j=0;j<i;j+=2)c[j]-=d,c[j+1]&&(c[j+1]+=d),c[j]<=0&&(c[j]=0.1);b.is(c,"array")&&n(a.node,{"stroke-dasharray":c.join(",")})}},C=b._setFillAndStroke=function(a,c){if(a.paper.canvas){var d=a.node,e=a.attrs,j=a.paper,i=d.style.visibility;d.style.visibility="hidden";for(var s in c)if(c.hasOwnProperty(s)&&b._availableAttrs.hasOwnProperty(s)){var h=c[s];e[s]=h;switch(s){case "blur":a.blur(h);
break;case "href":case "title":case "target":var l=d.parentNode;if(l.tagName.toLowerCase()!="a"){if(h=="")break;var x=n("a");l.insertBefore(x,d);x.appendChild(d);l=x}s=="target"?l.setAttributeNS("http://www.w3.org/1999/xlink","show",h=="blank"?"new":h):l.setAttributeNS("http://www.w3.org/1999/xlink",s,h);d.titleNode=l;break;case "cursor":d.style.cursor=h;break;case "transform":a.transform(h);break;case "rotation":b.is(h,"array")?a.rotate.apply(a,h):a.rotate(h);break;case "arrow-start":Z(a,h);break;
case "arrow-end":Z(a,h,1);break;case "clip-path":var F=!0;case "clip-rect":l=!F&&g(h).split(G);a._.clipispath=!!F;if(F||l.length==4){a.clip&&a.clip.parentNode.parentNode.removeChild(a.clip.parentNode);var x=n("clipPath"),C=n(F?"path":"rect");x.id=b.createUUID();n(C,F?{d:h?e["clip-path"]=b._pathToAbsolute(h):b._availableAttrs.path,fill:"none"}:{x:l[0],y:l[1],width:l[2],height:l[3],transform:a.matrix.invert()});x.appendChild(C);j.defs.appendChild(x);n(d,{"clip-path":"url('"+b._url+"#"+x.id+"')"});a.clip=
C}if(!h&&(h=d.getAttribute("clip-path")))(h=b._g.doc.getElementById(h.replace(/(^url\(#|\)$)/g,"")))&&h.parentNode.removeChild(h),n(d,{"clip-path":""}),delete a.clip;break;case "path":if(a.type=="path")n(d,{d:h?e.path=b._pathToAbsolute(h):b._availableAttrs.path}),a._.dirty=1,a._.arrows&&("startString"in a._.arrows&&Z(a,a._.arrows.startString),"endString"in a._.arrows&&Z(a,a._.arrows.endString,1));break;case "width":if(d.setAttribute(s,h),a._.dirty=1,e.fx)s="x",h=e.x;else break;case "x":e.fx&&(h=-e.x-
(e.width||0));case "rx":if(s=="rx"&&a.type=="rect")break;case "cx":d.setAttribute(s,h);a.pattern&&M(a);a._.dirty=1;break;case "height":if(d.setAttribute(s,h),a._.dirty=1,e.fy)s="y",h=e.y;else break;case "y":e.fy&&(h=-e.y-(e.height||0));case "ry":if(s=="ry"&&a.type=="rect")break;case "cy":d.setAttribute(s,h);a.pattern&&M(a);a._.dirty=1;break;case "r":a.type=="rect"?n(d,{rx:h,ry:h}):d.setAttribute(s,h);a._.dirty=1;break;case "src":a.type=="image"&&d.setAttributeNS("http://www.w3.org/1999/xlink","href",
h);break;case "stroke-width":if(a._.sx!=1||a._.sy!=1)h/=m(w(a._.sx),w(a._.sy))||1;j._vbSize&&(h*=j._vbSize);V&&h===0&&(h=1.0E-6);d.setAttribute(s,h);e["stroke-dasharray"]&&v(a,e["stroke-dasharray"],c);a._.arrows&&("startString"in a._.arrows&&Z(a,a._.arrows.startString),"endString"in a._.arrows&&Z(a,a._.arrows.endString,1));break;case "stroke-dasharray":v(a,h,c);break;case "fill":var R=g(h).match(b._ISURL);if(R){var x=n("pattern"),ka=n("image");x.id=b.createUUID();n(x,{x:0,y:0,patternUnits:"userSpaceOnUse",
height:1,width:1});n(ka,{x:0,y:0,"xlink:href":R[1]});x.appendChild(ka);(function(a){b._preload(R[1],function(){var b=this.offsetWidth,c=this.offsetHeight;n(a,{width:b,height:c});n(ka,{width:b,height:c});j.safari()})})(x);j.defs.appendChild(x);n(d,{fill:"url('"+b._url+"#"+x.id+"')"});a.pattern=x;a.pattern&&M(a);break}l=b.getRGB(h);if(l.error){if((a.type=="circle"||a.type=="ellipse"||g(h).charAt()!="r")&&D(a,h)){if("opacity"in e||"fill-opacity"in e)if(l=b._g.doc.getElementById(d.getAttribute("fill").replace(/^url\(#|\)$/g,
"")))l=l.getElementsByTagName("stop"),n(l[l.length-1],{"stop-opacity":("opacity"in e?e.opacity:1)*("fill-opacity"in e?e["fill-opacity"]:1)});e.gradient=h;e.fill="none";break}}else delete c.gradient,delete e.gradient,!b.is(e.opacity,"undefined")&&b.is(c.opacity,"undefined")&&n(d,{opacity:e.opacity}),!b.is(e["fill-opacity"],"undefined")&&b.is(c["fill-opacity"],"undefined")&&n(d,{"fill-opacity":e["fill-opacity"]});l.hasOwnProperty("opacity")?(n(d,{"fill-opacity":l.opacity>1?l.opacity/100:l.opacity}),
a._.opacitydirty=!0):a._.opacitydirty&&b.is(e["fill-opacity"],"undefined")&&b.is(c["fill-opacity"],"undefined")&&(d.removeAttribute("fill-opacity"),delete a._.opacitydirty);case "stroke":l=b.getRGB(h);d.setAttribute(s,l.hex);s=="stroke"&&l.hasOwnProperty("opacity")&&n(d,{"stroke-opacity":l.opacity>1?l.opacity/100:l.opacity});s=="stroke"&&a._.arrows&&("startString"in a._.arrows&&Z(a,a._.arrows.startString),"endString"in a._.arrows&&Z(a,a._.arrows.endString,1));break;case "gradient":(a.type=="circle"||
a.type=="ellipse"||g(h).charAt()!="r")&&D(a,h);break;case "shape-rendering":e[s]=h=O[h]||h||"default";d.setAttribute(s,h);d.style.shapeRendering=h;break;case "line-height":case "vertical-align":break;case "visibility":h==="hidden"?a.hide():a.show();break;case "opacity":e.gradient&&!e.hasOwnProperty("stroke-opacity")&&n(d,{"stroke-opacity":h>1?h/100:h});case "fill-opacity":if(e.gradient){if(l=b._g.doc.getElementById(d.getAttribute("fill").replace(/^url\(#|\)$/g,"")))l=l.getElementsByTagName("stop"),
n(l[l.length-1],{"stop-opacity":h});break}default:s=="font-size"&&(h=r(h,10)+"px"),l=s.replace(/(\-.)/g,function(a){return a.substring(1).toUpperCase()}),d.style[l]=h,a._.dirty=1,d.setAttribute(s,h)}}f(a,c);d.style.visibility=i}},f=function(a,c){if(!(a.type!="text"||!c.hasOwnProperty("text")&&!c.hasOwnProperty("font")&&!c.hasOwnProperty("font-size")&&!c.hasOwnProperty("x")&&!c.hasOwnProperty("y")&&!c.hasOwnProperty("line-height")&&!c.hasOwnProperty("vertical-align"))){var d=a.attrs,f=a.node,j=f.firstChild&&
b._g.doc.defaultView.getComputedStyle(f.firstChild,""),j=j?e(j.getPropertyValue("font-size")):e(c["font-size"]||d["font-size"])||10,i=e(c["line-height"]||d["line-height"])||j*1.2,h=d.hasOwnProperty("vertical-align")?d["vertical-align"]:"middle";isNaN(j)&&(j=10);isNaN(i)&&(i=j*1.2);h=h==="top"?-0.5:h==="bottom"?0.5:0;if(c.hasOwnProperty("text")&&(c.text!==d.text||a._textdirty)){for(d.text=c.text;f.firstChild;)f.removeChild(f.firstChild);for(var s=g(c.text).split(/\n|<br\s*?\/?>/ig),j=[],l,r=0,v=s.length;r<
v;r++)l=n("tspan"),r?n(l,{dy:i,x:d.x}):n(l,{dy:i*s.length*h,x:d.x}),s[r]||(l.setAttributeNS("http://www.w3.org/XML/1998/namespace","xml:space","preserve"),s[r]=" "),l.appendChild(b._g.doc.createTextNode(s[r])),f.appendChild(l),j[r]=l;a._textdirty=!1}else{j=f.getElementsByTagName("tspan");r=0;for(v=j.length;r<v;r++)r?n(j[r],{dy:i,x:d.x}):n(j[0],{dy:i*j.length*h,x:d.x})}n(f,{x:d.x,y:d.y});a._.dirty=1;f=a._getBBox();i=d.y-(f.y+f.height/2);if(f.isCalculated)switch(d["vertical-align"]){case "top":i=f.height*
0.75;break;case "bottom":i=-(f.height*0.25);break;default:i=d.y-(f.y+f.height*0.25)}i&&b.is(i,"finite")&&j[0]&&n(j[0],{dy:i})}},j=function(a,c,d){d=d||c;this.node=this[0]=a;a.raphael=!0;a.raphaelid=this.id=b._oid++;this.matrix=b.matrix();this.realPath=null;this.attrs=this.attrs||{};this.styles=this.styles||{};this.followers=this.followers||[];this.paper=c;this.ca=this.customAttributes=this.customAttributes||new c._CustomAttributes;this._={transform:[],sx:1,sy:1,deg:0,dx:0,dy:0,dirty:1};this.parent=
d;!d.bottom&&(d.bottom=this);(this.prev=d.top)&&(d.top.next=this);d.top=this;this.next=null},i=b.el;j.prototype=i;i.constructor=j;b._engine.getNode=function(a){a=a.node||a[0].node;return a.titleNode||a};b._engine.getLastNode=function(a){a=a.node||a[a.length-1].node;return a.titleNode||a};b._engine.path=function(a,b,c){var d=n("path");c&&c.canvas&&c.canvas.appendChild(d)||b.canvas&&b.canvas.appendChild(d);b=new j(d,b,c);b.type="path";C(b,{fill:"none",stroke:"#000",path:a});return b};i.rotate=function(a,
b,c){if(this.removed)return this;a=g(a).split(G);a.length-1&&(b=e(a[1]),c=e(a[2]));a=e(a[0]);c==null&&(b=c);if(b==null||c==null)c=this.getBBox(1),b=c.x+c.width/2,c=c.y+c.height/2;this.transform(this._.transform.concat([["r",a,b,c]]));return this};i.scale=function(a,b,c,d){var f;if(this.removed)return this;a=g(a).split(G);a.length-1&&(b=e(a[1]),c=e(a[2]),d=e(a[3]));a=e(a[0]);b==null&&(b=a);d==null&&(c=d);if(c==null||d==null)f=this.getBBox(1);c=c==null?f.x+f.width/2:c;d=d==null?f.y+f.height/2:d;this.transform(this._.transform.concat([["s",
a,b,c,d]]));return this};i.translate=function(a,b){if(this.removed)return this;a=g(a).split(G);a.length-1&&(b=e(a[1]));a=e(a[0])||0;this.transform(this._.transform.concat([["t",a,+b||0]]));return this};i.transform=function(a){var c=this._;if(a==null)return c.transform;b._extractTransform(this,a);this.clip&&!c.clipispath&&n(this.clip,{transform:this.matrix.invert()});this.pattern&&M(this);this.node&&n(this.node,{transform:this.matrix});if(c.sx!=1||c.sy!=1)a=this.attrs.hasOwnProperty("stroke-width")?
this.attrs["stroke-width"]:1,this.attr({"stroke-width":a});return this};i.hide=function(){!this.removed&&this.paper.safari(this.node.style.display="none");return this};i.show=function(){!this.removed&&this.paper.safari(this.node.style.display="");return this};i.remove=function(){if(!this.removed&&this.parent.canvas){var a=b._engine.getNode(this),c=this.paper,d=c.defs;c.__set__&&c.__set__.exclude(this);K.unbind("raphael.*.*."+this.id);for(this.gradient&&d&&d.removeChild(this.gradient);d=this.followers.pop();)d.el.remove();
this.parent.canvas.removeChild(a);b._tear(this,c);for(d in this)this[d]=typeof this[d]==="function"?b._removedFactory(d):null;this.removed=!0}};i._getBBox=function(){var a=this.node,b={},c=this.attrs,d,e;a.style.display==="none"&&(this.show(),e=!0);try{if(b=a.getBBox(),this.type=="text"){if(b.x===void 0)b.isCalculated=!0,d=c["text-anchor"],b.x=(c.x||0)-b.width*(d==="start"?0:d==="middle"?0.5:1);if(b.y===void 0)b.isCalculated=!0,d=c["vertical-align"],b.y=(c.y||0)-b.height*(d==="bottom"?1:d==="middle"?
0.5:0)}}catch(f){}finally{b=b||{}}e&&this.hide();return b};i.css=function(a,c){if(this.removed)return this;if(c==null&&b.is(a,"string")){for(var d=a.split(G),e={},f=0,j=d.length;f<j;f++)a=d[f],a in this.styles&&(e[a]=this.styles[a]);return j-1?e:e[d[0]]}if(c==null&&b.is(a,"array")){e={};f=0;for(j=a.length;f<j;f++)e[a[f]]=this.styles(a[f]);return e}c!=null?(d={},d[a]=c):a!=null&&b.is(a,"object")&&(d=a);e={};for(j in d)f=j.replace(/\B([A-Z]{1})/g,"-$1").toLowerCase(),b._availableAttrs.hasOwnProperty(f)||
f==="color"?(f==="color"&&this.type==="text"&&(f="fill"),e[f]=d[j],e.dirty=!0):(K("raphael.css."+f+"."+this.id,this,d[j],f),this.node.style[f]=d[j],this.styles[f]=d[j]);f=0;for(j=this.followers.length;f<j;f++)this.followers[f].el.css(d);e.hasOwnProperty("dirty")&&(delete e.dirty,this.attr(e));return this};i.attr=function(a,c){if(this.removed)return this;if(a==null){var d={},e;for(e in this.attrs)this.attrs.hasOwnProperty(e)&&(d[e]=this.attrs[e]);d.gradient&&d.fill=="none"&&(d.fill=d.gradient)&&delete d.gradient;
d.transform=this._.transform;d.visibility=this.node.style.display==="none"?"hidden":"visible";return d}if(c==null&&b.is(a,"string")){if(a=="fill"&&this.attrs.fill=="none"&&this.attrs.gradient)return this.attrs.gradient;if(a=="transform")return this._.transform;if(a=="visibility")return this.node.style.display==="none"?"hidden":"visible";var d=a.split(G),f={},j=0;for(e=d.length;j<e;j++)a=d[j],f[a]=a in this.attrs?this.attrs[a]:b.is(this.ca[a],"function")?this.ca[a].def:b._availableAttrs[a];return e-
1?f:f[d[0]]}if(c==null&&b.is(a,"array")){f={};j=0;for(e=a.length;j<e;j++)f[a[j]]=this.attr(a[j]);return f}c!=null?(d={},d[a]=c):a!=null&&b.is(a,"object")&&(d=a);for(j in d)K("raphael.attr."+j+"."+this.id,this,d[j],j);var i={};for(j in this.ca)if(this.ca[j]&&d.hasOwnProperty(j)&&b.is(this.ca[j],"function")&&!this.ca["_invoked"+j]){this.ca["_invoked"+j]=!0;e=this.ca[j].apply(this,[].concat(d[j]));delete this.ca["_invoked"+j];for(f in e)e.hasOwnProperty(f)&&(d[f]=e[f]);this.attrs[j]=d[j];e===!1&&(i[j]=
d[j],delete d[j])}C(this,d);var h,j=0;for(e=this.followers.length;j<e;j++)h=this.followers[j],h.cb&&!h.cb.call(h.el,d,this)||h.el.attr(d);for(f in i)d[f]=i[f];return this};i.blur=function(a){if(+a!==0){var c=n("filter"),d=n("feGaussianBlur");this.attrs.blur=a;c.id=b.createUUID();n(d,{stdDeviation:+a||1.5});c.appendChild(d);this.paper.defs.appendChild(c);this._blur=c;n(this.node,{filter:"url('"+b._url+"#"+c.id+"')"})}else this._blur&&(this._blur.parentNode.removeChild(this._blur),delete this._blur,
delete this.attrs.blur),this.node.removeAttribute("filter")};i.on=function(a,c){if(this.removed)return this;var d=c;b._supportsTouch&&(a=b._touchMap[a]||a==="click"&&"touchstart"||a,d=function(a){a.preventDefault();c()});this.node["on"+a]=d;return this};b._engine.group=function(a,b,c){var d=n("g");c&&c.canvas&&c.canvas.appendChild(d)||a.canvas&&a.canvas.appendChild(d);a=new j(d,a,c);a.type="group";a.canvas=a.node;a.top=null;a.bottom=null;b&&d.setAttribute("class",["red",b,a.id].join("-"));return a};
b._engine.circle=function(a,b,c,d,e){var f=n("circle");e&&e.canvas&&e.canvas.appendChild(f)||a.canvas&&a.canvas.appendChild(f);a=new j(f,a,e);a.attrs={cx:b,cy:c,r:d,fill:"none",stroke:"#000"};a.type="circle";n(f,a.attrs);return a};b._engine.rect=function(a,b,c,d,e,f,i){var h=n("rect");i&&i.canvas&&i.canvas.appendChild(h)||a.canvas&&a.canvas.appendChild(h);a=new j(h,a,i);a.attrs={x:b,y:c,width:d,height:e,r:f||0,rx:f||0,ry:f||0,fill:"none",stroke:"#000"};a.type="rect";n(h,a.attrs);return a};b._engine.ellipse=
function(a,b,c,d,e,f){var i=n("ellipse");f&&f.canvas&&f.canvas.appendChild(i)||a.canvas&&a.canvas.appendChild(i);a=new j(i,a,f);a.attrs={cx:b,cy:c,rx:d,ry:e,fill:"none",stroke:"#000"};a.type="ellipse";n(i,a.attrs);return a};b._engine.image=function(a,b,c,d,e,f,i){var h=n("image");n(h,{x:c,y:d,width:e,height:f,preserveAspectRatio:"none"});h.setAttributeNS("http://www.w3.org/1999/xlink","href",b);i&&i.canvas&&i.canvas.appendChild(h)||a.canvas&&a.canvas.appendChild(h);a=new j(h,a,i);a.attrs={x:c,y:d,
width:e,height:f,src:b};a.type="image";return a};b._engine.text=function(a,b,c,d,e){var f=n("text");e&&e.canvas&&e.canvas.appendChild(f)||a.canvas&&a.canvas.appendChild(f);a=new j(f,a,e);a.attrs={x:b,y:c,"text-anchor":"middle","vertical-align":"middle",text:d,stroke:"none",fill:"#000"};a.type="text";a._textdirty=!0;C(a,a.attrs);return a};b._engine.setSize=function(a,b){this.width=a||this.width;this.height=b||this.height;this.canvas.setAttribute("width",this.width);this.canvas.setAttribute("height",
this.height);this._viewBox&&this.setViewBox.apply(this,this._viewBox);return this};b._engine.create=function(){var a=b._getContainer.apply(0,arguments),c=a&&a.container,d=a.x,e=a.y,f=a.width,a=a.height;if(!c)throw Error("SVG container not found.");var j=n("svg"),i,d=d||0,e=e||0,f=f||512,a=a||342;n(j,{height:a,version:1.1,width:f,xmlns:"http://www.w3.org/2000/svg"});c==1?(j.style.cssText="overflow:hidden;-webkit-tap-highlight-color:rgba(0,0,0,0);-webkit-user-select:none;-moz-user-select:-moz-none;-khtml-user-select:none;-ms-user-select:none;user-select:none;-o-user-select:none;cursor:default;position:absolute;left:"+
d+"px;top:"+e+"px",b._g.doc.body.appendChild(j),i=1):(j.style.cssText="overflow:hidden;-webkit-tap-highlight-color:rgba(0,0,0,0);-webkit-user-select:none;-moz-user-select:-moz-none;-khtml-user-select:none;-ms-user-select:none;user-select:none;-o-user-select:none;cursor:default;position:relative",c.firstChild?c.insertBefore(j,c.firstChild):c.appendChild(j));c=new b._Paper;c.width=f;c.height=a;c.canvas=j;c.clear();c._left=c._top=0;i&&(c.renderfix=function(){});c.renderfix();return c};b._engine.setViewBox=
function(a,b,c,d,e){K("raphael.setViewBox",this,this._viewBox,[a,b,c,d,e]);var f=m(c/this.width,d/this.height),j=this.top,i;a==null?(this._vbSize&&(f=1),delete this._vbSize,i="0 0 "+this.width+" "+this.height):(this._vbSize=f,i=a+" "+b+" "+c+" "+d);for(n(this.canvas,{viewBox:i,preserveAspectRatio:e?"meet":"xMinYMin"});f&&j;)i="stroke-width"in j.attrs?j.attrs["stroke-width"]:1,j.attr({"stroke-width":i}),j._.dirty=1,j._.dirtyT=1,j=j.prev;this._viewBox=[a,b,c,d,!!e];return this};b.prototype.renderfix=
function(){var a=this.canvas,b=a.style,c;try{c=a.getScreenCTM()||a.createSVGMatrix()}catch(d){c=a.createSVGMatrix()}a=-c.e%1;c=-c.f%1;if(a||c){if(a)this._left=(this._left+a)%1,b.left=this._left+"px";if(c)this._top=(this._top+c)%1,b.top=this._top+"px"}};b.prototype._desc=function(a){var c=this.desc;if(c)for(;c.firstChild;)c.removeChild(c.firstChild);else this.desc=c=n("desc"),this.canvas.appendChild(c);c.appendChild(b._g.doc.createTextNode(b.is(a,"string")?a:"Created with Red Rapha\u00ebl "+b.version))};
b.prototype.clear=function(){K("raphael.clear",this);for(var a=this.canvas;a.firstChild;)a.removeChild(a.firstChild);this.bottom=this.top=null;this._desc(b.desc);a.appendChild(this.defs=n("defs"))};b.prototype.remove=function(){K("raphael.remove",this);this.canvas.parentNode&&this.canvas.parentNode.removeChild(this.canvas);for(var a in this)this[a]=typeof this[a]=="function"?b._removedFactory(a):null;this.removed=!0};var c=b.st,d;for(d in i)i.hasOwnProperty(d)&&!c.hasOwnProperty(d)&&(c[d]=function(a){return function(){var b=
arguments;return this.forEach(function(c){c[a].apply(c,b)})}}(d))}(window.Raphael);window.Raphael.vml&&function(b){var h=String,e=parseFloat,g=Math,m=g.round,w=g.max,fa=g.min,s=g.sqrt,ka=g.abs,G=/[, ]+/,V=b.eve,K={M:"m",L:"l",C:"c",Z:"x",m:"t",l:"r",c:"v",z:"x"},U=/([clmz]),?([^clmz]*)/gi,O=/ progid:\S+Blur\([^\)]+\)/g,l=/-?[^,\s-]+/g,n={path:1,rect:1,image:1},F={circle:1,ellipse:1},aa=function(c){var d=/[ahqstv]/ig,a=b._pathToAbsolute;h(c).match(d)&&(a=b._path2curve);d=/[clmz]/g;if(a==b._pathToAbsolute&&
!h(c).match(d))return(c=h(c).replace(U,function(a,b,c){var d=[],e=b.toLowerCase()=="m",f=K[b];c.replace(l,function(a){e&&d.length==2&&(f+=d+K[b=="m"?"l":"L"],d=[]);d.push(m(a*21600))});return f+d}))||"m0,0";for(var d=a(c),e,c=[],f=0,j=d.length;f<j;f++){a=d[f];e=d[f][0].toLowerCase();e=="z"&&(e="x");for(var i=1,g=a.length;i<g;i++)e+=m(a[i]*21600)+(i!=g-1?",":"");c.push(e)}return c.length?c.join(" "):"m0,0"},D=function(c,d,a){var e=b.matrix();e.rotate(-c,0.5,0.5);return{dx:e.x(d,a),dy:e.y(d,a)}},M=
function(b,d,a,e,f,j){var i=b._,h=b.matrix,g=i.fillpos,b=b.node,s=b.style,n=1,l="",r=21600/d,v=21600/a;s.visibility="hidden";if(d&&a){b.coordsize=ka(r)+" "+ka(v);s.rotation=j*(d*a<0?-1:1);if(j)f=D(j,e,f),e=f.dx,f=f.dy;d<0&&(l+="x");a<0&&(l+=" y")&&(n=-1);s.flip=l;b.coordorigin=e*-r+" "+f*-v;if(g||i.fillsize){e=(e=b.getElementsByTagName("fill"))&&e[0];b.removeChild(e);if(g)f=D(j,h.x(g[0],g[1]),h.y(g[0],g[1])),e.position=f.dx*n+" "+f.dy*n;if(i.fillsize)e.size=i.fillsize[0]*ka(d)+" "+i.fillsize[1]*ka(a);
b.appendChild(e)}s.visibility=""}};b._url="";b.toString=function(){return"Your browser doesn\u2019t support SVG. Falling down to VML.\nYou are running Rapha\u00ebl "+this.version};var Z=function(b,d,a){for(var d=h(d).toLowerCase().split("-"),a=a?"end":"start",e=d.length,f="classic",j="medium",i="medium";e--;)switch(d[e]){case "block":case "classic":case "oval":case "diamond":case "open":case "none":f=d[e];break;case "wide":case "narrow":i=d[e];break;case "long":case "short":j=d[e]}b=b.node.getElementsByTagName("stroke")[0];
b[a+"arrow"]=f;b[a+"arrowlength"]=j;b[a+"arrowwidth"]=i},R=b._setFillAndStroke=function(c,d){if(c.paper.canvas){c.attrs=c.attrs||{};var a=c.node,k=c.attrs,j=a.style,i=n[c.type]&&(d.x!=k.x||d.y!=k.y||d.width!=k.width||d.height!=k.height||d.cx!=k.cx||d.cy!=k.cy||d.rx!=k.rx||d.ry!=k.ry||d.r!=k.r),g=F[c.type]&&(k.cx!=d.cx||k.cy!=d.cy||k.r!=d.r||k.rx!=d.rx||k.ry!=d.ry),s=c.type==="group",l;for(l in d)d.hasOwnProperty(l)&&(k[l]=d[l]);if(i)k.path=b._getPath[c.type](c),c._.dirty=1;d.href&&(a.href=d.href);
d.title&&(a.title=d.title);d.target&&(a.target=d.target);d.cursor&&(j.cursor=d.cursor);"blur"in d&&c.blur(d.blur);if(d.path&&c.type=="path"||i)if(a.path=aa(~h(k.path).toLowerCase().indexOf("r")?b._pathToAbsolute(k.path):k.path),c.type=="image")c._.fillpos=[k.x,k.y],c._.fillsize=[k.width,k.height],M(c,1,1,0,0,0);"transform"in d&&c.transform(d.transform);if("rotation"in d)j=d.rotation,b.is(j,"array")?c.rotate.apply(c,j):c.rotate(j);if("shape-rendering"in d)a.style.antialias=d["shape-rendering"]!=="crisp";
"visibility"in d&&(d.visibility==="hidden"?c.hide():c.show());if(g)j=+k.cx,g=+k.cy,i=+k.rx||+k.r||0,l=+k.ry||+k.r||0,a.path=b.format("ar{0},{1},{2},{3},{4},{1},{4},{1}x",m((j-i)*21600),m((g-l)*21600),m((j+i)*21600),m((g+l)*21600),m(j*21600));if("clip-rect"in d){j=h(d["clip-rect"]).split(G);if(j.length==4){j[0]=+j[0];j[1]=+j[1];j[2]=+j[2]+j[0];j[3]=+j[3]+j[1];i=s?a:a.clipRect||b._g.doc.createElement("div");g=i.style;if(s)c.clip=j.slice(),i=c.matrix.offset(),i=[e(i[0]),e(i[1])],j[0]-=i[0],j[1]-=i[1],
j[2]-=i[0],j[3]-=i[1],g.width="10800px",g.height="10800px";else if(!a.clipRect)g.top="0",g.left="0",g.width=c.paper.width+"px",g.height=c.paper.height+"px",a.parentNode.insertBefore(i,a),i.appendChild(a),a.clipRect=i;g.position="absolute";g.clip=b.format("rect({1}px {2}px {3}px {0}px)",j)}if(!d["clip-rect"])if(s&&c.clip)a.style.clip="rect(auto auto auto auto)",delete c.clip;else if(a.clipRect)a.clipRect.style.clip="rect(auto auto auto auto)"}if(c.textpath)s=c.textpath.style,d.font&&(s.font=d.font),
d["font-family"]&&(s.fontFamily='"'+d["font-family"].split(",")[0].replace(/^['"]+|['"]+$/g,"")+'"'),d["font-size"]&&(s.fontSize=d["font-size"]),d["font-weight"]&&(s.fontWeight=d["font-weight"]),d["font-style"]&&(s.fontStyle=d["font-style"]);"arrow-start"in d&&Z(c,d["arrow-start"]);"arrow-end"in d&&Z(c,d["arrow-end"],1);if(d.opacity!=null||d["stroke-width"]!=null||d.fill!=null||d.src!=null||d.stroke!=null||d["stroke-width"]!=null||d["stroke-opacity"]!=null||d["fill-opacity"]!=null||d["stroke-dasharray"]!=
null||d["stroke-miterlimit"]!=null||d["stroke-linejoin"]!=null||d["stroke-linecap"]!=null){s=a.getElementsByTagName("fill");j=-1;s=s&&s[0];!s&&(s=f("fill"));if(c.type=="image"&&d.src)s.src=d.src;d.fill&&(s.on=!0);if(s.on==null||d.fill=="none"||d.fill===null)s.on=!1;if(s.on&&d.fill)if(g=h(d.fill).match(b._ISURL))s.parentNode==a&&a.removeChild(s),s.rotate=!0,s.src=g[1],s.type="tile",i=c.getBBox(1),s.position=i.x+" "+i.y,c._.fillpos=[i.x,i.y],b._preload(g[1],function(){c._.fillsize=[this.offsetWidth,
this.offsetHeight]});else if(g=b.getRGB(d.fill),s.color=g.hex,s.src="",s.type="solid",g.error&&(c.type in{circle:1,ellipse:1}||h(d.fill).charAt()!="r")&&v(c,d.fill,s))k.fill="none",k.gradient=d.fill,s.rotate=!1;else if("opacity"in g&&!("fill-opacity"in d))j=g.opacity;if(j!==-1||"fill-opacity"in d||"opacity"in d)if(g=((+k["fill-opacity"]+1||2)-1)*((+k.opacity+1||2)-1)*((+j+1||2)-1),g=fa(w(g,0),1),s.opacity=g,s.src)s.color="none";a.appendChild(s);s=a.getElementsByTagName("stroke")&&a.getElementsByTagName("stroke")[0];
j=!1;!s&&(j=s=f("stroke"));if(d.stroke&&d.stroke!="none"||d["stroke-width"]||d["stroke-opacity"]!=null||d["stroke-dasharray"]||d["stroke-miterlimit"]||d["stroke-linejoin"]||d["stroke-linecap"])s.on=!0;(d.stroke=="none"||d.stroke===null||s.on==null||d.stroke==0||d["stroke-width"]==0)&&(s.on=!1);g=b.getRGB("stroke"in d?d.stroke:k.stroke);s.on&&d.stroke&&(s.color=g.hex);g=((+k["stroke-opacity"]+1||2)-1)*((+k.opacity+1||2)-1)*((+g.opacity+1||2)-1);i=(e(d["stroke-width"])||1)*0.75;g=fa(w(g,0),1);d["stroke-width"]==
null&&(i=k["stroke-width"]);d["stroke-width"]&&(s.weight=i);i&&i<1&&(g*=i)&&(s.weight=1);s.opacity=g;d["stroke-linejoin"]&&(s.joinstyle=d["stroke-linejoin"])||j&&(j.joinstyle="miter");s.miterlimit=d["stroke-miterlimit"]||8;d["stroke-linecap"]&&(s.endcap=d["stroke-linecap"]=="butt"?"flat":d["stroke-linecap"]=="square"?"square":"round");if(d["stroke-dasharray"])g={"-":"shortdash",".":"shortdot","-.":"shortdashdot","-..":"shortdashdotdot",". ":"dot","- ":"dash","--":"longdash","- .":"dashdot","--.":"longdashdot",
"--..":"longdashdotdot"},s.dashstyle=g.hasOwnProperty(d["stroke-dasharray"])?g[d["stroke-dasharray"]]:d["stroke-dasharray"].join&&d["stroke-dasharray"].join(" ")||"";j&&a.appendChild(s)}if(c.type=="text"){c.paper.canvas.style.display="";a=c.paper.span;s=k.font&&k.font.match(/\d+(?:\.\d*)?(?=px)/);g=k["line-height"]&&(k["line-height"]+"").match(/\d+(?:\.\d*)?(?=px)/);j=a.style;k.font&&(j.font=k.font);k["font-family"]&&(j.fontFamily=k["font-family"]);k["font-weight"]&&(j.fontWeight=k["font-weight"]);
k["font-style"]&&(j.fontStyle=k["font-style"]);s=e(k["font-size"]||s&&s[0])||10;j.fontSize=s*100+"px";g=e(k["line-height"]||g&&g[0])||12;k["line-height"]&&(j.lineHeight=g*100+"px");c.textpath.string&&(a.innerHTML=h(c.textpath.string).replace(/</g,"&#60;").replace(/&/g,"&#38;").replace(/\n/g,"<br>"));a=a.getBoundingClientRect();c.W=k.w=(a.right-a.left)/100;c.H=k.h=(a.bottom-a.top)/100;c.X=k.x;c.Y=k.y;switch(k["vertical-align"]){case "top":c.bby=c.H/2;break;case "bottom":c.bby=-c.H/2;break;default:c.bby=
0}("x"in d||"y"in d||c.bby!==void 0)&&(c.path.v=b.format("m{0},{1}l{2},{1}",m(k.x*21600),m((k.y+(c.bby||0))*21600),m(k.x*21600)+1));a=["x","y","text","font","font-family","font-weight","font-style","font-size","line-height"];s=0;for(j=a.length;s<j;s++)if(a[s]in d){c._.dirty=1;break}switch(k["text-anchor"]){case "start":c.textpath.style["v-text-align"]="left";c.bbx=c.W/2;break;case "end":c.textpath.style["v-text-align"]="right";c.bbx=-c.W/2;break;default:c.textpath.style["v-text-align"]="center",c.bbx=
0}c.textpath.style["v-text-kern"]=!0}}},v=function(c,d,a){c.attrs=c.attrs||{};var f=Math.pow,j="linear",i=".5 .5";c.attrs.gradient=d;d=h(d).replace(b._radial_gradient,function(a,b){j="radial";var b=b&&b.split(",")||[],c=b[3],d=b[4];c&&d&&(c=e(c),d=e(d),f(c-0.5,2)+f(d-0.5,2)>0.25&&(d=s(0.25-f(c-0.5,2))*((d>0.5)*2-1)+0.5),i=c+" "+d);return""});d=d.split(/\s*\-\s*/);if(j=="linear"){var g=d.shift(),g=-e(g);if(isNaN(g))return null}d=b._parseDots(d);if(!d)return null;c=c.shape||c.node;if(d.length){c.removeChild(a);
a.on=!0;a.method="none";a.color=d[0].color;a.color2=d[d.length-1].color;for(var l=[],n=1,r=d[0].opacity===void 0?1:d[0].opacity,v=0,m=d.length;v<m;v++)if(d[v].offset&&l.push(d[v].offset+" "+d[v].color),d[v].opacity!==void 0)n=d[v].opacity;a.colors=l.length?l.join():"0% "+a.color;a.opacity=n;a["o:opacity2"]=r;j=="radial"?(a.type="gradientTitle",a.focus="100%",a.focussize="0 0",a.focusposition=i,a.angle=0):(a.type="gradient",a.angle=(270-g)%360);c.appendChild(a)}return 1},C=function(c,d,a){a=a||d;this.node=
this[0]=c;c.raphael=!0;c.raphaelid=this.id=b._oid++;this.Y=this.X=0;this.attrs=this.attrs||{};this.styles=this.styles||{};this.followers=this.followers||[];this.paper=d;this.ca=this.customAttributes=this.customAttributes||new d._CustomAttributes;this.matrix=b.matrix();this._={transform:[],sx:1,sy:1,dx:0,dy:0,deg:0,dirty:1,dirtyT:1};this.parent=a;!a.bottom&&(a.bottom=this);(this.prev=a.top)&&(a.top.next=this);a.top=this;this.next=null},g=b.el;C.prototype=g;g.constructor=C;g.transform=function(c){if(c==
null)return this._.transform;var d=this.paper._viewBoxShift,a=d?"s"+[d.scale,d.scale]+"-1-1t"+[d.dx,d.dy]:"",e;d&&(e=c=h(c).replace(/\.{3}|\u2026/g,this._.transform||""));b._extractTransform(this,a+c);var d=this.matrix.clone(),f=this.skew,c=this.node,a=~h(this.attrs.fill).indexOf("-"),j=!h(this.attrs.fill).indexOf("url(");d.translate(-0.5,-0.5);j||a||this.type=="image"?(f.matrix="1 0 0 1",f.offset="0 0",f=d.split(),a&&f.noRotation||!f.isSimple?(c.style.filter=d.toFilter(),d=this.getBBox(),a=this.getBBox(1),
j=d.x2&&a.x2&&"x2"||"x",f=d.y2&&a.y2&&"y2"||"y",j=d[j]-a[j],d=d[f]-a[f],c.coordorigin=j*-21600+" "+d*-21600,M(this,1,1,j,d,0)):(c.style.filter="",M(this,f.scalex,f.scaley,f.dx,f.dy,f.rotate))):(c.style.filter="",f.matrix=h(d),f.offset=d.offset());e&&(this._.transform=e);return this};g.rotate=function(b,d,a){if(this.removed)return this;if(b!=null){b=h(b).split(G);b.length-1&&(d=e(b[1]),a=e(b[2]));b=e(b[0]);a==null&&(d=a);if(d==null||a==null)a=this.getBBox(1),d=a.x+a.width/2,a=a.y+a.height/2;this._.dirtyT=
1;this.transform(this._.transform.concat([["r",b,d,a]]));return this}};g.translate=function(b,d){if(this.removed)return this;b=h(b).split(G);b.length-1&&(d=e(b[1]));b=e(b[0])||0;d=+d||0;this._.bbox&&(this._.bbox.x+=b,this._.bbox.y+=d);this.transform(this._.transform.concat([["t",b,d]]));return this};g.scale=function(b,d,a,f){if(this.removed)return this;b=h(b).split(G);b.length-1&&(d=e(b[1]),a=e(b[2]),f=e(b[3]),isNaN(a)&&(a=null),isNaN(f)&&(f=null));b=e(b[0]);d==null&&(d=b);f==null&&(a=f);if(a==null||
f==null)var j=this.getBBox(1);a=a==null?j.x+j.width/2:a;f=f==null?j.y+j.height/2:f;this.transform(this._.transform.concat([["s",b,d,a,f]]));this._.dirtyT=1;return this};g.hide=function(){!this.removed&&(this.node.style.display="none");return this};g.show=function(){!this.removed&&(this.node.style.display="");return this};g._getBBox=function(){if(this.removed)return{};return{x:this.X+(this.bbx||0)-this.W/2,y:this.Y+(this.bby||0)-this.H/2,width:this.W,height:this.H}};g.remove=function(){if(!this.removed&&
this.parent.canvas){var c,d=b._engine.getNode(this);this.paper.__set__&&this.paper.__set__.exclude(this);for(V.unbind("raphael.*.*."+this.id);c=this.followers.pop();)c.el.remove();this.shape&&this.shape.parentNode.removeChild(this.shape);d.parentNode.removeChild(d);b._tear(this,this.paper);for(c in this)this[c]=typeof this[c]=="function"?b._removedFactory(c):null;this.removed=!0}};g.css=function(c,d){if(this.removed)return this;if(d==null&&b.is(c,"string")){for(var a=c.split(G),e={},f=0,j=a.length;f<
j;f++)c=a[f],c in this.styles&&(e[c]=this.styles[c]);return j-1?e:e[a[0]]}if(d==null&&b.is(c,"array")){e={};f=0;for(j=c.length;f<j;f++)e[c[f]]=this.styles(c[f]);return e}d!=null?(a={},a[c]=d):c!=null&&b.is(c,"object")&&(a=c);e={};for(j in a)f=j.replace(/\B([A-Z]{1})/g,"-$1").toLowerCase(),f==="color"&&this.type==="text"&&(f="fill"),b._availableAttrs.hasOwnProperty(f)?(e[f]=a[j],e.dirty=!0):(V("raphael.css."+f+"."+this.id,this,a[j],f),a[j]!=void 0&&(this.node.style[f]=a[j]),this.styles[f]=a[j]);f=
0;for(j=this.followers.length;f<j;f++)this.followers[f].el.css(a);e.hasOwnProperty("dirty")&&(delete e.dirty,this.attr(e));return this};g.attr=function(c,d){if(this.removed)return this;if(c==null){var a={},e;for(e in this.attrs)this.attrs.hasOwnProperty(e)&&(a[e]=this.attrs[e]);a.gradient&&a.fill=="none"&&(a.fill=a.gradient)&&delete a.gradient;a.transform=this._.transform;a.visibility=this.node.style.display==="none"?"hidden":"visible";return a}if(d==null&&b.is(c,"string")){if(c=="fill"&&this.attrs.fill==
"none"&&this.attrs.gradient)return this.attrs.gradient;if(c=="visibility")return this.node.style.display==="none"?"hidden":"visible";var a=c.split(G),f={},j=0;for(e=a.length;j<e;j++)c=a[j],f[c]=c in this.attrs?this.attrs[c]:b.is(this.ca[c],"function")?this.ca[c].def:b._availableAttrs[c];return e-1?f:f[a[0]]}if(this.attrs&&d==null&&b.is(c,"array")){f={};j=0;for(e=c.length;j<e;j++)f[c[j]]=this.attr(c[j]);return f}d!=null&&(a={},a[c]=d);d==null&&b.is(c,"object")&&(a=c);for(j in a)V("raphael.attr."+j+
"."+this.id,this,a[j],j);if(a){var i={};for(j in this.ca)if(this.ca[j]&&a.hasOwnProperty(j)&&b.is(this.ca[j],"function")&&!this.ca["_invoked"+j]){this.ca["_invoked"+j]=!0;e=this.ca[j].apply(this,[].concat(a[j]));delete this.ca["_invoked"+j];for(f in e)e.hasOwnProperty(f)&&(a[f]=e[f]);this.attrs[j]=a[j];e===!1&&(i[j]=a[j],delete a[j])}if("text"in a&&this.type=="text")this.textpath.string=a.text.replace(/<br\s*?\/?>/ig,"\n");R(this,a);var g,j=0;for(e=this.followers.length;j<e;j++)g=this.followers[j],
g.cb&&!g.cb.call(g.el,a,this)||g.el.attr(a);for(f in i)a[f]=i[f]}return this};g.blur=function(c){var d=this.node.runtimeStyle,a=d.filter,a=a.replace(O,"");+c!==0?(this.attrs.blur=c,d.filter=a+"  progid:DXImageTransform.Microsoft.Blur(pixelradius="+(+c||1.5)+")",d.margin=b.format("-{0}px 0 0 -{0}px",m(+c||1.5))):(d.filter=a,d.margin=0,delete this.attrs.blur);return this};g.on=function(c,d){if(this.removed)return this;this.node["on"+c]=function(){var a=b._g.win.event;a.target=a.srcElement;d(a)};return this};
b._engine.getNode=function(b){b=b.node||b[0].node;return b.clipRect||b};b._engine.getLastNode=function(b){b=b.node||b[b.length-1].node;return b.clipRect||b};b._engine.group=function(c,d,a){var e=b._g.doc.createElement("div"),f=new C(e,c,a);e.style.cssText="position:absolute;left:0;top:0;width:1px;height:1px";d&&(e.className=["red",d,f.id].join("-"));(a||c).canvas.appendChild(e);f.type="group";f.canvas=f.node;f.transform=b._engine.group.transform;f.top=null;f.bottom=null;return f};b._engine.group.transform=
function(c){if(c==null)return this._.transform;var d=this.node.style,a=this.clip,f=this.paper._viewBoxShift,j=f?"s"+[f.scale,f.scale]+"-1-1t"+[f.dx,f.dy]:"";f&&(c=h(c).replace(/\.{3}|\u2026/g,this._.transform||""));b._extractTransform(this,j+c);c=this.matrix;j=c.offset();f=e(j[0])||0;j=e(j[1])||0;d.left=f+"px";d.top=j+"px";d.zoom=(this._.tzoom=c.get(0))+"";a&&(d.clip=b.format("rect({1}px {2}px {3}px {0}px)",[a[0]-f,a[1]-j,a[2]-f,a[3]-j]));return this};b._engine.path=function(b,d,a){var e=f("shape");
e.style.cssText="position:absolute;left:0;top:0;width:1px;height:1px";e.coordsize="21600 21600";e.coordorigin=d.coordorigin;var j=new C(e,d,a),i={fill:"none",stroke:"#000"};b&&(i.path=b);j.type="path";j.path=[];j.Path="";R(j,i);(a||d).canvas.appendChild(e);b=f("skew");b.on=!0;e.appendChild(b);j.skew=b;return j};b._engine.rect=function(c,d,a,e,f,j,i){var g=b._rectPath(d,a,e,f,j),c=c.path(g,i),i=c.attrs;c.X=i.x=d;c.Y=i.y=a;c.W=i.width=e;c.H=i.height=f;i.r=j;i.path=g;c.type="rect";return c};b._engine.ellipse=
function(b,d,a,e,f,j){b=b.path(void 0,j);b.X=d-e;b.Y=a-f;b.W=e*2;b.H=f*2;b.type="ellipse";R(b,{cx:d,cy:a,rx:e,ry:f});return b};b._engine.circle=function(b,d,a,e,f){b=b.path(void 0,f);b.X=d-e;b.Y=a-e;b.W=b.H=e*2;b.type="circle";R(b,{cx:d,cy:a,r:e});return b};b._engine.image=function(c,d,a,e,f,j,i){var g=b._rectPath(a,e,f,j),c=c.path(g,i).attr({stroke:"none"}),i=c.attrs,s=c.node,h=s.getElementsByTagName("fill")[0];i.src=d;c.X=i.x=a;c.Y=i.y=e;c.W=i.width=f;c.H=i.height=j;i.path=g;c.type="image";h.parentNode==
s&&s.removeChild(h);h.rotate=!0;h.src=d;h.type="tile";c._.fillpos=[a,e];c._.fillsize=[f,j];s.appendChild(h);M(c,1,1,0,0,0);return c};b._engine.text=function(c,d,a,e,j){var i=f("shape"),g=f("path"),s=f("textpath"),d=d||0,a=a||0;g.v=b.format("m{0},{1}l{2},{1}",m(d*21600),m(a*21600),m(d*21600)+1);g.textpathok=!0;s.string=h(e).replace(/<br\s*?\/?>/ig,"\n");s.on=!0;i.style.cssText="position:absolute;left:0;top:0;width:1px;height:1px";i.coordsize="21600 21600";i.coordorigin="0 0";var l=new C(i,c,j),n={fill:"#000",
stroke:"none",text:e};l.shape=i;l.path=g;l.textpath=s;l.type="text";l.attrs.text=h(e||"");l.attrs.x=d;l.attrs.y=a;l.attrs.w=1;l.attrs.h=1;R(l,n);i.appendChild(s);i.appendChild(g);(j||c).canvas.appendChild(i);c=f("skew");c.on=!0;i.appendChild(c);l.skew=c;return l};b._engine.setSize=function(c,d){var a=this.canvas.style;this.width=c;this.height=d;c==+c&&(c+="px");d==+d&&(d+="px");a.width=c;a.height=d;a.clip="rect(0 "+c+" "+d+" 0)";this._viewBox&&b._engine.setViewBox.apply(this,this._viewBox);return this};
b._engine.setViewBox=function(b,d,a,e,f){V("raphael.setViewBox",this,this._viewBox,[b,d,a,e,f]);var j=this.width,i=this.height,g=1/w(a/j,e/i),s,h;f&&(s=i/e,h=j/a,a*s<j&&(b-=(j-a*s)/2/s),e*h<i&&(d-=(i-e*h)/2/h));this._viewBox=[b,d,a,e,!!f];this._viewBoxShift={dx:-b,dy:-d,scale:g};this.forEach(function(a){a.transform("...")});return this};var f;b._engine.initWin=function(c){var d=c.document;d.createStyleSheet().addRule(".rvml","behavior:url(#default#VML)");try{!d.namespaces.rvml&&d.namespaces.add("rvml",
"urn:schemas-microsoft-com:vml"),f=b._createNode=function(a,b){var c=d.createElement("<rvml:"+a+' class="rvml">'),e;for(e in b)c[e]=h(b[e]);return c}}catch(a){f=b._createNode=function(a,b){var c=d.createElement("<"+a+' xmlns="urn:schemas-microsoft.com:vml" class="rvml">'),e;for(e in b)c[e]=h(b[e]);return c}}};b._engine.initWin(b._g.win);b._engine.create=function(){var c=b._getContainer.apply(0,arguments),d=c.container,a=c.height,e=c.width,f=c.x,c=c.y;if(!d)throw Error("VML container not found.");
var j=new b._Paper,i=j.canvas=b._g.doc.createElement("div"),g=i.style,f=f||0,c=c||0,e=e||512,a=a||342;j.width=e;j.height=a;e==+e&&(e+="px");a==+a&&(a+="px");j.coordsize="21600000 21600000";j.coordorigin="0 0";j.span=b._g.doc.createElement("span");j.span.style.cssText="position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;";i.appendChild(j.span);g.cssText=b.format("top:0;left:0;width:{0};height:{1};display:inline-block;cursor:default;position:relative;clip:rect(0 {0} {1} 0);overflow:hidden",
e,a);d==1?(b._g.doc.body.appendChild(i),g.left=f+"px",g.top=c+"px",g.position="absolute"):d.firstChild?d.insertBefore(i,d.firstChild):d.appendChild(i);j.renderfix=function(){};return j};b.prototype.clear=function(){V("raphael.clear",this);this.canvas.innerHTML="";this.span=b._g.doc.createElement("span");this.span.style.cssText="position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;display:inline;";this.canvas.appendChild(this.span);this.bottom=this.top=null};b.prototype.remove=
function(){V("raphael.remove",this);this.canvas.parentNode.removeChild(this.canvas);for(var c in this)this[c]=typeof this[c]=="function"?b._removedFactory(c):null;return!0};var j=b.st,i;for(i in g)g.hasOwnProperty(i)&&!j.hasOwnProperty(i)&&(j[i]=function(b){return function(){var d=arguments;return this.forEach(function(a){a[b].apply(a,d)})}}(i))}(window.Raphael);g.Raphael=w;g.Raphael.desc="";if(U&&U!==w)window.Raphael=U;else if(window.Raphael===w)window.Raphael=void 0}]);
FusionCharts(["private","modules.renderer.js-raphaelshadow",function(){var g=this.hcLib,h=window,m=h.navigator.userAgent,U=h.Math,w=U.sqrt,S=h.parseFloat,ia=h.parseInt;/AppleWebKit/.test(m);/Safari/.test(m)&&/Version\/[1-4]\./.test(m);/Chrome/.test(m);/msie/i.test(m);var h=h.SVGFilterElement||h.SVGFEColorMatrixElement&&h.SVGFEColorMatrixElement.SVG_FECOLORMATRIX_TYPE_SATURATE===2,b=g.Raphael,U=Math,B=b._createNode,e;if(b.svg){if(h)b.el.dropshadow=function(e,g,h,s){var r=this.node,m=this._.shadowFilter,
V=this.paper.cacheShadows||(this.paper.cacheShadows={}),K="drop-shadow"+[e,g,h,s].join(" "),U;if(e==="none"){if(m){m.use-=1;this.node.removeAttribute("filter");if(!m.use){K=m.hash;for(U in m)e=m[U],e.parentNode&&e.parentNode.removeChild(e),delete m[U];delete V[K]}delete this._.shadowFilter}}else if(!(m&&V[K]===m))m=this.paper.defs.appendChild(B("filter",{id:b.createUUID(),width:"200%",height:"200%"})),s=b.color(s),s.error&&(s=b.color("rgba(0,0,0,1)")),U=b.pick(s.opacity,1),this._.shadowFilter=V[K]=
{use:1,filter:m,hash:K,offset:m.appendChild(B("feOffset",{result:"offOut","in":"SourceGraphic",dx:S(e),dy:S(g)})),matrix:m.appendChild(B("feColorMatrix",{result:"matrixOut","in":"offOut",type:"matrix",values:"0 0 0 0 "+s.r/255+" 0 0 0 0 "+s.g/255+" 0 0 0 0 "+s.b/255+" 0 0 0 "+U+" 0"})),blur:m.appendChild(B("feGaussianBlur",{result:"blurOut","in":"matrixOut",stdDeviation:w(S(h))})),blend:m.appendChild(B("feComposite",{"in":"SourceGraphic",in2:"blurOut",operator:"over"}))},r.setAttribute("filter","url('"+
b._url+"#"+m.id+"')");return this};var r={"drop-shadow":"drop-shadow",stroke:"stroke",fill:"fill","stroke-width":"stroke-width","stroke-opacity":"stroke-opacity","stroke-linecap":"stroke-linecap","shape-rendering":"shape-rendering",transform:"transform"};e=function(b,e){var g=this.__shadowscale,s={},h,m;for(m in b)switch(r[m]&&(s[m]=b[m],delete b[m]),m){case "transform":h=e.matrix.clone();h.translate(this.__shadowx,this.__shadowy);this.transform(h.toTransformString());break;case "stroke-width":b[m]=
((s[m]||1)+6-2*this.__shadowlevel)*g}this.attr(b);for(m in s)b[m]=s[m]};b.ca["drop-shadow"]=function(g,h,m,s,r,w){var m=this._.shadows||(this._.shadows=[]),B,K,U,O,l;if(!this.__shadowblocked)if(g==="none")for(;K=m.pop();)K.remove();else{s=b.color(s);s.error&&(s=b.color("rgba(0,0,0,1)"));r instanceof Array?(B=r[0],r=r[1]):B=r;B=1/b.pick(B,1);r=1/b.pick(r,1);g=b.pick(g,1)*B;h=b.pick(h,1)*B;B=b.pick(s.opacity,1)*0.05;U=ia(this.attr("stroke-width")||1,10)+6;O=this.matrix.clone();O.translate(g,h);for(l=
1;l<=3;l++)K=(m[l-1]||this.clone().follow(this,e,!w&&"before")).attr({stroke:s.hex,"stroke-opacity":B*l,"stroke-width":(U-2*l)*r,transform:O.toTransformString(),"stroke-linecap":"round","shape-rendering":"default",fill:"none"}),K.__shadowlevel=l,K.__shadowscale=r,K.__shadowx=g,K.__shadowy=h,w&&w.appendChild(K),m.push(K)}return!1};b.el.shadow=function(e,g,h,s){var m;h&&h.constructor===b.el.constructor&&(s=h,h=void 0);if(typeof e==="object")g&&g.constructor===b.el.constructor&&(s=g),g=e.opacity,h=e.scalefactor,
m=!!e.useFilter,e=e.apply===void 0?!!g:e.apply;g===void 0&&(g=1);if(this.dropshadow)if(m)return e&&this.dropshadow(1,1,3,"rgb(64,64,64)")||this.dropshadow("none"),this;else this._.shadowFilter&&this.dropshadow("none");return this.attr("drop-shadow",e?[1,1,3,"rgba(64,64,64,"+g+")",h,s]:"none")}}else if(b.vml)b.ca["drop-shadow"]=function(e,g,h,s,m,r){var w=this._.shadow,B,U;if(this.isShadow)return!1;if(e==="none")w&&(this._.shadow=w.remove());else{if(!w)w=this._.shadow=this.clone(),r&&r.appendChild(w.follow(this))||
w.follow(this,void 0,"before"),w.attr({fill:"none","fill-opacity":0.5,"stroke-opacity":1}).isShadow=!0,w.attr("stroke-width")<=0&&w.attr("stroke-width",1);r=w.node.runtimeStyle;B=r.filter.replace(/ progid:\S+Blur\([^\)]+\)/g,"");s=b.color(s);s.error&&(s=b.color("rgba(0,0,0,1)"));U=b.pick(s.opacity,1)/5;m=1/b.pick(m,1);e=b.pick(e,1)*m;g=b.pick(g,1)*m;w.translate(e,g);r.filter=B+" progid:DXImageTransform.Microsoft.Blur(pixelRadius="+S(h*0.4)+" makeShadow=True Color="+s.hex+" shadowOpacity='"+U+"');"}return!1},
b.el.shadow=function(e,g,h,s){h&&h.constructor===b.el.constructor&&(s=h,h=void 0);if(typeof e==="object")g&&g.type==="group"&&(s=g),g=e.opacity,h=e.scalefactor,e=e.apply===void 0?!!g:e.apply;g===void 0&&(g=1);return this.attr("drop-shadow",e||!g?[1,1,5,"rgba(64,64,64,"+g+")",h,s]:"none")};else if(b.canvas)b.el.shadow=function(){return this}}]);
FusionCharts(["private","modules.renderer.js-raphaelshapes",function(){var g=this.hcLib.Raphael,h="createTouch"in document,m=window,m=/msie/i.test(navigator.userAgent)&&!m.opera,U=Math,w=U.cos,S=U.sin,ia=U.abs,b=U.pow,B=U.atan2,e=U.min,r=U.round,x=U.PI,$=2*x,fa=parseInt,s=parseFloat,ka=String,G="fill",G="fill",V=b(2,-24),K="rgba(192,192,192,"+(m?0.002:1.0E-6)+")",Y=g.eve,O=g.vml&&0.5||0,l=g._createNode,n=g._setFillAndStroke,F=g.el.constructor;g.crispBound=g._cacher(function(b,e,i,c,d){var a={},k,
b=b||0,e=e||0,i=i||0,c=c||0,d=d||0;k=d%2/2+O;a.x=r(b+k)-k;a.y=r(e+k)-k;a.width=r(b+i+k)-k-a.x;a.height=r(e+c+k)-k-a.y;a["stroke-width"]=d;a.width===0&&i!==0&&(a.width=1);a.height===0&&c!==0&&(a.height=1);return a},g);g.el.crisp=function(){var b=this.attrs,e,i=this.attr(["x","y","width","height","stroke-width"]),i=g.crispBound(i.x,i.y,i.width,i.height,i["stroke-width"]);for(e in i)b[e]===i[e]&&delete i[e];return this.attr(i)};g.fn.polypath=function(){var b=arguments,e=b.length-1,i=b[e];i&&i.constructor===
g.el.constructor?b[e]=void 0:i=void 0;e=this.path(void 0,i);e.ca.polypath=g.fn.polypath.ca;arguments.length-!!i&&e.attr("polypath",[b[0],b[1],b[2],b[3],b[4],b[5]])||(e.attrs.polypath=[0,0,0,0,0,0]);return e};g.fn.polypath.ca=function(b,e,i,c,d,a){var k,h,l;k=[];b=fa(b,10)||0;e=s(e)||0;i=s(i)||0;c=s(c)||0;d=d===null||isNaN(d)?x*0.5:g.rad(d);a=a===null||isNaN(a)?0:s(a);h=d;if(b>2)switch(d=2*x/b,a){case 0:for(a=0;a<b;a++)k.push("L",e+c*w(-h),i+c*S(-h)),h+=d;k[0]="M";k.push("Z");break;case 1:for(a=0;a<
b;a++)k.push("M",e,i,"L",e+c*w(-h),i+c*S(-h)),h+=d;break;default:d*=0.5;l=c*w(d)*(1-a);for(a=0;a<b;a++)k.push("L",e+c*w(-h),i+c*S(-h)),h+=d,k.push("L",e+l*w(-h),i+l*S(-h)),h+=d;k[0]="M";k.push("Z")}else c===0?k.push("M",e,i,"L",e,i,"Z"):k.push("M",e-c,i,"A",c,c,0,0,0,e+c,i,"A",c,c,0,0,0,e-c,i,"Z");return{path:k}};g.fn.ringpath=function(){var b=arguments,e=b.length-1,i=b[e];i&&i.constructor===g.el.constructor?b[e]=void 0:i=void 0;e=this.path(void 0,i);e.ca.ringpath=g.fn.ringpath.ca;arguments.length-
!!i&&e.attr("ringpath",[b[0],b[1],b[2],b[3],b[4],b[5]])||(e.attrs.ringpath=[0,0,0,0,0,0]);return e};g.fn.ringpath.ca=function(b,e,i,c,d,a){var k=a%$-d%$,g=a-d,h;this._.ringangle=(d+a)*0.5;ia(g)<V?(g=w(d),d=S(d),i=["M",b+i*g,e+i*d,"L",b+c*g,e+c*d,"Z"]):(ia(g)>V&&ia(g)%$<V?(i=["M",b-i,e,"A",i,i,0,0,0,b+i,e,"A",i,i,0,0,0,b-i,e],c!==0&&(i=i.concat(["M",b-c,e,"A",c,c,0,0,1,b+c,e,"A",c,c,0,0,1,b-c,e]))):(g=w(d),d=S(d),h=w(a),a=S(a),k%=$,k<0&&(k+=$),k=k<x?0:1,i=["M",b+i*g,e+i*d,"A",i,i,0,k,1,b+i*h,e+i*a,
"L",b+c*h,e+c*a],c!==0&&i.push("A",c,c,0,k,0,b+c*g,e+c*d)),i.push("Z"));return{path:i}};g.fn.cubepath=function(){var b={"stroke-linejoin":"round","shape-rendering":"precision",stroke:"none"},e=arguments,i=e.length-1,c=e[i],d;c&&c.constructor===g.el.constructor?e[i]=void 0:c=void 0;i=this.path(void 0,c).attr(b);d=this.path(void 0,c).attr(b);b=this.path(void 0,c).attr(b);b._.cubetop=i.follow(b,void 0,"before");b._.cubeside=d.follow(b,void 0,"before");for(var a in g.fn.cubepath.ca)b.ca[a]=g.fn.cubepath.ca[a];
return b.attr("cubepath",[e[0]||0,e[1]||0,e[2]||0,e[3]||0,e[4]||0,e[5]||0])};g.fn.cubepath.ca={cubepath:function(b,e,i,c,d,a){var k=this._.cubetop,g=this._.cubeside;this.attr("path",["M",b+i,e,"l",0,c,-i,0,0,-c,"z"]);k.attr("path",["M",b,e,"l",1,1,i-1,0,0,-1,d,-a,-i,0,"z"]);g.attr("path",["M",b+i-1,e+1,"l",0,c-1,1,0,d,-a,0,-c,-d,a]);return!1},"stroke-linejoin":function(){return{"stroke-linejoin":"round"}},"drop-shadow":function(b,e,i,c){var d=this._.cubetop,a=this._.cubeside;this.dropshadow&&(d.dropshadow(b,
-e,i,c),a.dropshadow(b,-e,i,c));return!1},fill:function(b,e){var i=this._.cubetop,c=this._.cubeside,d=this.attr("cubepath")||[0,0,0,0,0,0],a=d[2],k=d[4],d=d[5],h,b=g.color(b);e?(this.attr(G,b),i.attr(G,g.tintshade(b,-0.78).rgba),c.attr(G,g.tintshade(b,-0.65).rgba)):(h="opacity"in b?"rgba("+[b.r,b.g,b.b,b.opacity]+")":"rgb("+[b.r,b.g,b.b]+")",this.attr(G,[270,g.tintshade(h,0.55).rgba,g.tintshade(h,-0.65).rgba].join("-")),c.attr(G,[270,g.tintshade(h,-0.75).rgba,g.tintshade(h,-0.35).rgba].join("-")),
i.attr(G,[45+g.deg(B(d,k+a)),g.tintshade(h,-0.78).rgba,g.tintshade(h,0.22).rgba].join("-")));return!1}};g.ca["text-bound"]=function(b,e,i,c,d,a){var c=this.paper,k=this._.textbound;if(this.type==="text"){if((!e||e==="none")&&(!b||b==="none"))return this._.textbound=k&&k.unfollow(this).remove(),!1;(!i||!g.is(i,"finite"))&&(i=0);(!d||!g.is(d,"finite"))&&(d=0);!k&&(k=this._.textbound=c.rect(0,0,0,0,this.group).follow(this,g.ca["text-bound"].reposition,"before"));k.attr({stroke:e,"stroke-width":i,fill:b,
"shape-rendering":i===1&&"crisp"||"",r:d});a&&k.attr("stroke-dasharray",a);g.ca["text-bound"].reposition.call(k,this.attrs,this);return!1}};g.ca["text-bound"].reposition=function(b,e){var i={},c,d,a,k,h;b.hasOwnProperty("visibility")&&this.attr("visibility",b.visibility);if(b.hasOwnProperty("text-bound")||b.hasOwnProperty("x")||b.hasOwnProperty("y")||b.hasOwnProperty("text")||b.hasOwnProperty("text-anchor")||b.hasOwnProperty("text-align")||b.hasOwnProperty("font-size")||b.hasOwnProperty("line-height")||
b.hasOwnProperty("vertical-align")||b.hasOwnProperty("transform")){c=ka((e.attrs["text-bound"]||[])[3]||"0").split(/\s*\,\s*/g);d=s(c[0])||0;c=g.pick(s(c[1]),d);a=e.getBBox();k=a.width;h=a.height;if(!isNaN(k))i.x=a.x-d,i.y=a.y-c,i.width=k+d*2,i.height=h+c*2;this.attr(i)}};g.fn.scroller=function(b,e,i,c,d,a,k){var h=this.group("scroller",k),l=h.attrs,n=h._.scroller={},d=d&&"horizontal"||"vertical",m,r={},v,w;n.track=this.rect(h).mousedown(function(a){var b=l["scroll-position"],a=l["scroll-orientation"]===
"horizontal"?a.layerX||a.x:a.layerY||a.y,a=(a-n.anchorOffset)/n.trackLength;m=g.animation({"scroll-position":a},2E3*ia(b-a),"easeIn");h.animate(m);Y("raphael.scroll.start."+h.id,h,b)}).mouseup(function(){this.stop(m);Y("raphael.scroll.end."+this.id,this,l["scroll-position"])},h,!0);n.anchor=this.rect(h).drag(function(){r["scroll-position"]=v+arguments[w]/n.trackLength;h.animate(r,0)},function(a,b,d){w=l["scroll-orientation"]==="horizontal"?0:1;Y("raphael.scroll.start."+h.id,h,v=l["scroll-position"]);
d.stopPropagation()},function(){Y("raphael.scroll.end."+h.id,h,v=l["scroll-position"])});for(var F in g.fn.scroller.fn)h[F]=g.fn.scroller.fn[F];for(F in g.fn.scroller.ca)h.ca[F]=g.fn.scroller.ca[F];l["scroll-orientation"]=d;l["stroke-width"]=1;h.ca["scroll-repaint"]=h.ca["scroll-repaint-"+d];!g.is(a,"object")&&(a={});return h.attr({ishot:!0,"scroll-display-buttons":a.showButtons&&"arrow"||"none","scroll-display-style":a.displayStyleFlat&&"flat"||"3d","scroll-ratio":s(a.scrollRatio)||1,"scroll-position":s(a.scrollPosition)||
0,"scroll-repaint":[b,e,i,c]})};g.fn.scroller.fn={scroll:function(b,e){var i=this._.scroller,e=e||this;i.callback=function(){return b.apply(e,arguments)};return this}};g.fn.scroller.ca={"stroke-width":function(){return!1},"drop-shadow":function(b,e,i,c,d,a){this._.scroller.track.attr("drop-shadow",[b,e,i,c,d,a]);return!1},"scroll-display-style":function(b){var e=this.attrs,i=e["scroll-display-style"],c=e.fill,b={flat:"flat","3d":"3d",transparent:"transparent"}[b]||i;c&&b!==i&&(e["scroll-display-style"]=
b,this.attr(G,c));return{"scroll-display-style":b}},"scroll-display-buttons":function(b){var e=this,i=e.paper,c=e._.scroller,d=e.attrs,a=d["scroll-display-buttons"],k=d["scroll-repaint"],h,s,b={none:"none",arrow:"arrow"}[b]||a;if(b!==a)d["scroll-display-buttons"]=b,b==="none"&&c.start?(c.arrowstart.remove(),delete c.arrowstart,c.arrowend.remove(),delete c.arrowend,c.start.remove(),delete c.start,c.end.remove(),delete c.end):(c.arrowstart=i.polypath(e),c.arrowend=i.polypath(e),c.start=i.rect(e).mousedown(function(){var a;
if((a=d["scroll-position"])!==0)e.animate({"scroll-position":a-0.1},100).animate(h=g.animation({"scroll-position":0},4500*a,"easeIn")),Y("raphael.scroll.start."+e.id,e,a)}).mouseup(function(){e.stop(h);Y("raphael.scroll.end."+e.id,e,d["scroll-position"])},e,!0),c.end=i.rect(e).mousedown(function(){var a;if((a=d["scroll-position"])!==1)e.animate({"scroll-position":a+0.1},100).animate(s=g.animation({"scroll-position":1},4500*(1-a),"easeIn")),Y("raphael.scroll.start."+e.id,e,a)}).mouseup(function(){e.stop(s);
Y("raphael.scroll.end."+e.id,e,d["scroll-position"])},e,!0),d.fill&&e.attr(G,d.fill)),k&&e.attr("scroll-repaint",k);return{"scroll-display-buttons":b}},"scroll-orientation":function(b){var e=this.attrs,i=e["scroll-repaint"],c=e["scroll-orientation"],b={horizontal:"horizontal",vertical:"vertical"}[b]||c;c!==b&&(this.ca["scroll-repaint"]=this.ca["scroll-repaint-"+b],i&&(i[2]+=i[3],i[3]=i[2]-i[3],i[2]-=i[3],this.attr("scroll-repaint",i)),e.fill&&this.attr(G,e.fill));return{"scroll-orientation":b}},"scroll-ratio":function(b){var e=
this.attrs,i=e["scroll-ratio"],c=e["scroll-repaint"],b=b>1?1:b<0.01?0.01:s(b);c&&b!==i&&(e["scroll-ratio"]=b,this.attr("scroll-repaint",c));return{"scroll-ratio":b}},"scroll-position":function(b,e){var i=this.attrs,c=i["scroll-orientation"]==="horizontal",d=i["scroll-repaint"],a=i["scroll-position"],k=this._.scroller,g=k.anchor,b=b>1?1:b<0?0:s(b);isNaN(b)&&(b=a);if(d&&(a!==b||e))a=k.start&&k.start.attr(c&&"width"||"height")||0,c&&g.attr("x",d[0]+a+(d[2]-2*a-g.attr("width"))*b+0.5)||g.attr("y",d[1]+
a+(d[3]-2*a-g.attr("height"))*b+0.5),!e&&i["scroll-ratio"]<1&&(Y("raphael.scroll.change."+this.id,this,b),k.callback&&k.callback(b));return{"scroll-position":b}},r:function(b){var e=this._.scroller;e.track.attr("r",b);e.anchor.attr("r",this.attrs["scroll-display-buttons"]==="none"&&b||0);return!1},"scroll-repaint-horizontal":function(b,j,i,c){var d=this.attrs,a=this._.scroller,k=d["scroll-ratio"],g=d["scroll-position"],h=0,s=i*k,d=d["scroll-display-buttons"]==="none";i&&(i-=1);b&&(b+=0.5);c&&(c-=
1);j&&(j+=0.5);a.track.attr({width:i,height:c,y:j,x:b}).crisp();d||(h=e(c,i*0.5),s-=h*2*k,a.start.attr({width:h,height:c,x:b,y:j}),a.arrowstart.attr("polypath",[3,b+h*0.5,j+c*0.5,h*0.25,180]),a.end.attr({width:h,height:c,x:b+i-h,y:j}),a.arrowend.attr("polypath",[3,b+i-h*0.5,j+h*0.5,h*0.25,0]));a.trackLength=i-2*h-s;a.trackOffset=b+h+0.5;a.anchorOffset=a.trackOffset+(s-1)*0.5;a.anchor.attr({height:c,width:s-1,y:j,x:a.trackOffset+a.trackLength*g}).crisp()},"scroll-repaint-vertical":function(b,j,i,c){var d=
this.attrs,a=this._.scroller,k=d["scroll-ratio"],g=d["scroll-position"],h=0,s=c*k,d=d["scroll-display-buttons"]==="none";i&&(i-=1);b&&(b+=0.5);c&&(c-=1);j&&(j+=0.5);a.track.attr({width:i,height:c,y:j,x:b}).crisp();d||(h=e(i,c*0.5),s-=h*2*k,a.start.attr({width:i,height:h,x:b,y:j}),a.arrowstart.attr("polypath",[3,b+i*0.5,j+h*0.5,h*0.25,90]),a.end.attr({width:i,height:h,x:b,y:j+c-h}),a.arrowend.attr("polypath",[3,b+i*0.5,j+c-h*0.5,h*0.25,-90]));a.trackLength=c-2*h-s;a.trackOffset=j+h+0.5;a.anchorOffset=
a.trackOffset+(s-1)*0.5;a.anchor.attr({height:s-1,width:i,y:a.trackOffset+a.trackLength*g,x:b}).crisp()},fill:function(b){var e=this.attrs,i=this._.scroller,c=e["scroll-repaint"],d=e["scroll-display-style"]==="flat",a=e["scroll-orientation"]==="horizontal",k={stroke:"none"},s;if(h&&c&&(s=16-c[a&&3||2])>3)k.stroke=K,k["stroke-width"]=s;b=g.color(b);b.error&&(b="#000000");b="opacity"in b?"rgba("+[b.r,b.g,b.b,b.opacity]+")":"rgb("+[b.r,b.g,b.b]+")";k.fill=d&&b||[90*a,g.tintshade(b,0.15).rgba,b].join("-");
k.stroke=g.tintshade(b,-0.75).rgba;i.track.attr(k);k.fill=d&&g.tintshade(b,-0.6).rgba||[270*a,g.tintshade(b,0.3).rgba+":40",g.tintshade(b,-0.7).rgba].join("-");k.stroke=g.tintshade(b,-0.6).rgba;i.anchor.attr(k);k.stroke="none";if(e["scroll-display-buttons"]!=="none")k.fill=K,i.start.attr(k),i.end.attr(k),k.fill=g.tintshade(b,-0.4).rgba,i.arrowstart.attr(k),i.arrowend.attr(k);return!1}};var aa=Array.prototype.slice;g.fn.symbol=function(){var b=arguments,e=b.length-1,i=b[e];i&&i.constructor===g.el.constructor?
b[e]=void 0:i=void 0;e=this.path(void 0,i);e.ca.symbol=g.fn.symbol.ca.symbol;return b.length===!!i+0?e:e.attr("symbol",b)};g.fn.symbol.cache={"":g._cacher(function(b,e,i,c){return arguments.length>3?["M",b,e,"h",i,"v",c,"h",-i,"v",-c,"z"]:["M",b-i,e-i,"h",i*=2,"v",i,"h",-i,"v",-i,"z"]})};g.fn.symbol.ca={symbol:function(b){var e=g.is(b,"object")&&arguments.length===1&&!g.is(b,"function")?b:arguments,i;e===b&&(b=e[0]);e=(i=g.is(b,"function")&&b||g.fn.symbol.cache[b]||g.fn.symbol.cache[""])&&i.apply(g,
aa.call(e,1));g.is(e,"array")||g.is(e,"string")?this.attr("path",e):e&&this.attr(e)}};g.addSymbol=function(b,e){var i=g.is(e,"function")&&(i={},i[b]=e,i)||b,c=g.fn.symbol.cache,d=[],a;for(a in i)e=i[a],c[a]=g.is(e,"function")&&g._cacher(e,g)||(d.push(a),e);for(;a=d.pop();)c[a]=c[c[a]]};g.fn.button=function(b,e,i,c,d,a){a=this.group("button",a);a._.button={bound:this.rect(a),tracker:this.rect(a).attr({fill:K,stroke:K,cursor:"pointer"}).data("compositeButton",a)};var k;!g.is(d,"object")&&(d={});for(k in g.fn.button.fn)a[k]=
g.fn.button.fn[k];for(k in g.fn.button.ca)a.ca[k]=g.fn.button.ca[k];return a.attr({ishot:!0,"button-padding":[d.horizontalPadding,d.verticalPadding],"button-label":i,"button-symbol":c,"button-disabled":d.disabled,"button-symbol-position":d.symbolPosition,"button-symbol-padding":d.symbolPadding}).attr("button-repaint",[b,e,d.width,d.height,d.r])};g.fn.button.e={hoverin:function(){var b=this._.button.hoverbackIn;b&&b()===!1||(this.attr("fill","hover").hovered=!0)},hoverout:function(){var b=this._.button.hoverbackOut;
b&&b()===!1||(this.attr("fill",(this.pressed||this.active)&&"active"||"normal").hovered=!1)},mousedown:function(){this.attr("fill","active").pressed=!0},mouseup:function(){var b=this._.button.callback;this.attr("fill",this.hovered&&"hover"||this.active&&"active"||"normal").pressed=!1;b()}};g.fn.button.fn={buttonclick:function(b,e){var i=this._.button,e=e||this;i.callback=function(){return b.apply(e,arguments)};return this},labelcss:function(){var b=this._.button,e=b.label;b.cssArg=arguments;e&&e.css.apply(e,
arguments);return this},buttonhover:function(b,e,i,c){var d=this._.button,i=i||this,c=c||this;d.hoverbackIn=function(){return b.apply(i,arguments)};d.hoverbackOut=function(){return e.apply(c,arguments)};return this}};g.fn.button.ca={"button-active":function(b){this.attr("fill",(this.active=!!b)?"active":this.hovered&&"hover"||"normal")},"button-disabled":function(b){var e=this.paper,i=this._.button.tracker,c=e.button.e,b=ka(b);b==="disabled"||b==="true"||b==="1"?i.attr("fill","rgba(204,204,205,.5)").unmousedown(c.mousedown).unmouseup(c.mouseup).unhover(e.button.e.hoverin,
e.button.e.hoverout):i.attr("fill",K).mousedown(c.mousedown,this).mouseup(c.mouseup,this,!0).hover(e.button.e.hoverin,e.button.e.hoverout,this,this)},"button-label":function(b){var e=this._.button,i=this.attrs,c=e.label,d=e.cssArg,a=this.attrs["button-repaint"],b=ka(b||"");if(b==="none")c&&(e.label=c.remove());else if(b)!c&&(c=e.label=this.paper.text(this).insertBefore(e.tracker)),c.attr({text:b,"text-anchor":"start","vertical-align":"top"}),d&&d.length&&c.css.apply(c,d);a&&i["button-label"]!==b&&
this.attr("button-repaint",a)},"button-symbol":function(b){var e=this.attrs,i=this._.button,c=i.symbol,d=this.attrs["button-repaint"],b=ka(b||"");if(b==="none")c&&(i.symbol=c.remove());else if(b&&!c)i.symbol=this.paper.symbol(this).insertAfter(i.bound);d&&e["button-symbol"]!==b&&this.attr("button-repaint",d)},"button-symbol-position":function(b){return{"button-symbol-position":{top:"top",right:"right",bottom:"bottom",left:"left",none:"none"}[ka(b).toLowerCase()]||"none"}},"button-symbol-padding":function(b){return{"button-symbol-padding":s(b)}},
"button-padding":function(b,e){return{"button-padding":[b==null&&(b=5)||s(b),e==null&&b||s(e)]}},"button-repaint":function(b,j,i,c,d){var a=this._.button,k=a.bound,h=a.label,s=a.symbol,l=this.attrs,n=l["button-padding"],m=n[0],v=n[1],w;b==void 0&&(b=0);j==void 0&&(j=0);if(i==void 0||c==void 0)w=h&&h.getBBox()||{width:0,height:0},i==void 0&&(i=m*2+w.width),c==void 0&&(c=v*2+w.height);k=g.crispBound(b,j,i,c,k.attr("stroke-width"));k.r=g.pick(d,r(e(c,i)*0.1));b=k.x;j=k.y;i=k.width;c=k.height;h&&h.attr({x:b+
m,y:j+v});if(s){!g.is(w=l["button-symbol-padding"],"finite")&&(w=c*0.2);d=(c-v)*0.5;switch(l["button-symbol-position"]+(h&&"+"||"-")){case "right+":i+=d*2+v;b=b+i-d-m;j+=c*0.5;break;case "left+":b=b+m+d;j+=c*0.5;h.attr("x",b+d+w);break;case "top+":b+=i*0.5;j=j+n[1]+d;h&&h.attr("y",j+d+w);break;case "bottom+":c+=d*2+w;b+=i*0.5;j=j+c-v-d;break;default:b+=i*0.5,j+=c*0.5}s.attr("symbol",[l["button-symbol"],b,j,d])}a.bound.attr(k);a.tracker.attr(k)},fill:function(b,e,i,c){var d=this._.button,a=d.bound,
k=d.symbol,h=d.label,s={normal:d.gradient,active:d.gradientActive,hover:d.gradientHover}[b];if(!s)b=g.getRGB(b),b.error&&(b=g.color("#cccccc")),b="opacity"in b?"rgba("+[b.r,b.g,b.b,b.opacity]+")":"rgb("+[b.r,b.g,b.b]+")",d.gradient=[90,g.tintshade(b,-0.8).rgba+":0",g.tintshade(b,0.8).rgba+":100"].join("-"),d.gradientActive=[270,g.tintshade(b,-0.8).rgba+":0",g.tintshade(b,0.8).rgba+":100"].join("-"),c=g.getRGB(c),c.error&&(c=b)||(c="opacity"in c?"rgba("+[c.r,c.g,c.b,c.opacity]+")":"rgb("+[c.r,c.g,
c.b]+")"),d.gradientHover=[90,g.tintshade(c,-0.9).rgba+":0",g.tintshade(c,0.7).rgba+":100"].join("-"),i=i||g.tintshade(b,0.2).rgba,e=e||g.tintshade(b,-0.2).rgba,d.symbolFill=i,d.labelFill=e,s=(this.pressed||this.active)&&d.gradientActive||this.hovered&&d.gradienthover||d.gradient;a.attr("fill",s);k&&k.attr("fill",d.symbolFill);h&&h.attr("fill",d.labelFill);return!1},stroke:function(b,e){var i=this._.button,c=i.symbol,b=g.color(b);b.error&&(b=g.color("#999999"));i.bound.attr("stroke",b);c&&c.attr("stroke",
e||b);return!1},"stroke-width":function(b,e){var i=this._.button,c=i.symbol;i.bound.attr("stroke-width",b);i.tracker.attr("stroke-width",b);c&&c.attr("stroke-width",e);return!1}};var D={Q:"L",Z:"X",q:"l",z:"x",",":" "},M=/,?([achlmqrstvxz]),?/gi,Z,R=function(){return this.join(",").replace(M,Z)},v,C;if(g.svg)Z="$1",v=function(b){b?typeof b==="string"?b=b.replace(M,Z):b.toString=R:b="M0,0";this.node.setAttribute("d",b.toString());return this},g._engine.litepath=function(b,e,i,c){b=l("path");(c||e).canvas.appendChild(b);
e=new F(b,e,c);e.type="litepath";n(e,{fill:"none",stroke:"#000"});return e},g._getPath.litepath=function(b){return g.parsePathString(b.node.getAttribute("d"))};else if(g.vml)Z=function(b,e){return D[e]||e},C=function(){this._transform.apply(this,arguments);this._.bcoord&&(this.node.coordsize=this._.bcoord);return this},v=function(b){b?typeof b==="string"?b=b.replace(M,Z):b.toString=R:b="M0,0";this.node.path=b;return this},g._engine.litepath=function(b,e,i,c){var b=l("shape"),d=b.style,a=new F(b,e,
c);d.cssText="position:absolute;left:0;top:0;width:21600px;height:21600px;";i=s(i);isNaN(i)?b.coordsize="21600 21600":(a._.bzoom=i,d.width="1px",d.height="1px",b.coordsize=a._.bcoord=i+" "+i);b.coordorigin=e.coordorigin;a.type="litepath";a._transform=a.transform;a.transform=C;g._setFillAndStroke(a,{fill:"none",stroke:"#000"});(c||e).canvas.appendChild(b);e=l("skew");e.on=!0;b.appendChild(e);a.skew=e;return a},g._getPath.litepath=function(b){return g.parsePathString(b.node.path||"")};g.fn.litepath=
function(b,e,i){e&&e.constructor===F&&(i=e,e=void 0);b&&b.constructor===F&&(i=b,b="");e=g._engine.litepath(b,this,e,i);e.ca.litepath=v;b&&e.attr("litepath",g.is(b,"array")?[b]:b);this.__set__&&this.__set__.push(e);return e}}]);
FusionCharts(["private","modules.renderer.js-raphaelexport",function(){var g=this.hcLib,h=g.Raphael,m=g.pluckNumber,U=g.pluck,w=h._availableAttrs,S=/^matrix\(|\)$/g,ia=/\,/g,b=/\n|<br\s*?\/?>/ig,B=/[^\d\.]/ig,e=/[\(\)\s,\xb0#]/g,r=/group/ig,x=/&/g,$=/"/g,fa=/'/g,s=/</g,ka=/>/g,G=0;(function(h){var g=Math,Y=parseFloat,O=g.max,l=g.abs,n=g.pow,F=String,aa=/[, ]+/,D=[{reg:/xmlns\=\"http\:\/\/www.w3.org\/2000\/svg\"/ig,repStr:""},{reg:/^.*<svg /,repStr:'<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" '},
{reg:/\/svg>.*$/,repStr:"/svg>"},{reg:/\<desc\>[^\<]*\<\/desc\>/,repStr:""},{reg:/zIndex="[^"]+"/g,repStr:""},{reg:/url\((\\?[\'\"])[^#]+#/g,repStr:"url($1#"},{reg:/ href=/g,repStr:" xlink:href="},{reg:/(id|class|width|height)=([^" >]+)/g,repStr:'$1="$2"'},{reg:/:(path|rect)/g,repStr:"$1"},{reg:/\<ima?ge? ([^\>]+?)[^\/]\>/gi,repStr:"<image $1 />"},{reg:/\<\/ima?ge?\>/g,repStr:""},{reg:/style="([^"]+)"/g,repStr:function(b){return b.toLowerCase()}}],M={blur:function(){},transform:function(){},src:function(b,
e){e.attrSTR+=' xlink:href="'+e.attrs.src+'"'},path:function(b,e){var g=e.attrs.path,g=h._pathToAbsolute(g||"");e.attrSTR+=' d="'+(g.toString&&g.toString()||"").replace(ia," ")+'"'},gradient:function(b,s,m){var f=b.attrs.gradient,j="linear",i,c,d=0.5,a=0.5,k=c="",r="";i=f.replace(e,"_");if(!m[i]){f=F(f).replace(h._radial_gradient,function(b,e,c){j="radial";e&&c&&(d=Y(e),a=Y(c),b=(a>0.5)*2-1,n(d-0.5,2)+n(a-0.5,2)>0.25&&(a=g.sqrt(0.25-n(d-0.5,2))*b+0.5)&&a!=0.5&&(a=a.toFixed(5)-1.0E-5*b));return""});
f=f.split(/\s*\-\s*/);if(j==="linear"){c=f.shift();c=-Y(c);if(isNaN(c))return null;var u=[0,0,g.cos(h.rad(c)),g.sin(h.rad(c))];c=1/(O(l(u[2]),l(u[3]))||1);u[2]*=c;u[3]*=c;u[2]<0&&(u[0]=-u[2],u[2]=0);u[3]<0&&(u[1]=-u[3],u[3]=0)}f=h._parseDots(f);if(!f)return null;j==="radial"?(c='<radialGradient fx = "'+d+'" fy = "'+a+'" id = "'+i+'">',k="</radialGradient>"):(c='<linearGradient x1 = "'+u[0]+'" y1 = "'+u[1]+'" x2 = "'+u[2]+'" y2 = "'+u[3]+'" gradientTransform ="matrix('+b.matrix.invert()+')" id = "'+
i+'">',k="</linearGradient>");b=0;for(u=f.length;b<u;b++)r+='<stop offset="'+(f[b].offset?f[b].offset:b?"100%":"0%")+'" stop-color="'+(f[b].color||"#fff")+'" stop-opacity="'+(f[b].opacity===void 0?1:f[b].opacity)+'" />';m[i]=!0;m.str+=c+r+k}s.attrSTR+=" fill=\"url('#"+i+"')\""},fill:function(b,e){var g=e.attrs,f=g.fill,j;if(!b.attrs.gradient)if(f=h.color(f),j=f.opacity,b.type==="text")e.styleSTR+="fill:"+f+"; stroke-opacity:0; ";else if(e.attrSTR+=' fill="'+f+'"',!g["fill-opacity"]&&(j||j===0))e.attrSTR+=
' fill-opacity="'+j+'"'},stroke:function(b,e){var g=e.attrs,f,j;f=h.color(g.stroke);j=f.opacity;if(b.type!=="text"&&(e.attrSTR+=' stroke="'+f+'"',!g["stroke-opacity"]&&(j||j===0)))e.attrSTR+=' stroke-opacity="'+j+'"'},"clip-rect":function(b,h,g){var f=F(h.attrs["clip-rect"]),j=f.split(aa),f=f.replace(e,"_")+"__"+G++;j.length===4&&(g[f]||(g[f]=!0,g.str+='<clipPath id="'+f+'"><rect x="'+j[0]+'" y="'+j[1]+'" width="'+j[2]+'" height="'+j[3]+'" transform="matrix('+b.matrix.invert().toMatrixString().replace(S,
"")+')"/></clipPath>'),h.attrSTR+=' clip-path="url(#'+f+')"')},cursor:function(b,e){var h=e.attrs.cursor;h&&(e.styleSTR+="cursor:"+h+"; ")},font:function(b,e){e.styleSTR+="font:"+e.attrs.font.replace(/\"/ig," ")+"; "},"font-size":function(b,e){var h=U(e.attrs["font-size"],"10");h&&h.replace&&(h=h.replace(B,""));e.styleSTR+="font-size:"+h+"px; "},"font-weight":function(b,e){e.styleSTR+="font-weight:"+e.attrs["font-weight"]+"; "},"font-family":function(b,e){e.styleSTR+="font-family:"+e.attrs["font-family"]+
"; "},"line-height":function(){},"clip-path":function(){},visibility:function(){},"vertical-align":function(){},"text-anchor":function(b,e){var h=e.attrs["text-anchor"]||"middle";b.type==="text"&&(e.attrSTR+=' text-anchor="'+h+'"')},title:function(){},text:function(e,h){var g=h.attrs,f=g.text,j=U(g["font-size"],g.font,"10"),i=U(g["line-height"]),c;j&&j.replace&&(j=j.replace(B,""));j=m(j);i&&i.replace&&(i=i.replace(B,""));i=m(i,j&&j*1.2);c=j?j*0.85:i*0.75;for(var j=g.x,d=U(g["vertical-align"],"middle").toLowerCase(),
f=F(f).split(b),g=f.length,a=0,d=d==="top"?c:d==="bottom"?c-i*g:c-i*g*0.5;a<g;a++)h.textSTR+="<tspan ",c=(f[a]||"").replace(x,"&amp;").replace($,"&quot;").replace(fa,"&#39;").replace(s,"&lt;").replace(ka,"&gt;"),h.textSTR+=a?'dy="'+i+'" x="'+j+'" ':'dy="'+d+'"',h.textSTR+=">"+c+"</tspan>"}},Z=function(b,e){var h="",f={attrSTR:"",styleSTR:"",textSTR:"",attrs:b.attr()},g=b.isShadow,i="",c="",d,a,k=f.attrs;if(b.node.style.display!=="none"&&!g){for(d in k)if(d!=="gradient"&&(w[d]!==void 0||M[d]))if(M[d])M[d](b,
f,e);else f.attrSTR+=" "+d+'="'+k[d]+'"';b.attrs.gradient&&M.gradient(b,f,e);b.type==="rect"&&k.r&&(f.attrSTR+=' rx="'+k.r+'" ry="'+k.r+'"');for(a in b.styles)f.styleSTR+=a+":"+b.styles[a]+"; ";b.type==="image"&&(f.attrSTR+=' preserveAspectRatio="none"');b.bottom&&(i=Z(b.bottom,e));b.next&&(c=Z(b.next,e));g=b.type;g.match(r)&&(g="g");h+="<"+g+' transform="matrix('+b.matrix.toMatrixString().replace(S,"")+')" style="'+f.styleSTR+'"'+f.attrSTR+">"+f.textSTR+i+"</"+g+">"+c}else b.next&&(h+=Z(b.next,e));
return h};h.fn.toSVG=function(b){var e="",g={str:""},f=0,j=D.length,i="";if(h.svg){if(this.canvas&&this.canvas.parentNode)for(e=this.canvas.parentNode.innerHTML;f<j;f+=1)g=D[f],e=e.replace(g.reg,g.repStr)}else e='<svg style="overflow: hidden; position: relative;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+this.width+'" version="1.1" height="'+this.height+'">',this.bottom&&(i=Z(this.bottom,g)),e+="<defs>"+g.str+"</defs>"+i+"</svg>";b||(e=e.replace(/\<image [^\>]*\>/gi,
""));return e}})(h)}]);
FusionCharts(["private","modules.renderer.js-raphaeltooltip",function(){var g=window,h=document,m=this.hcLib,U=m.Raphael,w=U.eve,S=m.createElement,ia=m.addEvent,b=m.removeEvent,B=m.getPosition,e=m.hasTouch,r=m.getTouchEvent,x=g.Math,$=x.ceil,fa=x.floor,s=g.screen.availHeight,ka=g.screen.availWidth,G={"":1,moz:1,webkit:1,o:1,ms:1},V={borderRadius:"borderRadius",boxShadow:"boxShadow"},K=/\-([a-z])/ig,Y=function(b,e){return e.toUpperCase()},O=function(b){var e=l.forbiddenStyle,h,g,s;for(h in b)g=K.test(h)?
h.replace(K,Y):h,b[h]!==void 0&&!e[g]&&(this[g]=b[h]),U.vml&&/color/ig.test(g)&&(this[g]=U.getRGB(this[g]).toString());for(h in V)if(this[h])for(s in G)this[s+h]=this[h]},l=m.toolTip={elementId:"fusioncharts-tooltip-element",element:null,lastTarget:null,currentTarget:null,currentPaper:null,pointeroffset:12,defaultStyle:m.extend2(O.prototype,{backgroundColor:"#ffffee",borderColor:"#000000",borderWidth:"1px",color:"#000000",fontSize:"10px",lineHeight:"12px",padding:"3px",borderStyle:"solid"}),defaultContainerStyle:{position:"absolute",
textAlign:"left",margin:"0",zIndex:"999",pointer:"default",display:"block"},forbiddenStyle:{}},n=function(e){b(window,"click",n);l.onhide.call(this,e)};if(U.svg)l.defaultContainerStyle.pointerEvents="none",l.defaultStyle.borderRadius="0",l.defaultStyle.boxShadow="none";if(U.vml)l.forbiddenStyle.borderRadius=!0,l.forbiddenStyle.boxShadow=!0,l.defaultStyle.filter="";l.setup=function(){var b=l.container,g=l.textElement,s=l.style,n=l.defaultContainerStyle,m=l.forbiddenStyle,r;if(!b)b=l.element=S("span"),
(h.body||h.getElementsByTagName("body")[0]).appendChild(b),b.setAttribute("id",l.elementId),s=l.containerStyle=b.style,g=l.textElement=S("span"),b.appendChild(g),l.style=U.vml?g.runtimeStyle:g.style,l.style.overflow="hidden",l.style.display="block",l.hidden=!1,l.hide();for(r in n)!m[r]&&(s[r]=n[r]);ia(b,e&&"touchstart"||"mouseover",l.onredraw);l.scatted=!0;w.on("raphael.drag.start.*",function(){l.scatted&&(l.waitingScat=!0)});w.on("raphael.drag.move.*",function(){if(l.waitingScat)l.block(),l.waitingScat=
!1});w.on("raphael.drag.end.*",function(){l.waitingScat=!1;l.scatted&&l.unblock(!0)});w.on("raphael.remove",function(){if(l.currentPaper===this||l.currentTarget&&l.currentTarget.paper===this)l.hide(),l.currentTarget=l.currentPaper=null})};l.restyle=function(b){var e=l.style,h;for(h in b)e[h]=b[h]};l.onelement=function(b){var h=b.data,g=h.paper;if(g.__tip_style){l.hiding&&(l.hiding=clearTimeout(l.hiding));if(l.currentPaper!==g)g.__tip_cp=g.canvas&&B(g.canvas.parentNode,!0)||{},l.restyle(g.__tip_style),
l.currentPaper=g;l.lastTarget=l.currentTarget;l.currentTarget=h;l.scatted=h.__tip_scatted;l.onredraw.call(this,b);if(e)return ia(window,"click",n),!1}};l.onredraw=function(b){l.redrawing&&clearTimeout(l.redrawing);b=r(b);l.x=fa(b.pageX);l.y=fa(b.pageY);l.redrawing=setTimeout(l.redraw,0)};l.onhide=function(){l.hiding=setTimeout(l.hide,200)};l.redraw=function(){if(!l.blocked&&l.currentTarget){var b=l.currentTarget,e=b.paper,g=l.textElement,n=l.containerStyle,m=l.style,r=b.__tip_text,b=l.pointeroffset,
v=e.__tip_cp,w=h.documentElement||h.body,f=w.scrollLeft,w=w.scrollTop,j=l.x,i=l.y,c,d=e.width,a=e.height,e=e.__tip_constrain;if(d<100||a<100)e=!1;if(l.hidden)l.containerStyle.top="-999em",l.show();if(r!==l.text)l.text=r,n.width=n.height="",g.innerHTML=r,m.whiteSpace="nowrap",r=$(m.pixelWidth||g.offsetWidth||0),c=$(m.pixelHeight||g.offsetHeight||0),(l.textWidthOverflow=r>d)?(n.width=(d||0)-b*2+"px",m.whiteSpace="normal"):n.width="",(l.textHeightOverflow=c>a)?(n.height=(a||0)-b*2+"px",m.whiteSpace=
"normal"):n.height="";r=$(m.pixelWidth||g.offsetWidth||0);c=$(m.pixelHeight||g.offsetHeight||0);e?(l.textWidthOverflow?j=v.left-f:j+b+r>v.left-f+d-b&&(j=j-r-b),l.textHeightOverflow?i=v.top-w:i+b+c>v.top-w+a-b&&(i=i-c-b*1.5)):(f+ka<j+b+r&&(j=j-r-b),w+s<i+b+c&&(i=i-c-b*1.5));n.left=(j+b||0)+"px";n.top=(i+b||0)+"px";l.hidden&&l.show()}};l.hide=function(){l.hiding&&(l.hiding=clearTimeout(l.hiding));l.containerStyle.display="none";l.hidden=!0};l.show=function(){if(!l.blocked)l.hiding&&(l.hiding=clearTimeout(l.hiding)),
l.containerStyle.display="inline",l.hidden=!1};l.block=function(){l.blocked=!0;l.containerStyle.display="none"};l.unblock=function(b){l.blocked=!1;b&&(l.containerStyle.display=l.hidden&&"none"||"inline")};U.fn.tooltip=function(b,e,g){if(e)e=(e.opacity===void 0?1:e.opacity)*0.4,U.svg?b.boxShadow="1px 1px 3px rgba(64,64,64,"+e+")":b.filter="progid:DXImageTransform.Microsoft.Shadow(Strength=2, Direction=135, Color='#404040', shadowOpacity='"+e/2+"')";this.__tip_style=new O(b);this.__tip_cp=this.canvas&&
B(this.canvas.parentNode,!0)||{};this.__tip_constrain=Boolean(g);return this};U.el.tooltip=function(g,h,s,n,m){l.setup();U.el.tooltip=function(g,h,s,f,j){h=this.node;s=g===!1||g==void 0||!(g+"");this.__tip_scatted=f==void 0?this.__tip_scatted:!f;this.__tip_scatted==void 0&&(this.__tip_scatted=!0);if(j!=null)this.__tip_blocked=j;s^!this.__tip_text&&(e?(s?b:ia)(h,"click",l.onelement,this):s?(b(h,"mouseover",l.onelement,this),b(h,"mousemove",l.onredraw,this),b(h,"mouseout",l.onhide,this)):(ia(h,"mouseover",
l.onelement,this),ia(h,"mousemove",l.onredraw,this),ia(h,"mouseout",l.onhide,this)));this.__tip_text=g;if(l.currentTarget===this&&g!==l.text&&!l.hidden)l[s?"hide":"redraw"]();return this};return U.el.tooltip.call(this,g,h,s,n,m)}}]);
FusionCharts(["private","modules.renderer.js-base",function(){var g=this,h=g.hcLib,m=window,U=m.document,w=h.BLANKSTRING,S=h.createTrendLine,ia=m.location.protocol==="https:"?"https://export.api3.fusioncharts.com/":"http://export.api3.fusioncharts.com/",b=h.pluck,B=h.getValidValue,e=h.pluckNumber,r=h.defaultPaletteOptions,x=h.getFirstValue,$=h.getDefinedColor,fa=h.parseUnsafeString,s=h.FC_CONFIG_STRING,ka=h.extend2,G=h.getDashStyle,V=h.toPrecision,K=h.regex.dropHash,Y=h.HASHSTRING,O=h.getSentenceCase,
l=h.addEvent,m=Math,n=m.min,F=m.max,aa=m.ceil,D=m.floor,M=m.log,Z=m.pow,R=h.graphics.getColumnColor,v=h.getFirstColor,C=h.setLineHeight,f=h.pluckFontSize,j=h.getFirstAlpha,i=h.graphics.getDarkColor,c=h.graphics.getLightColor,d=h.graphics.convertColor,a=h.COLOR_TRANSPARENT,k=h.POSITION_CENTER,q=h.POSITION_TOP,u=h.POSITION_BOTTOM,N=h.POSITION_RIGHT,ca=h.POSITION_LEFT,J=h.chartAPI,Ja=h.titleSpaceManager,m=h.placeLegendBlockBottom,pa=h.placeLegendBlockRight,va=h.graphics.mapSymbolName,m=J.singleseries,
pa=J.multiseries,X=h.COMMASTRING,Ca=h.STRINGUNDEFINED,ma=h.ZEROSTRING,ta=h.ONESTRING,Aa=h.HUNDREDSTRING,Ka=h.PXSTRING,bb=h.COMMASPACE,Va=!/fusioncharts\.com$/i.test(location.hostname),Ra=h.CREDIT_STRING="FusionCharts XT Trial",sa=h.BLANKSTRINGPLACEHOLDER,Ma=h.BGRATIOSTRING,Na=h.COLOR_WHITE,Wa=h.TESTSTR,Ta=h.graphics.getAngle,Fa=h.axisLabelAdder,$a=h.falseFN,eb=h.SmartLabelManager,fb=h.NumberFormatter,Sa=h.getLinkAction,Za=h.getAxisLimits,p=h.createDialog,z=function(a,b){return a>0?M(a)/M(b||10):null},
t=h.hasTouch=document.documentElement.ontouchstart!==void 0;h.removeEvent=function(a,b,e){var d=U.removeEventListener?"removeEventListener":"detachEvent";U[d]&&!a[d]&&(a[d]=function(){});jQuery(a).unbind(b,e)};var H=h.fireEvent=function(a,b,e,d){var c=jQ.Event(b),f="detached"+b;ka(c,e);a[b]&&(a[f]=a[b],a[b]=null);jQuery(a).trigger(c);a[f]&&(a[b]=a[f],a[f]=null);d&&!c.isDefaultPrevented()&&d(c)},P={fontWeight:{1:"bold",0:"normal"},fontStyle:{1:"italic",0:"normal"},textDecoration:{1:"underline",0:"none"}},
ga={font:function(a,b){b.style.fontFamily=a},size:function(a,b){if(a)b.style.fontSize=f(a)+Ka},color:function(a,b,e){b.style.color=a&&a.replace&&a.replace(K,Y)||w;if(e)b.color=b.style.color},bgcolor:function(a,b){b.style.backgroundColor=a&&a.replace&&a.replace(K,Y)||w},bordercolor:function(a,b){b.style.border="1px solid";b.style.borderColor=a&&a.replace&&a.replace(K,Y)||w},ishtml:w,leftmargin:function(a,b){b.style.marginLeft=e(a,0)+Ka},letterspacing:function(a,b){b.style.letterSpacing=e(a,0)+Ka},
bold:function(a,b){b.style.fontWeight=P.fontWeight[a]||""},italic:function(a,b){b.style.fontStyle=P.fontStyle[a]||""},underline:function(a,b){b.style.textDecoration=P.textDecoration[a]||""}},qa={chart2D:{bgColor:"bgColor",bgAlpha:"bgAlpha",bgAngle:"bgAngle",bgRatio:"bgRatio",canvasBgColor:"canvasBgColor",canvasBaseColor:"canvasBaseColor",divLineColor:"divLineColor",legendBgColor:"legendBgColor",legendBorderColor:"legendBorderColor",toolTipbgColor:"toolTipbgColor",toolTipBorderColor:"toolTipBorderColor",
baseFontColor:"baseFontColor",anchorBgColor:"anchorBgColor"},chart3D:{bgColor:"bgColor3D",bgAlpha:"bgAlpha3D",bgAngle:"bgAngle3D",bgRatio:"bgRatio3D",canvasBgColor:"canvasBgColor3D",canvasBaseColor:"canvasBaseColor3D",divLineColor:"divLineColor3D",divLineAlpha:"divLineAlpha3D",legendBgColor:"legendBgColor3D",legendBorderColor:"legendBorderColor3D",toolTipbgColor:"toolTipbgColor3D",toolTipBorderColor:"toolTipBorderColor3D",baseFontColor:"baseFontColor3D",anchorBgColor:"anchorBgColor3D"}},da=function(){var a=
{},b,e=function(){var e,d,c,f,ha=0,p;for(e in a)if(ha+=1,d=a[e],c=d.jsVars,f=(d=d.ref)&&d.parentNode){if(p=f.offsetWidth,f=f.offsetHeight,!c.resizeLocked&&(c._containerOffsetW!==p||c._containerOffsetH!==f))d.resize&&d.resize(),c._containerOffsetW=p,c._containerOffsetH=f}else delete a[e],ha-=1;ha||(b=clearInterval(b))};return function(d){var c=d.jsVars,f=d.ref&&d.ref.parentNode||{};c._containerOffsetW=f.offsetWidth;c._containerOffsetH=f.offsetHeight;a[d.id]=d;b||(b=setInterval(e,300))}}(),A={getExternalInterfaceMethods:function(){var a=
J[this.jsVars.type],a=a&&a.eiMethods,b="saveAsImage,print,exportChart,getXML,hasRendered,signature,cancelExport,getSVGString,";if(typeof a==="string")b+=a+X;else if(a!==void 0||a!==null)for(var e in a)b+=e+X;return b.substr(0,b.length-1)},drawOverlayButton:function(a){var b=this.jsVars,e=b.$overlayButton;if(a&&a.show){if(!e)e=b.$overlayButton=jQuery("<span>"),e.click(function(){g.raiseEvent("OverlayButtonClick",a,b.fcObj)});e.text(a.message?a.message:"Back");b.overlayButtonMessage=e.text();e.css({border:"1px solid "+
(a.borderColor?a.borderColor.replace(K,Y):"#7f8975"),backgroundColor:a.bgColor?a.bgColor.replace(K,Y):"#edefec",fontFamily:a.font?a.font:"Verdana",color:"#"+a.fontColor?a.fontColor:"49563a",fontSize:(a.fontSize?a.fontSize:"10")+Ka,padding:(a.padding?a.padding:"3")+Ka,fontWeight:parseInt(a.bold,10)===0?"normal":"bold",position:"absolute",top:"0",right:"0",_cursor:"hand",cursor:"pointer"});b.hcObj.container.appendChild(e[0]);b.overlayButtonActive=!0}else if(e)e.detach(),b.overlayButtonActive=!1,delete b.overlayButtonMessage},
print:function(){return this.jsVars.hcObj&&this.jsVars.hcObj.hasRendered&&this.jsVars.hcObj.print()},exportChart:function(a){var b=this.jsVars.hcObj;if(b&&b.options&&b.options.exporting&&b.options.exporting.enabled)return b.exportChart(a);return!1},getSVGString:function(){return this.jsVars&&this.jsVars.hcObj&&this.jsVars.hcObj.paper&&this.jsVars.hcObj.paper.toSVG()},resize:function(){var a=this.jsVars,b=a.container,e=a.fcObj,d=a.hcObj;d&&(d&&d.destroy&&d.destroy(),h.createChart(a.fcObj,b,a.type,
void 0,void 0,!1),delete a.isResizing,h.raiseEvent("resized",{width:e.width,height:e.height,prevWidth:a.width,prevHeight:a.height},e,[e.id]))},lockResize:function(a){return this.jsVars.resizeLocked=a===void 0&&!0||a},showChartMessage:function(a,b,e){var d=this.jsVars,c=d.hcObj;d.msgStore[a]&&(a=d.msgStore[a]);b&&c&&c.hasRendered?a?c.showMessage(a,e):c.hideLoading():(c&&c.destroy&&c.destroy(),h.createChart(d.fcObj,d.container,d.type,void 0,a));return a},signature:function(){return"FusionCharts/3.3.1 (XT)"}};
h.createChart=function(a,b,e,d,c,f,i){var t=a.jsVars,k=t.msgStore,j,z=J[e],s,l=function(c){var f={renderer:"javascript"},o=t.fcObj,p=o.width,i=o.height,Q=z&&z.eiMethods,k=t.$overlayButton;b.jsVars=a.jsVars;t.container=b;t.hcObj=c;t.type=e;t.width=b.offsetWidth;t.height=b.offsetHeight;t.instanceAPI=s;if(c.hasRendered){g.extend(b,A);if(Q&&typeof Q!=="string")for(var j in Q)b[j]=Q[j];t.overlayButtonActive&&k&&(k.text(t.overlayButtonMessage),c.container.appendChild(k[0]))}d&&(d({success:c.hasRendered,
ref:b,id:a.id}),c.hasRendered&&(p=Number((p&&p.match&&p.match(/^\s*(\d*\.?\d*)\%\s*$/)||[])[1]),i=Number((i&&i.match&&i.match(/^\s*(\d*\.?\d*)\%\s*$/)||[])[1]),(p||i)&&o.ref&&o.ref.parentNode&&da(o),h.raiseEvent("loaded",{type:e,renderer:"javascript"},a,[a.id]),h.raiseEvent("rendered",{renderer:"javascript"},o,[o.id])));if(c.hasRendered&&t.previousDrawCount<t.drawCount)f.width=t.width,f.height=t.height,f.drawCount=t.drawCount,f.drawingLatency=s.drawingLatency,f.displayingMessage=t.hasNativeMessage,
h.raiseEvent("drawcomplete",f,o,[o.id])};a.__state.dataReady=!1;t.instanceAPI&&t.instanceAPI.dispose&&t.instanceAPI.dispose();s=z?new J(e):new J("stub");s.chartInstance=a;if(c!==void 0){if(typeof c==="string")c=new p(b,c),t.hasNativeMessage=!0}else!z||!z.init||z&&z.name==="stub"?(c=new p(b,k.ChartNotSupported),t.hasNativeMessage=!0):t.message?(c=new p(b,t.message),t.hasNativeMessage=!0):t.loadError?(c=new p(b,k.LoadDataErrorText),t.hasNativeMessage=!0):t.stallLoad?(c=new p(b,k.XMLLoadingText),t.hasNativeMessage=
!0):(c=a.getChartData(FusionChartsDataFormats.JSON,!0),j=c.data,c.error instanceof Error?(c=new p(b,k.InvalidXMLText),t.hasNativeMessage=!0,i||h.raiseEvent("dataxmlinvalid",{},t.fcObj,[t.fcObj.id])):(i||h.raiseEvent("dataloaded",{},t.fcObj,[t.fcObj.id]),c=s.init(b,j,a,l),t.previousDrawCount=t.drawCount,t.drawCount+=1,c.series.length===0?(c=new p(b,k.ChartNoDataText),t.hasNativeMessage=!0,i||h.raiseEvent("nodatatodisplay",{},t.fcObj,[t.fcObj.id])):(a.__state.dataReady=!0,t.hasNativeMessage=!1,delete t.message)));
if(!c)c=new p(b,"Error rendering chart {0x01}"),t.hasNativeMessage=!0;c.chart=c.chart||{};c.chart.renderTo=b;c.credits=c.credits||{};c.credits.enabled=z&&z.creditLabel===!0?!0:!1;if(f===!1)c.chart.animation=!1,(c.plotOptions||(c.plotOptions={}))&&(c.plotOptions.series||(c.plotOptions.series={})),c.plotOptions.series.animation=!1;if(b.style)c.chart.containerBackgroundColor=t.transparent?"transparent":a.options.containerBackgroundColor||"#ffffff";return s.draw(c,l)};var wa=h.HCstub=function(a,b,d,c){var a=
a.chart,f=e(a.charttopmargin,c.charttopmargin,15),p=e(a.chartrightmargin,c.chartrightmargin,15),t=e(a.chartbottommargin,c.chartbottommargin,15),i=e(a.chartleftmargin,c.chartleftmargin,15),g=f+t,h=i+p;d*=0.7;b*=0.7;g>d&&(f-=(g-d)*f/g,t-=(g-d)*t/g);h>b&&(i-=(h-b)*i/h,p-=(h-b)*p/h);b={_FCconf:{0:{stack:{}},1:{stack:{}},x:{stack:{}},oriCatTmp:[],noWrap:!1,marginLeftExtraSpace:0,marginRightExtraSpace:0,marginBottomExtraSpace:0,marginTopExtraSpace:0,marimekkoTotal:0},chart:{alignTicks:!1,renderTo:w,ignoreHiddenSeries:!1,
events:{},reflow:!1,spacingTop:f,spacingRight:p,spacingBottom:t,spacingLeft:i,marginTop:f,marginRight:p,marginBottom:t,marginLeft:i,borderRadius:0,plotBackgroundColor:"#FFFFFF",style:{},animation:!e(a.defaultanimation,a.animation,1)?!1:{duration:e(a.animationduration,1)*500}},colors:["AFD8F8","F6BD0F","8BBA00","FF8E46","008E8E","D64646","8E468E","588526","B3AA00","008ED6","9D080D","A186BE","CC6600","FDC689","ABA000","F26D7D","FFF200","0054A6","F7941C","CC3300","006600","663300","6DCFF6"],credits:{href:"http://www.fusioncharts.com?BS=FCHSEvalMark",
text:Ra,enabled:!0},global:{},labels:{items:[]},lang:{},legend:{enabled:!0,symbolWidth:12,borderRadius:1,backgroundColor:"#FFFFFF",initialItemX:0,title:{text:w,x:0,y:0,padding:2},scroll:{},itemStyle:{}},loading:{},plotOptions:{series:{pointPadding:0,borderColor:"#333333",events:{},animation:!e(a.animation,a.defaultanimation,1)?!1:{duration:e(a.animationduration,1)*1E3},states:{hover:{enabled:!1},select:{enabled:!1}},dataLabels:{enabled:!0,color:"#555555",style:{},formatter:function(){return this.point.showPercentValues?
c.numberFormatter.percentValue(this.percentage):this.point.displayValue}},point:{events:{}}},area:{states:{hover:{enabled:!1}},marker:{lineWidth:1,radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},radar:{states:{hover:{enabled:!1}},marker:{lineWidth:1,radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},areaspline:{states:{hover:{enabled:!1}},marker:{lineWidth:1,radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},line:{shadow:!0,states:{hover:{enabled:!1}},marker:{lineWidth:1,
radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},scatter:{states:{hover:{enabled:!1}},marker:{lineWidth:1,radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},bubble:{states:{hover:{enabled:!1}},marker:{lineWidth:1,radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},spline:{states:{hover:{enabled:!1}},marker:{lineWidth:1,radius:3,states:{hover:{enabled:!1},select:{enabled:!1}}}},pie:{size:"80%",allowPointSelect:!0,cursor:"pointer",point:{events:{legendItemClick:a.interactivelegend===
ma?$a:function(){this.slice()}}}},pie3d:{size:"80%",allowPointSelect:!0,cursor:"pointer",point:{events:{legendItemClick:a.interactivelegend===ma?$a:function(){this.slice()}}}},column:{},floatedcolumn:{},column3d:{},bar:{},bar3d:{}},point:{},series:[],subtitle:{text:w,style:{}},symbols:[],title:{text:w,style:{}},toolbar:{},tooltip:{style:{}},xAxis:{steppedLabels:{style:{}},labels:{x:0,style:{},enabled:!1},lineWidth:0,plotLines:[],plotBands:[],title:{style:{},text:w},tickWidth:0,scroll:{enabled:!1}},
yAxis:[{startOnTick:!1,endOnTick:!1,title:{style:{},text:w},tickLength:0,labels:{x:0,style:{}},plotBands:[],plotLines:[]},{tickLength:0,gridLineWidth:0,startOnTick:!1,endOnTick:!1,title:{style:{},text:w},labels:{x:0,style:{},enabled:!1,formatter:function(){return this.value!==sa?this.value:w}},opposite:!0,plotBands:[],plotLines:[]}],exporting:{buttons:{exportButton:{},printButton:{enabled:!1}}}};if(a.palettecolors&&typeof a.palettecolors==="string")b.colors=a.palettecolors.split(X);return c.hcJSON=
b},Ia=h.placeVerticalAxis=function(a,b,d,c,f,p,t,i,g,h){var k=d[s],j=k.smartLabel,z,A,l,n,m=0,i=k.marginRightExtraSpace,H=k.marginLeftExtraSpace,r={},P={},q={},u=a.plotLines,qa=a.plotBands,k=b.verticalAxisValuesPadding,ga=!isNaN(b.fixedValuesPadding)?b.fixedValuesPadding:0,v=k-ga,da=b.verticalAxisValuesPadding,ea=b.verticalAxisNamePadding,x=b.verticalAxisNameWidth,wa=b.rotateVerticalAxisName,Ia=a.offset?a.offset:0,ra=0,Ba=0,ba=0,G=0,I=0,Da=0,T=0,la,O,za,C,k=2,T=t?i+8:H+4,K=function(a,e){var d,c;if(a&&
a.label&&B(a.label.text)!==void 0){za=a.label;if(za.style&&za.style!==O)O=za.style,j.setStyle(O);z=j.getOriSize(a.label.text);c=(d=z.width)?d+2:0;if(a.isGrid){if(r[e]={width:d,height:z.height,label:za},G<=c)G=c,b.lYLblIdx=e}else a.isTrend&&(t&&za.textAlign===ca||za.textAlign===N?(P[e]={width:d,height:z.height,label:za},I=F(I,c)):(q[e]={width:d,height:z.height,label:za},Da=F(Da,c)))}},D=function(b,e){var d,c=e?m:m+b;A=A||{};return c>0?(wa?(c<A.height&&(A=j.getSmartText(a.title.text,f,c)),d=A.height):
(c<A.width&&(A=j.getSmartText(a.title.text,c,f)),d=A.width),a.title.text=A.text,A.tooltext&&(a.title.originalText=A.tooltext),e?c-d+b:c-d):(a.title.text=w,0)},ka=function(a,b,e){for(var d in a)a[d].label.x=b,a[d].label.y=e};la=0;for(ba=qa.length;la<ba;la+=1)K(qa[la],la);la=0;for(ba=u.length;la<ba;la+=1)K(u[la],la);if(a.title&&a.title.text!=w)O=a.title.style,j.setStyle(O),l=j.getOriSize(Wa).height,wa?(A=j.getSmartText(a.title.text,f,p),m=A.height,n=l):(a.title.rotation=0,A=j.getSmartText(a.title.text,
x!==void 0?x:p,f),m=A.width,n=20);Da>0&&(Ba=Da+da);g&&(c=e(c.chart.maxlabelwidthpercent,0),c>=1&&c<=100&&(g=c*g/100,G>g&&(G=g)));ra=F(I,G);ra+=ra?v+ga:0;m>0&&(ra+=m+ea+T);(function(){if(Ba+ra>p){C=Ba+ra-p;if(Ba)if(da>=C){da-=C;return}else C-=da,da=0;if(v+ea>=C)ea>=C?ea-=C:(v-=C-ea,ea=0);else{C-=v+ea;ea=v=0;if(Da>20)if(I>G)if(Da-I>=C){Da-=C;return}else if(I-Da>=C){I-=C;return}else if(I>Da?(C-=I-Da,I=Da):(C-=Da-I,Da=I),2*(I-G)>=C){Da-=C/2;I-=C/2;return}else C-=2*(I-G),Da=I=G;else if(Da-20>=C){Da-=C;
return}else C-=Da-20,Da=20;if(I>G)if(I-G>=C){I-=C;return}else C-=I-G,I=G;m-n>=C?m-=C:(C-=m-n,m=n,Da>=C?Da=0:(C-=Da,Da=0,m>=C?m=0:(C-=m,m=0,G>=C&&(G-=C,I=G))))}}})();ba=function(a,b){var e,d=0,c=b?Da-2:Da+a-2;if(Da>0){for(la in q)if(za=q[la].label,q[la].width>c){if(za.style&&za.style!==O)O=za.style,j.setStyle(O);e=j.getSmartText(za.text,c,f,!0);za.text=e.text;e.tooltext&&(za.originalText=e.tooltext);q[la].height=e.height;d=Math.max(d,e.width)}else d=Math.max(d,q[la].width);return b?c-d+a:c-d}else{for(la in q)q[la].label.text=
w;return 0}}(0,!0);ba=D(ba,!0);ba=function(a){var b=0,e=Math.max(G,I)+a-2;if(e>0){for(la in r)if(za=r[la].label,r[la].width>e){if(za.style&&za.style!==O)O=za.style,j.setStyle(O);a=j.getSmartText(za.text,e,f,!0);za.text=a.text;a.tooltext&&(za.originalText=a.tooltext);r[la].height=a.height;b=Math.max(b,a.width)}else b=Math.max(b,r[la].width);for(la in P)if(za=P[la].label,P[la].width>e){if(za.style&&za.style!==O)O=za.style,j.setStyle(O);a=j.getSmartText(za.text,e,f,!0);za.text=a.text;a.tooltext&&(za.originalText=
a.tooltext);P[la].height=a.height;b=Math.max(b,a.width)}else b=Math.max(b,P[la].width);return e-b}else{for(la in r)r[la].label.text=w;for(la in P)P[la].label.text=w;return 0}}(ba);ba=D(ba);g=b.verticalAxisNamePadding-ea;ba&&g&&(ba>g?(ea+=g,ba-=g):(ea+=ba,ba=0));g=b.verticalAxisValuesPadding-(v+ga);ba&&g&&(ba>g?(v+=g,ba-=g):(v+=ba,ba=0));g=b.verticalAxisValuesPadding-da;ba&&g&&(ba>g?(da+=g,ba-=g):(da+=ba,ba=0));Da>0&&(Ba=Da+da);ra=F(I,G);ra+=ra?v+ga:0;m>0&&(ra+=m+ea+T);g=F(I,G);g+=g>0?v+ga:0;m>0?(wa?
m<A.height&&(A=j.getSmartText(a.title.text,f,m)):(m<A.width&&(A=j.getSmartText(a.title.text,m,f)),a.title.y=-((A.height-l)/2)),a.title.text=A.text,A.tooltext&&(a.title.originalText=A.tooltext),a.title.margin=g+ea+T+(wa?m-l:m/2)):a.title.text=w;l=-(v+ga+Ia+H+2);i=i+da+Ia+2;T=F(I,G);a.labels.style&&(k=parseInt(a.labels.style.fontSize,10)*0.35);t?(Da>0&&ka(q,l,k),T>0&&(ka(r,i,k),ka(P,i,k))):(Da>0&&ka(q,i,k),T>0&&(ka(r,l,k),ka(P,l,k)));a.labels._textY=k;a.labels._righttX=i;a.labels._leftX=l;h?(d.chart.marginLeft+=
t?Ba:ra-h,d.chart.marginRight+=t?ra-h:Ba):(d.chart.marginLeft+=t?Ba:ra,d.chart.marginRight+=t?ra:Ba);return Ba+ra},Ja=h.titleSpaceManager=function(a,b,d,c){var f=b.chart,p=fa(f.caption),t=fa(f.subcaption),i=b=e(f.captionpadding,10),g=a[s].smartLabel,h=!1,k,j=0,z,A,l=0,m=0,r=0,H=0,P=a.title,q=a.subtitle,l=e(f.plotBorderWidth,1),l=e(f.canvasborderthickness,1);b<l&&(b=l);if(p!==w)z=P.style,r=e(parseInt(z.fontHeight,10),parseInt(z.lineHeight,10),12),e(parseInt(z.fontSize,10),10);if(t!==w)A=q.style,H=
e(parseInt(A.fontHeight,10),parseInt(A.lineHeight,10),12),e(parseInt(A.fontSize,10),10);if(r>0||H>0){j=r+H+b;j>c?(l=j-c,h=!0,l<b?b-=l:(l-=b,b=0,H>l?(m=H-l+10,H=0):(l-=H,H=0,r>l&&(m=r-l),r=0))):m=c-j;if(r>0)g.setStyle(z),r+=m,k=g.getSmartText(p,d,r),m=r-k.height,r=k.height,P.text=k.text,P.height=k.height,k.tooltext&&(P.originalText=k.tooltext);if(H>0)g.setStyle(A),H+=m,d=g.getSmartText(t,d,H),m=H-d.height,H=d.height,q.text=d.text,q.height=d.height,d.tooltext&&(P.originalText=k.tooltext);h&&m>0&&(b+=
n(i-b,m));j=r+H+b;a.chart.marginTop+=j}return j},Ba=h.stepYAxisNames=function(a,b,e,d,c,p){for(var t=0,i=d.plotLines,g=[],k,h=d.plotLines.length,b=b[s].smartLabel,j=parseFloat(f(e.basefontsize,10)),z;t<h;t+=1)e=i[t],e.isGrid&&e.label&&e.label.text&&(g.push(e),e.value===0&&(k=g.length-1));if(h=g.length)if(d.labels.style?b.setStyle(d.labels.style):g[0].label&&g[0].label.style&&b.setStyle(d.labels.style),t=b.getOriSize("W").height,p||(t+=j*0.4),a/=h-1,a<t){p=Math.max(1,Math.ceil(t/a));for(t=a=k;t<h;t+=
1){e=g[t];if(t===c){if((t-a)%p&&z)z.label.text="";a=c}if(e&&e.label)(t-a)%p?e.label.text=w:z=e}for(t=a=k;t>=0;t-=1){e=g[t];if(t===c){if((a-t)%p&&z)z.label.text="";a=c}if(e&&e.label)(a-t)%p?e.label.text=w:z=e}}},ea=h.placeHorizontalAxis=function(a,b,d,c,f,p,t){var i=d[s],g=c&&c.chart||{},h,j,z,A,l,m,n,H,r,P,q=0,qa=0,v=10,ga=1,da=0,ea=da=0,x=0,wa=!1,ba=!1,ra=!1,G=e(g.labelstep,0),Ia=e(g.xaxisminlabelwidth,0),Ba=b.labelDisplay,I=b.rotateLabels,la=b.horizontalLabelPadding,za=i.marginBottomExtraSpace;
r=d.chart.marginLeft;var T=d.chart.marginRight,C=i.smartLabel,O=i.plotBorderThickness,ka=b.catCount,K=b.slantLabels,D=f/(a.max-a.min),Qa=0,fa=0,ea={w:0,h:0},R=c&&c.chart||{},c=e(R.updateinterval,R.refreshinterval)*1E3,R=R.datastreamurl,U=Boolean(this.realtimeEnabled&&c&&R!==void 0);if(a.labels.style)m=a.labels.style,C.setStyle(m),H=C.getOriSize("W"),v=C.lineHeight,n=H.width+4,P=C.getOriSize("WWW").width+4;var V,M,J,S=[],c=[],Y=0,Z=0,aa,ma,ta,ia,R=b.horizontalAxisNamePadding;M=0;var X=b.staggerLines,
$=Qa,sa=!1,pa=!1;if(a.title&&a.title.text!=w)m=a.title.style,C.setStyle(m),da=C.getOriSize("W").height,a.title.rotation=0,A=C.getSmartText(a.title.text,f,p),qa=A.height;r!=parseInt(g.chartleftmargin,10)&&(h=!0);T!=parseInt(g.chartrightmargin,10)&&(J=!0);g.canvaspadding!==void 0&&g.canvaspadding!==""&&(pa=!0);M=f-t;switch(Ba){case "none":wa=ra=!0;I&&(q=K?300:270,H=v,v=n,n=H);break;case "rotate":q=K?300:270;H=v;v=n;n=H;wa=!0;break;case "stagger":ba=wa=!0;t=Math.floor((p-da)/v);t<X&&(X=t);break;default:I&&
(q=K?300:270,H=v,v=n,n=H)}i.isBar&&(wa=!0);g=0;t=a.plotLines;if(typeof d._FCconf.isXYPlot===Ca&&!i.isBar){for(aa=t.length;g<aa;g+=1)(j=t[g])&&(j.isGrid?S.push(j):j.isTrend&&c.push(j));I=a.plotBands;g=0;for(aa=I.length;g<aa;g+=1)(j=I[g])&&c.push(j);I=S.length-1;aa=S.length;ba&&(X>aa?X=aa:X<2&&(X=2));if(aa){a.scroll&&a.scroll.viewPortMin&&a.scroll.viewPortMax?(z=a.scroll.viewPortMin,V=a.scroll.viewPortMax,J=h=!1):(z=a.min,V=a.max);g=(S[I].value-S[0].value)*D;ma=g/(ka-1);ta=(S[0].value-z)*D;ia=(V-S[I].value)*
D;Ba==="auto"?ma<P&&(q=K?300:270,H=v,v=n,n=H,wa=!0):Ba==="stagger"&&(ma*=X);this.defaultSeriesType!=="line"&&(this.defaultSeriesType==="area"?i.drawFullAreaBorder&&(O>ta&&(z=a.min-=O/(2*D),ta+=(S[0].value-z)*D),O>ia&&(V=a.max+=O/(2*D),ia+=(V-S[I].value)*D)):(O>ta&&(z=a.min-=O/(2*D),ta+=(S[0].value-z)*D),O>ia&&(V=a.max+=O/(2*D),ia+=(V-S[I].value)*D)));n<Ia&&(n=Ia);ga=!ba&&!ra?Math.max(1,G,Math.ceil(n/ma)):Math.max(1,G);if(i.x)i.x.stepValue=ga;ma*=ga;r=(ta+r)*2;if((l=t[0].label)&&l.text)l.style&&C.setStyle(l.style),
P=q===270?Math.min(ma,C.getOriSize(l.text).height+4):Math.min(ma,C.getOriSize(l.text).width+4),P>r&&(ra||(Y=(P-r)/2),h||(pa&&(Y=0),ma-=Y/(ka-1),H=ma*(ka-1),D=ma,r=(g-H)/D,V=a.max+=r,z=a.min-=r,Y=0,g=H,ta=(S[0].value-z)*D,ia=(V-S[I].value)*D));r=(ia+T)*2;if((l=t[I].label)&&l.text)l.style&&C.setStyle(l.style),P=q===270?Math.min(ma,C.getOriSize(l.text).height+4):Math.min(ma,C.getOriSize(l.text).width+4),P>r&&(ra||(Z=(P-r)/2),J||(pa&&(Z=0),ma-=Z/(ka-1),H=ma*(ka-1),D=ma,r=(g-H)/D,Z=0,g=H,ta=(S[0].value-
z)*D,ia=(V-S[I].value)*D));g=Y+Z;if(g>0){M>g?(T=(T=Z*f/(Z+f))?T+4:0,d.chart.marginRight+=T,f-=T,T=(T=Y*f/(Y+f))?T+4:0,d.chart.marginLeft+=T,f-=T,D=f/(a.max-a.min)):Y<Z?M>=Z&&J?(T=(T=Z*f/(Z+f))?T+4:0,d.chart.marginRight+=T,f-=T,D=f/(a.max-a.min)):h&&(T=(T=Y*f/(Y+f))?T+4:0,d.chart.marginLeft+=T,f-=T,D=f/(a.max-a.min)):M>=Y&&h?(T=(T=Y*f/(Y+f))?T+4:0,d.chart.marginLeft+=T,f-=T,D=f/(a.max-a.min)):J&&(T=(T=Z*f/(Z+f))?T+4:0,d.chart.marginRight+=T,f-=T,D=f/(a.max-a.min));g=(S[I].value-S[0].value)*D;ma=g/
(ka-1);ba&&(ma*=X);ga=!ba&&!ra?q?Math.max(1,G,Math.ceil(v/ma)):Math.max(1,G,Math.ceil(n/ma)):Math.max(1,G);if(i.x)i.x.stepValue=ga;ma*=ga}for(z=0;z<aa;z+=1){j=S[z];if(z%ga&&j.label){if(j.stepped=!0,j.label.style=a.steppedLabels.style,!U)continue}else j.stepped=!1,j.label.style=a.labels.style;if(j&&j.label&&B(j.label.text)!==void 0){l=j.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);if(q&&ra)h=C.getOriSize(l.text),ea.w=F(ea.w,h.width+4),ea.h=F(ea.h,h.height);else if(!ra)h=q||ba?C.getOriSize(l.text):
C.getSmartText(l.text,ma-4,p,wa),ea.w=F(ea.w,h.width+4),ea.h=F(ea.h,h.height)}}}z=0;for(aa=c.length;z<aa;z+=1)if((j=c[z])&&j.label&&B(j.label.text)!==void 0){l=j.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);h=C.getOriSize(l.text);l.verticalAlign===u?Qa=F(Qa,h.height):fa=F(fa,h.height)}a.scroll&&a.scroll.enabled&&!q&&!ra&&(r=ea.w/2,d.chart.marginLeft<r&&(T=r-d.chart.marginLeft,M>T&&(f-=T,M-=T,d.chart.marginLeft+=T)),d.chart.marginRight<r&&(T=r-d.chart.marginRight,M>T&&(f-=T,M-=T,d.chart.marginRight+=
T)))}else{var G={},va,Ba=Z=0,O=pa=null,ka={},sa=!0,D=f/(a.max-a.min),Ia=function(b,e,c){var f,o,y,g,p,t;t=b.plotObj;p=b.labelTextWidth;if(!p){l=t.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);p=C.getOriSize(l.text).width+4;b.oriWidth=p;p>va&&(p=va);b.labelTextWidth=p;b.leftEdge=t.value*D-p/2;b.rightEdge=t.value*D+p/2;if(c)p=Math.min(p,2*(j.value-a.min)*D+d.chart.marginLeft),b.labelTextWidth=p}if(typeof e!==Ca){c=e.plotObj;l=c.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);e.oriWidth?
y=e.oriWidth:(y=C.getOriSize(l.text).width+4,e.oriWidth=y);y>va&&(y=va);e.labelTextWidth=y;e.leftEdge=c.value*D-y/2;e.rightEdge=c.value*D+y/2;f=t.value*D;o=f+p/2;g=c.value*D;y=g-y/2;if(y<o)if(f+n<g-n)o-=y,f=g-f,b.labelTextWidth=o>f?Math.min(p,f):Math.max(n,p-o/2),e.labelTextWidth=2*(f-b.labelTextWidth/2),b.leftEdge=t.value*D-b.labelTextWidth/2,b.rightEdge=t.value*D+b.labelTextWidth/2,e.leftEdge=c.value*D-e.labelTextWidth/2,e.rightEdge=c.value*D+e.labelTextWidth/2;else return e.labelTextWidth=0,c.label.text=
w,!1}else if(c)p=Math.min(p,2*(a.max-j.value)*D+d.chart.marginRight),b.labelTextWidth=p,b.leftEdge=t.value*D-p/2,b.rightEdge=t.value*D+p/2;b.nextCat=e;return!0};ba?X>aa?X=aa:X<2&&(X=2):X=1;for(aa=t.length;g<aa;g+=1)if((j=t[g])&&j.label&&typeof j.label.text!==Ca)j.isGrid?(Y={plotObj:j},j.isCat&&(I=g%X,G[I]||(G[I]=[]),pa?(O=Y,G[I].push(O)):(O=pa=Y,G[I].push(pa))),S.push(Y)):j.isTrend&&c.push({plotObj:j});I=a.plotBands;g=0;for(aa=I.length;g<aa;g+=1)(j=I[g])&&j.isTrend&&j.label&&typeof j.label.text!==
Ca&&c.push({plotObj:j});if(S.length)if(!ra&&!q)if(i.distributedColumns){g=0;for(aa=S.length;g<aa;g+=1)if(z=S[g],J=g%X,j=z.plotObj,j.label&&j.isCat){g-X>=0?(h=S[g-X],J=h.plotObj.value*D+h.plotObj._weight*D/2):(h=null,J=a.min*D-r);g+X<aa?(H=S[g+X],H=H.plotObj.value*D-H.plotObj._weight*D/2):(H=null,H=a.max*D+T);l=j.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);Y=j.value*D;M=Y-j._weight*D/2;Y+=j._weight*D/2;X>1?(h=M-J,J=Y+H,J=Y-M+Math.min(h,J)):J=Y-M;l=j.label;l.style&&l.style!==m&&C.setStyle(l.style);
J<n&&n<C.getOriSize(l.text).width?(j.label.text=w,z.labelTextWidth=0):(z.labelTextWidth=J,h=C.getSmartText(l.text,J-4,p,wa),J=h.width+4,z.labelTextWidth=J,ea.h=Math.max(ea.h,h.height))}}else{aa=S.length;I=S.length-1;(g=(S[I].plotObj.value-S[0].plotObj.value)*D)?(va=g*0.1,U=Math.max(g*0.2,g/aa)):U=va=f;for(z in G){g=0;for(P=G[z].length;g<P;){for(Y=g+1;!Ia(G[z][g],G[z][Y]);)Y+=1;g=Y}}pa&&(Ba=(pa.plotObj.value-a.min)*D+r-pa.labelTextWidth/2);j=S[0].plotObj;if(!pa||j!==pa.plotObj){l=j.label;if(l.style&&
l.style!==m)m=l.style,C.setStyle(m);P=C.getOriSize(l.text).width+4;Y=(j.value-a.min)*D+r;pa&&(g=Ba-Y,P=g<P&&g>n/2?g*2:0);S[0].labelTextWidth=P;P>0&&(H=Y-P/2);H<Ba&&(Ba=H)}if(O)P=O.labelTextWidth,Z=(a.max-O.plotObj.value)*D+T-P/2;j=S[I].plotObj;if(!O||j!==O.plotObj){l=j.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);P=C.getOriSize(l.text).width+4;Y=(a.max-j.value)*D+T;O&&(g=Y-Z,P=g<P&&g>n/2?g*2:0);S[I].labelTextWidth=P;P>0&&(H=Y-P/2);H<Z&&(Z=H)}Y=Ba<0?-Ba:0;Z=Z<0?-Z:0;g=Y+Z;if(g>0)for(z in M>
g?(T=(T=Z*f/(Z+f))?T+4:0,d.chart.marginRight+=T,f-=T,T=(T=Y*f/(Y+f))?T+4:0,d.chart.marginLeft+=T,f-=T,D=f/(a.max-a.min)):Y<Z?M>=Z&&J?(T=(T=Z*f/(Z+f))?T+4:0,d.chart.marginRight+=T,f-=T,D=f/(a.max-a.min)):h&&(T=(T=Y*f/(Y+f))?T+4:0,d.chart.marginLeft+=T,f-=T,D=f/(a.max-a.min)):M>=Y&&h?(T=(T=Y*f/(Y+f))?T+4:0,d.chart.marginLeft+=T,f-=T,D=f/(a.max-a.min)):J&&(T=(T=Z*f/(Z+f))?T+4:0,d.chart.marginRight+=T,f-=T,D=f/(a.max-a.min)),T=d.chart.marginRight,r=d.chart.marginLeft,g=(S[I].plotObj.value-S[0].plotObj.value)*
D,va=g*0.1,U=Math.max(g*0.2,g/aa),G){g=0;for(P=G[z].length;g<P;){for(Y=g+1;!Ia(G[z][g],G[z][Y],!0);)Y+=1;g=Y}z+=1}g=0;for(aa=S.length;g<aa;g+=1)if(z=S[g],J=g%X,j=z.plotObj,j.label)if(j.isCat)z.labelTextWidth&&(ka[J]=z);else{H=(h=ka[J])?h.nextCat:G[J]?G[J][0]:null;h=null;if(g>=X){J=g-X;for(h=S[J];!h.labelTextWidth;)if(J>=X)J-=X,h=S[J];else{h=null;break}}J=h?h.rightEdge:a.min*D-r;H=H?H.leftEdge:a.max*D+T;l=j.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);P=C.getOriSize(l.text).width+4;M=j.value*
D-P/2;if(i.isBar&&g==aa-1&&h){if(J>M)h.plotObj.label.text=w,h.labelTextWidth=0,J=h.leftEdge}else if(J>M||H<M+P){j.label.text=w;z.labelTextWidth=0;continue}J=Math.max(J,M);Y=j.value*D;J=2*Math.min(Y-J,H-Y);J.toFixed&&(J=J.toFixed(2));l=j.label;l.style&&l.style!==m&&C.setStyle(l.style);J<n&&n<C.getOriSize(l.text).width?(j.label.text=w,z.labelTextWidth=0):(z.labelTextWidth=J,h=C.getSmartText(l.text,J-4,p,wa),J=h.width+4,z.labelTextWidth=J,z.leftEdge=Y-J/2,z.rightEdge=Y+J/2,ea.h=Math.max(ea.h,h.height))}h=
T=J=r=null;g=0;for(aa=S.length;g<aa;g+=1)if(z=S[g],j=z.plotObj,J=g%X,j.isCat&&z.labelTextWidth){h=T=null;Y=j.value*D;if(g>=X){J=g-X;for(h=S[J];!h.labelTextWidth;)if(J>X)J-=X,h=S[J];else{h=null;break}}h=h?Y-h.rightEdge:Y-a.min*D+d.chart.marginLeft;if(g+X<aa){r=g+X;for(T=S[r];!T.labelTextWidth;)if(r+X<aa-1)r+=X,T=S[r];else{T=null;break}}J=T?T.leftEdge-Y:a.max*D+d.chart.marginRight-Y;J=Math.min(h,J)*2;J>U&&(J=U);if(J>z.oriWidth)J=z.oriWidth;z.labelTextWidth=J;l=j.label;l.style&&l.style!==m&&C.setStyle(l.style);
h=C.getSmartText(l.text,J-4,p,wa);z.labelTextWidth=h.width+4;ea.h=Math.max(ea.h,h.height);z.rightEdge=Y+z.labelTextWidth/2}}else if(q){g=0;for(aa=S.length;g<aa;g+=1)if((j=S[g].plotObj)&&j.label&&j.label.text){l=j.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);z=1;if(g+z<aa)for(T=S[z+g].plotObj;T&&(T.value-j.value)*D<n;)if(j.isCat){if(T.label){T.label.text=w;z+=1;if(z+g>=aa-1)break;T=t[z+g].plotObj}}else if(T.isCat){j.label.text=w;j=T;g+=z-1;l=j.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);
break}ea.w=Math.max(ea.w,C.getOriSize(l.text).width+4)}}z=0;for(aa=c.length;z<aa;z+=1)if((j=c[z].plotObj)&&j.label&&B(j.label.text)!==void 0){l=j.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);h=C.getOriSize(l.text);l.verticalAlign===u?Qa=F(Qa,h.height):fa=F(fa,h.height)}}if(ra){if(M=v,q)M=ea.w}else M=q?ea.w:ba?X*v:ea.h;M>0&&($+=la+M);qa>0&&($+=qa+R);ea=la-4;$=fa+$+2;H=0;$>p&&(g=$-p,R>g?(R-=g,g=0):(g-=R,R=0,ea>g?(ea-=g,differnece=0):(g-=ea,ea=0),la=ea+4),fa>g?(fa-=g,g=0):(fa>0&&(g-=fa,fa=0),
g>0&&(Qa>g?(Qa-=g,g=0):(Qa>0&&(g-=Qa,Qa=0),g>0&&((H=qa-da)>g?(qa-=g,g=0):(g-=H,qa=da,g>0&&((H=M-v)>g?(M-=g,g=0):(g-=H,M=v,g>0&&(g-=qa+R,qa=0,g>0&&(g-=M,M=0,g>0&&(la-=g)))))))))));la+=za;var T=i.is3d?-d.chart.xDepth:0,p=M+la,Aa,$=T;r=v*0.5;da=v+la;aa=S.length;ea=0;if(sa)if(q){ma=N;Aa=K?la+8:la+4;aa=S.length;for(z=0;z<aa;z+=1)if((j=S[z].plotObj)&&j.label&&B(j.label.text)!==void 0){l=j.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);g=1;h=C.getSmartText(l.text,M-4,n,wa);l.text=h.text;h.tooltext&&
(l.originalText=h.tooltext);$=T+r/2;l.y=Aa;l.x=$;l.rotation=q;l.textAlign=ma;ea+=1}}else{sa=M;ma=k;Aa=da;for(z=0;z<aa;z+=ga)if((j=S[z].plotObj)&&j.label&&B(j.label.text)!==void 0){l=j.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);if(!ra)h=C.getSmartText(l.text,S[z].labelTextWidth-4,sa,wa),l.text=h.text,h.tooltext&&(l.originalText=h.tooltext),ba&&(Aa=da+ea%X*v);l.y=Aa;l.x=$;l.rotation=q;l.textAlign=ma;ea+=1}}else{q?(sa=ma,g=M-4,ma=N,Aa=K?la+8:la+4):ba?(sa=v,g=ma-4,ma=k):(sa=M,g=ma-4,ma=k,Aa=
da);for(z=0;z<aa;z+=ga)if((j=S[z])&&j.label&&B(j.label.text)!==void 0){l=j.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);if(!ra)h=C.getSmartText(l.text,g,sa,wa),l.text=h.text,h.tooltext&&(l.originalText=h.tooltext),ba&&(Aa=da+ea%X*v),q&&($=T+r/2);l.y=Aa;l.x=$;l.rotation=q;l.textAlign=ma;ea+=1}b._labelY=da;b._labelX=T;b._yShipment=Aa;b._isStagger=ba;b._rotation=q;b._textAlign=ma;b._adjustedPx=r/2;b._staggerLines=X;b._labelHeight=v}aa=c.length;for(z=q=b=0;z<aa;z+=1)if((j=c[z].plotObj?c[z].plotObj:
c[z])&&j.label&&B(j.label.text)!==void 0){l=j.label;if(l.style&&l.style!==m)m=l.style,C.setStyle(m);l.verticalAlign===u?(h=C.getSmartText(l.text,f,Qa,!0),q=Math.max(q,h.height),l.text=h.text,h.tooltext&&(l.originalText=h.tooltext),l.y=p+C.getOriSize(l.text).height,l.x=$):(h=C.getSmartText(l.text,f,fa,!0),b=Math.max(b,h.height),l.text=h.text,h.tooltext&&(l.originalText=h.tooltext),l.y=-(fa-C.getOriSize("W").height+la+2))}if(qa>0)C.setStyle(a.title.style),A=C.getSmartText(a.title.text,f,qa),a.title.text=
A.text,A.tooltext&&(a.title.originalText=A.tooltext),a.title.margin=p+q+R;$=q;if(M>0)i.horizontalAxisHeight=la+M-za,$+=i.horizontalAxisHeight;qa>0&&($+=x=qa+R);d.chart.marginBottom+=$;b>0&&(d.chart.marginTop+=b,$+=b);if(a.opposite){a.title.margin-=M-(A&&A.height||0)+la;$-=x;d.chart.marginTop+=$;d.chart.marginBottom-=$;d.xAxis.opposite=1;aa=t.length;for(g=0;g<aa;g+=1)if((j=t[g])&&j.isGrid&&(l=j.label)&&l.text!==void 0)l.textAlign=ca,l.y-=Aa+la+4}return $},ra=h.configureLegendOptions=function(a,c,f,
g,o){var g=a.legend,p=a.chart,t=p.paletteIndex,h=p.is3D?qa.chart3D:qa.chart2D,i=p.useRoundEdges,j=e(c.legendiconscale,1),k=(parseInt(g.itemStyle.fontSize,10)||10)+1,z=a.chart.defaultSeriesType,l=3;if(j<=0||j>5)j=1;g.padding=4;k<=0&&(k=1);o-=8;k*=j;l*=j;k=Math.min(k,o);k<=0&&(l=k=0);g.symbolWidth=k;g.symbolPadding=l;g.textPadding=4;g.legendHeight=o=k+2*l;g.rowHeight=Math.max(parseInt(g.itemStyle.lineHeight,10)||12,o);f?(g.align=N,g.verticalAlign="middle",g.layout="vertical"):g.x=(p.marginLeft-p.spacingLeft-
p.marginRight+p.spacingRight)/2;f=b(c.legendbordercolor,r[h.legendBorderColor][t]);o=e(c.legendborderalpha,100);p=e(c.legendbgalpha,100);g.backgroundColor=d(b(c.legendbgcolor,r[h.legendBgColor][t]),p);g.borderColor=d(f,o);g.borderWidth=e(c.legendborderthickness,!i||c.legendbordercolor?1:0);g.shadow=Boolean(e(c.legendshadow,1));if(g.shadow)g.shadow={enabled:g.shadow,opacity:F(o,p)/100};g.reversed=Boolean(e(c.reverselegend,0));if(/^pie|pie3d$/.test(z))g.reversed=!g.reversed;g.style={padding:4};Boolean(e(c.interactivelegend,
1))?g.symbolStyle={_cursor:"hand",cursor:"pointer"}:(a.legend.interactiveLegend=!1,g.itemStyle.cursor="default",g.itemHoverStyle={cursor:"inherit"});g.borderRadius=e(c.legendborderradius,i?3:0);g.legendAllowDrag=Boolean(e(c.legendallowdrag,0));g.title.text=fa(x(c.legendcaption,w));g.legendScrollBgColor=v(b(c.legendscrollbgcolor,r.altHGridColor[a.chart.paletteIndex]));g.legendScrollBarColor=b(c.legendscrollbarcolor,f);g.legendScrollBtnColor=b(c.legendscrollbtncolor,f);g.title.style=ka({fontWeight:"bold"},
g.itemStyle)},pa=h.placeLegendBlockRight=function(a,b,c,d,f){ra(a,b.chart,!0,f,c);var g=0,p=a.series,t,h=a[s],i=h.smartLabel,j=a.legend,k,z=j.textPadding,l=j.title.padding,m=j.symbolWidth+2*j.symbolPadding,A=d*2,H=0,b=e(b.chart.legendpadding,7)+j.borderWidth/2+e(b.chart.canvasborderthickness,1),r=2*j.padding,n={width:r,height:r},P=!1,q=[];c-=r;f&&(p=p&&p[0]&&p[0].data);if(typeof p===Ca||typeof p.length===Ca)return 0;else{f=p.length;for(g=0;g<f;g+=1)if((t=p[g])&&t.showInLegend!==!1)t.__i=g,q.push(t);
q.sort(function(a,b){return a.legendIndex-b.legendIndex||a.__i-b.__i});f=q.length}k=c-m-2-z;k<0&&(k=0);i.setStyle(j.itemStyle);j.reversed&&q.reverse();for(g=0;g<f;g+=1)if(t=q[g],P=!0,t._legendX=0,t._legendY=n.height,k===0)n.height+=t._legendH=m,t.name=w;else{p=i.getSmartText(t.name,k,A);t.name=p.text;p.tooltext&&(t.originalText=p.tooltext);if(p.height<m)t._legendTestY=(m-p.height)/2;n.height+=t._legendH=Math.max(p.height,m);H=Math.max(p.width,H)}if(P){j.itemWidth=H+m+2+z;j.width=j.itemWidth+r;if(j.title.text!==
w){i.setStyle(j.title.style);p=i.getSmartText(j.title.text,c,A);j.title.text=p.text;p.tooltext&&(j.title.originalText=p.tooltext);g=p.width+r;if(j.width<g)j.initialItemX=(g-j.width)/2,j.width=g;j.initialItemY=p.height+l;n.height+=j.initialItemY}j.height=j.totalHeight=n.height;if(j.height>d)j.height=d,j.scroll.enabled=!0,j.scroll.flatScrollBars=h.flatScrollBars,j.scroll.scrollBar3DLighting=h.scrollBar3DLighting,j.width+=(j.scroll.scrollBarWidth=10)+(j.scroll.scrollBarPadding=2);b=Math.min(j.width+
b,c);a.chart.marginRight+=b;return b}else return j.enabled=!1,0},m=h.placeLegendBlockBottom=function(a,b,c,d,f){ra(a,b.chart,!1,f,c);var g=0,p=a.series,t,h=a[s],j=h.smartLabel,i=a.legend,k,z=i.textPadding;t=i.title.padding;var l,m=i.symbolPadding;k=i.legendHeight;var A=b.chart;l=0;var H=d*2,r=i.rowHeight,n=[],P=e(A.minimisewrappinginlegend,0),A=e(parseInt(A.legendnumcolumns,10),0),q=0,u=0,v=0,qa=g=0,ea=2*i.padding,b=e(b.chart.legendpadding,7)+i.borderWidth/2+1,ga={width:ea,height:ea},da=!1,T,wa=[];
A<0&&(A=0);c-=ea;j.setStyle(i.itemStyle);g=j.getOriSize(Wa).height;b=Math.min(b,d-g-8);d-=b;f&&(p=p&&p[0]&&p[0].data);if(typeof p===Ca||typeof p.length===Ca)return 0;else{f=p.length;for(g=0;g<f;g+=1)if((T=p[g])&&T.showInLegend!==!1)T.__i=g,wa.push(T);wa.sort(function(a,b){return a.legendIndex-b.legendIndex||a.__i-b.__i});f=wa.length}j.setStyle(i.itemStyle);for(g=0;g<f;g+=1)da=!0,p=j.getOriSize(wa[g].name),q=Math.max(q,p.width),u+=p.width,v+=1;g=u/v;if(da){g+=k+2+z;q+=k+2+z;A>0&&v<A&&(A=v);A>0&&(qa=
c/A)>g?qa>q&&(qa=q):c>q&&(P||g*1.5>q)?(A=Math.floor(c/q),v<A&&(A=v),qa=q):c>=2*g?(A=Math.floor(c/g),v<A&&(A=v),qa=Math.floor(c/A),qa>q&&(qa=q)):(A=1,qa=c);i.itemWidth=qa;k=qa-k-2-z;k<0&&(m=k=z=0);i.symbolPadding=m;i.textPadding=z;i.width=qa*A+ea;if(i.title.text!==w){j.setStyle(i.title.style);p=j.getSmartText(i.title.text,c,H);i.title.text=p.text;p.tooltext&&(i.title.originalText=p.tooltext);l=p.width+ea;if(i.width<l)i.initialItemX=(l-i.width)/2,i.width=l;i.initialItemY=l=p.height+t}j.setStyle(i.itemStyle);
z=0;i.reversed&&wa.reverse();for(g=0;g<f;g+=1){t=wa[g];if(k===0)n[z]=!0,t.name=w,c=1;else{p=j.getSmartText(t.name,k,H);t.name=p.text;for(p.tooltext&&(t.originalText=p.tooltext);n[z]===!0;)z+=1;m=p.height/r;P=z;for(c=0;c<m;c+=1,P+=A)n[P]=!0;if(p.height<r)t._legendTestY=(r-p.height)/2}m=parseInt(z/A,10);p=z%A;t._legendX=p*qa;t._legendY=m*r+ea;t._legendH=c*r;z+=1}ga.height+=Math.ceil(n.length/A)*r+l;i.height=i.totalHeight=ga.height;i.rowHeight=r;i.legendNumColumns=A;if(i.height>d)i.height=d,i.scroll.enabled=
!0,i.scroll.flatScrollBars=h.flatScrollBars,i.scroll.scrollBar3DLighting=h.scrollBar3DLighting,i.width+=(i.scroll.scrollBarWidth=10)+(i.scroll.scrollBarPadding=2);b+=i.height;a.chart.marginBottom+=b;return b}else return i.enabled=!1,0},T=function(a,b){return a.value-b.value},ba=h.adjustVerticalAxisTitle=function(a,b,e){if(b&&b.text){var c=b.text,d=a[s].smartLabel,f=2*Math.min(a.chart.marginTop,a.chart.marginBottom)+e,g=e+a.chart.marginTop+a.chart.marginBottom;b.style&&d.setStyle(b.style);c=d.getOriSize(c);
if(b.centerYAxisName===void 0)b.centerYAxisName=!0;if(b.rotation=="0"){if(c.height>f)b.y=(g/2-(e/2+a.chart.marginTop))/2,b.centerYAxisName=!1}else if(c.width>f)b.y=g/2-(e/2+a.chart.marginTop),b.centerYAxisName=!1}},la=h.adjustVerticalCanvasMargin=function(a,b,c,d){var f=b.chart,g=b=0,p=0,t=e(f.canvastopmargin,0),f=e(f.canvasbottommargin,0),i=t/(t+f),h=a.chart.marginTop,j=a.chart.marginBottom;f>j&&(b+=f-j);t>h&&(b+=t-h);b>c?t>h&&f>j?(g=c*i,p=c*(1-i)):t>h?g=c:p=c:b>0&&(f>j&&(p=f-j),t>h&&(g=t-h));g&&
(a.chart.marginTop+=g);p&&(a.chart.marginBottom+=p,d&&d.title&&(d.title.margin+=p));return g+p},Qa=h.adjustHorizontalCanvasMargin=function(a,b,c,d,f){var g=b.chart,b=e(g.canvasleftmargin,0),g=e(g.canvasrightmargin,0),p=b/(b+g),t=0,h=a.chart.marginLeft,i=a.chart.marginRight,j=0,k=0;b>h&&(t+=b-h);g>i&&(t+=g-i);t>c?b>h&&g>i?(j=c*p,k=c*(1-p)):g>i?k=c:j=c:t>0&&(b>h&&(j=b-h),g>i&&(k=g-i));j&&(a.chart.marginLeft+=j,d&&d.title&&(d.title.margin+=j));k&&(a.chart.marginRight+=k,f&&f.title&&(f.title.margin+=
k));return k+j};J("base",{useScaleRecursively:!0,tooltipConstraint:"chart",rendererId:"root",draw:function(a,b){var e=this,c=e.renderer,d=e.chartInstance.jsVars,f="reinit",g=new Date;e.drawingLatency=e.drawingLatency||0;if(!c)d._lastpaper&&(d._lastpaper=d._lastpaper.dispose()),f="init",c=e.renderer=new J("renderer."+e.rendererId);return c[f](e,a,function(){d._lastpaper=c;e.drawingLatency=new Date-g;b&&b.apply(this,arguments)})},init:function(a,b,c){var d=this.chartInstance||c,f=d.jsVars,c=f._reflowData||
(f._reflowData={}),g=f._reflowClean,p,t;this.dataObj=b=ka({},b);t=b.chart=b.chart||b.graph||b.map||{};delete b.graph;delete b.map;if(c&&!this.stateless)p=c.hcJSON,delete c.hcJSON,ka(this,c,!0),this.preReflowAdjustments&&this.preReflowAdjustments.call(this),c.hcJSON=p;this.containerElement=a;this.config={};this.smartLabel=new eb(d.id,document.getElementsByTagName("body")[0]||a,e(t.useellipseswhenoverflow,t.useellipsewhenoverflow,1));this.linkClickFN=Sa(b,d);this.numberFormatter=new fb(b.chart,this);
if(!this.standaloneInit)return new h.createDialog(a,f.msgStore.ChartNotSupported);a=this.chart(a.offsetWidth||parseFloat(a.style.width),a.offsetHeight||parseFloat(a.style.height),d);c&&!this.stateless&&(c.hcJSON&&ka(a,c.hcJSON,!0),this.postReflowAdjustments&&this.postReflowAdjustments.call(this),g&&this.cleanedData&&(this.cleanedData(this,g),this.cleanedData(c,g)));return a},chart:function(a,g){var y;var p=this.name,t=this.dataObj,o=t.chart,h,j,k,z,l,m,A=this.defaultSeriesType,H,n,P,ea,ga,da,T,L;
h=wa(t,a,g,this);L=h.chart;T=h.xAxis;H=h[s];this.postHCJSONCreation&&this.postHCJSONCreation.call(this,h);h.labels.smartLabel=m=H.smartLabel=this.smartLabel;H.width=a;H.height=g;n=h.plotOptions;H.isDual=this.isDual;H.numberFormatter=this.numberFormatter;H.axisGridManager=new Fa(A,o);L.is3D=j=H.is3d=/3d$/.test(A);L.isBar=z=H.isBar=this.isBar;k=/^pie/.test(A);da=o.useroundedges==1;ga=j?qa.chart3D:qa.chart2D;L.events.click=h.plotOptions.series.point.events.click=this.linkClickFN;L.defaultSeriesType=
A;var x=o.palette>0&&o.palette<6?o.palette:e(this.paletteIndex,1);x-=1;L.paletteIndex=x;L.usePerPointLabelColor=o.colorlabelsfromplot==ta;L.useRoundEdges=da&&!j&&!this.distributedColumns&&this.defaultSeriesType!=="pie";if(b(o.clickurl)!==void 0)L.link=o.clickurl,L.style.cursor="pointer",h.plotOptions.series.point.events.click=function(){L.events.click.call({link:o.clickurl})};P=b(o.basefont,"Verdana");var ba=f(o.basefontsize,10),I=b(o.basefontcolor,r[ga.baseFontColor][x]),ra=b(o.outcnvbasefont,P);
l=f(o.outcnvbasefontsize,ba);var Ba=l+Ka,Ia=b(o.outcnvbasefontcolor,I).replace(/^#?([a-f0-9]+)/ig,"#$1"),la,D,O=ba;ba+=Ka;I=I.replace(/^#?([a-f0-9]+)/ig,"#$1");H.trendStyle=H.outCanvasStyle={fontFamily:ra,color:Ia,fontSize:Ba};la=C(H.trendStyle);H.inCanvasStyle={fontFamily:P,fontSize:ba,color:I};D=C(H.inCanvasStyle);H.divlineStyle={fontFamily:P,fontSize:ba,color:I,lineHeight:D};T.labels.style={fontFamily:ra,fontSize:Ba,lineHeight:la,color:Ia};T.steppedLabels.style={fontFamily:ra,fontSize:Ba,lineHeight:la,
color:Ia,visibility:"hidden"};h.yAxis[0].labels.style={fontFamily:ra,fontSize:Ba,lineHeight:la,color:Ia};h.yAxis[1].labels.style={fontFamily:ra,fontSize:Ba,lineHeight:la,color:Ia};h.legend.itemStyle={fontFamily:ra,fontSize:Ba,lineHeight:la,color:Ia};h.legend.itemHiddenStyle={fontFamily:ra,fontSize:Ba,lineHeight:la};h.plotOptions.series.dataLabels.style={fontFamily:P,fontSize:ba,lineHeight:D,color:I};h.plotOptions.series.dataLabels.color=h.plotOptions.series.dataLabels.style.color;h.tooltip.style=
{fontFamily:P,fontSize:ba,lineHeight:D,color:I};h.title.style={fontFamily:ra,color:Ia,fontSize:l+3+Ka,fontWeight:e(o.captionfontbold)===0?"normal":"bold"};C(h.title.style);h.subtitle.style={fontFamily:ra,color:Ia,fontSize:l+e(this.subTitleFontSizeExtender,1)+Ka,fontWeight:B(this.subTitleFontWeight,"bold")};C(h.subtitle.style);T.title.style={fontFamily:ra,color:Ia,fontSize:Ba,fontWeight:e(o.subcaptionfontbold)===0?"normal":"bold"};ba=C(T.title.style);h.yAxis[0].title.style={fontFamily:ra,color:Ia,
fontSize:Ba,lineHeight:ba,fontWeight:"bold"};h.yAxis[1].title.style={fontFamily:ra,color:Ia,fontSize:Ba,lineHeight:ba,fontWeight:"bold"};L.overlapColumns=e(o[z&&"overlapbars"||"overlapcolumns"],j?0:1);h.orphanStyles={defaultStyle:{style:ka({},H.inCanvasStyle)},connectorlabels:{style:ka({},h.plotOptions.series.dataLabels)},vyaxisname:{style:ka({},h.yAxis[0].title.style)}};h.plotOptions.series.dataLabels.tlLabelStyle={fontFamily:B(o.tlfont,P),color:v(B(o.tlfontcolor,I)),fontSize:f(o.tlfontsize,O)+"px"};
C(h.plotOptions.series.dataLabels.tlLabelStyle);h.plotOptions.series.dataLabels.trLabelStyle={fontFamily:B(o.trfont,P),color:v(B(o.trfontcolor,I)),fontSize:f(o.trfontsize,O)+"px"};C(h.plotOptions.series.dataLabels.trLabelStyle);h.plotOptions.series.dataLabels.blLabelStyle={fontFamily:B(o.blfont,P),color:v(B(o.blfontcolor,I)),fontSize:f(o.blfontsize,O)+"px"};C(h.plotOptions.series.dataLabels.blLabelStyle);h.plotOptions.series.dataLabels.brLabelStyle={fontFamily:B(o.brfont,P),color:v(B(o.brfontcolor,
I)),fontSize:f(o.brfontsize,O)+"px"};C(h.plotOptions.series.dataLabels.brLabelStyle);this.parseStyles(h);delete h.xAxis.labels.style.backgroundColor;delete h.xAxis.labels.style.borderColor;delete h.yAxis[0].labels.style.backgroundColor;delete h.yAxis[0].labels.style.borderColor;delete h.yAxis[1].labels.style.backgroundColor;delete h.yAxis[1].labels.style.borderColor;H.showTooltip=e(o.showtooltip,this.showtooltip,1);H.tooltipSepChar=b(o.tooltipsepchar,this.tooltipsepchar,bb);H.showValues=e(o.showvalues,
this.showValues,1);H.seriesNameInToolTip=e(o.seriesnameintooltip,1);H.showVLines=e(o.showvlines,1);H.showVLinesOnTop=e(o.showvlinesontop,0);H.showVLineLabels=e(o.showvlinelabels,this.showVLineLabels,1);H.showVLineLabelBorder=e(o.showvlinelabelborder,1);H.rotateVLineLabels=e(o.rotatevlinelabels,0);H.vLineColor=b(o.vlinecolor,"333333");H.vLineThickness=b(o.vlinethickness,1);H.vLineAlpha=e(o.vlinealpha,80);H.vLineLabelBgColor=b(o.vlinelabelbgcolor,"ffffff");H.vLineLabelBgAlpha=e(o.vlinelabelbgalpha,
j?50:100);H.trendlineColor=b(o.trendlinecolor,"333333");H.trendlineThickness=b(o.trendlinethickness,1);H.trendlineAlpha=e(o.trendlinealpha);H.showTrendlinesOnTop=b(o.showtrendlinesontop,0);H.trendlineValuesOnOpp=b(o.trendlinevaluesonopp,o.trendlinevaluesonright,0);H.trendlinesAreDashed=e(o.trendlinesaredashed,0);H.trendlinesDashLen=e(o.trendlinedashlen,5);H.trendlinesDashGap=e(o.trendlinedashgap,2);H.showTrendlines=e(o.showtrendlines,1);H.showTrendlineLabels=e(o.showtrendlinelabels,this.showTrendlineLabels,
1);H.flatScrollBars=e(o.flatscrollbars,0);H.scrollBar3DLighting=e(o.scrollbar3dlighting,1);h.plotOptions.series.connectNullData=e(o.connectnulldata,0);L.backgroundColor={FCcolor:{color:b(o.bgcolor,r[ga.bgColor][x]),alpha:b(o.bgalpha,r[ga.bgAlpha][x]),angle:b(o.bgangle,r[ga.bgAngle][x]),ratio:b(o.bgratio,r[ga.bgRatio][x])}};L.borderRadius=e(o.borderradius,0);L.rotateValues=e(o.rotatevalues,0);L.placeValuesInside=e(o.placevaluesinside,0);L.valuePosition=b(o.valueposition,"auto");L.valuePadding=e(o.valuepadding,
2);L.borderColor=d(b(o.bordercolor,j?"#666666":r.borderColor[x]),b(o.borderalpha,j?"100":r.borderAlpha[x]));P=e(o.showborder,j?0:1);L.borderWidth=P?e(o.borderthickness,1):0;L.plotBorderColor=d(b(o.canvasbordercolor,r.canvasBorderColor[x]),b(o.canvasborderalpha,r.canvasBorderAlpha[x]));if(o.showcanvasborder!=="0"&&(ea=Boolean(b(o.canvasborderthickness,da?0:1)),o.showaxislines==="1"||o.showxaxisline==="1"||o.showyaxisline==="1"))o.showcanvasborder!=="1"&&(ea=0);L.plotBorderWidth=j||!ea?0:e(o.canvasborderthickness,
this.canvasborderthickness,L.useRoundEdges?1:2);L.bgSWF=b(o.bgimage,o.bgswf);L.bgSWFAlpha=e(o.bgimagealpha,o.bgswfalpha,100);da=b(o.bgimagedisplaymode,"none").toLowerCase();P=B(o.bgimagevalign,w).toLowerCase();I=B(o.bgimagehalign,w).toLowerCase();da=="tile"||da=="fill"||da=="fit"?(P!=q&&P!="middle"&&P!=u&&(P="middle"),I!=ca&&I!="middle"&&I!=N&&(I="middle")):(P!=q&&P!="middle"&&P!=u&&(P=q),I!=ca&&I!="middle"&&I!=N&&(I=ca));L.bgImageDisplayMode=da;L.bgImageVAlign=P;L.bgImageHAlign=I;L.bgImageScale=
e(o.bgimagescale,100);L.logoURL=B(o.logourl);L.logoPosition=b(o.logoposition,"tl").toLowerCase();L.logoAlpha=e(o.logoalpha,100);L.logoLink=B(o.logolink);L.logoScale=e(o.logoscale,100);L.logoLeftMargin=e(o.logoleftmargin,0);L.logoTopMargin=e(o.logotopmargin,0);da=L.toolbar={button:{}};P=da.button;P.scale=e(o.toolbarbuttonscale,1.15);P.width=e(o.toolbarbuttonwidth,15);P.height=e(o.toolbarbuttonheight,15);P.radius=e(o.toolbarbuttonradius,2);P.spacing=e(o.toolbarbuttonspacing,5);P.fill=d(b(o.toolbarbuttoncolor,
"ffffff"));P.labelFill=d(b(o.toolbarlabelcolor,"cccccc"));P.symbolFill=d(b(o.toolbarsymbolcolor,"ffffff"));P.hoverFill=d(b(o.toolbarbuttonhovercolor,"ffffff"));P.stroke=d(b(o.toolbarbuttonbordercolor,"bbbbbb"));P.symbolStroke=d(b(o.toolbarsymbolbordercolor,"9a9a9a"));P.strokeWidth=e(o.toolbarbuttonborderthickness,1);P.symbolStrokeWidth=e(o.toolbarsymbolborderthickness,1);I=P.symbolPadding=e(o.toolbarsymbolpadding,5);P.symbolHPadding=e(o.toolbarsymbolhpadding,I);P.symbolVPadding=e(o.toolbarsymbolvpadding,
I);I=da.position=b(o.toolbarposition,"tr").toLowerCase();switch(I){case "tr":case "tl":case "br":case "bl":break;default:I="tr"}P=da.hAlign=(w+o.toolbarhalign).toLowerCase()==="left"?"l":I.charAt(1);y=da.vAlign=(w+o.toolbarvalign).toLowerCase()==="bottom"?"b":I.charAt(0),I=y;da.hDirection=e(o.toolbarhdirection,P==="r"?-1:1);da.vDirection=e(o.toolbarvdirection,I==="b"?-1:1);da.vMargin=e(o.toolbarvmargin,6);da.hMargin=e(o.toolbarhmargin,10);da.x=e(o.toolbarx,P==="l"?0:a);da.y=e(o.toolbary,I==="t"?0:
g);Ia=b(o.divlinecolor,r[ga.divLineColor][x]);Ba=b(o.divlinealpha,j?r.divLineAlpha3D[x]:r.divLineAlpha[x]);da=e(o.divlinethickness,1);P=Boolean(e(o.divlineisdashed,this.divLineIsDashed,0));I=e(o.divlinedashlen,4);ra=e(o.divlinedashgap,2);h.yAxis[0].gridLineColor=d(Ia,Ba);h.yAxis[0].gridLineWidth=da;h.yAxis[0].gridLineDashStyle=P?G(I,ra,da):void 0;h.yAxis[0].alternateGridColor=z?d(b(o.alternatevgridcolor,r.altVGridColor[x]),e(o.showalternatevgridcolor,1)===1?b(o.alternatevgridalpha,r.altVGridAlpha[x]):
ma):d(b(o.alternatehgridcolor,r.altHGridColor[x]),o.showalternatehgridcolor==0?0:b(o.alternatehgridalpha,r.altHGridAlpha[x]));O=e(o.vdivlinethickness,1);ba=Boolean(e(o.vdivlineisdashed,0));l=e(o.vdivlinedashlen,4);la=e(o.vdivlinedashgap,2);T.gridLineColor=d(b(o.vdivlinecolor,r[ga.divLineColor][x]),b(o.vdivlinealpha,r.divLineAlpha[x]));T.gridLineWidth=O;T.gridLineDashStyle=ba?G(l,la,O):void 0;T.alternateGridColor=d(b(o.alternatevgridcolor,r.altVGridColor[x]),o.showalternatehgridcolor==="1"?b(o.alternatevgridalpha,
r.altVGridAlpha[x]):0);O=b(o.canvasbgcolor,r[ga.canvasBgColor][x]);ba=b(o.canvasbgalpha,r.canvasBgAlpha[x]);b(o.showcanvasbg,ta)==ma&&(ba="0");h.plotOptions.series.shadow=e(o.showshadow,o.showcolumnshadow,this.defaultPlotShadow,r.showShadow[x]);if(this.inversed)h.yAxis[0].reversed=!0,h.yAxis[1].reversed=!0;if(this.isStacked)this.distributedColumns?(H.showStackTotal=Boolean(e(o.showsum,1)),l=e(o.usepercentdistribution,1),la=e(o.showpercentvalues,0),D=e(o.showpercentintooltip,l,0),H.showXAxisPercentValues=
e(o.showxaxispercentvalues,1)):(H.showStackTotal=Boolean(e(this.showSum,o.showsum,0)),l=e(this.stack100percent,o.stack100percent,0),la=e(o.showpercentvalues,l,0),D=e(o.showpercentintooltip,la)),H.showPercentValues=la,H.showPercentInToolTip=D,l?(H.isValueAbs=!0,n[A].stacking="percent",H[0].stacking100Percent=!0):n[A].stacking="normal";if(this.isDual){if(o.primaryaxisonleft==="0")h.yAxis[0].opposite=!0,h.yAxis[1].opposite=!1;h.yAxis[0].showAlways=!0;h.yAxis[1].showAlways=!0}if(L.useRoundEdges){h.plotOptions.series.shadow=
e(o.showshadow,o.showcolumnshadow,1);h.plotOptions.series.borderRadius=1;h.tooltip.style.borderRadius="2px";L.plotBorderRadius=3;if(!ea)L.plotBorderWidth=0;L.plotShadow=h.plotOptions.series.shadow?{enabled:!0,opacity:ba/100}:0}if(e(o.use3dlighting,1)===1)h.legend.lighting3d=!0;h.plotOptions.series.userMaxColWidth=z?o.maxbarheight:e(o.maxcolwidth,this.maxColWidth);h.plotOptions.series.maxColWidth=Math.abs(e(h.plotOptions.series.userMaxColWidth,50))||1;h.title.text=fa(o.caption);h.subtitle.text=fa(o.subcaption);
if(e(o.showtooltip,this.showtooltip)==0)h.tooltip.enabled=!1;A=h.tooltip.style;A.backgroundColor=d(b(A.backgroundColor,o.tooltipbgcolor,r.toolTipBgColor[x]),b(o.tooltipbgalpha,100));A.borderColor=d(b(A.borderColor,o.tooltipbordercolor,r.toolTipBorderColor[x]),b(o.tooltipborderalpha,100));h.tooltip.shadow=e(o.showtooltipshadow,o.showshadow,1)?{enabled:!0,opacity:F(e(o.tooltipbgalpha,100),e(o.tooltipborderalpha,100))/100}:!1;h.tooltip.constrain=e(o.constraintooltip,1);A.borderWidth=e(o.tooltipborderthickness,
1)+"px";if(o.tooltipborderradius)A.borderRadius=e(o.tooltipborderradius,1)+"px";A.padding=e(o.tooltippadding,this.tooltippadding,3)+"px";if(o.tooltipcolor)A.color=v(o.tooltipcolor);H.userPlotSpacePercent=h.plotOptions.series.userPlotSpacePercent=o.plotspacepercent;A=e(o.plotspacepercent,20)%100;H.plotSpacePercent=h.plotOptions.series.groupPadding=A/200;j&&!k?(L.series2D3Dshift=p==="mscombi3d"?!0:Boolean(e(o.use3dlineshift,0)),L.canvasBaseColor3D=b(o.canvasbasecolor,r.canvasBaseColor3D[x]),L.canvasBaseDepth=
e(o.canvasbasedepth,10),L.canvasBgDepth=e(o.canvasbgdepth,3),L.showCanvasBg=Boolean(e(o.showcanvasbg,1)),L.showCanvasBase=Boolean(e(o.showcanvasbase,1)),z?(L.xDepth=5,L.yDepth=5,L.showCanvasBg&&(H.marginTopExtraSpace+=L.canvasBgDepth),H.marginLeftExtraSpace+=L.yDepth+(L.showCanvasBase?L.canvasBaseDepth:0),H.marginBottomExtraSpace+=5):(L.xDepth=10,L.yDepth=10,L.showCanvasBg&&(H.marginRightExtraSpace+=L.canvasBgDepth),H.marginBottomExtraSpace+=L.yDepth+(L.showCanvasBase?L.canvasBaseDepth:0)),O=O.split(X)[0],
ba=ba.split(X)[0],L.use3DLighting=Boolean(e(o.use3dlighting,1)),L.plotBackgroundColor=L.use3DLighting?{FCcolor:{color:i(O,85)+X+c(O,55),alpha:ba+X+ba,ratio:Ma,angle:Ta(a-(L.marginLeft+L.marginRight),g-(L.marginTop+L.marginBottom),1)}}:d(O,ba),L.canvasBgColor=d(i(O,80),ba),k=b(o.zeroplanecolor,o.divlinecolor,r[ga.divLineColor][x]),z=b(o.zeroplanealpha,o.divlinealpha,r.divLineAlpha[x]),L.zeroPlaneColor=d(k,z),L.zeroPlaneBorderColor=d(b(o.zeroplanebordercolor,k),e(o.zeroplaneshowborder,1)?z:0)):(L.is3D=
!1,L.plotBackgroundColor={FCcolor:{color:O,alpha:ba,angle:b(o.canvasbgangle,r.canvasBgAngle[x]),ratio:b(o.canvasbgratio,r.canvasBgRatio[x])}});this.parseExportOptions(h);this.preSeriesAddition&&this.preSeriesAddition(h,t,a,g);this.series&&this.series(t,h,p,a,g);this.postSeriesAddition(h,t,a,g);this.spaceManager(h,t,a,g);this.postSpaceManager&&this.postSpaceManager(h,t,a,g);p=e(o.drawquadrant,0);if(H.isXYPlot&&p&&(l=T.min,la=T.max,n=h.yAxis[0].min,ea=h.yAxis[0].max,D=e(o.quadrantxval,(l+la)/2),O=e(o.quadrantyval,
(n+ea)/2),O>=n&&O<=ea&&D>=l&&D<=la)){var A=d(b(o.quadrantlinecolor,L.plotBorderColor),b(o.quadrantlinealpha,Aa)),ba=e(o.quadrantlinethickness,L.plotBorderWidth),za=e(o.quadrantlineisdashed,0),J=e(o.quadrantlinedashLen,4),K=e(o.quadrantlinedashgap,2);z=B(o.quadrantlabeltl,w);p=B(o.quadrantlabeltr,w);t=B(o.quadrantlabelbl,w);k=B(o.quadrantlabelbr,w);ga=e(o.quadrantlabelpadding,3);za=za?G(J,K,ba):void 0;T.plotLines.push({color:A,value:D,width:ba,dashStyle:za,zIndex:3});h.yAxis[0].plotLines.push({color:A,
value:O,width:ba,dashStyle:za,zIndex:3});ba=a-L.marginRight-L.marginLeft;za=g-L.marginTop-L.marginBottom;A=H.inCanvasStyle;parseInt(A.fontSize,10);l=ba/(la-l)*(D-l);la=ba-l;ea=za/(ea-n)*(O-n);n=za-ea;l-=ga;la-=ga;n-=ga;ea-=ga;O=ga+Ka;D=za-ga+Ka;za=ga+Ka;ga=ba-ga+Ka;m.setStyle(A);n>0&&(z!==w&&l>0&&(z=m.getSmartText(z,l,n),h.labels.items.push({html:z.text,zIndex:3,vAlign:q,style:{left:za,top:O,fontSize:A.fontSize,lineHeight:A.lineHeight,fontFamily:A.fontFamily,color:A.color}})),p!==w&&la>0&&(z=m.getSmartText(p,
la,n),h.labels.items.push({html:z.text,textAlign:N,vAlign:q,zIndex:3,style:{left:ga,top:O,fontSize:A.fontSize,lineHeight:A.lineHeight,fontFamily:A.fontFamily,color:A.color}})));ea>0&&(t!==w&&l>0&&(z=m.getSmartText(t,l,ea),h.labels.items.push({html:z.text,vAlign:u,zIndex:3,style:{left:za,top:D,fontSize:A.fontSize,lineHeight:A.lineHeight,fontFamily:A.fontFamily,color:A.color}})),k!==w&&la>0&&(z=m.getSmartText(k,la,ea),h.labels.items.push({html:z.text,textAlign:N,vAlign:u,zIndex:3,style:{left:ga,top:D,
fontSize:A.fontSize,lineHeight:A.lineHeight,fontFamily:A.fontFamily,color:A.color}})))}if(this.hasVDivLine&&(p=e(o.numvdivlines,0)+1,p>1)){H=H.x.catCount-1;m=T.max;p=H/p;t=!0;k=T.min;var M;T.scroll&&!isNaN(T.scroll.viewPortMax)&&(m=T.scroll.viewPortMax);Ia=b(o.vdivlinecolor,Ia);Ba=e(o.vdivlinealpha,Ba);O=e(o.vdivlinethickness,da);ba=e(o.vdivlineisdashed,P);l=e(o.vdivlinedashlen,I);la=e(o.vdivlinedashgap,ra);(da=e(o.showalternatevgridcolor,0))&&(M=d(b(o.alternatevgridcolor,r.altVGridColor[x]),b(o.alternatevgridalpha,
r.altVGridAlpha[x])));for(x=p;x<H;x+=p,t=!t)t&&da&&T.plotBands.push({isNumVDIV:!0,color:M,from:k,to:x,zIndex:1}),T.plotLines.push({isNumVDIV:!0,width:O,color:d(Ia,Ba),dashStyle:ba?G(l,la,O):void 0,value:x,zIndex:1}),k=x;t&&da&&T.plotBands.push({isNumVDIV:!0,color:M,from:k,to:m,zIndex:1})}if(j&&L.xDepth>L.marginLeft)L.marginLeft=L.xDepth;window.console&&window.console.log&&window.FC_DEV_ENVIRONMENT&&console.log(h);return h},parseExportOptions:function(a){var c,d=this.dataObj.chart,f=this.chartInstance.jsVars.transparent?
"":this.chartInstance.options.containerBackgroundColor||"#ffffff",g=navigator.userAgent.match(/(iPad|iPhone|iPod)/g);a.exporting.enabled=e(d.exportenabled,0);a.exporting.bgcolor=f;a.exporting.exporttargetwindow=b(d.exporttargetwindow,g?"_blank":"_self");a.exporting.exportaction=d.exportaction&&d.exportaction.toString().toLowerCase()==="save"&&"save"||"download";c=O(a.exporting.exportaction);a.exporting.exportfilename=b(d.exportfilename,"FusionCharts");a.exporting.exporthandler=b(d.html5exporthandler,
d.exporthandler,ia);a.exporting.exportparameters=b(d.exportparameters,"");a.exporting.exportformat=b(d.exportformat,"PNG");a.exporting.exportatclient=e(d.exportatclient,0);a.exporting.exportformats=function(a){var b={JPG:c+" as JPEG image",PNG:c+" as PNG image",PDF:c+" as PDF document",SVG:c+" as SVG vector image"},e,d,f,g=0;if(a){a=a.split("|");for(g=0;g<a.length;g++)f=(d=a[g].split("="))&&d[0].toUpperCase()||"",d=d&&d[1]||"",b[f]&&(e||(e={}))&&(e[f]=d||b[f])}return e||b}(d.exportformats);a.exporting.buttons.printButton.enabled=
d.showprintmenuitem=="1";a.exporting.buttons.exportButton.enabled=d.exportenabled=="1"?d.exportshowmenuitem!="0":!1},defaultSeriesType:w,paletteIndex:1,creditLabel:Va,placeTitle:Ja,placeLegendBlockBottom:m,placeLegendBlockRight:pa,placeHorizontalAxis:ea,placeVerticalAxis:Ia,placeHorizontalCanvasMarginAdjustment:Qa,placeVerticalCanvasMarginAdjustment:la,placeHorizontalXYSpaceManager:function(a,c,d,f){var g=a[s],p,h,t,j=c.chart,i,k,z,l,A,H,m=a.chart,P=g.marginLeftExtraSpace,n=g.marginTopExtraSpace,
r=g.marginBottomExtraSpace,q=g.marginRightExtraSpace;t=d-(P+q+m.marginRight+m.marginLeft);var da=f-(r+m.marginBottom+m.marginTop),ga=t*0.3,d=da*0.3;p=t-ga;f=da-d;i=b(j.legendposition,u).toLowerCase();a.legend.enabled&&i===N&&(p-=this.placeLegendBlockRight(a,c,p/2,da));l=e(j.xaxisnamepadding,5);A=e(j.labelpadding,2);H=j.rotatexaxisname!==ma;k=b(j.showplotborder,g.is3d?ma:ta)===ta;k=g.plotBorderThickness=k?g.is3d?1:e(j.plotborderthickness,1):0;z=F(e(m.plotBorderWidth,1),0);h=F(z,k/2);A<h&&(A=h);if(!g.isDual&&
m.marginRight<z&&j.chartrightmargin===void 0&&(h=z-m.marginRight,t>ga+h))m.marginRight=z,t-=h,ga=t*0.3,p=t-ga;h=g.x;h.verticalAxisNamePadding=l;h.verticalAxisValuesPadding=A;h.rotateVerticalAxisName=H;h.verticalAxisNameWidth=e(j.xaxisnamewidth);p-=Ia(a.xAxis,h,a,c,da,p,!1,!1,t);p-=Qa(a,c,p,a.xAxis);t=p+ga;a.legend.enabled&&i!==N&&(f-=this.placeLegendBlockBottom(a,c,t,f/2));f-=Ja(a,c,t,f/2);h=g[0];h.horizontalAxisNamePadding=e(j.yaxisnamepadding,5);h.horizontalLabelPadding=e(j.yaxisvaluespadding,2);
h.labelDisplay="auto";h.staggerLines=e(j.staggerlines,2);h.slantLabels=e(j.slantlabels,0);h.horizontalLabelPadding=h.horizontalLabelPadding<z?z:h.horizontalLabelPadding;this.xAxisMinMaxSetter(a,c,t);p=a.xAxis;A=p.plotLines;z=f/(p.max-p.min);A&&A.length&&(l=(A[0].value-p.min)*z,A=(p.max-A[A.length-1].value)*z,g.isBar&&(k>l&&(p.min-=(k-l)/(2*z)),k>A&&(p.max+=(k-A)/(2*z))));f-=this.placeHorizontalAxis(a.yAxis[0],h,a,c,t,f,ga);f-=la(a,c,f,a.yAxis[0]);Ba(d+f,a,j,a.xAxis,g.x.lYLblIdx,!0);ba(a,a.xAxis.title,
f);if(a.legend.enabled&&i===N){a=a.legend;c=d+f;if(a.height>c)a.height=c,a.scroll.enabled=!0,c=(a.scroll.scrollBarWidth=10)+(a.scroll.scrollBarPadding=2),a.width+=c,m.marginRight+=c;a.y=20}m.marginLeft+=P;m.marginTop+=n;m.marginBottom+=r;m.marginRight+=q},placeVerticalXYSpaceManager:function(a,c,d,f){var g=a[s],p,h,t=!0,j=0,i=c.chart,k=!1,z,l,A,H=a.chart,m=g.marginLeftExtraSpace,P=g.marginTopExtraSpace,n=g.marginBottomExtraSpace,r=g.marginRightExtraSpace;p=d-(m+r+H.marginRight+H.marginLeft);var q=
f-(n+H.marginBottom+H.marginTop),ga=p*0.3,f=q*0.3,da=p-ga,d=q-f,j=g.drawFullAreaBorder=e(i.drawfullareaborder,1),ea=b(i.legendposition,u).toLowerCase();z=e(i.yaxisnamepadding,5);l=e(i.yaxisvaluespadding,i.labelypadding,2);h=b(i.showplotborder,g.is3d?ma:ta)===ta;h=g.plotBorderThickness=h?g.is3d?1:e(i.plotborderthickness,1):0;A=F(e(H.plotBorderWidth,1),0);h=F(A,h/2);this.defaultSeriesType==="area"&&!j&&(h=A);l<A&&(l=A);if(!g.isDual&&H.marginRight<A&&i.chartrightmargin===void 0&&(j=A-a.chart.marginRight,
p>ga+j))H.marginRight=A,p-=j,ga=p*0.3,da=p-ga;a.legend.enabled&&ea===N&&(da-=this.placeLegendBlockRight(a,c,da/2,q));j=i.rotateyaxisname!==ma;if(g.isDual)k=!0,p=g[1],p.verticalAxisNamePadding=z,p.verticalAxisValuesPadding=l,p.rotateVerticalAxisName=j,p.verticalAxisNameWidth=e(i.syaxisnamewidth),t=a.yAxis[1].opposite,da-=Ia(a.yAxis[1],p,a,c,q,da/2,t,k);p=g[0];p.verticalAxisNamePadding=z;p.verticalAxisValuesPadding=l;p.rotateVerticalAxisName=j;p.verticalAxisNameWidth=e(k?i.pyaxisnamewidth:i.yaxisnamewidth);
da-=Ia(a.yAxis[0],p,a,c,q,da,!t,k);da-=Qa(a,c,da,a.yAxis[0],a.yAxis[1]);t=da+ga;a.legend.enabled&&ea!==N&&(d-=this.placeLegendBlockBottom(a,c,t,d/2));d-=Ja(a,c,t,d/2);p=g.x;p.horizontalAxisNamePadding=e(i.xaxisnamepadding,5);p.horizontalLabelPadding=e(i.labelpadding,i.labelxpadding,2);p.labelDisplay=b(i.labeldisplay,"auto").toLowerCase();p.rotateLabels=e(i.rotatelabels,i.rotatexaxislabels,0);p.staggerLines=e(i.staggerlines,2);p.slantLabels=e(i.slantlabels,i.slantlabel,0);if(p.horizontalLabelPadding<
h)p.horizontalLabelPadding=h;this.xAxisMinMaxSetter(a,c,t);d-=this.placeHorizontalAxis(a.xAxis,p,a,c,t,d,ga);d-=la(a,c,d,a.xAxis);k&&(Ba(f+d,a,i,a.yAxis[1],g[1].lYLblIdx),ba(a,a.yAxis[1].title,d));Ba(f+d,a,i,a.yAxis[0],g[0].lYLblIdx);ba(a,a.yAxis[0].title,d);if(a.legend.enabled&&ea===N&&(a=a.legend,c=f+d,a.height>c&&a.type!=="gradient"))a.height=c,a.scroll.enabled=!0,c=(a.scroll.scrollBarWidth=10)+(a.scroll.scrollBarPadding=2),a.width+=c,H.marginRight+=c;H.marginLeft+=m;H.marginTop+=P;H.marginBottom+=
n;H.marginRight+=r},placeVerticalAxisTitle:ba,spaceManager:function(){return this.placeVerticalXYSpaceManager.apply(this,arguments)},axisMinMaxSetter:function(b,c,d,f,g,p,h,t){d=c.stacking100Percent?Za(99,1,100,0,g,p,h,t):Za(e(c.max,d),e(c.min,f),d,f,g,p,h,t);b.min=Number(V(d.Min,10));b.max=Number(V(d.Max,10));b.tickInterval=Number(V(d.divGap,10));c.numdivlines=Math.round((b.max-b.min)/b.tickInterval)-1;if(d.Range/d.divGap<=2)b.alternateGridColor=a;this.highValue=c.max;this.lowValue=c.min;delete c.max;
delete c.min},configurePlotLines:function(c,f,g,p,o,h,t,i,j,k,z){var l;l=g.min;var A=g.max,H=g.tickInterval,m=k?"xAxis":p.stacking100Percent?"percentValue":"yAxis",P=l,n=1,q=g.gridLineColor,da=g.gridLineWidth,u=g.gridLineDashStyle,ga=l<0&&A>0?!0:!1,ea=l===0,qa=A===0,v=e(p.showzeroplanevalue,c.showzeroplanevalue)===0,x=!0,ba=1,I=e(c.numdivlines,0)>0,wa=f[s].axisGridManager,B=f.chart.paletteIndex,z=e(z,j?1:0);delete g._altGrid;delete g._lastValue;if(k&&!p.catOccupied)p.catOccupied={};if(ga&&(!k||!p.catOccupied[0]))if(k?
(x=e(c.showvzeroplane,1),f=e(c.showvzeroplanevalue,h),I=e(c.vzeroplanethickness,1),c=I>0?d(b(c.vzeroplanecolor,q),b(c.vzeroplanealpha,c.vdivlinealpha,r.divLineAlpha[B])):a):(B=e(c.divlinealpha,r.divLineAlpha[B]),f=e(p.showzeroplanevalue,c.showzeroplanevalue,h),this.defaultZeroPlaneHighlighted===!1?(x=e(p.showzeroplane,c.showzeroplane,!(this.defaultZeroPlaneHidden&&!I)),I=da):(I=da===1?2:da,ba=5,B*=2),I=e(p.zeroplanethickness,c.zeroplanethickness,I),c=I>0?d(b(p.zeroplanecolor,c.zeroplanecolor,q),b(p.zeroplanealpha,
c.zeroplanealpha,B)):a),x)x=f?i[m](0,z):w,(ba=wa.addAxisGridLine(g,0,x,I,u,c,ba,k))&&(ba.isZeroPlane=!0);if(o===1&&(!k||!p.catOccupied[l]))x=ea&&v?w:i[m](l,z),(ba=wa.addAxisGridLine(g,l,x,0.1,void 0,a,1,k))&&(ba.isMinLabel=!0);da<=0&&(da=0.1,q=a);for(l=Number(V(P+H,10));l<A;l=Number(V(l+H,10)),n+=1){ga&&P<0&&l>0&&!j&&(wa.addAxisAltGrid(g,0),n+=1);if(l!==0&&(!k||!p.catOccupied[l]))x=h===1&&n%t===0?i[m](l,z):w,wa.addAxisGridLine(g,l,x,da,u,q,2,k);P=l;j||wa.addAxisAltGrid(g,l)}j||wa.addAxisAltGrid(g,
A);if(o===1&&n%t===0&&(!k||!p.catOccupied[A]))x=qa&&v?w:i[m](A,z),(ba=wa.addAxisGridLine(g,A,x,0.1,u,a,2,k))&&(ba.isMaxLabel=!0);if(this.realtimeEnabled)g.labels._enabled=g.labels.enabled,g._gridLineWidth=g.gridLineWidth,g._alternateGridColor=g.alternateGridColor;g.labels.enabled=!1;g.gridLineWidth=0;g.alternateGridColor=a;g.plotLines.sort(T)},xAxisMinMaxSetter:function(b,c,d){var f=b[s],g=f.x,p=c.chart,h=g.min=e(g.min,0),t=g.max=e(g.max,g.catCount-1),i,j=0,k=0,z=b.chart.defaultSeriesType,l=/^(column|column3d|bar|bar3d|floatedcolumn|sparkwinloss|boxandwhisker2d|dragcolumn)$/.test(z),
A=/^(line|area|spline|areaspline)$/.test(z),z=/^(scatter|bubble|candlestick|dragnode)$/.test(z),H=b.xAxis,m=H.scroll,P=i=Math.min(e(p.canvaspadding,0),d/2-10);if(g.adjustMinMax){var t=h=!e(p.setadaptivexmin,1),n=e(this.numVDivLines,p.numvdivlines,4),r=p.adjustvdiv!==ma,q=e(p.showxaxisvalues,p.showxaxisvalue,1),da=e(p.showvlimits,q),q=e(p.showvdivlinevalue,p.showvdivlinevalues,q);this.axisMinMaxSetter(H,g,p.xaxismaxvalue,p.xaxisminvalue,h,t,n,r);h=H.min;t=H.max;g.requiredAutoNumericLabels&&(n=e(parseInt(p.xaxisvaluesstep,
10),1),this.configurePlotLines(p,b,H,g,da,q,n<1?1:n,f.numberFormatter,!1,!0));H.plotLines.sort(T)}H.labels.enabled=!1;H.gridLineWidth=0;H.alternateGridColor=a;if((l||f.isScroll)&&!f.hasNoColumn)k=j=0.5;f.is3d&&(P+=e(b.chart.xDepth,0));b=(d-(P+i))/(t-h+(j+k));H.min=h-(j+P/b);H.max=t+(k+i/b);if(m&&m.enabled)j=m.vxLength,k=H.max-H.min,m.viewPortMin=H.min,m.viewPortMax=H.max,m.scrollRatio=j/k,m.flatScrollBars=f.flatScrollBars,m.scrollBar3DLighting=f.scrollBar3DLighting,H.max=H.min+j;A&&H.min===H.max&&
(H.min-=0.5,H.max+=0.5);z&&c.vtrendlines&&S(c.vtrendlines,H,f,!1,!0,!0)},postSeriesAddition:function(a){var c=a[s],d=c.isBar,f=c.is3d,g=a.chart.rotateValues&&!d?270:0,p=c[0],h=p&&p.stacking100Percent,t=c.showPercentValues||c.showPercentInToolTip;if(this.isStacked&&(c.showStackTotal||h||t)){var j=c.plotSpacePercent,i=a.chart.defaultSeriesType,z,l,A=1-j,A=1-2*j,j=c.numberFormatter,H,m,P,n,r,da,u,ga,ea,qa,v,x=a.series,w,T,ba=ka({},a.plotOptions.series.dataLabels.style),I=parseFloat(ba.fontSize),wa=!p.stacking100Percent;
ba.color=a.plotOptions.series.dataLabels.color;l=p.stack;for(z in l){p=l[z].length;H=A/p;P=-(A-H)/2;if(h||t){qa=[];ga=0;for(n=x.length;ga<n;ga+=1)r=x[ga],!r.yAxis&&b(r.type,i)===z&&qa.push(r)}for(m=0;m<p;m+=1,P+=H){u=l[z][m];if(h||t){v=[];ga=0;for(n=qa.length;ga<n;ga+=1)r=qa[ga],e(r.columnPosition,0)===m&&v.push(r.data)}if(u&&u.length){da=0;for(r=u.length;da<r;da+=1)if(ga=u[da])if(ea=(ga.n||0)+(ga.p||0),c.showStackTotal&&(n=da,n+=P,ga=ea<0?ga.n:ga.p,a.xAxis.plotLines.push({value:n,width:0,isVline:wa,
isTrend:!wa,zIndex:4,_isStackSum:1,_catPosition:da,_stackIndex:m,label:{align:k,textAlign:!f&&g===270?ea<0?N:ca:d?ea<0?N:ca:k,offsetScale:wa?ga:void 0,offsetScaleIndex:0,rotation:g,style:ba,verticalAlign:q,y:d?0:ea<0?g===270?4:I:-4,x:0,text:j.yAxis(ea)}})),h||t){ga=0;for(n=v.length;ga<n;ga+=1)if(w=v[ga][da])if(T=ea&&(w.y||0)/ea*100,j.percentValue(T),w.y||w.y===0){if(h&&(w.y=T,w.previousY||w.previousY===0))w.previousY=w.previousY/ea*100;if(w.showPercentValues)w.displayValue=j.percentValue(T);if(w.showPercentInToolTip)w.toolText=
w.toolText+parseInt(T*100,10)/100+"%"}}}}}}},styleMapForFont:ga,styleApplicationDefinition_font:function(a,b,c){var e,d,f=!1,g,p,h=this.styleMapForFont;switch(b){case "caption":e=a.title;break;case "datalabels":e=a.xAxis.labels;break;case "datavalues":e=a.plotOptions.series.dataLabels;f=!0;break;case "tldatavalues":e={style:a.plotOptions.series.dataLabels.tlLabelStyle};break;case "trdatavalues":e={style:a.plotOptions.series.dataLabels.trLabelStyle};break;case "bldatavalues":e={style:a.plotOptions.series.dataLabels.blLabelStyle};
break;case "brdatavalues":e={style:a.plotOptions.series.dataLabels.brLabelStyle};break;case "subcaption":e=a.subtitle;break;case "tooltip":e=a.tooltip;break;case "trendvalues":e={style:a[s].trendStyle};break;case "xaxisname":e=a.xAxis.title;break;case "yaxisname":case "pyaxisname":case "axistitle":e=[];b=0;for(g=a.yAxis.length;b<g;b+=1)e.push(a.yAxis[b].title);break;case "yaxisvalues":e=[];b=0;for(g=a.yAxis.length;b<g;b+=1)e.push(a.yAxis[b].labels);break;case "vlinelabels":e={style:a[s].divlineStyle};
break;case "legend":e={style:a.legend.itemStyle};break;default:(e=a.orphanStyles[b])||(a.orphanStyles[b]=e={text:"",style:{}})}if(typeof e==="object")if(e instanceof Array){b=0;for(g=e.length;b<g;b+=1){p=e[b];for(d in c)if(a=d.toLowerCase(),typeof h[a]==="function")h[a](c[d],p,f);C(p.style)}}else{for(d in c)if(a=d.toLowerCase(),typeof h[a]==="function")h[a](c[d],e,f);C(e.style)}},parseStyles:function(a){var b,c,e,d={},f,g=this.dataObj;if(g.styles&&g.styles.definition instanceof Array&&g.styles.application instanceof
Array){for(b=0;b<g.styles.definition.length;b+=1)c=g.styles.definition[b],c.type&&c.name&&this["styleApplicationDefinition_"+c.type.toLowerCase()]&&(d[c.name.toLowerCase()]=c);for(b=0;b<g.styles.application.length;b+=1){c=g.styles.application[b].styles&&g.styles.application[b].styles.split(X)||[];for(f=0;f<c.length;f+=1)if(e=c[f].toLowerCase(),d[e]&&g.styles.application[b].toobject)this["styleApplicationDefinition_"+d[e].type.toLowerCase()](a,g.styles.application[b].toobject.toLowerCase(),d[e])}}},
dispose:function(){var a;this.disposing=!0;this.renderer&&this.renderer.dispose();this.numberFormatter&&this.numberFormatter.dispose();this.smartLabel&&this.smartLabel.dispose();for(a in this)delete this[a];delete this.disposing;this.disposed=!0}});J("stub",{standaloneInit:!0},J.base);J("barbase",{spaceManager:function(){return this.placeHorizontalXYSpaceManager.apply(this,arguments)}},J.base);J("singleseries",{series:function(a,b,c){var e=a.data||a.dataset&&a.dataset[0]&&a.dataset[0].data;if(e&&
e.length>0&&e instanceof Array)b.legend.enabled=!1,c=this.point(c,{data:[],colorByPoint:!0},e,a.chart,b),c instanceof Array?b.series=b.series.concat(c):b.series.push(c),this.configureAxis(b,a),a.trendlines&&S(a.trendlines,b.yAxis,b[s],!1,this.isBar)},defaultSeriesType:w,configureAxis:function(a,c){var f=a[s],g=a.xAxis,p=c.chart,h=a.chart.is3D,t,j,i,k,z,l,A,H,m,P,r,q,ga=0,da,u,ea=this.numberFormatter,qa=e(p.syncaxislimits,0),v;g.title.text=fa(p.xaxisname);v=e(parseInt(p.yaxisvaluesstep,10),parseInt(p.yaxisvaluestep,
10),1);v=v<1?1:v;t=a.yAxis[0];j=f[0];if(f.isDual)if(i=ea.getCleanValue(p.pyaxismaxvalue),k=ea.getCleanValue(p.pyaxisminvalue),t.title.text=fa(p.pyaxisname),qa&&!j.stacking100Percent){q=f[1];r=e(q.max);q=e(q.min);if(r!==void 0&&q!==void 0)j.min=n(j.min,q),j.max=F(j.max,r);r=ea.getCleanValue(p.syaxismaxvalue);q=ea.getCleanValue(p.syaxisminvalue);q!==null&&(k=k!==null?n(k,q):q);r!==null&&(i=i!==null?F(i,r):r)}else qa=0;else i=ea.getCleanValue(p.yaxismaxvalue),k=ea.getCleanValue(p.yaxisminvalue),t.title.text=
fa(p.yaxisname);A=e(this.isStacked?0:this.setAdaptiveYMin,p.setadaptiveymin,this.defSetAdaptiveYMin,0);l=z=!A;H=e(f.numdivlines,p.numdivlines,this.numdivlines,4);m=p.adjustdiv!==ma;P=e(this.showYAxisValues,p.showyaxisvalues,p.showyaxisvalue,1);r=e(p.showlimits,P);q=e(p.showdivlinevalue,p.showdivlinevalues,P);if(!h)ga=e(p.showaxislines,p.drawAxisLines,0),t.showLine=e(p.showyaxisline,ga),g.showLine=e(p.showxaxisline,ga),da=d(b(p.axislinecolor,"#000000")),g.lineColor=d(b(p.xaxislinecolor,da)),t.lineColor=
d(b(p.yaxislinecolor,da)),u=e(p.axislinethickness,1),g.lineThickness=e(p.xaxislinethickness,u),t.lineThickness=e(p.yaxislinethickness,u);this.axisMinMaxSetter(t,j,i,k,z,l,H,m);this.configurePlotLines(p,a,t,j,r,q,v,f.numberFormatter,!1);if(t.reversed&&t.min>=0)a.plotOptions.series.threshold=t.max;if(f.isDual){t=a.yAxis[1];j=f[1];r=e(p.showsecondarylimits,r);q=e(p.showdivlinesecondaryvalue,P);qa?(g=a.yAxis[0],t.min=g.min,t.max=g.max,t.tickInterval=g.tickInterval,delete j.max,delete j.min):(i=ea.getCleanValue(p.syaxismaxvalue),
k=ea.getCleanValue(p.syaxisminvalue),A=e(p.setadaptivesymin,A),l=z=!A,this.axisMinMaxSetter(t,j,i,k,z,l,H,m));if(!h)t.showLine=e(p.showsyaxisline,ga),t.lineColor=d(b(p.syaxislinethickness,da)),t.lineThickness=e(p.syaxislinethickness,u);this.configurePlotLines(p,a,t,j,r,q,v,f.numberFormatter,!0);t.title.text=fa(p.syaxisname)}},pointValueWatcher:function(a,c,d,f,g,p,h){if(c!==null){var a=a[s],t,d=e(d,0);a[d]||(a[d]={});d=a[d];if(f)this.distributedColumns&&(a.marimekkoTotal+=c),f=d.stack,g=e(g,0),p=
e(p,0),h=b(h,Ca),f[h]||(f[h]=[]),h=f[h],h[p]||(h[p]=[]),p=h[p],p[g]||(p[g]={}),g=p[g],c>=0?g.p?(t=g.p,c=g.p+=c):g.p=c:g.n?(t=g.n,c=g.n+=c):g.n=c;d.max=d.max>c?d.max:c;d.min=d.min<c?d.min:c;return t}},getPointStub:function(a,c,d,f){var f=f[s],c=c===null?c:f.numberFormatter.dataLabels(c),g=B(fa(a.tooltext)),p=B(fa(a.displayvalue)),d=f.showTooltip?g!==void 0?g:c===null?!1:d!==w?d+f.tooltipSepChar+c:c:w,f=e(a.showvalue,f.showValues)?p!==void 0?p:c:w,a=b(a.link);return{displayValue:f,toolText:d,link:a}}},
J.base);J("multiseries",{series:function(a,b,c){var d,f,g=b[s],p;b.legend.enabled=Boolean(e(a.chart.showlegend,1));if(a.dataset&&a.dataset.length>0){this.categoryAdder(a,b);d=0;for(f=a.dataset.length;d<f;d+=1){p={visible:!!e(a.dataset[d].visible,1),data:[]};if(!this.isStacked)p.numColumns=f;p=this.point(c,p,a.dataset[d],a.chart,b,g.oriCatTmp.length,d);p instanceof Array?b.series=b.series.concat(p):b.series.push(p)}this.configureAxis(b,a);a.trendlines&&!this.isLog&&S(a.trendlines,b.yAxis,g,!1,this.isBar,
void 0,this.inversed)}},categoryAdder:function(a,b){var c,d=0,f=b[s],g=f.axisGridManager,p=a.chart,h=b.xAxis,t,f=f.x,j;if(a.categories&&a.categories[0]&&a.categories[0].category){if(a.categories[0].font)b.xAxis.labels.style.fontFamily=a.categories[0].font;if((c=e(a.categories[0].fontsize))!==void 0)c<1&&(c=1),b.xAxis.labels.style.fontSize=c+Ka,C(b.xAxis.labels.style);if(a.categories[0].fontcolor)b.xAxis.labels.style.color=a.categories[0].fontcolor.split(X)[0].replace(/^\#?/,"#");var i=b[s].oriCatTmp,
k=a.categories[0].category;for(c=0;c<k.length;c+=1)k[c].vline?g.addVline(h,k[c],d,b):(j=e(k[c].showlabel,p.showlabels,1),t=fa(x(a.categories[0].category[c].label,a.categories[0].category[c].name)),g.addXaxisCat(h,d,d,j?t:w),i[d]=x(fa(a.categories[0].category[c].tooltext),t),d+=1)}f.catCount=d},getPointStub:function(a,c,d,f,g,p,h){var t,f=f[s],j,i,c=c===null?c:this.numberFormatter.dataLabels(c,h),k,z=B(fa(a.tooltext)),h=f.tooltipSepChar;f.showTooltip?z!==void 0?g=z:c===null?g=!1:(f.seriesNameInToolTip&&
(k=x(g&&g.seriesname)),g=k?k+h:w,g+=d?d+h:w,f.showPercentInToolTip?i=!0:g+=c):g=!1;e(a.showvalue,p)?B(a.displayvalue)!==void 0?t=fa(a.displayvalue):f.showPercentValues?j=!0:t=c:t=w;a=b(a.link);return{displayValue:t,toolText:g,link:a,showPercentValues:j,showPercentInToolTip:i}}},J.singleseries);var za=function(a,b){return a-b};J("xybase",{hideRLine:function(){var a=this.chart.series[this.index+1];a&&a.hide&&a.hide()},showRLine:function(){var a=this.chart.series[this.index+1];a&&a.show&&a.show()},getRegressionLineSeries:function(a,
b,c){var e,d,f,g;g=a.sumXY;var p=a.sumX,h=a.sumY;d=a.xValues;f=a.sumXsqure;e=a.yValues;a=a.sumYsqure;b?(d.sort(za),e=d[0],d=d[d.length-1],g=(c*g-p*h)/(c*f-Math.pow(p,2)),f=!isNaN(g)?g*(e-p/c)+h/c:h/c,c=!isNaN(g)?g*(d-p/c)+h/c:h/c,c=[{x:e,y:f},{x:d,y:c}]):(e.sort(za),f=e[0],e=e[e.length-1],g=(c*g-p*h)/(c*a-Math.pow(h,2)),d=!isNaN(g)?g*(f-h/c)+p/c:p/c,c=!isNaN(g)?g*(e-h/c)+p/c:p/c,c=[{x:d,y:f},{x:c,y:e}]);return c},pointValueWatcher:function(a,b,c,e){var d=a[s];if(b!==null)a=d[0],a.max=a.max>b?a.max:
b,a.min=a.min<b?a.min:b;if(c!==null)a=d.x,a.max=a.max>c?a.max:c,a.min=a.min<c?a.min:c;e&&(c=c||0,b=b||0,e.sumX+=c,e.sumY+=b,e.sumXY+=c*b,e.sumXsqure+=Math.pow(c,2),e.xValues.push(c),e.sumYsqure+=Math.pow(b,2),e.yValues.push(b))}},J.multiseries);J("scrollbase",{postSeriesAddition:function(){var a=this.hcJSON,c=a.xAxis.scroll,d=a[s],f=d.width,g=d.x.catCount,p=this.dataObj.chart;d.isScroll=!0;a.chart.hasScroll=!0;if(this.isStacked)h=1;else{var h=0,j=0,i,k=a.series,z,A=a.chart.defaultSeriesType;for(i=
k.length;j<i;j++)z=b(k[j].type,A),z==="column"&&(h+=1);h<1&&(h=1)}g*=h;f=e(p.numvisibleplot,Math.floor(f/this.avgScrollPointWidth));if(c&&f>=2&&f<g)c.enabled=!0,c.vxLength=f/h,c.startPercent=p.scrolltoend===ta?1:0,c.padding=e(p.scrollpadding,a.chart.plotBorderWidth/2),c.height=e(p.scrollheight,16),c.buttonWidth=e(p.scrollbtnwidth,p.scrollheight,16),c.buttonPadding=e(p.scrollbtnpadding,0),c.color=v(b(p.scrollcolor,r.altHGridColor[a.chart.paletteIndex])),d.marginBottomExtraSpace+=c.padding+c.height;
if(t||e(p.enabletouchscroll,0))a.chart.zoomType="x",a.chart.nativeZoom=!1,a.chart.selectionMarkerFill="rgba(255,255,255,0)",(a.callbacks||(a.callbacks=[])).push(function(a){l(a,"selectionstart selectiondrag",J.scrollbase.performTouchScroll,{})})},performTouchScroll:function(a){var b=this.xAxis[0].scroller,c=b.config;a.isOutsidePlot!==!0&&H(b.elements.anchor.element,a.type==="selectionstart"?"dragstart":"drag",{pageX:-(c.trackLength/(c.width/c.scrollRatio)*(a.chartX||1)),pageY:-a.chartY})}},J.multiseries);
J("logbase",{isLog:!0,isValueAbs:!0,configureAxis:function(c,f){var g=c[s],p=g.axisGridManager,h=this.numberFormatter,t=c.series,j=c.xAxis,i=c.yAxis[0],k=g[0],l=f.chart,A=!e(l.showlimits,l.showyaxisvalues,1),H=!e(l.showdivlinevalues,l.showyaxisvalues,1),m=e(l.base,l.logbase,10),P=e(l.yaxismaxvalue),n=e(l.yaxisminvalue),q=e(l.showminordivlinevalues)===1,ga=b(l.minordivlinecolor,i.gridLineColor,r.divLineColor[c.chart.paletteIndex]),da=e(l.minordivlinealpha,l.divlinealpha,r.divLineAlpha[c.chart.paletteIndex]),
u=[i,void 0,void 0,e(l.divlinethickness,2),i.gridLineDashStyle,i.gridLineColor,2],ga=[i,void 0,void 0,e(l.minordivlinethickness,1),i.gridLineDashStyle,d(b(l.minordivlinecolor,ga),e(l.minordivlinealpha,da/2)),2],da=q||da&&ga[3],ea;m<=0&&(m=10);P<=0&&(P=void 0);n<=0&&(n=void 0);P=this.getLogAxisLimits(k.max||m,k.min||1,P,n,m,da?l.numminordivlines:0);j.title.text=fa(l.xaxisname);ka(i,{title:{text:fa(l.yaxisname)},labels:{enabled:!1},gridLineWidth:0,alternateGridColor:a,reversed:l.invertyaxis==="1",max:z(P.Max,
m),min:z(P.Min,m)});for(j=t.length;j--;)if(l=t[j]){l.threshold=i.min;for(ea=(l=l.data)&&l.length||0;ea--;)n=l[ea],n.y=z(n.y,m)}delete k.max;delete k.min;k.isLog=!0;if(i.reversed&&i.min>=0)c.plotOptions.series.threshold=i.max;f.trendlines&&S(f.trendlines,[{max:P.Max,min:P.Min,plotLines:i.plotLines,plotBands:i.plotBands}],g);for(j=i.plotLines.length;j--;)n=i.plotLines[j],n.value&&(n.value=z(n.value,m)),n.from&&(n.from=z(n.from,m)),n.to&&(n.to=z(n.to,m));for(j=i.plotBands.length;j--;)n=i.plotBands[j],
n.from&&(n.from=z(n.from,m)),n.to&&(n.to=z(n.to,m));for(j=P.divArr.length;j--;){n=P.divArr[j];if(n.ismajor)u[1]=z(n.value,m),u[2]=h.yAxis(n.value),p.addAxisGridLine.apply(p,u);else if(da||n.isextreme)ga[1]=z(n.value,m),ga[2]=q||n.isextreme?h.yAxis(n.value):w,p.addAxisGridLine.apply(p,ga);l=i.plotLines[i.plotLines.length-1];if(n.isextreme){if(l.width=0.1,A)l.label.text=w}else if(H&&l.label)l.label.text=w}},getLogAxisLimits:function(a,b,c,e,d,f){var g=function(a){return a==null||a==void 0||a==""||isNaN(a)?
!1:!0},p=0,h=[],t,j,i,k,z,l;g(c)&&Number(c)>=a?a=Number(c):(c=d>1?aa(M(a)/M(d)):D(M(a)/M(d)),a=Z(d,c),j=c);j||(j=d>1?aa(M(a)/M(d)):D(M(a)/M(d)));g(e)&&Number(e)<=b?b=Number(e):(c=d>1?D(M(b)/M(d)):aa(M(b)/M(d)),b=Z(d,c),t=c);t||(t=d>1?D(M(b)/M(d)):aa(M(b)/M(d)));e=Number(String(M(d)/M(10)));f=Number(f)||(D(e)==e?8:4);d>1?(i=j,k=t):d>0&&d<1&&(i=t,k=j);e=j;for(t=i;t>=k;--t)if(i=Z(d,e),b<=i&&a>=i&&(h[p++]={value:i,ismajor:!0}),t!=k){j=d>1?-1:1;i=Z(d,e)-Z(d,e+j);c=i/(f+1);for(g=1;g<=f;++g)i=Z(d,e+j)+c*
g,b<=i&&a>=i&&(h[p++]={value:i,ismajor:!1});d>1?e--:e++}for(var A in h)for(var H in h[A])if(H=="value"){if(!z)z=h[A][H]==b&&(h[A].isextreme=!0);if(!l)l=h[A][H]==a&&(h[A].isextreme=!0)}z||(h[p++]={value:b,ismajor:!0,isextreme:!0});l||(h[p]={value:a,ismajor:!0,isextreme:!0});return{Max:a,Min:b,divArr:h}},pointValueWatcher:function(a,b,c){a=a[s];c=e(c,0);if(b>0)a[c]||(a[c]={}),c=a[c],c.max=c.max>b?c.max:b,c.min=c.min<b?c.min:b}},J.mslinebase);m=J.singleseries;pa=J.multiseries;J("column2dbase",{point:function(a,
c,d,f,g){var a=d.length,p=g[s],h=p.axisGridManager,t=g.xAxis,j=g.chart.paletteIndex,p=p.x,i=g.colors,k=g.colors.length,z=/3d$/.test(g.chart.defaultSeriesType),l=this.isBar,A=b(f.showplotborder,z?ma:ta)===ta?z?1:e(f.plotborderthickness,1):0,H=g.chart.useRoundEdges,m=e(f.plotborderalpha,f.plotfillalpha,100),n=b(f.plotbordercolor,r.plotBorderColor[j]).split(X)[0],j=X+(e(f.useplotgradientcolor,1)?$(f.plotgradientcolor,r.plotGradientColor[j]):w),P=0,q=Boolean(e(f.use3dlighting,1)),ga=g[s].numberFormatter,
da,u=e(f.plotborderdashed,0),ea=e(f.plotborderdashlen,5),v=e(f.plotborderdashgap,4),qa,T,ba,I,wa,B,ra,la,Ba;for(ba=T=0;T<a;T+=1)ra=d[T],ra.vline?h.addVline(t,ra,P,g):(qa=ga.getCleanValue(ra.value),Ba=e(ra.showlabel,f.showlabels,1),I=fa(x(ra.label,ra.name)),h.addXaxisCat(t,P,P,Ba?I:w),P+=1,da=b(ra.color,i[ba%k])+j.replace(/,+?$/,""),wa=b(ra.alpha,f.plotfillalpha,Aa),B=b(ra.ratio,f.plotfillratio),la=b(360-f.plotfillangle,l?180:90),qa<0&&(la=l?180-la:360-la),Ba={opacity:wa/100},wa=R(da,wa,B,la,H,n,b(ra.alpha,
m)+w,l,z),da=e(ra.dashed,u)?G(b(ra.dashlen,ea),b(ra.dashgap,v),A):void 0,c.data.push(ka(this.getPointStub(ra,qa,I,g),{y:qa,shadow:Ba,color:wa[0],borderColor:wa[1],borderWidth:A,use3DLighting:q,dashStyle:da,tooltipConstraint:this.tooltipConstraint})),this.pointValueWatcher(g,qa),ba+=1);p.catCount=P;return c},defaultSeriesType:"column"},m);J("linebase",{defaultSeriesType:"line",hasVDivLine:!0,defaultPlotShadow:1,point:function(a,c,d,f,g){var p,h,t,j,i,k,z,l,A,H,m,P,n,q,ga,da,u,ea,qa,T,ba,wa,I,ra,B,
a=g.chart,la=d.length,Ba=g.xAxis;p=g[s];var Ia=p.axisGridManager,C=0,D=p.x,O=g.chart.paletteIndex,F=g[s].numberFormatter;ga=v(b(f.linecolor,f.palettecolors,r.plotFillColor[O]));da=b(f.linealpha,Aa);P=e(f.linethickness,this.lineThickness,4);n=Boolean(e(f.linedashed,0));l=e(f.linedashlen,5);A=e(f.linedashgap,4);c.color={FCcolor:{color:ga,alpha:da}};c.lineWidth=P;c.step=b(this.stepLine,c.step);c.drawVerticalJoins=Boolean(e(c.drawVerticalJoins,f.drawverticaljoins,1));c.useForwardSteps=Boolean(e(c.useForwardSteps,
f.useforwardsteps,1));q=e(f.drawanchors,f.showanchors);for(i=h=0;h<la;h+=1)j=d[h],j.vline?Ia.addVline(Ba,j,C,g):(p=F.getCleanValue(j.value),k=e(j.showlabel,f.showlabels,1),t=fa(x(j.label,j.name)),Ia.addXaxisCat(Ba,C,C,k?t:w),C+=1,H=v(b(j.color,ga)),m=b(j.alpha,da),k=e(j.dashed,n)?G(l,A,P):void 0,z={opacity:m/100},ea=e(j.anchorsides,f.anchorsides,0),B=e(j.anchorstartangle,f.anchorstartangle,90),ba=e(j.anchorradius,f.anchorradius,this.anchorRadius,3),T=v(b(j.anchorbordercolor,f.anchorbordercolor,ga)),
qa=e(j.anchorborderthickness,f.anchorborderthickness,this.anchorBorderThickness,1),wa=v(b(j.anchorbgcolor,f.anchorbgcolor,r.anchorBgColor[O])),I=b(j.anchoralpha,f.anchoralpha,Aa),ra=b(j.anchorbgalpha,f.anchorbgalpha,I),u=q===void 0?m!=0:!!q,c.data.push(ka(this.getPointStub(j,p,t,g),{y:p,color:{FCcolor:{color:H,alpha:m}},shadow:z,dashStyle:k,valuePosition:b(j.valueposition,a.valuePosition),marker:{enabled:!!u,fillColor:{FCcolor:{color:wa,alpha:ra*I/100+w}},lineColor:{FCcolor:{color:T,alpha:I}},lineWidth:qa,
radius:ba,startAngle:B,symbol:va(ea)},tooltipConstraint:this.tooltipConstraint})),this.pointValueWatcher(g,p),i+=1);D.catCount=C;return c},defaultZeroPlaneHighlighted:!1},m);J("area2dbase",{defaultSeriesType:"area",hasVDivLine:!0,point:function(a,c,d,f,g){var a=g.chart,p=d.length,h=g.xAxis,t=g[s],i=g.chart.paletteIndex,k=t.axisGridManager,t=t.x,z=g[s].numberFormatter,l=0,A,H,m,P,n,q,ga,da,u,ea,qa,T,ba,I,wa,ra,la,Ba,Ia,C,D,O,F;n=b(f.plotfillcolor,f.areabgcolor,B(f.palettecolors)?g.colors[0]:r.plotFillColor[i]).split(X)[0];
O=X+(e(f.useplotgradientcolor,1)?$(f.plotgradientcolor,r.plotGradientColor[i]):w);q=b(f.plotfillalpha,f.areaalpha,this.isStacked?Aa:"90");ga=e(f.plotfillangle,270);da=b(f.plotbordercolor,f.areabordercolor,B(f.palettecolors)?g.colors[0]:r.plotBorderColor[i]).split(X)[0];u=f.showplotborder==ma?ma:b(f.plotborderalpha,f.plotfillalpha,f.areaalpha,Aa);A=e(f.plotborderangle,270);H=Boolean(e(f.plotborderdashed,0));m=e(f.plotborderdashlen,5);ba=e(f.plotborderdashgap,4);la=e(f.plotborderthickness,f.areaborderthickness,
1);F=c.fillColor={FCcolor:{color:n+O.replace(/,+?$/,""),alpha:q,ratio:Ma,angle:ga}};c.lineWidth=la;c.dashStyle=H?G(m,ba,la):void 0;c.lineColor={FCcolor:{color:da,alpha:u,ratio:Aa,angle:A}};c.step=b(this.stepLine,c.step);c.drawVerticalJoins=Boolean(e(c.drawVerticalJoins,f.drawverticaljoins,1));c.useForwardSteps=Boolean(e(c.useForwardSteps,f.useforwardsteps,1));la=Boolean(e(f.drawanchors,f.showanchors,1));for(Ia=H=0;H<p;H+=1)ba=d[H],ba.vline?k.addVline(h,ba,l,g):(A=z.getCleanValue(ba.value),P=e(ba.showlabel,
f.showlabels,1),m=fa(x(ba.label,ba.name)),k.addXaxisCat(h,l,l,P?m:w),l+=1,P=e(ba.anchorsides,f.anchorsides,0),T=e(ba.anchorstartangle,f.anchorstartangle,90),ea=e(ba.anchorradius,f.anchorradius,3),qa=v(b(ba.anchorbordercolor,f.anchorbordercolor,da)),Ba=e(ba.anchorborderthickness,f.anchorborderthickness,1),I=v(b(ba.anchorbgcolor,f.anchorbgcolor,r.anchorBgColor[i])),wa=b(ba.anchoralpha,f.anchoralpha,this.anchorAlpha,ma),ra=b(ba.anchorbgalpha,f.anchorbgalpha,wa),C=B(ba.color),D=e(ba.alpha),C=C!==void 0||
D!==void 0?{FCcolor:{color:C?v(C)+O:n,alpha:void 0===D?j(D)+w:q,ratio:Ma,angle:ga}}:F,D={opacity:Math.max(D,u)/100,inverted:!0},c.data.push(ka(this.getPointStub(ba,A,m,g),{y:A,shadow:D,color:C,valuePosition:b(ba.valueposition,a.valuePosition),marker:{enabled:la,fillColor:{FCcolor:{color:I,alpha:ra*wa/100+w}},lineColor:{FCcolor:{color:qa,alpha:wa}},lineWidth:Ba,radius:ea,symbol:va(P),startAngle:T},tooltipConstraint:this.tooltipConstraint,previousY:this.pointValueWatcher(g,A)})),Ia+=1);t.catCount=l;
return c}},m);var I=h.getDataParser={column:function(a,c,d){var f=a[s],g=c.borderWidth;return function(p,h,t){var i=j(b(p.alpha,c.alpha)).toString(),k={opacity:i/100},z=c.isBar,l=c.fillAangle,i=R(b(p.color,c.color)+c.plotgradientcolor,i,b(p.ratio,c.ratio),t<0?z?180-l:360-l:l,c.isRoundEdges,c.plotBorderColor,Math.min(i,j(c.plotBorderAlpha)).toString(),z,c.is3d),z=e(p.dashed,c.dashed)?G(b(p.dashlen,c.dashLen),b(p.dashgap,c.dashGap),g):void 0,p=d.getPointStub(p,t,f.oriCatTmp[h],a,c,c.showValues,c.yAxis);
p.y=t;p.shadow=k;p.color=i[0];p.borderColor=i[1];p.borderWidth=g;p.use3DLighting=c.use3DLighting;p.dashStyle=z;p.tooltipConstraint=d.tooltipConstraint;return p}},line:function(a,c,d){var f=a[s];return function(g,p,h){var t=b(g.alpha,c.lineAlpha),j={opacity:t/100},i=b(g.anchoralpha,c.anchorAlpha),p=d.getPointStub(g,h,f.oriCatTmp[p],a,c,c.showValues,c.yAxis);p.y=h;p.shadow=j;p.dashStyle=e(g.dashed,c.lineDashed)?G(c.lineDashLen,c.lineDashGap,c.lineThickness):void 0;p.color={FCcolor:{color:v(b(g.color,
c.lineColor)),alpha:t}};p.valuePosition=b(g.valueposition,c.valuePosition);p.marker={enabled:c.drawAnchors===void 0?t!=0:!!c.drawAnchors,fillColor:{FCcolor:{color:v(b(g.anchorbgcolor,c.anchorBgColor)),alpha:(b(g.anchorbgalpha,c.anchorBgAlpha)*i/100).toString()}},lineColor:{FCcolor:{color:v(b(g.anchorbordercolor,c.anchorBorderColor)),alpha:i}},lineWidth:e(g.anchorborderthickness,c.anchorBorderThickness),radius:e(g.anchorradius,c.anchorRadius),symbol:va(e(g.anchorsides,c.anchorSides)),startAngle:b(g.anchorstartangle,
c.anchorAngle)};return p}},area:function(a,c,d){var f=a[s];return function(g,p,h){var t=b(g.alpha,c.fillAlpha),j={opacity:Math.max(t,c.lineAlpha)/100,inverted:!0},i=b(g.anchoralpha,c.anchorAlpha),p=d.getPointStub(g,h,f.oriCatTmp[p],a,c,c.showValues,c.yAxis);p.y=h;p.shadow=j;p.color={FCcolor:{color:v(b(g.color,c.fillColor)),alpha:t}};p.valuePosition=b(g.valueposition,c.valuePosition);p.marker={enabled:c.drawAnchors,fillColor:{FCcolor:{color:v(b(g.anchorbgcolor,c.anchorBgColor)),alpha:(b(g.anchorbgalpha,
c.anchorBgAlpha)*i/100).toString()}},lineColor:{FCcolor:{color:v(b(g.anchorbordercolor,c.anchorBorderColor)),alpha:i}},lineWidth:e(g.anchorborderthickness,c.anchorBorderThickness),radius:e(g.anchorradius,c.anchorRadius),symbol:va(e(g.anchorsides,c.anchorSides)),startAngle:b(g.anchorstartangle,c.anchorAngle)};p.events={click:c.getLink};return p}}};J("mscolumn2dbase",{point:function(a,c,d,f,g,p,h,t,j){var o;var a=!1,i=d.data||[],k=g[s],z=b(c.type,this.defaultSeriesType),l=b(c.isStacked,g.plotOptions[z]&&
g.plotOptions[z].stacking),A=b(this.isValueAbs,k.isValueAbs,!1),H=e(c.yAxis,0),m=g[s].numberFormatter,P=g.chart.paletteIndex,n,q;q=g._FCconf.isBar;if(!l)c.columnPosition=e(j,t,h);c.name=B(d.seriesname);if(e(d.includeinlegend)===0||c.name===void 0)c.showInLegend=!1;c.color=b(d.color,g.colors[h%g.colors.length]).split(X)[0].replace(/^#?/g,"#");j=/3d$/.test(g.chart.defaultSeriesType);q=b(360-f.plotfillangle,q?180:90);n<0&&(q=360-q);o=c._dataParser=I.column(g,{seriesname:c.name,color:b(d.color,g.colors[h%
g.colors.length]),alpha:b(d.alpha,f.plotfillalpha,Aa),plotgradientcolor:X+(e(f.useplotgradientcolor,1)?$(f.plotgradientcolor,r.plotGradientColor[P]):w),ratio:b(d.ratio,f.plotfillratio),fillAangle:q,isRoundEdges:g.chart.useRoundEdges,plotBorderColor:b(f.plotbordercolor,j?Na:r.plotBorderColor[P]).split(X)[0],plotBorderAlpha:f.showplotborder==ma||j&&f.showplotborder!=ta?ma:b(f.plotborderalpha,Aa),isBar:this.isBar,is3d:j,dashed:e(d.dashed,f.plotborderdashed,0),dashLen:e(d.dashlen,f.plotborderdashlen,
5),dashGap:e(d.dashgap,f.plotborderdashgap,4),borderWidth:b(f.plotborderthickness,ta),showValues:e(d.showvalues,k.showValues),yAxis:H,use3DLighting:e(f.use3dlighting,1),_sourceDataset:d},this),d=o;for(f=0;f<p;f+=1)(h=i[f])?(n=m.getCleanValue(h.value,A),n===null?c.data.push({y:null}):(a=!0,h=d(h,f,n),c.data.push(h),h.previousY=this.pointValueWatcher(g,n,H,l,f,t,z))):c.data.push({y:null});if(!a&&!this.realtimeEnabled)c.showInLegend=!1;return c},defaultSeriesType:"column"},pa);J("mslinebase",{hasVDivLine:!0,
point:function(a,c,d,f,g,p,h){var o;var a=!1,t,j;t=g.chart;var i=d.data||[];j=g[s];var k=b(c.type,this.defaultSeriesType),z=b(c.isStacked,g.plotOptions[k]&&g.plotOptions[k].stacking),l=b(this.isValueAbs,j.isValueAbs,!1),A=e(c.yAxis,0),H=this.numberFormatter,h=v(b(d.color,f.linecolor,g.colors[h%g.colors.length])),m=b(d.alpha,f.linealpha,Aa),P=e(f.showshadow,this.defaultPlotShadow,1),n=e(d.drawanchors,d.showanchors,f.drawanchors,f.showanchors),q=e(d.anchorsides,f.anchorsides,0),ga=e(d.anchorstartangle,
f.anchorstartangle,90),da=e(d.anchorradius,f.anchorradius,3),u=v(b(d.anchorbordercolor,f.anchorbordercolor,h)),ea=e(d.anchorborderthickness,f.anchorborderthickness,1),qa=v(b(d.anchorbgcolor,f.anchorbgcolor,r.anchorBgColor[g.chart.paletteIndex])),T=b(d.anchoralpha,f.anchoralpha,Aa),ba=b(d.anchorbgalpha,f.anchorbgalpha,T);c.name=B(d.seriesname);if(e(d.includeinlegend)===0||c.name===void 0||m==0&&n!==1)c.showInLegend=!1;c.marker={fillColor:{FCcolor:{color:qa,alpha:ba*T/100+w}},lineColor:{FCcolor:{color:u,
alpha:T+w}},lineWidth:ea,radius:da,symbol:va(q),startAngle:ga};c.color={FCcolor:{color:h,alpha:m}};c.shadow=P?{opacity:P?m/100:0}:!1;c.step=b(this.stepLine,c.step);c.drawVerticalJoins=Boolean(e(c.drawVerticalJoins,f.drawverticaljoins,1));c.useForwardSteps=Boolean(e(c.useForwardSteps,f.useforwardsteps,1));c.lineWidth=e(d.linethickness,f.linethickness,2);o=c._dataParser=I.line(g,{seriesname:c.name,lineAlpha:m,anchorAlpha:T,showValues:e(d.showvalues,j.showValues),yAxis:A,lineDashed:Boolean(e(d.dashed,
f.linedashed,0)),lineDashLen:e(d.linedashlen,f.linedashlen,5),lineDashGap:e(d.linedashgap,f.linedashgap,4),lineThickness:c.lineWidth,lineColor:h,valuePosition:b(d.valueposition,t.valuePosition),drawAnchors:n,anchorBgColor:qa,anchorBgAlpha:ba,anchorBorderColor:u,anchorBorderThickness:ea,anchorRadius:da,anchorSides:q,anchorAngle:ga,_sourceDataset:d},this),t=o;for(f=0;f<p;f+=1)(j=i[f])?(d=H.getCleanValue(j.value,l),d===null?c.data.push({y:null}):(a=!0,j=t(j,f,d),c.data.push(j),j.previousY=this.pointValueWatcher(g,
d,A,z,f,0,k))):c.data.push({y:null});if(!a&&!this.realtimeEnabled)c.showInLegend=!1;return c},defaultSeriesType:"line",defaultPlotShadow:1,defaultZeroPlaneHighlighted:!1},pa);J("msareabase",{hasVDivLine:!0,point:function(a,c,d,f,g,p,h){var o;var a=!1,t=g.chart,j=d.data||[],i=g[s],k=b(c.type,this.defaultSeriesType),z=b(c.isStacked,g.plotOptions[k]&&g.plotOptions[k].stacking),l=b(this.isValueAbs,i.isValueAbs,!1),A=g.chart.paletteIndex,H=e(c.yAxis,0),m=g[s].numberFormatter,P=b(d.color,f.plotfillcolor,
g.colors[h%g.colors.length]).split(X)[0].replace(/^#?/g,"#").split(X)[0],n=b(d.alpha,f.plotfillalpha,f.areaalpha,this.areaAlpha,70),q=e(f.plotfillangle,270),h=b(d.plotbordercolor,f.plotbordercolor,f.areabordercolor,this.isRadar?g.colors[h%g.colors.length]:"666666").split(X)[0],ga=b(d.showplotborder,f.showplotborder)==ma?ma:b(d.plotborderalpha,f.plotborderalpha,d.alpha,f.plotfillalpha,f.areaalpha,"95"),da=e(f.plotborderangle,270),u=e(d.anchorsides,f.anchorsides,0),ea=e(d.anchorstartangle,f.anchorstartangle,
90),qa=e(d.anchorradius,f.anchorradius,3),T=v(b(d.anchorbordercolor,f.anchorbordercolor,P)),ba=e(d.anchorborderthickness,f.anchorborderthickness,1),x=v(b(d.anchorbgcolor,f.anchorbgcolor,r.anchorBgColor[A])),wa=e(d.anchoralpha,f.anchoralpha,this.anchorAlpha,0),ra=e(d.anchorbgalpha,f.anchorbgalpha,wa);this.isRadar||(P+=X+(e(f.useplotgradientcolor,1)?$(f.plotgradientcolor,r.plotGradientColor[A]):w),P=P.replace(/,+?$/,""));c.step=b(this.stepLine,c.step);c.drawVerticalJoins=Boolean(e(c.drawVerticalJoins,
f.drawverticaljoins,1));c.useForwardSteps=Boolean(e(c.useForwardSteps,f.useforwardsteps,1));c.name=b(d.seriesname);if(e(d.includeinlegend)===0||c.name===void 0)c.showInLegend=!1;c.fillColor={FCcolor:{color:P,alpha:n,ratio:Ma,angle:q}};c.color=P;c.shadow={opacity:e(f.showshadow,1)?ga/100:0};c.lineColor={FCcolor:{color:h,alpha:ga,ratio:Aa,angle:da}};c.lineWidth=b(d.plotborderthickness,f.plotborderthickness,1);c.dashStyle=Boolean(e(d.dashed,f.plotborderdashed,0))?G(e(d.dashlen,f.plotborderdashlen,5),
e(d.dashgap,f.plotborderdashgap,4),c.lineWidth):void 0;c.marker={fillColor:{FCcolor:{color:x,alpha:ra*wa/100+w}},lineColor:{FCcolor:{color:T,alpha:wa+w}},lineWidth:ba,radius:qa,symbol:va(u),startAngle:ea};o=c._dataParser=I.area(g,{seriesname:c.name,lineAlpha:ga,anchorAlpha:wa,showValues:e(d.showvalues,i.showValues),yAxis:H,fillColor:P,fillAlpha:n,valuePosition:b(d.valueposition,t.valuePosition),drawAnchors:Boolean(e(f.drawanchors,f.showanchors,1)),anchorBgColor:x,anchorBgAlpha:ra,anchorBorderColor:T,
anchorBorderThickness:ba,anchorRadius:qa,anchorSides:u,anchorAngle:ea,getLink:this.linkClickFN,_sourceDataset:d},this),d=o;for(t=0;t<p;t+=1)(i=j[t])?(f=i?m.getCleanValue(i.value,l):null,f===null?c.data.push({y:null}):(a=!0,i=d(i,t,f),c.data.push(i),i.previousY=this.pointValueWatcher(g,f,H,z,t,0,k))):c.data.push({y:null});if(!a&&!this.realtimeEnabled)c.showInLegend=!1;return c},defaultSeriesType:"area",defaultPlotShadow:0},pa);J("scatterbase",{showValues:0,defaultPlotShadow:0,rendererId:"cartesian",
defaultSeriesType:"scatter",point:function(a,c,f,g,p,h,t){if(f.data){var i,k,z,l,A,H,m,P,n,q,ga,da,u,ea,qa,T,ba,x=!1,wa;z=e(f.drawline,g.drawlines,0);l=e(f.drawprogressioncurve,0);var a=f.data,h=a.length,I=e(f.showvalues,p[s].showValues),ra=this.numberFormatter,la=e(f.showregressionline,g.showregressionline,0);c.zIndex=1;c.name=B(f.seriesname);if(e(f.includeinlegend)===0||c.name===void 0)c.showInLegend=!1;if(z||l)k=v(b(f.color,p.colors[t%p.colors.length])),z=b(f.alpha,Aa),l=e(f.linethickness,g.linethickness,
2),A=Boolean(e(f.linedashed,f.dashed,g.linedashed,0)),H=e(f.linedashlen,g.linedashlen,5),m=e(f.linedashgap,g.linedashgap,4),c.color=d(b(f.linecolor,g.linecolor,k),e(f.linealpha,g.linealpha,z)),c.lineWidth=l,c.dashStyle=A?G(H,m,l):void 0;z=Boolean(e(f.drawanchors,f.showanchors,g.drawanchors,g.showanchors,1));l=e(f.anchorsides,g.anchorsides,t+3);A=e(f.anchorradius,g.anchorradius,3);t=v(b(f.anchorbordercolor,f.color,g.anchorbordercolor,k,p.colors[t%p.colors.length]));k=e(f.anchorborderthickness,g.anchorborderthickness,
1);H=v(b(f.anchorbgcolor,g.anchorbgcolor,r.anchorBgColor[p.chart.paletteIndex]));m=b(f.anchoralpha,f.alpha,g.anchoralpha,Aa);n=b(f.anchorbgalpha,f.alpha,g.anchorbgalpha,m);b(f.anchorstartangle,g.anchorstartangle,90);c.marker={fillColor:this.getPointColor(H,Aa),lineColor:{FCcolor:{color:t,alpha:m+w}},lineWidth:k,radius:A,symbol:va(l)};if(la){c.events={hide:this.hideRLine,show:this.showRLine};var Ba={sumX:0,sumY:0,sumXY:0,sumXsqure:0,sumYsqure:0,xValues:[],yValues:[]},C=e(f.showyonx,g.showyonx,1),Ia=
v(b(f.regressionlinecolor,g.regressionlinecolor,t)),D=e(f.regressionlinethickness,g.regressionlinethickness,k),g=j(e(f.regressionlinealpha,g.regressionlinealpha,m)),Ia=d(Ia,g)}for(i=0;i<h;i+=1)(P=a[i])?(g=ra.getCleanValue(P.y),ba=ra.getCleanValue(P.x),g===null?c.data.push({y:null,x:ba}):(x=!0,wa=this.getPointStub(P,g,ra.xAxis(ba),p,f,I),q=e(P.anchorsides,l),ga=e(P.anchorradius,A),da=v(b(P.anchorbordercolor,t)),u=e(P.anchorborderthickness,k),ea=v(b(P.anchorbgcolor,H)),qa=b(P.anchoralpha,P.alpha,m),
T=b(P.anchorbgalpha,n),c.data.push({y:g,x:ba,displayValue:wa.displayValue,toolText:wa.toolText,link:wa.link,marker:{enabled:z,fillColor:{FCcolor:{color:ea,alpha:T*qa/100+w}},lineColor:{FCcolor:{color:da,alpha:qa}},lineWidth:u,radius:ga,symbol:va(q),startAngle:b(P.anchorstartangle,90)}}),this.pointValueWatcher(p,g,ba,la&&Ba))):c.data.push({y:null});la&&(f=this.getRegressionLineSeries(Ba,C,h),this.pointValueWatcher(p,f[0].y,f[0].x),this.pointValueWatcher(p,f[1].y,f[1].x),p={type:"line",color:Ia,showInLegend:!1,
lineWidth:D,enableMouseTracking:!1,marker:{enabled:!1},data:f,zIndex:0},c=[c,p])}if(!x)c.showInLegend=!1;return c},categoryAdder:function(a,c){var f,g=0,p,h=c[s].x,t,j=c.xAxis,i,z;z=a.chart;var l=parseInt(z.labelstep,10),A=e(z.showlabels,1),H=b(z.xaxislabelmode,"categories").toLowerCase(),m=c[s].numberFormatter;c._FCconf.isXYPlot=!0;l=l>1?l:1;h.catOccupied={};if(H!=="auto"&&a.categories&&a.categories[0]&&a.categories[0].category){z=a.categories[0];if(z.font)c.xAxis.labels.style.fontFamily=z.font;
if((p=e(z.fontsize))!==void 0)p<1&&(p=1),c.xAxis.labels.style.fontSize=p+Ka,C(c.xAxis.labels.style);if(z.fontcolor)c.xAxis.labels.style.color=z.fontcolor.split(X)[0].replace(/^\#?/,"#");f=b(z.verticallinecolor,r.divLineColor[c.chart.paletteIndex]);p=e(z.verticallinethickness,1);t=e(z.verticallinealpha,r.divLineAlpha[c.chart.paletteIndex]);var P=e(z.verticallinedashed,0),n=e(z.verticallinedashlen,4),q=e(z.verticallinedashgap,2),ga=d(f,t),da,ea,qa;for(f=0;f<z.category.length;f+=1)i=z.category[f],t=
m.getCleanValue(i.x),t!==null&&!i.vline&&(h.catOccupied[t]=!0,qa=e(i.showlabel,i.showname,A),da=e(i.showverticalline,i.showline,i.sl,0),ea=e(i.linedashed,P),i=qa===0||g%l!==0?w:fa(x(i.label,i.name)),j.plotLines.push({isGrid:!0,isCat:!0,width:da?p:0,color:ga,dashStyle:G(n,q,p,ea),value:t,label:{text:i,style:j.labels.style,align:k,verticalAlign:u,textAlign:k,rotation:0,x:0,y:0}}),this.pointValueWatcher(c,null,t),g+=1);if(H==="mixed")h.requiredAutoNumericLabels=e(this.requiredAutoNumericLabels,1)}else h.requiredAutoNumericLabels=
e(this.requiredAutoNumericLabels,1);h.adjustMinMax=!0},getPointColor:function(a,b){var d,e,a=v(a),b=j(b);d=c(a,70);e=i(a,50);return{FCcolor:{gradientUnits:"objectBoundingBox",cx:0.4,cy:0.4,r:"100%",color:d+X+e,alpha:b+X+b,ratio:Ma,radialGradient:!0}}}},J.xybase);J("mscombibase",{series:function(a,c,d){var f,g,p,h,t=a.chart,i,j=[],k=[],z=[],l,A,H=c[s],m=this.isDual,P=0;c.legend.enabled=Boolean(e(a.chart.showlegend,1));if(a.dataset&&a.dataset.length>0){this.categoryAdder(a,c);h=H.oriCatTmp.length;f=
0;for(g=a.dataset.length;f<g;f+=1)switch(p=a.dataset[f],l=m&&b(p.parentyaxis,"p").toLowerCase()==="s"?!0:!1,i={visible:!!e(p.visible,1),legendIndex:f,data:[]},l?(i.yAxis=1,A=x(p.renderas,this.secondarySeriesType)):A=x(p.renderas,this.defaultSeriesType),A=A.toLowerCase(),A){case "line":case "spline":i.type="line";j.push(J.mslinebase.point.call(this,d,i,p,t,c,h,f));break;case "area":case "splinearea":i.type="area";c.chart.series2D3Dshift=!0;z.push(J.msareabase.point.call(this,d,i,p,t,c,h,f));break;
case "column":case "column3d":k.push(J.mscolumn2dbase.point.call(this,d,i,a.dataset[f],t,c,h,f,void 0,P));P+=1;break;default:l?(i.type="line",j.push(J.mslinebase.point.call(this,d,i,p,t,c,h,f))):(k.push(J.mscolumn2dbase.point.call(this,d,i,a.dataset[f],t,c,h,f,void 0,P)),P+=1)}t.areaovercolumns!=="0"?(c.chart.areaOverColumns=!0,c.series=c.series.concat(k,z,j)):(c.chart.areaOverColumns=!1,c.series=c.series.concat(z,k,j));if(k.length===0)H.hasNoColumn=!0;else if(!this.isStacked){d=0;for(f=k.length;d<
f;d+=1)k[d].numColumns=f}this.configureAxis(c,a);a.trendlines&&S(a.trendlines,c.yAxis,c[s],m,this.isBar)}}},J.mscolumn2dbase)}]);
FusionCharts(["private","modules.renderer.js-renderer",function(){var g=this,h=g.hcLib,m=h.Raphael,U=h.chartAPI,w=window,S=/msie/i.test(navigator.userAgent)&&!w.opera,ia=document,b=m.type==="VML",B=h.BLANKSTRING,e="crisp",r="rgba(192,192,192,"+(S?0.002:1.0E-6)+")",x=Math.round,$=h.stubFN,fa={pageX:0,pageY:0},s=parseFloat,ka=parseInt,G=h.extend2,V=h.addEvent,K=h.removeEvent,Y=h.pluck,O=h.pluckNumber,l=h.graphics.HEXtoRGB,n=h.setImageDisplayMode,F=h.falseFN,aa=h.FC_CONFIG_STRING,D=/\s\bx\b=['"][^'"]+?['"]/ig,
M=/\s\by\b=['"][^'"]+?['"]/ig,Z=h.isArray,R=h.each=function(a,b,c,d){var e;c||(c=a);d||(d={});if(Z(a))for(e=0;e<a.length;e+=1){if(b.call(c,a[e],e,a,d)===!1)return e}else if(!(a===null||a===void 0))for(e in a)if(b.call(c,a[e],e,a,d)===!1)return e},v=h.createElement,C=h.createContextMenu,f=h.toRaphaelColor=function(){var a={};return function(b){var c=(b=b||this)&&b.FCcolor||b,d=c.color,e=c.ratio,f=c.angle,g=c.alpha,h=c.r,i=c.cx,j=c.cy,k=c.fx,m=c.fy,n=c.gradientUnits,r=c.x1,q=c.y1,u=c.x2,v=c.y2,w=1,
x,I,E,y;if(typeof b==="string")return a[y="~"+b]||(a[y]=b.replace(/^#?([a-f0-9]{3,6})/ig,"#$1"));d=d||B;if(!d)return x;y=[d,g,e,f,h,i,j,n,k,m,r,u,q,v].join("_").replace(/[\(\)\s,\xb0#]/g,"_");if(a[y])return a[y];e=e&&(e+B).split(",")||[];g=(g||g===0)&&(g+B).split(",")||[];if(d=d.split(","))if(x=B,d.length===1)E=d[0].replace(/^#?([a-f0-9]{3,6})/ig,"$1"),x=g.length?"rgba("+l(E).join(",")+","+s(g[0])*0.01+")":E.replace(/^#?([a-f0-9]{3,6})/ig,"#$1");else{b=0;for(I=d.length;b<I;b++)E=d[b].replace(/^#?([a-f0-9]{3,6})/ig,
"$1"),isNaN(e[b])||(e[b]=s(e[b]),E+=":"+e[b],isNaN(e[b+1])||(e[b+1]=s(e[b+1])+e[b])),!isNaN(g[b])&&g[b]!==B&&(w=g[b]*0.01),d[b]="rgba("+l(E).join(",")+","+w+")",isNaN(e[b])||(d[b]=d[b]+":"+e[b]);x+=d.join("-");if(h!==void 0||k!==void 0||i!==void 0||c.radialGradient)x="xr("+[k,m,h,i,j,n].join(",")+")"+x;else{x="-"+x;if(r!==void 0||q!==void 0||u!==void 0||v!==void 0)x="("+[r,q,u,v,n].join(",")+")"+x;f===void 0&&(f=0);x=360-s(f)%360+x}}return a[y]=x}}();h.gradientify=function(){return function(){return""}}();
var j=h.hasTouch,i=j?10:3,c=h.getSentenceCase,d=h.getCrispValues,a=h.getValidValue,O=h.pluckNumber,k=h.getFirstValue,q=h.regex.dropHash,u=h.HASHSTRING,N=function(a){return a!==J&&a!==null},ca=function(a,b){a[1]===a[4]&&(a[1]=a[4]=x(a[1])+b%2/2);a[2]===a[5]&&(a[2]=a[5]=x(a[2])+b%2/2);return a},J,Ja=document.documentMode===8?"visible":"",e="crisp",pa=Math,va=pa.sin,X=pa.cos,Ca=pa.atan2,x=pa.round,ma=pa.min,ta=pa.max,Aa=pa.abs,Ka=pa.ceil,bb=pa.floor,Va=pa.PI,Ra=Va/2,sa=2*Va,Ma=Va+Ra,Na=h.getFirstColor,
Wa=h.graphics.getDarkColor,Ta=h.graphics.getLightColor,r="rgba(192,192,192,"+(S?0.002:1.0E-6)+")",Fa=h.POSITION_TOP,$a=h.POSITION_BOTTOM,eb=h.POSITION_RIGHT,fb=h.POSITION_LEFT;m.ca.ishot=function(a){if(this.removed)return!1;var b=this.node,a=a||"";b.ishot=a;switch(this.type){case "group":for(b=this.bottom;b;)b.attr("ishot",a),b=b.next;break;case "text":if(m.svg)for(b=b.getElementsByTagName("tspan")[0];b;)b.ishot=a,b=b.nextSibling}return!1};m.addSymbol({printIcon:function(a,b,c){var d=c*0.75,e=c*0.5,
f=c*0.33,g=x(a-c)+0.5,h=x(b-c)+0.5,i=x(a+c)+0.5,c=x(b+c)+0.5,j=x(a-d)+0.5,k=x(b-d)+0.5,d=x(a+d)+0.5,l=x(b+e)+0.5,m=x(a+e)+0.5,n=x(b+f)+0.5,a=x(a-e)+0.5,f=x(b+f+f)+0.5;return["M",j,h,"L",d,h,d,k,j,k,"Z","M",g,k,"L",g,l,j,l,j,b,d,b,d,l,i,l,i,k,"Z","M",j,b,"L",j,c,d,c,d,b,"Z","M",m,n,"L",a,n,"M",m,f,"L",a,f]},exportIcon:function(a,b,c){var d=c*0.66,e=d*0.5,f=x(a-c)+0.5,g=x(b-c)+0.5,h=x(a+c)+0.5,c=x(b+c)-0.5,i=x(a-e)+0.5,j=b<c-3?c-3:x(b)+0.5,e=x(a+e)-0.5,k=x(a+d)-0.5,d=x(a-d)+0.5;return["M",f,j,"L",f,
c,h,c,h,j,h,c,f,c,"Z","M",a,c-1,"L",d,b,i,b,i,g,e,g,e,b,k,b,"Z"]}});h.rendererRoot=U("renderer.root",{standaloneInit:!1,isRenderer:!0,inited:!1,callbacks:[],init:function(a,b,c){var o;var d=this,e=d.container=b.chart.renderTo,f=b.tooltip,h=d.layer,i;d.options=b;d.logic=a;d.definition=a.dataObj;d.smartLabel=a.smartLabel;d.numberFormatter=a.numberFormatter;d.fusionCharts=a.chartInstance;d.linkClickFN=a.linkClickFN;e.innerHTML=B;o=d.paper=m(e,e.offsetWidth||a.width,e.offsetHeight||a.height),e=o;g.core.options._useSVGDescTag!==
!1&&e._desc&&(i=a.friendlyName||"Vector image",d.definition&&d.definition.chart&&d.definition.chart.caption&&(i+=' with caption "'+d.definition.chart.caption+'"'),e._desc(i));d.chartWidth=e.width;d.chartHeight=e.height;if(!d.elements)d.elements={};if(!h)h=d.layers={},h.background=h.background||e.group("background"),h.dataset=h.dataset||e.group("dataset").insertAfter(h.background),h.tracker=h.tracker||e.group("hot").insertAfter(h.dataset);f&&f.enabled!==!1&&e.tooltip(f.style,f.shadow,f.constrain);
d.setMargins();d.drawBackground();d.drawButtons();d.drawGraph();b.legend&&b.legend.enabled&&d.drawLegend();d.drawCaption();d.drawLogo();d.setChartEvents();d.drawLabels&&d.drawLabels();R(b.callbacks,function(a){a.apply(d,this)},[a]);R(d.callbacks,function(a){a.apply(d,this)},[a]);d.hasRendered=!0;c&&c(d)},reinit:function(a,b,c){this.hasRendered||this.init(b,c)},dispose:function(){this.disposing=!0;this.paper&&(this.paper.remove(),delete this.paper);this.exportIframe&&(this.exportIframe.parentNode.removeChild(this.exportIframe),
delete this.exportIframe);delete this.disposing;this.disposed=!0},onContainerClick:function(a){var b=a.target||a.originalTarget||a.srcElement||a.relatedTarget||a.fromElement,a=a.data;(!b||!b.ishot||!a)&&a.linkClickFN.call(a,a)},setChartEvents:function(){var a=this.options.chart.link,b=this.container;K(b,"click",this.onContainerClick);if(a)this.link=a,V(b,"click",this.onContainerClick,this);this.paper.canvas.style.cursor=m.svg?a&&"pointer"||"default":a&&"hand"||"default"},onOverlayMessageClick:function(){var a=
this.elements;m.animation({opacity:0},1E3);a.messageText&&a.messageText.hide();a.messageVeil&&a.messageVeil.hide()},showMessage:function(a,b){var c=this.paper,d=this.options.chart,e=this.elements,f=e.messageText,g=e.messageVeil,h=c.width,i=c.height;if(!g)g=e.messageVeil=c.rect(0,0,h,i).attr({fill:"rgba(0,0,0,0.2)",stroke:"none"});g.show().toFront().attr("cursor",b?"pointer":"default")[b?"click":"unclick"](this.onOverlayMessageClick,this);if(!f)f=e.messageText=c.text(h/2,i/2,B).attr({fill:"rgba(255,255,255,1)",
"font-family":"Verdana","font-size":10,"line-height":14,ishot:!0});a=a||B;this.smartLabel.setStyle({"line-height":"14px","font-family":"Verdana","font-size":"10px"});c=this.smartLabel.getSmartText(a,h-(d.spacingRight||0)-(d.spacingLeft||0),i-(d.spacingTop||0)-(d.spacingBotton||0));f.attr({text:c.text,ishot:!0,cursor:b?"pointer":"default"})[b?"click":"unclick"](this.onOverlayMessageClick,this).show().toFront()},drawButtons:function(){var a=this,b=a.logic.rendererId==="zoomline",c=a.paper,d=a.elements,
e=a.toolbar||(a.toolbar=[]),f=a.menus||(a.menus=[]),g=a.layers,h=a.options,i=h[aa],i=i&&i.outCanvasStyle||a.logic.outCanvasStyle||{},j=h.chart.toolbar||{},k=j.hDirection,l=b?1:j.vDirection,n=j.button||{};e.count=0;var s=n.scale,r=n.width*n.scale,q=n.height*n.scale,u=k*(n.spacing*n.scale+r),v=n.radius;e.y||(e.y=(b?0:j.y)+j.vMargin*l+ma(0,q*l));e.x||(e.x=j.x+j.hMargin*k-ta(0,r*k));var j=(b=h.exporting)&&b.buttons||{},h=j.exportButton&&j.exportButton.enabled!==!1,j=j.printButton&&j.printButton.enabled!==
!1,x,w=g.buttons||(g.buttons=c.group("buttons"));e.add=function(a,b,d){var d=typeof d==="string"?{tooltip:d}:d||{},f=e.count===0?u-k*n.spacing*n.scale:u,f=d.x||(e.x+=f),g=d.tooltip||"";e.push(a=c.button(f,d.y||e.y,J,a,{width:r,height:q,r:v,id:e.count++,verticalPadding:n.symbolHPadding*s,horizontalPadding:n.symbolHPadding},w).attr({ishot:!0,fill:[n.fill,n.labelFill,n.symbolFill,n.hoverFill],stroke:[n.stroke,n.symbolStroke],"stroke-width":[n.strokeWidth,n.symbolStrokeWidth]}).tooltip(g).buttonclick(b));
return a};if(h)f.push(x=d.exportMenu=C({chart:a,labels:{style:i,hover:{color:"rgba(255, 255, 255, 1)"}},attrs:{fill:"rgba(255, 255, 255, 1)"},hover:{fill:m.tintshade(i.color,0.7)},items:function(b){var c=[],d;for(d in b)c.push({text:b[d],onclick:function(b){return function(){a.logic.chartInstance.exportChart({exportFormat:b})}}(d)});return c}(b.exportformats)})),d.exportButton=e.add("exportIcon",function(a,b){return function(){x.visible?x.hide():x.show({x:a,y:b+1})}}(e.x+r,e.y+q),{tooltip:"Export chart"});
if(j)d.printButton=e.add("printIcon",function(){a.print()},{tooltip:"Print chart"})},setMargins:function(){var a=this.paper,b=this.options.chart||{};this.canvasBorderWidth=b.plotBorderWidth||0;this.canvasTop=x(b.marginTop)||0;this.canvasLeft=x(b.marginLeft)||0;this.canvasWidth=x(a.width-(b.marginLeft||0)-(b.marginRight||0));this.canvasHeight=x(a.height-(b.marginTop||0)-(b.marginBottom||0));this.canvasRight=this.canvasLeft+this.canvasWidth;this.canvasBottom=this.canvasTop+this.canvasHeight},drawBackground:function(){var a=
this.paper,b=this.layers,c=this.elements,d=b.background||(b.background=a.group("background")),b=c.background||(c.background=a.rect(d)),e=this.options.chart||{},g=s(e.borderWidth)||0,h=g*0.5,i=e.borderWidth||0,j=this.chartHeight,k=this.chartWidth,l=c.backgroundImage,m=e.bgSWF,r=e.bgSWFAlpha/100,q=e.bgImageDisplayMode,u=e.bgImageVAlign,v=e.bgImageHAlign,x=e.bgImageScale,w=i+","+i+","+(k-i*2)+","+(j-i*2),B,I,E,y,C,W,o;a.canvas.style.backgroundColor=e.containerBackgroundColor;b.attr({x:h,y:h,width:a.width-
g,height:a.height-g,stroke:e.borderColor,"stroke-width":g,fill:f(e.backgroundColor)});if(m)B=new Image,C=E=1,l=[],B.onload=function(){I=n(q,u,v,x,i,k,j,B);I["clip-rect"]=w;if(I.tileInfo){E=I.tileInfo.xCount;C=W=I.tileInfo.yCount;o=I.y;for(delete I.tileInfo;E;)if(W-=1,y?(l[void 0]=y.clone().attr({x:I.x,y:I.y}),d.appendChild(l[void 0])):l[void 0]=y=a.image(m,d).attr(I).css({opacity:r}),I.y+=I.height,W===0)W=C,E-=1,I.x+=I.width,I.y=o}else l[0]=a.image(m,d),l[0].attr(I).css({opacity:r}).attr({visibility:Ja,
"clip-rect":w})},B.src=m,c.backgroundImage=l},drawGraph:function(){var a=this,b=a.paper,d=a.plots=a.elements.plots,e=a.logic,f=a.layers,g=a.options,h=a.elements,i=g.chart,g=a.datasets=g.series,j=k(i.rendererId,i.defaultSeriesType),l=f.background,l=f.dataset=f.dataset||b.group("dataset").insertAfter(l);f.tracker=f.tracker||b.group("hot").insertAfter(l);var m,n;a.drawCanvas();a.drawAxes();if(!d)d=a.plots=a.plots||[],h.plots=d;f=0;for(h=g.length;f<h;f++){b=g[f]||{};l=b.updatePlot="updatePlot"+c(Y(b.type,
b.plotType,j));l=a[l];m=b.drawPlot="drawPlot"+c(Y(b.type,b.plotType,j));m=a[m]||a.drawPlot;if(!(n=d[f]))d.push(n={index:f,items:[],data:b.data||[],name:b.name,userID:b.userID,setVisible:function(a,b){return function(c){var f=d[a],g,h={hcJSON:{series:[]}},p=h.hcJSON.series[a]||(h.hcJSON.series[a]={}),i=e.chartInstance.jsVars._reflowData;g=(c=k(c,!f.visible))?"visible":"hidden";R(f.graphics,function(a){a.attr("visibility",g)});f.visible=c;b.visible=c;p.visible=c;G(i,h,!0)}}(f,b),legendClick:function(b){return function(c,
e){a["legendClick"+j]&&a["legendClick"+j](d[b],c,e)||a.legendClick&&a.legendClick(d[b],c,e)}}(f),realtimeUpdate:function(b,c,e){return function(f,g){c.call(a,d[b],e,{numUpdate:f,hasAxisChanged:g})}}(f,l||m,b)}),b.plot=n,b.legendClick=n.legendClick,b.setVisible=n.setVisible;m.call(a,n,b)}i.hasScroll&&(a.drawScroller(),a.finalizeScrollPlots())},drawPlot:$,drawCanvas:$,drawAxes:$,drawScroller:function(){},drawLegend:function(){var p;var a=this,b=a.options,d=a.paper,e=b.chart||{},f=b.legend,g=f.scroll,
b={elements:{}},h=b.elements,i=a.layers.legend,j=h.box,k=h.caption,l=h.elementGroup,n=f.layout==="vertical",s=e.marginTop,r=e.marginBottom,q=e.spacingBottom,u=e.spacingLeft,v=e.spacingRight,x=d.width,w=d.height,s=a.canvasTop,I=f.width,E=f.height,y=f.borderRadius,C=f.backgroundColor,W=f.borderColor,o=f.borderWidth||0,Q=o*0.5,D=o*0.5+2,e=O(f.padding,4),F=e*0.5,N,na,oa,J,M,ka,K;n?(n=x-v-I,s=s+(w-r-s-E)*0.5+(f.y||0)):(n=u+(x-u-v-I)*0.5+(f.x||0),s=w-q-E);r=m.crispBound(n,s,I,E,o);n=r.x;s=r.y;I=r.width;
E=r.height;if(!i)i=a.layers.legend=d.group("legend").insertBefore(a.layers.tracker).translate(n,s);f.legendAllowDrag&&(na=n,oa=s,i.css({cursor:"move"}).drag(function(a,b){J=ka+a;M=K+b;J+I+D>x&&(J=x-I-D);M+E+D>w&&(M=w-E-D);J<D&&(J=D);M<D&&(M=D);i.translate(J-na,M-oa);na=J;oa=M},function(){ka=na;K=oa}));if(!j)j=h.box=d.rect(i);j.attr({x:0,y:0,width:I,height:E,r:y,stroke:W,"stroke-width":o,fill:C||"none",ishot:f.legendAllowDrag}).shadow(f&&f.shadow);g&&g.enabled?(N=E-e,j=","+I+","+N,l=h.elementGroup=
d.group("legenditems",i).attr({"clip-rect":"0,"+F+j}),p=h.scroller||(h.scroller=d.scroller(I-10+F-o,Q,10,E-o,!1,{scrollPosition:g.scrollPosition||0,scrollRatio:(N+e)/f.totalHeight,showButtons:!1,displayStyleFlat:g.flatScrollBars},i)),g=p,g.attr("fill",f.legendScrollBgColor).scroll(function(b){l.transform(["T",0,(N-f.totalHeight)*b]);G(a.fusionCharts.jsVars._reflowData,{hcJSON:{legend:{scroll:{position:b}}}},!0)})):l=h.elementGroup=i;if(f.title&&f.title.text!==B){if(!k)k=h.caption=d.text(l);k.attr({text:f.title.text,
title:f.title.originalText||"",x:I*0.5,y:e,fill:f.title.style.color,"vertical-align":"top"}).css(f.title.style)}this["draw"+c(f.type||"point")+"LegendItem"](b)},drawPointLegendItem:function(a){var t;var p;var b=this.paper,c=this.options,d=c.series,e=c.chart.defaultSeriesType,c=c.legend,g=c.legendHeight,h=c.symbolPadding,i=c.textPadding||2,j=O(c.padding,4),k=c.itemHiddenStyle,l=c.itemStyle,m=l.color,k=k&&k.color||"#CCCCCC",n=c.symbolWidth,s=c.itemWidth,q=c.interactiveLegend!==!1,u=a.elements,v=u.elementGroup,
a=a.item=[],u=u.item=[],x=[],w={line:!0,spline:!0,scatter:!0,bubble:!0,dragnode:!0,zoomline:!0},I,E,y,B,C,o,D,ja,N,J,na,oa,M,ka;J=0;for(oa=d.length;J<oa;J+=1)if((y=d[J])&&y.showInLegend!==!1)if(o=y.type||e,y.legendType==="point"){y=y.data||[];na=0;for(ja=y.length;na<ja;na+=1)if(C=y[na]||{},C.showInLegend!==!1)C._legendType=o,x.push(C)}else switch(y._legendType=o,o){case "pie":case "pie3d":case "funnel":case "pyramid":x=y.data;break;default:x.push(y)}x.sort(function(a,b){return(a.legendIndex||0)-(b.legendIndex||
0)||a.__i-b.__i});c.reversed&&x.reverse();d=c.initialItemX||0;e=c.initialItemY||0;J=0;for(oa=x.length;J<oa;J+=1)if(x[J].showInLegend!==!1)if(na={elements:{},hiddenColor:k,itemTextColor:m},a.push(na),u.push(na.elements),I=x[J],D=d+I._legendX+j,ja=e+I._legendY-j,N=I._legendH,E=I._legendType||o,y=I.visible!==!1,B=na.itemLineColor=f(I.color||{}),C=q?function(a){return function(){a.legendClick()}}(I):F,I.plot.legend=na,na.elements.legendItemBackground=b.rect(D,ja,s,N,0,v).click(C).attr({fill:f(I.legendFillColor||
r),"stroke-width":1,stroke:f(I.legendBorderColor||"none"),cursor:l.cursor||"pointer",ishot:q}),na.elements.legendItemText=b.text(D+g+i-2,ja+(I._legendTestY||0),I.name,v).css(l).click(C).attr({fill:y?m:k,"vertical-align":"top","text-anchor":"start",cursor:l.cursor||"pointer",title:I.originalText||"",ishot:q}),w[E]){E=ja+h+n*0.5;if(I.lineWidth)ka=na.elements.legendItemLine=b.path(["M",D+h,E,"L",D+h+n,E],v).click(C).attr({"stroke-width":I.lineWidth,stroke:y?B:k,cursor:l.cursor||"pointer",ishot:q});if(I&&
(M=I.marker)&&M.enabled!==!1)na.symbolStroke=f(Y(M.lineColor&&(M.lineColor.FCcolor&&M.lineColor.FCcolor.color.split(",")[0]||M.lineColor),B)),M.fillColor&&M.fillColor.FCcolor?(E=G({},M.fillColor),E.FCcolor.alpha="100"):E=Y(M.fillColor,B),na.symbolColor=f(E),I=n*0.5,D=D+h+I,E=ja+h+I,ka&&(I*=0.6),ja=M.symbol.split("_"),B=ja[0]==="spoke"?1:0,p=ja[1]?na.elements.legendItemSymbol=b.polypath(ja[1],D,E,I,M.startAngle,B,v):na.elements.legendItemSymbol=b.circle(D,E,I,v),ja=p,ja.click(C).attr({cursor:l.cursor||
"pointer",stroke:y?na.symbolStroke:k,fill:y?na.symbolColor:k,"stroke-width":1,ishot:q})}else ja=this.getSymbolPath(D+h,ja+h,n,n,E,I),na.symbolColor=f(ja.color),na.symbolStroke=f(ja.strokeColor),t=na.elements.legendItemSymbol=b.path(ja.path,v).click(C).attr({"stroke-width":ja.strokeWidth,stroke:y?na.symbolStroke:k,fill:y?na.symbolColor:k,cursor:l.cursor||"pointer",ishot:q}),ja=t;c.reversed&&x.reverse()},drawCaption:function(){var o;var a=this.options.chart,b=this.options.title,c=this.options.subtitle,
d=this.paper,e=this.elements,f=this.layers,g=f.caption,h=e.caption,i=e.subcaption,j=b&&b.text,k=c&&c.text,l=(this.canvasLeft||0)+O(this.canvasWidth,d.width)/2,m=b.x,n=c&&c.x;if((j||k)&&!g)g=f.caption=d.group("caption"),f.tracker?g.insertBefore(f.tracker):g.insertAfter(f.dataset);if(j){if(!h)h=e.caption=d.text(g);if(m===void 0)m=l,b.align="middle";h.css(b.style).attr({text:b.text,fill:b.style.color,x:m,y:b.y||a.spacingTop||0,"text-anchor":b.align||"middle","vertical-align":"top",visibility:"visible",
title:b.originalText||""})}else if(h)o=e.caption=h.remove(),h=o;if(k){if(!i)i=e.subcaption=d.text(g);if(n===void 0)n=l,c.align="middle";i.css(c.style).attr({text:c.text,title:c.originalText||"",fill:c.style.color,x:n,y:j?h.attrs.y+h.getBBox().height+2:b.y||a.spacingTop||0,"text-anchor":c.align||"middle","vertical-align":"top",visibility:"visible"})}else if(i)e.subcaption=i.remove();if(!j&&!k&&g)f.caption=g.remove()},drawLogo:function(){var a=this.paper,b=this.elements,c=this.options,d=c.credits,e=
c.chart||{},f=e.borderWidth||0,g=this.chartHeight,h=this.chartWidth,i=b.logoImage,j=this.layers.tracker,k=e.logoURL,l=e.logoAlpha/100,m=e.logoPosition,s=e.logoLink,r=e.logoScale,q=e.logoLeftMargin,u=e.logoTopMargin,v=f+","+f+","+(h-f*2)+","+(g-f*2),c={tr:{vAlign:Fa,hAlign:eb},bl:{vAlign:$a,hAlign:fb},br:{vAlign:$a,hAlign:eb},cc:{vAlign:"middle",hAlign:"middle"}},x,w;this.logic&&d.enabled&&a.text().attr({text:d.text,x:6,y:g-4,"vertical-align":$a,"text-anchor":"start",fill:"rgba(0,0,0,0.5)",title:d.title||
""}).css({fontSize:9,fontFamily:"Verdana",cursor:"pointer",_cursor:"hand"}).click(function(){e.events.click.call({link:d.href})});if(k)x=new Image,(m=c[m])||(m={vAlign:Fa,hAlign:fb}),x.onload=function(){w=n("none",m.vAlign,m.hAlign,r,f,h,g,x);i=a.image(k);j.appendChild(i);w["clip-rect"]=v;i.attr(w).translate(q,u).css({opacity:l});s&&i.css({cursor:"pointer",_cursor:"hand"}).click(function(){e.events.click.call({link:s})})},x.src=k,b.logoImage=i},legendClick:function(a,b,c){var d=a.legend,e=d&&d.elements,
f=e&&e.legendItemText,h=e&&e.legendItemSymbol,e=e&&e.legendItemLine,i=d&&d.hiddenColor,j=d&&d.itemLineColor,k=d&&d.itemTextColor,l=d&&d.symbolColor,m=d&&d.symbolStroke,d=Y(b,!a.visible);a.setVisible(b);c!==!0&&(eventArgs={datasetName:a.name,datasetIndex:a.index,id:a.userID,visible:d},g.raiseEvent("legenditemclicked",eventArgs,this.logic.chartInstance));d?(h&&h.attr({fill:l||j,stroke:m}),f&&f.attr({fill:k}),e&&e.attr({stroke:j})):(h&&h.attr({fill:i,stroke:i}),f&&f.attr({fill:i}),e&&e.attr({stroke:i}));
if((a=this.datasets&&this.datasets[a.index]&&this.datasets[a.index].relatedSeries)&&a instanceof Array&&a.length>0)for(b=a.length;b--;)c=parseFloat(a[b]),(c=this.plots[c])&&c.legend&&c.legendClick.call(c,d,!1)},exportChart:function(a){var b=this.elements,c=b.printButton,d=b.exportButton,e=this.fusionCharts,f=e.id,i=this.paper,j=this.options,a=typeof a==="object"&&function(a){var b={},c;for(c in a)b[c.toLowerCase()]=a[c];return b}(a)||{},k=G(G({},j.exporting),a),l=(k.exportformat||"png").toLowerCase(),
a=k.exporthandler,m=(k.exportaction||B).toLowerCase(),b=k.exporttargetwindow||B,n=k.exportfilename,s=k.exportparameters,r;if(!j.exporting||!j.exporting.enabled||!a)return!1;c&&c.attrs.visibility!="hidden"&&c.attr({visibility:"hidden"});d&&d.attrs.visibility!="hidden"&&d.attr({visibility:"hidden"});j=i.toSVG();c&&c.attr({visibility:"visible"});d&&d.attr({visibility:"visible"});j=j.replace(/(\sd\s*=\s*["'])[M\s\d\.]*(["'])/ig,"$1M 0 0 L 0 0$2");l==="pdf"&&(j=j.replace(/<(\b[^<>s\s]+\b)[^\>]+?opacity\s*=\s*['"][^1][^\>]+?(\/>|>[\s\r\n]*?<\/\1>)/ig,
function(a,b){var c=D.exec(a)||B,d=M.exec(a)||B;return a+"<"+b+c+d+' opacity="1" stroke-opacity="1" fill="#cccccc" stroke-width="0" r="0" height="0.5" width="0.5" d="M 0 0 L 1 1" />'}));c={charttype:e.src,stream:j,stream_type:"svg",meta_bgColor:k.bgcolor||"",meta_DOMId:e.id,meta_width:i.width,meta_height:i.height,parameters:["exportfilename="+n,"exportformat="+l,"exportaction="+m,"exportparameters="+s].join("|")};if(m==="download"){if(/webkit/ig.test(navigator.userAgent)&&b==="_self"&&(b=d=f+"export_iframe",
!this.exportIframe))this.exportIframe=d=v("IFRAME",{name:d,width:"1px",height:"1px"},ia.body),d.style.cssText="position:absolute;left:-10px;top:-10px;";a=v("form",{method:"POST",action:a,target:b,style:"display:none;"},ia.body);for(r in c)v("input",{type:"hidden",name:r,value:c[r]},a);a.submit();ia.body.removeChild(a);a=void 0}else r=new g.ajax(function(a){var b={};a.replace(RegExp("([^?=&]+)(=([^&]*))?","g"),function(a,c,d,e){b[c]=e});h.raiseEvent("exported",b,e,[b])},function(a){a={statusCode:0,
statusMessage:"failure",error:a,DOMId:f,width:i.width,height:i.height};h.raiseEvent("exported",a,e,[a])}),r.post(a,c);return!0},print:function(){var a=this,b=a.container,c=a.elements,d=c.printButton,e=c.exportButton,f=[],g=b.parentNode,c=ia.body,h=c.childNodes;if(!a.isPrinting)a.isPrinting=!0,R(h,function(a,b){if(a.nodeType==1)f[b]=a.style.display,a.style.display="none"}),d&&d.attrs.visibility!="hidden"&&d.attr({visibility:"hidden"}),e&&e.attrs.visibility!="hidden"&&e.attr({visibility:"hidden"}),
c.appendChild(b),w.print(),setTimeout(function(){d&&d.attr({visibility:"visible"});e&&e.attr({visibility:"visible"});g.appendChild(b);R(h,function(a,b){if(a.nodeType==1)a.style.display=f[b]});a.isPrinting=!1},1E3)},getSymbolPath:function(a,b,c,d,e,f){var g=["M"],h,i,j,k;h=(f.color&&Na(typeof f.color==="string"?f.color:f.color.FCcolor.color)||B).replace(q,"");i=Ta(h,40);k=Wa(h,60).replace(q,u);h={FCcolor:{color:h+","+h+","+i+","+h+","+h,ratio:"0,30,30,30,10",angle:0,alpha:"100,100,100,100,100"}};switch(e){case "column":case "dragcolumn":case "column3d":i=
c*0.25;j=i*0.5;e=d*0.7;f=d*0.4;g=g.concat([a,b+d,"l",0,-e,i,0,0,e,"z","m",i+j,0,"l",0,-d,i,0,0,d,"z","m",i+j,0,"l",0,-f,i,0,0,f,"z"]);h.FCcolor.angle=270;break;case "bar":case "bar3d":i=c*0.3;j=c*0.6;e=d/4;f=e/2;g=g.concat([a,b,"L",a+j,b,a+j,b+e,a,b+e,"Z","M",a,b+e+f,"L",a+c,b+e+f,a+c,b+e+f+e,a,b+2*e+f,"Z","M",a,b+2*(e+f),"L",a+i,b+2*(e+f),a+i,b+d,a,b+d,"Z"]);break;case "area":case "area3d":case "areaspline":case "dragarea":e=d*0.6;f=d*0.2;d*=0.8;g=g.concat([a,b+d,"L",a,b+e,a+c*0.3,b+f,a+c*0.6,b+
e,a+c,b+f,a+c,b+d,"Z"]);h.FCcolor.angle=270;break;case "pie":case "pie3d":i=c/2;j=c*0.7;e=d/2;g=g.concat([a+i,b+e,"L",a+j,b,"A",i,e,0,0,0,a,b+e,"L",a+i,b+e,"M",a+i,b+e,"L",a,b+e,"A",i,e,0,0,0,a+j,b+d,"L",a+i,b+e,"M",a+i,b+e,"L",a+j,b+d,"A",i+1,e+1,0,0,0,a+j,b,"Z"]);break;case "boxandwhisker2d":g=g.concat([a,b,"L",a+c,b,a+c,b+d,a,b+d,"Z"]);h=f.color;k="#000000";break;default:g=g.concat([a,b,"L",a+c,b,a+c,b+d,a,b+d,"Z"]),h.FCcolor.angle=270,h.FCcolor.ratio="0,70,30"}return{path:g,color:h,strokeWidth:0.5,
strokeColor:k}}});var Sa=function(a,b,c,d){this.axisData=a||{};b=this.renderer=b;a=b.paper;this.globalOptions=b.options;var e=b.layers,b=c?"y-axis":"x-axis",f=this.layerAboveDataset=e.layerAboveDataset,g=this.layerBelowDataset=e.layerBelowDataset,e=f.bands||(f.bands=[]),h=e.length,i=g.bands||(g.bands=[]),j=i.length,k=f.lines||(f.lines=[]),l=k.length,m=g.lines||(g.lines=[]),n=m.length,f=f.labels||(f.labels=[]),s=f.length,g=g.labels||(g.labels=[]),r=g.length;this.isVertical=c;this.topBandGroup=this.topBandGroup||
a.group(b+"-bands",this.layerAboveDataset);this.belowBandGroup=this.belowBandGroup||a.group(b+"-bands",this.layerBelowDataset);e.push(this.topBandGroup);h&&e[h].insertAfter(e[h-1]);i.push(this.belowBandGroup);j&&i[j].insertAfter(i[j-1]);this.topLineGroup=this.topLineGroup||a.group(b+"-lines",this.layerAboveDataset);this.belowLineGroup=this.belowLineGroup||a.group(b+"-lines",this.layerBelowDataset);this.topLabelGroup=this.topLabelGroup||a.group(b+"-labels",this.layerAboveDataset);this.belowLabelGroup=
this.belowLabelGroup||a.group(b+"-labels",this.layerBelowDataset);k.push(this.topLineGroup);l&&k[l].insertAfter(k[l-1]);m.push(this.belowLineGroup);n&&m[n].insertAfter(m[n-1]);f.push(this.topLabelGroup);s&&f[s].insertAfter(f[s-1]);g.push(this.belowLabelGroup);r&&g[r].insertAfter(g[r-1]);this.isReverse=d;this.configure()};Sa.prototype={configure:function(){var a=this.axisData,b=this.renderer,c=this.isVertical,d=this.isReverse,e=b.options,f=e.chart,g=f.marginBottom,f=f.marginRight,h=b.canvasTop,i=b.canvasLeft,
j=this.min=a.min,j=this.span=(this.max=a.max)-j,i=this.startX=O(a.startX,i),h=this.startY=O(a.startY,h),k=this.endX=O(a.endX,b.canvasRight),a=this.endY=O(a.endY,b.canvasBottom);this.startPixel=d?c?a:k:c?h:i;c=this.pixelRatio=c?(a-h)/j:(k-i)/j;this.pixelValueRatio=d?-c:c;d=this.relatedObj={};d.marginObj={top:h,right:f,bottom:g,left:i};d.canvasObj={x:i,y:h,w:k-i,h:a-h,toX:k,toY:a};this.primaryOffset=this.secondaryOffset=0;this.cache={lowestVal:0,highestVal:0,indexArr:[],hashTable:{}};this.elements=
this.elements||{};if(this.belowBandGroup)b.elements.axes=b.elements.axes||{},b.elements.axes.belowBandGroup=this.belowBandGroup,e&&e.chart&&e.chart.hasScroll&&this.belowBandGroup.attr({"clip-rect":b.elements["clip-canvas"]});this.poi={}},draw:function(){var a=this.axisData,b=a&&a.plotLines||[],c=a&&a.plotBands||[],d=a&&a.showLine,e=a&&a.tickLength,f=a&&a.tickWidth;a&&a.title&&this.drawAxisName();b&&b.length>0&&this.drawPlotLine();c&&c.length>0&&this.drawPlotBands();!isNaN(e)&&e!=0&&!isNaN(f)&&f!=
0&&this.drawTicks();d&&this.drawLine()},scroll:function(){},setOffset:function(a,b){var c=h?this.startY:this.startX,d=h?this.endY:this.endX,e=this.cache.hashTable,f=this.primaryOffset=a||this.primaryOffset,g=this.secondaryOffset=b||this.secondaryOffset,h=this.isVertical,i,j,k,l=[this.topLabelGroup,this.belowLabelGroup,this.topLineGroup,this.belowLineGroup,this.topBandGroup,this.belowBandGroup],m,n,s;m=0;for(n=l.length;m<n;m+=1)if(k=l[m])i=h?g:f,j=h?f:g,k.attr({transform:"t"+i+","+j});if(!h)for(s in e)if(m=
parseFloat(s)+f,m<c||m>d){g=e[s];m=0;for(n=g.elements.length;m<n;m+=1)h=g.elements[m],h.attr("visibility")==="visible"&&h.attr({visibility:"hidden"})}else if(m>c&&m<d){g=e[s];m=0;for(n=g.elements.length;m<n;m+=1)h=g.elements[m],h.attr("visibility")==="hidden"&&h.attr({visibility:"visible"})}},update:function(){},drawTicks:function(){var a=this.axisData,b=this.renderer.paper,c=this.min,d=this.max,e=this.isVertical,f=this.layerBelowDataset,f=this.tickGroup=this.tickGroup||b.group("axis-ticks",f),g=
this.relatedObj.canvasObj,h=a.offset,i=a.opposite,j=a.showAxis,k=a.tickInterval,l=a.tickLength,m=a.tickWidth,a=a.tickColor,n=c;if(e&&j){c=this.getAxisPosition(c);e=this.getAxisPosition(d);g=!i?g.x-h:g.toX+h;for(b.path(["M",g,c,"L",g,e],f).attr({stroke:a,"stroke-width":m});bb(n)<=d;)h=this.getAxisPosition(n),c=!i?g-l:g+l,b.path(["M",g,h,"L",c,h],f).attr({stroke:a,"stroke-width":m}),n+=k}},getAxisPosition:function(a,b){var c;b?c=(a-this.startPixel)/this.pixelValueRatio+this.min:(a=this.axisData.reversed?
this.min+(this.max-a):a,c=this.startPixel+(a-this.min)*this.pixelValueRatio);return c},drawPlotLine:function(){for(var a=this.renderer,b=a.paper,c=this.isVertical,d=+!c,g=this.belowLineGroup,h=this.topLineGroup,j=this.belowLabelGroup,k=this.topLabelGroup,l=this.axisData.plotLines||[],m=this.lines=this.lines||[],n=this.labels=this.labels||[],s=this.relatedObj.canvasObj,q=this.globalOptions||{},u=this.elements||{},v=this.cache||{},x=v.hashTable,w=v.indexArr,C=c?this.startY:this.startX,D=c?this.endY:
this.endX,I=this.primaryOffset,E=parseFloat(a.canvasBorderWidth)||0,y,G=(a.tooltip||{}).enabled!==!1,W,o,Q,F,N,J,na,oa,M,ka,K,S,Y,fa,R,U,L=0,aa=0,V,Z,ma,X,$,ia,ua,xa,pa=q.chart.xDepth||0,sa,ya,Aa,va,Ha,Da,Ja,Ca,Ka,Ma,Ta,Va=ta(l.length,ta(m.length,n.length)),Sa,Na,Ra,Wa,v=[],Za,q=0;q<Va;q+=1){o=Q=F=null;X=J="visible";o=m[q];Q=n[q];Ka=(na=l[q])&&na.width;K=(y=na&&na.label)&&y.style;if(!o&&na){if(ya=na.zIndex>3?h:g,Ka>0.1)o=m[q]=b.path(ya).css(na.style),u.lines=u.lines||[],u.lines.push(o)}else if(!na&&
(o||Q))o&&o.remove(),Q&&Q.remove(),m&&(m[q]=null),n&&(n[q]=null),u&&u.lines&&(u.lines[q]=null),u&&u.labels&&(u.labels[q]=null);if(na){if(!Q&&y&&!na.stepped){if(y.text!=B&&y.text!=" "){Q=na.zIndex>=3?k:j;Q=n[q]=b.text(Q).css(K);if(o)o.label=Q;u.labels=u.labels||[];u.labels.push(Q)}}else if(Q)if(y)if(y.text===B||y.text===" ")Q.isRotationSet=!1,Q.remove(),delete Q,n&&(n[q]=null),u&&u.labels&&(u.labels[q]=null);else{if(na&&na.stepped)Q.isRotationSet=!1,Q.remove(),delete Q,n&&(n[q]=null),u&&u.labels&&
(u.labels[q]=null)}else Q.isRotationSet=!1,Q.remove(),delete Q,n&&(n[q]=null),u&&u.labels&&(u.labels[q]=null);if(!o&&!Q)o=Q=null;else if(na.value!==null){if(na)va=na.isVline,Ha=na.isTrend,Da=na.isGrid,W=na.tooltext,Ja=na.value,Ca=na.color,Ma=na.dashStyle,Ta=Ha?na.to:null,oa=na._isStackSum;if(y)M=y.text,ka=K&&K.color,fa=y.offsetScaleIndex||0,R=y.offsetScale,S=K&&K.fontSize,Y=K&&K.lineHeight,U=y.rotation,L=y.x||0,aa=y.y||0,V=y.align,Z=y.verticalAlign,ma=y.textAlign,sa=(sa=y&&y.borderWidth)?sa.indexOf("px")!==
-1?sa.replace("px",""):1:1;S&&(Na=S,Na.indexOf("px")!==-1&&(Na=Na.replace("px",""),Na=parseFloat(Na)));Y&&(Ra=Y,Ra.indexOf("px")!==-1&&(Ra=Ra.replace("px",""),Ra=parseFloat(Ra)));c?(K=this.getAxisPosition(Ja),N=Ha?this.getAxisPosition(Ta)||K:K,Aa=K!==N?!0:!1,ya=["M",s.x,K,"L",s.toX,N],va?a.logic.isBar&&(ua=a.yAxis[fa],!oa&&!isNaN(R)&&R>=0&&R<=1&&(R=ua.min+(ua.max-ua.min)*R),ia=ua.getAxisPosition(O(R,Ja))+L):ia=y?$=this.axisData.isOpposite||V==="right"?s.toX+L:s.x+L:$=this.axisData.isOpposite?s.toX:
s.x):($=Ha?this.getAxisPosition(Ja):this.getAxisPosition(Ja)||0,ia=Ha?this.getAxisPosition(Ta)||$:$,!Ha&&!va&&pa>0&&($+=pa,ia+=pa,D+=pa),Aa=$!==ia?!0:!1,ya=["M"+$,s.y,"L",ia,s.toY],J=$+I<C||$+I>D?"hidden":J,va?(ua=a.yAxis[fa],!oa&&!isNaN(R)&&R>=0&&R<=1&&(R=ua.min+(ua.max-ua.min)*(1-R)),K=ua.getAxisPosition(O(R,Ja))+aa,K-=E+parseFloat(sa)):this.axisData.opposite||Z==="top"&&!Da?(K=s.y+aa,Sa="bottom"):K=s.toY+aa,N=K);if(Q){if(y&&y.backgroundColor)y.labelBgClr=f({color:y.backgroundColor,alpha:y.backgroundOpacity*
100});if(y&&y.borderColor)y.labelBorderClr=f({color:y.borderColor,alpha:"100"});xa=Ha?V==="left"?K:N:N;ua=ia-+!va*d*pa;ua=ia-+!va*d*pa+d*(L||0);Wa=Na?Na*0.2:2;X=!c?ia+I<C||ia+I>D?"hidden":X:X;N=ma==="left"?"start":ma==="right"?"end":"middle";oa?(Sa="bottom",xa+=Na*0.4,v.push(Q)):d&&this.axisData.opposite?(Sa=$a,N=U?"start":"middle"):Sa=Z;/\n|<br\s*?\/?>/ig.test(M)&&!U&&Da&&(Sa=d&&this.axisData.opposite&&!U?"middle":Fa,xa-=Ra);Q.attr({transform:" "});Q.attr({text:M,fill:ka||Ca,"text-bound":y&&[y.labelBgClr,
y.labelBorderClr,sa,Wa],title:y&&(y.originalText||""),x:ua,y:xa,"text-anchor":N,"vertical-align":Sa,visibility:X});U&&Q.rotate(U,ua,xa);X=c?xa.toString():ia.toString();(y=x[X])?y.elements.push(Q):(y={counter:q,keyProp:X,elements:[Q]},x[X]=y,w.push(y))}o&&(o.attr({path:ca(ya,Ka),stroke:Ca,"stroke-width":Ka,"shape-rendering":!Aa&&Ka>=1?e:void 0,"stroke-dasharray":Ma?Ma:void 0,visibility:J}),G&&W&&Ka<i&&J&&(F=b.path(ya).attr({stroke:r,"stroke-width":i,ishot:!0})),F=F||o,G&&F.tooltip(W),X=c?K.toString():
$.toString(),(y=x[X])?y.elements.push(o):(y={counter:q,keyProp:X,elements:[o]},x[X]=y,w.push(y)));if(na&&na.isMinLabel)this.poi.min={label:Q,index:q,line:o};else if(na&&na.isMaxLabel)this.poi.max={label:Q,index:q,line:o};else if(na&&na.isZeroPlane)this.poi.zero={label:Q,index:q,line:o};o=Q=null}}}b=v.length;Za=O(a.options.plotOptions.series.animation.duration,0);if(b>0)for(q=0;q<b;q+=1)(a=v[q])&&function(a){a.hide();setTimeout(function(){a.show()},Za)}(a)},drawPlotBands:function(){var a=this.renderer,
b=a.paper,c=this.isVertical,d=a.options.chart.hasScroll,e=this.belowBandGroup,g=this.topBandGroup,h=this.belowLabelGroup,i=this.topLabelGroup,j=this.axisData.plotBands||[],k=this.bands=this.bands||[],l=this.bandLabels=this.bandLabels||[],m=this.relatedObj.canvasObj,n=this.elements||{},s=this.cache||{},q=s.hashTable,s=s.indexArr,r=c?this.startY:this.startX,u=c?this.endY:this.endX,v=this.primaryOffset,a=(a.tooltip||{}).enabled!==!1,x,w,E,y,B,C,o,D,G,F,N,J,M,K,ka,R,S,Y,fa,U,aa,L,V,X,Z,ma,ca,$,ia,ua,
xa,pa,sa,ya,va=ta(j.length,k.length);for(ya=0;ya<va;ya+=1){w=y="visible";E=k[ya];B=l[ya];M=(J=(C=j[ya])&&C.label)&&J.style;if(!E&&C){if(E=C.zIndex>3?g:e,pa=C.zIndex>3?i:h,E=k[ya]=b.rect(E),n.bands=n.bands||[],n.bands[ya]=E,J&&J.text)B=l[ya]=E.label=b.text(pa).css(M),n.labels=n.labels||[],n.labels[ya]=B}else if(!C&&E){n.labels&&(l[ya]=n.labels[ya]=null);E.label&&E.label.remove();k[ya]=n.bands[ya]=null;E.remove();delete E;continue}if(C)x=C.tooltext,o=C.to,D=C.from,G=C.value,F=C.width,N=C.color;if(J)Y=
M&&M.fontSize,fa=M&&M.lineHeight,K=J.borderWidth,ka=J.align,R=J.x,S=J.y,L=J.text,V=J.originalText,X=M&&M.color,Z=J.backgroundColor,ma=J.backgroundOpacity,ca=J.borderColor,U=J.textAlign,aa=J.verticalAlign,$=J.borderType;Y&&(C=Y,C.indexOf("px")!==-1&&(C=C.replace("px",""),parseFloat(C)));fa&&(C=fa,C.indexOf("px")!==-1&&(C=C.replace("px",""),parseFloat(C)));sa=this.getAxisPosition(O(o,G));xa=this.getAxisPosition(O(D,G));M=c?m.x:xa;C=c?sa:m.y;pa=c?m.w:(!this.axisData.reversed?sa-xa:xa-sa)||F||1;sa=c?
xa-sa||1:m.h;xa=M+pa;pa=Aa(pa);sa<0&&(sa=Aa(sa),C-=sa);y=d?!0:!c?M+v>u||xa+v<r?"hidden":y:y;E&&(E.attr({x:M,y:C,width:pa,height:sa,fill:f(N),"stroke-width":0,visibility:y}),a&&x&&E.tooltip(x));if(B&&J){(y=K)&&y.indexOf("px")!==-1&&y.replace("px","");y=c?ka==="right"?m.toX+R:m.x+R:M+pa/2;E=c?C+sa/2:m.toY+S;w=!c?y+v<r||y+v>u?"hidden":w:w;if(Z)ia=J.labelBgClr=f({color:Z,alpha:ma*100});if(ca)ua=J.labelBorderClr=f({color:ca,alpha:"100"});U=U==="left"?"start":U==="right"?"end":"center";B.attr({text:L,title:V||
"",fill:X,"text-bound":[ia,ua,K,Y*0.2,$==="solid"?!1:!0],x:y,y:E,"text-anchor":U,"vertical-align":aa,visibility:w});J=c?E.toString():y.toString();(w=q[J])?w.elements.push(B):(w={counter:ya,keyProp:J,elements:[B]},q[J]=w,s.push(w))}}},drawAxisName:function(){var o;var a=this.axisData,b=a.title||{},c=b&&b.style,d=b.align,e=b.centerYAxisName||!1,g=this.renderer.paper,h=this.isVertical,i=this.relatedObj.canvasObj,j=O(a.offset,0)+O(b.margin,0),k=b.text||"",l=this.name||void 0,a=a.opposite,m=this.layerBelowDataset,
m=m.nameGroup=m.nameGroup||g.group("axis-name",m),n=O(b.rotation,!a?270:90),s=h?a?i.toX+j:i.x-j:(i.x+i.toX)/2,q,r,u,v,x;if(c)r=c.color,u=f({color:c.backgroundColor,alpha:100}),v=f({color:c.borderColor,alpha:100}),(o=(c=c.border)&&c.split(" "),c=o)&&c.length>0&&(x=c[0].indexOf("px")!=-1?parseFloat(c[0].replace("px","")):parseFloat(c[0]));e=h?d==="low"?i.toY:e?(i.y+i.toY)/2:this.renderer.chartHeight/2:i.toY+j;!l&&k?l=this.name=g.text(m).css(b.style):!k&&l&&l.remove();if(!isNaN(n)&&n&&h)q=b.style.fontSize,
q=q.indexOf("px")!=-1?q.replace("px",""):q,s=a?s+parseFloat(q):s-parseFloat(q);l&&l.attr({text:k,title:b.originalText||"",fill:r||"#000000","text-bound":[u,v,x,q*0.1],"text-anchor":d==="low"?!a?"start":"end":"middle","vertical-align":h?!n?"middle":"top":a?$a:"top",transform:h?"t"+s+","+e+"r"+n:"t"+s+","+e});this.elements.name=l},drawLine:function(){var a=this.axisData,b=this.renderer.paper,c=this.min,d=this.max,e=this.isVertical,f=a.opposite,g=this.layerBelowDataset,g=this.lineGroup=this.lineGroup||
b.group("axis-lines",g),h=a.lineColor,a=a.lineThickness,i=this.relatedObj.canvasObj,j;e?(c=this.getAxisPosition(c),d=this.getAxisPosition(d),e=j=!f?i.x:i.toX):(e=i.x,j=i.toX,c=d=!f?i.toY:i.y);this.elements.axisLine=b.path(["M",e,c,"L",j,d],g).attr({stroke:h,"stroke-width":a})},realtimeUpdateX:function(a){if(a>0){for(var b=this.axisData.plotBands,c=this.min+a,d,e=b.length;e--;)if((d=b[e])&&!d.isNumVDIV)d.value<c||d.from<c||d.to<c?b.splice(e,1):(d.value!==void 0&&(d.value-=a),d.from!==void 0&&(d.from-=
a),d.to!==void 0&&(d.to-=a));this.drawPlotLine();this.drawPlotBands()}},realtimeUpdateY:function(a,b){var c=this.axisData,d=this.min=c.min=a,c=this.span=(this.max=c.max=b)-d,c=this.pixelRatio=this.isVertical?this.relatedObj.canvasObj.h/c:this.relatedObj.canvasObj.w/c;this.pixelValueRatio=this.isReverse?-c:c;this.drawPlotLine();this.drawPlotBands()}};Sa.prototype.constructor=Sa;var Za=function(a,b,c,d){return Ca(b-c[1]-d.top,a-c[0]-d.left)};U("renderer.cartesian",{drawCanvas:function(){var p;var a=
this.options.chart||{},c=a.plotBackgroundColor,d=this.paper,e=this.elements,g=e.canvas,h=e.canvas3DBase,i=e.canvas3dbaseline,h=e.canvasBorder,j=e.canvasBg,k=this.canvasTop,l=this.canvasLeft,n=this.canvasWidth,s=this.canvasHeight,r=O(a.plotBorderRadius,0),j=a.plotBorderWidth,v=j*0.5,x=a.plotBorderColor,w=a.isBar,C=a.is3D,B=a.use3DLighting,D=a.showCanvasBg,I=a.canvasBgDepth,E=a.showCanvasBase,y=a.canvasBaseColor3D,G=a.canvasBaseDepth,F=a.plotShadow,o=b&&j===0&&F&&F.enabled,Q=a.xDepth||0,a=a.yDepth||
0,J=this.layers,M=J.background,N=J.dataset;J.tracker=J.tracker||d.group("hot").insertAfter(N);J.datalabels=J.datalabels||d.group("datalabels").insertAfter(N);p=J.canvas=J.canvas||d.group("canvas").insertAfter(M),J=p;if(!h)e.canvasBorder=d.rect(l-v,k-v,n+j,s+j,r,J).attr({"stroke-width":j,stroke:x,"stroke-linejoin":j>2?"round":"miter"}).shadow(F);e["clip-canvas"]=[ta(0,l-Q),ta(0,k-a),ta(1,n+Q*2),ta(1,s+a*2)];e["clip-canvas-init"]=[ta(0,l-Q),ta(0,k-a),1,ta(1,s+a*2)];if(C){if(D)j=w?e.canvasBg=d.path(["M",
l,",",k,"L",l+I*1.2,",",k-I,",",l+n-I,",",k-I,",",l+n,",",k,"Z"],J):e.canvasBg=d.path(["M",l+n,",",k,"L",l+n+I,",",k+I*1.2,",",l+n+I,",",k+s-I,",",l+n,",",k+s,"Z"],J),j.attr({"stroke-width":0,stroke:"none",fill:f(c)});if(E){h=w?e.canvas3DBase=d.cubepath(l-Q-G-1,k+a+1,G,s,Q+1,a+1,J):e.canvas3DBase=d.cubepath(l-Q-1,k+s+a+1,n,G,Q+1,a+1,J);h.attr({stroke:"none","stroke-width":0,fill:[y.replace(q,u),!B]});if(!i)i=e.canvas3dbaseline=d.path(void 0,J);i.attr({path:w?["M",l,k,"V",s+k]:["M",l,k+s,"H",n+l],
stroke:m.tintshade(y.replace(q,u),0.05).rgba})}}if(!g&&c)e.canvas=d.rect(l,k,n,s,r,J).attr({"stroke-width":0,stroke:"none",fill:f(c)}).shadow(o)},drawAxes:function(){var a=this.logic,b=this.options,c=this.paper,d=this.layers,e=d.dataset,f=d.layerBelowDataset=d.layerBelowDataset||c.group("axisbottom"),g=d.layerAboveDataset=d.layerAboveDataset||c.group("axistop"),c=this.xAxis=[],d=this.yAxis=[];f.insertBefore(e);g.insertAfter(e);if(b.xAxis&&b.xAxis.length){e=0;for(f=b.xAxis.length;e<f;e+=1)c[e]=this.xAxis[e]=
new Sa(b.xAxis[e],this,a.isBar)}else c[0]=this.xAxis[0]=new Sa(b.xAxis,this,a.isBar);if(b.yAxis){e=0;for(f=b.yAxis.length;e<f;e+=1)d[e]=this.yAxis[e]=new Sa(b.yAxis[e],this,!a.isBar,!a.isBar)}e=0;for(f=d.length;e<f;e+=1)d[e].draw();e=0;for(f=c.length;e<f;e+=1)c[e].draw()},drawScroller:function(){var a=this,b=a.options,c=a.paper,d=a.layers,e=a.xAxis["0"]||{},f=(e.axisData||{}).scroll||{},g=a.canvasTop,h=a.canvasLeft,i=a.canvasWidth,j=a.canvasHeight,k=ma(a.canvasBorderWidth,2),l,m,n,s,q,r,u,v,w,E,y,
C,B,o,D,F=d.dataset,J=d.datalabels,M=d.tracker;s=d.layerAboveDataset;var N,K;if(f.enabled)N=d.scroll=d.scroll||c.group("scroll").insertAfter(s),s=f.scrollRatio,b=O(b[aa].xAxisScrollPos,f.startPercent),q=f.viewPortMax,r=f.viewPortMin,m=f.vxLength,u=Ka(m),v=f.buttonWidth,w=f.height,E=f.padding,y=f.color,C=f.flatScrollBars,m=f.windowedCanvasWidth=e.getAxisPosition(m),l=f.fullCanvasWidth=e.getAxisPosition(q-r)-m,n=x(b*l),B=a.fusionCharts.jsVars._reflowData,o={hcJSON:{_FCconf:{xAxisScrollPos:0}}},D=o.hcJSON._FCconf,
d.scroller=c.scroller(h-k,g+j+E,i+k*2,w,!0,{showButtons:!0,displayStyleFlat:C,buttonWidth:v,scrollRatio:s,scrollPosition:b},N).data("fullCanvasWidth",l).data("windowedCanvasWidth",m).attr({"scroll-display-style":C,fill:y}).scroll(function(b){n=-x(b*l);F&&F.transform(["T",n,0]);J&&J.transform(["T",n,0]);M&&M.transform(["T",n,0]);e.setOffset&&e.setOffset(n);scrollStateObj={position:b,direction:b-f.lastPos||0,vxLength:u};D.xAxisScrollPos=f.lastPos=b;G(B,o,!0);if(scrollStateObj.direction!==0)for(K=0;K<
a.datasets.length;K++)a[a.datasets[K].drawPlot+"Scroll"]&&a[a.datasets[K].drawPlot+"Scroll"].call(a,a.plots[K],a.datasets[K],scrollStateObj)});return f.enabled},finalizeScrollPlots:function(){var a=this,b=a.container,c=a.elements,d=a.layers,e=d.scroller,f=d.dataset,g=d.datalabels,d=d.tracker,i,k={},l,m=a.xAxis["0"]||{},n=(m.axisData||{}).scroll||{},s=O(a.options[aa].xAxisScrollPos,n.startPercent),q=n.fullCanvasWidth;n.enabled&&(f.attr({"clip-rect":c["clip-canvas"]}),g.attr({"clip-rect":c["clip-canvas"]}),
d.attr({"clip-rect":c["clip-canvas"]}),c=function(b){var c=a.elements.canvas,d=i.left,f=i.top,g=b.type,t=j&&h.getTouchEvent(b)||fa,d=b.layerX||t.layerX||(b.pageX||t.pageX)-d,b=b.layerY||t.layerY||(b.pageY||t.pageY)-f;switch(g){case "dragstart":l=c.isPointInside(d,b);k.ox=l&&d||null;if(!l)return!1;break;case "dragend":l=!1;k={};break;default:if(!l)break;c=d-k.ox;k.ox=d;k.scrollPosition=e.attrs["scroll-position"]-c/q;e.attr({"scroll-position":k.scrollPosition})}},j&&(i=h.getPosition(b),b&&(K(b,"dragstart drag dragend",
c),V(b,"dragstart drag dragend",c))),s>0&&(b=-x(s*q),f&&f.transform(["T",b,0]),g&&g.transform(["T",b,0]),d&&d.transform(["T",b,0]),m.setOffset&&m.setOffset(b)))},drawPlotColumn:function(a,b,d){var e=this,g=a.data,h=g.length,j=a.items,k=a.graphics||(a.graphics=[]),l=e.paper,n=e.logic,q=e.layers,u=e.options,v=e.elements,w=u.chart,C=(u.tooltip||{}).enabled!==!1,B=e.definition.chart,D=u.plotOptions.series,G=e.xAxis[b.xAxis||0],F=e.yAxis[b.yAxis||0],I=F.axisData.reversed,E=n.isLog,y=n.is3D,ha=n.isStacked,
W=n.isWaterfall,o=n.isCandleStick,Q=Y(G.axisData.scroll,{}),M=d||{},K=Q.enabled,u=O(M.position,u[aa].xAxisScrollPos,Q.startPercent),R=M.vxLength||Ka(Q.vxLength),na=M.scrollStart||ta(0,x((h-R)*u)-1)||0,M=M.scrollEnd||ma(h,na+R+2)||h,Q=w.canvasBorderOpacity=m.color(w.plotBorderColor).opacity,u=e.canvasBorderWidth,Q=w.isCanvasBorder=Q!==0&&u>0,oa;c(n.name);var n=d!==J?0:isNaN(+D.animation)&&D.animation.duration||D.animation*1E3,S=b.numColumns||1,fa=b.columnPosition||0,u=w.use3DLighting,U=b.visible===
!1?"hidden":"visible",V=w.overlapColumns,X=G.getAxisPosition(0),X=G.getAxisPosition(1)-X,Z=B&&B.plotspacepercent,ca=O(B&&B.plotpaddingpercent),B=D.groupPadding,Ga=D.maxColWidth,B=(1-Z*0.01)*X||ma(X*(1-B*2),Ga*S),Z=B/2;B/=S;var L=ma(B-1,S>1?!V&&ca===J?4:ca>0?B*ca/100:0:0),fa=fa*B-Z+L/2,Oa=F.max,$=F.min,S=Oa>0&&$>=0,V=Oa<=0&&$<0,ca=Oa>0&&$<0,Z=V||I&&S?Oa:E||S?$:0;oa=F.yBasePos=F.getAxisPosition(Z);var Ga=O(w.useRoundEdges,0),ia=D.dataLabels.style,La=q.dataset=q.dataset||l.group("dataset-orphan"),pa=
q.datalabels=q.datalabels||l.group("datalabels").insertAfter(La),q=q.tracker,sa=e.canvasTop,va=e.canvasLeft,ua=e.canvasWidth,xa=e.canvasBottom,Ja=e.canvasRight,Ca,ya,Ua;parseInt(ia.lineHeight,10);var Ya,Ha,Da,Fa,Ma,Na;!d&&pa.hide();B-=L;K&&na>M-R-2&&(na=ta(0,M-R-2));if(ha)Na=La.shadows||(La.shadows=l.group("shadows",La).toBack());L=La.column||(La.column=l.group("columns",La));!o&&!y&&!K&&(L.attrs["clip-rect"]||L.attr({"clip-rect":v["clip-canvas"]}));W&&L.toBack();if(y){ya=w.xDepth||0;Ua=w.yDepth||
0;d=L.negative=L.negative||l.group("negative-values",L);R=L.column=L.column||l.group("positive-values",L);Fa=L.zeroPlane;if(!Fa&&$<0&&Oa>=0)Fa=L.zeroPlane=l.group("zero-plane",L).insertBefore(R),Ca=w.zeroPlaneColor,v.zeroplane=l.cubepath(va-ya,oa+Ua,ua,1,ya,Ua,Fa).attr({fill:[Ca,!u],stroke:"none","stroke-width":1});if(!(Fa=d.data("categoryplots")))d.data("categoryplots",Array(h)),Fa=d.data("categoryplots");if(!(Ca=R.data("categoryplots")))R.data("categoryplots",Array(h)),Ca=R.data("categoryplots");
for(v=0;v<h;v+=1)Fa[v]=Fa[v]||l.group(d),Ca[v]=Ca[v]||l.group(R)}else Ma=L;for(v=na;v<M;v+=1){w=g[v];na=w.y;h=w.toolText;d=R=null;if(na===null){if(ia=j[v])d=ia.graphic,y||d.attr({height:0})}else{Ya=!1;$=O(w.x,v);Ha=w.link;Oa=s(w.borderWidth)||0;La=w._FCW*X;$=G.getAxisPosition(w._FCX)||G.getAxisPosition($)+fa;ia=w.previousY;Da=F.getAxisPosition(ia||Z);ua=F.getAxisPosition(na+(ia||0));L=Aa(ua-Da);La=La||B;if(y){na<0&&(ua=Da,Ya=!0);Ma=na<0?Fa:Ca;if(!(ia=j[v]))ia=j[v]={index:v,value:na,graphic:l.cubepath(Ma[v]),
dataLabel:null,tracker:null,hot:null};d=ia.graphic;d.attr({cubepath:[$-ya,oa+Ua,La,0,ya,Ua],fill:[f(w.color),!u],stroke:Oa&&f(w.borderColor)||"NONE","stroke-width":Oa,visibility:U}).shadow(D.shadow&&w.shadow,Na).animate({cubepath:[$-ya,ua+Ua,La,L,ya,Ua]},n,"normal",function(){pa.show()}).data("BBox",{height:L,width:La,x:$,y:ua});if(Ha||C){!ha&&L<i&&(ua-=(i-L)/2,L=i);if(!ia.tracker)ia.tracker=l.cubepath(q);R=ia.tracker;R.attr({cubepath:[$-ya,ua+Ua,La,L,ya,Ua],cursor:Ha?"pointer":"",stroke:Oa&&r||"NONE",
"stroke-width":Oa,fill:r,ishot:!!Ha,visibility:U}).click(function(){var a=this.data("link");a&&e.linkClickFN.call({link:a},e)}).tooltip(h).data("link",Ha);R._.cubetop.click(function(){var a=this.data("link");a&&e.linkClickFN.call({link:a},e)}).tooltip(h).data("link",Ha);R._.cubeside.click(function(){var a=this.data("link");a&&e.linkClickFN.call({link:a},e)}).tooltip(h).data("link",Ha)}ha&&Ya&&(d.toBack(),R&&R.toBack())}else{Ya=!1;if(!E&&!I&&na<0||!E&&I&&na>0)ua=Da,Ya=!0;I&&!ca&&na>0&&(ua=Da-L,Ya=
!1);W&&na<0&&N(ia)&&(ua-=L,Ya=!0);!o&&!K&&(ka(ua)<=sa&&(L-=sa-ua-+Q,ua=sa-+Q),x(ua+L)>=xa&&(L-=x(ua+L)-xa+ +!!Oa+ +Q),Oa<=1&&(x($)<=va&&(La+=$,$=va-Oa/2+ +!!Oa-+Q,La-=$),x($+La)>=Ja&&(La=Ja-$+Oa/2-+!!Oa+ +Q)));Da=m.crispBound($,ua,La,L,Oa);$=Da.x;ua=Da.y;La=Da.width;L=Da.height;if(!o&&Q&&(!N(ia)||W&&ia===na&&na===w._FCY))if(V&&!I&&!E)oa=ua-(sa-Oa/2),L+=oa,oa=ua-=oa;else if(E||S||I&&V)L=xa-ua+Oa/2,oa=ua+L;W&&ia&&Oa>0&&D.connectorOpacity!==0&&D.connectorWidth===1&&D.connectorDashStyle&&(L-=1,na<0&&
(ua+=1));L<=1&&(L=1,ua+=na<0?0:-L);b._columnWidth=La;if(!(ia=j[v]))if(ia=j[v]={index:v,value:na,width:La,graphic:l.rect(Ma),valueBelowPlot:Ya,dataLabel:null,tracker:null},d=ia.graphic,d.attr({x:$,y:oa,width:La,height:0,r:Ga,fill:f(w.color),stroke:f(w.borderColor),"stroke-width":Oa,"stroke-dasharray":w.dashStyle,"stroke-linejoin":"miter",visibility:U}).shadow(D.shadow&&w.shadow,Na).animate({y:ua,height:L||1},n,"normal",function(){pa.show()}).data("BBox",Da),Ha||C){if(!ia.tracker)ia.tracker=l.rect(q);
!ha&&L<i&&(ua-=(i-L)/2,L=i);R=ia.tracker;R.attr({x:$,y:ua,width:La,height:L,r:Ga,cursor:Ha?"pointer":"",stroke:r,"stroke-width":Oa,fill:r,ishot:!!Ha,visibility:U}).click(function(){var a=this.data("link");a&&e.linkClickFN.call({link:a},e)}).tooltip(h).data("link",Ha)}}Ha=e.drawPlotColumnLabel(a,b,v,$,ua)}Ha&&k.push(Ha);d&&k.push(d);R&&k.push(R);e.drawTracker&&e.drawTracker.call(e,a,b,v)}a.visible=b.visible!==!1;return a},drawPlotColumnScroll:function(a,b,c){var d=a.data.length,e=a.items,f;f=c.vxLength;
var g=ta(0,x((d-f)*c.position)-1)||0,d=ma(d,g+f+2)||d;g>d-f-2&&(g=ta(0,d-f-2));c.scrollEnd=d;for(f=g;f<d;f++)if(!e[f]){c.scrollStart=f;this.drawPlotColumn(a,b,c);break}},drawPlotColumnLabel:function(a,b,c,d,e,f){var o;var d=this.options,g=this.logic,h=d.chart,i=this.paper,j=this.layers,d=d.plotOptions.series.dataLabels.style,k=h.rotateValues===1?270:0,l=this.canvasHeight,m=this.canvasTop,n=a.data[c],s=a.items[c],q=h.valuePadding+2,r=s.graphic,a=s.dataLabel,c=Y(s.valueBelowPlot,n.y<0),u=g.isStacked,
g=g.is3D,v=h.xDepth||0,w=h.yDepth||0,x=n.displayValue,b=b.visible===!1?"hidden":"visible",y=h.placeValuesInside,h=!1,f=f||j.datalabels;N(x)&&x!==B&&n.y!==null?(a?k&&a.rotate(360-k):(a=s.dataLabel=i.text().attr({text:x}).css(d),h=!0),j=a.getBBox(),r=r.data("BBox"),i=r.height,o=s=k?j.width:j.height,j=o,j+=q,q=s*0.5+q,r=r.x+r.width*0.5,l=c?m+l-(e+i):e-m,u?(e=e+i*0.5+(w||0),r-=v):y?i>=j?(e+=c?i-q:q,n._valueBelowPoint=1,g&&(r-=v,e+=w)):l>=j?(e+=c?i+q:-q,g&&c&&(r-=v,e+=w)):(e+=c?i-q:q,n._valueBelowPoint=
1,g&&(r-=v,e+=w)):l>=j?(e+=c?i+q:-q,g&&c&&(r-=v,e+=w)):(e+=c?i-q:q,n._valueBelowPoint=1,g&&(r-=v,e+=w)),a.attr({x:r,y:e,visibility:b}),k&&a.attr("transform","T0,0,R"+k),h&&f.appendChild(a),h&&Y(d.backgroundColor,d.borderColor)!==B&&a.attr({"text-bound":[d.backgroundColor,d.borderColor,1,2]})):a&&a.attr({text:B});return a},drawPlotFloatedcolumn:function(a,b){this.drawPlotColumn.call(this,a,b)},drawPlotColumn3d:function(a,b){this.drawPlotColumn.call(this,a,b)},drawPlotBar:function(a,b){var d=this,e=
a.data,g=e.length,h=a.items,j=a.graphics=[],k=d.paper,l=d.logic,n=d.layers,q=d.options,u=d.elements,v=q.chart,w=(q.tooltip||{}).enabled!==!1,B,C=d.definition.chart,q=q.plotOptions.series,D=d.xAxis[b.xAxis||0],G=d.yAxis[b.yAxis||0],F=l.is3D,I=l.isStacked,E=v.canvasBorderOpacity=m.color(v.plotBorderColor).opacity,y=d.canvasBorderWidth,E=v.isCanvasBorder=E!==0&&y>0;c(l.name);var l=isNaN(+q.animation)&&q.animation.duration||q.animation*1E3,M=b.numColumns||1,W=b.columnPosition||0,y=v.use3DLighting,o=b.visible===
!1?"hidden":"visible",Q=v.overlapColumns,N=D.getAxisPosition(0),N=D.getAxisPosition(1)-N,K=C&&C.plotspacepercent,C=O(C&&C.plotpaddingpercent),R=q.groupPadding,n=q.maxColWidth,K=(1-K*0.01)*N||ma(N*(1-R*2),n*M),N=K/2;K/=M;var Q=ma(K-1,M>1?!Q&&C===J?4:C>0?K*C/100:0:0),M=K-Q,W=W*K-N+Q/2,S=G.max,oa=G.min,Q=S<0&&oa<0?S:S>0&&oa>0?oa:0,C=G.getAxisPosition(Q),N=O(v.useRoundEdges,0),Y=d.canvasTop,K=d.canvasLeft,fa=d.canvasHeight,R=d.canvasRight,U,aa,V,Z,X,ca,L,$,ia,n=d.layers;X=n.dataset=n.dataset||k.group("dataset-orphan");
var sa=n.datalabels=n.datalabels||k.group("datalabels").insertAfter(X),n=n.tracker,pa,ta,va,Ca,ua;sa.hide();if(I)Ca=X.shadows||(X.shadows=k.group("shadows",X).toBack());L=X.column=X.column||k.group("bars",X);if(F){U=v.xDepth||0;aa=v.yDepth||0;X=L.negative=L.negative||k.group("negative-values",L);ca=L.column=L.column||k.group("positive-values",L);ta=L.zeroPlane;if(!ta&&oa<0&&S>=0)ta=L.zeroPlane=k.group("zero-plane",L).insertBefore(ca),ia=v.zeroPlaneColor,u.zeroplane=k.cubepath(C-U,Y+aa,1,fa,U,aa,ta).attr({fill:[ia,
!y],stroke:"none","stroke-width":0});if(!(ta=X.data("categoryplots")))X.data("categoryplots",Array(g)),ta=X.data("categoryplots");if(!(ia=ca.data("categoryplots")))ca.data("categoryplots",Array(g)),ia=ca.data("categoryplots");for(u=0;u<g;u+=1)ta[u]=ta[u]||k.group(X),ia[u]=ia[u]||k.group(ca)}else L.attrs["clip-rect"]||L.attr({"clip-rect":u["clip-canvas"]}),va=L;u=0;for(Y=g-1;u<g;u+=1,Y-=1){fa=e[u];S=fa.y;pa=oa=null;if(S===null){if(Z=h[u])pa=Z.graphic,F||pa.attr({width:0})}else{L=O(fa.x,u);X=fa.link;
B=fa.toolText;ca=s(fa.borderWidth)||0;L=D.getAxisPosition(L)+W;V=fa.previousY;Z=G.getAxisPosition(V||Q);$=G.getAxisPosition(S+(V||0));V=Aa($-Z);S>0&&($=Z);if(F){va=S<0?ta:ia;if(!(Z=h[u]))Z=h[u]={index:u,value:S,graphic:k.cubepath(va[Y]),dataLabel:null,tracker:null};pa=Z.graphic;pa.attr({cubepath:[C-U,L+aa,0,M,U,aa],fill:[f(fa.color),!y],stroke:ca&&f(fa.borderColor)||"NONE","stroke-width":ca,"stroke-dasharray":fa.dashStyle,cursor:X?"pointer":"",visibility:o}).shadow(q.shadow&&fa.shadow,Ca).animate({cubepath:[$-
U,L+aa,V,M,U,aa]},l,"normal",function(){sa.show()}).data("BBox",{height:M,width:V,x:$,y:L});if(X||w){!I&&V<i&&($-=(i-V)/2,V=i);if(!Z.tracker)Z.tracker=k.cubepath(n);oa=Z.tracker;oa.attr({cubepath:[$-U,L+aa,V,M,U,aa],cursor:X?"pointer":"",stroke:ca&&r||"NONE","stroke-width":ca,fill:r,ishot:!!X}).click(function(){var a=this.data("link");a&&d.linkClickFN.call({link:a},d)}).tooltip(B).data("link",X);oa._.cubetop.click(function(){var a=this.data("link");a&&d.linkClickFN.call({link:a},d)}).tooltip(B).data("link",
X);oa._.cubeside.click(function(){var a=this.data("link");a&&d.linkClickFN.call({link:a},d)}).tooltip(B).data("link",X)}if(!I||I&&S<0)pa.toBack(),oa&&oa.toBack()}else{ka($)<=K&&(V+=$,$=K-ca/2+ +!!ca-+E,v.xAxisLineVisible&&!E&&($-=1),V-=$);x($+V)>=R&&($-=ca/2+ +!ca,V=R-$+ca/2-+!!ca+ +E);ua=m.crispBound($,L,V,M,ca);$=ua.x;L=ua.y;V=ua.width;M=ua.height;V<=1&&(V=1,$+=S<0?-V:0);if(!(Z=h[u]))Z=h[u]={index:u,value:S,height:M,graphic:k.rect(va),dataLabel:null,tracker:null};pa=Z.graphic;pa.attr({x:C,y:L,width:0,
height:M,r:N,fill:f(fa.color),stroke:f(fa.borderColor),"stroke-width":ca,"stroke-dasharray":fa.dashStyle,"stroke-linejoin":"miter",cursor:X?"pointer":"",visibility:o}).shadow(q.shadow&&fa.shadow,Ca).animate({x:$,width:V||1},l,"normal",function(){sa.show()}).data("BBox",ua);if(X||w){!I&&V<i&&($-=(i-V)/2,V=i);if(!Z.tracker)Z.tracker=k.rect(n);oa=Z.tracker;oa.attr({x:$,y:L,width:V,height:M,r:N,cursor:X?"pointer":"",stroke:r,"stroke-width":ca,fill:r,ishot:!!X}).click(function(){var a=this.data("link");
a&&d.linkClickFN.call({link:a},d)}).tooltip(B).data("link",X)}}B=d.drawPlotBarLabel(a,b,u,$,L)}B&&j.push(B);pa&&j.push(pa);oa&&j.push(oa);d.drawTracker&&d.drawTracker.call(d,a,b,u)}a.visible=b.visible!==!1;return a},drawPlotBarLabel:function(a,b,c,d,e,f){var g=this.options,h=this.logic,i=g.chart,j=this.paper,k=this.layers,g=g.plotOptions.series.dataLabels.style,l=this.canvasLeft,n=this.canvasWidth,m=a.data[c],s=a.items[c],q=i.valuePadding+2,r=s.graphic,a=s.dataLabel,c=m.y<0,u=h.isStacked,h=h.is3D,
v=i.xDepth||0,w=i.yDepth||0,x=m.displayValue,b=b.visible===!1?"hidden":"visible",i=i.placeValuesInside,y=!1,f=f||k.datalabels;if(N(x)&&x!==B&&m.y!==null){if(!a)a=s.dataLabel=j.text(),y=!0;a.attr({text:x,title:m.originalText||"",fill:g.color}).css(g);j=a.getBBox();k=r.data("BBox");r=k.height;m=k.width;k=s=j.width;k+=q;e+=r*0.5;r=d+(c?0:m);q=s*0.5+q;d=c?d-l:l+n-(d+m);u?(r+=(c?m:-m)*0.5,r-=h?v:0,e+=h?w:0):(i?m>=k?(r+=c?q:-q,h&&(r-=v,e+=w)):(r+=c?-q:q,h&&c&&(r-=v)):d>=k?(r+=c?-q:q,h&&c&&(r-=v,e+=v)):
(r+=c?q:-q,h&&(r-=v,e+=w)),r>l+n&&(r=l+n-j.width*0.5-4),r<l&&(r=l+j.width*0.5+4));a.attr({x:r,y:e,visibility:b});y&&f.appendChild(a);y&&Y(g.backgroundColor,g.borderColor)!==B&&a.attr({"text-bound":[g.backgroundColor,g.borderColor,1,2]})}else a&&a.attr({text:B});return a},drawPlotBar3d:function(a,b){this.drawPlotBar.call(this,a,b)},drawPlotLine:function(a,b){var p;var e=this,g=e.paper,h=e.elements,j=e.options,k=j.chart,l=e.logic,n=j.plotOptions.series,q=a.items,u=a.graphics=a.graphics||[],v,w=e.xAxis[b.xAxis||
0],x=e.yAxis[b.yAxis||0],C=l.multisetRealtime||l.dragExtended,B=l.isWaterfall,D,G,F;D=0;var I=(j.tooltip||{}).enabled!==!1,E,j=isNaN(+n.animation)&&n.animation.duration||n.animation*1E3,y=k.xDepth||0,J=k.yDepth||0,M=k.series2D3Dshift,l=e.logic,o=b.step,Q=b.drawVerticalJoins,N=b.useForwardSteps;c(l.name);var l=a.data,K=b.visible===!1?"hidden":"visible",R,S=l.length,fa=w.getAxisPosition(0);v=w.getAxisPosition(1)-fa;var fa=v*S,ka=w.axisData.scroll||{},k=k.hasScroll||!1,Y=n.connectNullData,V,U,X,Z,aa,
$,L=null,ca=n.connectorWidth=s(b.lineWidth),ia=b.color;n.connectorOpacity=m.color(ia).opacity;var pa,sa,ta=n.connectorDashStyle=b.dashStyle,va,Aa,ua,xa=e.layers;R=xa.dataset=xa.dataset||g.group("dataset-orphan");var Ca=xa.datalabels=xa.datalabels||g.group("datalabels").insertAfter(R),Ja=xa.tracker,xa=h["clip-canvas-init"].slice(0),h=h["clip-canvas"].slice(0),ya=x.axisData.reversed;G=x.max;F=x.min;G=x.getAxisPosition(G>0&&F>0?!ya?F:G:G<0&&F<0?!ya?G:F:!ya?0:G)+(M?J:0);var ya=[],Fa,Ka,Ha,Da;x.yBasePos=
G;if(B)D=(D=e.definition.chart)&&D.plotspacepercent,G=n.groupPadding,F=n.maxColWidth,D=(1-D*0.01)*v||ma(v*(1-G*2),F*1),D/=2;Ca.hide();Fa=R.line||(R.line=g.group("line-connector",R));Ka=R.anchors||(R.anchors=g.group("line-anchors",R));Ka.hide();Ha=R.anchorShadows||(R.anchorShadows=g.group("anchor-shadows",R).toBack());Ha.hide();for(R=0;R<S;R+=1){V=l[R];aa=V.y;X=V.previousY||0;E=V.toolText;F=U=Aa=G=null;v=q[R]={index:R,value:null,graphic:null,connector:null,dataLabel:null,shadowGroup:Ha,tracker:null};
if(aa===null)Y===0&&(L=null);else{Z=O(V.x,R);U=V.link;b.relatedSeries==="boxandwhisker"&&b.pointStart&&(Z+=b.pointStart);aa=x.getAxisPosition(aa+X)+(M?J:0);Z=w.getAxisPosition(Z)-y;Z=d(Z,ca,ca).position;aa=d(aa,ca,ca).position;if((va=V.marker)&&va.enabled)if(Aa=va.symbol.split("_"),ua=Aa[0]==="spoke"?1:0,X=va.radius,p=v.graphic=g.polypath(Aa[1]||2,Z,aa,X,va.startAngle,ua,Ka).attr({fill:f(va.fillColor),"stroke-width":va.lineWidth,stroke:f(va.lineColor),cursor:U?"pointer":"",visibility:K}),Aa=p,U||
I)X<i&&(X=i),G=v.tracker=g.circle(Z,aa,X,Ja).attr({cursor:U?"pointer":"",stroke:r,"stroke-width":va.lineWidth,fill:r,ishot:!!U,visibility:K}).click(function(){var a=this.data("link");a&&e.linkClickFN.call({link:a},e)}).tooltip(E).data("link",U);Da=Da!==[f(V.color||ia),V.dashStyle||ta].join(":");if(L!==null){if((C||B||!ya.join(""))&&ya.push("M",$,L),B&&ya.push("m",-D,0),o?N?(ya.push("H",Z),B&&ya.push("h",D),Q?ya.push("V",aa):ya.push("m",0,aa-L)):(Q&&ya.push("V",aa),ya.push("M",$,aa,"H",Z)):ya.push("L",
Z,aa),C||Da)F=v.connector=g.path(ya,Fa).attr({"stroke-dasharray":sa,"stroke-width":ca,stroke:pa,"stroke-linecap":"round","stroke-linejoin":ca>2?"round":"miter",visibility:K}).shadow(n.shadow&&V.shadow),ya=[]}else!C&&ya.push("M",Z,aa);U=v.dataLabel=e.drawPlotLineLabel(a,b,R,Z,aa);$=Z;L=aa;pa=f(V.color||ia);sa=V.dashStyle||ta;Da=[pa,sa].join(":")}U&&u.push(U);Aa&&u.push(Aa);F&&u.push(F);G&&u.push(G);e.drawTracker&&e.drawTracker.call(e,a,b,R)}!C&&ya.join("")&&(F=g.path(ya,Fa).attr({"stroke-dasharray":sa,
"stroke-width":ca,stroke:pa,"stroke-linecap":"round","stroke-linejoin":ca>2?"round":"miter",visibility:K}).shadow(n.shadow&&V.shadow))&&u.push(F);if(k)g=ka.startPercent,h[2]=fa+xa[0],g===1&&(xa[0]=h[2],h[0]=0);g=m.animation({"clip-rect":h},j,k?"easeIn":"normal",function(){Fa.attr({"clip-rect":null});Ha.show();Ka.show();Ca.show()});Fa.attr({"clip-rect":xa}).animate(B?g.delay(j):g);a.visible=b.visible!==!1;return a},drawPlotArea:function(a,b){var p;var c=this,d=c.paper,e=c.options,g=e.chart,h=c.logic,
j=e.plotOptions.series,k=c.elements,l=a.items,n=a.graphics=a.graphics||[],m=c.xAxis[b.xAxis||0],s=c.yAxis[b.yAxis||0],q=s.axisData.reversed,u=g.xDepth||0,v=g.yDepth||0,w=h.isStacked,x=(e.tooltip||{}).enabled!==!1,C,e=isNaN(+j.animation)&&j.animation.duration||j.animation*1E3,B=g.series2D3Dshift,h=c.definition.chart.drawfullareaborder==="0",E=a.data,y=b.visible===!1?"hidden":"visible",D,G=E.length,o=m.getAxisPosition(0),o=(m.getAxisPosition(1)-o)*G,F=m.axisData.scroll||{},g=g.hasScroll||!1,J=j.connectNullData,
M,N,K,R,S,fa=s.max,V=s.min,U=s.getAxisPosition(fa>0&&V<0?0:!q&&fa>0&&V>=0?V:fa)+(B?v:0),ka=null,X,Y,q=b.lineWidth,fa=b.dashStyle,aa=f(b.fillColor),V=f(b.lineColor),L=0,Z,ca,$,ia=[],ma=[],pa=null,sa=[],ua=c.layers;D=ua.dataset=ua.dataset||d.group("dataset-orphan");var ta=ua.datalabels=ua.datalabels||d.group("datalabels").insertAfter(D),pa=ua.tracker,ua=k["clip-canvas-init"].slice(0),k=k["clip-canvas"].slice(0),va,Aa,ya,Ca,Fa;s.yBasePos=U;ta.hide();if(w)Ca=D.shadows||(D.shadows=d.group("shadows",D).toBack());
Aa=D.area=D.area||d.group("area",D);va=D.arealine=D.arealine||d.group("area-connector",D);ya=D.areaanchors=D.areaanchors||d.group("area-anchors",D);ya.hide();for(D=0;D<G;D+=1){M=E[D];R=M.y;C=O(M.x,D);X=m.getAxisPosition(C)-u;ca=Fa=$=null;if(R===null)J===0&&(ka=null,L>0&&(L===1?ia.splice(-8,8):(ia=ia.concat(ma),ia.push("Z")),ma=[])),l[D]={chart:c,index:D,value:R};else{N=M.link;C=M.toolText;K=M.previousY;S=(S=s.getAxisPosition(K)||null)||U;Y=s.getAxisPosition(R+(K||0))+(B?v:0);if((Z=M.marker)&&Z.enabled)if(ca=
Z.symbol.split("_"),K=Z.radius,ca=d.polypath(ca[1]||2,X,Y,K,Z.startAngle,0,ya).attr({fill:f(Z.fillColor),"stroke-width":Z.lineWidth,stroke:f(Z.lineColor),cursor:N?"pointer":"",visibility:y}),N||x)!w&&K<i&&(K=i),$=d.circle(X,Y,K,pa).attr({cursor:N?"pointer":"",stroke:r,"stroke-width":Z.lineWidth,fill:r,ishot:!!N,visibility:y}).click(function(){var a=this.data("link");a&&c.linkClickFN.call({link:a},c)}).tooltip(C).data("link",N);ka===null?(sa.push("M",X,",",Y),ia.push("M",X,",",S),L=0):sa.push("L",
X,",",Y);ia.push("L",X,",",Y);ma.unshift("L",X,",",S);L++;ka=Y;l[D]={chart:c,index:D,value:R,graphic:ca,dataLabel:Fa,tracker:$};Fa=c.drawPlotLineLabel(a,b,D,X,Y)}Fa&&n.push(Fa);ca&&n.push(ca);$&&n.push($);c.drawTracker&&c.drawTracker.call(c,a,b,D)}L>0&&(L===1?ia.splice(-8,8):(ia=ia.concat(ma),ia.push("Z")));(pa=a.graphic=d.path(ia,Aa).attr({fill:aa,"stroke-dasharray":fa,"stroke-width":h?0:q,stroke:V,"stroke-linecap":"round","stroke-linejoin":q>2?"round":"miter",visibility:y}).shadow(j.shadow&&M.shadow,
Ca))&&n.push(pa);if(g)j=F.startPercent,k[2]=o+ua[0],j===1&&(ua[0]=k[2],k[0]=0);j=Aa.attr({"clip-rect":ua}).animate({"clip-rect":k},e,g?"easeIn":"normal",function(){Aa.attr({"clip-rect":null});ya.show();ta.show()});Ca&&Ca.attr({"clip-rect":ua}).animateWith(Aa,j,{"clip-rect":k},e,g?"easeIn":"normal",function(){Ca.attr({"clip-rect":null})});if(h)p=a.connector=d.path(sa,va).attr({"stroke-dasharray":fa,"stroke-width":q,stroke:V,"stroke-linecap":"round","stroke-linejoin":q>2?"round":"miter",visibility:y}),
d=p,va.attr({"clip-rect":ua}).animateWith(Aa,j,{"clip-rect":k},e,g?"easeIn":"normal",function(){va.attr({"clip-rect":null})}),d&&n.push(d);a.visible=b.visible!==!1;return a},drawPlotScatter:function(a,b){var p;var c=this,d=c.options,e=d.plotOptions.series,g=c.paper,h=c.elements,j=a.items,k=a.graphics=a.graphics||[],l=c.xAxis[b.xAxis||0],n=c.yAxis[b.yAxis||0],m=a.data,s=b.visible===!1?"hidden":"visible",q=(d.tooltip||{}).enabled!==!1,u,d=isNaN(+e.animation)&&e.animation.duration||e.animation*1E3,v,
w,x,C,B,E,y,D,G,o=b.lineWidth,F=o>0,J=b.color,M=b.dashStyle,O=e.connectNullData,K=[],N,R,S,fa,V=c.layers,X=V.dataset||(V.dataset=g.group("dataset-orphan")),U=V.datalabels||(V.datalabels=g.group("datalabels").insertAfter(X)),ka=V.tracker,Y;U.hide();V=X.line||(X.line=g.group("connector",X));X=X.anchor||(X.anchor=g.group("anchor",X));v=0;for(w=m.length;v<w;v+=1){x=m[v];N=x.marker;D=G=S=Y=fa=null;E=x.y;B=x.x;if(E!==null&&B!==null){if(N&&N.enabled&&(C=x.link,u=x.toolText,R=N.radius,G=n.getAxisPosition(E),
D=l.getAxisPosition(B),S=N.symbol.split("_"),S=g.polypath(S[1]||2,D,G,R,N.startAngle,0,X).attr({fill:f(N.fillColor),"stroke-width":N.lineWidth,stroke:f(N.lineColor),cursor:C?"pointer":"",visibility:s}).shadow(e.shadow&&x.shadow),C||q))R<i&&(R=i),fa=g.circle(D,G,R,ka).attr({cursor:C?"pointer":"",stroke:r,"stroke-width":N.lineWidth,fill:r,ishot:!!C}).tooltip(u).data("link",C).click(function(){var a=this.data("link");a&&c.linkClickFN.call({link:a},c)});F&&((y===void 0||y===null&&O===0)&&D&&G&&K.push("M",
D,",",G),D&&G&&K.push("L",D,",",G),y=G);j[v]={index:v,x:B,y:E,value:E,graphic:S,dataLabel:Y,tracker:fa};Y=c.drawPlotLineLabel(a,b,v,D,G)}else F&&O===0&&(y=null),j[v]={chart:c,index:v,x:B,y:E};Y&&k.push(Y);S&&k.push(S);fa&&k.push(fa);c.drawTracker&&c.drawTracker.call(c,a,b,v)}if(K.length)p=a.graphic=g.path(K,V).attr({"stroke-dasharray":M,"stroke-width":o,stroke:J,"stroke-linecap":"round","stroke-linejoin":o>2?"round":"miter",visibility:s}).shadow(e.shadow&&x.shadow),e=p,V.attr({"clip-rect":h["clip-canvas-init"]}).animate({"clip-rect":h["clip-canvas"]},
d,"normal"),k.push(e);X.attr({opacity:0}).animate({opacity:1},d,"normal",function(){U.show()});a.visible=b.visible!==!1;return a},drawPlotLineLabel:function(b,c,d,e,f,g){var h=this.options,i=h.chart,j=this.paper,k=this.layers,h=h.plotOptions.series.dataLabels.style,l=i.rotateValues===1?270:0,n=this.canvasHeight,m=this.canvasTop,s=b.data,q=s[d],r=b.items[d],u=a(q.valuePosition,"auto").toLowerCase(),b=this.logic.defaultSeriesType,i=i.valuePadding+2,c=c.visible===!1?"hidden":"visible",v=!1,w=r.dataLabel,
g=g||k.datalabels;switch(u){case "above":d=0;break;case "below":d=1;break;default:k=s[d-1]||{},s=s[d+1]||{},d=!d?0:k.y>q.y?1:(k.y==null&&s.y)>q.y?1:0}k=q.displayValue;if(N(k)&&k!==B){w?l&&w.rotate(360-l):(w=r.dataLabel=j.text().attr({text:k}).css(h),v=!0);w.attr({title:q.originalText||"",fill:h.color});j=w.getBBox();r=k=l?j.width:j.height;r+=i;j=f-m;n=m+n-f;r+=4;m=k*0.5+i;if(!/bubble/i.test(b))if(d)n>r?(f+=m,q._valueBelowPoint=1):j>r&&(f-=m);else if(j>r)f-=m;else if(n>r)f+=m,q._valueBelowPoint=1;
w.attr({x:e,y:f,visibility:c});l&&w.attr("transform","T0,0,R"+l);v&&g.appendChild(w);v&&Y(h.backgroundColor,h.borderColor)!==B&&w.attr({"text-bound":[h.backgroundColor,h.borderColor,1,2]})}else w&&w.attr({text:B});return w},drawLabels:function(){for(var a=this.paper,b=this.options,c=(b=b.labels&&b.labels.items&&b.labels.items)&&b.length,d=this.layers.layerAboveDataset,e=this.elements.quadran||(this.elements.quadran=[]),f=this.canvasTop,g=this.canvasLeft,h={right:"end",left:"start",undefined:"start"},
j,i;c--;)i=b[c],j=i.style,N(i.html)&&i.html!==B&&(e[c]=a.text(d).attr({text:i.html,x:parseInt(j.left,10)+g,y:parseInt(j.top,10)+f,fill:j.color,"text-anchor":h[i.textAlign],"vertical-align":i.vAlign}).css(j))}},U["renderer.root"]);U("renderer.piebase",{drawCaption:function(){var o;var a=this.options.chart,b=this.options.title,c=this.options.subtitle,d=this.paper,e=this.elements,f=this.layers,g=f.caption,h=e.caption,i=e.subcaption,j=b&&b.text,k=c&&c.text,l=d.width/2,n=b.x,m=c&&c.x;if((j||k)&&!g)g=f.caption=
d.group("caption"),f.tracker?g.insertBefore(f.tracker):g.insertAfter(f.dataset);if(j){if(!h)h=e.caption=d.text(g);if(n===void 0)n=l,b.align="middle";h.css(b.style).attr({text:b.text,fill:b.style.color,x:n,y:b.y||a.spacingTop||0,"text-anchor":b.align||"middle","vertical-align":"top",visibility:"visible",title:b.originalText||""})}else if(h)o=e.caption=h.remove(),h=o;if(k){if(!i)i=e.subcaption=d.text(g);if(m===void 0)m=l,c.align="middle";i.css(c.style).attr({text:c.text,title:c.originalText||"",fill:c.style.color,
x:m,y:j?h.attrs.y+h.getBBox().height+2:b.y||a.spacingTop||0,"text-anchor":c.align||"middle","vertical-align":"top",visibility:"visible"})}else if(i)e.subcaption=i.remove();if(!j&&!k&&g)f.caption=g.remove()},redrawDataLabels:function(a){var b=a.elements.plots[0];a.placeDataLabels(!0,b.items,b);return{}},plotGraphicClick:function(){var a=this.graphic&&this||this.data("plotItem"),b=a.seriesData,c=a.chart,d,e,f,g,h,i,j;if(!b.isRotating&&!b.singletonCase)return d=a.graphic,e=a.connector,f=a.dataLabel,
b=a.sliced,g=a.slicedTranslation,h=a.connectorPath,i=(b?-1:1)*a.transX,j=(b?-1:1)*a.transY,d.animate({transform:b?"t0,0":g},200,"easeIn"),f&&f.x&&f.animate({x:f.x+(b?0:i)},200,"easeIn"),h&&(h[1]+=i,h[2]+=j,h[4]+=i,h[6]+=i,e.animate({path:h},200,"easeIn")),b=a.sliced=!b,a={hcJSON:{series:[]}},a.hcJSON.series[0]={data:[]},G(c.logic.chartInstance.jsVars._reflowData,a,!0),b},plotDragStart:function(a,b,c){var d=this.data("plotItem"),e=d.chart,d=d.seriesData;if(e.options.series[0].enableRotation)a=Za.call(c,
a,b,d.pieCenter,d.chartPosition),d.dragStartAngle=a,e._pierotateActive=!0},plotDragEnd:function(){var a=this.data("plotItem"),b=a.chart,c={hcJSON:{series:[{startAngle:-b.datasets[0].startAngle*180/Va}]}};b.disposed||(G(b.logic.chartInstance.jsVars._reflowData,c,!0),b.rotate(a.seriesData,b.options.series[0]));setTimeout(function(){a.seriesData.isRotating=!1},0)},plotDragMove:function(a,b,c,d,e){var a=this.data("plotItem"),f=a.chart,g=a.seriesData,h=f.options.series;if(h[0].enableRotation&&!g.singletonCase&&
(g.isRotating=!0,c=Za.call(e,c,d,g.pieCenter,g.chartPosition),h[0].startAngle+=c-g.dragStartAngle,g.dragStartAngle=c,g.moveDuration=0,c=(new Date).getTime(),!g._lastTime||g._lastTime+g.timerThreshold<c))setTimeout(function(){f.rotate(g,h[0])},0),g._lastTime=c},plotMouseDown:function(){this.data("plotItem").seriesData.isRotating=!1},plotMouseUp:function(){var a=this.data("plotItem"),b=a.chart,c=a.seriesData;!c.isRotating&&b.linkClickFN.call({link:c.data[a.index].link},b);m._supportsTouch&&!c.isRotating&&
b.plotGraphicClick.call(a)},legendClick:function(a,b,c){var d=a.chart;d.elements.plots[0].isRotating=!1;d.plotGraphicClick.call(a.graphic);c!==!0&&(eventArgs={datasetName:a.label,datasetIndex:a.originalIndex,id:a.userID,visible:b,label:a.label,value:a.value,percentValue:a.percentage,tooltext:a.toolText,link:a.link,sliced:!a.sliced},g.raiseEvent("legenditemclicked",eventArgs,d.logic.chartInstance))},placeDataLabels:function(){var a=function(a,b){return a.point.value-b.point.value},b=function(a,b){return a.angle-
b.angle},c=["start","start","end","end"],d=[-1,1,1,-1],e=[1,1,-1,-1];return function(f,g,h,i){var j=this.options.plotOptions,l=j.pie,n=this.canvasLeft+this.canvasWidth*0.5,m=this.canvasTop+this.canvasHeight*0.5,s=this.smartLabel,q=j.series.dataLabels,r=q.style,j=O(Ka(parseFloat(r.lineHeight)),12),u=k(q.placeInside,!1),v=q.skipOverlapLabels,w=q.manageLabelOverflow,x=q.connectorPadding,C=q.distance;k(q.softConnector,!0);var y=i&&i.metrics||[n,m,l.size,l.innerSize||0],D=y[1],B=y[0],i=y[2]*0.5,o=[[],
[],[],[]],G=this.canvasLeft,F=this.canvasTop,l=this.canvasWidth,C=h.labelsRadius||(h.labelsRadius=i+C),m=n=parseInt(r.fontSize,10),J=m/2,x=[x,x,-x,-x],h=h.labelsMaxInQuadrant||(h.labelsMaxInQuadrant=bb(C/m)),q=q.isSmartLineSlanted,y=y[3]/2,M,N,K,S,V,fa,Y,U,ka,Z,aa,L,ca,$,ia;f||s.setStyle(r);if(g.length==1&&!y){if(y=g[0],($=y.dataLabel)&&$.show(),y.slicedTranslation=[G,F],$)$.attr({visibility:Ja,align:"middle",transform:"t"+B+","+(D+J-2)}),$.x=B}else if(u){var Ca=y+(i-y)/2;R(g,function(a){($=a.dataLabel)&&
$.show();if($){var b=a.angle;aa=D+Ca*va(b)+J-2;Y=B+Ca*X(b);$.x=Y;$._x=Y;$.y=aa;if(a.sliced)a=a.slicedTranslation,b=a[1]-F,Y+=a[0]-G,aa+=b;$.attr({visibility:Ja,align:"middle",transform:"t"+Y+","+aa})}})}else{R(g,function(a){($=a.dataLabel)&&$.show();$&&(L=a.angle%sa,L<0&&(L=sa+L),ia=L>=0&&L<Ra?1:L<Va?2:L<Ma?3:0,o[ia].push({point:a,angle:L}))});for(g=f=4;g--;){if(v&&(r=o[g].length-h,r>0)){o[g].sort(a);u=o[g].splice(0,r);r=0;for(S=u.length;r<S;r+=1)y=u[r].point,y.dataLabel.attr({visibility:"hidden"}),
y.connector&&y.connector.attr({visibility:"hidden"})}o[g].sort(b)}g=ta(o[0].length,o[1].length,o[2].length,o[3].length);ca=ta(ma(g,h)*m,C+m);o[1].reverse();for(o[3].reverse();f--;){u=o[f];S=u.length;v||(m=S>h?ca/S:n,J=m/2);y=S*m;r=ca;for(g=0;g<S;g+=1,y-=m)K=Aa(ca*va(u[g].angle)),r<K?K=r:K<y&&(K=y),r=(u[g].oriY=K)-m;M=c[f];S=ca-(S-1)*m;r=0;for(g=u.length-1;g>=0;g-=1,S+=m){y=u[g].point;L=u[g].angle;V=y.sliced;$=y.dataLabel;K=Aa(ca*va(L));K<r?K=r:K>S&&(K=S);r=K+m;ka=(K+u[g].oriY)/2;K=B+e[f]*C*X(pa.asin(ka/
ca));ka*=d[f];ka+=D;Z=D+i*va(L);fa=B+i*X(L);(f<2&&K<fa||f>1&&K>fa)&&(K=fa);Y=K+x[f];aa=ka-J-2;U=Y+x[f];$.x=U;$._x=U;w&&(N=f>1?U-this.canvasLeft:this.canvasLeft+l-U,N=s.getSmartText(y.labelText,N,j),$.attr({text:N.text,title:N.tooltext||""}));$.y=aa;if(V)V=y.transX,N=y.transY,Y+=V,K+=V,fa+=V,Z+=N,U+=V;$.attr({visibility:Ja,"text-anchor":M,vAlign:"middle",x:U,y:ka});if(U=y.connector)y.connectorPath=y=["M",fa,Z,"L",q?K:fa,ka,Y,ka],U.attr({path:y,visibility:Ja})}}}}}()},U["renderer.root"])}]);
(function(){var g=FusionCharts(["private","modules.renderer.js-interface"]);if(g!==void 0){var h=g.hcLib,m=g.renderer.getRenderer("javascript"),U=h.hasModule,w=h.loadModule,S=h.moduleCmdQueue,ia=h.executeWaitingCommands,b=h.injectModuleDependency,B=h.moduleDependencies,e=h.getDependentModuleName,r=h.eventList={loaded:"FC_Loaded",dataloaded:"FC_DataLoaded",rendered:"FC_Rendered",drawcomplete:"FC_DrawComplete",resized:"FC_Resized",dataxmlinvalid:"FC_DataXMLInvalid",nodatatodisplay:"FC_NoDataToDisplay",
exported:"FC_Exported"};h.raiseEvent=function(b,e,h,m,w,x){var B=r[b];g.raiseEvent(b,e,h,w,x);B&&typeof window[B]==="function"&&setTimeout(function(){window[B].apply(window,m)},0)};var x=function(b){var m,r,w,x={},B;for(m in g.core.items)if(m=g.core.items[m],w=m.chartType(),(r=m.jsVars)&&r.waitingModule&&m.__state.rendering&&h.needsModule(b,w))r.waitingModuleError=!0,r=e(w).concat(r.userModules),r.length&&(r=r[r.length-1],x[r]=h.moduleCmdQueue[r]);for(B in x)ia(x[B]);g.raiseError(g.core,"11171116151",
"run","HC-interface~renderer.load","Unable to load required modules and resources: "+b)},$=function(b,e,h){g.hcLib.createChart(b,e,"stub",h,b.jsVars.msgStore.ChartNotSupported)};B.charts=g.extend(B.charts||{},{column2d:0,column3d:0,bar2d:0,bar3d:0,pie2d:0,pie3d:0,line:0,bar2d:0,area2d:0,doughnut2d:0,doughnut3d:0,pareto2d:0,pareto3d:0,mscolumn2d:0,mscolumn3d:0,msline:0,msarea:0,msbar2d:0,msbar3d:0,stackedcolumn2d:0,marimekko:0,stackedcolumn3d:0,stackedarea2d:0,stackedcolumn2dline:0,stackedcolumn3dline:0,
stackedbar2d:0,stackedbar3d:0,msstackedcolumn2d:0,mscombi2d:0,mscombi3d:0,mscolumnline3d:0,mscombidy2d:0,mscolumn3dlinedy:0,stackedcolumn3dlinedy:0,msstackedcolumn2dlinedy:0,scatter:0,bubble:0,ssgrid:0,scrollcolumn2d:0,scrollcolumn3d:0,scrollline2d:0,scrollarea2d:0,scrollstackedcolumn2d:0,scrollcombi2d:0,scrollcombidy2d:0,zoomline:0});B.powercharts=g.extend(B.powercharts||{},{spline:0,splinearea:0,msspline:0,mssplinearea:0,multiaxisline:0,multilevelpie:0,waterfall2d:0,msstepline:0,inversemsline:0,
inversemscolumn2d:0,inversemsarea:0,errorbar2d:0,errorscatter:0,errorline:0,logmsline:0,logmscolumn2d:0,radar:0,dragnode:0,candlestick:0,selectscatter:0,dragcolumn2d:0,dragline:0,dragarea:0,boxandwhisker2d:0,kagi:0,heatmap:0});B.widgets=g.extend(B.widgets||{},{angulargauge:0,bulb:0,cylinder:0,drawingpad:0,funnel:0,hbullet:0,hled:0,hlineargauge:0,vlineargauge:0,pyramid:0,realtimearea:0,realtimecolumn:0,realtimeline:0,realtimelinedy:0,realtimestackedarea:0,realtimestackedcolumn:0,sparkcolumn:0,sparkline:0,
sparkwinloss:0,thermometer:0,vbullet:0,gantt:0,vled:0});B.maps=g.extend(B.maps||{},{});g.extend(m,{render:function(r,s){var w=this.chartType(),x=this.jsVars,B=this.__state,K=h.chartAPI,Y;Y=e(w).concat(x.userModules);if(x.isResizing)x.isResizing=clearTimeout(x.isResizing);x.hcObj&&x.hcObj.destroy&&x.hcObj.destroy();if(K[w]){if(K[B.lastRenderedType]&&B.lastRenderedType!==w)for(var O in K[B.lastRenderedType].eiMethods)delete this[O];B.lastRenderedType=w;B.lastRenderedSrc=this.src;delete x.waitingModule;
delete x.waitingModuleError;delete x.drLoadAttempted;g.hcLib.createChart(this,r,w,s)}else{if(U(Y))if(x.drLoadAttempted){g.raiseError(this,11112822001,"run","HC-interface~renderer.render","Chart runtimes not loaded even when resource is present");$(this,r,s);return}else b(w)&&(Y=e(w).concat(x.userModules)),x.drLoadAttempted=!0;else if(Y.length){if(x.waitingModuleError){$(this,r,s);delete x.waitingModule;delete x.waitingModuleError;return}}else{$(this,r,s);return}(w=S[Y[Y.length-1]])?(w.push({cmd:"render",
obj:this,args:arguments}),x.waitingModule||(g.hcLib.createChart(this,r,"stub",void 0,x.msgStore.PBarLoadingText||x.msgStore.LoadingText),m.load.call(this))):(g.raiseError(this,12080515551,"run","HC-interface~renderer.render","Unregistered module in dependentModule definition."),g.hcLib.createChart(this,r,"stub",void 0,x.msgStore.RenderChartErrorText))}},update:function(b){var e=this.ref,h=this.jsVars;h.hcObj&&h.hcObj.destroy&&h.hcObj.destroy();if(h.isResizing)h.isResizing=clearTimeout(h.isResizing);
b.error===void 0?(delete h.stallLoad,delete h.loadError,this.isActive()&&(this.src!==this.__state.lastRenderedSrc?this.render():g.hcLib.createChart(this,h.container,h.type))):(this.isActive()&&typeof e.showChartMessage==="function"&&e.showChartMessage("InvalidXMLText"),delete h.loadError)},resize:function(b){var e=this.ref,h,m=this.jsVars;if(e&&e.resize){if(m.isResizing)m.isResizing=clearTimeout(m.isResizing);m.isResizing=setTimeout(function(){h=g.normalizeCSSDimension(b.width,b.height,e);if(b.width!==
void 0)e.style.width=h.width;if(b.height!==void 0)e.style.height=h.height;e.resize();delete m.isResizing},0)}},dispose:function(){var b;b=this.jsVars;var e=b.hcObj||{};if(b.isResizing)b.isResizing=clearTimeout(b.isResizing);b.instanceAPI&&b.instanceAPI.dispose&&b.instanceAPI.dispose();if(b=this.ref)g.purgeDOM(b),b.parentNode&&b.parentNode.removeChild(b);h.cleanupWaitingCommands(this);return e&&e.destroy&&e.destroy()},load:function(){var b=this.jsVars,m=this.chartType(),r=g.hcLib.chartAPI[m],m=e(m).concat(b.userModules),
B=m[m.length-1];if(r||!m||m&&m.length===0)delete b.waitingModule;else if(!b.waitingModule)b.waitingModule=!0,delete b.waitingModuleError,w(m,function(){delete b.waitingModule;ia(h.moduleCmdQueue[B])},x,this)}})}})();/*
 FusionCharts JavaScript Library
 Copyright FusionCharts Technologies LLP
 License Information at <http://www.fusioncharts.com/license>

 @version fusioncharts/3.3.1-sr3.21100
*/
FusionCharts(["private","modules.renderer.js-charts",function(){function Da(a){for(var J={left:a.offsetLeft,top:a.offsetTop},a=a.offsetParent;a;)J.left+=a.offsetLeft,J.top+=a.offsetTop,a!==E.body&&a!==E.documentElement&&(J.left-=a.scrollLeft,J.top-=a.scrollTop),a=a.offsetParent;return J}function ja(a,J){for(var d=[],g=0,b=a.length;g<b;g++)d[g]=J.call(a[g],a[g],g,a);return d}function sa(a){a=(a||0)%fa;return a<0?fa+a:a}function Ea(a,J){return a<=W?a:J<=W?J:J>a?0:J}function Ja(a,J,d,g,b){return X((J-
d[1]-g.top)/b,a-d[0]-g.left)}function Fa(a,J,d,g,b,ua,j,r,aa,n){if(typeof a==="object")J=a.y,d=a.r,g=a.innerR,b=a.radiusYFactor,ua=a.depth,j=a.seriesGroup,r=a.renderer,a=a.x;if(b<0||b>=1)b=0.6;a=a||0;J=J||0;d=d||1;g=g||0;ua=ua||0;this.renderer=r;this.hasOnePoint=aa;this.use3DLighting=n;this.cx=a;this.cy=J;this.rx=d;this.ry=d*b;this.radiusYFactor=b;this.isDoughnut=g>0;this.innerRx=g;this.innerRy=g*b;this.depth=ua;this.leftX=a-d;this.rightX=a+d;this.leftInnerX=a-g;this.rightInnerX=a+g;this.depthY=J+
ua;this.topY=J-this.ry;this.bottomY=this.depthY+this.ry;this.bottomBorderGroup=r.group("bottom-border",j).attr({transform:"t0,"+ua});this.outerBackGroup=r.group("outer-back-Side",j);this.slicingWallsBackGroup=r.group("slicingWalls-back-Side",j);this.innerBackGroup=r.group("inner-back-Side",j);this.innerFrontGroup=r.group("inner-front-Side",j);this.slicingWallsFrontGroup=r.group("slicingWalls-front-Side",j);this.topGroup=r.group("top-Side",j);this.moveCmdArr=[c];this.lineCmdArr=[k];this.closeCmdArr=
[h];this.centerPoint=[a,J];this.leftPoint=[this.leftX,J];this.topPoint=[a,this.topY];this.rightPoint=[this.rightX,J];this.bottomPoint=[a,J+this.ry];this.leftDepthPoint=[this.leftX,this.depthY];this.rightDepthPoint=[this.rightX,this.depthY];this.leftInnerPoint=[this.leftInnerX,J];this.rightInnerPoint=[this.rightInnerX,J];this.leftInnerDepthPoint=[this.leftInnerX,this.depthY];this.rightInnerDepthPoint=[this.rightInnerX,this.depthY];this.pointElemStore=[];this.slicingWallsArr=[];a=[e,this.rx,this.ry,
0,0,1,this.rightX,J];d=[e,this.rx,this.ry,0,0,1,this.leftX,J];g=[e,this.rx,this.ry,0,0,0,this.rightX,this.depthY];b=[e,this.rx,this.ry,0,0,0,this.leftX,this.depthY];ua=[e,this.innerRx,this.innerRy,0,0,0,this.rightInnerX,J];J=[e,this.innerRx,this.innerRy,0,0,0,this.leftInnerX,J];j=[e,this.innerRx,this.innerRy,0,0,1,this.rightInnerX,this.depthY];r=[e,this.innerRx,this.innerRy,0,0,1,this.leftInnerX,this.depthY];this.isDoughnut?(this.topBorderPath=this.moveCmdArr.concat(this.leftPoint,a,d,this.moveCmdArr,
this.leftInnerPoint,ua,J),this.topPath=this.moveCmdArr.concat(this.leftPoint,a,d,this.lineCmdArr,this.leftInnerPoint,ua,J,this.closeCmdArr),this.innerFrontPath=this.moveCmdArr.concat(this.leftInnerPoint,ua,this.lineCmdArr,this.rightInnerDepthPoint,r,this.closeCmdArr),this.innerBackPath=this.moveCmdArr.concat(this.rightInnerPoint,J,this.lineCmdArr,this.leftInnerDepthPoint,j,this.closeCmdArr)):this.topBorderPath=this.topPath=this.moveCmdArr.concat(this.leftPoint,a,d,this.closeCmdArr);this.outerBackPath=
this.moveCmdArr.concat(this.leftPoint,a,this.lineCmdArr,this.rightDepthPoint,b,this.closeCmdArr);this.outerFrontPath=this.moveCmdArr.concat(this.rightPoint,d,this.lineCmdArr,this.leftDepthPoint,g,this.closeCmdArr);this.clipPathforOuter=[c,this.leftX,this.topY,k,this.rightX,this.topY,this.rightX,this.bottomY,this.leftX,this.bottomY,h];this.clipPathforInner=[c,this.leftInnerX,this.topY,k,this.rightInnerX,this.topY,this.rightInnerX,this.bottomY,this.leftInnerX,this.bottomY,h];this.clipPathforNoClip=
[c,this.leftInnerX,this.topY,k,this.leftInnerX,this.bottomY,h]}var ma=this,t=ma.hcLib,ga=t.Raphael,E=window.document,B=t.BLANKSTRING,Ka=t.createTrendLine,i=t.pluck,va=t.getValidValue,f=t.pluckNumber,U=t.defaultPaletteOptions,ka=t.getFirstValue,Oa=t.getDefinedColor,wa=t.parseUnsafeString,O=t.FC_CONFIG_STRING,xa=t.extend2,za=t.getDashStyle,ba=t.toRaphaelColor,Qa=t.toPrecision,Ga=t.stubFN,Z=t.hasSVG,Aa=t.isIE,qa=t.each,La=t.hasTouch?10:3,la="rgba(192,192,192,"+(Aa?0.002:1.0E-6)+")",b=document.documentMode===
8?"visible":"",c="M",k="L",e="A",h="Z",H=Math,P=H.sin,w=H.cos,X=H.atan2,A=H.round,ha=H.min,Y=H.max,M=H.abs,u=H.PI,ta=H.ceil,ia=H.floor,R=H.sqrt,T=u/180,W=Math.PI,S=W/2,fa=2*W,Ua=W+S,Ra=t.graphics.getColumnColor,V=t.getFirstColor,Ca=t.setLineHeight,Ha=t.pluckFontSize,Ma=t.getFirstAlpha,ca=t.graphics.getDarkColor,ea=t.graphics.getLightColor,na=t.graphics.convertColor,Na=t.COLOR_TRANSPARENT,la="rgba(192,192,192,"+(Aa?0.002:1.0E-6)+")",Sa=t.POSITION_CENTER,Wa=t.POSITION_TOP,Va=t.POSITION_BOTTOM,Xa=t.POSITION_RIGHT,
Ya=t.POSITION_LEFT,o=t.chartAPI,Za=t.titleSpaceManager,$a=t.placeLegendBlockBottom,ab=t.placeLegendBlockRight,bb=t.graphics.mapSymbolName,Aa=o.singleseries,K=t.COMMASTRING,ya=t.ZEROSTRING,Ia=t.ONESTRING,Ba=t.HUNDREDSTRING,Pa=t.PXSTRING,cb=t.COMMASPACE,ra=!/fusioncharts\.com$/i.test(location.hostname);o("column2d",{standaloneInit:!0,friendlyName:"Column Chart",creditLabel:ra,rendererId:"cartesian"},o.column2dbase);o("column3d",{friendlyName:"3D Column Chart",defaultSeriesType:"column3d",defaultPlotShadow:1,
is3D:!0,defaultZeroPlaneHighlighted:!1},o.column2d);o("bar2d",{friendlyName:"Bar Chart",isBar:!0,defaultSeriesType:"bar",spaceManager:o.barbase},o.column2d);o("bar3d",{friendlyName:"3D Bar Chart",defaultSeriesType:"bar3d",defaultPlotShadow:1,is3D:!0,defaultZeroPlaneHighlighted:!1},o.bar2d);o("line",{friendlyName:"Line Chart",standaloneInit:!0,creditLabel:ra,rendererId:"cartesian"},o.linebase);o("area2d",{friendlyName:"Area Chart",standaloneInit:!0,creditLabel:ra,rendererId:"cartesian"},o.area2dbase);
o("pie2d",{friendlyName:"Pie Chart",standaloneInit:!0,defaultSeriesType:"pie",defaultPlotShadow:1,sliceOnLegendClick:!0,rendererId:"pie",point:function(a,J,d,g,b){var c,j,r,e=b[O],n=e.is3d,m,p,l,k,h=0,y=0,o=[];r=f(g.plotborderthickness);var C=f(r,n?0.1:1),q=(m=f(g.use3dlighting,1))?f(g.radius3d,g["3dradius"],90):100;p=f(g.showzeropies,1);var x=f(g.showpercentintooltip,1),Ta=f(g.showlabels,1),H=f(g.showvalues,1),w=f(g.showpercentvalues,g.showpercentagevalues,0),F=i(g.tooltipsepchar,g.hovercapsepchar,
cb),v=i(g.labelsepchar,F),s=i(g.plotbordercolor,g.piebordercolor),z=b[O].numberFormatter;l=d.length;var A,Q,D=f(g.plotborderdashed,0),L=f(g.plotborderdashlen,5),G=f(g.plotborderdashgap,4);q>100&&(q=100);q<0&&(q=0);if(f(g.showlegend,0))b.legend.enabled=!0,b.legend.reversed=!Boolean(f(g.reverselegend,0)),J.showInLegend=!0;for(a=0;a<l;a+=1)j=d[a],c=z.getCleanValue(j.value,!0),c===null||!p&&c===0||(o.push(j),h+=c);h===0&&(o=[]);J.enableRotation=o.length>1?f(g.enablerotation,1):0;J.alphaAnimation=f(g.alphaanimation,
1);J.is3D=n;J.use3DLighting=m;J.pieYScale=f(g.pieyscale,40);if(J.pieYScale<1)J.pieYScale=1;if(J.pieYScale>=100)J.pieYScale=80;J.pieYScale/=100;J.pieSliceDepth=f(g.pieslicedepth,15);if(J.pieSliceDepth<1)J.pieSliceDepth=1;J.managedPieSliceDepth=J.pieSliceDepth;if(n&&g.showplotborder!=Ia&&!r)J.showBorderEffect=1;for(a=o.length-1;a>=0;a-=1){j=o[a];c=z.getCleanValue(j.value,!0);d=wa(i(j.label,j.name,B));m=i(j.color,b.colors[a%b.colors.length]);p=i(j.alpha,g.plotfillalpha);l=i(j.bordercolor,s);k=i(j.borderalpha,
g.plotborderalpha,g.pieborderalpha);if(n&&(l||k!==void 0))J.showBorderEffect=0;l=i(l,ea(m,n?90:25)).split(K)[0];k=g.showplotborder==ya?ya:i(k,p,"80");p=i(p,Ba);r={opacity:Math.max(p,k)/100};if(A=Boolean(f(j.issliced,g.issliced,0)))e.preSliced=A;Q=f(j.dashed,D)?za(i(j.dashlen,L),i(j.dashgap,G),C):void 0;J.data.push({showInLegend:d!==B,y:c,name:d,shadow:r,toolText:wa(va(j.tooltext)),color:this.getPointColor(m,p,q),_3dAlpha:p,borderColor:na(l,k),borderWidth:C,link:va(j.link),sliced:A,dashStyle:Q,doNotSlice:i(g.enableslicing,
Ia)!=Ia});p=z.percentValue(c/h*100);l=z.dataLabels(c)||B;r=x===1?p:l;c=f(j.showlabel,Ta)===1?d:B;p=(m=f(j.showvalue,H))===1?w===1?p:l:B;j=va(wa(j.displayvalue));p=j!==void 0&&m?j:p!==B&&c!==B?c+v+p:i(c,p);d=d!=B?d+F+r:r;j=J.data[y];j.displayValue=p;j.toolText=i(j.toolText,d);y+=1}J.valueTotal=h;b.legend.enabled=g.showlegend==Ia?!0:!1;J.startAngle=f(g.startingangle,0);b.chart.startingAngle=i(o.length>1?g.startingangle:0,0);return J},getPointColor:function(a,J,d){var g,b,a=V(a),J=Ma(J);d<100&&Z?(g=
Math.floor((100-0.35*d)*85)/100,g=ca(a,g),b=Math.floor((100+d)*50)/100,a=ea(a,b),J={FCcolor:{color:a+K+g,alpha:J+K+J,ratio:d+",100",radialGradient:!0,gradientUnits:"userSpaceOnUse"}}):J={FCcolor:{color:a+K+a,alpha:J+K+J,ratio:"0,100"}};return J},configureAxis:function(a){var J=0,d=a[O],g;a.plotOptions.series.dataLabels.style=a.xAxis.labels.style;a.plotOptions.series.dataLabels.color=a.xAxis.labels.style.color;delete d.x;delete d[0];delete d[1];a.chart.plotBorderColor=a.chart.plotBackgroundColor=Na;
d=d.pieDATALabels=[];if(a.series.length===1&&(g=a.series[0].data)&&(J=a.series[0].data.length)>0&&a.plotOptions.series.dataLabels.enabled)for(;J--;)g[J]&&va(g[J].displayValue)!==void 0&&d.push(g[J].displayValue)},spaceManager:function(a,J,d,g){var b=a[O],c=b.is3d,j=this.name,r=b.smartLabel,e=f(b.pieDATALabels&&b.pieDATALabels.length,0),n=0,m=J.chart,p=f(m.managelabeloverflow,0),l=!b.preSliced&&m.enableslicing==ya&&(m.showlegend!=Ia||m.interactivelegend==ya)?0:f(m.slicingdistance,20),k=f(m.pieradius,
0),h=f(m.enablesmartlabels,m.enablesmartlabel,1),y=h?f(m.skipoverlaplabels,m.skipoverlaplabel,1):0,o=f(m.issmartlineslanted,1),C=f(m.labeldistance,m.nametbdistance,5),q=f(m.smartlabelclearance,5);d-=a.chart.marginRight+a.chart.marginLeft;var x=g-(a.chart.marginTop+a.chart.marginBottom),g=Math.min(x,d),Ta=i(m.smartlinecolor,U.plotFillColor[a.chart.paletteIndex]),H=f(m.smartlinealpha,100),w=f(m.smartlinethickness,0.7),F=a.plotOptions.series.dataLabels,v=F.style,s=f(parseInt(v.lineHeight,10),12),z=a.series[0]||
{},A=z.pieYScale,Q=z.pieSliceDepth,g=k===0?g*0.15:k,D=0,D=2*g;F.connectorWidth=w;F.connectorPadding=f(m.connectorpadding,5);F.connectorColor=na(Ta,H);x-=Za(a,J,d,D<x?x-D:x/2);m.showlegend==Ia&&(i(m.legendposition,Va).toLowerCase()!=Xa?x-=$a(a,J,d,x/2,!0):d-=ab(a,J,d/3,x,!0));r.setStyle(v);if(e!==1)for(;e--;)J=r.getOriSize(b.pieDATALabels[e]),n=Math.max(n,J.width);h&&(C=q+l);k===0&&(c?(x-=Q,D=Math.min(d/2-n,(x/2-s)/A)-C):D=Math.min(d/2-n,x/2-s)-C,D>=g?g=D:C=Math.max(C-(g-D),l));if(c&&(e=x-2*(g*A+s),
Q>e))z.managedPieSliceDepth=Q-e;a.plotOptions.pie3d.slicedOffset=a.plotOptions.pie.slicedOffset=l;a.plotOptions.pie3d.size=a.plotOptions.pie.size=2*g;a.plotOptions.series.dataLabels.distance=C;a.plotOptions.series.dataLabels.isSmartLineSlanted=o;a.plotOptions.series.dataLabels.enableSmartLabels=h;a.plotOptions.series.dataLabels.skipOverlapLabels=y;a.plotOptions.series.dataLabels.manageLabelOverflow=p;if(j==="doughnut2d"||j==="doughnut3d")if(j=f(m.doughnutradius,0),e=f(m.use3dlighting,1)?f(m.radius3d,
m["3dradius"],50):100,e>100&&(e=100),e<0&&(e=0),m=j===0||j>=g?g/2:j,a.plotOptions.pie3d.innerSize=a.plotOptions.pie.innerSize=2*m,e>0&&Z&&(m=parseInt(m/g*100,10),j=(100-m)/2,e=parseInt(j*e/100,10),m=m+K+e+K+2*(j-e)+K+e,a.series[0]&&a.series[0].data)){p=a.series[0].data;a=0;for(e=p.length;a<e;a+=1)if(j=p[a],j.color.FCcolor)j.color.FCcolor.ratio=m}},creditLabel:ra,eiMethods:{sliceDataItem:function(a){var b=this.jsVars.hcObj,d,g,c;if(b&&b.datasets&&(d=b.datasets[0])&&(g=d.data)&&(c=g.length)&&g[a=c-
a-1]&&g[a].plot)return b.plotGraphicClick.call(g[a].plot)}}},Aa);o.pie2d.eiMethods.togglePieSlice=o.pie2d.eiMethods.sliceDataItem;o.pie2d.eiMethods.enableSlicingMovement=o.pie2d.eiMethods.enablelink=function(){ma.raiseWarning(this,"1301081430","run","JSRenderer~enablelink()","Method deprecated.")};o("pie3d",{friendlyName:"3D Pie Chart",defaultSeriesType:"pie3d",rendererId:"pie3d",creditLabel:ra,getPointColor:function(a){return a},defaultPlotShadow:0},o.pie2d);o("doughnut2d",{friendlyName:"Doughnut Chart",
getPointColor:function(a,b,d){var g,a=V(a),b=Ma(b);d<100&&Z?(g=ca(a,ia((85-0.2*(100-d))*100)/100),a=ea(a,ia((100-0.5*d)*100)/100),b={FCcolor:{color:g+","+a+","+a+","+g,alpha:b+","+b+","+b+","+b,radialGradient:!0,gradientUnits:"userSpaceOnUse",r:d}}):b={FCcolor:{color:a+","+a,alpha:b+","+b,ratio:"0,100"}};return b}},o.pie2d);o("doughnut3d",{friendlyName:"3D Doughnut Chart",defaultSeriesType:"pie3d",rendererId:"pie3d",getPointColor:o.pie3d,defaultPlotShadow:0},o.doughnut2d);o("pareto2d",{friendlyName:"Pareto Chart",
standaloneInit:!0,point:function(a,b,d,g,c){var e,j,r,aa,n,m,p,l,k,h,y,o,C,q,x,a=d.length,H=0;m={};C=c.chart.paletteIndex;var w=/3d$/.test(c.chart.defaultSeriesType),A=this.isBar,F=i(360-g.plotfillangle,90),v=f(g.plotborderthickness,1),s=c.chart.useRoundEdges,z=i(g.tooltipsepchar,", "),P=i(g.plotbordercolor,U.plotBorderColor[C]).split(K)[0],Q=g.showplotborder==ya?ya:i(g.plotborderalpha,g.plotfillalpha,Ba),D=c.xAxis,L=f(g.showcumulativeline,1),G=c[O],I=G.axisGridManager,u=G.x,ha=g.showtooltip!=ya,
N=[],X=[],Y=f(g.use3dlighting,1),M=c[O].numberFormatter,t=f(g.showlinevalues,g.showvalues),W=f(g.plotborderdashed,0),E=f(g.plotborderdashlen,5),S=f(g.plotborderdashgap,4),Q=w?g.showplotborder?Q:ya:Q,P=w?i(g.plotbordercolor,"#FFFFFF"):P;for(o=j=0;j<a;j+=1)if(y=d[j],d[j].vline)I.addVline(D,y,o,c);else if(e=M.getCleanValue(y.value,!0),e!==null)y.value=e,N.push(y),o+=1;a=N.length;N.sort(function(a,d){return d.value-a.value});if(L)p=f(g.linedashed,0),q=V(i(g.linecolor,U.plotBorderColor[C])),j=i(g.linealpha,
100),l=f(g.linedashlen,5),k=f(g.linedashgap,4),m=f(g.linethickness,2),h={opacity:j/100},x=f(g.drawanchors,g.showanchors),x===void 0&&(x=j!=ya),r=f(g.anchorborderthickness,1),n=f(g.anchorsides,0),aa=f(g.anchorradius,3),o=V(i(g.anchorbordercolor,q)),e=V(i(g.anchorbgcolor,U.anchorBgColor[C])),d=Ma(i(g.anchoralpha,Ba)),y=Ma(i(g.anchorbgalpha,d))*d/100,p=p?za(l,k,m):void 0,m={yAxis:1,data:[],type:"line",color:{FCcolor:{color:q,alpha:j}},lineWidth:m,marker:{enabled:x,fillColor:{FCcolor:{color:e,alpha:y}},
lineColor:{FCcolor:{color:o,alpha:d}},lineWidth:r,radius:aa,symbol:bb(n),startAngle:i(g.anchorstartangle,90)}};else{if(g.showsecondarylimits!=="1")g.showsecondarylimits="0";if(g.showdivlinesecondaryvalue!=="1")g.showdivlinesecondaryvalue="0"}for(j=0;j<a;j+=1)y=N[j],e=f(y.showlabel,g.showlabels,1),d=wa(!e?B:ka(y.label,y.name)),I.addXaxisCat(D,j,j,d),H+=e=y.value,r=i(y.color,c.colors[j%c.colors.length])+K+(f(g.useplotgradientcolor,1)?Oa(g.plotgradientcolor,U.plotGradientColor[C]):B),aa=i(y.alpha,g.plotfillalpha,
Ba),n=i(y.ratio,g.plotfillratio),o={opacity:aa/100},q=i(y.alpha,Q)+B,r=Ra(r,aa,n,F,s,P,q,A,w),b.data.push(xa(this.getPointStub(y,e,d,c),{y:e,shadow:o,color:r[0],borderColor:r[1],borderWidth:v,use3DLighting:Y,dashStyle:f(y.dashed,W)==1?za(E,S,v):"",tooltipConstraint:this.tooltipConstraint})),this.pointValueWatcher(c,e),L&&X.push({value:H,dataLabel:d,tooltext:va(y.tooltext)});u.catCount=a;G[1]||(G[1]={});G[1].stacking100Percent=!0;if(L&&H>0){j=0;for(a=X.length;j<a;j+=1)y=X[j],c=b.data[j],e=y.value/
H*100,C=M.percentValue(e),g=c.displayValue!==B?C:B,t==1&&(g=C),t==0&&(g=B),d=y.dataLabel,C=ha?y.tooltext!==void 0?y.tooltext:(d!==B?d+z:B)+C:B,m.data.push({shadow:h,color:m.color,marker:m.marker,y:e,toolText:C,displayValue:g,link:c.link,dashStyle:p});return[b,m]}else return b},defaultSeriesType:"column",isDual:!0,creditLabel:ra,rendererId:"cartesian"},Aa);o("pareto3d",{friendlyName:"3D Pareto Chart",defaultSeriesType:"column3d",defaultPlotShadow:1,is3D:!0},o.pareto2d);o("mscolumn2d",{friendlyName:"Multi-series Column Chart",
standaloneInit:!0,creditLabel:ra,rendererId:"cartesian"},o.mscolumn2dbase);o("mscolumn3d",{friendlyName:"Multi-series 3D Column Chart",defaultSeriesType:"column3d",defaultPlotShadow:1,is3D:!0,defaultZeroPlaneHighlighted:!1},o.mscolumn2d);o("msbar2d",{friendlyName:"Multi-series Bar Chart",isBar:!0,defaultSeriesType:"bar",spaceManager:o.barbase},o.mscolumn2d);o("msbar3d",{friendlyName:"Multi-series 3D Bar Chart",defaultSeriesType:"bar3d",defaultPlotShadow:1,is3D:!0,defaultZeroPlaneHighlighted:!1},o.msbar2d);
o("msline",{friendlyName:"Multi-series Line Chart",standaloneInit:!0,creditLabel:ra,rendererId:"cartesian"},o.mslinebase);o("msarea",{friendlyName:"Multi-series Area Chart",standaloneInit:!0,creditLabel:ra,rendererId:"cartesian"},o.msareabase);o("stackedcolumn2d",{friendlyName:"Stacked Column Chart",isStacked:!0},o.mscolumn2d);o("stackedcolumn3d",{friendlyName:"3D Stacked Column Chart",isStacked:!0},o.mscolumn3d);o("stackedbar2d",{friendlyName:"Stacked Bar Chart",isStacked:!0},o.msbar2d);o("stackedbar3d",
{friendlyName:"3D Stacked Bar Chart",isStacked:!0},o.msbar3d);o("stackedarea2d",{friendlyName:"Stacked Area Chart",isStacked:!0,areaAlpha:100,showSum:0},o.msarea);o("marimekko",{friendlyName:"Marimekko Chart",isValueAbs:!0,distributedColumns:!0,isStacked:!0,xAxisMinMaxSetter:Ga,postSeriesAddition:function(a,b){var d=a[O],g=0,c=a.xAxis,e=100/d.marimekkoTotal,j=[],r=a.series,aa=0,n=f(b.chart.plotborderthickness,1),m=a.chart.rotateValues,p=f(b.chart.rotatexaxispercentvalues,0),l=n*-0.5-(n%2+(p?0:4)),
k=p?3:0,h=m?270:0,y=xa({},a.plotOptions.series.dataLabels.style),o=parseInt(y.fontSize,10),C=d[0],q=C.stacking100Percent,x=!q,H=d.inCanvasStyle,w=this.numberFormatter,i=b.categories&&b.categories[0]&&b.categories[0].category||[],F=0,v=[],s,z,P,Q,D,L,G,I,u,n=[];d.isXYPlot=!0;d.distributedColumns=!0;c.min=0;c.max=100;c.labels.enabled=!1;c.gridLineWidth=0;c.alternateGridColor=Na;s=C.stack;b.chart.interactivelegend="0";C=0;for(z=a.xAxis.plotLines.length;C<z;C+=1)if(P=c.plotLines[C],P.isGrid)P.isCat=!0,
j[P.value]=P,P._hideLabel=!0;for(C=z=0;C<i.length;C+=1)i[C].vline||(F+=v[z]=w.getCleanValue(i[C].widthpercent||0),z+=1);i=s.floatedcolumn&&s.floatedcolumn[0]||[];if(F===100&&(i&&i.length)!==z)for(;z--;)i[z]||(i[z]={p:null});F=A(F);if(i){D=0;for(z=i.length;D<z;){u=i[D];g+=Q=u&&u.p||0;G=F===100?v[D]:Q*e;L=aa+G/2;I=aa+G;n.push(I);for(C=0;C<r.length;C+=1)if(s=a.series[C].data[D],s._FCX=aa,s._FCW=G,q){if(s.y||s.y===0){P=s.y/Q*100;s.y=P;if(s.showPercentValues)s.displayValue=this.numberFormatter.percentValue(P);
if(s.showPercentInToolTip)s.toolText=s.toolText+parseInt(P*100,10)/100+"%"}if(s.previousY||s.previousY===0)s.previousY=s.previousY/Q*100}d.showStackTotal&&a.xAxis.plotLines.push({value:L,width:0,isVline:x,isTrend:!x,_isStackSum:1,zIndex:4,label:{align:Sa,textAlign:h,rotation:m?270:0,style:y,verticalAlign:Wa,offsetScale:x?Q<0?u.n:u.p:void 0,offsetScaleIndex:0,y:Q<0?m===270?4:o:-4,x:0,text:w.yAxis(Qa(Q,10))}});if(j[D])j[D].value=L,j[D]._weight=G,j[D]._hideLabel=!1;D+=1;d.showXAxisPercentValues&&D<z&&
a.xAxis.plotLines.push({value:I,width:0,isVine:!0,label:{align:Sa,textAlign:p?Ya:Sa,rotation:p?270:0,backgroundColor:"#ffffff",backgroundOpacity:1,borderWidth:"1px",borderType:"solid",borderColor:H.color,style:{color:H.color,fontSize:H.fontSize,fontFamily:H.fontFamily,lineHeight:H.lineHeight},verticalAlign:Va,y:l,x:k,text:this.numberFormatter.percentValue(I)},zIndex:5});aa=I}}D=0;for(z=j.length;D<z;D+=1)if(j[D]&&j[D]._hideLabel)j[D].value=null;C=0;for(z=a.xAxis.plotLines.length;C<z;C+=1)if(P=c.plotLines[C],
P.isVline&&!P._isStackSum&&(d=P.value))d=A(d-0.5),P.value=n[d]},defaultSeriesType:"floatedcolumn"},o.stackedcolumn2d);o("msstackedcolumn2d",{friendlyName:"Multi-series Stacked Column Chart",series:function(a,b,d){var g,c,e,j,r=b[O],aa=0,n,m;n=[];var p;b.legend.enabled=Boolean(f(a.chart.showlegend,1));if(a.dataset&&a.dataset.length>0){this.categoryAdder(a,b);g=0;for(c=a.dataset.length;g<c;g+=1)if(p=a.dataset[g].dataset){e=0;for(j=p.length;e<j;e+=1,aa+=1)n={visible:!!f(p.visible,1),data:[],numColumns:c,
columnPosition:g},m=Math.min(r.oriCatTmp.length,p[e].data&&p[e].data.length),n=this.point(d,n,p[e],a.chart,b,m,aa,g),b.series.push(n)}if(this.isDual&&a.lineset&&a.lineset.length>0){e=0;for(j=a.lineset.length;e<j;e+=1,aa+=1)n={visible:!!f(a.lineset[e].visible,1),data:[],yAxis:1,type:"line"},d=a.lineset[e],m=Math.min(r.oriCatTmp.length,d.data&&d.data.length),b.series.push(o.msline.point.call(this,"msline",n,d,a.chart,b,m,aa))}this.configureAxis(b,a);a.trendlines&&Ka(a.trendlines,b.yAxis,b[O],this.isDual,
this.isBar)}},postSpaceManager:function(a,b,d){var l;var g=a[O],c,e,j;if(this.isStacked&&g.showStackTotal&&(c=a.chart,l=(b=a.xAxis)&&b.plotLines,a=l,c=d-c.marginLeft-c.marginRight,d=g.plotSpacePercent,g=g[0].stack,g=g.column&&g.column.length,b=c/(b.max-b.min),b*((1-2*d)/g)>50&&d==0.1)){b=50/b;d=a&&a.length;g=-((g-1)/2)*b;for(j=0;j<d;j+=1)if(e=a[j],e._isStackSum)c=e._catPosition+(g+b*e._stackIndex),e.value=c}}},o.stackedcolumn2d);o("mscombi2d",{friendlyName:"Multi-series Combination Chart",standaloneInit:!0,
creditLabel:ra,rendererId:"cartesian"},o.mscombibase);o("mscombi3d",{friendlyName:"Multi-series 3D Combination Chart",series:o.mscombi2d.series,eiMethods:function(a){var b={};qa(a.split(","),function(a){b[a]=function(){ma.raiseWarning(this,"1301081430","run","JSRenderer~"+a+"()","Method not applicable.")}});return b}("view2D,view3D,resetView,rotateView,getViewAngles,fitToStage")},o.mscolumn3d);o("mscolumnline3d",{friendlyName:"Multi-series Column and Line Chart"},o.mscombi3d);o("stackedcolumn2dline",
{friendlyName:"Stacked Column and Line Chart",isStacked:!0,stack100percent:0},o.mscombi2d);o("stackedcolumn3dline",{friendlyName:"Stacked 3D Column and Line Chart",isStacked:!0,stack100percent:0},o.mscombi3d);o("mscombidy2d",{friendlyName:"Multi-series Dual Y-Axis Combination Chart",isDual:!0,secondarySeriesType:void 0},o.mscombi2d);o("mscolumn3dlinedy",{friendlyName:"Multi-series 3D Column and Line Chart",isDual:!0,secondarySeriesType:"line"},o.mscolumnline3d);o("stackedcolumn3dlinedy",{friendlyName:"Stacked 3D Column and Line Chart",
isDual:!0,secondarySeriesType:"line"},o.stackedcolumn3dline);o("msstackedcolumn2dlinedy",{friendlyName:"Multi-series Dual Y-Axis Stacked Column and Line Chart",isDual:!0,stack100percent:0,secondarySeriesType:"line"},o.msstackedcolumn2d);o("scrollcolumn2d",{friendlyName:"Scrollable Multi-series Column Chart",postSeriesAddition:o.scrollbase.postSeriesAddition,tooltipConstraint:"plot",canvasborderthickness:1,avgScrollPointWidth:40},o.mscolumn2d);o("scrollline2d",{friendlyName:"Scrollable Multi-series Line Chart",
postSeriesAddition:o.scrollbase.postSeriesAddition,tooltipConstraint:"plot",canvasborderthickness:1,avgScrollPointWidth:75},o.msline);o("scrollarea2d",{friendlyName:"Scrollable Multi-series Area Chart",postSeriesAddition:o.scrollbase.postSeriesAddition,tooltipConstraint:"plot",canvasborderthickness:1,avgScrollPointWidth:75},o.msarea);o("scrollstackedcolumn2d",{friendlyName:"Scrollable Stacked Column Chart",postSeriesAddition:function(a,b,d,g){o.base.postSeriesAddition.call(this,a,b,d,g);o.scrollbase.postSeriesAddition.call(this,
a,b,d,g)},canvasborderthickness:1,tooltipConstraint:"plot",avgScrollPointWidth:75},o.stackedcolumn2d);o("scrollcombi2d",{friendlyName:"Scrollable Combination Chart",postSeriesAddition:o.scrollbase.postSeriesAddition,tooltipConstraint:"plot",canvasborderthickness:1,avgScrollPointWidth:40},o.mscombi2d);o("scrollcombidy2d",{friendlyName:"Scrollable Dual Y-Axis Combination Chart",postSeriesAddition:o.scrollbase.postSeriesAddition,tooltipConstraint:"plot",canvasborderthickness:1,avgScrollPointWidth:40},
o.mscombidy2d);o("scatter",{friendlyName:"Scatter Chart",standaloneInit:!0,defaultSeriesType:"scatter",defaultZeroPlaneHighlighted:!1,creditLabel:ra},o.scatterbase);o("bubble",{friendlyName:"Bubble Chart",standaloneInit:!0,standaloneInut:!0,defaultSeriesType:"bubble",rendererId:"bubble",point:function(a,b,d,g,c,e,j){if(d.data){var r,aa,n,m,p,l,k,h,y,H,C=!1,q,x,a=o[a],e=d.data,w=e.length,A=f(d.showvalues,c[O].showValues);n=f(g.bubblescale,1);var P=i(g.negativecolor,"FF0000"),F=c.plotOptions.bubble,
v=this.numberFormatter,s=f(d.showregressionline,g.showregressionline,0);F.bubbleScale=n;b.name=va(d.seriesname);if(f(d.includeinlegend)===0||b.name===void 0)b.showInLegend=!1;n=Boolean(f(d.drawanchors,d.showanchors,g.drawanchors,1));k=i(d.plotfillalpha,d.bubblefillalpha,g.plotfillalpha,Ba);h=f(d.showplotborder,g.showplotborder,1);y=V(i(d.plotbordercolor,g.plotbordercolor,"666666"));r=i(d.plotborderthickness,g.plotborderthickness,1);H=i(d.plotborderalpha,g.plotborderalpha,"95");h=h==1?r:0;j=i(d.color,
d.plotfillcolor,g.plotfillcolor,c.colors[j%c.colors.length]);b.marker={enabled:n,fillColor:this.getPointColor(j,Ba),lineColor:{FCcolor:{color:y,alpha:H}},lineWidth:h,symbol:"circle"};if(s){b.events={hide:this.hideRLine,show:this.showRLine};var z={sumX:0,sumY:0,sumXY:0,sumXsqure:0,sumYsqure:0,xValues:[],yValues:[]},u=f(d.showyonx,g.showyonx,1),Q=V(i(d.regressionlinecolor,g.regressionlinecolor,j)),D=f(d.regressionlinethickness,g.regressionlinethickness,1);r=Ma(f(d.regressionlinealpha,g.regressionlinealpha,
100));Q=na(Q,r)}for(aa=0;aa<w;aa+=1)if(m=e[aa])if(r=v.getCleanValue(m.y),q=v.getCleanValue(m.x),x=v.getCleanValue(m.z,!0),r===null)b.data.push({y:null,x:q});else{C=!0;p=V(i(m.color,m.z<0?P:j));l=i(m.alpha,k);m=a.getPointStub(m,r,q,c,d,A);p=f(g.use3dlighting)===0?p:a.getPointColor(p,l);if(x!==null)F.zMax=F.zMax>x?F.zMax:x,F.zMin=F.zMin<x?F.zMin:x;b.data.push({y:r,x:q,z:x,displayValue:m.displayValue,toolText:m.toolText,link:m.link,marker:{enabled:n,fillColor:p,lineColor:{FCcolor:{color:y,alpha:H}},
lineWidth:h,symbol:"circle"}});this.pointValueWatcher(c,r,q,s&&z)}else b.data.push({y:null});s&&(d={type:"line",color:Q,showInLegend:!1,lineWidth:D,enableMouseTracking:!1,marker:{enabled:!1},data:this.getRegressionLineSeries(z,u,w),zIndex:0},b=[b,d])}if(!C)b.showInLegend=!1;return b},postSeriesAddition:function(a,b){a.chart.clipBubbles=f(b.chart.clipbubbles,1)},getPointStub:function(a,b,d,g,c,e){var g=g[O],b=b===null?b:g.numberFormatter.dataLabels(b),j,r=g.tooltipSepChar;g.showTooltip?va(a.tooltext)!==
void 0?c=wa(a.tooltext):b===null?c=!1:(g.seriesNameInToolTip&&(j=i(c&&c.seriesname)),c=j?j+r:B,c+=d?d+r:B,c+=b,c+=a.z?r+a.z:B):c=B;d=f(a.showvalue,e,g.showValues)?i(a.displayvalue,a.name,a.label)!==void 0?wa(i(a.displayvalue,a.name,a.label)):b:B;a=va(a.link);return{displayValue:d,toolText:c,link:a}}},o.scatter);o("ssgrid",{friendlyName:"Grid Component",standaloneInit:!0,defaultSeriesType:"ssgrid",rendererId:"ssgrid",chart:function(a,b){var z;var d=this.containerElement,g=this.dataObj,c=this.chartInstance,
g=xa({},g);g.chart=g.chart||g.graph||{};delete g.graph;var e,j,r,k=0,n,m,p=[],l=g.chart,h=g.data,H=h&&h.length,g=this.smartLabel,y=this.numberFormatter,w=d.offsetHeight,C=d.offsetWidth,q={},x=0,A=0,P=(l.palette>0&&l.palette<6?l.palette:f(this.paletteIndex,1))-1,d={_FCconf:{0:{stack:{}},1:{stack:{}},x:{stack:{}},noWrap:!1,marginLeftExtraSpace:0,marginRightExtraSpace:0,marginBottomExtraSpace:0,marginTopExtraSpace:0,marimekkoTotal:0},chart:{renderTo:d,ignoreHiddenSeries:!1,events:{},spacingTop:0,spacingRight:0,
spacingBottom:0,spacingLeft:0,marginTop:0,marginRight:0,marginBottom:0,marginLeft:0,borderRadius:0,borderColor:"#000000",borderWidth:1,defaultSeriesType:"ssgrid",style:{fontFamily:i(l.basefont,"Verdana"),fontSize:Ha(l.basefontsize,20)+Pa,color:i(l.basefontcolor,U.baseFontColor[P]).replace(/^#?([a-f0-9]+)/ig,"#$1")},plotBackgroundColor:Na},labels:{smartLabel:g},colors:["AFD8F8","F6BD0F","8BBA00","FF8E46","008E8E","D64646","8E468E","588526","B3AA00","008ED6","9D080D","A186BE","CC6600","FDC689","ABA000",
"F26D7D","FFF200","0054A6","F7941C","CC3300","006600","663300","6DCFF6"],credits:{href:"http://www.fusioncharts.com?BS=FCHSEvalMark",text:t.CREDIT_STRING,enabled:this.creditLabel},legend:{enabled:!1},series:[],subtitle:{text:B},title:{text:B},tooltip:{enabled:!1},exporting:{buttons:{exportButton:{},printButton:{enabled:!1}}}},u=d[O],F=d.colors,v=d.colors.length,s=n=j=x=0,A=k=m=0;r=c.jsVars.cfgStore;c=d.chart;Ca(d.chart.style);c.events.click=this.linkClickFN;j=c.toolbar={button:{}};n=j.button;n.scale=
f(l.toolbarbuttonscale,1.15);n.width=f(l.toolbarbuttonwidth,15);n.height=f(l.toolbarbuttonheight,15);n.radius=f(l.toolbarbuttonradius,2);n.spacing=f(l.toolbarbuttonspacing,5);n.fill=na(i(l.toolbarbuttoncolor,"ffffff"));n.labelFill=na(i(l.toolbarlabelcolor,"cccccc"));n.symbolFill=na(i(l.toolbarsymbolcolor,"ffffff"));n.hoverFill=na(i(l.toolbarbuttonhovercolor,"ffffff"));n.stroke=na(i(l.toolbarbuttonbordercolor,"bbbbbb"));n.symbolStroke=na(i(l.toolbarsymbolbordercolor,"9a9a9a"));n.strokeWidth=f(l.toolbarbuttonborderthickness,
1);n.symbolStrokeWidth=f(l.toolbarsymbolborderthickness,1);m=n.symbolPadding=f(l.toolbarsymbolpadding,5);n.symbolHPadding=f(l.toolbarsymbolhpadding,m);n.symbolVPadding=f(l.toolbarsymbolvpadding,m);m=j.position=i(l.toolbarposition,"tr").toLowerCase();switch(m){case "tr":case "tl":case "br":case "bl":break;default:m="tr"}n=j.hAlign=(B+l.toolbarhalign).toLowerCase()==="left"?"l":m.charAt(1);z=j.vAlign=(B+l.toolbarvalign).toLowerCase()==="bottom"?"b":m.charAt(0),m=z;j.hDirection=f(l.toolbarhdirection,
n==="r"?-1:1);j.vDirection=f(l.toolbarvdirection,m==="b"?-1:1);j.vMargin=f(l.toolbarvmargin,6);j.hMargin=f(l.toolbarhmargin,10);j.x=f(l.toolbarx,n==="l"?0:a);j.y=f(l.toolbary,m==="t"?0:b);if(i(l.clickurl)!==void 0)c.link=l.clickurl,c.style.cursor="pointer";q.showPercentValues=f(r.showpercentvalues,l.showpercentvalues,0);q.numberItemsPerPage=i(r.numberitemsperpage,l.numberitemsperpage);q.showShadow=f(r.showshadow,l.showshadow,0);q.baseFont=i(r.basefont,l.basefont,"Verdana");e=Ha(r.basefontsize,l.basefontsize,
10);q.baseFontSize=e+Pa;q.baseFontColor=V(i(r.basefontcolor,l.basefontcolor,U.baseFontColor[P]));q.alternateRowBgColor=V(i(r.alternaterowbgcolor,l.alternaterowbgcolor,U.altHGridColor[P]));q.alternateRowBgAlpha=i(r.alternaterowbgalpha,l.alternaterowbgalpha,U.altHGridAlpha[P])+B;q.listRowDividerThickness=f(r.listrowdividerthickness,l.listrowdividerthickness,1);q.listRowDividerColor=V(i(r.listrowdividercolor,l.listrowdividercolor,U.borderColor[P]));q.listRowDividerAlpha=f(r.listrowdivideralpha,l.listrowdivideralpha,
U.altHGridAlpha[P])+15+B;q.colorBoxWidth=f(r.colorboxwidth,l.colorboxwidth,8);q.colorBoxHeight=f(r.colorboxheight,l.colorboxheight,8);q.navButtonRadius=f(r.navbuttonradius,l.navbuttonradius,7);q.navButtonColor=V(i(r.navbuttoncolor,l.navbuttoncolor,U.canvasBorderColor[P]));q.navButtonHoverColor=V(i(r.navbuttonhovercolor,l.navbuttonhovercolor,U.altHGridColor[P]));q.textVerticalPadding=f(r.textverticalpadding,l.textverticalpadding,3);q.navButtonPadding=f(r.navbuttonpadding,l.navbuttonpadding,5);q.colorBoxPadding=
f(r.colorboxpadding,l.colorboxpadding,10);q.valueColumnPadding=f(r.valuecolumnpadding,l.valuecolumnpadding,10);q.nameColumnPadding=f(r.namecolumnpadding,l.namecolumnpadding,5);q.borderThickness=f(r.borderthickness,l.borderthickness,1);q.borderColor=V(i(r.bordercolor,l.bordercolor,U.borderColor[P]));q.borderAlpha=i(r.borderalpha,l.borderalpha,U.borderAlpha[P])+B;q.bgColor=i(r.bgcolor,l.bgcolor,"FFFFFF");q.bgAlpha=i(r.bgalpha,l.bgalpha,Ba);q.bgRatio=i(r.bgratio,l.bgratio,Ba);q.bgAngle=i(r.bgangle,l.bgangle,
ya);c.borderRadius=q.borderThickness/16;c.borderWidth=q.borderThickness;c.borderColor=ba({FCcolor:{color:q.borderColor,alpha:q.borderAlpha}});c.backgroundColor={FCcolor:{color:q.bgColor,alpha:q.bgAlpha,ratio:q.bgRatio,angle:q.bgAngle}};c.borderRadius=f(l.borderradius,0);r={fontFamily:q.baseFont,fontSize:q.baseFontSize,color:q.baseFontColor};Ca(r);g.setStyle(r);for(k=0;k<H;k+=1)if(e=h[k],n=y.getCleanValue(e.value),m=wa(ka(e.label,e.name)),j=V(i(e.color,F[k%v])),i(e.alpha,l.plotfillalpha,Ba),m!=B||
n!=null)p.push({value:n,label:m,color:j}),x+=n,A+=1;for(k=0;k<A;k+=1)e=p[k],n=e.value,e.dataLabel=e.label,e.displayValue=q.showPercentValues?y.percentValue(n/x*100):y.dataLabels(n),h=g.getOriSize(e.displayValue),s=Math.max(s,h.width+q.valueColumnPadding);q.numberItemsPerPage?q.numberItemsPerPage>=A?(q.numberItemsPerPage=A,n=w/q.numberItemsPerPage,j=A):(y=w,y-=2*(q.navButtonPadding+q.navButtonRadius),j=q.numberItemsPerPage,n=y/j):(x=parseInt(r.lineHeight,10),x+=2*q.textVerticalPadding,x=Math.max(x,
q.colorBoxHeight),w/x>=A?(n=w/A,j=A):(y=w,y-=2*(q.navButtonPadding+q.navButtonRadius),j=Math.floor(y/x),n=y/j));m=C-q.colorBoxPadding-q.colorBoxWidth-q.nameColumnPadding-s-q.valueColumnPadding;k=q.colorBoxPadding+q.colorBoxWidth+q.nameColumnPadding;y=i(l.basefont,"Verdana");h=Ha(l.basefontsize,10);P=i(l.basefontcolor,U.baseFontColor[P]);H=i(l.outcnvbasefont,y);e=Ha(l.outcnvbasefontsize,h);s=e+Pa;l=i(l.outcnvbasefontcolor,P).replace(/^#?([a-f0-9]+)/ig,"#$1");h+=Pa;P=P.replace(/^#?([a-f0-9]+)/ig,"#$1");
u.trendStyle=u.outCanvasStyle={fontFamily:H,color:l,fontSize:s};Ca(u.trendStyle);u.inCanvasStyle={fontFamily:y,fontSize:h,color:P};d.tooltip.style={fontFamily:y,fontSize:h,lineHeight:void 0,color:P};d.tooltip.shadow=!1;c.height=w;c.width=C;c.rowHeight=n;c.labelX=k;c.colorBoxWidth=q.colorBoxWidth;c.colorBoxHeight=q.colorBoxHeight;c.colorBoxX=q.colorBoxPadding;c.valueX=q.colorBoxPadding+q.colorBoxWidth+q.nameColumnPadding+m+q.valueColumnPadding;c.valueColumnPadding=q.valueColumnPadding;c.textStyle=
r;c.listRowDividerAttr={"stroke-width":q.listRowDividerThickness,stroke:{FCcolor:{color:q.listRowDividerColor,alpha:q.listRowDividerAlpha}}};c.alternateRowColor={FCcolor:{color:q.alternateRowBgColor,alpha:q.alternateRowBgAlpha}};c.navButtonRadius=q.navButtonRadius;c.navButtonPadding=q.navButtonPadding;c.navButtonColor=q.navButtonColor;c.navButtonHoverColor=q.navButtonHoverColor;c.lineHeight=parseInt(r.lineHeight,10);l=[];w=0;q=!0;for(k=0;k<A&j!=0;k+=1)k%j==0&&(l.push({data:[],visible:q}),q=!1,w+=
1),e=p[k],C=g.getSmartText(e.dataLabel,m,n),l[w-1].data.push({label:C.text,originalText:C.tooltext,displayValue:e.displayValue,y:e.value,color:e.color});d.series=l;o.base.parseExportOptions.call(this,d);d.tooltip.enabled=!!d.exporting.enabled;return d},creditLabel:ra},o.base);o("renderer.bubble",{drawPlotBubble:function(a,b){var d=this,g=d.options,c=g.chart,e=g.plotOptions.series,j=d.paper,r=d.elements,k=a.items,n=a.graphics=a.graphics||[],m=d.xAxis[b.xAxis||0],p=d.yAxis[b.yAxis||0],l=a.data,h=(g.tooltip||
{}).enabled!==!1,e=isNaN(+e.animation)&&e.animation.duration||e.animation*1E3,o=b.visible===!1?"hidden":"visible",g=g.plotOptions.bubble,y=g.zMax,g=g.bubbleScale,H=ha(d.canvasHeight,d.canvasWidth)/8,y=R(y),C,q,x,w,P,i,F,v,s,z,u=d.layers,Q=u.dataset=u.dataset||j.group("dataset-orphan");u.datalabels=u.datalabels||j.group("datalables").insertAfter(Q);var u=u.tracker,D,L,Q=Q.bubble=Q.bubble||j.group("bubble",Q);c.clipBubbles&&!Q.attrs["clip-rect"]&&Q.attr({"clip-rect":r["clip-canvas"]});r=0;for(C=l.length;r<
C;r+=1){q=l[r];s=z=L=null;v=q.marker;if(q.y!==null&&v&&v.enabled){x=q.link;c=q.toolText;w=f(q.x,r);P=q.y;F=p.getAxisPosition(P);i=m.getAxisPosition(w);s=R(q.z);D=A(s*H/y)*g;s=j.circle(i,F,0,Q).attr({fill:ba(v.fillColor),"stroke-width":v.lineWidth,stroke:ba(v.lineColor),visibility:o}).animate({r:D||0},e,"easeOut");if(x||h)D<La&&(D=La),z=j.circle(i,F,D,u).attr({cursor:x?"pointer":"",stroke:la,"stroke-width":v.lineWidth,fill:la,ishot:!!x,visibility:o}).tooltip(c).data("link",x).click(function(){var a=
this.data("link");a&&d.linkClickFN.call({link:a},d)});k[r]={index:r,x:w,y:P,z:q.z,value:P,graphic:s,dataLabel:L,tracker:z};L=d.drawPlotLineLabel(a,b,r,i,F)}else k[r]={index:r,x:w,y:P};L&&n.push(L);s&&n.push(s);z&&n.push(z)}a.visible=b.visible!==!1;return a}},o["renderer.cartesian"]);o("renderer.ssgrid",{drawGraph:function(){var a=this.options.series,b=this.elements,d=b.plots,c=a.length,e;if(!d)d=this.plots=this.plots||[],b.plots=d;this.drawSSGridNavButton();for(e=0;e<c;e++){if(!(b=d[e]))d.push(b=
{items:[],data:a[e].data});a[e].data&&a[e].data.length&&this.drawPlot(b,a[e])}c>1&&this.nenagitePage(0)},drawPlot:function(a){var b=a.data,d=this.paper,g=this.options.chart,e=g.colorBoxHeight,h=g.colorBoxWidth,j=g.colorBoxX,r=g.labelX,aa=g.valueX,n=g.rowHeight,m=g.width,p=g.listRowDividerAttr,l=p["stroke-width"],p=ba(p.stroke),o=l%2/2,H=g.textStyle,y=this.layers,y=y.dataset=y.dataset||d.group("dataset-orphan"),g=ba(g.alternateRowColor),a=a.items,w=0,C,q,x,f;if(!b||!b.length)b=[];p={stroke:p,"stroke-width":l};
f=0;for(l=b.length;f<l;f+=1)if(x=b[f],q=x.y,C=a[f]={index:f,value:q,graphic:null,dataLabel:null,dataValue:null,alternateRow:null,listRowDivider:null,hot:null},!(q===null||q===void 0)){if(f%2===0)C.alternateRow=d.rect(0,w,m,n,0,y).attr({fill:g,"stroke-width":0});q=A(w)+o;C.listRowDivider=d.path([c,0,q,k,m,q],y).attr(p);C.graphic=d.rect(j,w+n/2-e/2,h,e,0,y).attr({fill:x.color,"stroke-width":0,stroke:"#000000"});q=C.dataLabel=d.text().attr({text:x.label,title:x.originalText||"",x:r,y:w+n/2,fill:H.color,
"text-anchor":"start"}).css(H);y.appendChild(q);C=C.dataValue=d.text().attr({text:x.displayValue,title:x.originalText||"",x:aa,y:w+n/2,fill:H.color,"text-anchor":"start"}).css(H);y.appendChild(C);w+=n}q=A(w)+o;d.path([c,0,q,k,m,q],y).attr(p)},drawSSGridNavButton:function(a){var a=this,b=a.paper,d=a.options,g=d.chart,e=d.series,h=g.navButtonColor,j=g.navButtonHoverColor,d=g.navButtonRadius,r=d*0.67,aa=g.navButtonPadding+r+(e&&e[0].data&&e[0].data.length*g.rowHeight)+d*0.5,g=g.width-20,n,m,p;if(e.length>
1){var l=a.naviigator=b.group("navigation");a.navElePrv=e=b.group(l);n=b.path([c,20,aa,k,20+d+r,aa-r,20+d,aa,20+d+r,aa+r,"Z"]).attr({fill:h,"stroke-width":0,cursor:"pointer"});e.appendChild(n);p=b.circle(20+d,aa,d).attr({fill:Na,"stroke-width":0,cursor:"pointer"}).mouseover(function(){n.attr({fill:j,cursor:"pointer"})}).mouseout(function(){n.attr({fill:h})}).click(function(){a.nenagitePage(-1)});e.appendChild(p);a.navEleNxt=e=b.group(l);m=b.path([c,g,aa,k,g-d-r,aa-r,g-d,aa,g-d-r,aa+r,"Z"]).attr({fill:h,
"stroke-width":0,cursor:"pointer"});e.appendChild(m);b=b.circle(g-d,aa,d).attr({fill:Na,"stroke-width":0,cursor:"pointer"}).mouseover(function(){m.attr({fill:j})}).mouseout(function(){m.attr({fill:h})}).click(function(){a.nenagitePage(1)});e.appendChild(b)}},nenagitePage:function(a){var b=this.plots,d=b.length,a=(this.currentSeriesIndex||0)+(a||0),c;if(b[a]){for(c=d;c--;)qa(b[c].items,function(a){a.graphic&&a.graphic.hide();a.dataLabel&&a.dataLabel.hide();a.dataValue&&a.dataValue.hide();a.alternateRow&&
a.alternateRow.hide();a.listRowDivider&&a.listRowDivider.hide()});qa(b[a].items,function(a){a.graphic&&a.graphic.show();a.dataLabel&&a.dataLabel.show();a.dataValue&&a.dataValue.show();a.alternateRow&&a.alternateRow.show();a.listRowDivider&&a.listRowDivider.show()});this.currentSeriesIndex=a;a===0?this.navElePrv.hide():this.navElePrv.show();a===d-1?this.navEleNxt.hide():this.navEleNxt.show()}}},o["renderer.root"]);Fa.prototype={getArcPath:function(a,b,d,c,k,h,j,r,aa,n){return d==k&&c==h?[]:[e,j,r,
0,n,aa,k,h]},parseColor:function(a,b){var d,c,e,k,j,r,h,n,m,p,l=b/2,o,w,y,f,H;H=3;this.use3DLighting?(d=ca(a,80),c=ca(a,75),r=ea(a,85),h=ea(a,70),n=ea(a,40),m=ea(a,50),ea(a,30),p=ea(a,65),ca(a,85),e=ca(a,69),k=ca(a,75),j=ca(a,95)):(H=10,d=ca(a,90),c=ca(a,87),r=ea(a,93),h=ea(a,87),n=ea(a,80),p=m=ea(a,85),ea(a,80),j=ca(a,85),e=ca(a,75),k=ca(a,80));o=c+K+r+K+h+K+r+K+c;y=b+K+b+K+b+K+b+K+b;w=c+K+a+K+r+K+a+K+c;f=l+K+l+K+l+K+l+K+l;n=c+K+a+K+n+K+a+K+c;e=k+K+r+K+m+K+r+K+e;k="FFFFFF"+K+"FFFFFF"+K+"FFFFFF"+
K+"FFFFFF"+K+"FFFFFF";H=0+K+l/H+K+b/H+K+l/H+K+0;return{frontOuter:{FCcolor:{gradientUnits:"userSpaceOnUse",x1:this.leftX,y1:0,x2:this.rightX,y2:0,color:e,alpha:y,angle:0,ratio:"0,20,15,15,50"}},backOuter:{FCcolor:{gradientUnits:"userSpaceOnUse",x1:this.leftX,y1:0,x2:this.rightX,y2:0,color:n,alpha:f,angle:0,ratio:"0,62,8,8,22"}},frontInner:{FCcolor:{gradientUnits:"userSpaceOnUse",x1:this.leftInnerX,y1:0,x2:this.rightInnerX,y2:0,color:w,alpha:f,angle:0,ratio:"0,25,5,5,65"}},backInner:{FCcolor:{gradientUnits:"userSpaceOnUse",
x1:this.leftInnerX,y1:0,x2:this.rightInnerX,y2:0,color:o,alpha:y,angle:0,ratio:"0,62,8,8,22"}},topBorder:{FCcolor:{gradientUnits:"userSpaceOnUse",x1:this.leftX,y1:0,x2:this.rightX,y2:0,color:k,alpha:H,angle:0,ratio:"0,20,15,15,50"}},topInnerBorder:{FCcolor:{gradientUnits:"userSpaceOnUse",x1:this.leftInnerX,y1:0,x2:this.rightInnerX,y2:0,color:k,alpha:H,angle:0,ratio:"0,50,15,15,20"}},top:Z?{FCcolor:{gradientUnits:"userSpaceOnUse",radialGradient:!0,cx:this.cx,cy:this.cy,r:this.rx,fx:this.cx-0.3*this.rx,
fy:this.cy+this.ry*1.2,color:p+K+j,alpha:b+K+b,ratio:"0,100"}}:{FCcolor:{gradientUnits:"objectBoundingBox",color:h+K+h+K+r+K+c,alpha:b+K+b+K+b+K+b,angle:-72,ratio:"0,8,15,77"}},bottom:ba(na(a,l)),startSlice:ba(na(d,b)),endSlice:ba(na(d,b))}},rotate:function(a){if(!this.hasOnePoint){for(var b=this.pointElemStore,d=0,c=b.length,e;d<c;d+=1)e=b[d],e=e._confObject,e.start+=a,e.end+=a,this.updateSliceConf(e);this.refreshDrawing()}},refreshDrawing:function(){return function(){var a=this.slicingWallsArr,
b=0,d,c=a.length,e,k,j,r,h=this.slicingWallsFrontGroup,n=this.slicingWallsBackGroup;a:{var m=a[0]&&a[0]._conf.index,p,l;r=m<=W;e=1;for(d=a.length;e<d;e+=1)if(l=a[e]._conf.index,p=l<=W,p!=r||l<m)break a;e=0}for(;b<c;b+=1,e+=1)e===c&&(e=0),d=a[e],r=d._conf.index,r<S?h.appendChild(d):r<=W?(k?d.insertBefore(k):h.appendChild(d),k=d):r<Ua?(j?d.insertBefore(j):n.appendChild(d),j=d):n.appendChild(d)}}(),updateSliceConf:function(a,b){var d=this.getArcPath,g=a.start,o=a.end,H=sa(g),j=sa(o),r,aa,n,m,p,l,f,i,
y,A,C,q,x,u,X,ha,F=this.cx,v=this.cy,s=this.rx,z=this.ry,Y=s+(Z?-1:2),Q=z+(Z?-1:2),D=this.innerRx,L=this.innerRy,G=this.depth,I=this.depthY,M=a.elements,t,N,da,K;r=w(H);aa=P(H);n=w(j);m=P(j);p=F+s*r;l=v+z*aa;f=F+Y*r;i=v+Q*aa;t=l+G;N=F+s*n;da=v+z*m;y=F+Y*n;A=v+Q*m;K=da+G;this.isDoughnut?(C=F+D*r,q=v+L*aa,X=q+G,x=F+D*n,u=v+L*m,ha=u+G,a.startSlice=[c,p,l,k,p,t,C,X,C,q,h],a.endSlice=[c,N,da,k,N,K,x,ha,x,u,h]):(a.startSlice=[c,p,l,k,p,t,F,I,F,v,h],a.endSlice=[c,N,da,k,N,K,F,I,F,v,h]);if(Z){d=(H>j?fa:0)+
j-H;a.clipTopPath=this.isDoughnut?[c,p,l,e,s,z,0,d>W?1:0,1,N,da,k,x,u,e,D,L,0,d>W?1:0,0,C,q,h]:[c,p,l,e,s,z,0,d>W?1:0,1,N,da,k,this.cx,this.cy,h];a.clipOuterFrontPath1=this.clipPathforNoClip;a.clipTopBorderPath=[c,f,i,e,Y,Q,0,d>W?1:0,1,y,A,k,N,da,N,da+1,e,s,z,0,d>W?1:0,0,p,l+1,k,p,l,h];if(g!=o)if(H>j)if(H<W){if(a.clipOuterFrontPath=[c,this.rightX,v,e,s,z,0,0,1,N,da,"v",G,e,s,z,0,0,0,this.rightX,v+G,h],a.clipOuterFrontPath1=[c,this.leftX,v,e,s,z,0,0,0,p,l,"v",G,e,s,z,0,0,1,this.leftX,v+G,h],a.clipOuterBackPath=
[c,this.rightX,v,e,s,z,0,1,0,this.leftX,v,"v",G,e,s,z,0,1,1,this.rightX,v+G,h],this.isDoughnut)a.clipInnerBackPath=[c,this.rightInnerX,v,e,D,L,0,1,0,this.leftInnerX,v,"v",G,e,D,L,0,1,1,this.rightInnerX,v+G,h],a.clipInnerFrontPath=[c,this.rightInnerX,v,e,D,L,0,0,1,x,u,"v",G,e,D,L,0,0,0,this.rightInnerX,v+G,h,c,this.leftInnerX,v,e,D,L,0,0,0,C,q,"v",G,e,D,L,0,0,1,this.leftInnerX,v+G,h]}else if(j>W){if(a.clipOuterFrontPath=[c,this.rightX,v,e,s,z,0,1,1,this.leftX,v,"v",G,e,s,z,0,1,0,this.rightX,v+G,h],
a.clipOuterBackPath=[c,this.leftX,v,e,s,z,0,0,1,N,da,"v",G,e,s,z,0,0,0,this.leftX,v+G,h,c,this.rightX,v,e,s,z,0,0,0,p,l,"v",G,e,s,z,0,0,1,this.rightX,v+G,h],this.isDoughnut)a.clipInnerFrontPath=[c,this.rightInnerX,v,e,D,L,0,1,1,this.leftInnerX,v,"v",G,e,D,L,0,1,0,this.rightInnerX,v+G,h],a.clipInnerBackPath=[c,this.leftInnerX,v,e,D,L,0,0,1,x,u,"v",G,e,D,L,0,0,0,this.leftInnerX,v+G,h,c,this.rightInnerX,v,e,D,L,0,0,0,C,q,"v",G,e,D,L,0,0,1,this.rightInnerX,v+G,h]}else{if(a.clipOuterFrontPath=[c,this.rightX,
v,e,s,z,0,0,1,N,da,"v",G,e,s,z,0,0,0,this.rightX,v+G,h],a.clipOuterBackPath=[c,p,l,e,s,z,0,0,1,this.rightX,v,"v",G,e,s,z,0,0,0,p,t,h],this.isDoughnut)a.clipInnerFrontPath=[c,this.rightInnerX,v,e,D,L,0,0,1,x,u,"v",G,e,D,L,0,0,0,this.rightInnerX,v+G,h],a.clipInnerBackPath=[c,C,q,e,D,L,0,0,1,this.rightInnerX,v,"v",G,e,D,L,0,0,0,C,X,h]}else if(H<W)if(j>W){if(a.clipOuterFrontPath=[c,p,l,e,s,z,0,0,1,this.leftX,v,"v",G,e,s,z,0,0,0,p,t,h],a.clipOuterBackPath=[c,this.leftX,v,e,s,z,0,0,1,N,da,"v",G,e,s,z,0,
0,0,this.leftX,v+G,h],this.isDoughnut)a.clipInnerFrontPath=[c,C,q,e,D,L,0,0,1,this.leftInnerX,v,"v",G,e,D,L,0,0,0,C,X,h],a.clipInnerBackPath=[c,this.leftInnerX,v,e,D,L,0,0,1,x,u,"v",G,e,D,L,0,0,0,this.leftInnerX,v+G,h]}else{if(a.clipOuterFrontPath=[c,p,l,e,s,z,0,0,1,N,da,"v",G,e,s,z,0,0,0,p,t,h],a.clipOuterBackPath=this.clipPathforNoClip,this.isDoughnut)a.clipInnerFrontPath=[c,C,q,e,D,L,0,0,1,x,u,"v",G,e,D,L,0,0,0,C,X,h],a.clipInnerBackPath=this.clipPathforNoClip}else{if(a.clipOuterFrontPath=this.clipPathforNoClip,
a.clipOuterBackPath=[c,p,l,e,s,z,0,0,1,N,da,"v",G,e,s,z,0,0,0,p,t,h],this.isDoughnut)a.clipInnerFrontPath=this.clipPathforNoClip,a.clipInnerBackPath=[c,C,q,e,D,L,0,0,1,x,u,"v",G,e,D,L,0,0,0,C,X,h]}else a.clipOuterFrontPath=a.clipOuterBackPath=a.clipInnerBackPath=a.clipInnerFrontPath=this.clipPathforNoClip;if(!b){a.elements.startSlice._conf.index=H;a.elements.endSlice._conf.index=j;a.elements.frontOuter._conf.index=Ea(j,H);if(a.elements.frontOuter1)a.elements.frontOuter1._conf.index=H,a.elements.frontOuter1.attr("litepath",
[a.clipOuterFrontPath1]);a.thisElement.attr("litepath",[a.clipTopPath]);a.elements.bottom.attr("litepath",[a.clipTopPath]);a.elements.bottomBorder.attr("litepath",[a.clipTopPath]);a.elements.topBorder&&a.elements.topBorder.attr("litepath",[a.clipTopBorderPath]);a.elements.frontOuter.attr("litepath",[a.clipOuterFrontPath]);a.elements.backOuter.attr("litepath",[a.clipOuterBackPath]);if(this.isDoughnut)a.elements.backInner.attr("litepath",[a.clipInnerBackPath]),a.elements.frontInner.attr("litepath",
[a.clipInnerFrontPath]),a.elements.backInner._conf.index=Ea(j,H);this.hasOnePoint?(a.elements.startSlice.hide(),a.elements.endSlice.hide()):(a.elements.startSlice.attr("litepath",[a.startSlice]).show(),a.elements.endSlice.attr("litepath",[a.endSlice]).show())}}else{f=this.moveCmdArr;i=this.lineCmdArr;y=this.closeCmdArr;var E=this.centerPoint;A=this.leftPoint;var Y=this.topPoint,Q=this.rightPoint,G=this.bottomPoint,S=this.leftDepthPoint,T=this.rightDepthPoint;r=this.leftInnerPoint;aa=this.rightInnerPoint;
n=this.leftInnerDepthPoint;m=this.rightInnerDepthPoint;a.clipOuterFrontPath1=[];if(g!=o){if(H>j?H<W?(g=d(F,v,p,l,this.leftX,v,s,z,1,0),o=d(F,v,this.leftX,v,this.rightX,v,s,z,1,0),da=d(F,v,this.rightX,v,N,da,s,z,1,0),a.clipOuterBackPath=f.concat(A,o,i,T,d(F,I,this.rightX,I,this.leftX,I,s,z,0,0),y),a.clipOuterFrontPath1=f.concat([p,l],g,i,S,d(F,I,this.leftX,I,p,t,s,z,0,0),y),a.clipOuterFrontPath=f.concat(Q,da,i,[N,K],d(F,I,N,K,this.rightX,I,s,z,0,0),y),a.clipTopBorderPath=f.concat([p,l],g,o,da),this.isDoughnut?
(p=d(F,v,x,u,this.rightInnerX,v,D,L,0,0),l=d(F,v,this.rightInnerX,v,this.leftInnerX,v,D,L,0,0),q=d(F,v,this.leftInnerX,v,C,q,D,L,0,0),a.clipInnerBackPath=f.concat(aa,l,i,n,d(F,I,this.leftInnerX,I,this.rightInnerX,I,D,L,1,0),y),a.clipInnerFrontPath=f.concat(r,q,i,[C,X],d(F,I,C,X,this.leftInnerX,I,D,L,1,0),y,f,[x,u],p,i,m,d(F,I,this.rightInnerX,I,x,ha,D,L,1,0),y),a.clipTopPath=a.clipTopBorderPath.concat(i,[x,u],p,l,q,y),a.clipTopBorderPath=a.clipTopBorderPath.concat(f,[x,u],p,l,q)):a.clipTopPath=a.clipTopBorderPath.concat(i,
E,y)):j>W?(g=d(F,v,p,l,this.rightX,v,s,z,1,0),o=d(F,v,this.rightX,v,this.leftX,v,s,z,1,0),da=d(F,v,this.leftX,v,N,da,s,z,1,0),a.clipOuterFrontPath=f.concat(Q,o,i,S,d(F,I,this.leftX,I,this.rightX,I,s,z,0,0),y),a.clipOuterBackPath=f.concat([p,l],g,i,T,d(F,I,this.rightX,I,p,t,s,z,0,0),y,f,A,da,i,[N,K],d(F,I,N,K,this.leftX,I,s,z,0,0),y),a.clipTopBorderPath=f.concat([p,l],g,o,da),this.isDoughnut?(p=d(F,v,x,u,this.leftInnerX,v,D,L,0,0),l=d(F,v,this.leftInnerX,v,this.rightInnerX,v,D,L,0,0),q=d(F,v,this.rightInnerX,
v,C,q,D,L,0,0),a.clipInnerFrontPath=f.concat(r,l,i,m,d(F,I,this.rightInnerX,I,this.leftInnerX,I,D,L,1,0),y),a.clipInnerBackPath=f.concat(aa,q,i,[C,X],d(F,I,C,X,this.rightInnerX,I,D,L,1,0),y,f,[x,u],p,i,n,d(F,I,this.leftInnerX,I,x,ha,D,L,1,0),y),a.clipTopPath=a.clipTopBorderPath.concat(i,[x,u],p,l,q,y),a.clipTopBorderPath=a.clipTopBorderPath.concat(f,[x,u],p,l,q)):a.clipTopPath=a.clipTopBorderPath.concat(i,E,y)):(g=d(F,v,p,l,this.rightX,v,s,z,1,0),o=d(F,v,this.rightX,v,N,da,s,z,1,0),a.clipOuterFrontPath=
f.concat(Q,o,i,[N,K],d(F,I,N,K,this.rightX,I,s,z,0,0),y),a.clipOuterBackPath=f.concat([p,l],g,i,T,d(F,I,this.rightX,I,p,t,s,z,0,0),y),a.clipTopBorderPath=f.concat([p,l],g,o),this.isDoughnut?(p=d(F,v,x,u,this.rightInnerX,v,D,L,0,0),l=d(F,v,this.rightInnerX,v,C,q,D,L,0,0),a.clipInnerFrontPath=f.concat([x,u],p,i,m,d(F,I,this.rightInnerX,I,x,ha,D,L,1,0),y),a.clipInnerBackPath=f.concat(aa,l,i,[C,X],d(F,I,C,X,this.rightInnerX,I,D,L,1,0),y),a.clipTopPath=a.clipTopBorderPath.concat(i,[x,u],p,l,y),a.clipTopBorderPath=
a.clipTopBorderPath.concat(f,[x,u],p,l)):a.clipTopPath=a.clipTopBorderPath.concat(i,E,y)):H<W?j>W?(g=d(F,v,p,l,this.leftX,v,s,z,1,0),o=d(F,v,this.leftX,v,N,da,s,z,1,0),a.clipOuterBackPath=f.concat(A,o,i,[N,K],d(F,I,N,K,this.leftX,I,s,z,0,0),y),a.clipOuterFrontPath=f.concat([p,l],g,i,S,d(F,I,this.leftX,I,p,t,s,z,0,0),y),a.clipTopBorderPath=f.concat([p,l],g,o),this.isDoughnut?(p=d(F,v,x,u,this.leftInnerX,v,D,L,0,0),l=d(F,v,this.leftInnerX,v,C,q,D,L,0,0),a.clipInnerBackPath=f.concat([x,u],p,i,n,d(F,
I,this.leftInnerX,I,x,ha,D,L,1,0),y),a.clipInnerFrontPath=f.concat(r,l,i,[C,X],d(F,I,C,X,this.leftInnerX,I,D,L,1,0),y),a.clipTopPath=a.clipTopBorderPath.concat(i,[x,u],p,l,y),a.clipTopBorderPath=a.clipTopBorderPath.concat(f,[x,u],p,l)):a.clipTopPath=a.clipTopBorderPath.concat(i,E,y)):(g=d(F,v,p,l,N,da,s,z,1,0),a.clipOuterBackPath=f.concat([p,l]),a.clipTopBorderPath=a.clipOuterBackPath.concat(g),a.clipOuterFrontPath=a.clipTopBorderPath.concat(i,[N,K],d(F,I,N,K,p,t,s,z,0,0),y),this.isDoughnut?(p=d(F,
v,x,u,C,q,D,L,0,0),a.clipInnerBackPath=f.concat([x,u]),a.clipTopPath=a.clipTopBorderPath.concat(i,[x,u],p,y),a.clipTopBorderPath=a.clipTopBorderPath.concat(f,[x,u],p),a.clipInnerFrontPath=a.clipInnerBackPath.concat(p,i,[C,X],d(F,I,C,X,x,ha,D,L,1,0),y)):a.clipTopPath=a.clipTopBorderPath.concat(i,E,y)):(g=d(F,v,p,l,N,da,s,z,1,0),a.clipOuterFrontPath=f.concat([p,l]),a.clipTopBorderPath=a.clipOuterFrontPath.concat(g),a.clipOuterBackPath=a.clipTopBorderPath.concat(i,[N,K],d(F,I,N,K,p,t,s,z,0,0),y),this.isDoughnut?
(p=d(F,v,x,u,C,q,D,L,0,0),a.clipInnerFrontPath=f.concat([x,u]),a.clipTopPath=a.clipTopBorderPath.concat(i,[x,u],p,y),a.clipTopBorderPath=a.clipTopBorderPath.concat(a.clipInnerFrontPath,p),a.clipInnerBackPath=a.clipInnerFrontPath.concat(p,i,[C,X],d(F,I,C,X,x,ha,D,L,1,0),y)):a.clipTopPath=a.clipTopBorderPath.concat(i,E,y)),g=f.concat(A,i,Q),p=f.concat(Y,i,G),a.clipTopPath=a.clipTopPath.concat(g,p),a.clipOuterFrontPath=a.clipOuterFrontPath.concat(g),a.clipOuterFrontPath1=a.clipOuterFrontPath1.concat(g),
a.clipOuterBackPath=a.clipOuterBackPath.concat(g),this.isDoughnut)p=f.concat(r,i,aa),a.clipInnerFrontPath=a.clipInnerFrontPath.concat(p),a.clipInnerBackPath=a.clipInnerBackPath.concat(p)}else if(a.clipTopPath=a.clipOuterFrontPath=a.clipOuterBackPath=[],this.isDoughnut)a.clipInnerFrontPath=a.clipInnerBackPath=[];if(!b){a.elements.startSlice._conf.index=H;a.elements.endSlice._conf.index=j;a.elements.frontOuter._conf.index=Ea(j,H);if(a.elements.frontOuter1)a.elements.frontOuter1._conf.index=H,M.frontOuter1.attr({path:a.clipOuterFrontPath1});
a.thisElement.attr({path:a.clipTopPath});M.topBorder.attr({path:a.clipTopBorderPath});M.bottom.attr({path:a.clipTopPath});M.bottomBorder.attr({path:a.clipTopBorderPath});M.frontOuter.attr({path:a.clipOuterFrontPath});M.backOuter.attr({path:a.clipOuterBackPath});this.isDoughnut&&(M.frontInner.attr({path:a.clipInnerFrontPath}),M.backInner.attr({path:a.clipInnerBackPath}));this.hasOnePoint?(a.elements.startSlice.hide(),a.elements.endSlice.hide()):(a.elements.startSlice.attr({path:a.startSlice}).show(),
a.elements.endSlice.attr({path:a.endSlice}).show())}}},createSlice:function(){var a={stroke:!0,strokeWidth:!0,"stroke-width":!0,dashstyle:!0,"stroke-dasharray":!0,translateX:!0,translateY:!0,"stroke-opacity":!0,transform:!0,fill:!0,opacity:!0,ishot:!0,start:!0,end:!0,cursor:!0},b=function(b,d){var c,e,g=this,k=g._confObject,l,h=k.elements,f,o,J=k.pie3DManager;typeof b==="string"&&d!==void 0&&d!==null&&(c=b,b={},b[c]=d);if(!b||typeof b==="string")g=g._attr(b);else{if(b.cx!==void 0)b.start=b.cx;if(b.cy!==
void 0)b.end=b.cy;for(c in b)if(e=b[c],a[c])if(k[c]=e,c==="ishot"||c==="cursor"){l={};l[c]=e;for(f in h)h[f].attr(l);g._attr(l)}else if(c==="transform"){for(f in h)h[f].attr({transform:b[c]});g._attr({transform:b[c]})}else if(c==="stroke"||c==="strokeWidth"||c==="stroke-width"||c==="dashstyle"||c==="stroke-dasharray")l={},l[c]=e,h.topBorder&&h.topBorder.attr(l),h.startSlice.attr(l),h.endSlice.attr(l),h.bottomBorder.attr(l);else{if(c!=="fill"&&(c==="start"||c==="end"))o=!0}else g._attr(c,e);o&&(J.updateSliceConf(k),
J.refreshDrawing())}return g},d=function(a,b,d,c){var e=this._confObject.elements,g;for(g in e)if(d)e[g].drag(b,d,c);else e[g].on(a,b);return d?this.drag(b,d,c):this._on(a,b)},c=function(){var a=this._confObject.elements,b;for(b in a)a[b].hide();return this._hide()},e=function(){var a=this._confObject.elements,b;for(b in a)a[b].show();return this._show()},k=function(){var a=this._confObject,b=a.elements,d;for(d in b)b[d].destroy();Z&&(a.clipTop.destroy(),a.clipOuterFront.destroy(),a.clipOuterBack.destroy(),
a.clipOuterFront1&&a.clipOuterFront1.destroy(),a.clipInnerFront&&a.clipInnerFront.destroy(),a.clipInnerBack&&a.clipInnerBack.destroy());return this._destroy()};return function(a,r,h,n,m,p,l,f,o){var H=this.renderer,h=this.parseColor(h,n),i,a={start:a,end:r,elements:{},pie3DManager:this},r=this.slicingWallsArr,n=a.elements,w,q=Z?"litepath":"path";this.updateSliceConf(a,!0);if(Z){i={fill:ba(h.top),"stroke-width":0};if(o!==1)i.stroke=m,i["stroke-width"]=p;i=H[q](a.clipTopPath,this.topGroup).attr(i);
if(o)n.topBorder=H[q](a.clipTopBorderPath,this.topGroup).attr({fill:ba(h.topBorder),"stroke-width":0})}else i=H[q](a.clipTopPath,this.topGroup).attr({fill:ba(h.top),"stroke-width":0}),n.topBorder=H[q](a.clipTopBorderPath,this.topGroup).attr({stroke:m,"stroke-width":p});n.bottom=H[q](a.clipTopPath,this.bottomBorderGroup).attr({fill:ba(h.bottom),"stroke-width":0});n.bottomBorder=H[q](Z?a.clipTopPath:a.clipTopBorderPath,this.bottomBorderGroup).attr({stroke:m,"stroke-width":p});n.frontOuter=H[q](a.clipOuterFrontPath,
this.slicingWallsFrontGroup).attr({fill:ba(h.frontOuter),"stroke-width":0});n.backOuter=H[q](a.clipOuterBackPath,this.outerBackGroup).attr({fill:ba(h.backOuter),"stroke-width":0});n.startSlice=H[q](a.startSlice,this.slicingWallsFrontGroup).attr({fill:ba(h.startSlice),stroke:m,"stroke-width":p});n.endSlice=H[q](a.endSlice,this.slicingWallsFrontGroup).attr({fill:ba(h.endSlice),stroke:m,"stroke-width":p});m=sa(a.start);p=sa(a.end);o=(m>p?fa:0)+p-m;if(o>W&&(n.frontOuter1=H[q](a.clipOuterFrontPath1,this.slicingWallsFrontGroup).attr({fill:ba(h.frontOuter),
"stroke-width":0}),n.frontOuter1._conf={index:m,isStart:0.5,pIndex:l},Z))a.clipOuterFront1=a.clipOuterFrontPath1;n.frontOuter._conf={index:Ea(p,m),isStart:0.5,pIndex:l};n.startSlice._conf={index:m,isStart:0,pIndex:l};n.endSlice._conf={index:p,isStart:1,pIndex:l};this.hasOnePoint&&(n.startSlice.hide(),n.endSlice.hide());this.isDoughnut?(n.frontInner=H[q](a.clipInnerFrontPath,this.innerFrontGroup).attr({fill:ba(h.frontInner),"stroke-width":0}),n.backInner=H[q](a.clipInnerBackPath,this.innerBackGroup).attr({fill:ba(h.backInner),
"stroke-width":0}),n.backInner._conf={index:Ea(p,m),isStart:0.5,pIndex:l},o>W?Z?r.push(n.startSlice,n.frontOuter1,n.frontOuter,n.backInner,n.endSlice):r.push(n.startSlice,n.frontOuter1,n.frontOuter,n.endSlice):Z?r.push(n.startSlice,n.frontOuter,n.backInner,n.endSlice):r.push(n.startSlice,n.frontOuter,n.endSlice)):o>W?r.push(n.startSlice,n.frontOuter1,n.frontOuter,n.endSlice):r.push(n.startSlice,n.frontOuter,n.endSlice);if(f!==void 0){for(w in n)n[w].tooltip(f);i.tooltip(f)}if(Z&&(a.clipTop=a.clipTopPath,
a.clipOuterFront=a.clipOuterFrontPath,a.clipOuterBack=a.clipOuterBackPath,this.isDoughnut))a.clipInnerFront=a.clipInnerFrontPath,a.clipInnerBack=a.clipInnerBackPath;i._confObject=a;a.thisElement=i;i._destroy=i.destroy;i.destroy=k;i._show=i.show;i.show=e;i._hide=i.hide;i.hide=c;i._on=i.on;i.on=d;i._attr=i.attr;i.attr=b;this.pointElemStore.push(i);return i}}()};Fa.prototype.constructor=Fa;o("renderer.pie3d",{type:"pie3d",drawCaption:function(){var g;var a=this.options.chart,b=this.options.title,d=this.options.subtitle,
c=this.paper,e=this.elements,h=this.layers,j=h.caption,r=e.caption,k=e.subcaption,n=b&&b.text,m=d&&d.text,p=c.width/2,l=b.x,f=d&&d.x;if((n||m)&&!j)j=h.caption=c.group("caption"),h.tracker?j.insertBefore(h.tracker):j.insertAfter(h.dataset);if(n){if(!r)r=e.caption=c.text(j);if(l===void 0)l=p,b.align="middle";r.css(b.style).attr({text:b.text,fill:b.style.color,x:l,y:b.y||a.spacingTop||0,"text-anchor":b.align||"middle","vertical-align":"top",visibility:"visible",title:b.originalText||""})}else if(r)g=
e.caption=r.remove(),r=g;if(m){if(!k)k=e.subcaption=c.text(j);if(f===void 0)f=p,d.align="middle";k.css(d.style).attr({text:d.text,title:d.originalText||"",fill:d.style.color,x:f,y:n?r.attrs.y+r.getBBox().height+2:b.y||a.spacingTop||0,"text-anchor":d.align||"middle","vertical-align":"top",visibility:"visible"})}else if(k)e.subcaption=k.remove();if(!n&&!m&&j)h.caption=j.remove()},translate:function(){var a=0,b=this.options,d=b.series[0],c=b.plotOptions.series.dataLabels,e=b.plotOptions.pie3d,h=i(d.startAngle,
0)%360,j=d.managedPieSliceDepth,r=d.slicedOffset=e.slicedOffset,k=this.canvasWidth,n=this.canvasHeight,m=[this.canvasLeft+k*0.5,this.canvasTop+n*0.5-j*0.5],p,l,o,u,y,b=d.data,X,C=ha(k,n),q,x,t,K=c.distance,M=d.pieYScale,F=d.pieSliceDepth,v=d.slicedOffsetY=r*M;m.push(e.size,e.innerSize||0);m=ja(m,function(a,b){return(q=/%$/.test(a))?[k,n-j,C,C][b]*parseInt(a,10)/100:a});m[2]/=2;m[3]/=2;m.push(m[2]*M);m.push((m[2]+m[3])/2);m.push(m[5]*M);d.getX=function(a,b){o=H.asin((a-m[1])/(m[2]+K));return m[0]+
(b?-1:1)*w(o)*(m[2]+K)};d.center=m;qa(b,function(b){a+=b.y});d.labelsRadius=m[2]+K;d.labelsRadiusY=d.labelsRadius*M;d.quadrantHeight=(n-j)/2;d.quadrantWidth=k/2;u=-h*T;u=A(u*1E3)/1E3;y=u+fa;e=f(parseInt(c.style.fontSize,10),10)+4;d.maxLabels=ia(d.quadrantHeight/e);d.labelFontSize=e;d.connectorPadding=f(c.connectorPadding,5);d.isSmartLineSlanted=i(c.isSmartLineSlanted,!0);d.connectorWidth=f(c.connectorWidth,1);d.enableSmartLabels=c.enableSmartLabels;if(!d.pie3DManager)d.pie3DManager=new Fa(m[0],m[1],
m[2],m[3],M,F,this.layers.dataset,this.paper,d.data.length===1,d.use3DLighting);qa(b,function(b){p=u;X=a?b.y/a:0;u=A((u+X*fa)*1E3)/1E3;u>y&&(u=y);l=u;b.shapeArgs={start:A(p*1E3)/1E3,end:A(l*1E3)/1E3};b.centerAngle=o=(l+p)/2%fa;b.slicedTranslation=[A(w(o)*r),A(P(o)*v)];x=w(o)*m[2];d.radiusY=t=P(o)*m[4];b.tooltipPos=[m[0]+x*0.7,m[1]+t];b.percentage=X*100;b.total=a})},drawPlotPie3d:function(a,b){this.translate();var d=this,c=a.items,e=a.data,h=d.options,j=h.plotOptions,k=j.series,o=d.layers,n=d.elements.plots[0],
m=d.datasets[0],j=j.series.dataLabels,p=k.dataLabels.style,k=f(a.moveDuration,k.animation.duration),l=d.paper,h=(h=h.tooltip||{})&&h.enabled!==!1,i,H=m.slicedOffset,u=m.slicedOffsetY,A=d.plotGraphicClick,C=d.plotDragMove,q=d.plotDragStart,x=d.plotDragEnd,X=d.plotMouseDown,M=d.plotMouseUp,t=!!d.datasets[0].enableRotation,F=b.showBorderEffect,v=e.length,s,z,ha,K,D,L,G,I,Y,E,N;if(!e||!v)e=[];n.singletonCase=v==1;n.chartPosition=Da(d.container);n.pieCenter=m.center;n.timerThreshold=30;for(N=-1;++N<v;)if(z=
e[N],ha=z.y,K=z.displayValue,L=z.sliced,E=z.shapeArgs,I=z.centerAngle,i=z.toolText,G=(D=!!z.link)||t||!z.doNotSlice,!(ha===null||ha===void 0))if(!(s=c[N])){b.data[N].plot=s=c[N]={chart:d,index:N,seriesData:n,value:ha,angle:I,link:z.link,shapeArgs:E,slicedX:L&&!n.singletonCase?w(I)*H:0,slicedY:L&&!n.singletonCase?P(I)*u:0,sliced:L,labelText:K,name:z.name,label:z.name,percentage:z.percentage,toolText:i,originalIndex:v-N-1,graphic:m.pie3DManager.createSlice(E.start,E.end,z.color,z._3dAlpha,z.borderColor,
z.borderWidth,N,h?i:"",F)};b.data[N].legendClick=function(a){return function(){d.legendClick(a,!0,!1)}}(s);s.graphic.plotItem=s;s.transX=w(I)*H;s.transY=P(I)*u;s.slicedTranslation="t"+s.transX+","+s.transY;s.graphic.attr({transform:"t"+s.slicedX+","+s.slicedY,ishot:G,cursor:D?"pointer":""});if(!z.doNotSlice)s.graphic.on("click",function(a){return function(){A.call(a)}}(s));s.graphic.on("drag",function(a){return function(b,d,c,e,g){C.call(a,b,d,c,e,g)}}(s),function(a){return function(b,d,c){q.call(a,
b,d,c)}}(s),function(a){return function(){x.call(a)}}(s));s.graphic.on("mousedown",function(a){return function(){X.call(a)}}(s));s.graphic.on("mouseup",function(a){return function(){M.call(a)}}(s));if(K!==void 0&&(s.dataLabel=l.text(o.dataset).css(p).attr({text:K,title:z.originalText||"",fill:p.color||"#000000",visibility:"hidden",ishot:G,cursor:D?"pointer":""}),s.dataLabel.click(A,s),s.dataLabel.mousedown(X,s),s.dataLabel.mouseup(M,s),j.distance>0&&(Y=j.connectorWidth)&&j.enableSmartLabels))s.connector=
l.path("M 0 0 l 0 0",o.dataset).attr({"stroke-width":Y,stroke:j.connectorColor||"#606060",visibility:"hidden",ishot:G,cursor:D?"pointer":""}),s.connector.click(A,s),s.connector.mousedown(X,s),s.connector.mouseup(M,s)}m.pie3DManager.refreshDrawing();k>0?d.animate(c,k):d.placeDataLabels(!1,c)},rotate:function(a){var b=this.datasets[0],d=this.elements.plots[0].items,c=b.slicedOffset,e=b.slicedOffsetY,h=b.startAngle,j,a=a||-b._lastAngle;j=(a-h)%360;b.startAngle=f(a,b.startAngle)%360;j=-(j*u)/180;b.pie3DManager&&
b.pie3DManager.rotate(j);qa(d,function(a){var b=a.graphic,d=a.shapeArgs,d={start:d.start+=j,end:d.end+=j},h=a.angle=sa((d.start+d.end)/2),d=a.sliced,k=w(h),h=P(h);a.slicedTranslation=[A(k*c),A(h*e)];a.transX=a.slicedTranslation[0];a.transY=a.slicedTranslation[1];a.slicedX=d?w(j)*c:0;a.slicedY=d?P(j)*e:0;b&&d&&a.graphic.attr({transform:"t"+a.slicedTranslation[0]+","+a.slicedTranslation[1]})});this.placeDataLabels(!0,d)},plotMouseDown:function(){this.seriesData.isRotating=!1},plotMouseUp:function(){var a=
this.chart,b=this.seriesData;!b.isRotating&&a.linkClickFN.call({link:b.data[this.index].link},a);ga._supportsTouch&&!b.isRotating&&a.plotGraphicClick.call(this)},plotDragStart:function(a,b,d){var c=this.seriesData,e=this.chart.datasets[0];if(e.enableRotation)a=Ja.call(d,a,b,c.pieCenter,c.chartPosition,e.pieYScale),e.dragStartAngle=a,e._lastAngle=-e.startAngle},plotDragEnd:function(){var a=this,b=a.chart,d={hcJSON:{series:[{startAngle:b.datasets[0].startAngle}]}};b.disposed||xa(b.logic.chartInstance.jsVars._reflowData,
d,!0);setTimeout(function(){a.seriesData.isRotating=!1},0)},plotDragMove:function(a,b,d,c,e){var h=this.chart,a=h.datasets[0],b=this.seriesData;if(h.options.series[0].enableRotation&&!b.singletonCase&&(b.isRotating=!0,d=Ja.call(e,d,c,b.pieCenter,b.chartPosition,a.pieYScale),c=d-a.dragStartAngle,a.dragStartAngle=d,b.moveDuration=0,a._lastAngle+=c*180/u,d=(new Date).getTime(),!a._lastTime||a._lastTime+b.timerThreshold<d))a._lastTime||h.rotate(),b.timerId=setTimeout(function(){(!h.disposed||!h.disposing)&&
h.rotate()},b.timerThreshold),a._lastTime=d},animate:function(a,b){var d,c,e,h=a.length,j,k,f,n=this,m;if(n.datasets[0].alphaAnimation)n.layers.dataset.attr({opacity:0}),n.layers.dataset.animate({opacity:1},b,"ease-in",function(){!n.disposed&&!n.disposing&&n.placeDataLabels(!1,a)});else for(d=0;d<h;d++)if(j=a[d],k=j.graphic,f=j.shapeArgs,j=2*u,k)k.attr({start:j,end:j}),m=f.start,f=f.end,c?k.animateWith(c,e,{cx:m-j,cy:f-j},b,"ease-in"):(e=ga.animation({cx:m-j,cy:f-j},b,"ease-in",function(){!n.disposed&&
!n.disposing&&n.placeDataLabels(!1,a)}),c=k.animate(e))},plotGraphicClick:function(){var a=this.seriesData,b=this.chart,c,e,h,k,j,f;if(!a.isRotating&&!a.singletonCase)return c=this.graphic,e=this.connector,h=this.dataLabel,a=this.sliced,k=this.connectorPath,j=(a?-1:1)*this.transX,f=(a?-1:1)*this.transY,c.animate({transform:a?"t0,0":"t"+j+","+f},200,"easeIn"),h&&h.x&&h.animate({x:h.x+(a?0:j)},200,"easeIn"),k&&(k[1]+=j,k[2]+=f,k[4]+=j,k[6]+=j,e.animate({path:k},200,"easeIn")),a=this.sliced=!a,c={hcJSON:{series:[]}},
c.hcJSON.series[0]={data:[]},xa(b.logic.chartInstance.jsVars._reflowData,c,!0),a},placeDataLabels:function(){var a=function(a,b){return a.point.value-b.point.value},e=function(a,b){return a.angle-b.angle},d=["start","start","end","end"],g=[-1,1,1,-1],h=[1,1,-1,-1];return function(o,j){var r=this.datasets[0],i=this.smartLabel,n=this.options.plotOptions.series.dataLabels,m=n.style,p=f(ta(parseFloat(m.lineHeight)),12),l=ka(n.placeInside,!1),u=n.skipOverlapLabels,X=n.manageLabelOverflow,y=n.connectorPadding,
K=n.distance;ka(n.softConnector,!0);var C=n.connectorWidth,q,x,K=K>0,t=r.center,E=t[1],T=t[0],F=t[2],v=t[4],s=[[],[],[],[]],z,V,Q,D=this.canvasLeft,L=this.canvasTop,G=this.canvasWidth,I,R,B,N,da,ia,ca,O,ba,Z,oa,Ha=r.labelsRadius,ea=A(r.labelsRadiusY*100)/100,ga=r.labelFontSize,U=ga,Ca=U/2,y=[y,y,-y,-y],ja=r.maxLabels,Ra=r.isSmartLineSlanted,na=r.enableSmartLabels,pa,r=r.pieSliceDepth/2;o||i.setStyle(m);if(j.length==1){if(N=j[0],pa=N.dataLabel,N.slicedTranslation=[D,L],pa)pa.attr({visibility:b,"text-anchor":"middle",
x:T,y:E+Ca-2}),pa.x=T}else if(l)qa(j,function(a){if(pa=a.dataLabel){oa=a.angle;Z=E+t[6]*P(oa)+Ca-2;ca=T+t[5]*w(oa);pa.x=ca;pa._x=ca;pa.y=Z;if(a.sliced){var a=a.slicedTranslation,c=a[1]-L;ca+=a[0]-D;Z+=c}pa.attr({visibility:b,align:"middle",x:ca,y:Z})}});else{qa(j,function(a){if(pa=a.dataLabel)oa=a.angle,oa<0&&(oa=fa+oa),z=oa>=0&&oa<S?1:oa<W?2:oa<Ua?3:0,s[z].push({point:a,angle:oa})});for(Q=l=4;Q--;){if(u&&(N=s[Q].length-ja,N>0)){s[Q].sort(a);V=s[Q].splice(0,N);R=0;for(B=V.length;R<B;R+=1)N=V[R].point,
N.dataLabel.attr({visibility:"hidden"}),N.connector&&N.connector.attr({visibility:"hidden"})}s[Q].sort(e)}Q=Y(s[0].length,s[1].length,s[2].length,s[3].length);ea=Y(ha(Q,ja)*U,ea+U);s[1].reverse();s[3].reverse();for(i.setStyle(m);l--;){R=s[l];B=R.length;u||(U=B>ja?ea/B:ga,Ca=U/2);N=B*U;m=ea;for(Q=0;Q<B;Q+=1,N-=U)x=M(ea*P(R[Q].angle)),m<x?x=m:x<N&&(x=N),m=(R[Q].oriY=x)-U;V=d[l];B=ea-(B-1)*U;m=0;for(Q=R.length-1;Q>=0;Q-=1,B+=U){N=R[Q].point;oa=R[Q].angle;da=N.sliced;pa=N.dataLabel;x=M(ea*P(oa));x<m?
x=m:x>B&&(x=B);m=x+U;O=(x+R[Q].oriY)/2;x=T+h[l]*Ha*w(H.asin(O/ea));O*=g[l];O+=E;ba=E+v*P(oa);ia=T+F*w(oa);(l<2&&x<ia||l>1&&x>ia)&&(x=ia);ca=x+y[l];Z=O+Ca-2;q=ca+y[l];pa.x=q;pa._x=q;X&&(I=l>1?q-this.canvasLeft:this.canvasLeft+G-q,I=i.getSmartText(N.labelText,I,p),pa.attr({text:I.text,title:I.tooltext||""}));oa<W&&(O+=r,ba+=r,Z+=r);pa.y=Z;if(da)da=N.transX,I=N.transY,ca+=da,x+=da,ia+=da,ba+=I,q+=da;pa.attr({visibility:b,"text-anchor":V,x:q,y:O});if(K&&C&&na)q=N.connector,N.connectorPath=x=[c,ia,ba,
k,Ra?x:ia,O,ca,O],q?(q.attr({path:x}),q.attr("visibility",b)):N.connector=q=this.paper.path(x).attr({"stroke-width":C,stroke:n.connectorColor||"#606060",visibility:b})}}}}}(),legendClick:function(a,b,c){var e=a.chart;a.chart.elements.plots[0].isRotating=!1;e.plotGraphicClick.call(a);c!==!0&&(eventArgs={datasetName:a.label,datasetIndex:a.originalIndex,id:a.userID,visible:b,label:a.label,value:a.value,percentValue:a.percentage,tooltext:a.toolText,link:a.link,sliced:!a.sliced},ma.raiseEvent("legenditemclicked",
eventArgs,e.logic.chartInstance))}},o["renderer.root"]);o("renderer.pie",{drawPlotPie:function(a,c){var d=this,e=a.items,h=a.data,k=d.options,j=k.plotOptions,r=j.pie,o=j.series,n=d.layers,m=n.dataset,p=d.elements.plots[0],j=j.series.dataLabels,l=o.dataLabels.style,i=o.shadow,o=f(a.moveDuration,o.animation.duration),H=d.paper,k=(k=k.tooltip||{})&&k.enabled!==!1,u=((c.startAngle*=-W/180)||0)%fa,A=r.slicedOffset,C=c.valueTotal,q=fa/C,x=d.canvasLeft+d.canvasWidth*0.5,X=d.canvasTop+d.canvasHeight*0.5,
t=r.size*0.5,K=(r.innerSize||0)*0.5,F=d.plotGraphicClick,v=d.plotDragMove,s=d.plotDragStart,z=d.plotDragEnd,ha=d.plotMouseDown,M=d.plotMouseUp,D=!!d.datasets[0].enableRotation,L=h.length,G,I,Y,E,N,S,T,R,B,V,ia,ca=a.shadowGroup,ta,O,U,Z,ea;if(!h||!L)h=[];if(!ca)ca=a.shadowGroup=H.group(m).toBack();p.singletonCase=L==1;p.chartPosition||(p.chartPosition=Da(d.container));p.pieCenter=[x,X];p.timerThreshold=30;V=B=u;for(ta=L;ta--;)if(I=h[ta],Y=I.y,E=I.displayValue,S=I.sliced,r=I.toolText,T=(N=!!I.link)||
D||!I.doNotSlice,!(Y===null||Y===void 0)){G=I.color.FCcolor;G.r=t;G.cx=x;G.cy=X;V=B;B-=!p.singletonCase?Y*q:fa;R=(B+V)*0.5;o?Z=ea=u:(Z=B,ea=V);if(!(G=e[ta]))if(c.data[ta].plot=G=e[ta]={chart:d,index:ta,seriesData:p,value:Y,angle:R,slicedX:w(R)*A,slicedY:P(R)*A,sliced:S,labelText:E,toolText:r,label:I.name,link:I.link,percentage:C?Y*C/100:0,originalIndex:L-ta-1,graphic:H.ringpath(x,X,t,K,Z,ea,n.dataset).attr({"stroke-width":I.borderWidth,"stroke-linejoin":"round",stroke:I.borderColor,fill:ba(I.color),
"stroke-dasharray":I.dashStyle,redrawDataLabels:u,ishot:T,cursor:N?"pointer":""}).shadow(i&&I.shadow,ca).drag(v,s,z).mousedown(ha).mouseup(M)},I.doNotSlice||G.graphic.click(F),k&&G.graphic.tooltip(r),c.data[ta].legendClick=function(a){return function(){d.legendClick(a,!0,!1)}}(G),G.graphic.data("plotItem",G),E!==void 0&&(G.dataLabel=H.text(m).css(l).attr({text:E,fill:l.color||"#000000",ishot:T}).click(F).drag(v,s,z).mousedown(ha).mouseup(M).hide(),G.dataLabel.data("plotItem",G),j.distance>0&&(ia=
j.connectorWidth)&&j.enableSmartLabels))G.connector=H.path("M 0 0 l 0 0",m).attr({"stroke-width":ia,stroke:j.connectorColor||"#606060",visibility:b,ishot:!0}).click(F).drag(v,s,z).mousedown(ha).mouseup(M),G.connector.data("plotItem",G);G.angle=R;G.transX=w(R)*A;G.transY=P(R)*A;G.slicedTranslation="t"+w(R)*A+","+P(R)*A;o?O?G.graphic.animateWith(O,U,{ringpath:[x,X,t,K,B,V],transform:G.sliced?G.slicedTranslation:""},o,"easeIn"):(U=ga.animation({ringpath:[x,X,t,K,B,V],redrawDataLabels:d,transform:G.sliced?
G.slicedTranslation:""},o,"easeIn",function(){if(!d.disposed&&!d.disposing&&!d.paper.ca.redrawDataLabels)d.placeDataLabels(!1,e,a),d.paper.ca.redrawDataLabels=d.redrawDataLabels}),O=G.graphic.animate(U)):G.graphic.attr({transform:G.sliced?G.slicedTranslation:""})}o||d.placeDataLabels(!1,e,a)},rotate:function(a,b){var c=a.items,e=a.data,h=this.options.plotOptions.pie,k=h.slicedOffset,j=fa/b.valueTotal,f=this.canvasLeft+this.canvasWidth*0.5,o=this.canvasTop+this.canvasHeight*0.5,n=h.size*0.5,h=(h.innerSize||
0)*0.5,m,p,l,i,H;l=(b.startAngle||0)%fa;for(H=e.length;H--;)if(m=e[H],p=m.y,!(p===null||p===void 0))m=c[H],i=l,l-=!m.seriesData.singletonCase?p*j:fa,p=(l+i)*0.5,m.angle=p,m.transX=w(p)*k,m.transY=P(p)*k,m.slicedTranslation="t"+w(p)*k+","+P(p)*k,m.graphic.attr({ringpath:[f,o,n,h,l,i],transform:m.sliced?m.slicedTranslation:""});this.placeDataLabels(!0,c,a)}},o["renderer.piebase"])},[3,2,2,"sr4"]]);
FusionCharts(["private","modules.renderer.js-zoomline",function(){var Da=this,ja=Da.hcLib,sa=window,Ea=/msie/i.test(navigator.userAgent)&&!sa.opera,Ja=ja.chartAPI,Fa=ja.chartAPI,ma=ja.extend2,t=ja.raiseEvent,ga=ja.pluck,E=ja.pluckNumber,B=ja.getFirstColor,Ka=ja.graphics.convertColor,i=ja.defaultPaletteOptions,va=ja.bindSelectionEvent,f=ja.createTrendLine,U=ja.parseUnsafeString,ka=ja.Raphael,Oa=ja.FC_CONFIG_STRING,wa="rgba(192,192,192,"+(Ea?0.002:1.0E-6)+")",O=Math,xa=O.ceil,za=O.floor,ba=O.max,Qa=
O.min,Ga=O.cos,Z=O.sin,Aa=parseFloat,qa=parseInt,La=function(b){return b&&b.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&")},la;ma(ja.eventList,{zoomed:"FC_Zoomed",pinned:"FC_Pinned",resetzoomchart:"FC_ResetZoomChart"});Ja("zoomline",{friendlyName:"Zoomable and Panable Multi-series Line Chart",rendererId:"zoomline",standaloneInit:!0,hasVDivLine:!0,defaultSeriesType:"stepzoom",canvasborderthickness:1,defaultPlotShadow:1,chart:function(){var b=this.base.chart.apply(this,arguments),c=this.dataObj.chart,k=
i.canvasBorderColor[this.paletteIndex],e=b.chart;ma(e,{animation:!1,zoomType:"x",canvasPadding:E(c.canvaspadding,0),scrollColor:B(ga(c.scrollcolor,i.altHGridColor[e.paletteIndex])),scrollBtnWidth:E(c.scrollbtnwidth,c.scrollheight,16),scrollHeight:E(c.scrollheight,16)||16,allowPinMode:E(c.allowpinmode,1),skipOverlapPoints:E(c.skipoverlappoints,1),showToolBarButtonTooltext:E(c.showtoolbarbuttontooltext,1),btnResetChartTooltext:ga(c.btnresetcharttooltext,"Reset Chart"),btnZoomOutTooltext:ga(c.btnzoomouttooltext,
"Zoom out one level"),btnSwitchToZoomModeTooltext:ga(c.btnswitchtozoommodetooltext,"<strong>Switch to Zoom Mode</strong><br/>Select a subset of data to zoom into it for detailed view"),btnSwitchToPinModeTooltext:ga(c.btnswitchtopinmodetooltext,"<strong>Switch to Pin Mode</strong><br/>Select a subset of data and compare with the rest of the view"),pinPaneFill:Ka(ga(c.pinpanebgcolor,k),E(c.pinpanebgalpha,15)),zoomPaneFill:Ka(ga(c.zoompanebgcolor,"#b9d5f1"),E(c.zoompanebgalpha,30)),zoomPaneStroke:Ka(ga(c.zoompanebordercolor,
"#3399ff"),E(c.zoompaneborderalpha,80))});return b},preSeriesAddition:function(){var b=this.dataObj,c=b.chart,k=(k=b.categories)&&k[0]||{},b=k.category,e=this.hcJSON,h=e[Oa],f=this.smartLabel,i=E(c.compactdatamode,0),w=ga(c.dataseparator,"|"),X=E(c.showlabels,1),A=c.labeldisplay&&c.labeldisplay.toLowerCase(),t=X&&E(c.labelheight),Y=A==="rotate"?270:E(c.rotatelabels,1)?270:0,M=e.xAxis.labels.style,u=Aa(M.lineHeight),B=e.chart.labelPadding=E(c.labelpadding,2)+e.chart.plotBorderWidth,ia,R=0,T=-1,W,S,
fa;delete k.category;e.categories=A=ma({data:w=i&&b&&b.split&&b.split(w)||b||[],rotate:Y,wrap:A!=="none"},k);b!==void 0&&(k.category=b);k=w.length||0;if(W=!i&&X&&t!==0&&k||0){for(;W--;)w[W]=w[W]&&(ia=w[W].label||"")&&((S=ia.length)>R&&(R=S,T=W,ia)||ia)||"";R&&(ia=w[T])}else if(i&&k)if(Y){S=sa.document.createElement("div");t=sa.document.createElement("span");S.setAttribute("class","fusioncharts-zoomline-localsmartlabel");S.style.cssText="display:block;width:1px;position:absolute;";for(fa in M)S.style[fa]=
M[fa];t.appendChild(sa.document.createTextNode(b.replace(/\s*/g,"").replace(/\|/g," ")));S.appendChild(t);sa.document.body.appendChild(S);t=t.offsetWidth||void 0;S.parentNode.removeChild(S)}else ia=w[k-1]||w[0];if((t===void 0||t===0)&&X)ia?(f.setStyle(M),ia=f.getSmartText(ia),t=Y?ia.width:ia.height):t=u*(Y&&3||1);t>h.height*0.3&&(t=h.height*0.3);A.labelHeight=t&&t+10||0;A.show=t&&X||0;A.css=ma({},M);Y?(A.css.rotation=Y,A.css["text-anchor"]="end"):A.css["vertical-align"]="top";e.xAxis.min=0;e.xAxis.max=
k&&k-1||0;t+=E(c.scrollheight,16)||16;e.chart.marginBottom+=B;h.marginBottomExtraSpace+=t+5;ga(c.caption,c.subcaption)||(h.marginTopExtraSpace+=16)},series:function(){var b=this.dataObj,c=b.chart,k=b.dataset,e=this.hcJSON,h=e[Oa],i=h[0],P=e.series,w=E(c.yaxismaxvalue),t=E(c.yaxisminvalue),A=E(c.forceyaxislimits,0),ha=E(c.compactdatamode,0),Y=ga(c.dataseparator,"|"),M=La(c.indecimalseparator),u=La(c.inthousandseparator),B=E(c.drawanchors,c.showanchors,1),ia=!!E(c.showlegend,1),R,T,W,S,fa,O=Infinity,
U=-Infinity,V;fa=e.categories.data.length;if(k&&k.length&&fa){M&&(M=RegExp(M,"g"));u&&(u=RegExp(u,"g"));!u&&!M&&ha&&A&&w!==void 0&&t!==void 0?(A=!0,U=ba(w,t),O=Qa(t,w)):A=!1;w=0;for(t=k.length;w<t;w++){R=k[w];W=R.data;delete R.data;ha?(S=W||"",u&&(S=S.replace(u,"")),M&&(S=S.replace(M,".")),S=S.split(Y)):S=W||[];if(S.length>fa)S.length=fa;V=S.length;if(ha){if(!A)for(;V--;)T=Aa(S[V]),isNaN(T)&&(T=void 0),T>U&&(U=T),T<=O&&(O=T),S[V]=T}else for(;V--;)T=S[V]&&S[V].value||"",u&&(T=T.replace(u,"")),M&&(T=
T.replace(M,".")),T=Aa(T),isNaN(T)&&(T=void 0),T>U&&(U=T),T<=O&&(O=T),S[V]=T;P.push(T={index:w,type:"zoomline",data:S,name:R.seriesname||"",showInLegend:R.seriesname&&E(R.includeinlegend,1)&&ia||!1,showAnchors:E(R.drawanchors,R.showanchors,B),visible:!!E(R.initiallyvisible,1),lineWidth:2});S.length=fa;W!==void 0&&(R.data=W);T.attrs=this.seriesGraphicsAttrs(R,w);R=T.attrs.anchors;T.color=T.attrs.graphics.stroke;T.ancorRadius=R.r+R["stroke-width"]/2;T.marker={fillColor:R.fill,lineColor:R.stroke,lineWidth:1,
symbol:"circle"}}(U===-Infinity||O===Infinity)&&(U=O=void 0);A=qa(E(c.displaystartindex,1),10)-1;Y=qa(E(c.displayendindex,fa||2),10)-1;(k=E(c.pixelsperpoint,15))<5&&(k=5);(P=E(c.pixelsperlabel,e.categories.rotate?20:60))<k&&(P=k);(A<0||A>=(fa-1||1))&&(A=0);(Y<=A||Y>(fa-1||1))&&(Y=fa-1||1);e.stepZoom={cnd:E(c.connectnulldata,0),amrd:E(c.anchorminrenderdistance,20),nvl:E(c.numvisiblelabels,0),cdm:ha,oppp:k,oppl:P,dsi:A,dei:Y,vdl:Y-A,dmax:i.max=U,dmin:i.min=O,clen:fa,offset:0,step:1,llen:0,alen:0,ddsi:A,
ddei:Y,ppc:0};e.crossline={style:{lineHeight:h.inCanvasStyle.lineHeight,fontSize:h.inCanvasStyle.fontSize,fontFamily:h.inCanvasStyle.fontFamily}};this.configureAxis(e,b);b.trendlines&&f(b.trendlines,e.yAxis,h,!1,this.isBar)}},seriesGraphicsAttrs:function(b,c){var k=this.dataObj.chart,e=this.hcJSON.colors,h=(b.dashed||k.linedashed||"0")!=0,f,e={"stroke-width":E(b.linethickness,k.linethickness,2),stroke:B(ga(b.color,k.linecolor,e[c%e.length])),"stroke-opacity":E(b.alpha,k.linealpha,100)/100,"stroke-dasharray":h?
[E(b.linedashlen,k.linedashlen,5),E(b.linedashgap,k.linedashgap,4)]:"none","stroke-linejoin":"round","stroke-linecap":"round"},h=ma({},e);f=e["stroke-width"]+E(k.pinlinethicknessdelta,1);h["stroke-width"]=f>0&&f||0;h["stroke-dasharray"]=[3,2];return{graphics:e,pin:h,shadow:{opacity:e["stroke-opacity"],apply:E(k.showshadow,+!ka.vml)},anchors:{"stroke-linejoin":"round","stroke-linecap":"round",r:E(b.anchorradius,k.anchorradius,e["stroke-width"]+2),stroke:B(ga(b.anchorbordercolor,k.anchorbordercolor,
e.stroke)),"stroke-opacity":E(b.anchorborderalpha,k.anchorborderalpha,100)/100,"stroke-width":E(b.anchorborderthickness,k.anchorborderthickness,e["stroke-width"]),fill:B(ga(b.anchorbgcolor,k.anchorbgcolor,"#ffffff")),"fill-opacity":E(b.anchorbgalpha,k.anchorbgalpha,100)/100,opacity:E(b.anchoralpha,k.anchoralpha,100)/100},anchorShadow:E(k.anchorshadow,k.showshadow,+!ka.vml)&&{apply:!0,opacity:E(b.anchoralpha,k.anchoralpha,100)/100}}},eiMethods:{zoomOut:function(){var b=this.jsVars,c;if(b&&(c=b.hcObj))return c.zoomOut&&
b.hcObj.zoomOut()},zoomTo:function(b,c){var k=this.jsVars,e;if(k&&(e=k.hcObj))return e.zoomRange&&k.hcObj.zoomRange(b,c-2)},resetChart:function(){var b=this.jsVars,c;if(b&&(c=b.hcObj))c.pinRangePixels&&b.hcObj.pinRangePixels(),c.resetZoom&&b.hcObj.resetZoom()},setZoomMode:function(b){var c=this.jsVars,k;c&&(k=c.hcObj)&&b&&k.pinRangePixels&&c.hcObj.pinRangePixels()},getViewStartIndex:function(){var b=this.jsVars,c;if(b&&b.hcObj&&(c=b.hcObj._zoominfo))return c.ddsi+1},getViewEndIndex:function(){var b=
this.jsVars,c;if(b&&b.hcObj&&(c=b.hcObj._zoominfo))return b=c.ddei-1,b>c.clen?c.clen:b}}},Ja.msline);Fa("renderer.zoomline",{resetZoom:function(){var b=this._zoomhistory,c=this.options.stepZoom;if(!b.length)return!1;b.length=0;this.zoomTo(c.dsi,c.dei)&&t("resetzoomchart",this._zoomargs,this.fusionCharts,[this.fusionCharts.id]);return!0},zoomOut:function(){var b=this._zoomhistory.pop(),c=this.options.stepZoom,k,e,h;b?(k=b.dsi,e=b.dei):this._prezoomed&&(k=0,e=c.clen-1);(h=this.zoomTo(k,e))&&Da.raiseEvent("zoomedout",
h,this.fusionCharts);return!0},zoomRangePixels:function(b,c){var k=this._zoomhistory,e=this._zoominfo,h=e.ppp,e=e.ddsi,f;k.push(this._zoominfo);(f=this.zoomTo(e+za(b/h),e+za(c/h)))?Da.raiseEvent("zoomedin",f,this.fusionCharts):k.pop()},zoomRange:function(b,c){var k=this._zoomhistory,e;k.push(this._zoominfo);(e=this.zoomTo(+b-1,+c+1))?Da.raiseEvent("zoomedin",e,this.fusionCharts):k.pop()},zoomTo:function(b,c){var k=this.xlabels.data,e=this._zoominfo,h=this._zoomhistory,f=e.clen;b<0&&(b=0);b>=f-1&&
(b=f-1);c<=b&&(c=b+1);c>f-1&&(c=f-1);if(b===c||b===e.dsi&&c===e.dei)return!1;this.pinRangePixels();e=ma({},e);e.dsi=b;e.dei=c;e=this._zoominfo=e;this.updatePlotZoomline();this.zoomOutButton[e.vdl===e.clen-1?"hide":"show"]();this.resetButton[h.length?"show":"hide"]();this.elements.zoomscroller.attr({"scroll-ratio":e.vdl/(f-!!f),"scroll-position":[e.dsi/(f-e.vdl-1),!0]});k={level:h.length+1,startIndex:b,startLabel:k[b],endIndex:c,endLabel:k[c]};t("zoomed",k,this.fusionCharts,[this.fusionCharts.id,b,
c,k.startLabel,k.endLabel,k.level]);return k},activatePin:function(b){var c=this._zoominfo,k=this.options.chart,e=this.pinButton;if(e&&c.pinned^(b=!!b))return b||this.pinRangePixels(),k.showToolBarButtonTooltext&&e.tooltip(k[b&&"btnSwitchToZoomModeTooltext"||"btnSwitchToPinModeTooltext"]||""),e.attr("button-active",b),c.pinned=b},pinRangePixels:function(b,c){var k=this.paper,e=this.elements,h=this.xlabels.data,f=this._zoominfo,i=this.layers.zoompin,w=e.pinrect,X=e["clip-pinrect"],A=this._pingrouptransform,
E=this.plots,Y=c-b,M,u;if(f&&i&&w){if(b===c)return i.hide(),e.pintracker.hide(),this.pinButton.attr("button-active",!1),f.pinned=!1;for(u=E.length;u--;){w=E[u];M=w.pinline;if(!M)M=w.pinline=k.path(void 0,i).attr(w.attrPin);M.attr("path",w.graphic.attrs.path)}X[0]=b+(ka.svg?this.canvasLeft:0);X[2]=Y;i.attr({"clip-rect":X,transform:A}).show();e.pintracker.__pindragdelta=0;e.pintracker.show().attr({transform:A,x:b,width:Y});b=this.getValuePixel(b);c=this.getValuePixel(c);t("pinned",{startIndex:b,endIndex:c,
startLabel:h[b],endLabel:h[c]},this.fusionCharts,[this.fusionCharts.id,b,c,h[b],h[c]]);return f.pinned=!0}},getValuePixel:function(b){var c=this._zoominfo;return c.ddsi+za(b/c.ppp)},getParsedLabel:function(b){var c=this.xlabels;return c.parsed[b]||(c.parsed[b]=U(c.data[b]||""))},drawGraph:function(){var b=this,c=b.paper,k=b.canvasLeft,e=b.canvasTop,h=b.canvasWidth,f=b.canvasHeight,i=b.options,w=i.chart,t=w.plotBorderWidth,A=w.useRoundEdges,E=w.showToolBarButtonTooltext,Y=b.layers,M=b.toolbar,u=b.elements,
B=w.allowPinMode,O,R=i.categories,T=!1,W,S,U,Z,ba,V;V=b._zoominfo=ma({},i.stepZoom);b._zoomhistory=[];if(V.clen){T=b._prezoomed=V.dei-V.dsi<V.clen-1;ba=b._visw=b.canvasWidth-w.canvasPadding*2;Z=b._visx=b.canvasLeft+w.canvasPadding;b._visout=-(b.chartHeight+b.canvasHeight+1E3);b.base.drawGraph.apply(b,arguments);b._ypvr=b.yAxis[0]&&b.yAxis[0].pixelValueRatio||0;O=b._yzero||0;i=Y.dataset.attr("clip-rect",[b._visx,b.canvasTop,b._visw,b.canvasHeight]);U=Y.scroll||(Y.scroll=c.group("scroll").insertAfter(Y.layerAboveDataset));
b.xlabels=[];b.xlabels.show=R.show;b.xlabels.height=R.labelHeight;b.xlabels.wrap=R.wrap;b.xlabels.rotate=R.rotate;b.xlabels.data=R.data||[];b.xlabels.parsed=[];b.xlabels.css=R.css;b.xlabels.group=c.group("zoomline-plot-xlabels",Y.datalabels);Y.datalabels.transform(["T",Z,e+f+w.scrollHeight+w.labelPadding]);b._lcmd=R.rotate?"y":"x";if(B)B=ka.crispBound(0,e-O,0,f,t),W=u["clip-pinrect"]=[B.x,ka.svg?e:B.y,B.width,B.height],S=Y.zoompin=c.group("zoompin").insertBefore(i).transform(b._pingrouptransform=
["T",Z,O]).hide(),u.pinrect=c.rect(0,e-O,b._visw,f,Y.zoompin).attr({"stroke-width":0,stroke:"none",fill:w.pinPaneFill,"shape-rendering":"crisp",ishot:!0}),u.pintracker=c.rect(Y.tracker).attr({transform:S.transform(),x:0,y:e-O,width:0,height:f,stroke:"none",fill:wa,ishot:!0,cursor:ka.svg&&"ew-resize"||"e-resize"}).drag(function(b){var c=Z+b+this.__pindragdelta,e=this.__pinboundleft,h=this.__pinboundright;c<e?c=e:c>h&&(c=h);S.transform(["T",c,O]);u.pintracker.transform(S.transform());this.__pindragoffset=
b},function(){this.__pinboundleft=0-W[0]+Z+(ka.svg&&k||0);this.__pinboundright=this.__pinboundleft+ba-W[2];S._.clipispath=!0},function(){S._.clipispath=!1;this.__pindragdelta=this.__pindragoffset;delete this.__pindragoffset;delete this.__pinboundleft;delete this.__pinboundright}),b.pinButton=M.add("pinModeIcon",function(){b.activatePin(!b._zoominfo.pinned)},{tooltip:E&&w.btnSwitchToPinModeTooltext||""});t++;B=ka.crispBound(k-t,e+f+t,h+t+t,w.scrollHeight,t);t--;u.zoomscroller=c.scroller(B.x+(A&&-1||
t%2),B.y-(A&&4||2),B.width-(!A&&2||0),B.height,!0,{showButtons:!0,scrollRatio:V.vdl/(V.clen-!!V.clen),scrollPosition:[V.dsi/(V.clen-V.vdl-1),!1]},U).attr({fill:w.scrollColor,r:A&&2||0}).scroll(b.updatePlotZoomline,b);A&&u.zoomscroller.shadow(!0);va(b,function(c){var e=c.selectionLeft-k,c=e+c.selectionWidth;b.crossline&&b.crossline.hide();b[b._zoominfo.pinned?"pinRangePixels":"zoomRangePixels"](e,c)},{attr:{stroke:w.zoomPaneStroke,fill:w.zoomPaneFill,strokeWidth:0}});b.zoomOutButton=M.add("zoomOutIcon",
function(){b.zoomOut()},{tooltip:E&&w.btnZoomOutTooltext||""})[T&&"show"||"hide"]();b.resetButton=M.add("resetIcon",function(){b.resetZoom()},{tooltip:E&&w.btnResetChartTooltext||""}).hide();B=b.resetButton.attr("fill");B[2]="rgba(255,255,255,0)";b.resetButton.attr("fill",[B[0],B[1],B[2],B[3]]);b.crossline=new la(b);b.updatePlotZoomline()}},drawPlotZoomline:function(b,c){var k=this.paper,e=this._yzero||(this._yzero=this.yAxis[0].getAxisPosition(0)),h=c.attrs,f=c.visible,i=f?"show":"hide",w=this.layers.dataset,
t=b.group||(b.group=k.group("plot-zoomline-dataset",w)),w=b.anchorGroup||(b.anchorGroup=k.group("plot-zoomline-anchors",w)),k=b.graphic||(b.graphic=k.path(void 0,t)),e=["T",this._visx,e];t.transform(e)[i]();w.transform(e)[i]();b.graphic=k.attr(h.graphics).shadow(h.shadow);b.attrPin=h.pin;b.visible=f;b.anchors=[];b.anchors.show=c.showAnchors;b.anchors.attrs=h.anchors;b.anchors.attrsShadow=h.anchorShadow;b.anchors.left=-(h.anchors.r+h.anchors["stroke-width"]*0.5);b.anchors.right=this._visw-b.anchors.right},
updatePlotZoomline:function(b,c){var k=this.paper,e=this._ypvr,h=this._visw,f=this.xlabels,i=f.css,w=f.group,t=this.plots,A,E,B,M,u,O,U;!c&&(c=this._zoominfo);B=c.oppp;M=c.vdl=c.dei-c.dsi;u=c.ppl=c.nvl?h/c.nvl:c.oppl;h=c.step=(E=c.ppp=h/M)<B?xa(B/E):1;u=c.lskip=xa(u/E/h);b!==void 0?(B=(c.clen-M-1)*b,c.offset=(B-(B=qa(B)))*E,O=B+M):(B=c.dsi,O=c.dei,c.offset=0);M=c.norm=B%h;c.ddsi=B-=M;c.ddei=O=O+2*h-M;c.pvr=e;e=f.show?xa((O-B)/h/u):0;M=c.llen-1;c.llen=e;U=c.ppc=E*u*h;if(e>M){u=M;for(M=e;u<M;u++)(A=
f[u])&&A.show()||(f[u]=k.text(0,0,"",w).css(i))}else{u=e;for(M+=1;u<M;u++)f[u].hide()}e=E*h<c.amrd?0:xa((O-B)/h);i=e-c.alen;c.alen=e;if(f.wrap)f.rotate?(f._width=f.height,f._height=U):(f._width=U,f._height=f.height);for(h=t.length;h--;){w=t[h];A=w.anchors;if(A.show&&i){E=A.attrs;u=0;for(M=e;u<M;u++)A[u]=A[u]&&A[u].show()||k.circle(0,0,0,w.anchorGroup).attr(E);u=e;for(M=A.length;u<M;u++)A[u]&&A[u].hide()}this.drawPlotZoomlineGraphics(c,w.data,w.graphic,A,!h&&f)}if(window.FC_DEV_ENVIRONMENT)FusionCharts.debugMode.enabled()?
(this.debug=this.debug||($("#fc-zoominfo").length||$("body").append('<pre id="fc-zoominfo">'),$("#fc-zoominfo").css({position:"absolute",left:"10px",top:"0","pointer-events":"none",opacity:0.7,width:"250px",zIndex:"999",border:"1px solid #cccccc","box-shadow":"1px 1px 3px #cccccc",background:"#ffffff"})),this.debug.text(JSON.stringify(c,0,2))):($("#fc-zoominfo").remove(),delete this.debug)},drawPlotZoomlineGraphics:function(b,c,k,e,h){var f=this.smartLabel,i=[],w=!b.cnd,t=b.ddei,A=b.clen,B=b.step,
E=b.lskip,M=b.ppp,u=b.offset,O=b.pvr,U=this._visw,R=this._visout,T=this._lcmd,W="M",S,Z,ba=h&&h[0],ja,V,e=e[0],ga={},ka={},la,ca=0,ea,na,ma=-b.norm,b=b.ddsi,qa=0;if(ba)h.group.transform(["T",-u,0]),na=h.wrap,ja=h._height,V=h._width;for(;b<=t;b+=B,ma+=B)if(ea=ca/3+qa,la=ma*M,(S=c[b])===void 0?(w&&(W="M"),Z=R,h=la-u,S=R,qa++):(i[ca++]=W,i[ca++]=Z=h=la-u,i[ca++]=S*=O,W="L"),e&&(e=e.attr((ga.cx=Z,ga.cy=S,ga)).next),ba&&!(ea%E))ea=ba.attrs,Z=this.getParsedLabel(b),h=h<0||h>U?R:la,ba._prevtext===Z?delete ka.text:
ka.text=ba._prevtext=Z,ea[T]===h?delete ka[T]:ka[T]=h,na&&Z&&(ka.text=f.getSmartText(Z,V,ja).text),ba=ba.attr(ka).next;if(t>=A){if((S=c[A-1])!==void 0)ma-=t-A,i[ca++]="L",i[ca++]=ma*M-u,i[ca++]=S*O;e&&e.attr((ga.cx=R,ga.cy=R,ga))}k.attr("path",i)},legendClick:function(b){var c=!b.visible,k=c?"show":"hide";b.group[k]();b.anchorGroup[k]();this.base.legendClick.apply(this,arguments);return b.visible=c}},Fa["renderer.cartesian"]);la=function(b){var c=b.paper,k=this.left=b._visx,e=this.width=b._visw,h=
b.canvasTop,f=b.canvasHeight,i=this._visout=b._visout,w=this.plots=b.plots,t=b.layers.dataset,A=this.group=c.group("crossline-labels",t).attr({transform:["T",k,b._yzero]});this.tracker=c.rect(k,h,e,f,t).attr({stroke:"none","stroke-width":0,fill:wa}).toFront().mousedown(this.onMouseDown,this).mouseup(this.onMouseUp,this,!0).mouseout(this.onMouseOut,this).mousemove(this.onMouseMove,this);this.line=c.path(void 0,t).attr({path:["M",k,h,"l",0,f],"stroke-opacity":0.2}).toBack();k=this.labels=c.set();e=
b.options.crossline.style;this.hide();this.pixelRatio=b._ypvr;this.positionLabels=b.xlabels||{data:[],parsed:[]};this.getZoomInfo=function(){return b._zoominfo};this.getDataIndexFromPixel=function(c){return b.getValuePixel(c)};this.getPositionLabel=function(c){return b.getParsedLabel(c)};h=0;for(f=w.length;h<f;h++)t=w[h],t=t.graphic.attrs.stroke,k.push(c.text(0,i,"",A).css(e).attr({fill:t,"text-bound":["rgba(255,255,255,0.8)","rgba(0,0,0,0.2)",1,2]}))};la.prototype.onMouseOut=function(){this.hide()};
la.prototype.onMouseDown=function(){this.hide();this._mouseIsDown=!0};la.prototype.onMouseUp=function(){this.hide();delete this._mouseIsDown};la.prototype.onMouseMove=function(b){if(!this._mouseIsDown){var c=this.getZoomInfo(),k=this.line,e=c.step,h=c.ppp*e,b=(b.layerX||b.x)-this.left,f,b=(b+=h/2+c.offset)-b%h;f=(f=this.getDataIndexFromPixel(b))+f%e;b-=c.offset;k.transform(["T",za(b),0]);if(f!==this.position||this.hidden)this.position=f,this.lineX=b,this.updateLabels();this.hidden&&this.show()}};
la.prototype.updateLabels=function(){var b=this.labels,c=this.plots,f=this.width,e=this.position,h=this.lineX,i=za(h),t=this.pixelRatio,w=this._visout,B,A;b.forEach(function(b,E){B=c[E];A=B.data[e];b.attr({text:A+"",x:i,y:A===void 0||!B.visible?w:A*t,"text-anchor":h<=0&&"start"||h>=f&&"end"||"middle"})});this.positionLabel&&this.positionLabel.attr({x:h+this.left,text:this.getPositionLabel(e)})};la.prototype.show=function(){this.hidden=!1;this.group.attr("visibility","visible");this.line.attr("visibility",
"visible");this.positionLabel&&this.positionLabel.attr("visibility","visible")};la.prototype.hide=function(){this.hidden=!0;this.group.hide();this.line.hide()};ka.addSymbol({pinModeIcon:function(b,c,f){var e=f*0.5,h=b-f,i=b+f,t=b-e,w=b+e,B=b+0.5,A=B+1,E=B+1.5,O=c-f,M=c+e,u=c-e,e=c+(f-e);return["M",h,O,"L",t,u,t,e,h,M,b-0.5,M,b,c+f+0.5,B,M,i,M,w,e,w,u,i,O,E,O,E,u,E,e,A,e,A,u,E,u,E,O,"Z"]},zoomOutIcon:function(b,c,f){b-=f*0.2;c-=f*0.2;var e=f*0.8,h=ka.rad(43),i=ka.rad(48),t=b+e*Ga(h),h=c+e*Z(h),w=b+
e*Ga(i),i=c+e*Z(i),B=ka.rad(45),A=t+f*Ga(B),E=h+f*Z(B),O=w+f*Ga(B),f=i+f*Z(B);return["M",t,h,"A",e,e,0,1,0,w,i,"Z","M",t+1,h+1,"L",A,E,O,f,w+1,i+1,"Z","M",b-2,c,"L",b+2,c,"Z"]},resetIcon:function(b,c,f){var e=b-f,h=(O.PI/2+O.PI)/2;b+=f*Ga(h);var h=c+f*Z(h),i=f*2/3;return["M",e,c,"A",f,f,0,1,1,b,h,"L",b+i,h-1,b+2,h+i-0.5,b,h]}})}]);Class("xui.UI.FusionChartsXT","xui.UI",{
    Initialize:function(){
        var ns=this;
        FusionCharts.addEventListener(["PrintReadyStateChange","Initialized","Disposed","Error","Warning","DataLoadRequested","DataLoadRequestCancelled","DataLoadRequestCompleted","DataLoadCancelled","BeforeDataUpdate","DataUpdated","Loaded","DataLoaded","Rendered","DrawComplete","Resized","Exported","BatchExported","BeforeDispose","BeforeLinkedItemOpen","LinkedItemOpened","BeforeLinkedItemClose","LinkedItemClosed","DataLoadError","NoDataToDisplay","DataXMLInvalid","LegendItemClicked",
                      "Zoomed","Pinned","ZoomedOut","ResetZoomChart"], 
            function(eventObject, argumentsObject){
                ns.getAll().each(function(prf){
                    if(prf.onFusionChartsEvent)
                        prf.boxing().onFusionChartsEvent(prf,eventObject,argumentsObject);
                });
            }
        );
    },
    Instance:{
        refreshChart:function(dataFormat){
            return this.each(function(prf){
                if(prf.renderId){
                    var prop=prf.properties,t;
                    if(prf._chartId && (t=FusionCharts(prf._chartId))){
                        // dispose
                        t.dispose();
                        // clear node
                        prf.getSubNode('BOX').html("",false);
                    }

                    // new one
                    var fc=new FusionCharts(prop.chartType, prf._chartId, prop.width, prop.height),
                        flag;
                    
                    switch(dataFormat){
                        case 'XMLUrl':
                            var xml=linb.getFileSync(prop.XMLUrl);
                            if(xml)fc.setXMLData(xml);
                        break;
                        case 'JSONUrl':
                            var json=linb.getFileSync(prop.JSONUrl);
                            if(json)fc.setJSONData(json);
                        break;
                        case 'XMLData':
                            fc.setXMLData(prop.XMLData);
                        break;
                        default:
                            if(prop.XMLUrl){
                                var xml=linb.getFileSync(prop.XMLUrl);
                                if(xml)fc.setXMLData(xml);
                            }else if(prop.JSONUrl){
                                var json=linb.getFileSync(prop.JSONUrl);
                                if(json)fc.setJSONData(json);
                            }else if(prop.XMLData){
                                fc.setXMLData(prop.XMLData);
                            }else if(!_.isEmpty(prop.JSONData)){
                                flag=1;
                                fc.setJSONData(prf.box._prepareFCData(prf,prop.JSONData));
                            }
                    }
                    // ensure [link]
                    if(!flag){
                        fc.setJSONData(prf.box._prepareFCData(prf,fc.getJSONData()));
                    }

                    fc.render(prf.getSubNode('BOX').id());
                }
            });
        },
        setTransparent:function(isTransparent){
           return this.each(function(prf){
               var t;
               _.set(prf.properties,["JSONData","chart","bgalpha"], isTransparent?"0,0":"");
               if(prf.renderId && prf._chartId && (t=FusionCharts(prf._chartId))){
                   t.setTransparent(isTransparent);
               }
           });
        },
        getChartAttribute:function(key){
            var prf=this.get(0);
            return _.isStr(key)?_.get(prf.properties,["JSONData","chart",key]):_.get(prf.properties,["JSONData","chart"]);
        },
        setChartAttribute:function(key,value){
            var h={};
            if(_.isStr(key)){
                h[key]=value;
            }else h=key;
                
            return this.each(function(prf){
                var t;
                if(prf.renderId && prf._chartId && (t=FusionCharts(prf._chartId))){
                    t.setChartAttribute(h);
                    // refresh memory in xui from real
                    _.set(prf.properties,["JSONData","chart"], t.getChartAttribute());
                }else{
                    // reset memory in xui only 
                    var opt=_.get(prf.properties,["JSONData","chart"]);
                    if(opt)_.merge(opt, h, 'all');
                }
            });
        },
        getFCObject:function(){
            var prf=this.get(0);
            return prf.renderId && prf._chartId && FusionCharts(prf._chartId);
        },
        getSVGString:function(){
            var prf=this.get(0), o=prf.renderId && prf._chartId && FusionCharts(prf._chartId);
            return o?o.getSVGString():null;
        },
        fillData:function(data,index,isLineset){
            this.each(function(prf){
                var JSONData=prf.properties.JSONData;
                data=_.clone(data);
                if(_.isArr(data) && _.isArr(data[0])){
                    if(isLineset){
                        JSONData.lineset=data;
                    }else{
                        if('dataset' in JSONData){
                            JSONData.dataset=data;
                        }else{
                            JSONData.data=data[0];
                        }
                    }
                }else{
                    if(isLineset){
                        if('lineset' in JSONData){
                            _.set(JSONData,["lineset",index||0,"data"],data);
                        }
                    }else{
                        if('dataset' in JSONData){
                            _.set(JSONData,["dataset",index||0,"data"],data);
                        }else{
                            JSONData.data=data;
                        }
                    }
                }
            });
            return this.refreshChart();
        },
        callFC:function(funName, params){
            var fc;
            if((fc=this.getFCObject())&&_.isFun(fc[funName]))
                return fc[funName].apply(fc, params||[]);
        },
        configure:function(options){
            var prf=this.get(0),t;
            if(prf.renderId && prf._chartId && (t=FusionCharts(prf._chartId))){
                t.configure(options);
            }
        }
    },
    Static:{
        _objectProp:{tagVar:1,dockMargin:1,JSONData:1,configure:1},
        Appearances:{
            KEY:{
                'font-size':xui.browser.ie?0:null,
                'line-height':xui.browser.ie?0:null,
                overflow:'hidden'
            },
            BOX:{
                position:'absolute',
                left:0,
                top:0,
                'z-index':1
            },
            COVER:{
                position:'absolute',
                left:'-1px',
                top:'-1px',
                width:0,
                height:0,
                'z-index':4
            }
        },
        Templates:{
            tagName:'div',
            className:'{_className}',
            style:'{_style}',
            BOX:{
                tagName:'div'
            },
            COVER:{
                tagName:'div',
                style:"background-image:url("+xui.ini.img_bg+");"
            }
        },
        Behaviors:{
            HotKeyAllowed:false,
            onSize:xui.UI.$onSize
        },
        DataModel:{
            defaultFocus:null,
            disableClickEffect:null,
            disableHoverEffect:null,
            disableTips:null,
            disabled:null,
            renderer:null,
            selectable:null,
            tips:null,
            width:400,
            height:300,
            chartType:{
                ini:"Column2D",
                //Single Series Charts
                listbox:["Column2D","Column3D","Line","Area2D","Bar2D","Pie2D","Pie3D","Doughnut2D","Doughnut3D","Pareto2D","Pareto3D",
                //Multi-series
                         "MSColumn2D","MSColumn3D","MSLine","MSBar2D","MSBar3D","MSArea","Marimekko","ZoomLine",
                //Stacked 
                         "StackedColumn3D","StackedColumn2D","StackedBar2D","StackedBar3D","StackedArea2D","MSStackedColumn2D",
                //Combination 
                         "MSCombi3D","MSCombi2D","MSColumnLine3D","StackedColumn2DLine","StackedColumn3DLine","MSCombiDY2D","MSColumn3DLineDY","StackedColumn3DLineDY","MSStackedColumn2DLineDY",
                //XYPlot
                         "Scatter","Bubble",
                //Scroll
                         "ScrollColumn2D","ScrollLine2D","ScrollArea2D","ScrollStackedColumn2D","ScrollCombi2D","ScrollCombiDY2D"],
                action:function(){
                    if(this.renderId){
                        this.boxing().refreshChart();
                    }
                }
            },
            JSONData:{
                ini:{},
                get:function(){
                    var prf=this,prop=prf.properties,fc;
                    if(!_.isEmpty(prop.JSONData))
                        return prop.JSONData;
                    else if(fc=prf.boxing().getFCObject())
                        return prf.box._cleanData(prf,fc.getJSONData());
                },
                set:function(data){
                    var prf=this,prop=prf.properties;
                    if(_.isStr(data))data=_.unserialize(data);
                    if(data){
                        prop.XMLData=prop.XMLUrl=prop.JSONUrl="";
                        prop.JSONData=_.clone(data);

                        if(prf.renderId){
                            prf.boxing().refreshChart('JSONData');
                        }
                    }
                }
            },
            XMLUrl:{
                ini:"",
                set:function(url){
                    var prf=this,prop=prf.properties;

                    prop.XMLUrl=url;
                    prop.JSONUrl=prop.XMLData="";
                    prop.JSONData={};

                    if(prf.renderId){
                        prf.boxing().refreshChart('XMLUrl');
                    }
                }
            },
            XMLData:{
                ini:"",
                get:function(force){
                    var prf=this,prop=prf.properties,fc;
                    if(prop.XMLData)
                        return prop.XMLData;
                    else if(fc=prf.boxing().getFCObject())
                        return fc.getXMLData();
                },
                set:function(url){
                    var prf=this,prop=prf.properties;

                    prop.XMLData=url;
                    prop.XMLUrl=prop.JSONUrl="";
                    prop.JSONData={};

                    if(prf.renderId){
                        prf.boxing().refreshChart('XMLData');
                    }
                }
            },
            JSONUrl :{
                ini:"",
                set:function(url){
                    var prf=this,prop=prf.properties;

                    prop.JSONUrl=url;
                    prop.XMLUrl=prop.XMLData="";
                    prop.JSONData={};

                    if(prf.renderId){
                        prf.boxing().refreshChart('JSONUrl');
                    }
                }
            }
        },
        _cleanData:function(prf,data){
            if(prf.properties.tagVar=="withLink")return data;
            if(data.dataset){
                _.arr.each(data.dataset,function(o,i){
                    _.arr.each(o.dataset,function(v,j){
                        _.arr.each(v.data,function(w,k){
                            delete w.link;
                        });
                    });
                    _.arr.each(o.data,function(v,j){
                        delete v.link;
                    });
                });
            }else if(data.data){
                _.arr.each(data.data,function(o,i){
                    delete o.link;
                });                
            }
            return data;
        },
        _prepareFCData:function(prf, data){
            var id=prf.$xid;
            data=_.clone(data);
            if(prf.properties.tagVar=="withLink")return data;

            if(data.dataset){
                _.arr.each(data.dataset,function(o,i){
                    _.arr.each(o.dataset,function(v,j){
                        _.arr.each(v.data,function(w,k){
                            w.link="Javascript:xui.publish('xuiFC',["+(i||0)+","+(j||0)+","+(k||0)+"],'"+id+"')";
                        });
                    });
                    _.arr.each(o.data,function(v,j){
                        v.link="Javascript:xui.publish('xuiFC',["+(i||0)+","+(j||0)+"],'"+id+"')";
                    });
                });
            }else if(data.data){
                _.arr.each(data.data,function(o,i){
                    o.link="Javascript:xui.publish('xuiFC',["+(i||0)+"],'"+id+"')";
                });                
            }

            return data;
        },
        RenderTrigger:function(){
            var prf=this;
            // give chart dom id
            prf._chartId="FC_"+prf.properties.chartType+"_"+prf.$xid;
            // click event handler
            xui.subscribe("xuiFC",prf.$xid,function(cat,ser,ser2){
                if(prf.onDataClick){
                    var data=prf.boxing().getJSONData();
                    if(_.isSet(ser2))
                        prf.boxing().onDataClick(prf, _.get(data,["dataset",cat,'dataset',ser,'data',ser2]), _.get(data,["categories",0,'category',ser2]), _.get(data,["dataset",cat,'dataset',ser]), ser2, ser);
                    else if(_.isSet(ser))
                        prf.boxing().onDataClick(prf, _.get(data,["dataset",cat,'data',ser]), _.get(data,["categories",0,'category',ser]), _.get(data,["dataset",cat]), ser, cat);
                    else
                        prf.boxing().onDataClick(prf, _.get(data,["data",cat]), cat);
                }
            });
            if(!_.isEmpty(prf.properties.configure)){
                prf.boxing().setConfigure(prf.properties.configure, true);
            }
            // render it
            prf.boxing().refreshChart();
            // set before destroy function
            (prf.$beforeDestroy=(prf.$beforeDestroy||{}))["unsubscribe"]=function(){
                if(this._chartId && FusionCharts(this._chartId)){
                    FusionCharts(this._chartId).dispose();
                }
                xui.unsubscribe("xuiFC",this.$xid);
            }
        },
        EventHandlers:{
            onFusionChartsEvent:function(prf, eventObject, argumentsObject){},
            onDataClick:function(prf, value, category, series, catIndex, serIndex){},
            onShowTips:null
        },
        _onresize:function(prf,width,height){
            var size = prf.getSubNode('BOX').cssSize(),prop=prf.properties,t;
            if( (width && size.width!=width) || (height && size.height!=height) ){
                // reset here
                if(width)prop.width=width;
                if(height)prop.height=height;

                size={width:width,height:height};
                prf.getSubNode('BOX').cssSize(size,true);
                if(prf.$inDesign || prop.cover){
                    prf.getSubNode('COVER').cssSize(size,true);
                }
                if(prf.renderId && prf._chartId && (t=FusionCharts(prf._chartId))){
                    t.resizeTo(prop.width, prop.height);
                }
            }
        }
    }
});
