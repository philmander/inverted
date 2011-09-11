var examples = {};

var log = console.log;
var global = this;

/**
 * Instantiation
 * A simple example of using the Inverted container to construct an instance of an 
 * object. In this simple example the result is the eqivalent of using the new keyword. 
 * i.e. new MyObj();
 * But no explicit type is referenced when actually getting the instance.
 */
examples["simpleInstansiate"] = function() { 
	
	//application code
	global.MyObj = function() {
		
	};
	
	global.MyObj.prototype.callMe = function() {
		return "Thanks for calling me";
	};
	
	//application config
	var conf = {
		protos: {
			myObj : {
				proto: "MyObj"
			}
		}
	};
	
	//use the container
	var appContext = AppContext(conf);
	
	appContext.getProto("myObj", function(myObj) {
		log(myObj instanceof MyObj === true); //true
		log(myObj.callMe() === "Thanks for calling me"); //true
	});
};

/**
 * Constructor injection with literals and regular arguments 
 * Literal values are set in the application configuration
 */
examples["simpleConstructorInjectLiteralArgs"] = function() { 

	//application code
	global.MyObj = function(num, str, bool, nully) {
		this.num = num;
		this.str = str;
		this.bool = bool;
		this.nully = nully;
	};

	//application config
	var conf = {
		protos: {
			myObj : {
				proto: "MyObj",
				args: [ 99, "hello", true, null]
			}			
		}
	};

	//use the container	
	var appContext = AppContext(conf);

	appContext.getProto("myObj", function(myObj) {
		log(myObj.num === 99); //true
		log(myObj.str === "hello"); //true
		log(myObj.bool === true); //true
		log(myObj.nully === null); //true
	});
};

/**
 * Constructor injection with using a map of literals
 */
examples["simpleConstructorInjectLiteralsObj"] = function() { 
	
	//application code
	global.MyObj = function(params) {
		this.num = params.num;
		this.str = params.str;
		this.bool = params.bool;
		this.nully = params.nully;
	};
	
	//application config
	var conf = {
		protos: {
			myObj : {
				proto: "MyObj",			
				args: [{ 
					num: 99, 
					str: "hello", 
					bool: true, 
					nully: null
				}]
			}
		}
	};
	
	//use the container
	var appContext = AppContext(conf);
	
	appContext.getProto("myObj", function(myObj) {
		log(myObj.num === 99);//true
		log(myObj.str === "hello"); //true
		log(myObj.bool === true); //true
		log(myObj.nully === null); //true
	});
};

/**
 * Injecting dependencies in the constructor
 * A tree of dependencies are instantiated and injected using the application configuration
 */
examples["simpleConstructorInjectDependency"] = function() { 
	
	//application code
	global.myapp = {};
	
	global.myapp.MyObjOne = function(obj2) {
		this.obj2 = obj2;
	};
	
	global.myapp.MyObjTwo = function(obj3) {
		this.obj3 = obj3;
	};
	
	global.myapp.MyObjThree = function(message) {
		this.message = message;
	};
	
	//application config
	var conf = {
		protos: {
			myObjOne : {
				proto: "myapp.MyObjOne",
				args: [ "*myObjTwo" ]
			},
			myObjTwo: {
				proto: "myapp.MyObjTwo",
				args: [ "*myObjThree"]
			},
			myObjThree: {
				proto: "myapp.MyObjThree",
				args: [ "Hello!" ]
			}
		}
	};
	
	//use the container
	var appContext = AppContext(conf);
	
	appContext.getProto("myObjOne", function(obj1) {
	
		log(obj1 instanceof myapp.MyObjOne === true); //true	
		log(obj1.obj2 instanceof myapp.MyObjTwo === true); //true
		log(obj1.obj2.obj3 instanceof myapp.MyObjThree === true); //true
		log(obj1.obj2.obj3.message === "Hello!"); //true
	});
};

/**
 * Property Injection with literal values
 */
examples["simplePropertyInjectLiteralArgs"] = function() { 
	
	//application code
	global.MyObj = function() {
		this.num;
		this.str;
		this.bool;
		this.nully;
	};
	
	//application config
	var conf = {
		protos: {
			myObj : {
				proto: "MyObj",
				props: { 
					num: 88,
					str: "hi",
					bool: true,
					nully: null
				}
			}			
		}
	};
	
	//use the container
	var appContext = AppContext(conf);

	appContext.getProto("myObj", function(myObj) {
		log(myObj.num === 88); //true
		log(myObj.str === "hi"); //true
		log(myObj.bool === true); //true
		log(myObj.nully === null); //true
	});
};


/**
 * Property injection with dependencies
 */
