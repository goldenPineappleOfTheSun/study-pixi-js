/*
pools at the top is for reuse of same assets (see pool.js)
skeletons created via createSkeleton/resetSkeleton
destroyed via destroySkeleton

skeletonScriptableData - is collection of scripts skeleton can perform
every script is sequence of awaited steps
every script must have "frame" as the first param
frame is function for creating anither awaitable step
scriptInAction set to true whe script is started and set to false after script is finished 
(see "scriptables" family) 

actorData - is collection of params provided by "actors" family. it responsible for
automatically applying movement for actor such as jumping and walking via common api.
common api isnt works by calling functions but by setting actorData params
for example setting up goingRight to true/false changes velocity automatically
(see "actors" family) 

another thing often used here is svision and pvision
theyre optimised checkers for if some area intersects statics blocks
svision is for the static blocks, pvision is for the static platforms
(see lowpolystaticvision)

*/


let skeletonsPool = new Pool(createSkeleton, resetSkeleton, destroySkeleton);
let skeletonsSpawnPool = new Pool(createSkeletonSpawn, resetSkeletonSpawn, {layer: 'back'});
const SKELETON_GOING_SPEED = 1.5;

const skeletonScriptableData = {
    /* 
    script for universal jumping up left and right. uses "actors" family params
    right - true if right direction 
    height - how long to hold jump
    time - how long to hold right/left
    speed - hspeed in air 
    waitBeforeMove - how long to wait before start moving left/right in the air
    */
    async jump(frame, right, height, time, speed, waitBeforeMove) {
        const prevGoingSpeed = this.actorData.goingSpeed;
        speed = speed || prevGoingSpeed;
        waitBeforeMove = waitBeforeMove || 1;
        const awaitLanding = async function() {
            if (this.isLanded()) {
                return;
            } else {
                await frame(10, awaitLanding);
            }
        };

        await frame(0, async function() {
            this.actorData.goingSpeed = speed; 
            this.actorData.jumping = true;
        });

        await frame(waitBeforeMove, async function() {
            this.actorData.goingLeft = !right; 
            this.actorData.goingRight = right; 
        });

        if (height > time) {
            await frame(time, async function() {
                this.actorData.goingLeft = false; 
                this.actorData.goingRight = false; 
            });
            await frame(height - time, async function() {
                this.actorData.jumping = false;
            });
        } else {
            await frame(height, async function() {
                this.actorData.jumping = false;
            });
            await frame(time - height, async function() {
                this.actorData.goingLeft = false; 
                this.actorData.goingRight = false; 
            });
        }
        await frame(10, async function() {
            await awaitLanding.call(this);
            this.actorData.goingSpeed = prevGoingSpeed
        });
    },

    /*
    script for dashing attack hero
    right - true if direction for attack is right
    speed - dash speed
    time - number of frames to perform dash
    */
    async attack(frame, right, speed, time) {
        const prevGoingSpeed = this.actorData.goingSpeed;
        await frame(0, function() {
            this.debugText = '!';
            this.actorData.goingSpeed = 2; 
            this.actorData.goingLeft = right; 
            this.actorData.goingRight = !right; 
            this.actorData.jumping = false; 
            this.setAnimation('attack');
        });
        await frame(10, function() {
            this.actorData.goingSpeed = speed; 
            this.actorData.goingLeft = !right; 
            this.actorData.goingRight = right; 
            this.actorData.jumping = false; 
            this.scale.x = right ? 1 : -1;
        });
        await frame(time - 5, function() {
            this.attacking = true;
        });
        await frame(time, function() {
            this.actorData.goingSpeed = prevGoingSpeed;
            this.actorData.goingLeft = false; 
            this.actorData.goingRight = false; 
            this.attacking = false;
            this.setAnimation('idle');
            this.debugText = ' ';
        });
    },
}

