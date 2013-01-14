/**
 * @license Inverted IOC container v0.2.2
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
     * return {Int} the position of the element in the array
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
                console.warn(e.message, e);
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
 * Tree structure to manage dependencies
 */
define("inverted/DependencyTree", ["inverted/Util"], function(Util) {

    "use strict";

    /**
     * Dependency Node/Tree
     * @constructor
     */
    var DependencyNode = function() {

        this.protos = [];
        this.children = [];
        this.parent = null;
    };

    /**
     * Adds a new child to this node
     * @return {DependencyNode}
     */
    DependencyNode.prototype.addChild = function() {

        var child = new DependencyNode();
        child.parent = this;
        this.children.push(child);
        return child;
    };

    /**
     * Returns the children of this node
     * @return {Array}
     */
    DependencyNode.prototype.getChildren = function() {

        return this.children;
    };

    /**
     * Returns this nodes parent
     * @return {DependencyNode}
     */
    DependencyNode.prototype.getParent = function() {

        return this.parent;
    };

    /**
     * Checks the tree to see if any parent nodes contain this proto id
     * @param id {String} The proto id to check against circular dependencies
     * @return {Object|null} The proto configuration data associated with any circular dependency origin node, otherwise
     * null
     */
    DependencyNode.prototype.checkForCircular = function(id) {

        //walks up the tree looking for circular dependencies
        var check = function(node, protoId) {

            if(node !== null) {
                for(var i = 0; i < node.protos.length; i++) {
                    if(node.protos[i].id && node.protos[i].id === protoId) {
                        return node.protos[i];
                    }
                }
                return check(node.parent, protoId);
            }
            return null;
        };

        return check(this.parent, id);
    };

    /**
     * Adds a proto to the current node
     * @param {String} id The proto id
     * @param {String} instance An optional instance of the proto
     * @param {Boolean} checkForCircular checkForCircular will check for circular dependencies before adding the proto
     */
    DependencyNode.prototype.addProto = function(id, instance, checkForCircular) {
        checkForCircular = checkForCircular || false;
        if(checkForCircular) {
            var circularOrigin = this.checkForCircular(id);
            if(circularOrigin) {
                var circularError = new Util.createError("Circular dependency detected for [" + id + "]");
                circularError.circular = true;
                throw circularError;
            }
        }
        this.protos.push({
            id: id,
            instance: instance || null
        });
    };

    //export
    return DependencyNode;
});
/**
 * The proto factory is responsible for creating instances of defined objects using the config tree
 */
