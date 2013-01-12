define(function() {

    var MixinToMix = function(k, l, m, o) {

        this.k = k;
        this.l = l;
        this.m = m;

        //to test override
        this.o = o;
    };

    MixinToMix.prototype.getK = function() {

        return this.k;
    };

    MixinToMix.prototype.getL = function() {

        return this.l;
    };

    MixinToMix.prototype.getM = function() {

        return this.m;
    };

    MixinToMix.prototype.getO = function() {
        return this.o;
    }

    return MixinToMix;
});