/**
 * @license Inverted IOC container v0.0.04
 * 
 * https://github.com/philmander/inverted-js
 * 
 * Copyright (c) 2010, Phil Mander
 * Licensed under the MIT license
 */
window.inverted = {};
/**
 * Namespace utility Shortcut to quadro.Namespace.set() is quadro.namespace()
 */
(function(global) {

	global.inverted = global.inverted || {};
	global.inverted.ioc = global.inverted.ioc || {};

	var Namespace = (global.inverted.Namespace = {});

	var _root = global;

	var _delimiter = ".";

	/**
	 * Sets the root of any subsequently set namespaces. Defaults to global
	 * 
	 * @param root
	 *            {Object} The root object to build namespaces on
	 */
	Namespace.root = function(root) {

		_root = root;
	};

	/**
	 * Sets an alternative namespace delimiter. Default is period .
	 * 
	 * @param root
	 */
	Namespace.delimiter = function(delimiter) {

		_delimiter = delimiter;
	};

	/**
	 * Sets a namespace using a string. Eg: "one.two.three" will become <code>
	 * window.one = {
	 *     two: {
	 *          three: {}
	 *     }
	 * };
	 * </code>
	 * (assuming window is the root)
	 * 
	 * @param packageName
	 *            The namespace to set
	 * @returns a reference to the newly created namespace
	 */
	Namespace.set = function(packageName) {

		function setNamespace(namespace, parts) {

			var next = parts.shift();

			if(next) {
				if(namespace[next] === undefined) {
					namespace[next] = {};
				}

				namespace = setNamespace(namespace[next], parts);
			}

			return namespace;
		}

		var parts = packageName.split(_delimiter);

		return setNamespace(_root, parts);
	};

	// shortcut
	global.inverted.ns = Namespace.set;
})(window);
/**
 * Some utils
 */
