/* simple loader. im bit lazy to adding assets support*/

const loader = new PIXI.Loader(); 

loader.add('spritesheet', 'images/spritesheet.json');
loader.add('front bg', 'images/front bg.png');
loader.add('skeleton', 'images/skeleton.json');
loader.add('hero', 'images/hero.json');
loader.load(spritesheetLoaded);
onTexturesLoaded = [];

function spritesheetLoaded() {
    onTexturesLoaded.forEach(x => x())
}

function getTexture(name) {
    if (loader.loading) {
        return null;
    }
    return loader.resources['spritesheet'].textures[`${name}.png`];
}

function getSprite(name) {
    if (loader.loading) {
        return null;
    }
    return new PIXI.Sprite(getTexture(name));
}