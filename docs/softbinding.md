# Soft and DOM

## Markup

Markup is provided in fragment templates, fragment templates are html files. Fragments can be referenced out of scope (these will become entrypoints), but at this level they cannot be bound to any data as they are at top level. This is usually how you add an soft app to your main markup file, for example index.html.
```
...
<body>
    <main-view></main-view>
</body>
...
````

## Basic access

The access to the bound module from markup is done through the proxy object ```self``` passed to the fragment implementation. The bound object can be accessed in markup via different references and applied in functions.  
  
Access to dom from the bound module is done usually done by softSelector or softSelectorAll when you need to access bound data. ```root``` is an element and can of course be queried normally for other purposed, but this querydata is also included in the softSelectors.  
  

```
root.softSelector('.main-drop').soft.setMyThing('hello');
```
```
root.softSelector('.main-drop').classList.add(''myclass');
```

# Bindings
There are various ways the fragment module can be bound, the are listed here.


## Variable injection
Variables can be injected via statements in ```{{ datablock }}``` blocks. Soft uses a special intepretator for the statements and the are bound the the scopes they appear in and upp to parent scopes.  

**Examples**  
```
<p>Price {{ getPrice() || 'Its free!' }}</p>
```
```
<p>Sum {{ client.getSum() + ' ' + client.getCurrency() }}</p>
```

## Attribute injection
Variables can be injected in attributes. These can be accessed in the fragment in self.$attributes. This is done in a ```{ datablock }```.  

**Examples**  
```
<my-mod myprop="{ items.get(5) }"></my-mod>
```
```
service.getStuff(self.$attributes.myprop);
```

## Generative iterative binding
An collection that can be iterated to create dynamic content. This is done with ```soft-for```. This creates a new scope encapsulating every item. In this scope you find the parent scope as ```self``` and the iterated item named as assigned. The for can be nested and their scopes will be available downstream.  

The statement is separated by a ```:```, the left side is assigned locally to that name. The right side is the source iterable. 

**Examples**  
```
<p soft-for="item:collection">{{ item.name }}</p>
```
```
<div soft-for="item:collection" soft-click="buy(item)">...</div>
```
```
<div soft-for="item:collection" soft-on="click:item.buy()">...</div>
```
```
<div soft-for="collection:collectionslist">
    <p soft-for="item:collection">{{ collection.indexOf(item) + item.name }}</p>
</div>
```

## Soft-click

```soft-click``` is argumented with a statement and is scoped. It fires on click.  

**Examples**  
```
<button soft-click="item.selected = canSelect(item)">Click me</button>
```
```
<button soft-click="doStuff()">Click me</button>
```


## Add scoped eventlistener
One or several eventlisteners can be attached to dom events via attributes ```soft-on``` and ```soft-on-event```. The side right side of the statement that is separated by a ```:``` is evaluated. 

```soft-on-event``` passes the event argument to the listener just as the native eventlistener. Due to this the syntax for passing the listener is done without invocation. The scope of the element raising the event can be extracted from the event object. The value must be an invocable function or arrow function.

```soft-on``` is passed with invocation and does not pass the event object. It can also be a single simple statement.

Multiple events can be targeted and the listeners are separated by a ```;```

**Examples**  
```
<div soft-on-event="mouseenter:over; mouseout:mout">Hello {{ item.name }}!</div>
```
```
<div soft-on="pointer-down:started(item)">Hi!</div>
```
```
<div soft-on="pointer-up:selected = item">Hola!</div>
```
```
<div 
    soft-class="'bright':item.highlight === true" 
    soft-on="mouseenter:item.highlight = true; mouseout:item.highlight = false">
    Hola!
</div>

```
```
self.over = e => e.soft.item.highlight = true;
```
```
self.started = item => {
    item.register();
};
```

# Model binding
## soft-model
The binding is two way the argument should be an appropriate property within ```self``` or descendants so that the proxy is triggered. Various input types may be applied.

**Examples**  
```
<input type="text" soft-model="obj.status" />
```
```
self.obj.status = 'ok';
```

# CSS Bindings

## soft-show

```soft-show``` hides or shows an element. 

**Example**  
```
<p soft-show="obj.spanish === true && obj.ok()">Hola!</p>
```

## soft-class

Css classes can be conditionally set and chained with ```;```. Both sides of the statement that is separated by a ```:``` is evaluated. So the classname can be a static reference or a dynamic on such as an function call.

**Examples**  
```
<p soft-class="'highlight':selected === item">Hola!</p>
```
```
<p soft-class="'highlight':isSelected(); 'fat':isFat()">Hello!</p>
```
```
<p soft-class="dynamicClass():active === true">Wow!</p>
```