define("inverted/ProtoFactory", [ "inverted/DependencyTree", "inverted/Util" ], function(DependencyTree, Util) {

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
        this.moduleMap = {};
    };


    /**
     * Adds dependency id to object/function mappings to the internal dependency map
     * @param {Object} map   adds a map of dependencies to the existing dependency map cache
     */
    ProtoFactory.prototype.addLoadedModules = function(map) {

        //joins the objects
        for(var depId in map) {
            if(map.hasOwnProperty(depId)) {
                this.moduleMap[depId] = map[depId];
            }
        }
    };

    /**
     * Gets a proto given an id
     * The parsing also looks for an optional interface id using square brackets notation. E.g. protoId[interfaceId]
     * 
     * @param {String} protoRef a proto reference string
     * @param {Object} depTree
     * @return {Object} A reference to a javascript object
     */
    ProtoFactory.prototype.getProto = function(protoRef, depTree) {

        depTree = depTree || new DependencyTree();

        var protoData = Util.parseProtoReference(protoRef);
        var protoConf = this.getProtoConfig(protoData.protoId);

        var instance = null;
        var nextNode = depTree.addChild();

        // for static just get a reference
        if(protoConf.scope === "static") {

            if(typeof protoConf.module === "string") {
                instance = this.moduleMap[protoConf.module];
            }
        // create an instance if not singleton or
        // singleton and no instance created yet (lazy loaded singletons)
        } else if((!protoConf.scope || protoConf.scope !== "singleton") ||
                (protoConf.scope === "singleton" && !protoConf.instance)) {

            var injectAppContext =
                this.injectAppContext === true && protoConf.injectAppContext !== false ||
                this.injectAppContext !== true && protoConf.injectAppContext === true;

            instance = this._createInstance(protoData.protoId, protoConf, protoData.interfaces, injectAppContext, nextNode);

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
     * @param {Object} protoConf
     * @param {Array} interfaces
     * @param {Boolean} injectAppContext
     * @param {Object} depTree
     * @return {Object}
     */
    ProtoFactory.prototype._createInstance = function(protoId, protoConf, interfaces, injectAppContext, depTree) {

        var instance = null;
        var proto = this.moduleMap[protoConf.module];

        //check for circular dependencies
        var circularConf = depTree.checkForCircular(protoId);
        if(circularConf) {
            //TODO: need to inject circular references
            depTree.addProto(protoId, circularConf.instance);
            return circularConf.instance;
        }

        // constructor injection
        var args = this._createArgs(protoConf.args, depTree);

        // inheritance
        if(protoConf.extendsRef) {
            this._extendProto(proto, this.getProto(protoConf.extendsRef, depTree));
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
            instance = new proto(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
            break;
        default:
            throw Util.createError("Could not instantiate proto. Instances have a 10 arg limit");
        }

        //add the dependency to the dependency tree.
        depTree.addProto(protoId, instance);


        // property injection
        if(protoConf.props) {
            var propData = protoConf.props;
            for( var propName in propData) {
                if(propData.hasOwnProperty(propName)) {
                    var propertyArgs = this._createArgs([ propData[propName] ], depTree);

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
        if(protoConf.mixin && protoConf.mixin.length) {
            var mixin = protoConf.mixin;
            var i, len = mixin.length, currentMixin, mixinRef, override;
            for(i = 0; i < len; i++) {
                currentMixin = mixin[i];
                mixinRef = typeof currentMixin === "string" ? currentMixin : currentMixin.ref;
                override = typeof currentMixin.override === "boolean" ? currentMixin.override : true;
                this._mixin(instance, this.getProto(mixinRef, depTree), mixinRef, override);
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
     * @param {String} factoryRef
     * @param {String} factoryMethod
     * @param {Object} depTree
     * @return {Object}
     */
    ProtoFactory.prototype._getProtoFromFactory = function(factoryRef, factoryMethod, depTree) {

        var factory = this.getProto(factoryRef, depTree);

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
     * @param {Object} depTree
     * @return {Array}
     */
    ProtoFactory.prototype._createArgs = function(confArgs, depTree) {

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

                var isObject = typeof argData === "object" && !Util.isArray(argData);

                if((isObject && argData.ref) || Util.matchProtoRefString(argData)) {
                    // if arg has references another proto
                    ref = argData.ref || argData.substr(1);
                    args[i] = this.getProto(ref, depTree);
                } else if(isObject && argData.factoryRef) {
                    // if arg uses a factory
                    args[i] = this._getProtoFromFactory(argData.factoryRef, argData.factoryMethod, depTree);
                } else if(isObject && argData.module) {
                    // if arg uses an anonymous proto
                    args[i] = this._createInstance("[anonymous]", argData, [], argData.injectAppContext, depTree);
                } else if(isObject) {
                    args[i] = {};
                    // if arg is object containing values
                    for( var key in argData) {
                        if(argData.hasOwnProperty(key)) {
                            var obj = argData[key];
                            if(obj && (obj.ref || Util.matchProtoRefString(obj))) {
                                // if object value is a reference
                                ref = obj.ref || obj.substr(1);
                                args[i][key] = this.getProto(ref, depTree);
                            } else if(obj && obj.factoryRef) {
                                // if object value uses a factory
                                args[i][key] = this._getProtoFromFactory(obj.factoryRef, obj.factoryMethod, depTree);
                            } else if(obj && obj.module) {
                                // if object value is an anonymous proto
                                args[i][key] =  this._createInstance("[anonymous]", obj, [], obj.injectAppContext, depTree);
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
     */
    ProtoFactory.prototype._extendProto = function(proto, superProto) {

        // backup methods/props
        var methods = {};
        for( var method in proto.prototype) {
            methods[method] = proto.prototype[method];
        }

        // extend prototype
        proto.prototype = superProto;
        proto.prototype.__super__ = superProto.constructor;

        // put methods back
        for( var methodBackup in methods) {
            proto.prototype[methodBackup] = methods[methodBackup];
        }

        // fix the constructor
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
define("inverted/AppContext", [
    "inverted/ProtoFactory",
    "inverted/DependencyTree",
    "inverted/Promise",
    "inverted/Util"
    ],
    function(ProtoFactory, DependencyTree, Promise, Util) {

    "use strict";

    /**
     * Create a new AppContext with config
     *
     * @constructor
     * @param {Object} config
     * @param {Object} protoFactory
     * @param {Object} originalModule The original node module use to load node modules on the right path
     */
    var AppContext = function(config, protoFactory, originalModule) {

        this.config = config;
        this.protoFactory = protoFactory;
        this.originalModule = originalModule || module;

        //defines if circular dependencies should throw an error or be gracefully handled
        this.allowCircular = this.config.allowCircular || false;
        this.modules = [];

        if(define.amd) {
            //pick an amd loader
            if(typeof requirejs !== "undefined") {
                this._loader = require;
            } else if(typeof curl !== "undefined") {
                this._loader = curl;
            }
        } else {
            //use common js for Node
            this._loader = this._commonRequire;
        }
    };

    /**
     * Constructs a new app context
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
        var i, deps = [];
        for(i = 0; i < protoIds.length; i++) {
            try {
                deps.push(this._getDependencies(protoIds[i]));
            } catch(e) {
                if(e instanceof Util.InvertedError && !e.circular) {
                    invertedErrors.push(e);
                } else {
                    throw e;
                }
            }
        }

        // load all dependencies before attempting to create an instance        
        this._loader(this.modules, function() {
                        
            //map deps to args
            var moduleDepMap = {};
            for(i = 0; i < self.modules.length; i++) {
                moduleDepMap[self.modules[i]] = arguments[i];
            }
            self.protoFactory.addLoadedModules(moduleDepMap);

            var protos = [], proto;
            for(i = 0; i < protoIds.length; i++) {
                try {
                    proto = self.protoFactory.getProto(protoIds[i]);
                    protos.push(proto);
                } catch(e) {
                    if(e instanceof Util.InvertedError) {
                        invertedErrors.push(e);
                    } else {
                        throw e;
                    }
                }
            }

            //notify errors
            for(i = 0; i < invertedErrors.length; i++) {
                var e = invertedErrors[i];
                //execute inverted errors in the callback
                if(typeof onError === "function") {
                    onError.call(self, e);
                }
                promise.notifyFailure(e);
                e.print();
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
     * @param {Object} depTree The function recursively creates a tree of dependencies
     * @return {Object} A tree of protos config objects which are dependencies
     */
    AppContext.prototype._getDependencies = function(id, depTree) {

        depTree = depTree || new DependencyTree();

        var protoConfig = this.protoFactory.getProtoConfig(id);

        try {
            depTree.addProto(id, null, true);

            //save the module
            if(Util.inArray(protoConfig.module, this.modules) < 0) {
                this.modules.push(protoConfig.module);
            }
        } catch(e) {
            //handle circular dependencies
            if(e.circular && this.allowCircular) {
                return depTree;
            } else {
                throw e;
            }
        }

        var nextNode = depTree.addChild();

        // inheritance
        if(protoConfig.extendsRef) {
            var extendsRef = Util.parseProtoReference(protoConfig.extendsRef).protoId;
            this._getDependencies(extendsRef, nextNode);
        }

        //args
        if(protoConfig.args) {
           this._getDependenciesFromArgs(protoConfig.args, nextNode);
        }

        //props
        if(protoConfig.props) {
            for( var propName in protoConfig.props) {
                if(protoConfig.props.hasOwnProperty(propName)) {
                    this._getDependenciesFromArgs([ protoConfig.props[propName] ], nextNode);
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
                this._getDependencies(mixinRef, nextNode);
            }
        }

        return depTree;
    };

    /**
     * Gets an array of dependencies from arguments config
     * 
     * @param {Array} confArgs An array of arguments
     * @param {Object} depNode
     * @return {Object}
     */
    AppContext.prototype._getDependenciesFromArgs = function(confArgs, depNode) {

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
                    this._getDependencies(ref, depNode);
                }
                else if(isObject && argData.factoryRef) {
                    this._getDependencies(argData.factoryRef, depNode);
                }
                else if(isObject && argData.module) {
                    depNode.addProto({
                        module: argData.module
                    });
                }
                else if(isObject) {
                    // if arg is object containing values
                    for( var key in argData) {
                        if(argData.hasOwnProperty(key)) {
                            var obj = argData[key];
                            if(obj && (obj.ref || Util.matchProtoRefString(obj))) {
                                ref = Util.parseProtoReference(obj.ref || obj.substr(1)).protoId;
                                this._getDependencies(ref, depNode);
                            }
                            else if(obj && obj.factoryRef) {
                                this._getDependencies(obj.factoryRef, depNode);
                            }
                            else if(obj && obj.module) {
                                depNode.addProto({
                                    module: obj.module
                                });
                            }
                        }
                    }
                }
            }
        }
        return depNode;
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
