(function(global, inverted) {
	
	var DEBUG = global.DEBUG || false;

	/**
	 * Create a new ProtoFactory with config
	 * 
	 * @constructor
	 * @param config
	 */
	inverted.ProtoFactory = function(config) {

		config.ctx = config.ctx || global;
		this.config = config;
	};

	/**
	 * Gets an instance of a prototype
	 * 
	 * @param id
	 * @returns
	 */
	inverted.ProtoFactory.prototype.getProto = function(id) {

		if(DEBUG) {
			console.debug("Getting proto for ", id, "...");
		}

		var protoData = this.getProtoConfig(id);

		var instance = null;

		// for static just get a reference
		if(protoData.scope == "static") {

			if(DEBUG) {
				console.debug("Getting reference for ", id, "...");
			}

			if(typeof protoData.proto === "string") {
				instance = this.parseProtoString(protoData.proto);
			}
		// create an instance if not singleton or singleton and no instance
		// defined yet (lazy loaded singletons)
		} else if((!protoData.scope || protoData.scope != "singleton") ||
				(protoData.scope == "singleton" && !protoData.instance)) {

			if(DEBUG) {
				console.debug("Creating new instance for ", id, "...");
			}

			instance = this._createInstance(protoData.proto, protoData.args, protoData.props, protoData.extendsRef);

			// save instance if singleton
			if(protoData.scope && protoData.scope == "singleton") {
				protoData.instance = instance;
			}
		}
		// its a singleton and instance has already been created
		else {
			if(DEBUG) {
				console.debug("Singleton instance already exists for ", id);
			}

			instance = protoData.instance;
		}

		return instance;
	};

	/**
	 * Uses factory config to create a new instance
	 * 
	 * @param factoryRef
	 * @param factoryMethod
	 * @returns
	 */
	inverted.ProtoFactory.prototype._createInstance = function(proto, argData, propData, extendsRef) {

		var instance = null;

		if(typeof proto === "string") {
			proto = this.parseProtoString(proto);
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

					if(typeof instance[propName] == "function") {
						instance[propName].apply(instance, propertyArgs[0]);
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
	 * @returns
	 */
	inverted.ProtoFactory.prototype._getProtoFromFactory = function(factoryRef, factoryMethod) {

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
	 * @param confArgs
	 * @returns {Array}
	 */
	inverted.ProtoFactory.prototype._createArgs = function(confArgs) {

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

				var isObject = typeof argData == "object";

				// if arg has ref
				if((isObject && argData.ref) || (typeof argData === "string" && argData.match(/^\*[^\*]/) !== null)) {
					args[i] = this.getProto(argData.ref || argData.substr(1));
				} else if(isObject && argData.factoryRef) {
					args[i] = this._getProtoFromFactory(argData.factoryRef, argData.factoryMethod);
				} else if(isObject && argData.proto) {
					args[i] = this._createInstance(argData.proto, argData.args, argData.props);
				} else if(isObject) {
					args[i] = {};
					// if arg is object containing values
					for( var key in argData) {
						if(argData.hasOwnProperty(key)) {
							var obj = argData[key];

							if(obj && (obj.ref || (typeof obj === "string" && obj.match(/^\*[^\*]/) !== null))) {
								args[i][key] = this.getProto(obj.ref || obj.substr(1));
							} else if(obj && obj.factoryRef) {
								args[i][key] = this._getProtoFromFactory(obj.factoryRef, obj.factoryMethod);
							} else if(obj && obj.proto) {
								args[i][key] = this._createInstance(obj.proto, obj.args, obj.props);
							} else {
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

	inverted.ProtoFactory.prototype._extendProto = function(proto, superProto) {

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

	inverted.ProtoFactory.prototype.parseProtoString = function(protoString) {

		return inverted.util.parseProtoString(protoString, this.config.ctx);
	};

	/**
	 * Searches the config for a proto matching the specified id
	 * 
	 * @param id
	 * @returns
	 */
	inverted.ProtoFactory.prototype.getProtoConfig = function(id) {

		var config = this.config;

		if(this.config.hasOwnProperty(id)) {
			return config[id];
		} else {
			throw new Error("No proto is defined for " + id);
		}
	};

})(global, inverted);