/**
 * Loads dependencies using an AMD module loader before wiring them up using the ProtoFactory
 * Use without calling new to create using the default ProtoFactory:
 *
 * var appContext = inverted.AppContext(confg);
 *
 * AppContext.getProto is the entry point for getting protos
 *
 * appContext.getProto("one", "two", "three", function(one, two, three) {
 *	//do stuff
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

		if(define.amd && typeof requirejs !== "undefined") {
			this._loader = require;
		} else if(define.amd && typeof curl !== "undefined") {
			this._loader = curl;
		} else {
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