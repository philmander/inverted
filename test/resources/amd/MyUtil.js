define(function() {
	
	var MyUtil = function() {

	};
	
	MyUtil.prototype.isArray = function(obj) {

		if(Array.isArray) {
			return Array.isArray(obj);
		}
		return Object.prototype.toString.call(obj) === "[object Array]";
	};
	
	return MyUtil;
});