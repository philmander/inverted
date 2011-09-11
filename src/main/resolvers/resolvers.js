(function(global) {

	var ns = global.inverted.ns("inverted.resolvers");

	ns.defaultSrcResolver = function(toGet, base) {

		var scriptUri = toGet.replace(/\./g, "/");
		base = base.replace(/\/$/, "");
		scriptUri = base + "/" + scriptUri + ".js";

		return scriptUri;
	};

})(this);