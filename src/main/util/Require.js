/**
 * Dynamic loading of javascript dependencies Shortcut to quadro.Require.get()
 * is quadro.require()
 */
(function(global, inverted){

    var ns = inverted.namespace("inverted.util");

    var _base = null;

    var _defaultCharset = "UTF-8";

    var _cache = {};

    ns.Require = {};

    var loadTimeout = 10000;

    /**
     * Sets the base uri for which to load script files
     * 
     * @param base
     *            a uri string
     */
    ns.Require.base = function(base){

        _base = base;
    };

    /**
     * Clears cached javascript files
     */
    ns.Require.clearCache = function(){

        _cache = {};
    };

    /**
     * Loads a javascript file. See tests for examples.
     * 
     * @param toGet
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
    ns.Require.get = function(scripts, callback, context, charset){

        context = context || this;
        charset = charset || _defaultCharset;

        if (!inverted.util.Util.isArray(scripts)){
            scripts = [ scripts ];
        }

        // load the scripts
        var scriptsLoaded = 0;
        var numScripts = scripts.length;

        var head = document.getElementsByTagName("head")[0] || document.documentElement;

        for ( var i = 0; i < numScripts; i++){
            (function(src){

                if (_cache[src]){
                    onScriptLoaded(src);
                }
                else{
                    var script = global.document.createElement("script");
                    script.type = "text/javascript";
                    script.src = src;
                    script.charset = charset;

                    var done = false;
                    script.onload = script.onreadystatechange = function(){

                        if (!done
                        && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")){
                            done = true;
                            onScriptLoaded(src);
                            _cache[src] = true;

                            // Handle memory leak in IE
                            script.onload = script.onreadystatechange = null;
                            if (head && script.parentNode){
                                head.removeChild(script);
                            }
                        }
                    };

                    head.insertBefore(script, head.firstChild);
                }
            })(scripts[i]);
        }

        function onScriptLoaded(src){

            if (++scriptsLoaded == numScripts){
                callback.call(context);
            }
        }
    };

    // shortcut
    inverted.require = ns.Require.get;
})(window, inverted);