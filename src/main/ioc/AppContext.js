(function(global, inverted)
{
    var ns = inverted.ns("inverted.ioc");
    
    /**
     * Create a new AppContext with config
     * 
     * @constructor
     * @param config
     */
    ns.AppContext = function(config, env)
    {
        this.config = config;        
        this.env = env || "local";
        this.protoFactory = new inverted.ioc.ProtoFactory(config.protos);
                
        if(typeof config.srcResolver == "function")
        {
            this.srcResolver = config.srcResolver;
        }
        else if(typeof config.srcResolver == "object")
        {
            this.srcResolver = config.srcResolver[this.env];
        }
        else
        {
            // need a default src resolver
        }
        
        config.srcBase = config.srcBase || "";
        this.srcBase = typeof config.srcBase == "object" ? config.srcBase[this.env] : config.srcBase;    
    };
    
    /**
     * Gets an instance of a prototype using the specified id
     * 
     * @param ids
     * @param callback
     */
    ns.AppContext.prototype.getProto = function()
    {
        var ids = Array.prototype.slice.call(arguments, 0);
        var callback;
        if(ids.length > 1 && typeof ids[ids.length - 1] == "function")
        {
            callback = ids.pop();
        }
        
        // walk config to get array of deps so they can be loaded if required
        var deps = [];        
        for (var i = 0; i < ids.length; i++)
        {
            deps = deps.concat(this.getDependencies(ids[i]));
        }
                   
        var sources = [];
        for ( var i = 0; i < deps.length; i++)
        {
            var src = this.srcResolver(deps[i], this.srcBase);
            if(inverted.util.Util.inArray(src, sources) == -1)
            {
                sources.push(src);
            }
        }
        
        // load all dependencies before attempting to create an instance
        inverted.util.require(sources, function(){
            
            var protos = [];
            for ( var j = 0; j < ids.length; j++)
            {
                protos.push(this.protoFactory.getProto(ids[j]));    
            }
            
            if(callback)
            {
                callback.apply(global, protos);
            }
           
        }, this);
    };
    
    /**
     * Creates an array of dependencies
     * 
     * @param id
     * @param deps
     * @returns
     */
    ns.AppContext.prototype.getDependencies = function(id, deps)
    {
        deps = deps || [];
        var protoData = this.protoFactory.getProtoConfig(id);
        
        deps.push(protoData.proto);
        
        // inheritance
        if(protoData.extendsRef)
        {
            deps = this.getDependencies(protoData.extendsRef, deps);
        }        
        
        if(protoData.args)
        {
            deps = this.getDependenciesFromArgs(protoData.args, deps);
        }
                                
        if(protoData.props)
        {
            for(var i = 0; i < protoData.props.length; i++)
            {
                var prop = protoData.props[i];                
                deps = this.getDependenciesFromArgs(prop, deps);               
            }
        }        
        
        if(protoData.props)
        {
            for(var propName in protoData.props)
            {
                if (protoData.props.hasOwnProperty(propName))
                {    
                    deps = this.getDependenciesFromArgs([protoData.props[propName]], deps);         
                }
            }       
        }   
               
        return deps;
    };
    
    /**
     * Gets an array of dependencies from arguments config
     * 
     * @param confArgs
     * @param deps
     * @returns
     */
    ns.AppContext.prototype.getDependenciesFromArgs = function(confArgs, deps)
    {
        if(confArgs)
        {
            for(var i = 0; i < confArgs.length; i++)
            {
                var argData = confArgs[i];
            
                var isObject = typeof argData == "object";
                // if arg has ref
                if((isObject && argData.ref) || (typeof argData === "string" && argData.indexOf("*") === 0))
                {                        
                    deps = this.getDependencies(argData.ref || argData.substr(1), deps);
                }
                else if(isObject && argData.factoryRef)
                {
                    deps = this.getDependencies(argData.factoryRef, deps);
                }
                else if(isObject && argData.proto)
                {
                    deps.push(argData.proto);
                }                    
                else if(isObject)
                {                             
                    // if arg is object containing values
                    for(var key in argData)
                    {
                        if(argData.hasOwnProperty(key))
                        {
                            var obj = argData[key];                                
                            if(obj && (obj.ref || (typeof obj === "string" && obj.indexOf("*") === 0)))
                            {                        
                                deps = this.getDependencies(obj.ref || obj.substr(1), deps);
                            }
                            else if(obj && obj.factoryRef)
                            {
                                deps = this.getDependencies(obj.factoryRef, deps);
                            }
                            else if(obj && obj.proto)
                            {                                    
                                deps.push(obj.proto);
                            }                                
                        }
                    }                
                }                                             
            }
        }
        return deps;
    };          
    
    ns.AppContext.prototype.parseArgs = function(args)
    {        
        var callback;
        if(typeof args[args.length - 1] == "function")
        {
            callback = args.pop();
        }
        
        
       
        
    };
})(window, inverted);