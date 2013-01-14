/**
 * Tree structure to manage dependencies
 */
define("inverted/DependencyTree", ["inverted/Util"], function(Util) {

    "use strict";

    /**
     * Dependency Node/Tree
     * @constructor
     */
    var DependencyNode = function() {

        this.protos = [];
        this.children = [];
        this.parent = null;
    };

    /**
     * Adds a new child to this node
     * @return {DependencyNode}
     */
    DependencyNode.prototype.addChild = function() {

        var child = new DependencyNode();
        child.parent = this;
        this.children.push(child);
        return child;
    };

    /**
     * Returns the children of this node
     * @return {Array}
     */
    DependencyNode.prototype.getChildren = function() {

        return this.children;
    };

    /**
     * Returns this nodes parent
     * @return {DependencyNode}
     */
    DependencyNode.prototype.getParent = function() {

        return this.parent;
    };

    /**
     * Checks the tree to see if any parent nodes contain this proto id
     * @param id {String} The proto id to check against circular dependencies
     * @return {Object|null} The proto configuration data associated with any circular dependency origin node, otherwise
     * null
     */
    DependencyNode.prototype.checkForCircular = function(id) {

        //walks up the tree looking for circular dependencies
        var check = function(node, protoId) {

            if(node !== null) {
                for(var i = 0; i < node.protos.length; i++) {
                    if(node.protos[i].id && node.protos[i].id === protoId) {
                        return node.protos[i];
                    }
                }
                return check(node.parent, protoId);
            }
            return null;
        };

        return check(this.parent, id);
    };

    /**
     * Adds a proto to the current node
     * @param {String} id The proto id
     * @param {String} instance An optional instance of the proto
     * @param {Boolean} checkForCircular checkForCircular will check for circular dependencies before adding the proto
     */
    DependencyNode.prototype.addProto = function(id, instance, checkForCircular) {
        checkForCircular = checkForCircular || false;
        if(checkForCircular) {
            var circularOrigin = this.checkForCircular(id);
            if(circularOrigin) {
                var circularError = new Util.createError("Circular dependency detected for [" + id + "]");
                circularError.circular = true;
                throw circularError;
            }
        }
        this.protos.push({
            id: id,
            instance: instance || null
        });
    };

    //export
    return DependencyNode;
});