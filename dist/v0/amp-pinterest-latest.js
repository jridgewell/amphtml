(window.AMP = window.AMP || []).push(function(AMP) {var process={env:{NODE_ENV:"production"}};var g="undefined"!=typeof window&&window===this?this:"undefined"!=typeof global?global:this;function h(a,b){function c(){}c.prototype=b.prototype;a.prototype=new c;a.prototype.constructor=a;for(var e in b)if(g.Object.defineProperties){var d=g.Object.getOwnPropertyDescriptor(b,e);void 0!==d&&g.Object.defineProperty(a,e,d)}else a[e]=b[e]};var k=null,p="";var q=(new Date).getTime();function r(a,b,c){this.win=a.AMP_TEST?a.parent:a;this.levelFunc_=b;this.level_=this.calcLevel_();this.suffix_=c||""}
r.prototype.calcLevel_=function(){var a;if(k)a=k;else{if(window.context&&window.context.mode)a=window.context.mode;else{a=("localhost"==location.hostname||location.ancestorOrigins&&location.ancestorOrigins[0]&&0==location.ancestorOrigins[0].indexOf("http://localhost:"))&&!!document.querySelector('script[src*="/dist/"],script[src*="/base/"]');var b=location.originalHash||location.hash,c=Object.create(null);if(b){if(0==b.indexOf("?")||0==b.indexOf("#"))b=b.substr(1);for(var b=b.split("&"),e=0;e<b.length;e++){var d=
b[e],f=d.indexOf("="),l=void 0,m=void 0;-1!=f?(l=decodeURIComponent(d.substring(0,f)).trim(),m=decodeURIComponent(d.substring(f+1)).trim()):(l=decodeURIComponent(d).trim(),m="");l&&(c[l]=m)}}p||(p=a?"1463506055389":window.AMP_CONFIG&&window.AMP_CONFIG.v?window.AMP_CONFIG.v:"1463506055389");a={localDev:a,development:"1"==c.development||window.AMP_DEV_MODE,filter:c.filter,minified:"production"==process.env.NODE_ENV,test:window.AMP_TEST,log:c.log,version:p}}a=k=a}return this.win.console&&
this.win.console.log&&"0"!=a.log?this.win.ENABLE_LOG?4:a.localDev&&!a.log?3:this.levelFunc_(a):0};r.prototype.msg_=function(a,b,c){if(0!=this.level_){var e=this.win.console.log;"ERROR"==b?e=this.win.console.error||e:"INFO"==b?e=this.win.console.info||e:"WARN"==b&&(e=this.win.console.warn||e);c.unshift((new Date).getTime()-q,"["+a+"]");e.apply(this.win.console,c)}};r.prototype.isEnabled=function(){return 0!=this.level_};
r.prototype.fine=function(a,b){4<=this.level_&&this.msg_(a,"FINE",Array.prototype.slice.call(arguments,1))};r.prototype.info=function(a,b){3<=this.level_&&this.msg_(a,"INFO",Array.prototype.slice.call(arguments,1))};r.prototype.warn=function(a,b){2<=this.level_&&this.msg_(a,"WARN",Array.prototype.slice.call(arguments,1))};
r.prototype.error=function(a,b){if(1<=this.level_)this.msg_(a,"ERROR",Array.prototype.slice.call(arguments,1));else{var c=t.apply(null,Array.prototype.slice.call(arguments,1));this.prepareError_(c);this.win.setTimeout(function(){throw c;})}};r.prototype.createError=function(a){var b=t.apply(null,arguments);this.prepareError_(b);return b};
r.prototype.assert=function(a,b,c){var e=void 0;if(!a){var d=(b||"Assertion failed").split("%s"),f=d.shift(),l=f,m=[];""!=f&&m.push(f);for(f=2;f<arguments.length;f++){var n=arguments[f];n&&n.tagName&&(e=n);var E=d.shift();m.push(n);var F=E.trim();""!=F&&m.push(F);n=n instanceof Element?n.tagName.toLowerCase()+(n.id?"#"+n.id:""):n;l+=n+E}d=Error(l);d.fromAssert=!0;d.associatedElement=e;d.messageArray=m;this.prepareError_(d);throw d;}return a};
r.prototype.assertEnumValue=function(a,b,c){for(var e in a)if(a[e]==b)return a[e];this.assert(!1,'Unknown %s value: "%s"',c||"enum",b)};r.prototype.prepareError_=function(a){this.suffix_&&(a.message?-1==a.message.indexOf(this.suffix_)&&(a.message+=this.suffix_):a.message=this.suffix_)};function t(a){for(var b=null,c="",e=0;e<arguments.length;e++){var d=arguments[e];d instanceof Error&&!b?b=d:(c&&(c+=" "),c+=d)}b?c&&(b.message=c+": "+b.message):b=Error(c);return b}
var u=new r(window,function(a){var b=parseInt(a.log,10);return a.development||1<=b?4:0},"\u200b\u200b\u200b");new r(window,function(a){a=parseInt(a.log,10);return 3<=a?4:2<=a?3:0});function v(a,b){if(b.length>a.length)return!1;var c=a.length-b.length;return a.indexOf(b,c)==c};var w=window.document.createElement("a"),x=Object.create(null);
function y(a){var b=x[a];if(b)return b;w.href=a;var b={href:w.href,protocol:w.protocol,host:w.host,hostname:w.hostname,port:"0"==w.port?"":w.port,pathname:w.pathname,search:w.search,hash:w.hash},c;w.origin&&"null"!=w.origin?c=w.origin:(c=b,"string"==typeof c&&(c=y(c)),c="data:"!=c.protocol&&c.host?c.protocol+"//"+c.host:c.href);b.origin=c;u.assert(b.origin,"Origin must exist");x[a]=window.AMP_TEST&&Object.freeze?Object.freeze(b):b;return b}
function z(a,b){u.assert(null!=a,"%s source must be available",b);var c=y(a);u.assert("https:"==c.protocol||/^(\/\/)/.test(a)||"localhost"==c.hostname||v(c.hostname,".localhost"),'%s source must start with "https://" or "//" or be relative and served from either https or from localhost. Invalid value: %s',b,a);return a};function A(a,b,c){var e=a.services;e||(e=a.services={});var d=e[b];d||(d=e[b]={obj:null,promise:null,resolve:null});d.obj||(d.obj=c(a),d.promise||(d.promise=Promise.resolve(d.obj)),d.resolve&&d.resolve(d.obj));return d.obj};for(var B="",C=0;12>C;C+=1)B+="0123456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghijkmnopqrstuvwxyz".substr(Math.floor(60*Math.random()),1);function D(a){var b=void 0,b="";try{b=decodeURIComponent(a)}catch(c){}a=b.replace(/</g,"&lt;");return a=a.replace(/>/g,"&gt;")}var G=B;function H(a){var b=new Image,c="https://log.pinterest.com/?guid="+B,c=c+"&amp=1";a&&(c+=a);c=c+"&via="+encodeURIComponent(window.location.href);b.src=c}
function I(a,b){var c=!1,e,d;for(e in b){c=a.createElement(e);for(d in b[e])if("string"===typeof b[e][d]){var f=c,l=d,m=b[e][d];"string"===typeof f[l]?f[l]=m:f.setAttribute(l,m)}break}return c};function J(a){u.assert(a.getAttribute("data-url"),"The data-url attribute is required for Pin widgets");this.element=a;this.xhr=A(a.ownerDocument.defaultView,"xhr")}
J.prototype.handleClick=function(a){a.preventDefault();var b=a.target;a=b.getAttribute("data-pin-pop")||!1;var c=b.getAttribute("data-pin-href"),b=b.getAttribute("data-pin-log");c&&(a?window.open(c,"_pinit","status=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,width=900,height=500,left=0,top=0"):window.open(c+"?amp=1&guid="+G,"_blank"));b&&H("&type="+b)};
J.prototype.fetchPin=function(){return this.xhr.fetchJson("https://widgets.pinterest.com/v3/pidgets/pins/info/?"+("pin_ids="+this.pinId+"&sub=www&base_scheme=https")).then(function(a){try{return a.data[0]}catch(b){return null}})};
J.prototype.renderPin=function(a){var b="-amp-pinterest-embed-pin",c=z(a.images["237x"].url);"medium"===this.width||"large"===this.width?(b+="-medium",c=c.replace(/237/,"345"),H("&type=pidget&pin_count_medium=1")):H("&type=pidget&pin_count=1");var e=I(this.element.ownerDocument,{span:{}});e.className=b+" -amp-fill-content";b=I(this.element.ownerDocument,{span:{className:"-amp-pinterest-embed-pin-inner","data-pin-log":"embed_pin"}});c=I(this.element.ownerDocument,{img:{src:c,className:"-amp-pinterest-embed-pin-image",
"data-pin-no-hover":!0,"data-pin-href":"https://www.pinterest.com/pin/"+a.id+"/","data-pin-log":"embed_pin_img"}});b.appendChild(c);c=I(this.element.ownerDocument,{span:{className:"-amp-pinterest-rect -amp-pinterest-en-red -amp-pinterest-embed-pin-repin","data-pin-log":"embed_pin_repin","data-pin-pop":"1","data-pin-href":"https://www.pinterest.com/pin/"+a.id+"/repin/x/?amp=1&guid="+G}});b.appendChild(c);c=I(this.element.ownerDocument,{span:{className:"-amp-pinterest-embed-pin-text"}});if(a.description){var d=
I(this.element.ownerDocument,{span:{className:"-amp-pinterest-embed-pin-text-block -amp-pinterest-embed-pin-description",textContent:D(a.description)}});c.appendChild(d)}a.attribution&&(d=I(this.element.ownerDocument,{span:{className:"-amp-pinterest-embed-pin-text-block -amp-pinterest-embed-pin-attribution"}}),d.appendChild(I(this.element.ownerDocument,{img:{className:"-amp-pinterest-embed-pin-text-icon-attrib",src:a.attribution.provider_icon_url}})),d.appendChild(I(this.element.ownerDocument,{span:{textContent:" by "}})),
d.appendChild(I(this.element.ownerDocument,{span:{"data-pin-href":a.attribution.url,textContent:D(a.attribution.author_name)}})),c.appendChild(d));if(a.repin_count||a.like_count){d=I(this.element.ownerDocument,{span:{className:"-amp-pinterest-embed-pin-text-block -amp-pinterest-embed-pin-stats"}});if(a.repin_count){var f=I(this.element.ownerDocument,{span:{className:"-amp-pinterest-embed-pin-stats-repins",textContent:String(a.repin_count)}});d.appendChild(f)}a.like_count&&(f=I(this.element.ownerDocument,
{span:{className:"-amp-pinterest-embed-pin-stats-likes",textContent:String(a.like_count)}}),d.appendChild(f));c.appendChild(d)}a.pinner&&(d=I(this.element.ownerDocument,{span:{className:"-amp-pinterest-embed-pin-text-block -amp-pinterest-embed-pin-pinner"}}),d.appendChild(I(this.element.ownerDocument,{img:{className:"-amp-pinterest-embed-pin-pinner-avatar",alt:D(a.pinner.full_name),title:D(a.pinner.full_name),src:a.pinner.image_small_url,"data-pin-href":a.pinner.profile_url}})),d.appendChild(I(this.element.ownerDocument,
{span:{className:"-amp-pinterest-embed-pin-pinner-name",textContent:D(a.pinner.full_name),"data-pin-href":a.pinner.profile_url}})),d.appendChild(I(this.element.ownerDocument,{span:{className:"-amp-pinterest-embed-pin-board-name",textContent:D(a.board.name),"data-pin-href":"https://www.pinterest.com/"+a.board.url}})),c.appendChild(d));b.appendChild(c);e.appendChild(b);e.addEventListener("click",this.handleClick.bind(this));return e};
J.prototype.render=function(){this.pinUrl=this.element.getAttribute("data-url");this.width=this.element.getAttribute("data-width");this.pinId="";try{this.pinId=this.pinUrl.split("/pin/")[1].split("/")[0]}catch(a){return}return this.fetchPin().then(this.renderPin.bind(this))};function K(a){u.assert(a.getAttribute("data-href"),"The data-href attribute is required for follow buttons");u.assert(a.getAttribute("data-label"),"The data-label attribute is required for follow buttons");this.element=a;this.label=a.getAttribute("data-label");this.href=z(a.getAttribute("data-href"))}
K.prototype.handleClick=function(a){a.preventDefault();window.open(this.href,"pin"+(new Date).getTime(),"status=no,resizable=yes,scrollbars=yes,\n  personalbar=no,directories=no,location=no,toolbar=no,\n  menubar=no,width=1040,height=640,left=0,top=0");H("&type=button_follow&href="+this.href)};
K.prototype.renderTemplate=function(){var a=I(this.element.ownerDocument,{a:{class:"-amp-pinterest-follow-button",href:this.href,textContent:this.label}});a.appendChild(I(this.element.ownerDocument,{i:{}}));a.onclick=this.handleClick.bind(this);return a};K.prototype.render=function(){"/"!==this.href.substr(-1)&&(this.href+="/");this.href+="pins/follow/?guid="+G;return Promise.resolve(this.renderTemplate())};function L(a){u.assert(a.getAttribute("data-url"),"The data-url attribute is required for Pin It buttons");u.assert(a.getAttribute("data-media"),"The data-media attribute is required for Pin It buttons");u.assert(a.getAttribute("data-description"),"The data-description attribute is required for Pin It buttons");this.element=a;this.xhr=A(a.ownerDocument.defaultView,"xhr");this.color=a.getAttribute("data-color");this.count=a.getAttribute("data-count");this.lang=a.getAttribute("data-lang");this.round=
a.getAttribute("data-round");this.tall=a.getAttribute("data-tall");this.description=a.getAttribute("data-description")}L.prototype.handleClick=function(a){a.preventDefault();window.open(this.href,"_pinit","status=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,width=900,height=500,left=0,top=0");H("&type=button_pinit")};
L.prototype.fetchCount=function(){return this.xhr.fetchJson("https://widgets.pinterest.com/v1/urls/count.json?return_jsonp=false&url="+this.url)};L.prototype.formatPinCount=function(a){999<a&&(a=1E6>a?parseInt(a/1E3,10)+"K+":1E9>a?parseInt(a/1E6,10)+"M+":"++");return a};L.prototype.renderCount=function(a,b){H("&type=pidget&button_count=1");return I(this.element.ownerDocument,{span:{class:"-amp-pinterest-bubble-"+this.count+b,textContent:this.formatPinCount(a)}})};
L.prototype.renderTemplate=function(a){var b=this.round?"-round":"-rect",c=this.tall?"-tall":"",e="ja"===this.lang?"-ja":"-en",d=-1!==["red","white"].indexOf(this.color)?this.color:"gray",f=["-amp-pinterest"+b+c,"-amp-fill-content"],b="";this.round||(f.push("-amp-pinterest"+e+"-"+d+c),a&&(f.push("-amp-pinterest-count-pad-"+this.count+c),b=this.renderCount(a.count,c)));a=I(this.element.ownerDocument,{a:{class:f.join(" "),href:this.href}});b&&a.appendChild(b);a.onclick=this.handleClick.bind(this);return a};
L.prototype.render=function(){this.description=encodeURIComponent(this.description);this.media=encodeURIComponent(this.element.getAttribute("data-media"));this.url=encodeURIComponent(this.element.getAttribute("data-url"));this.href="https://www.pinterest.com/pin/create/button/?"+["amp=1","guid="+G,"url="+this.url,"media="+this.media,"description="+this.description].join("&");var a=void 0,a="above"===this.count||"beside"===this.count?this.fetchCount():Promise.resolve();return a.then(this.renderTemplate.bind(this))};function M(a){AMP.BaseElement.apply(this,arguments)}h(M,AMP.BaseElement);M.prototype.preconnectCallback=function(a){this.preconnect.url("https://widgets.pinterest.com",a)};M.prototype.isLayoutSupported=function(a){return"fixed"==a||"fixed-height"==a||"responsive"==a||"fill"==a||"flex-item"==a};M.prototype.layoutCallback=function(){var a=this,b=u.assert(this.element.getAttribute("data-do"),"The data-do attribute is required for <amp-pinterest> %s",this.element);return this.render(b).then(function(b){return a.element.appendChild(b)})};
M.prototype.render=function(a){switch(a){case "embedPin":return(new J(this.element)).render();case "buttonPin":return(new L(this.element)).render();case "buttonFollow":return(new K(this.element)).render()}return Promise.resolve("Invalid selector: ",a)};AMP.registerElement("amp-pinterest",M,".-amp-pinterest-round{height:16px;width:16px;background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_en_round_red_16_2.png);background-size:16px 16px}.-amp-pinterest-round-tall{height:32px;width:32px;background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_en_round_red_32_2.png);background-size:32px 32px}.-amp-pinterest-rect{height:20px;width:40px;background:url() 0 -20px no-repeat;background-size:40px 60px}.-amp-pinterest-rect:hover{background-position:0 0}.-amp-pinterest-rect:active{background-position:0 -40px}.-amp-pinterest-en-gray{background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_en_rect_gray_20_2.png)}.-amp-pinterest-en-red{background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_en_rect_red_20_2.png)}.-amp-pinterest-en-white{background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_en_rect_white_20_2.png)}.-amp-pinterest-ja-gray{background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_ja_rect_gray_20_2.png)}.-amp-pinterest-ja-red{background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_ja_rect_red_20_2.png)}.-amp-pinterest-ja-white{background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_ja_rect_white_20_2.png)}.-amp-pinterest-rect-tall{height:28px;width:56px;background:url() 0 -28px no-repeat;background-size:56px 84px}.-amp-pinterest-rect-tall:hover{background-position:0 0}.-amp-pinterest-rect-tall:active{background-position:0 -56px}.-amp-pinterest-en-gray-tall{background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_en_rect_gray_28_2.png)}.-amp-pinterest-en-red-tall{background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_en_rect_red_28_2.png)}.-amp-pinterest-en-white-tall{background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_en_rect_white_28_2.png)}.-amp-pinterest-ja-gray-tall{background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_ja_rect_gray_28_2.png)}.-amp-pinterest-ja-red-tall{background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_ja_rect_red_28_2.png)}.-amp-pinterest-ja-white-tall{background-image:url(https://s-passets.pinimg.com/images/pidgets/pinit_bg_ja_rect_white_28_2.png)}.-amp-pinterest-count-pad-above{margin-top:30px}.-amp-pinterest-count-pad-above-tall{margin-top:38px}.-amp-pinterest-bubble-above{bottom:21px;height:29px;width:40px;background:transparent url(https://s-passets.pinimg.com/images/pidgets/count_north_white_rect_20_2.png) 0 0 no-repeat;background-size:40px 29px;font:12px Arial,Helvetica,sans-serif;line-height:24px}.-amp-pinterest-bubble-above,.-amp-pinterest-bubble-above-tall{position:absolute;left:0;text-align:center;text-decoration:none;color:#777}.-amp-pinterest-bubble-above-tall{bottom:29px;height:37px;width:56px;background:transparent url(https://s-passets.pinimg.com/images/pidgets/count_north_white_rect_28_2.png) 0 0 no-repeat;background-size:56px 37px;font:15px Arial,Helvetica,sans-serif;line-height:28px}.-amp-pinterest-count-pad-beside{width:86px}.-amp-pinterest-count-pad-beside-tall{width:120px}.-amp-pinterest-bubble-beside{height:20px;width:45px;text-indent:5px;background:transparent url(https://s-passets.pinimg.com/images/pidgets/count_east_white_rect_20_2.png) 0 0 no-repeat;background-size:45px 20px;font:12px Arial,Helvetica,sans-serif;line-height:20px}.-amp-pinterest-bubble-beside,.-amp-pinterest-bubble-beside-tall{position:absolute;top:0;right:0;text-align:center;text-decoration:none;color:#777}.-amp-pinterest-bubble-beside-tall{height:28px;width:63px;text-indent:7px;background:transparent url(https://s-passets.pinimg.com/images/pidgets/count_east_white_rect_28_2.png) 0 0 no-repeat;background-size:63px 28px;font:15px Arial,Helvetica,sans-serif;line-height:28px}.-amp-pinterest-follow-button{background:transparent url(https://s-passets.pinimg.com/images/pidgets/bfs2.png) 0 0 no-repeat;background-size:200px 60px;border-right:1px solid #d0d0d0;border-radius:4px;color:#444;cursor:pointer;display:inline-block;font:700 normal normal 11px/20px Helvetica Neue,helvetica,arial,san-serif;padding-right:3px;position:relative;text-decoration:none;text-indent:20px}.-amp-pinterest-follow-button:hover{background-position:0 -20px;border-right-color:#919191}.-amp-pinterest-follow-button i{background-image:url(https://s-passets.pinimg.com/images/pidgets/log2.png);background-size:14px 14px;height:14px;left:3px;position:absolute;top:3px;width:14px}.-amp-pinterest-embed-pin,.-amp-pinterest-embed-pin-medium{padding:5px;width:237px}.-amp-pinterest-embed-pin-medium{width:345px}.-amp-pinterest-embed-pin-inner{display:block;position:relative;-webkit-font-smoothing:antialiased;cursor:pointer;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.33);border-radius:3px;width:100%}.-amp-pinterest-embed-pin-text{color:#a8a8a8;white-space:normal;font-family:Helvetica Neue,arial,sans-serif;font-size:11px;line-height:18px;font-weight:700}.-amp-pinterest-embed-pin-image{border-radius:3px 3px 0 0}.-amp-pinterest-embed-pin-text-block{display:block;line-height:30px;padding:0 12px}.-amp-pinterest-embed-pin-text-icon-attrib{height:16px;width:16px;vertical-align:middle}.-amp-pinterest-embed-pin-stats{height:16px;line-height:16px;padding:8px 12px}.-amp-pinterest-embed-pin-stats-likes{padding-left:14px;background:transparent url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAKCAAAAAClR+AmAAAAUElEQVR4AT2HMQpFIQwEc/+zbXhFLBW8QUihIAT2E8Q/xe6M0Jv2zK7NKUcBzAlAjzjqtdZl4c8S2nOjMPS6BoWMr/wLVnAbYJs3mGMkXzx+OeRqUf5HHRoAAAAASUVORK5CYII=) 0 2px no-repeat}.-amp-pinterest-embed-pin-stats-repins{padding:0 10px 0 18px;background:transparent url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAALCAAAAABq7uO+AAAASklEQVQI10WNMQrAMBRCvf/Z3pQcImPplsIPdqhNXOSJqLxVtnWQsuUO9IM3cHlV8dSSDZQHAOPH2YA2FU+qtH7MRhaVh/xt/PQCEW6N4EV+CPEAAAAASUVORK5CYII=) 0 0 no-repeat}.-amp-pinterest-embed-pin-description{color:#363636;font-weight:400;font-size:14px;line-height:17px;padding-top:5px}.-amp-pinterest-embed-pin-pinner{padding:12px;border-top:1px solid rgba(0,0,0,.09)}.-amp-pinterest-embed-pin-pinner-avatar{border-radius:15px;border:none;height:30px;width:30px;vertical-align:middle;margin:0 8px 12px 0;float:left}.-amp-pinterest-embed-pin-board-name,.-amp-pinterest-embed-pin-pinner-name{display:block;height:15px;line-height:15px}.-amp-pinterest-embed-pin-pinner-name{color:#777}.-amp-pinterest-embed-pin-repin{position:absolute;top:12px;left:12px;cursor:pointer}\n/*# sourceURL=/extensions/amp-pinterest/0.1/amp-pinterest.css*/");
});
//# sourceMappingURL=amp-pinterest-0.1.js.map

