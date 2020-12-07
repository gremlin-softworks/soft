export default function(master) {
    return master.singleton(['item', '$workerpool', '$canvas'], function (Item, $workerpool, $canvas) {
        
        const worker = $workerpool.construct().build(1).aquire();

        worker.connect('workerone.js', { baseUrl: '/example' });

        const getProto = tilt => {

            const x = (Math.random()-.5) / 1000;
            const y = (Math.random()-.5) / 1000;

            return {
                canvasData: new Uint8ClampedArray(4 * 128 * 128),
                size: 128,
                extent: [
                    -0.7742 + x,
                     0.1123 + y,
                    -0.7741 + x,
                     0.1124 + y
                ],
                tilt: tilt || {
                    r: Math.round(Math.random() * 10),
                    g: Math.round(Math.random() * 10),
                    b: Math.round(Math.random() * 10)
                } 
            }
        };

        const zoom = data => {
            const z = (data.extent[2] - data.extent[0]) / 100;
            data.extent[0] -= z;
            data.extent[1] -= z;
            data.extent[2] += z;
            data.extent[3] += z;
        };

        return {
             create: seed => new Item(seed),

             canvas: async (parent, tilt) => {
                 return new Promise(resolve => {
                    worker.post(getProto(tilt)).then(item => {
                        const canvas = $canvas({ width: 128, height: 128, parent: parent });
                        canvas.ctx().putImageData(new ImageData(item.canvasData, 128), 0, 0);
                        canvas.item = item;
                        resolve(canvas);
                    });
                 });
             },

             updatecanvas: async canvas => {
                return new Promise(resolve => {
                    zoom(canvas.item)

                    worker.post(canvas.item).then(item => {
                        canvas.ctx().putImageData(new ImageData(item.canvasData, 128), 0, 0);
                        resolve(item);
                    });
                });
            }
        }
    });
};
