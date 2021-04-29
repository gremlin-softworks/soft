# Soft framework

#### Ultralight self encapsulating framework

v.0.7a

Utilizes dependency injection as the only reference method within modules that are created, apps use fragments that can act as independent applications and are bound in the DOM with custom elements.
This provides the following features:
- DOM <-> module binding using custom elements.
- DOM binding functions such as repeaters, events, dynamic classes and injection.
- CSS encapsulation for fragment modules.
- Pure html templating for fragments.
- Easy to track all (in framework) dependencies and their physical locations.
- Helps to maintain a healthy code structure, circular dependencies of any depth is disallowed.
- Framework support for singleton modules.
- Framework support for workers.
- Loads all dependencies dynamically at application start, unused modules will not be loaded.
- Module flexibility, modules may provide any type of entity for injection.

#### It does not provide:

- Http-wrapping.
- Circular dependency detection. You will be deadlocked.

# Support and limitations

Supports any modern ES6 capable browser.

If dynamic module loading support is missing in the environment (mozilla inside worker context) the framework will attempt to dirtyload the module code, stripping away any import statements and interpeting the default function. If support wont be present, only supply the default export in your modules.

# Documentation

This covers the most important bits. When using soft you need to reference soft.js and the main app(s) files. No need to reference any other modules. Framework modules are covered [here](modules.md).  
Workers for multithreading are covered [here](softworker.md) and also in the [framework modules section](modules.md).  
DOM bindings are covered [here](softbinding.md).

#### Basic components:

- **app** *Main initilaizer, will register all and call when done.*
- **fragment** *Module bound to the DOM, cannot be injected into other modules. It can be referenced instead*
- **proto** *Regular module for application logic, injected into all other types of modules.*
- **singleton** *Singleton module.*
- **master** *Master object, provides the app and the interface to create new modules.*
- **$gmn** *Provides the master object and a few structural compontents and helpers.*

  
## Including soft

Reference soft.js from the soft framwork location.

```<script type="text/javascript" src="framework/soft.js"></script>```

Reference your main app script. This should define your ```master.app``` as descibed in the next section.  

```<script type="text/javascript" src="js/main.js?id=1"></script>```  

Example index.html
```
<!doctype html>
  <head>
    <title>CrossForge</title>
    <link href="css/main.css" rel="stylesheet">
    <script type="text/javascript" src="framework/soft.js"></script>
    <script type="text/javascript" src="js/main.js"></script>
  </head>
  <body>
    <main-view></main-view>
    <hidden-view></hidden-view>
  </body>
</html>
```

## The $gmn and master object

Master is the main framwork object, its used for creating new modules (fragments, singletons or protos), $gmn also contains a limited number of utility methods. 

Apps, fragments, protos and singletons must all provide an array of dependency references and a definition function having the dependencies as arguments. For protos and singletons its what the definition returns that is injected into other modules.

Since all code is loaded as modules you can freely import external code in an traditional way. 
This is provided it's not code you want to run inside worker context on Mozilla.

```
import { jszip } from '/vendor/jszip.min.js';

export default function(master) {
    return master.singleton(['dependency'], function (dependency) {

        return class Zipper {

            static zip(files) {
                const zip = new jszip.JSZip();
                files.forEach(e => zip.file(e.name, e.data));
                return zip.generateAsync({type: 'uint8array'})
            }
        }
    });
};
```


### ```$gmn.master(options).app([dependencies], definition)```

Main initialization, the master method returns the master object that will be used in every module within the app. The definition argument to app should be a self contained module.

The app (async) function returns a promise that will be fullfilled when the full dependency chain has loaded, all fragment elements has been resolved and the app code has initialized.

The options object only contains two optional properties, the base url of the application ```baseUrl``` and the softconfig location ```config```. The softconfig must be located at the baseUrl if ```config``` is omitted, if admitted, it must be relative to the ```baseUrl```. ```baseUrl``` will default to site root.

```
$gmn.master({ baseUrl: '/app' }).app(['mymodule'], function Main(mymodule) {
    // do cool stuff
    mymodule.createInstance().run();

    // any return is void as the app cannot be injected into modules.
});
```

### ```master.fragment(meta, [dependencies], definition)```

**General**  
Creates a fragment - this is a DOM-bound component factory, in order to later instantiate from it, declare the related element in markup or create it using any element construction method refering to the chosen selector. The fragment must provide an interface providing a "instance" method having the root element as argument, this is provided via the defintion return. The instance method will be called when any instance is created. 

Any framework or app dependencies must be declared and and the defintion function should have these as arguments.

**The meta argument**  
Provide an object containing the following properties:
    
```selector``` - the selector to use in dom, for example 'app-mod' would be declared in dom as ```<app-mod ... ></app-mod>```. Important note - the selector must be provided containing an ```-```.
  
```template``` - relative url to the html template file. Note that this should be relative to the ```baseUrl``` if you have supplied one for your app.
  
  ```css``` - array of relative urls to css files to use for this scope. Note that these also should be relative to the ```baseUrl```.


