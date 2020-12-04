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
                    master.proto(['$eventhandler', '$evaluator', '$cyclone'], (eventhandler, evaluator, cyclone) => {
    
                        const id = registerTemplate(html, meta.css);
    
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

                        /* mind the repeater problem. 1st instance is by touch in template */
    
                        class FragmentElement extends HTMLElement {
    
                            constructor() {
    
                                super();
    
                                const template = views.__templateRoot.querySelector('#' + id);
                                template.innerHTML = template.innerHTML.replace(/\{\{([\sa-zA-Z0-9_.]+)\}\}/g, (_, e) => '<span class="softspan__">{0}</span>'.format(e.trim()));
    
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
                                    const proxy = new Proxy(this, {
                                        get: (target, property) => {
                                            dirty();
                                            return target[property];
                                        },
                                        set: (target, property, value, receiver) => {
                                            target[property] = value;
                                            dirty();
                                            return true;
                                        }
                                    });
                                    this._data = module.instance(root, proxy) || proxy;
                                    cyclone.softbind(this._root, this._data);
    
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
                                
                                cyclone.blow(root || this._root, data || this._data);
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
