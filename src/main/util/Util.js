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