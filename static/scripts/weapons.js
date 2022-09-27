/*
pools at the top is for reuse of same assets (see pool.js)
every weapon created via createWeapon and resetWeapon is used by pool to set fields to default values 
weapon lifecycle consists of createWeapon, resetWeapon, concreeteConstructor and destroyWeapon
createWeapon is an initial creation if pool has no available weapons to reset
reset is placing an old weapon instead of creating
concreeteConstructor is passed into create/reset to specify 
the set of properties and functions for concreete type of weapon
destroy is used to also destroy ammo label

nothing special about bullets. They shot from weapons. Slowed by air bacause of what may loose their damage

nothing special about ammo either. can be picked up by hero

ammoLabel is used instead of usual sprite inside container cause scaling issues
todo: rewrite ammoLable to it be a child of weapon container and just rescale it every frame

*/

/*--- pool ---*/

let bulletsPool = new Pool(createBullet, resetBullet, {destructor: destroyBullet, layer: 'back'});
let ammoPool = new Pool(createAmmo, resetAmmo);
let weaponsPool = new Pool(createWeapon, resetWeapon, destroyWeapon)
let ammoLablesPool = new Pool(createAmmoLabel, resetAmmoLabel)

/*--- guns ---*/

const pistolFunctions = {
    pullTrigger() {
        this.weaponData.cooldown = 0;
        this.weaponData.triggerPulled = true;
    },
    releaseTrigger: commonWeaponReleaseTrigger,
    shoot: commonWeaponShoot(bulletsPool.create, {speed:15, damage:20}),
    shooting: commonWeaponShooting,
    pickAmmo() {
        commonWeaponAmmoPicked.call(this, 7);
    },
    getReloadProgress() {
        return 0;
    }
}

function pistolCreator() {
    this.type = 'pistol';
    this.weaponData = {
        triggerPulled: false,
        cooldownSize: 20,
        holder: null,
        cooldown: 0,
        muzzle: {x: -5, y: -4},
        recoil: {x: 5, y: 5}
    }
    this.pullTrigger = pistolFunctions.pullTrigger;
    this.releaseTrigger = pistolFunctions.releaseTrigger;
    this.shoot = pistolFunctions.shoot;
    this.shooting = pistolFunctions.shooting;
    this.pickAmmo = pistolFunctions.pickAmmo;
    this.getReloadProgress = pistolFunctions.getReloadProgress;
    this.texture = 'gun';
    this.sprite.texture = getTexture('gun');
    this.sprite.anchor.set(0.2, 0.5);
}

const assaultRifleFunctions = {
    pullTrigger: commonWeaponPullTrigger,
    releaseTrigger: commonWeaponReleaseTrigger,
    shoot: commonWeaponShoot(bulletsPool.create, {speed:15, damage:12}),
    shooting: commonWeaponShooting,
    pickAmmo() {
        commonWeaponAmmoPicked.call(this, 20);
    },
    getReloadProgress() {
        return 0;
    }
}

function assaultRifleCreator() {
    this.type = 'rifle';
    this.weaponData = {
        triggerPulled: false,
        cooldownSize: 5,
        holder: null,
        cooldown: 0,
        muzzle: {x: 10, y: -5},
        recoil: {x: 10, y: 10}
    }
    this.pullTrigger = assaultRifleFunctions.pullTrigger;
    this.releaseTrigger = assaultRifleFunctions.releaseTrigger;
    this.shoot = assaultRifleFunctions.shoot;
    this.shooting = assaultRifleFunctions.shooting;
    this.pickAmmo = assaultRifleFunctions.pickAmmo;
    this.getReloadProgress = assaultRifleFunctions.getReloadProgress;
    this.texture = 'assault rifle';
    this.sprite.texture = getTexture('assault rifle');
    this.sprite.anchor.set(0.3, 0.5);
}

