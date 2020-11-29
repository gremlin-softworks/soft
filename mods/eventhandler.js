export default function(master) {
    return master.proto([], function () {

        function instance() {
            
            const listeners = {};
            let eventRouter = null;

            class EventHandler {

                constructor() {
                    eventRouter = new EventRouter();
                }

                get listen() {
                    return eventRouter;
                }

                dispatch (eventType, event) {
                    return listeners[eventType] ? listeners[eventType].invoke(event) : null; 
                }
            }

            class Listener {

                constructor(eventType, listener, linked, persist) {
                    this.eventType = eventType;
                    this.listener = listener;
                    this.link = linked;
                    this.persist = persist;
                }

                count (listener, c) {
                    return this.link ? this.link.count(listener, c + (!listener || listener === this.listener ? 1 : 0)) : c + (!listener || listener === this.listener ? 1 : 0);
                }
                
                invoke (event, parent, propagated) {
                    this.link = this.persist ? this.link : this.remove(this.persist, parent);
                    if (this.listener({
                        event: event, 
                        eventType: this.eventType, 
                        resume: () => { 
                            if (this.link && !propagated) {
                                this.link.invoke(event, this.persist ? this : parent);
                            }
                            propagated = true; 
                        }
                    }) !== false && !propagated) {
                        return propagated = this.link ? this.link.invoke(event, this.persist ? this : parent) : true;
                    }
                }

                remove (listener, parent) {
                    if (!listener || listener === this.listener) {
                        return !parent ? listeners[this.eventType] = this.link : parent.link = this.link;
                    }
                    return this.link ? this.link.remove(listener, this) : this.link;
                }
            }

            class EventRouter {

                on (eventType, listener) {
                    return (listeners[eventType] = new Listener(eventType, listener, listeners[eventType], true)).listener;
                }

                once (eventType, listener) { 
                    return (listeners[eventType] = new Listener(eventType, listener, listeners[eventType], false)).listener;
                }

                count (eventType, optListener) { 
                    return listeners[eventType] ? listeners[eventType].count(optListener, 0) : 0;
                }

                un (eventType, optListener) {
                    while (listeners[eventType] && listeners[eventType].remove(optListener));
                }

                get (eventType) {
                    for (var item = listeners[eventType], result = []; item; result.push(item.listener), item = item.link);
                    return result;
                }
            }

            return new EventHandler();
        };

        return {
            construct: () => instance()
        };
    })
}
