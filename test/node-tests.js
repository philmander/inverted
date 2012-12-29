var conf = {
    protos: {
        a : {
            module: "./resources/commonjs/A.js",
            args: [
                "*b"
            ]
        },
        b: {
            module: "./resources/commonjs/B.js",
            args: [
                "Geoff Capes"
            ]
        }
    }
};

var AppContext = require("../lib/inverted");

var appContext = AppContext.create(conf, module);
appContext.getProto("a", function(a) {

    console.log(a.hello());

});