examples["simplePropertyInjectDependency"] = function() { 
	
	global.myapp = {};
	
	global.myapp.MyObjOne = function() {
		this.obj2;
	};
	
	global.myapp.MyObjTwo = function() {
		this.obj3;
	};
	
	global.myapp.MyObjThree = function() {
		this.message;
	};
	
	var conf = {
		protos: {
			myObjOne : {
				proto: "myapp.MyObjOne",
				props: {
					obj2: "*myObjTwo" 				
				}
			},
			myObjTwo: {
				proto: "myapp.MyObjTwo",
				props: {
					obj3: "*myObjThree"
				}
			},
			myObjThree: {
				proto: "myapp.MyObjThree",
				props: {
					message: "Hello!"
				}
			}
		}
	};
	
	var appContext = AppContext(conf);
	
	appContext.getProto("myObjOne", function(obj1) {
	
		log(obj1 instanceof myapp.MyObjOne === true); //true	
		log(obj1.obj2 instanceof myapp.MyObjTwo === true); //true
		log(obj1.obj2.obj3 instanceof myapp.MyObjThree === true); //true
		log(obj1.obj2.obj3.message === "Hello!"); //true
	});
};

/**
 * Getting multiple protos in the same callback 
 */
examples["multiInstansiate"] = function() { 
	
	global.myapp = {};
	myapp.MyObjOne = function() {
		
	};
	myapp.MyObjTwo = function() {
		
	};
	
	var conf = {
		protos: {
			myObjOne : {
				proto: "myapp.MyObjOne"
			},
			myObjTwo : {
				proto: "myapp.MyObjTwo"
			}
		}
	};
	
	var appContext = AppContext(conf);
	
	appContext.getProto("myObjOne", "myObjTwo", function(myObj1, myObj2) {
		log(myObj1 instanceof myapp.MyObjOne === true); //true	
		log(myObj2 instanceof myapp.MyObjTwo === true); //true
	});
};

/**
 * Scopes
 * Inverted supports two scopes prototype and singleton. The first is used by default and does
 * not need to be explicitly specified in the application config. Protos that use the singleton
 * scope will only be instansiated once.
 */
examples["scopes"] = function() { 
	
	global.myapp = {};
	myapp.MySingleton = function() {
		
	};
	myapp.MyProto = function() {
		
	};
	
	var conf = {
		protos: {
			myProto : {
				proto: "myapp.MyProto", 
				scope: "prototype" //default scope
			},
			mySingleton : {
				proto: "myapp.MySingleton",
				scope: "singleton"
			}
		}
	};
	
	var appContext = AppContext(conf);
	
	var singleton1, singleton2, prototype1, prototype2;
	
	appContext.getProto("myProto", function(myProto) {
		prototype1 = myProto;
	});
	appContext.getProto("myProto", function(myProto) {
		prototype2 = myProto;
	});
	appContext.getProto("mySingleton", function(mySingleton) {
		singleton1 = mySingleton;
	});
	appContext.getProto("mySingleton", function(mySingleton) {
		singleton2 = mySingleton;
	});
	
	//objects constructed with protype scope are different
	log(prototype1 !== prototype2); //true
	prototype1.something = true;
	log(prototype2.something !== true); //true
	
	//references point to same object 
	log(singleton1 === singleton2); //true	
	singleton1.something = true;
	log(singleton2.something === true); //true
		
};

/**
 * Prototypal inheritance
 * Super objects in the prototype chain are treated as another form of dependency with Inverted and 
 * prototya; inheritance can be managed within the application configuration
 */
examples["inheritance"] = function() { 
	
	//application code
	global.myapp = {};
	myapp.BaseProto = function() {
		this.superValue;
	};
	myapp.MyProto = function() {
		this.value;
	};
	
	//application config
	var conf = {
		protos: {
			myProto : {
				proto: "myapp.MyProto",
				props: {
					value: "hello" 				
				},
				extendsRef: "base"
			},
			base: {
				proto: "myapp.BaseProto",
				props: {
					superValue: "super hello!"
				}
			}
		}
	};
	
	//use the inerted container
	var appContext = AppContext(conf);
	
	appContext.getProto("myProto", function(myProto) {
		
		log(myProto instanceof myapp.BaseProto); //true
		log(myProto instanceof myapp.MyProto); //true
		log(myProto.value === "hello"); //true
		log(myProto.superValue === "super hello!"); //true		
	});
	
};

/**
 * Resolve dependencies 
 * If a proto is undefined Inverted will attempt to resolve by loading the Javascript file it 
 * is defined in. Inverted uses a srcResolver function to map a script base and the proto 
 * definition to a javascript file. 
 * 
 * In a local development environment where the code base is heavily modularised, this means
 * only many script tags do not need to be included.
 */
