/**
 * Misc Utils
 */
define("inverted/Util", function() {

    "use strict";

    var Util = {};

    /**
     * Strict check to see if an object is an array.
     */
    Util.isArray = function(obj) {

        if(Array.isArray) {
            return Array.isArray(obj);
        }
        return Object.prototype.toString.call(obj) === "[object Array]";
    };

    /**
     * Taken directly from jquery
     */
    Util.inArray = function(elem, array) {

        if(array.indexOf) {
            return array.indexOf(elem);
        }

        for( var i = 0, length = array.length; i < length; i++) {
            if(array[i] === elem) {
                return i;
            }
        }

        return -1;
    };

    /**
     * Trim function just in case using older IE
     * @param {String} str
     * @return {String} a trimmed string
     */
    Util.trim = function(str) {

        if(str) {
            return str.replace(/^\s+|\s+$/g, "");
        }
        return str;
    };

    /**
     * Parses a reference string and returns the protod id and interface id if present
     * @param {String} ref
     * @return {{protoId: String, interfaces: Array}}
     */
    Util.parseProtoReference = function(ref) {
        var parsedRef = ref.match(/^(.+?)(\[(.+?)\])?$/);
        return  {
            protoId: Util.trim(parsedRef[1]),
            interfaces: parsedRef[3] ? Util.splitCommaDelimited(parsedRef[3]) : null
        };
    };

    /**
     * Returns true if the passed string is deemed to be a proto reference. That is, it starts with a *, has length
     * longer that 1 and the second char is not a *
     * @param {String} str
     * @return {boolean}
     */
    Util.matchProtoRefString = function(str) {

        return (typeof str === "string" && str.match(/^\*[^\*]/) !== null);
    };

    /**
     * Splits a comma delimited string
     * @return {Array}
     */
    Util.splitCommaDelimited = function(str) {

        if(str) {
            return str.split(/\s*,\s*/);
        }
        return [];
    };

    return Util;
});