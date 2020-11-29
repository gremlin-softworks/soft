export default function(context) {

    const master = context.master;
    const config = context.config;
    const instancePromises = [];
    let loadedCustomElements = 0;
    const views = { 
        __count: 0, 
        __templateRoot: document.createElement('span', { id: '__templateRoot' }) 
    };

    const registerTemplate = (markup, css) => {
        const basePath = (config.scriptPath ? config.scriptPath : context.baseUrl);
        const id = 'soft_template_' + (views.__count++);
        const styles = '<style>{0}</style>'.format(config.commonCss.concat(css
            .map(e => '{0}{1}?cache={2}'.format(basePath, e, $gmn.start)))
            .map(e => '@import url("{0}");'.format(e)).join(''));

        views.__templateRoot.innerHTML += '<template id="{0}">{1}{2}</template>'.format(id, styles, markup);

        return id;
    };

    const incrementRegistry = () => ++loadedCustomElements === Object.keys(config.fragments).length ?
        instancePromises.forEach(e => e()) : null;

    const safeInstance = () => new Promise(resolve => 
        loadedCustomElements >= Object.keys(config.fragments).length ?
            resolve() : instancePromises.push(resolve));

    return (meta, modules, defintion) => {
        return new Promise(resolve => {
            master.singleton(modules, defintion).then(module => {
                fetch($gmn.combine(config.scriptPath ? config.scriptPath : context.baseUrl, meta.template + '?cache=' + $gmn.start)).then(e => e.text()).then(html => {
                    master.proto(['$eventhandler', '$evaluator'], (eventhandler, evaluator) => {
    
                        const id = registerTemplate(html, meta.css);
                        const sftrp = []; // clean up with mutator? can leak memory if elements are removed from higher up in the tree?
    
                        const softbind = (root, data) => {
                            root._scope = data;
    
                            const forcurse = element => {
                                element.querySelectorAll('[soft-for]').forEach(el => {
                                    forcurse(el);
                                    if (el.parentNode) {
                                        const holder = document.createElement('span');
                                        holder.className = 'softrepeat__';
                                        holder.setAttribute('_sftrp', sftrp.length);
                                        sftrp.push(el);
                                        el.parentNode.insertBefore(holder, el);
                                        el.parentNode.removeChild(el);
                                    }
                                });
                            };
    
                            forcurse(root);
    
                            root.querySelectorAll('.softspan__').forEach(e => e.target = e.innerHTML.split('.'));
    
                            root.querySelectorAll("[soft-click]").forEach(e => e.addEventListener('click', () => evaluator.evaluate(e.getAttribute('soft-click'), data)));
    
                            root.querySelectorAll("[soft-on]").forEach(e => {
                                const args = e.getAttribute('soft-on').split(':');
                                e.addEventListener(args[0], () => evaluator.evaluate(args[1], data));
                            });
    
                            root.querySelectorAll("[soft-on-event]").forEach(e => {
                                e.getAttribute('soft-on-event').split('|').forEach(x => {
                                    const args = x.split(':');
                                    e.addEventListener(args[0], e => evaluator.evaluate(args[1], data)(e));
                                });
                            });
    
                            root.querySelectorAll('[soft-model]').forEach(e => {
                                e.value = evaluator.evaluate(e.getAttribute('soft-model'), data);
                                ['change', 'keyup', 'paste'].forEach(event => 
                                    e.addEventListener(event, () => evaluator.property(e.getAttribute('soft-model'), e.value, data))
                                );
                            });
                        };
    
                        const scopemerge = (element, data) => {
                            while (element = element?.parentNode) {
                                if (element._scope) {
                                    data = Object.assign({}, element._scope, data);
                                }
                            }
                            return data;
                        };
    
                        const climb = (element, value) => {
                            while (element = element?.parentNode || element?.host) {
                                if (element._scope) {
                                    const val = evaluator.evaluate(value, element._scope);
                                    if (val !== undefined) {
                                        return val;
                                    }
                                }
                            }
                        };
    
                        class FragmentElement extends HTMLElement {
    
                            constructor() {
    
                                super();
    
                                const template = views.__templateRoot.querySelector('#' + id);
                                template.innerHTML = template.innerHTML.replace(/\{\{([\sa-zA-Z0-9_.]+)\}\}/g, (_, e) => '<span class="softspan__">{0}</span>'.format(e.trim()));
                                //template.innerHTML = template.innerHTML.replace(/<!--(.*?)-->/g, '');
    
                                const clone = template.content.cloneNode(true);
                                const root = this.attachShadow({ mode: 'open' });
    
                                this._events = eventhandler.construct();
                                this._data = null;
                                this._root = root;
                                this.$attributes = {};
    
                                root.appendChild(clone);
    
                                const dirty = () => dirty.set ? null : dirty.set = setTimeout(() => {
                                    this.refresh();
                                    dirty.set = null;
                                });
    
                                const change = (source, root) => {
                                    return {
                                        get: (target, property) => {
                                            dirty();
                                            return target[property];
                                        },
                                        set: (target, property, value, receiver) => {
                                            const old = target[property];
                                            target[property] = value;
                                            dirty();
                                            const data = source();
                                            if (data) {
                                                root.querySelectorAll('[soft-class]').forEach(e => {
                                                    e.getAttribute('soft-class').split(';').forEach(x => {
                                                        const src = x.split(':');
                                                        if (src.length === 1) {
                                                            e.classList.remove(old);
                                                        }
                                                    })
                                                });
                                                root.querySelectorAll('[soft-model]').forEach(e => {
                                                    let softtarget = e.getAttribute('soft-model').split('.');
                                                    const prop = softtarget.pop();
                                                    softtarget = softtarget.length === 0 ? self : evaluator.evaluate(softtarget.join('.'), data);
    
                                                    if (target === softtarget && prop === property) {
                                                        e.value = value;
                                                    }
                                                });
                                            }
                                            return true;
                                        }
                                    };
                                };
    
                                safeInstance().then(() => {
                                    for (let i = 0; i < this.attributes.length; i++) {
                                        const attribute = this.attributes[i];
                                        if (attribute.value.startsWith('{') && attribute.value.endsWith('}')) {
                                            const value = attribute.value.substring(1, attribute.value.length - 1).trim();
                                            this.$attributes[attribute.name] = climb(this, value);
                                        }
                                        else {
                                            this.$attributes[attribute.name] = attribute.value;
                                        }
                                    }
                                    const proxy = new Proxy(this, change(() => this._data, this._root));
                                    this._data = module.instance(root, proxy) || proxy;
                                    softbind(this._root, this._data);
    
                                    dirty();
                                });
                            }
    
                            get listen() {
                                return this._events.listen;
                            }
    
                            get soft() {
                                return this._data;
                            }
    
                            dispatch(event, data) {
                                return this._events.dispatch(event, data);
                            }
    
                            refresh(root, data) {
    
                                root = root || this._root;
                                data = data || this._data;
    
                                const isCurrentStack = element => {
                                    let track = element;
                                    while ((track = track.parentNode) && track !== root) {
                                        if (track._scope) {
                                            return false;
                                        }
                                    }
                                    return true;
                                };
    
                                if (data) {
                                    root.querySelectorAll('.softspan__').forEach(e => {
                                        if (isCurrentStack(e)) {
                                            if (e.target) {
                                                e.innerHTML = e.target.track(data);
                                            }
                                        }
                                    });
    
                                    root.querySelectorAll('[soft-show]').forEach(e => {
                                        if (isCurrentStack(e)) {
                                            if (!evaluator.evaluate(e.getAttribute('soft-show'), data)) {
                                                e._style = e._style || {};
                                                e._style.display = e._style.display ?? e.style.display;
                                                e.style.display = 'none';
                                            }
                                            else {
                                                if (e.style.display == 'none') {
                                                    e.style.display = e._style?.display;
                                                    e._style.display = null;
                                                }
                                            }
                                        }
                                    });
    
                                    root.querySelectorAll('[soft-class]').forEach(e => {
                                        if (isCurrentStack(e)) {
                                            e.getAttribute('soft-class').split(';').forEach(x => {
                                                const pair = x.split(':');
                                                const cls = evaluator.evaluate(pair[0], data);
                                                const add = pair.length > 1 ? evaluator.evaluate(pair[1], data) : true;
                                                add ? e.classList.add(cls) : e.classList.remove(cls);
                                            });
                                        }
                                    });
    
                                    root.querySelectorAll('.softrepeat__').forEach(element => {
                                        if (isCurrentStack(element)) {
                                            const template = sftrp[element.getAttribute('_sftrp')];
                                            const args = template.getAttribute('soft-for').split(':');
                                            const source = evaluator.evaluate(args[1], data);
                                            
                                            let container = element.querySelector('._sftrp_in');
    
                                            if (!container) {
                                                container = document.createElement('span');
                                                container.className = '_sftrp_in';
                                                element.appendChild(container);
                                            }
                                            
                                            const collection = [].slice.call(element.children[0]?.children || []).map(x => ({ keep: false, item: x }));
    
                                            source.forEach((x, i) => {
                                                const contender = collection.find(o => o.item._scope?.[args[0]] === x);
    
                                                if (contender) {
                                                    contender.keep = true;
                                                    this.refresh(contender.item, contender.item._scope);
                                                }
                                                else {
                                                    const that = scopemerge(element, { [args[0]]: x, 'self': this._data });
                                                    const el = template.cloneNode(true);
                                                    softbind(el, that);
                                                    this.refresh(el, that);
                                                    container.appendChild(el);
                                                }
                                            });
    
                                            collection.forEach(x => {
                                                if (!x.keep) {
                                                    container.removeChild(x.item);
                                                    //todo: remove from sftrp?
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        }
    
                        window.customElements.define(meta.selector, FragmentElement);
    
                        incrementRegistry();
            
                    }).then(() => resolve(module));
                });
            });
        });
    }
} 