const skeletonCollidableData = {
    tagHandlers: {
        'bullet': (self, other, intersection) => {
            self.lastDamageVector = {
                x: other.x, 
                y: other.y,
                vector: other.velocity.x};
            self.damage(other.damage, self.lastDamageVector);
        },
        'hero': (self, other) => {
            const intersection = getRectsIntersection(getCollisionBox(self), getCollisionBox(other));
            if (intersection && intersection.normal.y > 0) {
                self.damage(other.velocity.y - self.velocity.y);
                self.collisionBox.height = 40;
                setTimeout(() => {self.collisionBox.height=54}, 100)
            }
        },
        'weapon': (self, other) => {
            const abs = Math.abs;
            if (abs(other.velocity.x) > 5 || abs(other.velocity.y) > 9) {
                self.damage(abs(other.velocity.x) + abs(other.velocity.y));
                self.stunned = 150;
                self.actorData.goingLeft = false;
                self.actorData.goingRight = false;
                self.actorData.jumping = false;
                self.setAnimation('idle');
                /* change "other" is no good but how to know being a weapon if damage was taken */
                other.velocity.x *= -0.5;
                other.velocity.y = -5;
            }
        },
        /*
        when anemy collides with other enemy most of the time it means they cant aggree in what direction to move
        so let the more aggressive win
        */
        'enemy': (self, other) => {
            if (self.scriptInAction || self.stunned > 0) {
                return;
            }
            self.setAnimation('idle');
            if (self.actorData.goingLeft !== other.actorData.goingLeft) {
                if (other.traits['aggressive'] > self.traits['aggressive']) {
                    self.actorData.goingLeft = other.actorData.goingLeft;
                } else {
                    self.velocity.y = -3;
                    self.debugText = '!';
                    setTimeout(() => self.debugText = '', 500);
                }
            }
            if (self.actorData.goingRight !== other.actorData.goingRight) {
                if (other.traits['aggressive'] > self.traits['aggressive']) {
                    self.actorData.goingRight = other.actorData.goingRight;
                }
            }
        },
        'block': (self, other, intersection) => {
            if (self.scriptInAction || self.stunned > 0) {
                return;
            }
        }
    },
    directHandlers: []
}

