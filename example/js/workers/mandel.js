export default function(master) {
    return master.proto([],
    
    function () {

        const getDot = (x, y, tilta, tiltb, tiltc) => {
            let real = x;
            let imaginary = y;
    
            for (let i = 0; i < 1024; i++) {
                const a = real ** 2 - imaginary ** 2 + x;
                const b = 2 * real * imaginary + y;
                const c = a * b;
                if (c > 12 || isNaN(c) || isNaN(c)) {
                    return {r: i * tilta % 256, g: i * tiltb % 256, b: i * tiltc % 256};
                }
                real = a;
                imaginary = b;
            }
            return { r: 0, g: 0, b: 0 };
        };  
    
        const drawPixel = (canvasData, x, y, color, size) => {
            var index = (x + y * size) * 4;
            canvasData[index + 0] = color.r;
            canvasData[index + 1] = color.g;
            canvasData[index + 2] = color.b;
            canvasData[index + 3] = 255;
        };
    
        const reproject = (pos, extent, size) => {
            var x = (extent[2] - extent[0]) * (pos[0] / size) + extent[0];
            var y = (extent[1] - extent[3]) * (pos[1] / size) + extent[1];
    
            return { r: x, i: y };
        };
    
        const createMandel = (data) => {
            for (let i = 0; i < data.size; i++) {
                for (let ii = 0; ii < data.size; ii++) {

                    const px = reproject([i,ii], data.extent, data.size);
                    const color = getDot(px.r, px.i, data.tilt.r, data.tilt.g, data.tilt.b);

                    drawPixel(data.canvasData, i, ii, color, data.size);
                }
            }
            return data;
        };

        class Mandel {

            static create (data) {
                
                return createMandel(data);
            }
        }

        return Mandel;
    });
};
