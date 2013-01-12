/**
 * @license Inverted IOC container v99
 *
 * https://github.com/philmander/inverted-js
 *
 * Copyright (c) 2013, Phil Mander
 * Licensed under the MIT license
 */
if (typeof define !== 'function') {
    define = require('amdefine')(module)
}
/**
 * Misc functions shared throughout the Inverted codebase
 */
define("inverted/Util", function() {

    "use strict";

    var Util = {};

    /**
     * Strict check to see if an object is an array.
     */
    Util.isArray = function(obj) {

        if(Array.isArray) {
            return Array.isArray(obj);
        }
        return Object.prototype.toString.call(obj) === "[object Array]";
    };

    /**
     * Taken directly from jquery
     */
    Util.inArray = function(elem, array) {

        if(array.indexOf) {
            return array.indexOf(elem);
        }

        for( var i = 0, length = array.length; i < length; i++) {
            if(array[i] === elem) {
                return i;
            }
        }

        return -1;
    };

    /**
     * Trim function just in case using older IE
     * @param {String} str
     * @return {String|null} a trimmed string
     */
    Util.trim = function(str) {

        if(str) {
            return str.replace(/^\s+|\s+$/g, "");
        }
        return str;
    };

    /**
     * Parses a reference string and returns the protod id and interface id if present
     * @param {String} ref
     * @return {{protoId: String, interfaces: Array}}
     */
    Util.parseProtoReference = function(ref) {
        var parsedRef = ref.match(/^(.+?)(\[(.+?)\])?$/);
        return  {
            protoId: Util.trim(parsedRef[1]),
            interfaces: parsedRef[3] ? Util.splitCommaDelimited(parsedRef[3]) : null
        };
    };

    /**
     * Returns true if the passed string is deemed to be a proto reference. That is, it starts with a *, has length
     * longer that 1 and the second char is not a *
     * @param {String} str
     * @return {boolean}
     */
    Util.matchProtoRefString = function(str) {

        return (typeof str === "string" && str.match(/^\*[^\*]/) !== null);
    };

    /**
     * Splits a comma delimited string
     * @return {Array}
     */
    Util.splitCommaDelimited = function(str) {

        if(str) {
            return str.split(/\s*,\s*/);
        }
        return [];
    };

    /**
     * Logs a warning message
     * @param e
     */
    Util.warn = function(e) {
        if(typeof console !== "undefined" && console.warn) {
            if(e instanceof Error) {
                console.warn(e.message);
            } else {
                console.warn(e);
            }
        }
    };

    Util.createError = function(message) {
        return new Util.InvertedError(message);
    };

    /**
     * Custom error type for specific Inverted errors
     * @param message
     * @constructor
     */
    Util.InvertedError = function(message) {
        this.message = message;
    };
    Util.InvertedError.prototype = Error.prototype;

    Util.InvertedError.prototype.print = function() {
        Util.warn(this.message);
    };

    return Util;
});
/**
 * Very lightweight Promise implementation specifically for use with AppContext.getProto.
 */
define("inverted/Promise", function() {

    "use strict";

    var Promise = function(ctx) {
        this._ctx = ctx;
        this._sucesses = [];
        this._failures = [];
    };

    Promise.prototype.then = function(success, fail) {

        if(typeof success === "function") {
            this._sucesses.push(success);
        }
        if(typeof fail === "function") {
            this._failures.push(fail);
        }
    };

    Promise.prototype.notifySuccess = function(protos) {
        for(var i = 0; i < this._sucesses.length; i++) {
            this._sucesses[i].apply(this._ctx, protos);
        }
    };

    Promise.prototype.notifyFailure = function(e) {
        for(var i = 0; i < this._failures.length; i++) {
            this._failures[i].call(this._ctx, e);
        }
    };

    return Promise;
});
/**
 * The proto factory is responsible for creating instances of defined objects using the config tree
 */
