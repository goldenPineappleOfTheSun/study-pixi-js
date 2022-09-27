/*
simple 2d rectangles physics engine
strongly entangled with some utils functions (todo:refactor?)
*/

let FIDELITY = 2;

/* TODO what object can collide with what other object */
let solidityMask = {};
/* triggers are not physical objects but can interact  */
let triggersMask = {};
/* solids cant move nor penetrate statics */
let staticsMask = {};

function makeCollidable(a, b) {
    if (!(a in solidityMask)) {
        solidityMask[a] = {};
    }
    if (!(b in solidityMask)) {
        solidityMask[b] = {};
    }
    solidityMask[a][b] = true;
    solidityMask[b][a] = true;
}

function makeTriggerable(a, b) {
    if (!(a in triggersMask)) {
        triggersMask[a] = {};
    }
    if (!(b in triggersMask)) {
        triggersMask[b] = {};
    }
    triggersMask[a][b] = true;
    triggersMask[b][a] = true;
}

function canCollide(a, b) {
    a = a.tag;
    b = b.tag;
    if (!solidityMask[a] || !solidityMask[b]) {
        return false;
    }
    return solidityMask[a] ? (solidityMask[a][b] ? solidityMask[a][b] : false) 
        : solidityMask[b] ? (solidityMask[b][a] ? solidityMask[b][a] : false) : false;
}

function canTrigger(a, b) {
    a = a.tag;
    b = b.tag;
    if (!triggersMask[a] || !triggersMask[b]) {
        return false;
    }
    return triggersMask[a] ? (triggersMask[a][b] ? triggersMask[a][b] : false) 
        : triggersMask[b] ? (triggersMask[b][a] ? triggersMask[b][a] : false) : false;
}

function makeStatic(tag) {
    staticsMask[tag] = true;
}

function movePhysically(delta) {
    const sprites = stage.children;
    const max = Math.max;
    const min = Math.min;
    const abs = Math.abs;

    for (let i=0; i<sprites.length; i++) {
        const a = sprites[i];
        if (a.velocity === undefined || (a.physicsData && a.physicsData.disabled)) {
            continue;
        }
        if (a.tag && a.tag in staticsMask) {
            continue;
        }

        //a.prevPosition = {x: a.x, y: a.y};

        /* remember every static object that may be in a way */
        const staticsObstacles = _getObstaclesInTheWay(
            getCollisionBox(a),
            a.velocity,
            sprites.filter(x => x.tag && x.tag in staticsMask)
        ).filter(x => canCollide(a, x.obj));

        if (staticsObstacles.length === 0) {
            /* sometimes move freely*/
            a.position.x += a.velocity.x * delta;
            a.position.y += a.velocity.y * delta;
        } else {
            /* sometimes move hardly */
            const rect = getCollisionBox(a);            
            if (rect.width > a.velocity.x && rect.height > a.velocity.y) {
                _pushCollisionIntoStatic(a, a.velocity, staticsObstacles, delta);
            } else {
                const steps = Math.max(
                    Math.ceil(a.velocity.x / rect.width),
                    Math.ceil(a.velocity.y / rect.height));
                for (let i=0; i<steps; i++) {
                    _pushCollisionIntoStatic(a, {x: a.velocity.x/steps, y:a.velocity.y/steps}, staticsObstacles, delta);
                }
            }
        }

        /* soft collisions */
        for (let j=i+1; j<sprites.length; j++) {
            let a = sprites[i];
            let b = sprites[j];
            if (a.tag in staticsMask || b.tag in staticsMask) {
                continue;
            }
            const ra = getCollisionBox(a);
            const rb = getCollisionBox(b);
            if (areRectsIntersect(ra, rb)) {
                collisionHandler(a, b);
                collisionHandler(b, a);
                if (canCollide(a, b)) {
                    _softCollide(a, b, delta);
                }
            }
        }
    }
}

function checkStaticsInArea(rect, tag) {
    sprites = stage.children;
    for (let sprite of sprites) {
        if (!sprite.tag || !(sprite.tag in staticsMask) || (tag && sprite.tag !== tag)) {
            continue;
        }
        if (areRectsIntersect(rect, getCollisionBox(sprite))) {
            return true;
        }
    }
    return false;
}

function checkCollisionsInArea(self, sprites, rect) {
    const tag = self.tag;
    if (checkStaticsInArea(rect)) {
        return true;
    }
    for (let sprite of sprites) {
        if (!sprite.tag || !canCollide(sprite, self)) {
            continue;
        }
        if (areRectsIntersect(rect, getCollisionBox(sprite))) {
            return true;
        }
    }
    return false;
}

function collisionHandler(a, b, intersection) {
    if (!a.collidableData) {
        return;
    }
    if (b.tag in a.collidableData.tagHandlers) {
        a.collidableData.tagHandlers[b.tag](a, b, intersection);
    }
}