examples["simpleResolve"] = function() { 
	
	//application code

	log(typeof global.MyResolvedProto === "undefined");
	//code is in scripts/MyProto.js
	
	//application config	
	function simpleResolver(toGet, base) {
		
		return base + "/" + toGet + ".js";
	}
	
	var conf = {
		srcBase: "scripts",
		srcResolver: simpleResolver,
		protos: {
			myProto : {
				proto: "MyResolvedProto"
			}
		}
	};
	
	//use the inerted container
	var appContext = AppContext(conf);
	
	appContext.getProto("myProto", function(myProto) {
		
		log(typeof global.MyResolvedProto !== "undefined"); //true
		log(myProto instanceof global.MyResolvedProto); //true		
	});	
};	


/**
 * Multi profiles and writing src resolvers 
 * Different source resolvers can be specified for differnt environments. These are called 
 * profiles. For example, you may separate all your javascript classess or modules into 
 * individual files in a local development environment and combine them into one or a few 
 * minified files for production. 
 */
examples["profilesResolve"] = function() { 
	
	//application code
	log(typeof global.MyProfileResolvedProto === "undefined");
	//code is in scripts/all.min.js
	
	//application config	
	function simpleResolver(toGet, base) {
		
		return base + "/" + toGet + ".js";
	}
	function minifiedResolver(toGet, base) {
		
		return base + "/all.min.js";
	}
	
	var conf = {
		srcBase: {
			local: "scripts",
			prod: "scripts"
		},
		srcResolver: {
			local: simpleResolver,
			prod: minifiedResolver		
		},
		protos: {
			myProto : {
				proto: "MyProfileResolvedProto"
			}
		}
	};
	
	//use the inerted container
	var appContext = AppContext(conf, "prod");
	
	appContext.getProto("myProto", function(myProto) {
		
		log(typeof global.MyProfileResolvedProto !== "undefined"); //true
		log(myProto instanceof global.MyProfileResolvedProto); //true		
	});	
};	

/**
 * Using factories
 * Factory methods can be used to generate injected values 
 */
examples["factoryMethod"] = function() { 
	
	//application code
	global.MyFactory = function() {
		
		this.defaultCode = 123;
	};	
	global.MyFactory.prototype.createCode  = function() {
		
		return this.defaultCode; 
	};
	
	global.MyProto = function(prefix, code) {
		this.code = prefix + code;
	};	
	
	//application config		
	var conf = {
		protos: {
			myProto : {
				proto: "MyProto",
				args: [
				    "CODE-",
				    {
						factoryRef: "myFactory",
						factoryMethod: "createCode"
				    }
				]
			},
			myFactory: {
				proto: "MyFactory",
				scope: "singleton"
			}
		}
	};
	
	//use the inerted container
	var appContext = AppContext(conf);
	
	appContext.getProto("myProto", function(myProto) {
				
		log(myProto.code === "CODE-123"); //true		
	});	
};	

/**
 * Note: long hand references
 * Beginning an injected string with a * will reference another prototype definition in the 
 * application configuration. A longer hand alternative to using *is to create an object with 
 * a ref property that is equal to the proto definition to be injected. 
 * 
 * The two code samples below work the same
 */
examples["lonhandReference"] = function() {
	var conf = {
		protos: {
			myObjOne : {
				proto: "myapp.MyObjOne",
				args: [ "*myObjTwo" ]
			},
			myObjTwo: {
				proto: "myapp.MyObjTwo"			
			}
		}
	};
	
	var conf = {
		protos: {
			myObjOne : {
				proto: "myapp.MyObjOne",
				args: [
				    {
				    	ref: "myObjTwo"
				    }
				]
			},
			myObjTwo: {
				proto: "myapp.MyObjTwo"			
			}
		}
	};
};



/**
 * Injecting utilities
 * Utilitiy classes can as prototypal objects with singleton scope and injected unobtrusively
 * using property injection
 */
examples["injectingStaticUtilities"] = function() { 
	
	//application code
	global.MyUtil = function() {
		
	};	
	global.MyUtil.prototype.isArray = function(obj) {

		if(Array.isArray) {
			return obj.isArray();
		}
		return Object.prototype.toString.call(obj) === "[object Array]";
	};
	
	global.MyProto = function() {
		this.util;
	};	
	global.MyProto.prototype.doSomething = function() {
		
		var arr = [ 1, 2, 3];		
		return this.util.isArray(arr);
	};
	
	//application config		
	var conf = {
		protos: {
			myProto : {
				proto: "MyProto",
				props: {
					util: "*myUtil"
				}
			},
			myUtil: {
				proto: "MyUtil",
				scope: "singleton"
			}
		}
	};
	
	//use the inerted container
	var appContext = AppContext(conf);
	
	appContext.getProto("myProto", function(myProto) {
				
		log(myProto.doSomething()); //true		
	});	
};	


/** 
 * Compression order 
 */

/**
 * Reusing the inverted namespace 
 */

/** 
 * Some advantages
 * 
 * Never use new
 * Better unit testing and mocking
 */

