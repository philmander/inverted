var A = function(b) {
    this.b = b;
};

A.prototype.hello = function() {

    return "Hello " + this.b.name;
};
	
//exports = A;
module.exports = A;