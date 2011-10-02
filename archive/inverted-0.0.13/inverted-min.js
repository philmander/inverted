/*
 Inverted IOC container v0.0.13

 https://github.com/philmander/inverted-js

 Copyright (c) 2010, Phil Mander
 Licensed under the MIT license
*/
(function(h){var j={},h=h||this,n;(n||h).inverted=j;(function(g,f){var b=f.util=f.util||{};b.isArray=function(b){return Array.isArray||Object.prototype.toString.call(b)==="[object Array]"};b.inArray=function(b,d){if(d.indexOf)return d.indexOf(b);for(var c=0,a=d.length;c<a;c++)if(d[c]===b)return c;return-1};b.parseProtoString=function(b,d){for(var c=d,a=b.split("."),f=0,g;g=a[f];f++)if(typeof c[g]==="undefined")return null;else c=c[g];return c}})(h,j);(function(g,f){var b=f.util=f.util||{};b.WebRequire=
function(b){this.timeout=b||1E4;this.cache={}};b.WebRequire.prototype.clearCache=function(){this.cache={}};b.WebRequire.prototype.load=function(b,d,c,a){function i(a){h.push(a);h.length==j&&(g.clearTimeout(k.requireTimeout),typeof d==="function"&&d.apply(c,[!0,[],""]))}var k=this,c=c||g,a=a||"UTF-8";typeof b==="string"&&(b=[b]);if(b.length==0)typeof d==="function"&&d.apply(c,[!0,[],""]);else{for(var h=[],j=b.length,l=document.getElementsByTagName("head")[0]||document.documentElement,m=0;m<j;m++)(function(b){if(k.cache[b])i(b);
else{var c=g.document.createElement("script");c.type="text/javascript";c.src=b;c.charset=a;var d=!1;c.onload=c.onreadystatechange=function(){if(!d&&(!this.readyState||this.readyState==="loaded"||this.readyState==="complete"))d=!0,i(b),k.cache[b]=!0,c.onload=c.onreadystatechange=null,l&&c.parentNode&&l.removeChild(c)};l.insertBefore(c,l.firstChild)}})(b[m]);this.requireTimeout=g.setTimeout(function(){for(var a=[],i=0;i<b.length;i++)f.util.inArray(b[i],h)===-1&&a.push(b[i]);typeof d==="function"&&(i=
a.join(", ")+" failed to load within "+k.timeout+" milis",d.apply(c,[!1,a,i]))},this.timeout)}}})(h,j);(function(g,f){var b=f.util=f.util||{};b.CommonRequire=function(){};b.CommonRequire.prototype.load=function(b,d,c){var a,f;a=0;for(f=b.length;a<f;a++)g.require(b[a]);d.apply(c,[!0,[],""])}})(h,j);(function(g){(g.resolvers=g.resolvers||{}).defaultSrcResolver=function(f,b){var e=f.replace(/\./g,"/"),b=b.replace(/\/$/,"");return b+"/"+e+".js"}})(j);(function(g,f){f.ProtoFactory=function(b){b.ctx=b.ctx||
g;this.config=b};f.ProtoFactory.prototype.getProto=function(b){var b=this.getProtoConfig(b),e=null;if(b.scope=="static")typeof b.proto==="string"&&(e=this.parseProtoString(b.proto));else if(!b.scope||b.scope!="singleton"||b.scope=="singleton"&&!b.instance){if(e=this._createInstance(b.proto,b.args,b.props,b.extendsRef),b.scope&&b.scope=="singleton")b.instance=e}else e=b.instance;return e};f.ProtoFactory.prototype._createInstance=function(b,e,d,c){var a=null;typeof b==="string"&&(b=this.parseProtoString(b));
a=this._createArgs(e);c&&this._extendProto(b,this.getProto(c));switch(a.length){case 0:a=new b;break;case 1:a=new b(a[0]);break;case 2:a=new b(a[0],a[1]);break;case 3:a=new b(a[0],a[1],a[2]);break;case 4:a=new b(a[0],a[1],a[2],a[3]);break;case 5:a=new b(a[0],a[1],a[2],a[3],a[4]);break;case 6:a=new b(a[0],a[1],a[2],a[3],a[4],a[5]);break;case 7:a=new b(a[0],a[1],a[2],a[3],a[4],a[5],a[6]);break;case 8:a=new b(a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7]);break;case 9:a=new b(a[0],a[1],a[2],a[3],a[4],a[5],
a[6],a[7],a[8]);break;case 10:a=new b(a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7],a[8],a[9]);break;default:throw Error("Instances have 10 arg limit");}if(d)for(var f in d)d.hasOwnProperty(f)&&(b=this._createArgs([d[f]]),typeof a[f]=="function"?a[f].apply(a,b[0]):a[f]=b[0]);return a};f.ProtoFactory.prototype._getProtoFromFactory=function(b,e){var d=this.getProto(b);if(e)return d[e].apply(d);else throw Error("No factory method defined with "+b);};f.ProtoFactory.prototype._createArgs=function(b){var e=[];
if(b)for(var d=0;d<b.length;d++){var c=b[d];if(c===null||typeof c==="undefined")e[d]=c;else{var a=typeof c=="object";if(a&&c.ref||typeof c==="string"&&c.match(/^\*[^\*]/)!==null)e[d]=this.getProto(c.ref||c.substr(1));else if(a&&c.factoryRef)e[d]=this._getProtoFromFactory(c.factoryRef,c.factoryMethod);else if(a&&c.proto)e[d]=this._createInstance(c.proto,c.args,c.props);else if(a)for(var f in e[d]={},c)c.hasOwnProperty(f)&&(a=c[f],e[d][f]=a&&(a.ref||typeof a==="string"&&a.match(/^\*[^\*]/)!==null)?
this.getProto(a.ref||a.substr(1)):a&&a.factoryRef?this._getProtoFromFactory(a.factoryRef,a.factoryMethod):a&&a.proto?this._createInstance(a.proto,a.args,a.props):a);else e[d]=c}}return e};f.ProtoFactory.prototype._extendProto=function(b,e){var d={},c;for(c in b.prototype)d[c]=b.prototype[c];b.prototype=e;b.prototype._super=e.constructor;for(var a in d)b.prototype[a]=d[a];b.prototype.constructor=b};f.ProtoFactory.prototype.parseProtoString=function(b){return f.util.parseProtoString(b,this.config.ctx)};
f.ProtoFactory.prototype.getProtoConfig=function(b){var e=this.config;if(this.config.hasOwnProperty(b))return e[b];else throw Error("No proto is defined for "+b);}})(h,j);(function(g,f){f.AppContext=function(b,e,d,c,a){if(!(this instanceof f.AppContext))return b.ctx=d,c=new f.ProtoFactory(b.protos),a=typeof window==="undefined"?new f.util.CommonRequire:new f.util.WebRequire(5E3),new f.AppContext(b,e,null,c,a);this.config=b;this.profile=e||"local";this.protoFactory=c;this.loader=a;this.srcResolver=
typeof b.srcResolver=="function"?b.srcResolver:typeof b.srcResolver=="object"?b.srcResolver[this.profile]:f.resolvers.defaultSrcResolver;b.srcBase=b.srcBase||"";this.srcBase=typeof b.srcBase=="object"?b.srcBase[this.profile]:b.srcBase};f.AppContext.prototype.getProto=function(){var b=Array.prototype.slice.call(arguments,0),e;b.length>1&&typeof b[b.length-1]=="function"&&(e=b.pop());for(var d=[],c=0;c<b.length;c++)d=d.concat(this._getDependencies(b[c]));for(var c=[],a=0;a<d.length;a++)if(!this.protoFactory.parseProtoString(d[a])){var i=
this.srcResolver(d[a],this.srcBase);f.util.inArray(i,c)==-1&&c.push(i)}this.loader.load(c,function(a,c,d){if(a){a=[];for(c=0;c<b.length;c++)d=this.protoFactory.getProto(b[c]),d._appContext=this,a.push(d);e&&e.apply(g,a)}else throw Error(d);},this)};f.AppContext.prototype._getDependencies=function(b,e){var e=e||[],d=this.protoFactory.getProtoConfig(b);e.push(d.proto);d.extendsRef&&(e=this._getDependencies(d.extendsRef,e));d.args&&(e=this._getDependenciesFromArgs(d.args,e));if(d.props)for(var c in d.props)d.props.hasOwnProperty(c)&&
(e=this._getDependenciesFromArgs([d.props[c]],e));return e};f.AppContext.prototype._getDependenciesFromArgs=function(b,e){if(b)for(var d=0;d<b.length;d++){var c=b[d];if(!(c===null||typeof c==="undefined")){var a=typeof c=="object";if(a&&c.ref||typeof c==="string"&&c.match(/^\*[^\*]/)!==null)e=this._getDependencies(c.ref||c.substr(1),e);else if(a&&c.factoryRef)e=this._getDependencies(c.factoryRef,e);else if(a&&c.proto)e.push(c.proto);else if(a)for(var f in c)c.hasOwnProperty(f)&&((a=c[f])&&(a.ref||
typeof a==="string"&&a.match(/^\*[^\*]/)!==null)?e=this._getDependencies(a.ref||a.substr(1),e):a&&a.factoryRef?e=this._getDependencies(a.factoryRef,e):a&&a.proto&&e.push(a.proto))}}return e}})(h,j)})(this);