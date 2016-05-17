(window.AMP = window.AMP || []).push(function(AMP) {var process={env:{NODE_ENV:"production"}};var g="undefined"!=typeof window&&window===this?this:"undefined"!=typeof global?global:this;function h(a,b){function c(){}c.prototype=b.prototype;a.prototype=new c;a.prototype.constructor=a;for(var d in b)if(g.Object.defineProperties){var e=g.Object.getOwnPropertyDescriptor(b,d);void 0!==e&&g.Object.defineProperty(a,d,e)}else a[d]=b[d]};var l=null,p="";var q=(new Date).getTime();function r(a,b,c){this.win=a.AMP_TEST?a.parent:a;this.levelFunc_=b;this.level_=this.calcLevel_();this.suffix_=c||""}
r.prototype.calcLevel_=function(){var a;if(l)a=l;else{if(window.context&&window.context.mode)a=window.context.mode;else{a=("localhost"==location.hostname||location.ancestorOrigins&&location.ancestorOrigins[0]&&0==location.ancestorOrigins[0].indexOf("http://localhost:"))&&!!document.querySelector('script[src*="/dist/"],script[src*="/base/"]');var b=location.originalHash||location.hash,c=Object.create(null);if(b){if(0==b.indexOf("?")||0==b.indexOf("#"))b=b.substr(1);for(var b=b.split("&"),d=0;d<b.length;d++){var e=
b[d],f=e.indexOf("="),m=void 0,n=void 0;-1!=f?(m=decodeURIComponent(e.substring(0,f)).trim(),n=decodeURIComponent(e.substring(f+1)).trim()):(m=decodeURIComponent(e).trim(),n="");m&&(c[m]=n)}}p||(p=a?"1463506055389":window.AMP_CONFIG&&window.AMP_CONFIG.v?window.AMP_CONFIG.v:"1463506055389");a={localDev:a,development:"1"==c.development||window.AMP_DEV_MODE,filter:c.filter,minified:"production"==process.env.NODE_ENV,test:window.AMP_TEST,log:c.log,version:p}}a=l=a}return this.win.console&&
this.win.console.log&&"0"!=a.log?this.win.ENABLE_LOG?4:a.localDev&&!a.log?3:this.levelFunc_(a):0};r.prototype.msg_=function(a,b,c){if(0!=this.level_){var d=this.win.console.log;"ERROR"==b?d=this.win.console.error||d:"INFO"==b?d=this.win.console.info||d:"WARN"==b&&(d=this.win.console.warn||d);c.unshift((new Date).getTime()-q,"["+a+"]");d.apply(this.win.console,c)}};r.prototype.isEnabled=function(){return 0!=this.level_};
r.prototype.fine=function(a,b){4<=this.level_&&this.msg_(a,"FINE",Array.prototype.slice.call(arguments,1))};r.prototype.info=function(a,b){3<=this.level_&&this.msg_(a,"INFO",Array.prototype.slice.call(arguments,1))};r.prototype.warn=function(a,b){2<=this.level_&&this.msg_(a,"WARN",Array.prototype.slice.call(arguments,1))};
r.prototype.error=function(a,b){if(1<=this.level_)this.msg_(a,"ERROR",Array.prototype.slice.call(arguments,1));else{var c=t.apply(null,Array.prototype.slice.call(arguments,1));this.prepareError_(c);this.win.setTimeout(function(){throw c;})}};r.prototype.createError=function(a){var b=t.apply(null,arguments);this.prepareError_(b);return b};
r.prototype.assert=function(a,b,c){var d=void 0;if(!a){var e=(b||"Assertion failed").split("%s"),f=e.shift(),m=f,n=[];""!=f&&n.push(f);for(f=2;f<arguments.length;f++){var k=arguments[f];k&&k.tagName&&(d=k);var A=e.shift();n.push(k);var B=A.trim();""!=B&&n.push(B);k=k instanceof Element?k.tagName.toLowerCase()+(k.id?"#"+k.id:""):k;m+=k+A}e=Error(m);e.fromAssert=!0;e.associatedElement=d;e.messageArray=n;this.prepareError_(e);throw e;}return a};
r.prototype.assertEnumValue=function(a,b,c){for(var d in a)if(a[d]==b)return a[d];this.assert(!1,'Unknown %s value: "%s"',c||"enum",b)};r.prototype.prepareError_=function(a){this.suffix_&&(a.message?-1==a.message.indexOf(this.suffix_)&&(a.message+=this.suffix_):a.message=this.suffix_)};function t(a){for(var b=null,c="",d=0;d<arguments.length;d++){var e=arguments[d];e instanceof Error&&!b?b=e:(c&&(c+=" "),c+=e)}b?c&&(b.message=c+": "+b.message):b=Error(c);return b}
var u=new r(window,function(a){var b=parseInt(a.log,10);return a.development||1<=b?4:0},"\u200b\u200b\u200b");new r(window,function(a){a=parseInt(a.log,10);return 3<=a?4:2<=a?3:0});window.document.createElement("a");Object.create(null);function v(a,b){for(var c=a.firstElementChild;c;c=c.nextElementSibling)if(b(c))return c;return null}var w=void 0;function x(a,b){if(null==w)try{a.ownerDocument.querySelector(":scope"),w=!0}catch(c){w=!1}return w?a.querySelector(":scope > ["+b+"]"):v(a,function(a){return a.hasAttribute(b)})};function y(a,b,c){var d=a.services;d||(d=a.services={});var e=d[b];e||(e=d[b]={obj:null,promise:null,resolve:null});e.obj||(e.obj=c(a),e.promise||(e.promise=Promise.resolve(e.obj)),e.resolve&&e.resolve(e.obj));return e.obj};function z(a){this.win=a;this.resolved_=Promise.resolve();this.taskCount_=0;this.canceled_={};this.startTime_=this.now()}z.prototype.now=function(){return Date.now()};z.prototype.timeSinceStart=function(){return this.now()-this.startTime_};z.prototype.delay=function(a,b){if(!b){var c=this,d="p"+this.taskCount_++;this.resolved_.then(function(){c.canceled_[d]?delete c.canceled_[d]:a()});return d}return this.win.setTimeout(a,b)};
z.prototype.cancel=function(a){"string"==typeof a?this.canceled_[a]=!0:this.win.clearTimeout(a)};z.prototype.promise=function(a,b){var c=this,d=null;return(new Promise(function(e,f){d=c.delay(function(){d=-1;e(b)},a);-1==d&&f(Error("Failed to schedule timer."))})).catch(function(a){-1!=d&&c.cancel(d);throw a;})};
z.prototype.timeoutPromise=function(a,b,c){var d=this,e=null,f=(new Promise(function(b,f){e=d.delay(function(){e=-1;f(u.createError(c||"timeout"))},a);-1==e&&f(Error("Failed to schedule timer."))})).catch(function(a){-1!=e&&d.cancel(e);throw a;});return b?Promise.race([f,b]):f};var C=new z(window);var D=Object.create(null);function E(a,b){if(b in D)return D[b];var c;b:{c=void 0;try{c=a.document.cookie}catch(m){}if(c){c=c.split(";");for(var d=0;d<c.length;d++){var e=c[d].trim(),f=e.indexOf("=");if(-1!=f&&"AMP_EXP"==decodeURIComponent(e.substring(0,f).trim())){c=decodeURIComponent(e.substring(f+1).trim());break b}}}c=null}c=-1!=(c?c.split(/\s*,\s*/g):[]).indexOf(b)?!0:a.AMP_CONFIG&&a.AMP_CONFIG.hasOwnProperty(b)?Math.random()<a.AMP_CONFIG[b]:!1;return D[b]=c};function F(a){var b=0;return function(){var c=Math.pow(a||2,b++),c=c+G(c);return 1E3*c}}function G(a,b){var c=a*(b||.3)*Math.random();.5<Math.random()&&(c*=-1);return c};function H(a,b){var c="loading"!=a.readyState;if(c)b();else{var d=function(){"loading"!=a.readyState&&(c||(c=!0,b()),a.removeEventListener("readystatechange",d))};a.addEventListener("readystatechange",d)}}function I(a){return new Promise(function(b){H(a,b)})};function J(a,b,c){this.win=a;this.wait_=b;this.work_=c;this.lastTimeoutId_=null;this.isRunning_=!1;this.lastWorkPromise_=this.backoffClock_=null}J.prototype.getTimeout_=function(){return this.backoffClock_?this.backoffClock_():this.wait_+G(this.wait_,.2)};J.prototype.isRunning=function(){return this.isRunning_};J.prototype.start=function(a){this.isRunning_||(this.isRunning_=!0,this.poll_(a))};J.prototype.stop=function(){this.isRunning_&&(this.isRunning_=!1,this.clear_())};
J.prototype.clear_=function(){this.lastTimeoutId_&&(C.cancel(this.lastTimeoutId_),this.lastTimeoutId_=null)};J.prototype.poll_=function(a){var b=this;if(this.isRunning_){var c=function(){b.lastWorkPromise_=b.work_().then(function(){b.backoffClock_&&(b.backoffClock_=null);b.poll_()}).catch(function(a){if(a.retriable)b.backoffClock_||(b.backoffClock_=F()),b.poll_();else throw a;})};a?c():this.lastTimeoutId_=C.delay(c,this.getTimeout_())}};function K(a){var b=this;this.win=a;this.liveLists_=Object.create(null);this.viewer_=y(this.win,"viewer");this.interval_=15E3;this.intervals_=[this.interval_];this.poller_=null;this.url_=this.win.location.href;this.latestUpdateTime_=0;this.work_=this.fetchDocument_.bind(this);this.whenDocReady_().then(function(){b.interval_=Math.min.apply(Math,b.intervals_);b.poller_=new J(b.win,b.interval_,b.work_);b.viewer_.isVisible()&&b.poller_.start();b.setupVisibilityHandler_()})}
K.prototype.fetchDocument_=function(){var a=this.url_;if(0<this.latestUpdateTime_){var b=a,a=this.latestUpdateTime_,a=encodeURIComponent("amp_latest_update_time")+"="+encodeURIComponent(a);if(a)var b=b.split("#",2),c=b[0].split("?",2),a=c[0]+(c[1]?"?"+c[1]+"&"+a:"?"+a),a=a+(b[1]?"#"+b[1]:"");else a=b}return y(this.win,"xhr").fetchDocument(a).then(this.getLiveLists_.bind(this))};
K.prototype.getLiveLists_=function(a){a=Array.prototype.slice.call(a.getElementsByTagName("amp-live-list")).map(this.updateLiveList_.bind(this));a=Math.max.apply(Math,[0].concat(a));0<a&&(this.latestUpdateTime_=a)};K.prototype.updateLiveList_=function(a){var b=a.getAttribute("id");u.assert(b,"amp-live-list must have an id.");u.assert(b in this.liveLists_,"amp-live-list#"+b+" found but did not exist on original page load.");return this.liveLists_[b].update(a)};
K.prototype.register=function(a,b){a in this.liveLists_||(this.liveLists_[a]=b,this.intervals_.push(b.getInterval()))};K.prototype.whenDocReady_=function(){return I(this.win.document)};K.prototype.setupVisibilityHandler_=function(){var a=this;this.viewer_.onVisibilityChanged(function(){a.viewer_.isVisible()?a.poller_.start(!0):a.poller_.stop()})};function L(a){return y(a,"liveListManager",function(){return new K(a)})};function M(a,b){return Math.max(parseInt(a,10)||0,b)}function N(a){AMP.BaseElement.apply(this,arguments)}h(N,AMP.BaseElement);N.prototype.isLayoutSupported=function(a){return"container"==a};
N.prototype.buildCallback=function(){this.win=this.getWin();if(this.isExperimentOn_=E(this.win,"amp-live-list")){this.viewport_=y(this.win,"viewport");this.manager_=L(this.win);this.liveListId_=u.assert(this.element.getAttribute("id"),"amp-live-list must have an id.");this.pollInterval_=M(this.element.getAttribute("data-poll-interval"),15E3);var a=this.element.getAttribute("data-max-items-per-page");u.assert(0<Number(a),"amp-live-list#"+this.liveListId_+" must have data-max-items-per-page attribute with numeric value. "+
("Found "+a));this.maxItemsPerPage_=M(a,10);this.updateTime_=0;this.knownItems_=Object.create(null);this.manager_.register(this.liveListId_,this);this.insertFragment_=this.win.document.createDocumentFragment();this.updateSlot_=u.assert(this.getUpdateSlot_(this.element),'amp-live-list must have an "update" slot.');this.itemsSlot_=u.assert(this.getItemsSlot_(this.element),'amp-live-list must have an "items" slot.');this.updateSlot_.classList.add("-amp-hidden");this.eachChildElement_(this.itemsSlot_,
function(a){a.classList.add("amp-live-list-item")});this.validateLiveListItems_(this.itemsSlot_,!0);this.registerAction("update",this.updateAction_.bind(this))}else u.warn("amp-live-list","Experiment amp-live-list disabled")};
N.prototype.update=function(a){var b=this;a=this.getItemsSlot_(a);u.assert(a,"amp-live-list must have an `items` slot");this.validateLiveListItems_(a);a=this.getUpdates_(a);var c=this.sortByDataSortTime_.bind(this);a.insert.sort(c).forEach(function(a){a.classList.add("amp-live-list-item");a.classList.add("amp-live-list-item-new");b.insertFragment_.insertBefore(a,b.insertFragment_.firstElementChild)});if(0<a.insert.length){var d=this;this.deferMutate(function(){d.updateSlot_.classList.remove("-amp-hidden")})}return this.updateTime_};
N.prototype.updateAction_=function(){var a=this;return 0==this.insertFragment_.childElementCount?Promise.resolve():this.mutateElement(function(){a.eachChildElement_(a.itemsSlot_,function(a){a.classList.remove("amp-live-list-item-new")});a.itemsSlot_.insertBefore(a.insertFragment_,a.itemsSlot_.firstElementChild);a.updateSlot_.classList.add("-amp-hidden")}).then(function(){a.getVsync().mutate(function(){a.viewport_.scrollIntoView(a.element)})})};N.prototype.getInterval=function(){return this.pollInterval_};
N.prototype.getUpdates_=function(a){var b=[],c=[];for(a=a.firstElementChild;a;a=a.nextElementSibling){var d=a.getAttribute("id");if(this.isChildNew_(a)){var e=this.win.document.importNode(a,!0);b.push(e);this.cacheChild_(a)}else this.isChildUpdate_(a)&&(e=this.getUpdateTime_(a),this.knownItems_[d]=e,d=this.win.document.importNode(a,!0),e>this.updateTime_&&(this.updateTime_=e),c.push(d))}return{insert:b,updates:c,tombstone:[]}};N.prototype.isChildNew_=function(a){return!(a.getAttribute("id")in this.knownItems_)};
N.prototype.isChildUpdate_=function(a){if(!a.hasAttribute("data-update-time"))return!1;var b=a.getAttribute("id");a=this.getUpdateTime_(a);return b in this.knownItems_&&a>this.knownItems_[b]};N.prototype.isChildTombstone_=function(){return!1};N.prototype.cacheChild_=function(a){var b=a.getAttribute("id");a=this.getUpdateTime_(a);a>this.updateTime_&&(this.updateTime_=a);this.knownItems_[b]=a};N.prototype.removeChildId_=function(a){delete this.knownItems_[a]};
N.prototype.isValidChild_=function(a){return!!a.hasAttribute("id")&&0<Number(a.getAttribute("data-sort-time"))};N.prototype.validateLiveListItems_=function(a,b){var c=this,d=!1;this.eachChildElement_(a,function(a){c.isValidChild_(a)?b&&c.cacheChild_(a):d=!0});u.assert(!d,"All amp-live-list-items under amp-live-list#"+this.liveListId_+" children must have id and data-sort-time attributes. data-sort-time must be a Number greater than 0.")};
N.prototype.eachChildElement_=function(a,b){for(var c=a.firstElementChild;c;c=c.nextElementSibling)b(c)};N.prototype.getUpdateSlot_=function(a){return x(a,"update")};N.prototype.getItemsSlot_=function(a){return x(a,"items")};N.prototype.sortByDataSortTime_=function(a,b){return this.getSortTime_(a)-this.getSortTime_(b)};N.prototype.getSortTime_=function(a){return this.getTimeAttr_(a,"data-sort-time")};
N.prototype.getUpdateTime_=function(a){return a.hasAttribute("data-update-time")?this.getTimeAttr_(a,"data-update-time"):this.getSortTime_(a)};N.prototype.getTimeAttr_=function(a,b){var c=Number(a.getAttribute(b));u.assert(0<c,'"'+b+'" attribute must exist and value '+("must be a number greater than 0. Found "+c+" on ")+(a.getAttribute("id")+" instead."));return c};AMP.registerElement("amp-live-list",N,"amp-live-list>[update]{position:relative;z-index:1000!important}amp-live-list>.-amp-hidden[update]{display:none}.amp-live-list-item-new{-webkit-animation:a 2s;animation:a 2s}.amp-live-list-update-active{display:block}@-webkit-keyframes a{0%{box-shadow:0 0 5px 2px #51cbee}to{box-shadow:0}}@keyframes a{0%{box-shadow:0 0 5px 2px #51cbee}to{box-shadow:0}}\n/*# sourceURL=/extensions/amp-live-list/0.1/amp-live-list.css*/");
});
//# sourceMappingURL=amp-live-list-0.1.js.map

