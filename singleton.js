export default function(context) {

    const singletons = {};
    const singletonLoadQueue = {};

    return async (modules, defintion) => new Promise(resolve => {
        if (singletons[defintion]) {
            resolve(singletons[defintion]);
        }
        else if (modules.length === 0) {
            singletons[defintion] = defintion.call({});
            resolve(singletons[defintion]);
        }
        else if (singletonLoadQueue[defintion]) {
            singletonLoadQueue[defintion].push(() => resolve(singletons[defintion]));
        }
        else {
            const mods = [];
            let count = 0;
            singletonLoadQueue[defintion] = [() => resolve(singletons[defintion])];

            modules.forEach((uri, index) => $gmn.import(context.resolveLocation(uri)).then(md => {
                new md.default(context.master).then(mod => {
                    mods[index] = mod;

                    if (++count === modules.length) {
                        singletons[defintion] = defintion.call({}, ...mods);
                        resolve(singletons[defintion]);

                        while (singletonLoadQueue[defintion]) {
                            singletonLoadQueue[defintion].pop()();

                            if (!singletonLoadQueue[defintion].length) {
                                delete singletonLoadQueue[defintion];
                            }
                        }
                    }
                });
            }));
        }
    });
} 