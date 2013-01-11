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
     */
    AppContext.prototype.getProto = function() {
        
        var self = this;

        var promise = new Promise();

        //no point in continuing if no loader is present
        if(!this._loader) {
            throw new Error("No AMD loader is defined");
        }

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
            try {
                deps = deps.concat(this._getDependencies(ids[i]));
            } catch(e) {
                warn(e.message);
                promise.notifyFailure(e);
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
            for(i = 0; i < ids.length; i++) {
                try {
                    proto = self.protoFactory.getProto(ids[i]);
                    protos.push(proto);
                } catch(e) {
                    warn(e.message);
                    promise.notifyFailure(e);
                }
            }

            if(callback) {
                callback.apply(self, protos);
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
        var protoData = this.protoFactory.getProtoConfig(id);

        deps.push(protoData.module);

        // inheritance
        if(protoData.extendsRef) {
            var extendsRef = Util.parseProtoReference(protoData.extendsRef).protoId;
            deps = this._getDependencies(extendsRef, deps);
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

    /**
     * Logs a warning message
     * @param message
     */
    var warn = function(message) {
        if(typeof console !== "undefined" && console.warn) {
            console.warn(message);
        }
    };

    //export AppContext
    return AppContext;
});