**CSS**  
Any css declared in the meta object will be isolated to the fragment and the provided html template will be part of the elements shadow dom. Any querys to the fragments dom should be done on the root object as the parent is not able to access them in a regular manner (document fragmentation).

**DOM**  
The fragment module acts basically as a singleton and the defintion will only be called once.

The fragment is bound to the dom by the ```self``` object (the second instance parameter). This is a proxy object. Bind any functions or data on this that you want to expose to dom. Query the root object (the fragments dom) to access any other scoped data in child fragments or other scopes inferred (ie. using ```soft-for```). 
This is done using ```root.softSelector``` or ```root.softSelectorAll``` which are convenience methods matching ```root.querySelector``` and ```root.querySelectorAll``` but returning bound data.

```
export default function(master) {
    return master.fragment({
        selector: 'some-view',               // <-- would be <some-view>...</some-view>
        template: 'fragments/someview.html', // <-- markup, regular html (and fragments)
        css: ['fragments/someview.css']      // <-- CSS, will be isolated to this element and children
    }, 
    ['dependency'], function (dependency) {

        const goToBusiness = (root, self) => {
            /* ... */
        };

        return { // <-- returns the logical interface for connecting logic to custom elements
            instance: (root, self) => { // <-- root is the shadowroot dom and self the custom element.
                root.querySelector('#something').value = 'Hello';
                goToBusiness(root, self);
            }
        }
    });
};
```

### The ```self``` object properties and methods

#### ```$attributes``` 
- Provides object based access to attributes where attributes can be accessed as properties. For example ```self.$attributes.myname```. If the attribute is a bound variable (ie. injected in an attribute via dom, this is covered [here](softbinding.md)) the property will be the injected object. The object cannot be retrieved by querying attributes.

```
<some-mod myobj="{ obj }"></some-mod>
```
```
instance: (root, self) => { 
    doStuff(self.$attributes.myobj);
}
```

 #### ```soft``` 
 - The self object as descibed earlier. This is the second instance parameter. 

 #### ```listen``` 
- Soft-specific eventhandler. The field is read only (see modules / eventhandler for technical reference). Does not provide any dom events and the native eventhandler can absolutely be used instead if preffered. 

#### ```dispatch(event, data)``` 
- Dispatch on eventhandler.
 
 #### ```refresh(root, data)``` 
 - Refreshes the fragment. Should normally not be used as this is handled by the framework. But if data is mutated outside of proxy this forces a refresh. ```root``` and ```data``` parameters are optional and defaults to the shadowroot dom and ```self```. Supplying these will limit the refresh to given subsection (```root``` should be a child of the element that refresh is called on and ```data``` the bound data).

Fragment markup and bindings are covered in the soft binding section [here](softbinding.md).

### ```master.proto([dependencies], definition);```

Creates a regular soft-module. Must be defined in the exported default method (see example), the default method must have the master object as argument. The default method should in turn return the result of calling proto on the master object, having the dependency references and defintion as arguments.

```
export default function (master) {
    return master.proto(['dependency'], function (dependency) {

        let privateVar;

        class MyClass {

            constructor() {
                privateVar = dependency.createString('Hello world!');
            }

            show() {
                alert(privateVar);
            }
        }

        return MyClass; // <-- could for example be an instance, factory method or object instead.
    });
};
```

### ```master.singleton([dependencies], definition)```

Is defined in the same way the protos are with the exception the the protos will instantiate for every separate dependent entity, the singleton will only be instantiated once. When injected this object (or other result) will be the same in every dependent entity.

```
export default function (master) {
    return master.singleton([], function () {

        let counter = 0;

        class Counting {

            get count() {
                return counter;
            }

            increment() {
                counter++;
            }
        }

        return new Counting(); // <-- singleton
    });
};
```

# Softconfig.json

Simple and soft configuration, map explicit modules to aliases you can use in dependency references. Also set basepath for the apps scripts. Also contains declarations of fragments and global any css. Any mappings will be relative to the scriptPath.

```
{
    "scriptPath": "/mysite/js/",
    "commonCss": [
        "https://fonts.googleapis.com/css?family=Open+Sans",
        "/app/css/style.css"
    ],
    "modules": {
        "somemod": "somepath/somemod.js",
        "listitem": "listitem.js"
    },
     "fragments": {
        "main-app": "fragments/mainapp.js",
        "navbar-view": "fragments/navbarview.js"
     }
}
```
While listing modules here allows for aliases, modules may be loaded without being listed here, but a relative path to the scriptPath must be provided then in the module references when creating a app, proto or singleton. However any '.js' or '.mjs' may be omitted arbitarily in the module references. In the config the extension must be present. Loading modules outside the scriptPath is not possible. Default ```scriptPath``` is the baseUrl property of the calling app.

Fragments should be declared with selector and relative path.

