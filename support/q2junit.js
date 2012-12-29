/*global QUnit, exports */
/*jshint strict:true,smarttabs:true */
(function(global) {
	
	"use strict";
	
	//Convert args to qunit format when calling ok assertions
	var getOkArgs = function() {
				
		var args = arguments[0];
		var assertion = {};
		if(args.length < 2) {
			assertion.message = null;
			assertion.value = args[0];
		} else {
			assertion.message = args[0];
			assertion.value = args[1];			
		}
		return assertion;
	};

	//Convert args to qunit format when calling equal assertions
	var getEqualArgs = function() {
		
		var args = arguments[0];
		var assertion = {};
		if(args.length < 3) {
			//no message
			assertion.message = null;
			assertion.expected = args[0];
			assertion.actual = args[1];
			
		} else {
			//message
			assertion.message = args[0];
			assertion.expected = args[1];
			assertion.actual = args[2];
		}
		return assertion;
	};	
	
	// Convert args to qunit format when calling typeof assertions
	var getTypeArgs = function() {
		
		var args = arguments[0];
		var assertion = {};
		if(args.length < 3) {
			//no message
			assertion.message = null;
			assertion.type = args[0];
			assertion.value = args[1];
			
		} else {
			//message
			assertion.message = args[0];
			assertion.type = args[1];
			assertion.value = args[2];
		}
		return assertion;
	};	
	
	var Q2JUnit = {
	
		/**
		 * assertEquals([message], expected, actual)
		 */
		assertEquals: function() {
			var args = getEqualArgs(arguments);
			QUnit.equal.call(global, args.actual, args.expected, args.message || "Values should be equal");
		},
	
		/**
		 * assertNotEquals([message], expected, actual)
		 */
		assertNotEquals: function() {
			var args = getEqualArgs(arguments);
			QUnit.notEqual.call(global, args.actual, args.expected, args.message || "Values should not be equal");
		},
		
		/**
		 * assertArrayEquals([message], expected, actual)
		 */
		assertArrayEquals: function() {
			var args = getEqualArgs(arguments);
			QUnit.deepEqual.call(global, args.actual, args.expected, args.message || "Arrays should be equal");
		},

		/**
		 * assertArrayNotEquals([message], expected, actual)
		 */
		assertArrayNotEquals: function() {
			var args = getEqualArgs(arguments);
			QUnit.notDeepEqual.call(global, args.actual, args.expected, args.message || "Arrays should not be equal");
		},
	
		/**
		 * assertSame([message], expected, actual)
		 */
		assertSame: function() {
			var args = getEqualArgs(arguments);
			QUnit.strictEqual.call(global, args.actual, args.expected, args.message || "Values should be the same");
		},
		
		/**
		 * assertNotSame([message], expected, actual)
		 */
		assertNotSame: function() {
			var args = getEqualArgs(arguments);
			QUnit.notStrictEqual.call(global, args.actual, args.expected, args.message || "Values should not be the same");
		},
	
		/**
		 * assertTrue([message], value)
		 */
		assertTrue: function() {
			var args = getOkArgs(arguments);
			QUnit.ok.call(global, args.value, args.message || "Value should be true (truthy)");
		},
	
		/**
		 * assertFalse([message], value)
		 */
		assertFalse: function() {
			var args = getOkArgs(arguments);
			QUnit.ok.call(global, !args.value, args.message || "Value should be false (Falsy)");
		},
	
		/**
		 * assertTypeOf([message], type, value)
		 */
		assertTypeOf: function() {
			var args = getTypeArgs(arguments);
			var condition = typeof args.value === args.type;
			QUnit.ok.call(global, condition, args.message || "Value should be of type " + args.type);
		},
		
		/**
		 * assertInstanceOf([message], type, value)
		 */
		assertInstanceOf: function() {
			var args = getTypeArgs(arguments);
			var condition = args.value instanceof args.type;
			QUnit.ok.call(global, condition, args.message || "Value should be an instance of " + args.type);
		},
		
		/**
		 * assertInstanceOf([message], type, value)
		 */
		assertNotInstanceOf: function() {
			var args = getTypeArgs(arguments);
			var condition = !(args.value instanceof args.type);
			QUnit.ok.call(global, condition, args.message || "Value should not be an instance of " + args.type);
		},
		
		/**
		 * asserts true if the value is type of number or an instance of Number
		 * assertNumber([message], type, value)
		 */
		assertNumber: function() {
			var args = getOkArgs(arguments);
			var condition = typeof args.value === "number" || args.value instanceof Number;
			QUnit.ok.call(global, condition, args.message || "Value should be a number");
		},
		
		/**
		 * asserts true if the value is type of string or an instance of String
		 * assertString([message], type, value)
		 */
		assertString: function() {
			var args = getOkArgs(arguments);
			var condition = typeof args.value === "string" || args.value instanceof String;
			QUnit.ok.call(global, condition, args.message || "Value should be a string");
		},
		
		/**
		 * asserts true if the value is type of boolean or an instance of Boolean
		 * assertBoolean([message], type, value)
		 */
		assertBoolean: function() {
			var args = getOkArgs(arguments);
			var condition = typeof args.value === "boolean" || args.value instanceof Boolean;
			QUnit.ok.call(global, condition, args.message || "Value should be a boolean");
		},
	
		/**
		 * assertFunction([message], type, value)
		 */
		assertFunction: function() {
			var args = getOkArgs(arguments);
			var condition = args.value instanceof Function;
			QUnit.ok.call(global, condition, args.message || "Value should be a function");
		},
		
		/**
		 * assertObject([message], type, value)
		 */
		assertObject: function() {
			var args = getOkArgs(arguments);
			var condition = typeof args.value !== "object" || typeof args.value !== "function";
			QUnit.ok.call(global, condition, args.message || "Value should be an object");
		},
		
		/**
		 * assertArray([message], type, value)
		 */
		assertArray: function() {
			var args = getOkArgs(arguments);
			var condition;
			if (Array.isArray){
				condition = Array.isArray(args.value);
			} else {
				condition = Object.prototype.toString.call(args.value) === "[object Array]";
			}
			QUnit.ok.call(global, condition, args.message || "Value should be an array");
		},
		
		/**
		 * assertNull([message], value)
		 */
		assertNull: function() {
			var args = getOkArgs(arguments);
			var condition = args.value === null;
			QUnit.ok.call(global, condition, args.message || "Value should be null");
		},
		
		/**
		 * assertNotNull([message], value)
		 */
		assertNotNull: function() {
			var args = getOkArgs(arguments);
			var condition = args.value !== null;
			QUnit.ok.call(global, condition, args.message || "Value should not be null");
		},
	
		/**
		 * assertUndefined([message], 
		 */
		assertUndefined: function() {
			var args = getOkArgs(arguments);
			var condition = typeof args.value === "undefined";
			QUnit.ok.call(global, condition, args.message || "Value should be undefined");
		},
	
		/**
		 * assertNotUndefined([message], value)
		 */
		assertNotUndefined: function() {
			var args = getOkArgs(arguments);
			var condition = typeof args.value !== "undefined";
			QUnit.ok.call(global, condition, args.message || "Value should not be undefined");
		},
	
		/**
		 * assertNotNull([message], 
		 */
		assertNaN: function() {
			var args = getOkArgs(arguments);
			var condition = isNaN(args.value);
			QUnit.ok.call(global, condition, args.message || "Value should be NaN");
		},
		
		/**
		 * assertNotNull([message], 
		 */
		assertNotNaN: function() {
			var args = getOkArgs(arguments);
			var condition = !isNaN(args.value);
			QUnit.ok.call(global, condition, args.message || "Value should not be NaN");
		},
		
		/**
		 * assertNotNull([message], 
		 */
		fail: function() {
			QUnit.ok.call(global, false, arguments[0] || "Test should fail");
		}
	};
	
	//taken from QUnit
	var extend = function( a, b ) {
		for ( var prop in b ) {
			if ( b[ prop ] === undefined ) {
				delete a[ prop ];

			// Avoid "Member not found" error in IE8 caused by setting window.constructor
			} else if ( prop !== "constructor" || a !== window ) {
				a[ prop ] = b[ prop ];
			}
		}

		return a;
	};
		
	//expose
	if ( typeof exports !== "undefined" ) {
		extend(exports, Q2JUnit);
	} else {
		extend(global, Q2JUnit);
		global.Q2JUnit = Q2JUnit;
	}
	
}( (function() {return this;}.call()) ));
