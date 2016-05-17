(window.AMP = window.AMP || []).push(function(AMP) {var process={env:{NODE_ENV:"production"}};var g="undefined"!=typeof window&&window===this?this:"undefined"!=typeof global?global:this;function m(a,b){function d(){}d.prototype=b.prototype;a.prototype=new d;a.prototype.constructor=a;for(var c in b)if(g.Object.defineProperties){var e=g.Object.getOwnPropertyDescriptor(b,c);void 0!==e&&g.Object.defineProperty(a,c,e)}else a[c]=b[c]};var n=null,p="";var q=(new Date).getTime();function r(a,b,d){this.win=a.AMP_TEST?a.parent:a;this.levelFunc_=b;this.level_=this.calcLevel_();this.suffix_=d||""}
r.prototype.calcLevel_=function(){var a;if(n)a=n;else{if(window.context&&window.context.mode)a=window.context.mode;else{a=("localhost"==location.hostname||location.ancestorOrigins&&location.ancestorOrigins[0]&&0==location.ancestorOrigins[0].indexOf("http://localhost:"))&&!!document.querySelector('script[src*="/dist/"],script[src*="/base/"]');var b=location.originalHash||location.hash,d=Object.create(null);if(b){if(0==b.indexOf("?")||0==b.indexOf("#"))b=b.substr(1);for(var b=b.split("&"),c=0;c<b.length;c++){var e=
b[c],f=e.indexOf("="),k=void 0,l=void 0;-1!=f?(k=decodeURIComponent(e.substring(0,f)).trim(),l=decodeURIComponent(e.substring(f+1)).trim()):(k=decodeURIComponent(e).trim(),l="");k&&(d[k]=l)}}p||(p=a?"1463506055389":window.AMP_CONFIG&&window.AMP_CONFIG.v?window.AMP_CONFIG.v:"1463506055389");a={localDev:a,development:"1"==d.development||window.AMP_DEV_MODE,filter:d.filter,minified:"production"==process.env.NODE_ENV,test:window.AMP_TEST,log:d.log,version:p}}a=n=a}return this.win.console&&
this.win.console.log&&"0"!=a.log?this.win.ENABLE_LOG?4:a.localDev&&!a.log?3:this.levelFunc_(a):0};r.prototype.msg_=function(a,b,d){if(0!=this.level_){var c=this.win.console.log;"ERROR"==b?c=this.win.console.error||c:"INFO"==b?c=this.win.console.info||c:"WARN"==b&&(c=this.win.console.warn||c);d.unshift((new Date).getTime()-q,"["+a+"]");c.apply(this.win.console,d)}};r.prototype.isEnabled=function(){return 0!=this.level_};
r.prototype.fine=function(a,b){4<=this.level_&&this.msg_(a,"FINE",Array.prototype.slice.call(arguments,1))};r.prototype.info=function(a,b){3<=this.level_&&this.msg_(a,"INFO",Array.prototype.slice.call(arguments,1))};r.prototype.warn=function(a,b){2<=this.level_&&this.msg_(a,"WARN",Array.prototype.slice.call(arguments,1))};
r.prototype.error=function(a,b){if(1<=this.level_)this.msg_(a,"ERROR",Array.prototype.slice.call(arguments,1));else{var d=t.apply(null,Array.prototype.slice.call(arguments,1));this.prepareError_(d);this.win.setTimeout(function(){throw d;})}};r.prototype.createError=function(a){var b=t.apply(null,arguments);this.prepareError_(b);return b};
r.prototype.assert=function(a,b,d){var c=void 0;if(!a){var e=(b||"Assertion failed").split("%s"),f=e.shift(),k=f,l=[];""!=f&&l.push(f);for(f=2;f<arguments.length;f++){var h=arguments[f];h&&h.tagName&&(c=h);var v=e.shift();l.push(h);var w=v.trim();""!=w&&l.push(w);h=h instanceof Element?h.tagName.toLowerCase()+(h.id?"#"+h.id:""):h;k+=h+v}e=Error(k);e.fromAssert=!0;e.associatedElement=c;e.messageArray=l;this.prepareError_(e);throw e;}return a};
r.prototype.assertEnumValue=function(a,b,d){for(var c in a)if(a[c]==b)return a[c];this.assert(!1,'Unknown %s value: "%s"',d||"enum",b)};r.prototype.prepareError_=function(a){this.suffix_&&(a.message?-1==a.message.indexOf(this.suffix_)&&(a.message+=this.suffix_):a.message=this.suffix_)};function t(a){for(var b=null,d="",c=0;c<arguments.length;c++){var e=arguments[c];e instanceof Error&&!b?b=e:(d&&(d+=" "),d+=e)}b?d&&(b.message=d+": "+b.message):b=Error(d);return b}
var u=new r(window,function(a){var b=parseInt(a.log,10);return a.development||1<=b?4:0},"\u200b\u200b\u200b"),x=new r(window,function(a){a=parseInt(a.log,10);return 3<=a?4:2<=a?3:0});function y(a){this.win=a;this.resolved_=Promise.resolve();this.taskCount_=0;this.canceled_={};this.startTime_=this.now()}y.prototype.now=function(){return Date.now()};y.prototype.timeSinceStart=function(){return this.now()-this.startTime_};y.prototype.delay=function(a,b){if(!b){var d=this,c="p"+this.taskCount_++;this.resolved_.then(function(){d.canceled_[c]?delete d.canceled_[c]:a()});return c}return this.win.setTimeout(a,b)};
y.prototype.cancel=function(a){"string"==typeof a?this.canceled_[a]=!0:this.win.clearTimeout(a)};y.prototype.promise=function(a,b){var d=this,c=null;return(new Promise(function(e,f){c=d.delay(function(){c=-1;e(b)},a);-1==c&&f(Error("Failed to schedule timer."))})).catch(function(a){-1!=c&&d.cancel(c);throw a;})};
y.prototype.timeoutPromise=function(a,b,d){var c=this,e=null,f=(new Promise(function(b,f){e=c.delay(function(){e=-1;f(u.createError(d||"timeout"))},a);-1==e&&f(Error("Failed to schedule timer."))})).catch(function(a){-1!=e&&c.cancel(e);throw a;});return b?Promise.race([f,b]):f};new y(window);var z=Object.create(null);function A(a){AMP.BaseElement.apply(this,arguments)}m(A,AMP.BaseElement);A.prototype.isLayoutSupported=function(a){return"nodisplay"==a};
A.prototype.buildCallback=function(){var a;a=this.getWin();if("amp-sticky-ad"in z)a=z["amp-sticky-ad"];else{var b;c:{b=void 0;try{b=a.document.cookie}catch(f){}if(b){b=b.split(";");for(var d=0;d<b.length;d++){var c=b[d].trim(),e=c.indexOf("=");if(-1!=e&&"AMP_EXP"==decodeURIComponent(c.substring(0,e).trim())){b=decodeURIComponent(c.substring(e+1).trim());break c}}}b=null}a=-1!=(b?b.split(/\s*,\s*/g):[]).indexOf("amp-sticky-ad")?!0:a.AMP_CONFIG&&a.AMP_CONFIG.hasOwnProperty("amp-sticky-ad")?Math.random()<
a.AMP_CONFIG["amp-sticky-ad"]:!1;a=z["amp-sticky-ad"]=a}(this.isExperimentOn_=a)||x.warn("amp-sticky-ad","TAG amp-sticky-ad disabled")};AMP.registerElement("amp-sticky-ad",A,"\n/*# sourceURL=/extensions/amp-sticky-ad/0.1/amp-sticky-ad.css*/");
});
//# sourceMappingURL=amp-sticky-ad-0.1.js.map

