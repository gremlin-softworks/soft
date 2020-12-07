export default function(master) {
    return master.fragment({
        selector: 'thing-item',
        template: 'fragments/thing-item/thing-item.html',
        css: ['fragments/thing-item/thing-item.css']
    }, 
    ['generator'], function (generator) {
        return { 
            instance: (root, self) => {

                let cvs = null;

                const run = running => running ? setTimeout(() => generator.updatecanvas(cvs).then(() => run(self.running))) : null;

                self.color = self.$attributes.item?.value;

                self.change = () => root.querySelector('#bg').style['background-color'] = self.color = self.$attributes.item?.refresh(Math.random()).value || '#f0f';

                self.run = start => start ? run(self.running = true) : self.running = false;

                generator.canvas(root.querySelector('#canvas'), self.$attributes.tilt).then(e => cvs = e);

                self.change();
            }
        }
    });
};
