export default function(master) {
    return master.fragment({
        selector: 'main-view',
        template: 'fragments/main-view/main-view.html',
        css: ['fragments/main-view/main-view.css']
    }, 
    ['generator'], function (generator) {
        return { 
            instance: (root, self) => {

                self.obj = {
                    name: 'Gremlin',
                    seen: false,
                    showbig: true
                };

                self.items = [];

                self.clear = () => self.items = [];

                self.focused = focus => self.obj.seen = focus;

                self.additem = () => self.items.push(generator.create(Math.random()));

                self.close = item => self.items.splice(self.items.indexOf(item), 1);

                self.getClass = () => items.length === 0 ? 'is-danger' : 'is-primary';
            }
        }
    });
};
