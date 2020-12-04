(() => {

    const workers = [];
    
    const scriptPath = this.location.pathname.split('?')[0].split('/').slice(0, -1).join('/');

    $gmn = {
    
        start: Date.now(),
    
        combine: (...parts) => parts.join('/').split('/').filter((e, i) => !i || e.length).join('/'),
    
        master: function (args = { baseUrl: '/' }) {
            
            const baseUrl = args.baseUrl;
            const configPath = args.config || baseUrl;
     
            let config = Object.call(null);
    
            const url = uri => {
                const result = $gmn.combine(config.scriptPath ? config.scriptPath : baseUrl, config.modules[uri] || uri);
                const hasExtension = (result.length > 4 && result.indexOf('.mjs') === result.length - 4) || 
                    (result.length > 3 && result.indexOf('.js') === result.length - 3);
    
                return (hasExtension ? result : result + '.js') + '?id=' + $gmn.start;
            };

            const resolveLocation = uri => uri.startsWith('$') ? fromFramework('/mods/' + uri.substring(1)) : url(uri);

            const fromFramework = uri => $gmn.combine($gmn._path, uri.substring(1)) + '.js';

            const buildFramework = async () => 
                Promise.all(['proto', 'singleton'].map(key => $gmn.import($gmn.combine(scriptPath, key + '.js?cache=' + $gmn.start)).then(md => {
                    master[key] = md.default({
                        resolveLocation, master, config, baseUrl
                    });
                })));
     
            const master = Object.assign(args || {}, {
    
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

                        workers.push(worker);
                    });
                }
            });
    
            return master;
        },

        import: navigator.userAgent.toLowerCase().indexOf('firefox') > -1 ? (() => function(url) {
            return new Promise((resolve, reject) => {
                fetch(url).then(e => e.text().then(e => {
                    const index = e.indexOf('export default ');
                    resolve({ default: new Function('return ' + e.substring(index + 15))()});
                }, e => reject(e)), e => reject(e));
            })
        })() : url => import(url) // moz cant do dynamic module import in worker context, any regular module imports will fail :(
    };

    this.onmessage = message => {
        if (message.data.payload.$init) {
            $gmn.master(message.data.payload.$init.options).worker(message.data.payload.$init.mainmodule);
            postMessage({
                id: message.data.id,
                payload: { connected: true }
            });
        }
        else {
            workers.forEach(e => e(message.data));
        }
    };
})();