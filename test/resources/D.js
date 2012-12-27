define(function() {
	
	var D = function() {
		this.str = null;
		this.number = null;
		this.bool = null;
		this.nully = null;
	};
	
	D.prototype.bye = function() {
		return "Bye!";
	};
	
	return D;
});