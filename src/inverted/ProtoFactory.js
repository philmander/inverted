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

        var circularConf = depTree.checkForCircular(protoConf.protoId);
        if(circularConf) {
            //TODO: need to inject circular references
            depTree.addProto(protoData.protoId);
            return null;
        }

        //add the dependency to the dependency tree.
        depTree.addProto(protoConf.protoId);

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