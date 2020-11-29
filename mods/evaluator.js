export default function(master) {
    return master.singleton([], function () {

        Array.prototype.track = function (obj) {
            return this.map(x => obj = obj?.[x]).pop();
        };
        
        String.prototype.track = function (obj) {
            return this.split('.').track(obj);
        };

        const value = (expression, data) => {
            expression = expression.trim();

            if (expression.indexOf('+') > 0) {
                return expression.split('+').map(x => value(x, data)).reduce((x, y) => x + y);
            }
            if (expression.indexOf('-') > 0) {
                return expression.split('-').map(x => value(x, data)).reduce((x, y) => x - y);
            }
            if (expression.startsWith("'") || expression.startsWith('"')) {
                return expression.substring(1, expression.length - 1);
            }
            if (!isNaN(expression)) {
                return Number(expression);
            }
            if (expression === 'true' || expression === 'false') {
                return expression === 'true';
            }

            const track = expression.split('(');
            const target = track[0].track(data);

            return track.length > 1 ? target(...track[1].split(')')[0].split(',').map(x => value(x, data))) : target;
        };

        const property = (target, value, data) => {
            let softtarget = target.split('.');
            const prop = softtarget.pop();
            softtarget = softtarget.length === 0 ? data : evaluate(softtarget.join('.'), data);
            softtarget[prop] = value;

            return softtarget[prop];
        };

        const evaluate = (expression, data) => {
            expression = expression.trim();

            if (expression.indexOf('||') > 0) {
                return expression.split('||').map(e => e.trim()).map(x => evaluate(x, data)).reduce((x, y) => x || y);
            }
            if (expression.indexOf('&&') > 0) {
                return expression.split('&&').map(e => e.trim()).map(x => evaluate(x, data)).reduce((x, y) => x && y);
            }
            if (expression.indexOf('===') > 0) {
                return expression.split('===').map(x => value(x, data)).reduce((x, y) => x === y);
            }
            if (expression.indexOf('!==') > 0) {
                return expression.split('!==').map(x => value(x, data)).reduce((x, y) => x !== y);
            }
            if (expression.indexOf('==') > 0) {
                return expression.split('==').map(x => value(x, data)).reduce((x, y) => x == y);
            }
            if (expression.indexOf('!=') > 0) {
                return expression.split('!=').map(x => value(x, data)).reduce((x, y) => x != y);
            }
            if (expression.indexOf('=') > 0) {
                const targets = expression.split('=').map(e => e.trim());
                const value = evaluate(targets.pop(), data);

                targets.forEach(e => property(e, value, data));

                return value;
            }
            return value(expression, data);
        };

        return class Evaluator {

            constructor (obj) {
                this.bound = obj;
            }

            value (expression) {
                return value(expression, this.bound || {})
            }

            evaluate (expression) {
                return evaluate(expression, this.bound || {})
            }

            property (target, value)  {
                return property(target, value, this.bound || {})
            }

            static value (expression, data) {
                return value(expression, data || {})
            }

            static evaluate (expression, data) {
                return evaluate(expression, data || {})
            }

            static property (target, value, data) {
                return property(target, value, data || {})
            }
        }
    })
}