export default function(master) {
    return master.proto([], function () {
    
        const toStringPadded = num => (num < 16 ? '0' : '') + num.toString(16);

        class Item {

            constructor(seed = 0) {
                seed = 256 ** 3 * seed;
                this._value = toStringPadded(seed & 255) +  
                    toStringPadded(seed >> 8 & 255) + 
                    toStringPadded(seed >> 16 & 255);
            }

            get value() {
                return '#' + this._value;
            }

            refresh(seed) {
                seed = 256 ** 3 * seed;
                this._value = toStringPadded(seed & 255) +  
                    toStringPadded(seed >> 8 & 255) + 
                    toStringPadded(seed >> 16 & 255);

                return this;
            }
        }

        return Item;
    });
};
