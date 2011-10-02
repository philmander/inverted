/**
 * @license Inverted IOC container v0.0.13
 * 
 * https://github.com/philmander/inverted-js
 * 
 * Copyright (c) 2010, Phil Mander
 * Licensed under the MIT license
 */
(function(global) {


//sub modules
var inverted = {};
var global = global || this;

//expose as export for common js or global for browser
var exports = exports || global;
exports.inverted = inverted;
/**
 * Some utils
 */
(function(global, inverted) {

	var ns = (inverted.util = inverted.util || {});

	/**
	 * Strict check to see if an object is an array.
	 */
	ns.isArray = function(obj) {

		return Array.isArray || Object.prototype.toString.call(obj) === "[object Array]";
	};

	/**
	 * Taken directly from jquery 1.5.2
	 */
	ns.inArray = function(elem, array) {

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
	
	ns.parseProtoString = function(protoString, root) {
		
		var obj = root;
		var parts = protoString.split(".");		
		
		for(var i = 0, part; part = parts[i]; i++) {
			
			if(typeof obj[part] === "undefined") {
				return null;
			} else {
				obj = obj[part];
			}						
		}			
		
		return obj;
	};
	
})(global, inverted);
/**
 * Dynamic loading of javascript dependencies
 */
(function(global, inverted) {

	var ns = (inverted.util = inverted.util || {});
	
	var DEBUG = global.DEBUG || false;

	var _defaultCharset = "UTF-8";
	
	var loadCount = 0;

	ns.WebRequire = function(timeout) {

		this.timeout = timeout || 10000;
		this.cache = {};		
	};

	/**
	 * Clears cached javascript files
	 */
	ns.WebRequire.prototype.clearCache = function() {

		this.cache = {};
	};

	/**
	 * Loads a javascript file. See tests for examples.
	 * 
	 * @param scripts
	 *            {String/Array} A string or array of strings of javascript
	 *            files to load Each string can either be the name, src or
	 *            namespace of the script to load.
	 * @param callback
	 *            {Function} A callback to execute once all scripts in the toGet
	 *            param have loaded
	 * @param context
	 *            {Object} The context in which to execture the callback
	 *            (optional)
	 * @param charset
	 *            {String} The charset to use when loading scripts. Defaults to
	 *            UTF-8 (optional)
	 */
	ns.WebRequire.prototype.load = function(scripts, callback, callbackContext, charset) {

		var thisRequire = this;

		callbackContext = callbackContext || global;
		charset = charset || _defaultCharset;

		if(typeof scripts === "string") {
			scripts = [ scripts ];
		}
		
		//exit early if no scripts to load
		if(scripts.length == 0) {
			if(typeof callback === "function") {
				callback.apply(callbackContext, [ true, [], "" ]);
			}
			return;
		}

		// load the scripts
		var scriptsLoaded = [];
		var numScripts = scripts.length;

		var head = document.getElementsByTagName("head")[0] || document.documentElement;

		for( var i = 0; i < numScripts; i++) {
			(function(src) {

				if(thisRequire.cache[src]) {
					
					if(DEBUG) {
						console.log(src + " already loaded.");
					}
					
					onScriptLoaded(src);
				}
				else {
					
					if(DEBUG) {
						console.log("Loading " + src + ".");
					}
					
					var script = global.document.createElement("script");
					script.type = "text/javascript";
					script.src = src;
					script.charset = charset;

					var done = false;
					script.onload = script.onreadystatechange = function() {

						if(!done &&
							(!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
							done = true;
							onScriptLoaded(src);
							thisRequire.cache[src] = true;

							// Handle memory leak in IE
							script.onload = script.onreadystatechange = null;
							if(head && script.parentNode) {
								head.removeChild(script);
							}
						}
					};

					head.insertBefore(script, head.firstChild);
				}
			})(scripts[i]);
		}

		// timeout		
		this.requireTimeout = global.setTimeout(function() {

			var notLoaded = [];
			for( var i = 0; i < scripts.length; i++) {
				if(inverted.util.inArray(scripts[i], scriptsLoaded) === -1) {
					notLoaded.push(scripts[i]);
				}
			}

			if(typeof callback === "function") {
				var message = notLoaded.join(", ") + " failed to load within " + thisRequire.timeout + " milis";
				callback.apply(callbackContext, [ false, notLoaded, message ]);
			}
		}, this.timeout);
		
		if(DEBUG) {
			console.log("Load timeout set (" + this.requireTimeout + ")");
		}		

		// invoke callback function
		function onScriptLoaded(src) {

			scriptsLoaded.push(src);
					
			if(scriptsLoaded.length == numScripts) {
				
				if(DEBUG) {
					console.log("Clearing timeout for " + src + "(" + thisRequire.requireTimeout + ")");
				}		
				
				global.clearTimeout(thisRequire.requireTimeout);
				if(typeof callback === "function") {
					callback.apply(callbackContext, [ true, [], "" ]);
				}
			}
		}
	};
})(global, inverted);
/**
 * Loading of javascript dependencies
 */
(function(global, inverted) {

	var ns = (inverted.util = inverted.util || {});
	
	var DEBUG = global.DEBUG || false;

	ns.CommonRequire = function() {

	};

	ns.CommonRequire.prototype.load = function(scripts, callback, callbackContext) {

		var i, len;
		for(i = 0, len = scripts.length; i < len; i++) {
			global.require(scripts[i]);
		}
		
		callback.apply(callbackContext, [ true, [], "" ]);
	};
})(global, inverted);
(function(inverted) {

	var ns = (inverted.resolvers = inverted.resolvers || {});

	ns.defaultSrcResolver = function(toGet, base) {

		var scriptUri = toGet.replace(/\./g, "/");
		base = base.replace(/\/$/, "");
		scriptUri = base + "/" + scriptUri + ".js";

		return scriptUri;
	};

})(inverted);
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
(function(global, inverted) {

	var DEBUG = global.DEBUG || false;

	/**
	 * Create a new AppContext with config
	 * 
	 * @constructor
	 * @param config
	 */
	inverted.AppContext = function(config, profile, ctx, protoFactory, loader) {

		if(!(this instanceof inverted.AppContext)) {
			config.ctx = ctx;
			protoFactory = new inverted.ProtoFactory(config.protos);
			
			//TODO: Node detection should probably be more sophisticated
			if(typeof window === "undefined") {
				loader = new inverted.util.CommonRequire();
			} else {
				loader = new inverted.util.WebRequire(5000);
			}
			return new inverted.AppContext(config, profile, null, protoFactory, loader);
		}

		this.config = config;
		this.profile = profile || "local";
		this.protoFactory = protoFactory;
		this.loader = loader;

		if(typeof config.srcResolver == "function") {
			this.srcResolver = config.srcResolver;
		}
		else if(typeof config.srcResolver == "object") {
			this.srcResolver = config.srcResolver[this.profile];
		}
		else {
			this.srcResolver = inverted.resolvers.defaultSrcResolver;
		}

		config.srcBase = config.srcBase || "";
		this.srcBase = typeof config.srcBase == "object" ? config.srcBase[this.profile] : config.srcBase;
	};

	/**
	 * Gets an instance of a prototype using the specified id
	 * 
	 * @param ids
	 * @param callback
	 */
	inverted.AppContext.prototype.getProto = function() {

		// turn arguments list in to array of proto ids
		var ids = Array.prototype.slice.call(arguments, 0);

		// last arg should be the callback
		var callback;
		if(ids.length > 1 && typeof ids[ids.length - 1] == "function") {
			callback = ids.pop();
		}

		if(DEBUG) {
			console.log("Getting protos for (" + ids.join(", ") + ")");
		}

		// walk config to get array of deps so they can be loaded if required
		var deps = [];
		for( var i = 0; i < ids.length; i++) {
			deps = deps.concat(this._getDependencies(ids[i]));
		}

		// convert dependencies into source files
		var sources = [];
		for( var j = 0; j < deps.length; j++) {
			
			if(!this.protoFactory.parseProtoString(deps[j])) {
				var src = this.srcResolver(deps[j], this.srcBase);
				if(inverted.util.inArray(src, sources) == -1) {
					sources.push(src);
				}
			}			
		}

		// load all dependencies before attempting to create an instance
		//TODO: single instance of require needs to do multiple loads
		this.loader.load(sources, function(success, notLoaded, failMessage) {

			if(success) {

				if(DEBUG) {
					console.log("Successfully loaded all dependecies (" + sources.join(", ") + ")");
				}

				var protos = [];
				for( var j = 0; j < ids.length; j++) {
					var proto = this.protoFactory.getProto(ids[j]);
					proto._appContext = this;						
					protos.push(proto);
				}

				if(callback) {
					callback.apply(global, protos);
				}
			}
			else {

				if(DEBUG) {
					console.log("Failed to load some dependecies (" + notLoaded.join(", ") + ")");
				}

				throw new Error(failMessage);
			}

		}, this);
	};

	/**
	 * Creates an array of dependencies
	 * 
	 * @param id
	 * @param deps
	 * @returns
	 */
	inverted.AppContext.prototype._getDependencies = function(id, deps) {

		deps = deps || [];
		var protoData = this.protoFactory.getProtoConfig(id);

		deps.push(protoData.proto);

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
	 * @param confArgs
	 * @param deps
	 * @returns
	 */
	inverted.AppContext.prototype._getDependenciesFromArgs = function(confArgs, deps) {

		if(confArgs) {
			for( var i = 0; i < confArgs.length; i++) {
				var argData = confArgs[i];

				// easier to deal with nulls here)
				if(argData === null || typeof argData === "undefined") {
					continue;
				}

				var isObject = typeof argData == "object";
				// if arg has ref
				if((isObject && argData.ref) || (typeof argData === "string" && argData.match(/^\*[^\*]/) !== null)) {
					deps = this._getDependencies(argData.ref || argData.substr(1), deps);
				}
				else if(isObject && argData.factoryRef) {
					deps = this._getDependencies(argData.factoryRef, deps);
				}
				else if(isObject && argData.proto) {
					deps.push(argData.proto);
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
							else if(obj && obj.proto) {
								deps.push(obj.proto);
							}
						}
					}
				}
			}
		}
		return deps;
	};

})(global, inverted);
})(this);
