export default function(context) {
    return async (modules, defintion) => new Promise(resolve => {
        if (modules.length === 0) {
            resolve(defintion.call({}))
        }
        else {
            const mods = [];
            let count = 0;
            modules.forEach((uri, index) => $gmn.import(context.resolveLocation(uri)).then(md => {
                new md.default(context.master).then(mod => {
                    mods[index] = mod;
                    if (++count === modules.length) {
                        resolve(defintion.call({}, ...mods));
                    } 
                });
            }));
        }
    });
}