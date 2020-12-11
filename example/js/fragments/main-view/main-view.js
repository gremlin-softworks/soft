export default function(master) {
    return master.fragment({
        selector: 'main-view',
        template: 'fragments/main-view/main-view.html',
        css: ['fragments/main-view/main-view.css']
    }, 
    ['generator'], function (generator) {
        return { 
            instance: (root, self) => {

                self.items = [];

                self.obj = {
                    name: 'Gremlin',
                    seen: false
                };

                self.options = { 
                    panel: {
                        label: 'Show panel',
                        selected: true
                    },
                    something: {
                        label: 'Something else',
                        selected: false
                    }
                };

                self.creations = [{
                    type: 'rgb',
                    label: 'Channels',
                    active: true,
                    change: me =>  {
                        me.values.forEach(x => x.value = me.active);
                        self.dirty();
                    },
                    values: [
                        {
                            name: 'red',
                            field: 'r',
                            value: true
                        },
                        {
                            name: 'green',
                            field: 'g',
                            value: true
                        },
                        {
                            name: 'blue',
                            field: 'b',
                            value: true
                        }
                    ]
                }];

                self.getTilt = () => {
                    const cr = self.creations.find(x => x.type === 'rgb');
                    const r = 1 + Math.random() * 10;
                    const g = 1 + Math.random() * 10;
                    const b = 1 + Math.random() * 10;

                    return {
                        r: cr.active ? cr.values.find(x => x.field === 'r').value ? r : 0 : r,
                        g: cr.active ? cr.values.find(x => x.field === 'g').value ? g : 0 : g,
                        b: cr.active ? cr.values.find(x => x.field === 'b').value ? b : 0 : b
                    }
                };

                self.clear = () => self.items = [];

                self.focused = focus => self.obj.seen = focus;

                self.additem = () => self.items.push(generator.create(Math.random()));

                self.close = item => self.items.splice(self.items.indexOf(item), 1);
            }
        }
    });
};
