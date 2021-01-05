export default function(master) {
    /* todo, change to proto in order to allow multiple apps in the same doc */
    return master.singleton(['$evaluator'], function (evaluator) {

        const cache = [];

        const softbind = (root, data) => {
            root._scope = data;

            const forcurse = element => {
                element.querySelectorAll('[soft-for]').forEach(el => {
                    forcurse(el);
                    if (el.parentNode) {
                        const holder = document.createElement('span');
                        holder.className = 'softrepeat__';
                        holder.setAttribute('_sftrp', cache.length);
                        cache.push(el);
                        el.parentNode.insertBefore(holder, el);
                        el.parentNode.removeChild(el);
                    }
                });
            };

            forcurse(root);

            root.querySelectorAll('.softspan__').forEach(e => e.target = e.innerHTML.split('.'));

            root.querySelectorAll("[soft-click]").forEach(e => e.addEventListener('click', () => evaluator.evaluate(e.getAttribute('soft-click'), data)));

            root.querySelectorAll("[soft-on]").forEach(e => {
                e.getAttribute('soft-on').split(';').forEach(x => {
                    const args = x.trim().split(':');
                    e.addEventListener(args[0], () => setTimeout(() => evaluator.evaluate(args[1], data)));
                });
            });

            root.querySelectorAll("[soft-on-event]").forEach(e => {
                e.getAttribute('soft-on-event').split(';').forEach(x => {
                    const args = x.trim().split(':');
                    e.addEventListener(args[0], e => {
                        e.soft = data;
                        return evaluator.evaluate(args[1], data)(e);
                    });
                });
            });

            root.querySelectorAll('[soft-model]').forEach(e => {
                if (e.type === 'checkbox') {
                    e.checked = !!evaluator.evaluate(e.getAttribute('soft-model'), data);
                } else {
                    e.value = evaluator.evaluate(e.getAttribute('soft-model'), data);
                }
                ['change', 'keyup', 'paste'].forEach(event => 
                    e.addEventListener(event, () => evaluator.property(e.getAttribute('soft-model'), 
                        e.type === 'checkbox' ? e.checked : e.value, data))
                );
            });

            root.querySelectorAll('[soft-enabled]').forEach(e => {
                e.disabled = !evaluator.evaluate(e.getAttribute('soft-enabled'), data);
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

        const isCurrentStack = (element, root) => {
            let track = element;
            while ((track = track.parentNode) && track !== root) {
                if (track._scope) {
                    return false;
                }
            }
            return true;
        };

        const tags = (root, data) => root.querySelectorAll('.softspan__').forEach(e => {
            if (isCurrentStack(e, root)) {
                if (e.target) {
                    e.innerHTML = e.target.track(data);
                }
            }
        });

        const shows = (root, data) => root.querySelectorAll('[soft-show]').forEach(e => {
            if (isCurrentStack(e, root)) {
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

        const classes = (root, data) => root.querySelectorAll('[soft-class]').forEach(e => {
            if (isCurrentStack(e, root)) {
                e.getAttribute('soft-class').split(';').forEach(x => {
                    const pair = x.split(':');
                    const cls = evaluator.evaluate(pair[0], data);
                    const add = pair.length > 1 ? evaluator.evaluate(pair[1], data) : true;
                    add ? e.classList.add(cls) : e.classList.remove(cls);
                });
            }
        });

        const enableds = (root, data) => root.querySelectorAll('[soft-enabled]').forEach(e => {
            if (isCurrentStack(e, root)) {
                e.disabled = !evaluator.evaluate(e.getAttribute('soft-enabled'), data);
            }
        });

        const models = (root, data) => root.querySelectorAll('[soft-model]').forEach(e => {
            if (isCurrentStack(e, root)) {
                if (e.type === 'checkbox') {
                    e.checked = !!evaluator.evaluate(e.getAttribute('soft-model'), data);
                } else {
                    e.value = evaluator.evaluate(e.getAttribute('soft-model'), data);
                }
            }
        });

        const repeaters = (root, data) => root.querySelectorAll('.softrepeat__').forEach(element => {
            if (isCurrentStack(element, root)) {
                const template = cache[element.getAttribute('_sftrp')];
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
                        all(contender.item, contender.item._scope);
                    }
                    else {
                        const that = scopemerge(element, { [args[0]]: x, 'self': data });
                        const el = template.cloneNode(true);
                        softbind(el, that);
                        all(el, that);
                        container.appendChild(el);
                    }
                });

                collection.forEach(x => {
                    if (!x.keep) {
                        container.removeChild(x.item);
                        //todo: remove from sftrp, or use mutator
                    }
                });
            }
        });

        const all = (root, data) => {
            tags(root, data);
            shows(root, data);
            classes(root, data);
            models(root, data);
            enableds(root, data);
            repeaters(root, data);
        };

        return {
            blow: (root, data) => all(root, data),
            softbind: (root, data) => softbind(root, data)
        };
    })
}