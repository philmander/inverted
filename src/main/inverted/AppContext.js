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