define("inverted/ProtoFactory", [ "inverted/Util" ], function(Util) {

    "use strict";

    /**
     * Create a new ProtoFactory with config
     * 
     * @constructor
     * @param {Object} config
     */
    var ProtoFactory = function(config) {

        this.config = config;
        this.appContext = null;

        this.injectAppContext = this.config.injectAppContext === true ? true : false;

        //cache of loaded dependencies
        this.dependencyMap = {};
    };


    /**
     * Adds dependency id to object/function mappings to the internal dependency map
     * @param {Object} depMap   adds a map of dependencies to the existing dependency map cache
     */
    ProtoFactory.prototype.addDependencies = function(depMap) {
        
        for(var depId in depMap) {
            if(depMap.hasOwnProperty(depId)) {
                this.dependencyMap[depId] = depMap[depId];                
            }
        }
    };

    /**
     * Gets a proto given an id
     * The parsing also looks for an optional interface id using square brackets notation. E.g. protoId[interfaceId]
     * 
     * @param {String} protoRef a proto reference string
     * @return {Object} A reference to a javascript object
     */
    ProtoFactory.prototype.getProto = function(protoRef) {

        var protoData = Util.parseProtoReference(protoRef);
        var protoConf = this.getProtoConfig(protoData.protoId);

        var instance = null;

        // for static just get a reference
        if(protoConf.scope === "static") {

            if(typeof protoConf.module === "string") {
                instance = this.dependencyMap[protoConf.module];
            }
        // create an instance if not singleton or singleton and no instance
        // defined yet (lazy loaded singletons)
        } else if((!protoConf.scope || protoConf.scope !== "singleton") ||
                (protoConf.scope === "singleton" && !protoConf.instance)) {

            var injectAppContext =
                this.injectAppContext === true && protoConf.injectAppContext !== false ||
                this.injectAppContext !== true && protoConf.injectAppContext === true;

            instance = this._createInstance(protoConf.module, protoConf.args, protoConf.props, protoConf.extendsRef,
                                            protoConf.mixin, injectAppContext, protoData.interfaces);

            // save instance if singleton
            if(protoConf.scope && protoConf.scope === "singleton") {
                protoConf.instance = instance;
            }
        }
        // its a singleton and instance has already been created
        else {
            instance = protoConf.instance;
        }

        return instance;
    };

    /**
     * Uses factory config to create a new instance
     *
     * @param {String} protoId {String|Object} this might be a string or an proto
     * @param {Array} argData
     * @param {Object} propData
     * @param {String} extendsRef
     * @param {Object} mixin
     * @param {Boolean} injectAppContext
     * @param {Array} interfaces
     * @return {Object}
     */
    ProtoFactory.prototype._createInstance = function(protoId, argData, propData, extendsRef, mixin, injectAppContext, interfaces) {

        var instance = null;
        var proto = this.dependencyMap[protoId];

        // constructor injection
        var args = this._createArgs(argData);

        // inheritance
        if(extendsRef) {
            this._extendProto(proto, this.getProto(extendsRef));
        }

        //check implementation
        //if an interface id specified, check the implementation
        if(interfaces) {
            this._checkImplements(protoId, proto.prototype, interfaces);
        }

        // ugly but works. would like a better way
        switch(args.length) {
        case 0:
            instance = new proto();
            break;
        case 1:
            instance = new proto(args[0]);
            break;
        case 2:
            instance = new proto(args[0], args[1]);
            break;
        case 3:
            instance = new proto(args[0], args[1], args[2]);
            break;
        case 4:
            instance = new proto(args[0], args[1], args[2], args[3]);
            break;
        case 5:
            instance = new proto(args[0], args[1], args[2], args[3], args[4]);
            break;
        case 6:
            instance = new proto(args[0], args[1], args[2], args[3], args[4], args[5]);
            break;
        case 7:
            instance = new proto(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
            break;
        case 8:
            instance = new proto(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
            break;
        case 9:
            instance = new proto(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
            break;
        case 10:
            instance = new proto(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8],
                    args[9]);
            break;
        default:
            throw Util.createError("Could not instantiate proto. Instances have a 10 arg limit");
        }

        // property injection
        if(propData) {
            for( var propName in propData) {
                if(propData.hasOwnProperty(propName)) {
                    var propertyArgs = this._createArgs([ propData[propName] ]);

                    if(typeof instance[propName] === "function") {
                        propertyArgs[0] = Util.isArray(propertyArgs[0]) ? propertyArgs[0] : [ propertyArgs[0] ];
                        //TODO: what if we actually want to inject an array as the first argument?
                        instance[propName].apply(instance, propertyArgs[0]);
                    } else {
                        instance[propName] = propertyArgs[0];
                    }
                }
            }
        }

        // mixins {
        if(mixin && mixin.length) {
            var i, len = mixin.length, currentMixin, mixinRef, override;
            for(i = 0; i < len; i++) {
                currentMixin = mixin[i];
                mixinRef = typeof currentMixin === "string" ? currentMixin : currentMixin.ref;
                override = typeof currentMixin.override === "boolean" ? currentMixin.override : true;
                this._mixin(instance, this.getProto(mixinRef), mixinRef, override);
            }
        }

        //create a reference to the app context
        if(this.appContext && injectAppContext) {
            instance.__appContext__ = this.appContext;
        }

        return instance;
    };

    /**
     * Uses factory config to create a new instance
     * 
     * @param factoryRef
     * @param factoryMethod
     * @return
     */
    ProtoFactory.prototype._getProtoFromFactory = function(factoryRef, factoryMethod) {

        var factory = this.getProto(factoryRef);

        if(factoryMethod) {
            return factory[factoryMethod].apply(factory);
        } else {
            throw Util.createError("No factory method defined with " + factoryRef);
        }
    };

    /**
     * Scans arg config for values, generating dependencies where required
     * 
     * @param {Array} confArgs
     * @return {Array}
     */
    ProtoFactory.prototype._createArgs = function(confArgs) {

        // figure out constructors
        var args = [];
        if(confArgs) {
            var ref;
            for( var i = 0; i < confArgs.length; i++) {
                var argData = confArgs[i];

                // easier to deal with nulls here)
                if(argData === null || typeof argData === "undefined") {
                    args[i] = argData;
                    continue;
                }

                var isObject = typeof argData === "object";

                if((isObject && argData.ref) || Util.matchProtoRefString(argData)) {
                    // if arg has references another proto
                    ref = argData.ref || argData.substr(1);
                    args[i] = this.getProto(ref);
                } else if(isObject && argData.factoryRef) {
                    // if arg uses a factory
                    args[i] = this._getProtoFromFactory(argData.factoryRef, argData.factoryMethod);
                } else if(isObject && argData.module) {
                    // if arg uses an anonymous proto
                    args[i] = this._createInstance(argData.module, argData.args, argData.props, argData.extendsRef, argData.mixin,  argData.injectAppContext, argData.interfaces);
                } else if(isObject) {
                    args[i] = {};
                    // if arg is object containing values
                    for( var key in argData) {
                        if(argData.hasOwnProperty(key)) {
                            var obj = argData[key];

                            if(obj && (obj.ref || Util.matchProtoRefString(obj))) {
                                // if object value is a reference
                                ref = obj.ref || obj.substr(1);
                                args[i][key] = this.getProto(ref);
                            } else if(obj && obj.factoryRef) {
                                // if object value uses a factory
                                args[i][key] = this._getProtoFromFactory(obj.factoryRef, obj.factoryMethod);
                            } else if(obj && obj.module) {
                                // if object value is an anonymous proto
                                args[i][key] = this._createInstance(obj.module, obj.args, obj.props, obj.extendsRef, obj.mixin, argData.injectAppContext, argData.interfaces);
                            } else {
                                //if object value is a literal value
                                args[i][key] = obj;
                            }
                        }
                    }
                } else {
                    // just a value
                    args[i] = argData;
                }
            }
        }
        return args;
    };

    /**
     * Extends one proto with another
     * @param {Object} proto The proto to extend
     * @param {Object} superProto The base proto
     * @return {Object}
     */
    ProtoFactory.prototype._extendProto = function(proto, superProto) {

        // backup methods/props
        var methods = {};
        for( var method in proto.prototype) {
            methods[method] = proto.prototype[method];
        }

        // extend prototype
        proto.prototype = superProto;
        proto.prototype._super = superProto.constructor;

        // put methods back
        for( var methodBackup in methods) {
            proto.prototype[methodBackup] = methods[methodBackup];
        }

        // fix the contructor
        proto.prototype.constructor = proto;
    };

    /**
     * Inverted mixin function. Injects the object mixWith as a property of toMix, using the convention: __protoID__
     * Methods which mirror mixWith and delegate to the injected object are then added to toMix
     * @param mixedProto
     * @param protoToMix
     * @param toMixId
     * @param override
     * @private
     */
    ProtoFactory.prototype._mixin = function(mixedProto, protoToMix, toMixId, override) {

        for(var fn in protoToMix) {
            if(typeof protoToMix[fn] === "function" && (!(fn in mixedProto) || (fn in mixedProto && override))) {
                (function(fn) {
                    mixedProto[fn] = function() {
                        return protoToMix[fn].apply(protoToMix, arguments);
                    };
                })(fn);
            }
        }
        mixedProto["__" + toMixId + "__"] = protoToMix;
    };

    /**
     * Throws am error if a proto instance does not implement any of the methods defined in an interface
     * @param {String} protoId
     * @param {Object} obj
     * @param {Array} interfaces
     */
    ProtoFactory.prototype._checkImplements = function(protoId, obj, interfaces) {

        var i, j, currentInterface, method, errors;
        for(i = 0; i < interfaces.length; i++) {
            currentInterface = this.getInterfaceConfig(interfaces[i]);
            errors = [];
            for(j = 0; j < currentInterface.length; j++) {
                method = Util.trim(currentInterface[j]);
                if(typeof obj[method] !== "function") {
                    errors.push(protoId + " does not implement the method '" + method + "'");
                }
            }

            if(errors.length) {
                throw Util.createError("Interface [ " + interfaces[i] + "] not implemented: \n\t" + errors.join("\n\t"));

            }
        }
    };

    /**
     * Searches the config for a proto matching the specified id
     * 
     * @param {String} id
     * @return {Object}
     */
    ProtoFactory.prototype.getProtoConfig = function(id) {

        var protos = this.config.protos;
        id = Util.trim(id);
        if(protos && protos.hasOwnProperty(id)) {
            return protos[id];
        } else {
            throw Util.createError("No proto is defined for [" + id + "]");
        }
    };

    ProtoFactory.prototype.getInterfaceConfig = function(id) {

        var interfaces = this.config.interfaces;
        id = Util.trim(id);
        if(interfaces && interfaces.hasOwnProperty(id)) {
            return interfaces[id];
        } else {
            throw Util.createError("No interface is defined for [" + id + "]");
        }
    };

    //expose constructor
    return ProtoFactory;

});
/**
 * Loads dependencies using an AMD module loader before wiring them up using the ProtoFactory
 * Use without calling new to create using the default ProtoFactory:
 *
 * var appContext = inverted.AppContext(confg);
 *
 * AppContext.getProto is the entry point for getting protos
 *
 * appContext.getProto("one", "two", "three", function(one, two, three) {
 *    //do stuff
 * }
 */
define("inverted/AppContext", [ "inverted/ProtoFactory", "inverted/Promise", "inverted/Util"],
    function(ProtoFactory, Promise, Util) {

    "use strict";

    /**
     * Create a new AppContext with config
     *
     * @constructor
     * @param {Object} config
     * @param {Object} protoFactory
     * @param {Object} originalModule The origina node module use to load node modules on the right path
     */
    var AppContext = function(config, protoFactory, originalModule) {

        this.config = config;
        this.protoFactory = protoFactory;
        this.originalModule = originalModule || module;

        if(define.amd && typeof requirejs !== "undefined") {
           this._loader = require;
        } else if(define.amd && typeof curl !== "undefined") {
            this._loader = curl;
        } else {
            this._loader = this._commonRequire;
        }
    };

    /**
     * Constructs a new app cotnext
     * @param config
     * @param originalModule
     * @return {AppContext}
     */
    AppContext.create = function(config, originalModule) {

        var protoFactory = new ProtoFactory(config);
        var appContext = new AppContext(config, protoFactory, originalModule);
        protoFactory.appContext = appContext;
        return appContext;
    };

    /**
     * Sets the module loader function to load modules
     * @param {Function} loaderFn
     */
    AppContext.loader = function(loaderFn) {

        this._loader = loaderFn;
    };

    /**
     * Gets a proto using the proto id to create it using the application config
     * Takes a variable list of proto ids as arguments, the final argument must be a callback function
     * @param {Array} protoIds
     * @param {Function} onSuccess
     * @param {Function} onError
     */
    AppContext.prototype.getProto = function(protoIds, onSuccess, onError) {
        
        var self = this;

        var promise = new Promise();

        //no point in continuing if no loader is present
        if(!this._loader) {
            throw new Error("No AMD loader is defined");
        }

        //TODO: remove this eventually
        if(typeof onSuccess === "string") {
            var m = "Inverted's interface has changed. Please now pass proto ID's as an array in a single argument\n" +
                    "\tgetProto([\"one\", \"two\",\"three\"], onSuccess, onError);";
            throw Util.createError(m);
        }

        //convert single proto id to array
        if(typeof protoIds === "string") {
            protoIds = [ protoIds ];
        }

        var invertedErrors = [];
        // walk config to get array of deps so they can be loaded if required
        var deps = [];
        for( var i = 0; i < protoIds.length; i++) {
            try {
                deps = deps.concat(this._getDependencies(protoIds[i]));
            } catch(e) {
                invertedErrors.push(e);
            }
        }

        // load all dependencies before attempting to create an instance        
        this._loader(deps, function() {
                        
            //map deps to args
            var depMap = {};
            for(i = 0; i < deps.length; i++) {
                depMap[deps[i]] = arguments[i];
            }
            self.protoFactory.addDependencies(depMap);

            var protos = [], proto;
            for(i = 0; i < protoIds.length; i++) {
                try {
                    proto = self.protoFactory.getProto(protoIds[i]);
                    protos.push(proto);
                } catch(e) {
                    invertedErrors.push(e);
                }
            }

            //notify errors
            for(i = 0; i < invertedErrors.length; i++) {
                var e = invertedErrors[i];
                if(e instanceof Util.InvertedError) {
                    //execute inverted errors in the callback
                    if(typeof onError === "function") {
                        onError.call(self, e);
                    }
                    promise.notifyFailure(e);
                    e.print();
                } else {
                    //throw all others
                    throw e;
                }
            }

            //notify success
            if(typeof onSuccess === "function") {
                onSuccess.apply(self, protos);
            }
            promise.notifySuccess(protos);
        });

        return promise;
    };

    /**
     * Creates an array of dependencies by walking the dependency tree
     * 
     * @param {String} id
     * @param {Array} deps The function recursivley creates an array of dependencies
     * @return {Array} An array of module names which are dependencies
     */
    AppContext.prototype._getDependencies = function(id, deps) {

        deps = deps || [];
        var protoConfig = this.protoFactory.getProtoConfig(id);

        deps.push(protoConfig.module);

        // inheritance
        if(protoConfig.extendsRef) {
            var extendsRef = Util.parseProtoReference(protoConfig.extendsRef).protoId;
            deps = this._getDependencies(extendsRef, deps);
        }

        //args
        if(protoConfig.args) {
            deps = this._getDependenciesFromArgs(protoConfig.args, deps);
        }

        //props
        if(protoConfig.props) {
            for( var propName in protoConfig.props) {
                if(protoConfig.props.hasOwnProperty(propName)) {
                    deps = this._getDependenciesFromArgs([ protoConfig.props[propName] ], deps);
                }
            }
        }

        //mixins
        if(protoConfig.mixin && protoConfig.mixin.length) {
            var i, len = protoConfig.mixin.length, currentMixin, mixinRef;
            for(i = 0; i < len; i++) {
                currentMixin = protoConfig.mixin[i];
                mixinRef = typeof currentMixin === "string" ? currentMixin : currentMixin.ref;
                mixinRef = Util.parseProtoReference(mixinRef).protoId;
                deps = this._getDependencies(mixinRef, deps);
            }
        }

        return deps;
    };

    /**
     * Gets an array of dependencies from arguments config
     * 
     * @param {Array} confArgs An array of arguments
     * @param {Array} deps
     * @return {Array}
     */
    AppContext.prototype._getDependenciesFromArgs = function(confArgs, deps) {

        if(confArgs) {
            var ref;
            for( var i = 0; i < confArgs.length; i++) {
                var argData = confArgs[i];

                // easier to deal with nulls here)
                if(argData === null || typeof argData === "undefined") {
                    continue;
                }

                var isObject = typeof argData === "object";
                // if arg has ref
                if((isObject && argData.ref) || Util.matchProtoRefString(argData)) {
                    ref = Util.parseProtoReference(argData.ref || argData.substr(1)).protoId;
                    deps = this._getDependencies(ref, deps);
                }
                else if(isObject && argData.factoryRef) {
                    deps = this._getDependencies(argData.factoryRef, deps);
                }
                else if(isObject && argData.module) {
                    deps.push(argData.module);
                }
                else if(isObject) {
                    // if arg is object containing values
                    for( var key in argData) {
                        if(argData.hasOwnProperty(key)) {
                            var obj = argData[key];
                            if(obj && (obj.ref || Util.matchProtoRefString(obj))) {
                                ref = Util.parseProtoReference(obj.ref || obj.substr(1)).protoId;
                                deps = this._getDependencies(ref, deps);
                            }
                            else if(obj && obj.factoryRef) {
                                deps = this._getDependencies(obj.factoryRef, deps);
                            }
                            else if(obj && obj.module) {
                                deps.push(obj.module);
                            }
                        }
                    }
                }
            }
        }
        return deps;
    };

    /**
     * AMD style loader function for common js module loading
     * @param {Array} modules
     * @param {Function} callback
     */
    AppContext.prototype._commonRequire = function(modules, callback) {

        var self = this;
        var loaded = [];
        modules.forEach(function(module) {
            loaded.push(self.originalModule.require(module));
        });

        callback.apply(this, loaded);
    };

    //export AppContext
    return AppContext;
});
//amd definition
define(["inverted/AppContext"], function(appContext) {

    return appContext;
});
