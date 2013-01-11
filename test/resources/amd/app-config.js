define(function() {
    return {
        injectAppContext: true,
        protos: {
            a : {
                module: "A",
                args: [
                    "*b"
                ]
            },
            a2 : {
                module: "A",
                args: [
                        "*b2"
                ],
                injectAppContext: false
            },
            b: {
                module: "B",
                args: [
                    "Geoff Capes",
                    "*c"
                ]
            },
            b2: {
                module: "B",
                args: [
                    "Tony Blair",
                    "*c"
                ]
            },
            b3: {
                module: "B",
                props: {
                    util: "*myUtil"
                }
            },
            c: {
                module: "C",
                args: ["String", 99, true, null ]
            },
            c2: {
                module: "C",
                args : [ "String", {
                    factoryRef : "myFactory",
                    factoryMethod : "createNumber"
                },
                true,
                null]
            },
            d: {
                module: "D",
                props : {
                    number : 88,
                    str : "hi",
                    bool : false,
                    nully : null,
                    b: "*b2",
                    setter: "set"
                }
            },
            d2: {
                module: "D",
                props: {
                    b: "*b"
                },
                scope: "singleton"
            },
            d3: {
                module: "D",
                scope: "static"
            },
            d4: {
                module: "D",
                extendsRef: "a"
            },
            e: {
                module: "E",
                args: [{
                    str: "str",
                    number: 77,
                    obj: "*c",
                    bool: true,
                    nully: null
                }]
            },
            myFactory: {
                module: "MyFactory",
                scope: "singleton"
            },
            myUtil: {
                module: "MyUtil",
                scope: "singleton"
            },
            anotherUtil: {
                module: "MyUtil"
            },
            jquery: {
                module: "jquery",
                scope: "static"
            },
            f: {
                module: "F",
                props: {
                    $: "*jquery"
                }
            },
            circular1: {
                module: "A",
                props: {
                    a: "*circular2"
                }
            },
            circular2: {
                module: "A",
                props: {
                    a: "*circular1"
                }
            },
            x: {
                module: "X" //shouldn't exist
            },
            passingInterfaceProto: {
                module: "a",
                args: [
                    "*anotherUtil [typeUtil]"
                ],
                props: {
                    util: "*anotherUtil[ typeUtil , numberUtil ]"
                },
                extendsRef: "anotherUtil[typeUtil]"
            },
            failingInterfaceProto: {
                module: "a",
                props: {
                    util: "*anotherUtil [ numberUtil, animalUtil ]"
                }
            }
        },
        interfaces: {
            //spacing is important between method names to test the splitting regex
            typeUtil: "isNumber, isFunction , isArray",
            numberUtil: "isNumber",
            animalUtil: "isJellyfish,isTiger"
        }
    };
});