/**
 * Namespace utility Shortcut to quadro.Namespace.set() is quadro.namespace()
 */
(function(global, inverted) {

	var Namespace = (inverted.Namespace = {});

	var _root = global;

	var _delimiter = ".";

	/**
	 * Sets the root of any subsequently set namespaces. Defaults to global
	 * 
	 * @param root
	 *            {Object} The root object to build namespaces on
	 */
	Namespace.root = function(root) {

		_root = root;
	};

	/**
	 * Sets an alternative namespace delimiter. Default is period .
	 * 
	 * @param root
	 */
	Namespace.delimiter = function(delimiter) {

		_delimiter = delimiter;
	};

	/**
	 * Sets a namespace using a string. Eg: "one.two.three" will become <code>
	 * window.one = {
	 *     two: {
	 *          three: {}
	 *     }
	 * };
	 * </code>
	 * (assuming window is the root)
	 * 
	 * @param packageName
	 *            The namespace to set
	 * @returns a reference to the newly created namespace
	 */
	Namespace.set = function(packageName) {

		function setNamespace(namespace, parts) {

			var next = parts.shift();

			if(next) {
				if(namespace[next] === undefined) {
					namespace[next] = {};
				}

				namespace = setNamespace(namespace[next], parts);
			}

			return namespace;
		}

		var parts = packageName.split(_delimiter);

		return setNamespace(_root, parts);
	};

	// shortcut
	inverted.ns = Namespace.set;
})(global, inverted);