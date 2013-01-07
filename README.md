#Inverted: Javascript IOC Container

See [philmander.github.com/inverted](http://philmander.github.com/inverted/) for complete end user documentation.

##Quickstart

Runs in the browser and Node.js

Download source

[Minified (~4.8kb/~1.7kb gzipped)](https://raw.github.com/philmander/inverted/master/lib/inverted-min.js)

[Uncompressed](https://raw.github.com/philmander/inverted/master/lib/inverted.js)

or

```
npm install inverted
```

In the browser, Inverted depends on a module loader being present. Out of the box it will work with 
[RequireJS](http://requirejs.org) or [Curl](https://github.com/cujojs/curl). Inverted uses
a module loader to load modules and should be loaded with an AMD module loader itself. For example:

```html

<script src="require.js"></script>
<script>
requirejs.config({
  baseUrl: "/src",
  paths: {
      inverted : "/lib/inverted-min"
  }
});
  
require("inverted", "app-config", function(inverted, appConfig) {
  
  var appContext = inverted.create(appConfig);
  appContext.getProto("protoId", function(obj){
    obj.doStuff();
  });
});
</script>


```

##Issues and discussion

Please use the Github issue tracker for this project to raise bugs, feature requests or just ask a question.

##Project organization

###/src
Core source code is here, split into two sub directories:

* __package__ Files used added to the core source code to create a working build
* __inverted__ The Inverted JS modules, _AppContext_ and _ProtoFactory_

###/lib 
Final builds are placed here

###/test
Inverted's unit tests written in QUnit (with support from Q2Junit) are here

###/support
Additional libraries in Javascript and Java for build and testing

##How to build

Inverted is built using Ant. The build performs the following steps:

1. Lints the source code using JSHint.
2. Runs the unit tests in Phantom JS
3. Concatenates the source files to create an unminified build
4. Compresses the unminified build using Google Closure compiler 

To perform install [Apache Ant](http://ant.apache.org/bindownload.cgi) on your path and, in the project root directory, run:

```
ant
```

or to run a build that includes a version number in the build's source 

```
ant -Dversion=[version]
```

<small>NB. To run on a system other than Windows you will currently need to update the ant test runner config to point 
to a platform specific version of Phantom JS</small>