const shotgunFunctions = {
    pullTrigger: () => {},
    releaseTrigger: () => {},
    shoot: function() {
        if (this.weaponData.cooldown > 0) {
            return;
        }
        if (this.ammo <= 0) {
            this.ammo = 0;
            return;
        }
        this.weaponData.cooldown = this.weaponData.cooldownSize;
        this.ammo--;
        for (let i=0; i<5; i++) {
            const speed = random(15, 20);
            this.ammoLabel.set(this.ammo);
            const direction = this.weaponData.holder ? this.weaponData.holder.scale.x : 0;
            this.sprite.x = -this.weaponData.recoil.x;
            this.sprite.y = random(-this.weaponData.recoil.y/8, 0);
            const bullet = bulletsPool.create(
                this.getGlobalPosition().x + this.weaponData.muzzle.x * direction + random(-10, 10), 
                this.getGlobalPosition().y + this.weaponData.muzzle.y + random(-this.weaponData.recoil.y/2, this.weaponData.recoil.y/2), 
                {velocity:{x:direction * speed, y:0}, speed:speed, damage:9, weakening: 0.01});
        }
    },
    shooting: () => {},
    pickAmmo() {
        commonWeaponAmmoPicked.call(this, 10);
    },
    getReloadProgress() {
        const progress = this.weaponData.cooldown / this.weaponData.cooldownSize;
        return progress > 0 ? progress : 0;
    }
}

function shotgunCreator() {
    this.type = 'shotgun';
    this.weaponData = {
        triggerPulled: false,
        cooldownSize: 40,
        holder: null,
        cooldown: 0,
        muzzle: {x: 10, y: -5},
        recoil: {x: 20, y: 40}
    }
    this.releaseTrigger = shotgunFunctions.releaseTrigger;
    this.shoot = shotgunFunctions.shoot;
    this.pullTrigger = shotgunFunctions.shoot;
    this.shooting = shotgunFunctions.shooting;
    this.pickAmmo = shotgunFunctions.pickAmmo;
    this.getReloadProgress = shotgunFunctions.getReloadProgress;
    this.texture = 'shotgun';
    this.sprite.texture = getTexture('shotgun');
    this.sprite.anchor.set(0.3, 0.5);
}

const carbineFunctions = {
    pullTrigger: commonWeaponPullTrigger,
    releaseTrigger: commonWeaponReleaseTrigger,
    shoot: commonWeaponShoot(bulletsPool.create, {speed:30, damage:80}),
    shooting: commonWeaponShooting,
    pickAmmo() {
        commonWeaponAmmoPicked.call(this, 6);
    },
    getReloadProgress() {
        const progress = this.weaponData.cooldown / this.weaponData.cooldownSize;
        return progress > 0 ? progress : 0;
    }
}

function carbineCreator() {
    this.type = 'carbine';
    this.weaponData = {
        triggerPulled: false,
        cooldownSize: 40,
        holder: null,
        cooldown: 0,
        muzzle: {x: 20, y: -5},
        recoil: {x: 30, y: 5}
    }
    this.pullTrigger = carbineFunctions.pullTrigger;
    this.releaseTrigger = carbineFunctions.releaseTrigger;
    this.shoot = carbineFunctions.shoot;
    this.shooting = carbineFunctions.shooting;
    this.pickAmmo = carbineFunctions.pickAmmo;
    this.getReloadProgress = carbineFunctions.getReloadProgress;
    this.texture = 'carbine';
    this.sprite.texture = getTexture('carbine');
    this.sprite.anchor.set(0.3, 0.5);
}

const machinegunFunctions = {
    pullTrigger: commonWeaponPullTrigger,
    releaseTrigger: commonWeaponReleaseTrigger,
    shoot: commonWeaponShoot(bulletsPool.create, {speed:25, damage:20}),
    shooting: commonWeaponShooting,
    pickAmmo() {
        commonWeaponAmmoPicked.call(this, 50);
    }, 
    weaponStep(delta) {
        if (this.weaponData.triggerPulled) {
            if (this.heat < 30) {
                this.heat += (30 - this.heat) * 0.01 * delta;
            }
        } else {
            if (this.heat > 15) {
                this.heat -= delta * 10;
            }
        }
        this.weaponData.cooldownSize = 30 - this.heat;
    },
    getReloadProgress() {
        return 0;
    }
}

