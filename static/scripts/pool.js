/*
constructor - constructor function on first initial create if all prev objects in pool is used
resetter - function called on every create from pool
third argument - object or function
    if function - its destroyer function
    if object - {
        layer: 'default',
        destroyer: () => {}
    }
*/
function Pool(constructor, resetter) {
    resetter = resetter || (() => {});

    this.destructor = () => {};
    this.options = {layer: 'default'};
    if (arguments[2] !== undefined) {
        if (typeof(arguments[2]) === 'function') {
            this.destructor = arguments[2];
        }
        if (typeof(arguments[2]) === 'object') {
            this.options = {...this.options, ...arguments[2]};
            if (this.options.destructor) {
                this.destructor = this.options.destructor;
            }
        }
    }

    this.pool = [];
    this.usedCount = 0;

    this.create = (arg1, arg2, arg3, arg4, arg5, arg6, arg7) => {
        for (let o of this.pool) {
            if (!o.used) {
                o.used = true;
                o.obj._destroyed = false;
                resetter.call(o.obj, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
                stage.add(o.obj, this.options.layer);
                this.usedCount++;
                return o.obj;
            }
        }
        this.pool.push({
            used: true,
            obj: constructor.call(null, arg1, arg2, arg3, arg4, arg5, arg6, arg7)
        });
        const created = this.pool[this.pool.length-1].obj;
        stage.add(created, this.options.layer);
        this.usedCount++;
        return created;
    }

    this.getAll = function() {
        return this.pool;
    }

    this.destroy = (obj, arg1, arg2, arg3, arg4, arg5, arg6, arg7) => {
        for (let o of this.pool) {
            if (o.obj === obj) {
                this.destructor.call(obj, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
                stage.remove(obj);
                obj._destroyed = true;
                o.used = false;
                this.usedCount--;
            }
        }
    }
}