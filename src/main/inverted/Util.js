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