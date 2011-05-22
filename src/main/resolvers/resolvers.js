(function(global, inverted) {

	var ns = inverted.ns("inverted.resolvers");

	ns.defaultSrcResolver = function(toGet, base) {

		var scriptUri = toGet.replace(/\./g, "/");
		base = base.replace(/\/$/, "");
		scriptUri = base + "/" + scriptUri + ".js";

		return scriptUri;
	};

})(window, window.inverted);