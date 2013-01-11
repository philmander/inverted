/**
 * Very lightweight Promise implementation specifically for use with AppContext.getProto.
 */
define("inverted/Promise", function() {

    var Promise = function(ctx) {
        this._ctx = ctx;
        this._sucesses = [];
        this._failures = [];
    };

    Promise.prototype.then = function(success, fail) {

        if(typeof success == "function") {
            this._sucesses.push(success);
        }
        if(typeof fail == "function") {
            this._failures.push(fail);
        }
    };

    Promise.prototype.notifySuccess = function(protos) {
        for(var i = 0; i < this._sucesses.length; i++) {
            this._sucesses[i].apply(this._ctx, protos);
        }
    };

    Promise.prototype.notifyFailure = function(e) {
        for(var i = 0; i < this._failures.length; i++) {
            this._failures[i].call(this._ctx, e);
        }
    };

    return Promise;
});