const skeletonFunctions = {

    /*
    its like step() but more related to acting like a person (enemy)
    */
    act(delta) {
        const abs = Math.abs;

        this.traits.staleNest.time += delta;

        /* setting animation */
        if (this.currentAnimation !== 'attack') {
            if (this.isLanded()) {
                if (this.actorData.goingLeft !== this.actorData.goingRight) {
                    this.setAnimation('walk');
                    this.scale.x = this.actorData.goingLeft ? -1 : 1;
                } else {
                    this.setAnimation('idle');
                }
            } else {
                this.setAnimation('jump');
            }
        }

        if (this.scriptInAction || this.stunned > 0) {
            return
        }

        const bounds = getCollisionBox(this); 
        const direction = this.velocity.x !== 0 ? abs(this.velocity.x) / this.velocity.x : 0;
        let jumpHappened = false;

        /* check if theres a pit to jump over */
        if ((new Date() - this.traits.lastJumpOverPit > 2000 * this.traits.calm) && direction !== 0) {
            
            if (this.isFacingPit()) {
                if (this.actorData.goingLeft && direction === -1) {
                    this.actorData.goingLeft = false;
                }
                if (this.actorData.goingRight && direction === 1) {
                    this.actorData.goingRight = false;
                }
                let pitSize = 8;
                const checkpit = {
                    x: this.x + this.collisionBox.width * 0.5 * direction, 
                    y: this.y + this.collisionBox.height / 2, 
                    width: 1, 
                    height: CELL_HEIGHT};
                for (let i=0; i<CELL_WIDTH*4; i+=8) {
                    if (svision.check({...checkpit, ...{x: checkpit.x + i * direction}})) {
                        /* do jump if theres a room for it */
                        const checkobstacles = {
                            x: this.x + this.collisionBox.width * 0.5 * direction + (direction < 0 ? -i : 0), 
                            y: this.y - this.collisionBox.height * 2, 
                            width: i, 
                            height: this.collisionBox.height * 2}
                        if (!svision.check(checkobstacles)) {
                            this.runScript('jump', direction > 0, i * 0.1, i * 0.3, 4);
                            jumpHappened = true;
                        }
                        this.traits.lastJumpOverPit = new Date();
                        this.traits.lastGiveupFollow = new Date();
                        break;
                    }
                }
                if (!jumpHappened) {
                    if (random(0, 10) < 1 && new Date() - this.traits.lastChangeDirection > 5000) {
                        /* turn around */
                        this.actorData.goingLeft = direction > 0;
                        this.actorData.goingRight = direction < 0;
                    } else {
                        /* trying to jump on top */
                        let hpoint = direction > 0 ? {x: bounds.x + bounds.width + 2, y: bounds.y - CELL_HEIGHT * 2} : {x: bounds.x - 2, y: bounds.y - CELL_HEIGHT * 2};
                        for (let i=0; i<CELL_WIDTH*2; i+=8) {
                            if (svision.check({x: hpoint.x+i*direction, y:hpoint.y, width:1, height:CELL_HEIGHT*2})) {
                                let vpoint = {x: hpoint.x+i*direction, y: bounds.y - CELL_HEIGHT * 2}
                                if (svision.check({x: vpoint.x, y:hpoint.y, width:1, height:1})) {
                                    /* too high */
                                    break; 
                                }
                                for (let j=0; j<CELL_HEIGHT * 2; j+=8) {
                                    if (svision.check({x: vpoint.x, y:hpoint.y+j, width:1, height:1})) {
                                        if (i < 10) {
                                            this.runScript('jump', direction > 0, (CELL_HEIGHT * 3 - j) * 0.1, 20, 2, 10);
                                        } else {
                                            this.runScript('jump', direction > 0, (CELL_HEIGHT * 3 - j) * 0.2, i * 1, 2, 0);
                                        }
                                        jumpHappened = true;
                                        break;
                                    }
                                }
                            }
                        }

                        /* diagonal jump */
                        if (!jumpHappened) {
                            let hpoint = direction > 0 ? {x: bounds.x + bounds.width + 2, y: bounds.y - CELL_HEIGHT} : {x: bounds.x - 2, y: bounds.y - CELL_HEIGHT};
                            for (let i=20; i<CELL_WIDTH*3; i+=8) {
                                if (svision.check({x: hpoint.x+i*direction, y:hpoint.y, width:1, height:CELL_HEIGHT*4})) {
                                    let vpoint = {x: hpoint.x+i*direction, y: bounds.y - CELL_HEIGHT}
                                    if (svision.check({x: vpoint.x, y:hpoint.y, width:1, height:1})) {
                                        /* too high */
                                        break; 
                                    }
                                    for (let j=0; j<CELL_HEIGHT * 4; j+=8) {
                                        if (svision.check({x: vpoint.x, y:hpoint.y+j, width:1, height:1})) {
                                            this.runScript('jump', direction > 0, (CELL_HEIGHT * 3 - j * 0.5) * 0.1, i * 0.4, 4);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        /* check if there is an onground obstacle to jump on */
        if (!jumpHappened && direction !== 0) { 
            let point = direction > 0 ? {x:bounds.x + bounds.width + 15, y:bounds.y-1} : {x:bounds.x - 15, y:bounds.y-1};
            let checkobs = {x: point.x, y: point.y, width: 1, height: bounds.height/2-3};
            if (svision.check(checkobs)) {
                const maxHeight = bounds.y - CELL_HEIGHT * 1.5;
                point.y = maxHeight;
                const tooHigh = svision.check({x: point.x, y:point.y, width:1, height:1});
                if (!tooHigh && this.doesHaveSpaceAbove((CELL_HEIGHT * 2) + bounds.height)) {
                    for (let i=0; i<CELL_HEIGHT * 2; i+=8) {
                        if (svision.check({x: point.x, y:point.y+i, width:1, height:1})) {
                            const jumpHeight = 10 + (CELL_HEIGHT * 2 - i) * 0.2;
                            this.runScript('jump', direction > 0, jumpHeight, jumpHeight + 15, 2);
                            jumpHappened = true;
                            break;
                        }
                    }
                } else {
                    if (random(0, 5) < 1) {
                        this.actorData.goingLeft = direction > 0;
                        this.actorData.goingRight = direction < 0;
                    }
                }
            }
        }

        /* check ledge to jump on */
        if (!jumpHappened && new Date() - this.traits.lastJumpOnLedge > 1000 * this.traits.calm) {
            /* check if thereis room for it */            
            this.traits.lastJumpOnLedge = new Date();
            let pointA = {x: this.x + bounds.width / 2 + 25, y: bounds.y - CELL_HEIGHT * 1.5};
            let pointB = {x: this.x - bounds.width / 2 - 25, y: bounds.y - CELL_HEIGHT * 1.5};
            /* if not too high */
            if (!svision.check({...pointA, ...{width: 1, height: 1}})) {
                for (let i=0; i<CELL_HEIGHT * 1.5; i+=8) {
                    if (svision.check({x:pointA.x, y:pointA.y+i, width:1, height:1})) {
                        const jumpHeight = (CELL_HEIGHT * 1.5 - i) * 0.3
                        if (this.doesHaveSpaceAbove(jumpHeight + bounds.height)) {
                            this.runScript('jump', true, jumpHeight , jumpHeight * 1.5, 3, jumpHeight * 0.3);
                            jumpHappened = true;
                            break;
                        }
                    }
                }
            }
        }

        /* check if there is platform above to jump on */
        if (!jumpHappened && new Date() - this.traits.lastPlatformJump > 3000 * this.traits.calm) { 
            this.traits.lastPlatformJump = new Date();

            if (pvision.check({x:this.x, y:bounds.y+bounds.height, width:1, height:3}) && random(0, 3) < 1) {
                this.actorData.descend = true;
                setTimeout(() => this.actorData.descend = false, 30 * delta);
                jumpHappened = true;
            }

            if (!jumpHappened) {
                for (let i=0; i<CELL_HEIGHT*2; i+=8) {
                    const point = {x: this.x, y:this.y-i, width:1, height:1};
                    if (svision.check(point)) {
                        break;
                    }
                    if (pvision.check(point)) {
                        this.runScript('jump', true, i * 0.5, 0, 1);
                        jumpHappened = true;
                        break;
                    }
                }
            }
        }

        /* checking if there is need to jump from platform down */
        if (abs(this.x - hero.x) < CELL_WIDTH * 2 && hero.y > this.y) {
            this.actorData.descend = true;
            setTimeout(() => this.actorData.descend = false, 30 * delta);
        }

        /* stick to default speed */
        this.actorData.goingSpeed = SKELETON_GOING_SPEED;
        let seesHero = false;        

        /* follow hero */
        if (new Date() - this.traits.lastFollow > (this.traits['calm'] * 500) / timeSpeed) {
            this.traits.lastFollow = new Date();  
            seesHero = !checkLine('block', this, hero);
            if (seesHero) {
                this.follow();
            }
        }

        /* dont stay too long in one place */
        if (abs(this.x - this.traits.staleNest.x) < 64 && abs(this.y - this.traits.staleNest.y) < 64) {
            if (this.traits.staleNest.time > 500) {
                this.traits.staleNest.time -= 300;
                this.runScript('jump', Math.random() > 0.5, random(5, 10), random(10, 20), 4);
            }
        } else {
            this.traits.staleNest.time = 0;
        }
        this.traits.staleNest.x = this.x;
        this.traits.staleNest.y = this.y;
            
        /* attack (maybe) */
        this.combat();

        /* change direction (sometimes) */
        if (new Date() - this.traits.lastChangeDirection > (this.traits.calm * 10000) / timeSpeed) {
            this.traits.lastChangeDirection = new Date();
            if (!seesHero) {
                dice = random(0, 1e9) ^ 0;
                if (!this.actorData.goingLeft && !this.actorData.goingRight) {
                    this.actorData.goingLeft = dice % 2 === 0;
                    this.actorData.goingRight = dice % 2 === 1;
                } else {
                    if (dice % 9 === 0) {
                        this.actorData.goingLeft = false; 
                        this.actorData.goingRight = false;
                    }
                }
                return;
            }

            /* get rid of a hero on the head */
            if (areSpritesIntersect(hero, this) && abs(hero.y + hero.height - this.y) < 15) {
                this.actorData.jumping = true;
            }
        }
    },

    /*
    animations is done with help of pixi-spine
    different animations is put in different tracks
    and after current animation changed alpha is gently interpolate between tracks
    */
    setAnimation(name) {
        this.currentAnimation = name;
    },

    interpolateAnimations() {
        for (let i in this.sprite.spineData.animations) {
            const anim = this.sprite.spineData.animations[i];
            const target = this.currentAnimation === anim.name ? 1 : 0;
            const track = this.sprite.state.tracks[i];
            track.alpha += (target - track.alpha) * 0.1;
        }
    },

    /* trying to follow the hero (if sees him) */
    follow() {
        if (this.isFacingPit()) {
            return;
        }

        const abs = Math.abs;
        const maxDist = 50;
        const minDist = 25;
        const vertMaxDist = 30;
        this.actorData.goingRight = hero.x - this.x > maxDist;
        this.actorData.goingLeft = hero.x - this.x < -maxDist;
        if (abs(hero.x - this.x) < minDist) {
            this.actorData.goingRight = hero.x - this.x < 5;
            this.actorData.goingLeft = hero.x - this.x > 5;
        }
    },

    /* trying to punch the hero (if hes near) */
    combat() {            
        const abs = Math.abs;
        const maxDist = 50;
        const minDist = 25;
        const vertMaxDist = 30;
        if (abs(hero.x - this.x) >= minDist && abs(hero.x - this.x) <= maxDist && abs(hero.y - this.y) < vertMaxDist) {
            this.prepareToAttack();
        }
    },

    prepareToAttack() {
        if (this.scriptableData.inAction || this.stunned > 0) {
            return
        }
        if (this.traits['attackcooldown'] > 0) {
            this.traits['attackcooldown']--;
            return;
        }

        this.traits['attackcooldown'] = (1 - this.traits['aggressive']);
        this.attack();
    },

    attack() {
        this.runScript('attack', ((hero.x - this.x) / Math.abs(hero.x - this.x)) === 1, 5, 10);
    },

    /* damage taken */
    damage(amount, vector) {
        if (amount < 0) {
            return;
        }
        this.colorTint = 1
        this.velocity.y -= 2;
        this.velocity.x += vector ? vector.vector * 0.5 : 0;
        this.hp -= amount;
        if (this.hp <= 0) {
            skeletonsPool.destroy(this);
        }
    },

    /* check if land is touched by feet. true if touch */
    isLanded() {
        if (this.lastIsLanded !== undefined && this.lastIsLandedTime === new Date()) {
            return this.lastIsLanded;
        }
        const rect = getCollisionBox(this);
        const result = checkCollisionsInArea(this, app.stage.children, {x:rect.x, y:rect.y+rect.height, width: rect.width, height: 5}, 'solid');
        this.lastIsLanded = result;
        this.lastIsLandedTime = new Date();
        return result;
    },

    /* check if there is a pit near. true if facing pit */
    isFacingPit() {
        const direction = this.velocity.x !== 0 ? Math.abs(this.velocity.x) / this.velocity.x : 0;
        const rect = {
            x: this.x + this.collisionBox.width * 0.5 * direction, 
            y: this.y + this.collisionBox.height / 2, 
            width: 1, 
            height: CELL_HEIGHT * 3};
        return this.isLanded() && !svision.check(rect) && !pvision.check(rect);
    },

    /* check free room above with no static blocks. true if no blocks above */
    doesHaveSpaceAbove(height) {
        const bounds = getCollisionBox(this);
        const checkabove = {x: bounds.x - 3, y: bounds.y - height, width: bounds.width + 6, height: height + 10};
        return !svision.check(checkabove);
    },

    /* called every step */
    step(delta) {
        this.interpolateAnimations();

        if (isPressed('j')) {
            this.actorData.goingLeft = true;
        }
        if (isPressed('l')) {
            this.actorData.goingRight = true;
        }

        this.colorTint *= 0.9 * delta;
        if (this.stunned > 0 && ((new Date() / 100) ^ 0) % 2 === 0) {
            this.sprite.tint = 0xcccccc;
        } else {
            this.sprite.tint = 0xffffff - ((((0xffffff - 0xff0000) * this.colorTint) / 0x001111) ^ 0) * 0x001111;
            this.stunned -= delta;
        }

        this.sprite.state.timeScale = delta * 1.5;

        this.ts.text = this.debugText;
    }
}

/*
x, y - position to place
*/
function createSkeleton(x, y) {
    let container = new PIXI.Container();

    container.sprite = new PIXI.spine.Spine(loader.resources.skeleton.spineData);
    loader.resources.skeleton.spineAtlas.pages[0].baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    container.sprite.scale = {x:1.1, y:1.1}
    container.sprite.state.timeScale = 1.5;
    for (let i in container.sprite.spineData.animations) {
        const anim = container.sprite.spineData.animations[i];
        container.sprite.state.setAnimation(i, anim.name, true).alpha = 0;
    }
    container.currentAnimation = 'idle';

    container.tag = 'enemy';
    container.scriptableData = skeletonScriptableData;
    container.collidableData = skeletonCollidableData;
    container.setAnimation = skeletonFunctions.setAnimation;
    container.interpolateAnimations = skeletonFunctions.interpolateAnimations;
    container.act = skeletonFunctions.act;
    container.follow = skeletonFunctions.follow;
    container.combat = skeletonFunctions.combat;
    container.damage = skeletonFunctions.damage;
    container.prepareToAttack = skeletonFunctions.prepareToAttack;
    container.attack = skeletonFunctions.attack;
    container.isLanded = skeletonFunctions.isLanded;
    container.isFacingPit = skeletonFunctions.isFacingPit;
    container.doesHaveSpaceAbove = skeletonFunctions.doesHaveSpaceAbove;
    container.step = skeletonFunctions.step;


    let textSprite = new PIXI.Text('', {fill: '#fef400', fontSize: '12'});
    textSprite.anchor.set(0.5);
    container.ts = textSprite;
    container.ts.y = -40;
    container.addChild(textSprite);
    container.debugText = '';

    resetSkeleton.call(container, x, y);
    container.addChild(container.sprite);
    everyFramers.add(container);
    scriptables.add(container);
    physicalObjects.add(container);
    actors.add(container);
    return container;
}

function resetSkeleton(x, y) {
    this.timeouts = [];
    this.hp = 42;
    this.stunned = 0;
    this.attacking = false;
    this.scriptInAction = false;
    this.x = x;
    this.y = y;
    this.velocity = {x: 0, y: 0};
    this.collisionBox = {width: 24, height: 54};
    this.actorData = {
        goingSpeed: 1.5,
        jumpingHeight: 25,
        goingLeft: false,
        goingRight: false,
        jumping: false
    }
    this.traits = {
        observable: random(0.3, 0.9),
        aggressive: random(0.3, 0.8),
        calm: random(0.5, 1),
        /* machinery */
        attackcooldown: 0,
        lastobserved: new Date(),
        lastChangeDirection: new Date(0),
        lastJumpOverPit: new Date(0),
        lastGiveupFollow: new Date(0),
        lastJumpOnLedge: new Date(0),
        lastFollow: new Date(0),
        lastPlatformJump: new Date(0),
        staleNest: {x:0, y:0, time:0}
    }
    this.colorTint = 0;
}

/*
after being destroyed skeleton may left some loot and useles bones
*/
function destroySkeleton() {
    if (this._destroyed) {
        return;
    }
    plusScore();
    styleEnemyKilled();
    for (let t of this.timeouts) {
        clearTimeout(t);
    }
    if (random(0, weaponsPool.pool.filter(x => x.used).length) < 1) {
        const possibleWeapons = [
            [this.x, this.y, 35, pistolCreator],
            [this.x, this.y, 35, pistolCreator],
            [this.x, this.y, 60, assaultRifleCreator],
            [this.x, this.y, 60, assaultRifleCreator],
            [this.x, this.y, 10, shotgunCreator],
            [this.x, this.y, 10, shotgunCreator],
            [this.x, this.y, 12, carbineCreator],
            [this.x, this.y, 12, carbineCreator],
            [this.x, this.y, 80, machinegunCreator],
        ];
        let weapon = weaponsPool.create.apply(null, possibleWeapons[random(0, possibleWeapons.length) ^ 0 % possibleWeapons.length]);
        weapon.velocity = {x: random(-5, 5), y:random(-10, 0)}
    }
    if (random(0, weaponsPool.pool.filter(x => x.used).length * 2) < 1) {
        ammoPool.create(this.x, this.y);
    }

    const vector = this.lastDamageVector || {x:this.x, y:this.y, vector:0};
    const putBone = (x, y, w, h, tex) => {
        const dx = (this.x + x - vector.x);
        const dy = (this.y + y - vector.y) - 16;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const index = dist / (this.collisionBox.height * 0.5);
        junkPool.create(
            this.x + x, this.y + y, 
            {width: w, height: h}, tex, 
            {
                x: tex === 'head' ? random(-5, 5) : Math.pow(vector.vector, 3) * Math.pow(index, 10) * 0.7, 
                y: tex === 'head' ? -7 : (-5 + dy * 0.2) * 0.2
            }, 
            0, -dy * 0.01);
    };
    putBone(0, -24, 25, 16, 'head');
    putBone(0, -8, 14, 4, 'separate bone');
    putBone(0, 0, 14, 4, 'separate bone');
    putBone(0, 0, 14, 4, 'separate bone');
    putBone(0, 16, 14, 4, 'separate bone');
    putBone(16, 16, 14, 4, 'separate bone');
}

/*--- skeleton spawn ---*/

/*
special effect to show where new skeleton will spawn
x, y - position
*/
function createSkeletonSpawn(x, y) {
    let result = new PIXI.Container();
    result.tag = 'enemyspawn';
    result.sprite = getSprite('skeleton');
    result.sprite.anchor.set(0.5, 0.5);
    result.velocity = {x:0, y:0};
    result.step = function(delta) {
        this.y -= 1;
        this.alpha += 0.02;
        if (this.startPosition - this.y >= 64) {
            skeletonsPool.create(this.x, this.y);
            skeletonsSpawnPool.destroy(this);
        }
    }

    resetSkeletonSpawn.call(result, x, y);

    result.addChild(result.sprite);
    everyFramers.add(result);
    return result;
}

function resetSkeletonSpawn(x, y) {
    this.x = x;
    this.y = y;
    this.startPosition = y;
    this.alpha = 0;
    return this;
}

/*
spawn new skeleton every n seconds
*/
let spawnTimeout = 30;
let setSpawnTimeout = 120;
function spawnEnemy(delta) {
    if (spawnTimeout > 0) {
        spawnTimeout -= delta;
        return;
    }
    spawnTimeout = setSpawnTimeout;
    let x = 10;
    let y = 5;
    while ((levelLayout[y][x] !== 'X' && levelLayout[y][x] !== '=') || levelLayout[y-1][x] !== ' ') {
        x = random(1, levelLayout[0].length-1) ^ 0;
        y = random(2, levelLayout.length-1) ^ 0;
    }
    let skeleton = skeletonsSpawnPool.create(x*64+32, y*64+32);
    if (setSpawnTimeout > 30) {
        setSpawnTimeout -= 1;
    }
}