/**
 * Dynamic loading of javascript dependencies Shortcut to quadro.Require.get()
 * is quadro.require()
 */
(function(global, inverted) {

	var ns = inverted.ns("inverted.util");

	var _defaultCharset = "UTF-8";

	ns.Require = function(timeout) {

		this.timeout = timeout || 10000;
		this.cache = {};
	};

	/**
	 * Clears cached javascript files
	 */
	ns.Require.prototype.clearCache = function() {

		this.cache = {};
	};

	/**
	 * Loads a javascript file. See tests for examples.
	 * 
	 * @param scripts
	 *            {String/Array} A string or array of strings of javascript
	 *            files to load Each string can either be the name, src or
	 *            namespace of the script to load.
	 * @param callback
	 *            {Function} A callback to execute once all scripts in the toGet
	 *            param have loaded
	 * @param context
	 *            {Object} The context in which to execture the callback
	 *            (optional)
	 * @param charset
	 *            {String} The charset to use when loading scripts. Defaults to
	 *            UTF-8 (optional)
	 */
	ns.Require.prototype.load = function(scripts, callback, callbackContext, charset) {

		var thisRequire = this;

		callbackContext = callbackContext || global;
		charset = charset || _defaultCharset;

		if(typeof scripts === "string") {
			scripts = [ scripts ];
		}

		// load the scripts
		var scriptsLoaded = [];
		var numScripts = scripts.length;

		var head = document.getElementsByTagName("head")[0] || document.documentElement;

		for( var i = 0; i < numScripts; i++) {
			(function(src) {

				if(thisRequire.cache[src]) {
					onScriptLoaded(src);
				}
				else {
					var script = global.document.createElement("script");
					script.type = "text/javascript";
					script.src = src;
					script.charset = charset;

					var done = false;
					script.onload = script.onreadystatechange = function() {

						if(!done &&
							(!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
							done = true;
							onScriptLoaded(src);
							thisRequire.cache[src] = true;

							// Handle memory leak in IE
							script.onload = script.onreadystatechange = null;
							if(head && script.parentNode) {
								head.removeChild(script);
							}
						}
					};

					head.insertBefore(script, head.firstChild);
				}
			})(scripts[i]);
		}

		// timeout
		this.requireTimeout = global.setTimeout(function() {

			var notLoaded = [];
			for( var i = 0; i < scripts.length; i++) {
				if(inverted.util.inArray(scripts[i], scriptsLoaded) === -1) {
					notLoaded.push(scripts[i]);
				}
			}

			if(typeof callback === "function") {
				var message = notLoaded.join(", ") + " failed to load within " + thisRequire.timeout + " milis";
				callback.apply(callbackContext, [ false, notLoaded, message ]);
			}
		}, this.timeout);

		// invoke callback function
		function onScriptLoaded(src) {

			scriptsLoaded.push(src);
			if(scriptsLoaded.length == numScripts) {
				global.clearTimeout(thisRequire.requireTimeout);
				if(typeof callback === "function") {
					callback.apply(callbackContext, [ true, [], "" ]);
				}
			}
		}
	};
})(window, window.inverted);