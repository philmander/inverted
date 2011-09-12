#Inverted

Inverted is Javascript Inversion of Control container. 

It manages dependency injection and dependency management, automatically loading scripts which cannot be resolved. Its aim is to make large Javascript applications easier to manage and higher quality encouraging code modularisation, separations of concerns and good unit testing pratices.

Inverted is just 2.39KB minified and GZipped.

The core of a Javascript application that uses Inverted is the application configuration. Application configuratin is written in Javascript and wires the application together. It mainly consists of proto definitions. Protos are prototypal objects designed to be constructed using the _new_ keyword. In classical terms, Javascript classes and like _beans_ in Spring IOC for Java.

```javascript
var applicationConfig = {
	protos: {
		"protoId" : {
			proto: "namespace.Constructor",
			//other config
		},
		"anotherProtoId" : {
			proto: "namespace.Constructor",
			//other config
		}
	}
}
```

Inverted defines one global function _AppContext_. Which can be called using the application configuration as an argument to create an Application Context object.

```javascript
var appContext = AppContext(applicationConfig)
```

Protos defined in the application configuration can then be retrieved using the _getProto_ function passing _n_ proto definition id's and a callback with _n_ arguments, one for each instance of a proto instantiated:

```javascript
appContext.getProto("myProto", function(myProto) {
	myProto.doStuff();
});
appContext.getProto("myProto", "myProto2", "myProtoN", function(myProto, myProto2, myProtoN) {
	myProto.doStuff();
	myProto2.doStuff();
	myProtoN.doStuff();
});
```

Only one AppContext per application should be created per application. It is not a singleton.

This file explains the core concepts of Inverted by example. Most examples show the application code consisting of the proto implementations, the application configuration and example usage of the Inverted container.

###Road map

* Inverted is currently only built to run in the browser. Node support also needed.
* ...


##Examples

###Instantiation
A simple example of using the Inverted container to construct an instance of an  object. In this simple example the result is the eqivalent of using the new keyword. 
i.e. new MyObj();
But no explicit type is referenced when actually getting the instance using the container.

```javascript

// application code
global.MyObj = function() {

};

global.MyObj.prototype.callMe = function() {

	return "Thanks for calling me";
};

// application config
var conf = {
	protos : {
		myObj : {
			proto : "MyObj"
		}
	}
};

// use the container
var appContext = AppContext(conf);

appContext.getProto("myObj", function(myObj) {

	log(myObj instanceof MyObj); // true
	log(myObj.callMe() === "Thanks for calling me"); // true
});

```

###Context
Inverted attempts to resolve protos on the global scope by default, however an alternative scope context can be specified when getting the _AppContext_

```javascript

var root = {};

// application code
root.MyObj = function() {

};

// application config
var conf = {
	protos : {
		myObj : {
			proto : "MyObj"
		}
	}
};

// use the container with a different context
var appContext = AppContext(conf, null, root); //the null here is a profile which is explained later

appContext.getProto("myObj", function(myObj) {

	log(myObj instanceof MyObj); // true
});

```

###Constructor injection: Literals and regular arguments 
Literal values are set in the application configuration

```javascript

// application code
global.MyObj = function(num, str, bool, nully) {

	this.num = num;
	this.str = str;
	this.bool = bool;
	this.nully = nully;
};

// application config
var conf = {
	protos : {
		myObj : {
			proto : "MyObj",
			args : [ 99, "hello", true, null ]
		}
	}
};

// use the container
var appContext = AppContext(conf);

appContext.getProto("myObj", function(myObj) {

	log(myObj.num === 99); // true
	log(myObj.str === "hello"); // true
	log(myObj.bool === true); // true
	log(myObj.nully === null); // true
});

```

###Constructor injection: Using an object map of literals

```javascript

// application code
global.MyObj = function(params) {

	this.num = params.num;
	this.str = params.str;
	this.bool = params.bool;
	this.nully = params.nully;
};

// application config
var conf = {
	protos : {
		myObj : {
			proto : "MyObj",
			args : [ {
				num : 99,
				str : "hello",
				bool : true,
				nully : null
			} ]
		}
	}
};

// use the container
var appContext = AppContext(conf);

appContext.getProto("myObj", function(myObj) {

	log(myObj.num === 99);// true
	log(myObj.str === "hello"); // true
	log(myObj.bool === true); // true
	log(myObj.nully === null); // true
});

```

