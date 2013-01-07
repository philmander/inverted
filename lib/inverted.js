/**
 * @license Inverted IOC container v0.1.1
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
 * The proto factory is responsible for creating instances of defined objects using the config tree
 */
define("inverted/ProtoFactory", function() {

    "use strict";

    /**
     * Create a new ProtoFactory with config
     * 
     * @constructor
     * @param {Object} config
     */
    var ProtoFactory = function(config) {

        this.config = config;

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
     * 
     * @param {String} id
     * @return {Object} A reference to a javascript object
     */
    ProtoFactory.prototype.getProto = function(id) {

        var protoData = this.getProtoConfig(id);

        var instance = null;

        // for static just get a reference
        if(protoData.scope === "static") {

            if(typeof protoData.module === "string") {
                instance = this.dependencyMap[protoData.module];
            }
        // create an instance if not singleton or singleton and no instance
        // defined yet (lazy loaded singletons)
        } else if((!protoData.scope || protoData.scope !== "singleton") ||
                (protoData.scope === "singleton" && !protoData.instance)) {

            instance = this._createInstance(protoData.module, protoData.args, protoData.props, protoData.extendsRef);

            // save instance if singleton
            if(protoData.scope && protoData.scope === "singleton") {
                protoData.instance = instance;
            }
        }
        // its a singleton and instance has already been created
        else {
            instance = protoData.instance;
        }

        return instance;
    };

    /**
     * Uses factory config to create a new instance
     *
     * @param proto {String|Object} this might be a string or an proto
     * @param argData
     * @param propData
     * @param extendsRef
     * @return
     */
    ProtoFactory.prototype._createInstance = function(proto, argData, propData, extendsRef) {

        var instance = null;

        //if the proto is a
        if(typeof proto === "string") {
            proto = this.dependencyMap[proto];
        }

        // constructor injection
        var args = this._createArgs(argData);

        // inheritance
        if(extendsRef) {
            this._extendProto(proto, this.getProto(extendsRef));
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
            throw new Error("Instances have 10 arg limit");
        }

        // property injection
        if(propData) {
            for( var propName in propData) {
                if(propData.hasOwnProperty(propName)) {
                    var propertyArgs = this._createArgs([ propData[propName] ]);

                    if(typeof instance[propName] === "function") {
                        instance[propName].call(instance, propertyArgs[0]);
                    } else {
                        instance[propName] = propertyArgs[0];
                    }
                }
            }
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
            throw new Error("No factory method defined with " + factoryRef);
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
            for( var i = 0; i < confArgs.length; i++) {
                var argData = confArgs[i];

                // easier to deal with nulls here)
                if(argData === null || typeof argData === "undefined") {
                    args[i] = argData;
                    continue;
                }

                var isObject = typeof argData === "object";

                if((isObject && argData.ref) || (typeof argData === "string" && argData.match(/^\*[^\*]/) !== null)) {
                    // if arg has references another proto
                    args[i] = this.getProto(argData.ref || argData.substr(1));
                } else if(isObject && argData.factoryRef) {
                    // if arg uses a factory
                    args[i] = this._getProtoFromFactory(argData.factoryRef, argData.factoryMethod);
                } else if(isObject && argData.module) {
                    // if arg uses an anonymous proto
                    args[i] = this._createInstance(argData.module, argData.args, argData.props, null);
                } else if(isObject) {
                    args[i] = {};
                    // if arg is object containing values
                    for( var key in argData) {
                        if(argData.hasOwnProperty(key)) {
                            var obj = argData[key];

                            if(obj && (obj.ref || (typeof obj === "string" && obj.match(/^\*[^\*]/) !== false))) {
                                // if object value is a reference
                                args[i][key] = this.getProto(obj.ref || obj.substr(1));
                            } else if(obj && obj.factoryRef) {
                                // if object value uses a factory
                                args[i][key] = this._getProtoFromFactory(obj.factoryRef, obj.factoryMethod);
                            } else if(obj && obj.module) {
                                // if object value is an anonymous proto
                                args[i][key] = this._createInstance(obj.module, obj.args, obj.props, null);
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
     * Searches the config for a proto matching the specified id
     * 
     * @param {String} id
     * @return {Object}
     */
    ProtoFactory.prototype.getProtoConfig = function(id) {

        var config = this.config;

        if(this.config.hasOwnProperty(id)) {
            return config[id];
        } else {
            throw new Error("No proto is defined for " + id);
        }
    };
    
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
define("inverted/AppContext", [ "inverted/ProtoFactory"], function(ProtoFactory) {

    "use strict";

    /**
     * Create a new AppContext with config
     *
     * @constructor
     * @param {Object} config
     * @param {ProtoFactory} protoFactory
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

        var protoFactory = new ProtoFactory(config.protos);
        return new AppContext(config, protoFactory, originalModule);
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
     */
    AppContext.prototype.getProto = function() {
        
        var self = this;

        // turn arguments list in to array of proto ids
        var ids = Array.prototype.slice.call(arguments, 0);

        // last arg should be the callback
        var callback;
        if(ids.length > 1 && typeof ids[ids.length - 1] === "function") {
            callback = ids.pop();
        }

        // walk config to get array of deps so they can be loaded if required
        var deps = [];
        for( var i = 0; i < ids.length; i++) {
            deps = deps.concat(this._getDependencies(ids[i]));
        }

        if(!this._loader) {
            throw new Error("No AMD _loader is defined");
        }

        // load all dependencies before attempting to create an instance        
        this._loader(deps, function() {
                        
            //map deps to args
            var depMap = {};
            for(i = 0; i < deps.length; i++) {
                depMap[deps[i]] = arguments[i];
            }
            self.protoFactory.addDependencies(depMap);
        
            var protos = [];
            for(i = 0; i < ids.length; i++) {
                var proto = self.protoFactory.getProto(ids[i]);
                protos.push(proto);
            }

            if(callback) {
                callback.apply(self, protos);
            }
        });
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
        var protoData = this.protoFactory.getProtoConfig(id);

        deps.push(protoData.module);

        // inheritance
        if(protoData.extendsRef) {
            deps = this._getDependencies(protoData.extendsRef, deps);
        }

        if(protoData.args) {
            deps = this._getDependenciesFromArgs(protoData.args, deps);
        }

        if(protoData.props) {
            for( var propName in protoData.props) {
                if(protoData.props.hasOwnProperty(propName)) {
                    deps = this._getDependenciesFromArgs([ protoData.props[propName] ], deps);
                }
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
            for( var i = 0; i < confArgs.length; i++) {
                var argData = confArgs[i];

                // easier to deal with nulls here)
                if(argData === null || typeof argData === "undefined") {
                    continue;
                }

                var isObject = typeof argData === "object";
                // if arg has ref
                if((isObject && argData.ref) || (typeof argData === "string" && argData.match(/^\*[^\*]/) !== null)) {
                    deps = this._getDependencies(argData.ref || argData.substr(1), deps);
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
                            if(obj && (obj.ref || (typeof obj === "string" && obj.match(/^\*[^\*]/) !== null))) {
                                deps = this._getDependencies(obj.ref || obj.substr(1), deps);
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
