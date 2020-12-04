# Framework modules

These are modules from the framework that can be referenced. The reference must be preceeded by '$'.
```
export default function (master) {
    return master.proto(['$workerpool'], function (pool) { // ...
```

# $eventhandler

The framework eventhandler. No instatition arguments.

#### ```eventhandler.dispatch(eventname, eventobject?)```

- Dispatches an event, the optional eventobject argument can be anything and will be wrapped in the event object.

#### ```eventhandler.listen```

- The listener functions.

    #### ```listen.on(eventName, listener)```

    - Attaches a listener, the listener takes the event object as argument. Returns the listener.

    #### ```listen.once(eventName, listener)```

    - Works as the on function, but the listener will only be called once and the deregistered from the handler. Returns the listener.

    #### ```listen.un(eventName, listener)```

    - Removes the specified listener from the specified eventtype.

    #### ```listen.get(eventName)```

    - Gets all listeners for given type.

    #### ```listen.count(eventName)```

    - Returns listener count for given type.

```
const events  = $eventhandler.construct();
const listener = events.listen.on('stuff', e => alert(e.event));

events.dispatch('stuff', 'Hello!');
events.un('stuff', listener);
```
## The event object

Wrapper for the event argument.

#### ```event.resume()```

- Lets the event propagate, useful if you need a subsequent listener to run before further processing or if propagation has been previously stopped.

```
events.listen.on('stuff', e => {

    document.onclick = () => e.resume(); // <-- resumes propagation.

    return false; // <-- stops propagation
});
```
# $workerpool

Provides access to a arbitary size pool of [workers](https://html.spec.whatwg.org/multipage/workers.html#workers), it can be used to easily construct and destruct workers, it also balances workload on a fixed amount of workers by queueing strategies.  
The worker that is referenced must be as described [here](readme.md).


## WorkerPool
---
The actual pool, used to build and access workers. Instances are created via a factory method. It has the following methods.

#### ```build(count)```

- Builds a new internal pool of the given size. Returns self.

#### ```available()```

- Gets the number of currently available workers (workers not currently assigned).

#### ```aquire()```

- Gets a worker, an exception is raised if none are available.

#### ```release()```

- Releases the current internal pool, all workers are destroyed in the process.

#### ```request()```

- Requests a worker promise style. If one is free it is assigned immediately, otherwise one will be assigned when available.

```
const workerpool = pool.construct().build(3);

pool.request().then(async worker => {

    await worker.connect('path-to-cool-worker.js');
    // ...
});
```

## XWorker
---
The wrapped worker returned on requesting or aquiring a worker. This is used for all interactions with the worker. It contains the following methods.

#### ```async connect(mainmodule, options)```

- Connects to worker. Mainmodule is the relative path to the worker and options are an object with the following properties:  
```config``` optional, location of all configs. Defaults to site root.  
```baseUrl``` optional, base url for all worker code. Can be set in config. Defaults to site root.  

#### ```async post(message)```

- Posts a message to the worker. Returns any response asynchronosly.

#### ```release()```

- Releases the worker back to the pool.

```
pool.request().then(worker => {

    worker.connect('/worker.js').then(() => {
        worker.post(someData).then(data => {
            worker.release(); //<-- or keep it around if it suits your needs.
            ....
        })
    });
});
```

# $gmn utilities

Contains a couple of small helpers, **$gmn** is available globally.

#### ```$gmn.canvas(options)```

Canvas construction helper, returns a canvas that can be bound to resize with parent and raise events on post resize. Also adds a shortcut to context on the canvas, .ctx(). The options object:
```
{
    matchParent: true, /* will set size to cover parent * /
    autoResize: true, /* will resize if parent resizes. */
    resizeCallback: canvas => {}, /* called post resize */
    width: 0, /* overriden by matchParent */
    height: 0  /* overriden by matchParent */
}
```