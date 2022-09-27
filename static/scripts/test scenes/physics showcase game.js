
makeStatic('block');
makeStatic('platform');
makeCollidable('block', 'hero');
makeCollidable('block', 'enemy');
makeCollidable('block', 'ammo');
makeCollidable('block', 'bullet');
makeCollidable('block', 'weapon');
makeCollidable('block', 'junk');
makeCollidable('block', 'testbox');
makeCollidable('hero', 'testbox');
makeCollidable('testbox', 'testbox');
makeCollidable('platform', 'hero');
makeCollidable('platform', 'enemy');
makeCollidable('platform', 'ammo');
makeCollidable('platform', 'weapon');
makeCollidable('platform', 'junk');
makeCollidable('platform', 'testbox');
makeCollidable('enemy', 'hero');
makeCollidable('enemy', 'enemy');
makeCollidable('enemy', 'bullet');
makeCollidable('hero', 'ammo');
makeTriggerable('enemy', 'weapon');

function applyGravity(obj, delta) {
    if (!obj.velocity) {
        return;
    }
    if (obj.velocity.y < 15) {
        obj.velocity.y += GRAVITY * delta;
    }
}

function applyActorsMoves(obj, delta) {
    const rect = getCollisionBox(obj);
    const abs = Math.abs;
    const edgeJumpTimeout = 80;

    let goingLeft = obj.actorData.goingLeft;
    let goingRight = obj.actorData.goingRight;
    let jumping = obj.actorData.jumping;

    /* walking */

    let targetHorizontalVelocity = 
        goingLeft && goingRight ? 0
        : goingLeft ? -obj.actorData.goingSpeed
        : goingRight ? obj.actorData.goingSpeed
        : 0;
    obj.velocity.x += (targetHorizontalVelocity - obj.velocity.x) * 0.8;

    /* jumping */

    const isStanding = checkCollisionsInArea(obj, stage.children, {x:rect.x, y:rect.y+rect.height, width: rect.width, height: 3}, 'solid');

    if (isStanding) {
        obj.actorData.lastTimeStanding = new Date();
    }

    if (jumping) {
        if (isStanding || (new Date() - obj.actorData.lastTimeStanding) < edgeJumpTimeout * delta) {
            obj.velocity.y = -3;
            obj.jumpFuel = obj.actorData.jumpingHeight;
        } else if (obj.jumpFuel > 0) {
            obj.velocity.y -= GRAVITY * delta;
            obj.y -= 5 * (obj.jumpFuel / obj.actorData.jumpingHeight) * delta;
            obj.jumpFuel -= 1 * delta;
        }
    } else {
        obj.jumpFuel = 0;
    }
}

function ammoLabelFollow(label) {
    /* if put label as a child of weapon it will inherit weapon's scale */
    label.x = label.attachment.getGlobalPosition().x;
    label.y = label.attachment.getGlobalPosition().y - 30;
}

app.ticker.add((delta) => {
    if (loader.loading || paused) {
        return;
    }

    delta *= timeSpeed;
    clearDebug();
    actors.do(o => {
        o.act(delta);
        applyActorsMoves(o, delta)
    });
    physicalObjects.do(o => applyGravity(o, delta));
    weapons.do(o => o.shooting(delta));

    hero.move();
    hero.autoPickWeapon();

    animateScriptables(delta);
    movePhysically(delta);

    everyFramers.do(o => o.step(delta))
    ammoLabels.do(o => ammoLabelFollow(o))

    physicalObjects.do(o => o.prevPosition = {x:o.x, y:o.y});
});