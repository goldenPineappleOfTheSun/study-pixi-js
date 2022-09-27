/*
used to put different objects in different layer
(emultaiong depth)
*/

const app = new PIXI.Application({ 
    view: document.querySelector('.main-canvas'), 
    width: 1600, 
    height: 800, 
    transparent: true, 
    backgroundColor: 0x000000 });
document.body.appendChild(app.view);

function Stage() {
    this.layers = {
        'back': new PIXI.Container(),
        'tiledbg': new PIXI.Container(),
        'default': new PIXI.Container()
    }

    this.add = function(obj, layer) {
        layer = layer || 'default';
        this.layers[layer].addChild(obj);
    }

    this.remove = function(obj) {
        for (let l in stage.layers) {
            stage.layers[l].removeChild(obj);
        }        
    }

    for (let l in this.layers) {
        app.stage.addChild(this.layers[l]);
    }  
} 

stage = new Stage();

Object.defineProperty(stage, 'children', {
    get(layer) {
        let result = [];
        for (let l in stage.layers) {
            result = result.concat(stage.layers[l].children);
        }
        return result;
    }
});
