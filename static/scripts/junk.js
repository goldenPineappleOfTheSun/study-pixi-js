/*
its a junk that flies around hitting walls, enemies and other stuff just for fun
example is the bones of a defeated enemy
there are some physics tricks so junk look little more realistic (spinnig and bouncing)
*/

let junkPool = new Pool(createJunk, resetJunk, {layer: 'back'});

function normalizeJunkRotation(rotation) {
    return rotation % (2 * Math.PI) + (2 * Math.PI);
}

function junkAndStaticCollision(self, other, intersection) {
    self.rotationSpeed *= -0.8;
    if (intersection.normal.y < 0) {
        const layRotation = self.layRotation + (2 * Math.PI);
        if (self.sprite.rotation + (2 * Math.PI) < (2 * Math.PI) + Math.PI) {
            self.sprite.rotation += (layRotation - self.sprite.rotation) * 0.99;
        } else {
            self.sprite.rotation += (layRotation + (2 * Math.PI) - self.sprite.rotation) * 0.99;
        }
    }
    self.sprite.rotation = normalizeJunkRotation(self.sprite.rotation);
}

const junkFunctions = {
    collidableData: {
        tagHandlers: {
            'block': junkAndStaticCollision,
            'platform': junkAndStaticCollision
        },
        directHandlers: []
    },
    step(delta) {
        this.lifetime -= delta;
        if (junkPool.usedCount > 100) {
            this.lifetime -= 10 * delta;
        }
        if (this.lifetime < 60) {
            this.alpha = this.lifetime / 60;
        }
        if (this.lifetime < 0) {
            junkPool.destroy(this);
        }
        const max = 15;
        if (Math.abs(this.velocity.x) > max) {
            this.velocity.x *= max / Math.abs(this.velocity.x);
        }
        if (Math.abs(this.velocity.y) > max) {
            this.velocity.y *= max / Math.abs(this.velocity.y);
        }
        if (this.collisionBoxMax < 64) {
            this.sprite.rotation = normalizeJunkRotation(this.sprite.rotation + this.rotationSpeed * delta);
            this.collisionBox = {
                width: this.collisionBoxMin + Math.abs(Math.sin(this.sprite.rotation)) * (this.collisionBoxMax - this.collisionBoxMin),
                height: this.collisionBoxMin + Math.abs(Math.cos(this.sprite.rotation)) * (this.collisionBoxMax - this.collisionBoxMin)
            }
        }
    }
}

function createJunk(x, y, cb, tex, velocity, rotation, rotationSpeed) {
    let container = new PIXI.Container();
    container.tag = 'junk';
    container.physicsData = {
        bouncy: 0.8
    }
    resetJunk.apply(container, arguments); 
    container.step = junkFunctions.step;
    container.collidableData = junkFunctions.collidableData;
    container.layRotation = random(-0.2, 0.2);
    container.addChild(container.sprite);
    everyFramers.add(container);
    physicalObjects.add(container);
    return container;
}

function resetJunk(x, y, cb, tex, velocity, rotation, rotationSpeed) {
    this.x = x;
    this.y = y;
    if (!this.sprite) {
        this.sprite = getSprite(tex);
    } else {
        this.sprite.texture = getTexture(tex);
    }
    this.sprite.anchor.set(0.5);
    this.sprite.y = 7;
    this.sprite.rotation = rotation;
    this.rotationSpeed = rotationSpeed;
    this.velocity = velocity;
    this.collisionBox = cb;
    this.collisionBoxMin = Math.min(cb.width, cb.height);
    this.collisionBoxMax = Math.max(cb.width, cb.height);
    this.alpha = 1;
    this.lifetime = 300;
}