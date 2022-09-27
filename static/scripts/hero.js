/*
i havent used no classes, prototypes or even function binding
just put everything in one object
why not its the singleton by its nature and if it sometimes changed
no one will be fooled by over the top smart code
*/

function createPlayer(x, y) {
    let container = new PIXI.Container();
    container.sprite = getSprite('hero rifle');
    container.sprite.anchor.set(0.5);
    container.x = x;
    container.y = y;
    container.tag = 'hero'
    container.velocity = {x: 0, y: 0}
    container.collisionBox = {width:46, height: 54};

    container.sprite = new PIXI.spine.Spine(loader.resources.hero.spineData);
    loader.resources.skeleton.spineAtlas.pages[0].baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    container.sprite.scale = {x:1.1, y:1.1}
    container.sprite.state.timeScale = 1.5;
    container.sprite.state.setAnimation(0, 'pistol', true);
    container.sprite.state.setAnimation(1, 'idle', true);
    container.currentAnimation = ['pistol', 'idle'];
    
    container.reloadSprite = new PIXI.Graphics();
    container.reloadSprite.beginFill(0x6b472f);
    container.reloadSprite.drawRect(-20, 0, 40, 3);
    container.reloadSprite.x = 0;
    container.reloadSprite.y = -45;
    container.addChild(container.reloadSprite);

    container.hp = 100;
    container.hpSprite = new PIXI.Graphics();
    container.hpSprite.beginFill(0xff0000);
    container.hpSprite.drawRect(-20, 0, 40, 3);
    container.hpSprite.x = 0;
    container.hpSprite.y = -40;
    container.addChild(container.hpSprite);
    container.undamagableWindowSize = 500;
    container.lastDamage = new Date();

    container.slots = {
        'weapon': {x:30, y:-5}
    }
    container.weapon_grips = {
        'default': {x:0, y:0},
        'pistol': {x:34, y:-9},
        'rifle': {x:9, y:-7},
        'shotgun': {x:5, y:-6},
        'carbine': {x:10, y:-5},
        'machinegun': {x:6, y:5},
    }
    container.weapon_sprites = {
        'default': 'rifle',
        'pistol': 'pistol',
        'rifle': 'rifle',
        'shotgun': 'rifle',
        'carbine': 'rifle',
        'machinegun': 'rifle',
    }
    container.actorData = {
        goingSpeed: PLAYER_SPEED,
        jumpingHeight: PLAYER_JUMP_HEIGHT,
        goingLeft: false,
        goingRight: false,
        jumping: false
    }

    container.collidableData = {
        tagHandlers: {
            'enemy': (self, other) => {if (other.attacking) {self.damage(15)}},
            'ammo': (self, other) => {if (self.slots['weapon'].obj) {self.slots['weapon'].obj.pickAmmo()}},
            'block': (self, other) => {if (self.velocity.y > 13) self.damage((self.velocity.y-12)*20)},
            'platform': (self, other) => {if (self.velocity.y > 13) self.damage((self.velocity.y-12)*20)},
        },
        directHandlers: []
    }

    container.triggerableData = {
        tagHandlers: {
            'ammo': (self, other) => {},
        },
        directHandlers: []
    }

    container.act = function(delta) {
        const abs = Math.abs;
        if (this.actorData.goingRight && !this.actorData.goingLeft) {
            this.scale.x = 1;
        } else if (!this.actorData.goingRight && this.actorData.goingLeft) {
            this.scale.x = -1;
        }

        if (this.currentAnimation !== 'attack') {
            if (this.isLanded()) {
                if (this.actorData.goingLeft !== this.actorData.goingRight) {
                    this.setAnimation(1, 'run');
                    this.scale.x = this.actorData.goingLeft ? -1 : 1;
                } else {
                    this.setAnimation(1, 'idle');
                }
            } else {
                this.setAnimation(1, 'jump');
            }
        }
    }

    container.damage = function(amount) {
        if (amount < 0) {
            return;
        }
        if (new Date() - this.lastDamage < this.undamagableWindowSize / timeSpeed) {
            return;
        }
        this.lastDamage = new Date();
        this.hp -= amount;
        if (this.hp < 0) {
            this.hp = 0;
            this.destroy();
            rollGameOver();
            stage.remove(this);
        }
        this.hpSprite.width = (this.hp / 100) * 40;
    }

    container.hasWeapon = function() {
        return !!this.getFromSlot('weapon');
    }

    container.setAnimation = function(track, name) {
        if (this.currentAnimation[track] === name) {
            return;
        }
        this.sprite.state.setAnimation(track, name, true);
        this.currentAnimation[track] = name;
    }

    /* slots */

    container.getFromSlot = function(slot) {
        if (!('obj' in this.slots[slot])) {
            this.slots[slot].obj = null;
        }   
        return this.slots[slot].obj;
    }

    container.putInSlot = function(slot, obj) {
        let prev = this.getFromSlot(slot);
        if (prev) {
            this.freeSlot(slot);
        }
        this.addChild(obj);
        this.slots[slot].obj = obj;
        obj.x = this.slots[slot].x;
        obj.y = this.slots[slot].y;
        obj.scale.x = 1;
    }

    container.freeSlot = function(slotname) {
        const obj = this.getFromSlot(slotname);
        if (!obj) {
            return;
        }
        stage.add(obj);
        obj.x = this.x + this.slots[slotname].x;
        obj.y = this.y + this.slots[slotname].y;
        obj.scale.x = this.scale.x;
        this.slots[slotname].obj = null;
    }

    /* moving */

    container.jumpFuel = 10;
    container.move = function() {
        this.actorData.goingLeft = isPressed('a');
        this.actorData.goingRight = isPressed('d');
        this.actorData.jumping = isPressed('w');
        this.actorData.descend = isPressed('s');
    }

    /* weapons */

    container.autoPickWeapon = function() {
        if (this.hasWeapon()) {
            return;
        }
        const sqr = (x) => Math.pow(x, 2);
        const pickableWeapons = weapons.filter(o => areSpritesIntersect(o, this)); 
        let closest = {sqrDst: Infinity, elem: null};
        for (const w of pickableWeapons) { 
            if (new Date() - w.droppedTime < 1000) {
                continue;
            }
            const sqrdst = sqr(w.position.x - this.position.x) + sqr(w.position.y - this.position.y);
            if (sqrdst < closest.sqrDst) {
                closest.sqrDst = sqrdst;
                closest.elem = w;
            } 
        }
        if (closest.elem !== null) {
            this.setAnimation(0, hero.weapon_sprites[closest.elem.type] ? hero.weapon_sprites[closest.elem.type] : hero.weapon_sprites['default']);
            const grip = hero.weapon_grips[closest.elem.type] ? hero.weapon_grips[closest.elem.type] : hero.weapon_grips['default'];
            hero.slots['weapon'].x = grip.x;
            hero.slots['weapon'].y = grip.y;
            this.putInSlot('weapon', closest.elem);
            if (this.getFromSlot('weapon') === closest.elem) {
                closest.elem.weaponData.holder = this;
                if (closest.elem.velocity.y > 3 && this.lastWeapon && closest.elem !== this.lastWeapon) {
                    styleJuggling();
                }
                this.lastWeapon = closest.elem;
            }
        }
    }

    container.dropWeapon = function() {
        let needThrow = skeletonsPool.getAll().map(x => x.obj)
            .some(skeleton => 
                (skeleton.x - this.x > 0) === (this.scale.x > 0) /* same direction */
                && Math.abs(skeleton.x - this.x) < CELL_WIDTH * 4 /* same alt */
                && Math.abs(skeleton.y - this.y) < CELL_HEIGHT /* same long */);

        let weapon = this.getFromSlot('weapon');

        if (weapon.ammo > 0) {
            this.freeSlot('weapon');
            if (needThrow) {
                weapon.velocity = {x:this.velocity.x + this.scale.x * 8, y: -2};
                weapon.rotationSpeed = 0.4;
            } else {
                weapon.velocity = {x:random(-3, 3) + this.velocity.x, y:random(-10, -5) + this.velocity.y};
            }
            weapon.droppedTime = new Date();
            weapon.weaponData.holder = null;
            weapon.x = this.x;
            weapon.y = this.y;
            this.setAnimation(0, hero.weapon_sprites['default']);
        } else {
            const bounds = getCollisionBox(weapon);
            junkPool.create(this.x, this.y, {width: bounds.width, height: bounds.height}, weapon.texture, 
                {x:random(-3, 3) + this.velocity.x, y:random(-10, -5) + this.velocity.y}, 0, 0.3);
            this.freeSlot('weapon');
            weaponsPool.destroy(weapon);
        }
    }

    container.shootStart = function() {
        let weapon = this.getFromSlot('weapon');
        if (!weapon) {
            return;
        }
        weapon.pullTrigger();
    }

    container.shootEnd = function() {
        let weapon = this.getFromSlot('weapon');
        if (!weapon) {
            return;
        }
        weapon.releaseTrigger();
    }

    container.step = function(delta) {
        let weapon = this.getFromSlot('weapon');
        if (!weapon) {
            return;
        }
        this.reloadSprite.scale.x = weapon.getReloadProgress();
        this.sprite.state.timeScale = delta * 1.5;
    }

    container.isLanded = function() {
        if (this.lastIsLanded !== undefined && this.lastIsLandedTime === new Date()) {
            return this.lastIsLanded;
        }
        const rect = getCollisionBox(this);
        const result = checkCollisionsInArea(this, app.stage.children, {x:rect.x, y:rect.y+rect.height, width: rect.width, height: 5}, 'solid');
        this.lastIsLanded = result;
        this.lastIsLandedTime = new Date();
        return result;
    }

    everyFramers.add(container);
    container.addChild(container.sprite);
    actors.add(container);
    physicalObjects.add(container);
    return container;
}

let hero = null;

onTexturesLoaded.push(() => {
    /* when all the textures loaded, we create hero and adding key bindings */
    hero = createPlayer(64*9+32, 6*64);
    registerKeydown('s', () => {hero.actorData.descendStarted = new Date()});
    registerKeydown('e', hero.dropWeapon.bind(hero));
    registerKeydown(' ', hero.shootStart.bind(hero));
    registerKeyup(' ', hero.shootEnd.bind(hero));
    stage.add(hero);
})