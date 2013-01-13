/**
 *
 */
define("inverted/DependencyTree", ["inverted/Util"], function(Util) {

    "use strict";

    var DependencyNode = function() {

        this.protos = [];
        this.children = [];
        this.parent = null;
    };

    DependencyNode.prototype.addChild = function() {

        var child = new DependencyNode();
        child.parent = this;
        this.children.push(child);
        return child;
    };

    DependencyNode.prototype.getChildren = function() {

        return this.children;
    };

    DependencyNode.prototype.getParent = function() {

        return this.parent;
    };

    DependencyNode.prototype.addProto = function(id, instance) {

        var checkForCircular = function(node, protoId) {

            if(node !== null) {
                var i, protoConf = null;
                for(i = 0; i < node.protos.length; i++) {
                    if(node.protos[i].id === protoId) {
                        protoConf =  node.protos[i];
                        break;
                    }
                }
                if(protoConf) {
                    return protoConf;
                } else {
                    return checkForCircular(node.parent, protoId);
                }
            }
            return null;
        };

        var circularOrigin = checkForCircular(this.parent, id);
        if(circularOrigin) {
            var circularError = new Util.createError("Circular dependency detected for [" + id + "]");
            circularError.originalInstance = circularOrigin.instance;
            circularError.circular = true;
            throw circularError;
        }

        this.protos.push({
            id: id,
            instance: instance || null
        });
    };

    return DependencyNode;
});