###Constructor injection: Dependencies
A tree of dependencies are instantiated and injected using the application configuration


```javascript

// application code
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

// application config
var conf = {
	protos : {
		myObjOne : {
			proto : "myapp.MyObjOne",
			args : [ "*myObjTwo" ]
		},
		myObjTwo : {
			proto : "myapp.MyObjTwo",
			args : [ "*myObjThree" ]
		},
		myObjThree : {
			proto : "myapp.MyObjThree",
			args : [ "Hello!" ]
		}
	}
};

// use the container
var appContext = AppContext(conf);

appContext.getProto("myObjOne", function(obj1) {

	log(obj1 instanceof myapp.MyObjOne); // true
	log(obj1.obj2 instanceof myapp.MyObjTwo); // true
	log(obj1.obj2.obj3 instanceof myapp.MyObjThree); // true
	log(obj1.obj2.obj3.message === "Hello!"); // true
});

```

Beginning an injected string with a _*_ will reference another prototype definition in the application configuration. A longer hand alternative is to create an object with a _ref_ property.

The two code samples below work the same:

```javascript
myObjOne : {
	proto : "myapp.MyObjOne",
	args : [ "*myObjTwo" ]
}

```

```javascript
myObjOne : {
	proto : "myapp.MyObjOne",
	args : [ {
		ref : "myObjTwo"
	} ]
}

```



###Property injection: Literal values


```javascript

// application code
global.MyObj = function() {

	this.num;
	this.str;
	this.bool;
	this.nully;
};

// application config
var conf = {
	protos : {
		myObj : {
			proto : "MyObj",
			props : {
				num : 88,
				str : "hi",
				bool : true,
				nully : null
			}
		}
	}
};

// use the container
var appContext = AppContext(conf);

appContext.getProto("myObj", function(myObj) {

	log(myObj.num === 88); // true
	log(myObj.str === "hi"); // true
	log(myObj.bool === true); // true
	log(myObj.nully === null); // true
});
	
```

###Property injection: Dependencies

```javascript

//application code
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

//application config
var conf = {
	protos : {
		myObjOne : {
			proto : "myapp.MyObjOne",
			props : {
				obj2 : "*myObjTwo"
			}
		},
		myObjTwo : {
			proto : "myapp.MyObjTwo",
			props : {
				obj3 : "*myObjThree"
			}
		},
		myObjThree : {
			proto : "myapp.MyObjThree",
			props : {
				message : "Hello!"
			}
		}
	}
};

//use the container
var appContext = AppContext(conf);

appContext.getProto("myObjOne", function(obj1) {

	log(obj1 instanceof myapp.MyObjOne); // true
	log(obj1.obj2 instanceof myapp.MyObjTwo); // true
	log(obj1.obj2.obj3 instanceof myapp.MyObjThree); // true
	log(obj1.obj2.obj3.message === "Hello!"); // true
});

```

###Getting multiple protos in the same callback

```javascript

//application code
global.myapp = {};
myapp.MyObjOne = function() {

};
myapp.MyObjTwo = function() {

};

//application config
var conf = {
	protos : {
		myObjOne : {
			proto : "myapp.MyObjOne"
		},
		myObjTwo : {
			proto : "myapp.MyObjTwo"
		}
	}
};

//use the container
var appContext = AppContext(conf);

appContext.getProto("myObjOne", "myObjTwo", "myObjN", function(myObj1, myObj2, myObjN) {

	log(myObj1 instanceof myapp.MyObjOne); // true
	log(myObj2 instanceof myapp.MyObjTwo); // true	
});
	
```

###Scopes

Inverted supports two scopes _prototype_ and _singleton_. The first is used by default and does not need to be explicitly specified in the application config. Protos that use the singleton scope will only be instantiated once.

```javascript

//application code
global.myapp = {};
myapp.MySingleton = function() {

};
myapp.MyProto = function() {

};

//application config
var conf = {
	protos : {
		myProto : {
			proto : "myapp.MyProto",
			scope : "prototype" // default scope
		},
		mySingleton : {
			proto : "myapp.MySingleton",
			scope : "singleton"
		}
	}
};

//use the container
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

// objects constructed with protype scope are different
log(prototype1 !== prototype2); // true
prototype1.something = true;
log(prototype2.something !== true); // true

// references point to same object
log(singleton1 === singleton2); // true
singleton1.something = true;
log(singleton2.something === true); // true

```

