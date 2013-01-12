define(function() {

    var MixinMixed = function(a, b, c, o) {

        this.a = a;
        this.b = b;
        this.c = c;

        //to test override
        this.o = o;
    };

    MixinMixed.prototype.getA = function() {

        return this.a;
    };

    MixinMixed.prototype.getB = function() {

        return this.b;
    };

    MixinMixed.prototype.getC = function() {

        return this.c;
    };

    MixinMixed.prototype.getO = function() {
        return this.o;
    };

    return MixinMixed;
});