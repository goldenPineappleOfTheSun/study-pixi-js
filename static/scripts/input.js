let registeredKeydownEvents = {};
let registeredKeyupEvents = {};
let pressedKeysMap = {}

function registerKeydown(key, handler) {
    registeredKeydownEvents[key] = handler;
}

function registerKeyup(key, handler) {
    registeredKeyupEvents[key] = handler;
}

function keyDownHandler(event) {
    if (pressedKeysMap[event.key]) {
        return;
    }
    pressedKeysMap[event.key] = true
    if (event.key in registeredKeydownEvents) {
        registeredKeydownEvents[event.key]();
    }
}

function keyUpHandler(event) {
    pressedKeysMap[event.key] = false
    if (event.key in registeredKeyupEvents) {
        registeredKeyupEvents[event.key]();
    }
}

function isPressed(value) {
    return !!pressedKeysMap[value]
}

window.addEventListener("keydown", keyDownHandler, false);
window.addEventListener("keyup", keyUpHandler, false);