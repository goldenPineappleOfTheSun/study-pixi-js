PLAYER_SPEED = 5;
PLAYER_JUMP_HEIGHT = 28;
GRAVITY = 0.3;
CELL_WIDTH = 64;
CELL_HEIGHT = 64;
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

let paused = false;
let gameOver = false;

let physicalObjects = new Family();
let weapons = new Family();
let ammoLabels = new Family();
let instructions = new Family();
let everyFramers = new Family();

/*--- actors ---*/

let actors = new Family((obj) => {
    obj.actorData.jumpFuel = 0;
    obj.actorData.lastTimeStanding = new Date();
    obj.actorData.goingLeft = false;
    obj.actorData.goingRight = false;
    obj.actorData.jumping = false;
    return obj;
});

/*--- scriptables ---*/

let _scriptableFramesToRun = [];
let _currentScriptableFrame = 0;
let scriptables = new Family((obj) => {
        obj.scriptInAction = false;
        obj.runScript = async function(name) {
            if (this.scriptInAction == true) {
                return;
            }
            this.scriptInAction = true;
            const frame = async function(number, action) {
                let promiseResolver = () => {};
                let promise = new Promise((resolve, reject) => {promiseResolver = resolve;})
                _scriptableFramesToRun.push({
                    number: number + _currentScriptableFrame,
                    done: false,
                    promise: promiseResolver
                });

                await promise;
                action.call(this);
            };
            
            await this.scriptableData[name].apply(this, [(frame.bind(this))].concat(Array.from(arguments).splice(1)));
            this.scriptInAction = false;
        }
        return obj;
    });

function animateScriptables(delta) {
    _currentScriptableFrame += delta;
    for (let script of _scriptableFramesToRun) {
        if (!script.done && _currentScriptableFrame > script.number) {
            script.promise();
            script.done = true;
        }
    }
}

/*--- time dilation ---*/

const TIME_RESTORATION_SPEED = 0.02;
let timeSpeed = 1;

registerKeydown('i', () => {timeSpeed *= 0.5});