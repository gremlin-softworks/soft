export default function(master) {
    return master.singleton([], function () {
        return options => {
            const canvas = document.createElement('canvas');
    
            if (options && options.matchParent) {
                const parent = options.parent.getBoundingClientRect();
                canvas.width = parent.width;
                canvas.height = parent.height;
            }
            else if (options && (options.width || options.height)) {
                canvas.width = options.width || 0;
                canvas.height = options.height || 0;
            }
            if (options && options.autoResize) {
                const listener = () => {
                    const bounds = options.parent.getBoundingClientRect();
                    canvas.width = bounds.width;
                    canvas.height = bounds.height;
    
                    if (options.resizeCallback) {
                        options.resizeCallback(canvas);
                    }
                };
                window.addEventListener('resize', listener);
            }
            if (options.parent) {
                options.parent.appendChild(canvas);
            }
            return Object.assign(canvas, { ctx: () => canvas.getContext('2d') });
        }
    })
}