function machinegunCreator() {
    this.type = 'rifle';
    this.weaponData = {
        triggerPulled: false,
        cooldownSize: 30,
        holder: null,
        cooldown: 0,
        muzzle: {x: 20, y: -6},
        recoil: {x: 15, y: 15}
    }
    this.pullTrigger = machinegunFunctions.pullTrigger;
    this.releaseTrigger = machinegunFunctions.releaseTrigger;
    this.shoot = machinegunFunctions.shoot;
    this.shooting = machinegunFunctions.shooting;
    this.pickAmmo = machinegunFunctions.pickAmmo;
    this.weaponStep = machinegunFunctions.weaponStep;
    this.getReloadProgress = machinegunFunctions.getReloadProgress;
    this.heat = 0;
    this.texture = 'machinegun';
    this.sprite.texture = getTexture('machinegun');
    this.sprite.anchor.set(0.3, 0.5);
}

const weaponFunctions = {
    step(delta) {
        const abs = Math.abs;

        /* recoil */
        this.sprite.x *= 0.9; 
        this.sprite.y *= 0.9; 

        /* cooldown */
        this.weaponData.cooldown -= delta;
        if (this.weaponStep) {
            this.weaponStep(delta);
        }

        /* rotation */
        this.sprite.rotation += this.rotationSpeed;
        if (abs(this.velocity.x) < 5 && abs(this.velocity.y) < 5) {
            this.rotationSpeed = 0;
            this.sprite.rotation = 0;
        }
    },
    defaultWeaponStep() {

    }
}

/*
x, y - position to place
ammo - amount of ammo from start
concreeteConstructor - it will be called to finish resetting weapon. 
    must contains specific constructoring for that type of weapon
*/
function createWeapon(x, y, ammo, concreeteConstructor) {
    let container = new PIXI.Container();
    container.sprite = null;
    container.tag = 'weapon';
    container.sprite = new PIXI.Sprite();

    resetWeapon.apply(container, arguments);

    container.step = weaponFunctions.step;

    container.addChild(container.sprite);
    physicalObjects.add(container);
    weapons.add(container);
    everyFramers.add(container);
    return container;
}

function resetWeapon(x, y, ammo, concreeteConstructor) {
    this.velocity = {x: 0, y: 0};
    this.x = x;
    this.y = y;
    this.ammo = ammo;
    this.ammoLabel = ammoLablesPool.create(ammo, this);
    this.weaponStep = weaponFunctions.defaultWeaponStep;
    this.rotationSpeed = 0;
    concreeteConstructor.apply(this, arguments);
    this.collisionBox = {width: this.sprite.width, height: this.sprite.height};
}

function destroyWeapon() {
    ammoLablesPool.destroy(this.ammoLabel);
}

/* can be used as default mixin for pulling trigger when constructoring weapon */
function commonWeaponPullTrigger() {
    this.weaponData.triggerPulled = true;
}

/* can be used as default mixin for releasing trigger when constructoring weapon */
function commonWeaponReleaseTrigger() {
    this.weaponData.triggerPulled = false;
}

/* high-order function. can be used as default mixin for shoot bullet when constructoring weapon */
function commonWeaponShoot(bulletConstructor, options) {
    return function() {
        if (this.ammo <= 0) {
            this.ammo = 0;
            return;
        }
        this.ammo--;
        this.ammoLabel.set(this.ammo);

        this.sprite.x = -this.weaponData.recoil.x/2;
        this.sprite.y = random(-this.weaponData.recoil.y/2, this.weaponData.recoil.y/2);

        const direction = this.weaponData.holder ? this.weaponData.holder.scale.x : this.scale.x;
        const bullet = bulletConstructor(
            this.getGlobalPosition().x + this.weaponData.muzzle.x * direction, 
            this.getGlobalPosition().y + this.weaponData.muzzle.y + this.sprite.y, 
            {velocity:{x:direction * options.speed, y:0}, ...options});
    }
}

