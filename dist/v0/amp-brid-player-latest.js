(window.AMP = window.AMP || []).push(function(AMP) {var process={env:{NODE_ENV:"production"}};var k="undefined"!=typeof window&&window===this?this:"undefined"!=typeof global?global:this;function m(a,b){function d(){}d.prototype=b.prototype;a.prototype=new d;a.prototype.constructor=a;for(var c in b)if(k.Object.defineProperties){var e=k.Object.getOwnPropertyDescriptor(b,c);void 0!==e&&k.Object.defineProperty(a,c,e)}else a[c]=b[c]};var n=null,p="";var r=(new Date).getTime();function t(a,b,d){this.win=a.AMP_TEST?a.parent:a;this.levelFunc_=b;this.level_=this.calcLevel_();this.suffix_=d||""}
t.prototype.calcLevel_=function(){var a;if(n)a=n;else{if(window.context&&window.context.mode)a=window.context.mode;else{a=("localhost"==location.hostname||location.ancestorOrigins&&location.ancestorOrigins[0]&&0==location.ancestorOrigins[0].indexOf("http://localhost:"))&&!!document.querySelector('script[src*="/dist/"],script[src*="/base/"]');var b=location.originalHash||location.hash,d=Object.create(null);if(b){if(0==b.indexOf("?")||0==b.indexOf("#"))b=b.substr(1);for(var b=b.split("&"),c=0;c<b.length;c++){var e=
b[c],f=e.indexOf("="),h=void 0,l=void 0;-1!=f?(h=decodeURIComponent(e.substring(0,f)).trim(),l=decodeURIComponent(e.substring(f+1)).trim()):(h=decodeURIComponent(e).trim(),l="");h&&(d[h]=l)}}p||(p=a?"1463506055389":window.AMP_CONFIG&&window.AMP_CONFIG.v?window.AMP_CONFIG.v:"1463506055389");a={localDev:a,development:"1"==d.development||window.AMP_DEV_MODE,filter:d.filter,minified:"production"==process.env.NODE_ENV,test:window.AMP_TEST,log:d.log,version:p}}a=n=a}return this.win.console&&
this.win.console.log&&"0"!=a.log?this.win.ENABLE_LOG?4:a.localDev&&!a.log?3:this.levelFunc_(a):0};t.prototype.msg_=function(a,b,d){if(0!=this.level_){var c=this.win.console.log;"ERROR"==b?c=this.win.console.error||c:"INFO"==b?c=this.win.console.info||c:"WARN"==b&&(c=this.win.console.warn||c);d.unshift((new Date).getTime()-r,"["+a+"]");c.apply(this.win.console,d)}};t.prototype.isEnabled=function(){return 0!=this.level_};
t.prototype.fine=function(a,b){4<=this.level_&&this.msg_(a,"FINE",Array.prototype.slice.call(arguments,1))};t.prototype.info=function(a,b){3<=this.level_&&this.msg_(a,"INFO",Array.prototype.slice.call(arguments,1))};t.prototype.warn=function(a,b){2<=this.level_&&this.msg_(a,"WARN",Array.prototype.slice.call(arguments,1))};
t.prototype.error=function(a,b){if(1<=this.level_)this.msg_(a,"ERROR",Array.prototype.slice.call(arguments,1));else{var d=u.apply(null,Array.prototype.slice.call(arguments,1));this.prepareError_(d);this.win.setTimeout(function(){throw d;})}};t.prototype.createError=function(a){var b=u.apply(null,arguments);this.prepareError_(b);return b};
t.prototype.assert=function(a,b,d){var c=void 0;if(!a){var e=(b||"Assertion failed").split("%s"),f=e.shift(),h=f,l=[];""!=f&&l.push(f);for(f=2;f<arguments.length;f++){var g=arguments[f];g&&g.tagName&&(c=g);var q=e.shift();l.push(g);var y=q.trim();""!=y&&l.push(y);g=g instanceof Element?g.tagName.toLowerCase()+(g.id?"#"+g.id:""):g;h+=g+q}e=Error(h);e.fromAssert=!0;e.associatedElement=c;e.messageArray=l;this.prepareError_(e);throw e;}return a};
t.prototype.assertEnumValue=function(a,b,d){for(var c in a)if(a[c]==b)return a[c];this.assert(!1,'Unknown %s value: "%s"',d||"enum",b)};t.prototype.prepareError_=function(a){this.suffix_&&(a.message?-1==a.message.indexOf(this.suffix_)&&(a.message+=this.suffix_):a.message=this.suffix_)};function u(a){for(var b=null,d="",c=0;c<arguments.length;c++){var e=arguments[c];e instanceof Error&&!b?b=e:(d&&(d+=" "),d+=e)}b?d&&(b.message=d+": "+b.message):b=Error(d);return b}
var v=new t(window,function(a){var b=parseInt(a.log,10);return a.development||1<=b?4:0},"\u200b\u200b\u200b");new t(window,function(a){a=parseInt(a.log,10);return 3<=a?4:2<=a?3:0});function w(a){this.win=a;this.resolved_=Promise.resolve();this.taskCount_=0;this.canceled_={};this.startTime_=this.now()}w.prototype.now=function(){return Date.now()};w.prototype.timeSinceStart=function(){return this.now()-this.startTime_};w.prototype.delay=function(a,b){if(!b){var d=this,c="p"+this.taskCount_++;this.resolved_.then(function(){d.canceled_[c]?delete d.canceled_[c]:a()});return c}return this.win.setTimeout(a,b)};
w.prototype.cancel=function(a){"string"==typeof a?this.canceled_[a]=!0:this.win.clearTimeout(a)};w.prototype.promise=function(a,b){var d=this,c=null;return(new Promise(function(e,f){c=d.delay(function(){c=-1;e(b)},a);-1==c&&f(Error("Failed to schedule timer."))})).catch(function(a){-1!=c&&d.cancel(c);throw a;})};
w.prototype.timeoutPromise=function(a,b,d){var c=this,e=null,f=(new Promise(function(b,f){e=c.delay(function(){e=-1;f(v.createError(d||"timeout"))},a);-1==e&&f(Error("Failed to schedule timer."))})).catch(function(a){-1!=e&&c.cancel(e);throw a;});return b?Promise.race([f,b]):f};var x=new w(window);function z(a,b,d,c){function e(a){d(a);h()}var f=c||!1,h=void 0,h=function(){a&&a.removeEventListener(b,e,f);e=a=null};a.addEventListener(b,e,f);return h}
function A(a,b){var d=void 0,c=void 0,e=new Promise(function(b,e){a.complete||"complete"==a.readyState?b(a):(d="AUDIO"===a.tagName||"VIDEO"===a.tagName?z(a,"loadstart",function(){return b(a)}):z(a,"load",function(){return b(a)}),c=z(a,"error",function(){e(v.createError("Failed HTTP request for %s.",a))}))});return B(e,function(){d&&d();c&&c()},b)}function B(a,b,d){var c=void 0,c=void 0===d?a:x.timeoutPromise(d||0,a);return b?c.then(function(a){b();return a},function(a){b();throw a;}):c};var C=Object.create(null),D="Webkit webkit Moz moz ms O o".split(" ");function E(a,b){for(var d in b){var c=a,e=b[d],f;f=c.style;var h=C[d];if(!h){h=d;if(void 0===f[d]){var l=d.charAt(0).toUpperCase()+d.slice(1),g=void 0;a:{for(g=0;g<D.length;g++){var q=D[g]+l;if(void 0!==f[q]){g=q;break a}}g=""}l=g;void 0!==f[l]&&(h=l)}C[d]=h}(f=h)&&(c.style[f]=e)}};function F(a){AMP.BaseElement.apply(this,arguments)}m(F,AMP.BaseElement);F.prototype.preconnectCallback=function(a){this.preconnect.url("https://services.brid.tv",a);this.preconnect.url("https://cdn.brid.tv",a)};F.prototype.isLayoutSupported=function(a){return"fixed"==a||"fixed-height"==a||"responsive"==a||"fill"==a||"flex-item"==a};
F.prototype.buildCallback=function(){var a=this.element.getAttribute("width"),b=this.element.getAttribute("height");this.width_=parseFloat(a);this.height_=parseFloat(b);this.partnerID_=v.assert(this.element.getAttribute("data-partner"),"The data-partner attribute is required for <amp-brid-player> %s",this.element);this.feedID_=v.assert(this.element.getAttribute("data-video")||this.element.getAttribute("data-playlist"),"Either the data-video or the data-playlist attributes must be specified for <amp-brid-player> %s",
this.element);this.getPlaceholder()||this.buildImagePlaceholder_()};
F.prototype.layoutCallback=function(){var a=v.assert(this.element.getAttribute("data-player"),"The data-player attribute is required for <amp-brid-player> %s",this.element),b=v.assert(this.partnerID_,"The data-partner attribute is required for <amp-brid-player> %s",this.element),d=void 0;this.element.getAttribute("data-video")?d="video":this.element.getAttribute("data-playlist")&&(d="playlist");var c=this.element.ownerDocument.createElement("iframe"),a="https://services.brid.tv/services/iframe/"+
encodeURIComponent(d)+"/"+encodeURIComponent(this.feedID_)+"/"+encodeURIComponent(b)+"/"+encodeURIComponent(a)+"/0/1";c.setAttribute("frameborder","0");c.setAttribute("allowfullscreen","true");c.src=a;this.applyFillContent(c);c.width=this.width_;c.height=this.height_;this.element.appendChild(c);this.iframe_=c;return A(c)};F.prototype.pauseCallback=function(){this.iframe_&&this.iframe_.contentWindow&&this.iframe_.contentWindow.postMessage("Brid|pause","https://services.brid.tv")};
F.prototype.buildImagePlaceholder_=function(){var a=new Image,b=this.partnerID_,d=this.feedID_;E(a,{"object-fit":"cover",visibility:"hidden"});a.src="https://cdn.brid.tv/live/partners/"+encodeURIComponent(b)+"/snapshot/"+encodeURIComponent(d)+".jpg";a.setAttribute("placeholder","");a.width=this.width_;a.height=this.height_;this.element.appendChild(a);this.applyFillContent(a);A(a).catch(function(){a.src="https://services.brid.tv/ugc/default/defaultSnapshot.png";return A(a)}).then(function(){E(a,{visibility:""})})};
AMP.registerElement("amp-brid-player",F);
});
//# sourceMappingURL=amp-brid-player-0.1.js.map

