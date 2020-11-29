export default function(master) {
    return master.proto(['$eventhandler'], function ($eventhandler) {

        function instance(events, residence) {

            const worker = new Worker(residence);
            const eventhandler = $eventhandler.construct();

            let assigned = false;
            let messageid = 0;
        
            events.listen.once('terminate', () => worker.terminate());

            worker.onmessage = e => eventhandler.dispatch(e.data.id, e.data.payload);

            class XWorker {

                constructor() {
                    events.dispatch('register', this);
                }

                release() {
                    assigned = false;
                    events.dispatch('register', this);
                }
            
                async connect(mainmodule, options = {}) {
                    assigned = true;

                    return this.post({ $init: {
                        mainmodule: mainmodule,
                        options: options
                    }});
                }

                async post(message) {
                    const id = ++messageid;

                    return new Promise(resolve => {
                        eventhandler.listen.once(id, e => resolve(e.event));

                        worker.postMessage({
                            id: id,
                            payload: message
                        });
                    });
                }
            }
            
            return new XWorker();
        }
        
        return {
            construct: (events, residence) => instance(events, residence)
        };
    });
};
