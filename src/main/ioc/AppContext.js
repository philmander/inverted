(function(global) {

	var inverted = global.inverted;
	var ns = inverted.ns("inverted.ioc");
	

	var DEBUG = global.DEBUG || false;

	/**
	 * Create a new AppContext with config
	 * 
	 * @constructor
	 * @param config
	 */
	ns.AppContext = function(config, profile, ctx, protoFactory, require) {

		if(!(this instanceof ns.AppContext)) {
			config.ctx = ctx;
			protoFactory = new inverted.ioc.ProtoFactory(config.protos);
			require = new inverted.util.Require(5000);
			return new ns.AppContext(config, profile, null, protoFactory, require);
		}

		this.config = config;
		this.profile = profile || "local";
		this.protoFactory = protoFactory;
		this.require = require;

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

})(this);