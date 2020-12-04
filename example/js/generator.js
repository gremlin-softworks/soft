export default function(master) {
    return master.singleton(['item', '$workerpool', '$canvas'], function (Item, $workerpool, $canvas) {
        
        const worker = $workerpool.construct().build(1).aquire();

        worker.connect('workerone.js', { baseUrl: '/example' });

        const getProto = () => {

            const x = Math.random() / 1000;
            const y = Math.random() / 1000;

            return {
                canvasData: new Uint8ClampedArray(4 * 128 * 128),
                size: 128,
                extent: [
                    -0.774200439453125 + x,
                    0.112335205078125 + y,
                    -0.774169921875 + x,
                    0.11236572265625 + y
                ],
                tilt: {
                    r: Math.round(Math.random() * 10),
                    g: Math.round(Math.random() * 10),
                    b: Math.round(Math.random() * 10)
                }
            }
        };

        const zoom = data => {
            data.extent[0] -= 0.000001;
            data.extent[1] -= 0.000001;
            data.extent[2] += 0.000001;
            data.extent[3] += 0.000001;
        };

        return {
             create: seed => new Item(seed),

             canvas: async parent => {
                 return new Promise(resolve => {
                    worker.post(getProto()).then(item => {
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
