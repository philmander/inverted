if ( typeof this.define === "function" && this.define.amd) {
    this.define( "inverted", [], function () { return inverted; } );
}


 window["inverted"] = inverted;
 window.inverted["AppContext"] = inverted.AppContext;
 inverted.AppContext.prototype["getProto"] = inverted.AppContext.prototype.getProto;