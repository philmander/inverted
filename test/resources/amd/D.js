define(function() {
	
	var D = function() {
		this.str = null;
		this.number = null;
		this.bool = null;
		this.nully = null;
        this.fromMethod = null;
        this.fromMethod2 = null;
        this.fromMethod3 = null;
        this.fromMethodArray = null;
	};
	
	D.prototype.bye = function() {
		return "Bye!";
	};

    D.prototype.setter = function(value) {
        this.fromMethod = value;
    };

    D.prototype.setMultiArgs = function(value1, value2) {
        this.fromMethod2 = value1;
        this.fromMethod3 = value2;
    };

    D.prototype.setArray = function(arr) {
        this.fromMethodArray = arr;
    };
	
	return D;
});