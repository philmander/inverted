/**
 * Some utils
 */
(function(global){

    global.inverted = global.inverted || {};
    var ns = (global.inverted.util = global.inverted.util || {});
    ns.Util = {};

    /**
     * Strict check to see if an object is an array.
     */
    ns.Util.isArray = function(obj){

        var array = Object.prototype.toString.call(obj) === "[object Array]";
        return array;
    };

    /**
     * Converts a full namespace into an object, if any part of the namespace is
     * undefined false is returned
     */
    ns.Util.getObjectFromNamespace = function(global, namespace){

        return ns.Util.getObjectFromNamespaceParts(global, namespace.split(/\./));
    };

    ns.Util.getObjectFromNamespaceParts = function(root, parts){

        var nextPart = parts.shift();

        if (typeof root[nextPart] != "undefined"){
            if (parts.length > 0){
                return ns.Util.getObjectFromNamespaceParts(root[nextPart], parts);
            }
            else{
                return root;
            }
        }
        else{
            return false;
        }
    };

    /**
     * Quick merge of top level properties from obj1 to obj2
     */
    ns.Util.flatMerge = function(obj1, obj2){

        for ( var key in obj2){
            if (obj2.hasOwnProperty(key)){
                obj1[key] = obj2[key];
            }
        }
    };

    /*
     * Taken directly from jquery 1.5.2
     */
    ns.Util.inArray = function(elem, array){

        if (array.indexOf){
            return array.indexOf(elem);
        }

        for ( var i = 0, length = array.length; i < length; i++){
            if (array[i] === elem){
                return i;
            }
        }

        return -1;
    };
})(window);
