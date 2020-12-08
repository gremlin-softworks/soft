export default function(master) {
    return master.proto(['$eventhandler', '$worker'], function (eventhandler, xworker) {

        function instance() {

            const workers = [];
            const events = eventhandler.construct();

            class WorkerPool {

                constructor() {
                    events.listen.on('register', e => workers.push(e.event));
                }

                available() { 
                    return workers.length;
                }
            
                aquire() { 
                    return workers.length > 0 ? workers.splice(0, 1)[0] : null;
                }
                
                build(count, residence = 'soft.js') {
                    while (count-- > 0) {
                        xworker.construct(events, $gmn._path + '/' + residence);
                    }
                    return this;
                }
                
                release() {
                    events.dispatch('terminate');
                    workers.splice(0, workers.length);
                }
            
                request() {
                    return new Promise(resolve => {
                        if (this.available()) {
                            resolve(this.aquire());
                        }
                        else {
                            events.listen.once('register', e => {
                                resolve(e.event);
                                return false;
                            });
                        }
                    });
                }
            }

            return new WorkerPool();
        }

        return {
            construct: () => instance()
        };
    });
};
