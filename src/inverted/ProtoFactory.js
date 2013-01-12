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