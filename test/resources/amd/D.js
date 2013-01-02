define(function() {
	
	var D = function() {
		this.str = null;
		this.number = null;
		this.bool = null;
		this.nully = null;
        this.fromMethod = null;
	};
	
	D.prototype.bye = function() {
		return "Bye!";
	};

    D.prototype.setter = function(value) {
        this.fromMethod = value;
    };
	
	return D;
});