function _pushCollisionIntoStatic(a, momentum, obstacles, delta) {
    const max = Math.max;
    const min = Math.min;
    const abs = Math.abs;

    const posbef = {x:a.x, y:a.y};

    a.x += momentum.x * delta;
    a.y += momentum.y * delta;

    const velocityBefore = {x:a.velocity.x*0.99, y:a.velocity.y*0.99};

    for (let b of obstacles) {
        const aRect = getCollisionBox(a);
        const intersection = getRectsIntersection(aRect, b.rect);
        if (!intersection) {
            continue;
        }

        collisionHandler(a, b.obj, intersection);
        collisionHandler(b.obj, a, intersection);

        if (b.obj.isPlatform) {
            if (a.actorData && (a.actorData.descend || (a.actorData.descendStarted && (new Date() - (a.actorData.descendStarted)) < 500 / timeSpeed))) {
                continue;
            }
            intersection.normal.x = 0;
            const theTopSideOfPlatform = intersection.y == b.rect.y;
            const theDownMovement = (aRect.y + aRect.height) - intersection.y < a.velocity.y + 1;
            const atTheTop = abs((aRect.y + aRect.height) - intersection.y) < 12;
            if (intersection.normal.y > 0 || !theTopSideOfPlatform || (!theDownMovement && !atTheTop)) {
                continue;
            }
            if (theDownMovement && theTopSideOfPlatform && atTheTop) {
                /* hack for skeletons so they will walk upstairs slower */
                a.velocity.x *= 0.2;
                intersection.normal = {x:intersection.normal.x, y:-1};
            }
        }
        a.x += intersection.normal.x * intersection.width;
        a.y += intersection.normal.y * intersection.height;
        a.velocity.x += intersection.normal.x * intersection.width;
        a.velocity.y += intersection.normal.y * intersection.height;
        
        if (a.physicsData && a.physicsData.bouncy) {
            if (intersection.normal.x > 0 !== velocityBefore.x) {
                a.velocity.x -= velocityBefore.x * a.physicsData.bouncy;
            }
            if (intersection.normal.y > 0 !== velocityBefore.y) {
                a.velocity.y -= velocityBefore.y * a.physicsData.bouncy;
            }
        }
    }

    if (abs(a.velocity.x) > abs(velocityBefore.x)) {
        a.velocity.x = abs(a.velocity.x) / a.velocity.x * abs(velocityBefore.x);
    }

    if (abs(a.velocity.y) > abs(velocityBefore.y)) {
        a.velocity.y = abs(a.velocity.y) / a.velocity.y * abs(velocityBefore.y);
    }
}

function _softCollide(a, b, delta) {
    const abs = Math.abs;
    const sqr = x => Math.pow(x, 2);
    const ra = getCollisionBox(a);
    const rb = getCollisionBox(b);
    const intersection = getRectsIntersection(ra, rb);
    if (intersection === null) {
        return;
    }

    const friction = 0.9;
    const a_velocityBefore = {x:a.velocity.x, y:a.velocity.y};
    const b_velocityBefore = {x:b.velocity.x, y:b.velocity.y};

    a.velocity.x += intersection.width * intersection.normal.x * delta * 0.2;
    a.velocity.y += intersection.height * intersection.normal.y * delta * 0.2;
    b.velocity.x -= intersection.width * intersection.normal.x * delta * 0.2;
    b.velocity.y -= intersection.height * intersection.normal.y * delta * 0.2;

    a.x += intersection.width * intersection.normal.x * delta * 0.2;
    a.y += intersection.height * intersection.normal.y * delta * 0.2;
    b.x -= intersection.width * intersection.normal.x * delta * 0.2;
    b.y -= intersection.height * intersection.normal.y * delta * 0.2;

    /* fix glitches */
    if ((a.velocity.x > 0) !== (a_velocityBefore.x > 0)) {
        a.velocity.x = 0;
    } else if (abs(a.velocity.x) > abs(a_velocityBefore.x)) {
        a.velocity.x = a_velocityBefore.x;
    }
    if ((a.velocity.y > 0) !== (a_velocityBefore.y > 0)) {
        a.velocity.y = 0;
    } else if (abs(a.velocity.y) > abs(a_velocityBefore.y)) {
        a.velocity.y = a_velocityBefore.y;
    }
    if ((b.velocity.x > 0) !== (b_velocityBefore.x > 0)) {
        b.velocity.x = 0;
    } else if (abs(b.velocity.x) > abs(b_velocityBefore.x)) {
        b.velocity.x = b_velocityBefore.x;
    }
    if ((b.velocity.y > 0) !== (b_velocityBefore.y > 0)) {
        b.velocity.y = 0;
    } else if (abs(b.velocity.y) > abs(b_velocityBefore.y)) {
        b.velocity.y = b_velocityBefore.y;
    }
}

function _getObstaclesInTheWay(rect, vectorLength, possibleObstacles) {
    const abs = Math.abs;

    let result = [];
    const moveArea = {
        x: vectorLength.x > 0 ? rect.x : rect.x+vectorLength.x,
        y: vectorLength.y > 0 ? rect.y : rect.y+vectorLength.y,
        width: abs(vectorLength.x) + rect.width,
        height: abs(vectorLength.y) + rect.height};
    for (let o of possibleObstacles) {
        const otherRect = getCollisionBox(o);
        if (areRectsIntersect(moveArea, otherRect)) {
            result.push({obj:o, rect:otherRect});
        }
    }
    return result;
}