(function(global) {

	global.inverted = global.inverted || {};
	var ns = (global.inverted.util = global.inverted.util || {});

	/**
	 * Strict check to see if an object is an array.
	 */
	ns.isArray = function(obj) {

		if(Array.isArray) {
			return obj.isArray();
		}
		return Object.prototype.toString.call(obj) === "[object Array]";
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
})(window);
/**
 * Dynamic loading of javascript dependencies Shortcut to quadro.Require.get()
 * is quadro.require()
 */
(function(global, inverted) {

	var ns = inverted.ns("inverted.util");

	var _defaultCharset = "UTF-8";

	ns.Require = function(timeout) {

		this.timeout = timeout || 10000;
		this.cache = {};
	};

	/**
	 * Clears cached javascript files
	 */
	ns.Require.prototype.clearCache = function() {

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
	ns.Require.prototype.load = function(scripts, callback, callbackContext, charset) {

		var thisRequire = this;

		callbackContext = callbackContext || global;
		charset = charset || _defaultCharset;

		if(typeof scripts === "string") {
			scripts = [ scripts ];
		}

		// load the scripts
		var scriptsLoaded = [];
		var numScripts = scripts.length;

		var head = document.getElementsByTagName("head")[0] || document.documentElement;

		for( var i = 0; i < numScripts; i++) {
			(function(src) {

				if(thisRequire.cache[src]) {
					onScriptLoaded(src);
				}
				else {
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

		// invoke callback function
		function onScriptLoaded(src) {

			scriptsLoaded.push(src);
			if(scriptsLoaded.length == numScripts) {
				global.clearTimeout(thisRequire.requireTimeout);
				if(typeof callback === "function") {
					callback.apply(callbackContext, [ true, [], "" ]);
				}
			}
		}
	};
})(window, window.inverted);
(function(global, inverted) {

	var ns = inverted.ns("inverted.resolvers");

	ns.defaultSrcResolver = function(toGet, base) {

		var scriptUri = toGet.replace(/\./g, "/");
		base = base.replace(/\/$/, "");
		scriptUri = base + "/" + scriptUri + ".js";

		return scriptUri;
	};

})(window, window.inverted);
(function(global, inverted) {

	var ns = inverted.ns("inverted.ioc");

	var DEBUG = global.DEBUG || false;

	/**
	 * Create a new ProtoFactory with config
	 * 
	 * @constructor
	 * @param config
	 */
	ns.ProtoFactory = function(config) {

		this.config = config;
	};

	/**
	 * Gets an instance of a prototype
	 * 
	 * @param id
	 * @returns
	 */
	ns.ProtoFactory.prototype.getProto = function(id) {

		if(DEBUG) {
			console.debug("Getting proto for ", id, "...");
		}

		var protoData = this.getProtoConfig(id);

		var instance = null;
		// create an instance if not singleton or singleton and no instance
		// defined yet (lazy loaded singletons)
		if((!protoData.scope || protoData.scope != "singleton") ||
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
	ns.ProtoFactory.prototype._createInstance = function(proto, argData, propData, extendsRef) {

		var instance = null;

		if(typeof proto === "string") {
			proto = window.eval(proto);
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
		case 9:
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
					}
					else {
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
	ns.ProtoFactory.prototype._getProtoFromFactory = function(factoryRef, factoryMethod) {

		var factory = this.getProto(factoryRef);

		if(factoryMethod) {
			return factory[factoryMethod].apply(factory);
		}
		else {
			throw new Error("No factory method defined with " + factoryRef);
		}
	};

	/**
	 * Scans arg config for values, generating dependencies where required
	 * 
	 * @param confArgs
	 * @returns {Array}
	 */
	ns.ProtoFactory.prototype._createArgs = function(confArgs) {

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
				}
				else if(isObject && argData.factoryRef) {
					args[i] = this._getProtoFromFactory(argData.factoryRef, argData.factoryMethod);
				}
				else if(isObject && argData.proto) {
					args[i] = this._createInstance(argData.proto, argData.args, argData.props);
				}
				else if(isObject) {
					args[i] = {};
					// if arg is object containing values
					for( var key in argData) {
						if(argData.hasOwnProperty(key)) {
							var obj = argData[key];

							if(obj && (obj.ref || (typeof obj === "string" && obj.match(/^\*[^\*]/) !== null))) {
								args[i][key] = this.getProto(obj.ref || obj.substr(1));
							}
							else if(obj && obj.factoryRef) {
								args[i][key] = this._getProtoFromFactory(obj.factoryRef, obj.factoryMethod);
							}
							else if(obj && obj.proto) {
								args[i][key] = this._createInstance(obj.proto, obj.args, obj.props);
							}
							else {
								args[i][key] = obj;
							}
						}
					}
				}
				else {
					// just a value
					args[i] = argData;
				}
			}
		}
		return args;
	};

	ns.ProtoFactory.prototype._extendProto = function(proto, superProto) {

		// backup methods/props
		var methods = {};
		for( var method in proto.prototype) {
			methods[method] = proto.prototype[method];
		}

		// extend prototype
		proto.prototype = superProto;
		proto.prototype._super = superProto.constructor;

		// put methods back
		for( var method in methods) {
			proto.prototype[method] = methods[method];
		}

		// fix the contructor or the world will end
		proto.prototype.constructor = proto;
	};

	/**
	 * Searches the config for a proto matching the specified id
	 * 
	 * @param id
	 * @returns
	 */
	ns.ProtoFactory.prototype.getProtoConfig = function(id) {

		var config = this.config;

		if(this.config.hasOwnProperty(id)) {
			return config[id];
		}
		else {
			throw new Error("No proto is defined for " + id);
		}
	};

})(window, window.inverted);
(function(global, inverted) {

	var ns = inverted.ns("inverted.ioc");

	var DEBUG = global.DEBUG || false;

	/**
	 * Create a new AppContext with config
	 * 
	 * @constructor
	 * @param config
	 */
	ns.AppContext = function(config, env, protoFactory, require) {

		if(!(this instanceof ns.AppContext)) {
			protoFactory = new inverted.ioc.ProtoFactory(config.protos);
			require = new inverted.util.Require(10000);
			return new ns.AppContext(config, env, protoFactory, require);
		}

		this.config = config;
		this.env = env || "local";
		this.protoFactory = protoFactory;
		this.require = require;

		if(typeof config.srcResolver == "function") {
			this.srcResolver = config.srcResolver;
		}
		else if(typeof config.srcResolver == "object") {
			this.srcResolver = config.srcResolver[this.env];
		}
		else {
			this.srcResolver = inverted.resolvers.defaultSrcResolver;
		}

		config.srcBase = config.srcBase || "";
		this.srcBase = typeof config.srcBase == "object" ? config.srcBase[this.env] : config.srcBase;
	};

	// expose
	global.AppContext = ns.AppContext;

	/**
	 * Gets an instance of a prototype using the specified id
	 * 
	 * @param ids
	 * @param callback
	 */
	ns.AppContext.prototype.getProto = function() {

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
		for( var i = 0; i < deps.length; i++) {
			var src = this.srcResolver(deps[i], this.srcBase);
			if(inverted.util.inArray(src, sources) == -1) {
				sources.push(src);
			}
		}

		// load all dependencies before attempting to create an instance
		this.require.load(sources, function(success, notLoaded, failMessage) {

			if(success) {

				if(DEBUG) {
					console.log("Successfully loaded all dependecies (" + sources.join(", ") + ")");
				}

				var protos = [];
				for( var j = 0; j < ids.length; j++) {
					protos.push(this.protoFactory.getProto(ids[j]));
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
	ns.AppContext.prototype._getDependencies = function(id, deps) {

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
	ns.AppContext.prototype._getDependenciesFromArgs = function(confArgs, deps) {

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

})(window, window.inverted);
