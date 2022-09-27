/*
collection of objects
do is mist useful function here
*/
function Family(joinTransform) {
    joinTransform = joinTransform || (x => x);
    this.elements = [];

    this.add = function(elem) {
        this.elements.push(joinTransform(elem));
    }

    this.do = function(func) {
        this.elements.forEach(x => {
            if (x._destroyed === true) {
                return;
            }
            func(x)
        });
    }

    this.remove = function(element) {
        this.elements = this.elements.filter(x => x !== element);
    }

    this.filter = function(func) {
        return this.elements.filter(x => !x._destroyed && func(x));
    }
}