###Prototypal inheritance 
Super objects in the prototype chain are treated as another form of dependency with Inverted and prototyal inheritance chains be managed entirely within the application configuration


```javascript

// application code
global.myapp = {};
myapp.BaseProto = function() {

	this.superValue;
};
myapp.MyProto = function() {

	this.value;
};

// application config
var conf = {
	protos : {
		myProto : {
			proto : "myapp.MyProto",
			props : {
				value : "hello"
			},
			extendsRef : "base"
		},
		base : {
			proto : "myapp.BaseProto",
			props : {
				superValue : "super hello!"
			}
		}
	}
};

// use the container
var appContext = AppContext(conf);

appContext.getProto("myProto", function(myProto) {

	log(myProto instanceof myapp.BaseProto); // true
	log(myProto instanceof myapp.MyProto); // true
	log(myProto.value === "hello"); // true
	log(myProto.superValue === "super hello!"); // true
});

```

###Resolving dependencies 
If a proto is undefined Inverted will attempt to resolve it by loading the Javascript file it is defined in. Inverted uses a source resolver function to map a script base and the proto definition to a javascript file.

In a local development environment where the code base is heavily modularised, this means only many script tags do not need to be included.


```javascript

// application code
log(typeof global.MyResolvedProto === "undefined"); // code is in scripts/MyProto.js

// application config
function simpleResolver(toGet, base) {

	return base + "/" + toGet + ".js";
}

var conf = {
	srcBase : "scripts",
	srcResolver : simpleResolver,
	protos : {
		myProto : {
			proto : "MyResolvedProto"
		}
	}
};

// use the container
var appContext = AppContext(conf);

appContext.getProto("myProto", function(myProto) {

	log(typeof global.MyResolvedProto !== "undefined"); // true
	log(myProto instanceof global.MyResolvedProto); // true
});

```

###Resolving dependencies with multiple profiles
Different source resolvers can be specified for differnt environments. These are called profiles. For example, you may separate all your javascript classess or modules into individual files in a local development environment and combine them into one or a few minified files for production.

```javascript

// application code
log(typeof global.MyProfileResolvedProto === "undefined");
// code is in scripts/all.min.js

// application config
function simpleResolver(toGet, base) {

	return base + "/" + toGet + ".js";
}
function minifiedResolver(toGet, base) {

	return base + "/all.min.js";
}

var conf = {
	srcBase : {
		local : "scripts",
		prod : "scripts"
	},
	srcResolver : {
		local : simpleResolver,
		prod : minifiedResolver
	},
	protos : {
		myProto : {
			proto : "MyProfileResolvedProto"
		}
	}
};

// use the container
var appContext = AppContext(conf, "prod");

appContext.getProto("myProto", function(myProto) {

	log(typeof global.MyProfileResolvedProto !== "undefined"); // true
	log(myProto instanceof global.MyProfileResolvedProto); // true
});

```

###Factory methods
Factory methods can be used to generate injected values


```javascript

	// application code
	global.MyFactory = function() {

		this.defaultCode = 123;
	};
	global.MyFactory.prototype.createCode = function() {

		return this.defaultCode;
	};

	global.MyProto = function(prefix, code) {

		this.code = prefix + code;
	};

	// application config
	var conf = {
		protos : {
			myProto : {
				proto : "MyProto",
				args : [ "CODE-", {
					factoryRef : "myFactory",
					factoryMethod : "createCode"
				} ]
			},
			myFactory : {
				proto : "MyFactory",
				scope : "singleton"
			}
		}
	};

	// use the inerted container
	var appContext = AppContext(conf);

	appContext.getProto("myProto", function(myProto) {

		log(myProto.code === "CODE-123"); // true
	});

```

###Injecting utilities 
Utilitiy classes can be written as prototypal objects with singleton scope and injected as dependencies unobtrusively using property injection

```javascript

// application code
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

	var arr = [ 1, 2, 3 ];
	return this.util.isArray(arr);
};

// application config
var conf = {
	protos : {
		myProto : {
			proto : "MyProto",
			props : {
				util : "*myUtil"
			}
		},
		myUtil : {
			proto : "MyUtil",
			scope : "singleton"
		}
	}
};

// use the inerted container
var appContext = AppContext(conf);

appContext.getProto("myProto", function(myProto) {

	log(myProto.doSomething()); // true
});

```