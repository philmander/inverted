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