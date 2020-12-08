String.prototype.format = function () {
    return this.replace(/\{\{|\}\}|\{([a-zA-Z0-9_]+)\}/g, (bracks, index) => 
        ((bracks == "{{") ? "{" : ((bracks == "}}") ? "}" : arguments[index])));
};

ShadowRoot.prototype.softSelector = Element.prototype.softSelector = function() {
    const el = this.querySelector(...arguments);
    return el?.soft || el;
};

ShadowRoot.prototype.softSelectorAll = Element.prototype.softSelectorAll = function() {
    return this.querySelector(...arguments).map(x => x?.soft || x);
};

window.$gmn = {

    _path: document.currentScript.src.split('?')[0].split('/').slice(0, -1).join('/'),

    start: Date.now(),

    import: url => import(url),

    events: null,

    canvas: null,

    combine: (...parts) => parts.join('/').split('/').filter((e, i) => !i || e.length).join('/'),

    master: function (args = {}) {
        
        const baseUrl = args.baseUrl || window.location.pathname;
        const configPath = args.config || baseUrl;

        let config = Object.call(null);

        const resolveLocation = uri => uri.startsWith('$') ? fromFramework('/mods/' + uri.substring(1)) : url(uri);

        const fromFramework = uri => $gmn.combine($gmn._path, uri.substring(1)) + '.js';

        const url = uri => {
            const result = $gmn.combine(config.scriptPath ?? baseUrl, config.modules[uri] || uri);
            const hasExtension = result.endsWith('.js') || result.endsWith('.mjs');

            return (hasExtension ? result : result + '.js') + '?id=' + $gmn.start;
        };

        const importResources = () => {
            return new Promise(resolve => {
                master.proto(['$eventhandler', '$canvas'], (eventhandler, canvas) => {

                    $gmn.events = $gmn.events || eventhandler.construct();
                    $gmn.canvas = canvas;

                    const keys = Object.keys(config.fragments);
                    const basePath = (config.scriptPath ? config.scriptPath : baseUrl);
                    let count = 0;

                    keys.forEach(key => $gmn.import($gmn.combine(basePath, config.fragments[key] + '?cache=' + $gmn.start)).then(md => {
                        new md.default(master).then(mod => ++count === keys.length ? resolve() : null);
                    }));

                    if (!keys.length) {
                        resolve();
                    }
                });
            });
        };

        const buildFramework = async () => 
            Promise.all(['proto', 'fragment', 'singleton'].map(key => $gmn.import($gmn.combine($gmn._path, key + '.js?cache=' + $gmn.start)).then(md => {
                master[key] = md.default({
                    resolveLocation, master, config, baseUrl
                });
            })));
 
        const master = Object.assign(args || {}, {

            app: async (modules, defintion) => {
                await fetch($gmn.combine(configPath, 'softconfig.json?cache=' + $gmn.start)).then(e => e.json().then(e => config = e));
                await buildFramework();
                await importResources();

                setTimeout(() => $gmn.events.dispatch('fragments:loaded'));

                return master.proto(modules, defintion);
            }
        });

        return master;
    }
};
