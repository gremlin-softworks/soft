$gmn = {

    _path: (this.document?.currentScript.src || this.location.pathname).split('?')[0].split('/').slice(0, -1).join('/'),

    start: Date.now(),

    events: null,

    canvas: null,

    isWorker: !this.window,

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
                    let count = 0;

                    keys.forEach(key => $gmn.import($gmn.combine(config.scriptPath ?? baseUrl, config.fragments[key] + '?cache=' + $gmn.start)).then(md => {
                        new md.default(master).then(() => ++count === keys.length ? resolve() : null);
                    }));

                    if (!keys.length) {
                        resolve();
                    }
                });
            });
        };

        const buildFramework = async () => 
            Promise.all(($gmn.isWorker ? ['proto', 'singleton'] : ['proto', 'fragment', 'singleton']).map(key => $gmn.import($gmn.combine($gmn._path, key + '.js?cache=' + $gmn.start)).then(md => {
                master[key] = md.default({
                    resolveLocation, master, config, baseUrl
                });
            })));
 
        const master = Object.assign(args || {}, {

            app: async (modules, defintion) => {
                await fetch($gmn.combine(configPath, 'softconfig.json?cache=' + $gmn.start))
                    .then(e => e.json().then(e => config = e));

                await buildFramework();
                await importResources();

                setTimeout(() => $gmn.events.dispatch('fragments:loaded'));

                return master.proto(modules, defintion);
            },

            worker: async mainmodule => {

                await fetch($gmn.combine(configPath, 'softworkerconfig.json?cache=' + $gmn.start))
                    .then(e => e.json().then(e => config = e));

                await buildFramework();
                
                return master.proto([mainmodule], function (mainmod) {

                    const worker = data => {
                        const id = data.id;

                        mainmod.connect({ payload: data.payload, port: { post: reply => {
                            postMessage({
                                id: id,
                                payload: reply
                            });
                        }}});
                    };

                    $gmn._workers.push(worker);
                });
            }
        });

        return master;
    },

    _workers: [],

    _onmessage: this.onmessage = !this.window ? message => {
        if (message.data.payload.$init) {
            $gmn.master(message.data.payload.$init.options).worker(message.data.payload.$init.mainmodule);
            postMessage({
                id: message.data.id,
                payload: { connected: true }
            });
        }
        else {
            $gmn._workers.forEach(e => e(message.data));
        }
    } : undefined,

    import: !this.window && navigator.userAgent.toLowerCase().indexOf('firefox') > -1 ? (() => function(url) {
        return new Promise((resolve, reject) => {
            fetch(url).then(e => e.text().then(e => {
                const index = e.indexOf('export default ');
                resolve({ default: new Function('return ' + e.substring(index + 15))()});
            }, e => reject(e)), e => reject(e));
        })
    })() : url => import(url)
    
    /* moz cant do dynamic module import in worker context, any regular module imports will fail :(
       any trailing exports will cause exceptions */
};
