define(function() {

    var MixinToMix = function(x, y, z, o) {

        this.x = x;
        this.y = y;
        this.z = z;

        //to test override
        this.o = o;
    };

    MixinToMix.prototype.getX = function() {

        return this.x;
    };

    MixinToMix.prototype.getY = function() {

        return this.y;
    };

    MixinToMix.prototype.getZ = function() {

        return this.z;
    };

    MixinToMix.prototype.getO = function() {
        return this.o;
    }

    return MixinToMix;
});