/* can be used as default mixin for holding trigger when constructoring weapon */
function commonWeaponShooting(delta) {
    if (this.weaponData.cooldown <= 0 && this.weaponData.triggerPulled) {
        this.shoot();
        this.weaponData.cooldown = this.weaponData.cooldownSize;
    }
}

/* can be used as default mixin for picking up ammo when constructoring weapon */
function commonWeaponAmmoPicked(amount) {
    this.ammo += amount;
    this.ammoLabel.set(this.ammo);
}

/* create simple pistol near a hero at the start of game*/
onTexturesLoaded.push(() => {
    Window.gun = weaponsPool.create(app.screen.width / 2 - 180, app.screen.height / 2, 35, pistolCreator);
})

/*--- bullets ---*/

const bulletFunctions = {
    collidableData: {
        tagHandlers: {
            'block': (self, other) => {bulletsPool.destroy(self);},
            'platform': (self, other) => {},
            'enemy': (self, other) => {self.velocity.x *= random(0.4, 0.9); if (Math.abs(self.velocity.x) < 15) {bulletsPool.destroy(self)};}
        },
        directHandlers: []
    },
    step() {
        if (this.weakening && this.damage > 0) {
            this.damage *= (1-this.weakening);
            this.velocity.x *= (1-this.weakening);
            if (Math.abs(this.velocity.x) < 7) {
                bulletsPool.destroy(this);
            }
        }
    }
}

/*
x, y - position
options = {
    velocity: {x, y} - intial speed
    damage: inflicted damage,
    tex: texture (optional),
    weakening: weakening coefficient (optional)
}
*/
function createBullet(x, y, options) {
    let container = new PIXI.Container();

    container.collisionBox = {width: 10, height: 2};
    const velocity = options && options.velocity ? options.velocity : {x:0, y:0};
    const tex = options && options.sprite ? options.sprite : 'bullet';
    container.sprite = getSprite(tex);
    container.sprite.anchor.set(0.5);

    container.tag = 'bullet'
    resetBullet.apply(container, arguments); 

    container.collidableData = bulletFunctions.collidableData;
    container.step = bulletFunctions.step;

    everyFramers.add(container);
    container.addChild(container.sprite);
    return container;
}

function resetBullet(x, y, options) {
    const velocity = options && options.velocity ? options.velocity : {x:0, y:0};
    const damage = options && options.damage ? options.damage : 1;
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.sprite.scale = {x:velocity.x/4, y:2};
    this.damage = damage;
    this.weakening = options.weakening;

    this.timeouts = [];   
}

function destroyBullet() {
    for (let t of this.timeouts) {
        clearTimeout(t);
    }
}

/*--- ammo ---*/

const ammoFunctions = {
    collidableData: {
        tagHandlers: {
            'hero': (self, other) => {if (other.hasWeapon()) {ammoPool.destroy(self)}},
        },
        directHandlers: []
    }
}

function createAmmo(x, y) {
    let result = new PIXI.Container();
    result.sprite = getSprite('ammo');
    result.sprite.anchor.set(0.5);
    result.tag = 'ammo';

    result.collisionBox = {width: 24, height: 16};
    result.collidableData = ammoFunctions.collidableData;
    resetAmmo.apply(result, arguments);

    result.addChild(result.sprite);
    physicalObjects.add(result);
    return result;
}

function resetAmmo(x, y) {
    this.velocity = {x: 0, y: 0};
    this.x = x;
    this.y = y;
}

/* ammo labels */

const ammoLabelFunctions = {
    set: function(amount) {
        this.textSprite.text = amount > 0 ? amount : 'no ammo!';
    }
}

function createAmmoLabel(amount, attachment) {
    let result = new PIXI.Container();
    result.textSprite = new PIXI.Text('0', {fill: '#6b472f', fontSize: '14'});
    result.textSprite.anchor.set(0.5);
    result.tag = 'ammolabel';

    resetAmmoLabel.apply(result, arguments);

    result.set = ammoLabelFunctions.set

    result.addChild(result.textSprite);
    ammoLabels.add(result);
    return result;
}

function resetAmmoLabel(amount, attachment) {
    this.attachment = attachment;
    this.textSprite.text = amount;
}