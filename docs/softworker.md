# Soft in the worker scope

When defining a worker used as entrypoint it should be defined as a ```proto``` as it does not have the desired effect if created as a singleton. This proto must however always return a specific interface in the form of an object. The object must contain one function, ```connect(connection)```. The function is called when a post from the main thread is done. The connection object contains the following properties.  
  
```payload``` - The passed object from the parent context.  
```port.post(responseObject)``` - Callback to parent thread. This follows an promise like structure and should only be called once per request.  
  
  The worker used as entrypoint can in turn implement any other modules that dont implement this interface. The ```$gmn``` object is smaller and only contains applicable functions. The ```master``` object does not provide support for ```fragment```.
  
  **Worker scope js example**

```
export default function(master) {

    return master.proto(['somemodule'], 
    
    function (somemodule) {

        return {
            connect: connection => {
                connection.port.post(
                    somemodule.calculate(
                        connection.payload)
                );
            }
        };
    });
};
```

See modules section [here](modules.md) about ```$workerpool``` and ```xworker``` for details on calling side implementation.

# Softworkerconfig.json
This config must also be provided if workers are to be used. It must provide a basepath for the workers and the modules you will be referencing. It works the same way the ```softconfig``` does and should be supplied next to it.
```
{
    "scriptPath": "/mysite/js/workers",
    "modules": {
        "someworkermod": "somepath/somemod.js",
        "somemodule": "somemodule.js"
    }
}
```