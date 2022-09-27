const levelLayout = [
    'X                       X',
    'X           XX          X',
    'X                       X',
    'X <X  XX  X    X  XX>   X',
    'X<                   > =X',
    'X>     -         ==   > X',
    'X >    X               >X',
    'X XXXXXXXX      X==    <X',
    'X      X        X     < X',
    'XXXXXX X X     =X==  <  X',
    'XXXXXX   X      X   <   X',
    'XXXXXXXXXXXXXXXXXXXXXXXXX'
]

for (let x=0; x<25; x++) {
    for (let y=0; y<12; y++) {
        if (levelLayout[y][x] === 'X') {
            stage.add(createBlock(x, y));
        }
        if (levelLayout[y][x] === '=') {
            stage.add(createPlatform(x, y));
        }
        if (levelLayout[y][x] === '-') {
            stage.add(createBlock(x, y-0.5));
        }
        if (levelLayout[y][x] === '>') {
            for (let i=0; i<10; i++) {
                stage.add(createPlatform(x+i*0.1-0.4, y+i*0.1-0.4, {scale: {x:0.2, y:0.2}}));
            }
        }
        if (levelLayout[y][x] === '<') {
            for (let i=0; i<10; i++) {
                stage.add(createPlatform(x+1-i*0.1-0.4, y+i*0.1-0.4, {scale: {x:0.2, y:0.2}}));
            }
        }
    }
}

onTexturesLoaded.push(() => {
    let tiledBg = PIXI.Sprite.from('images/front bg.png');
    tiledBg.x = 0;
    tiledBg.y = 0;
    tiledBg.scale = {
        x: 0.95,
        y: 0.95
    }
    stage.add(tiledBg, 'tiledbg')
})

function createBox(x, y, w, h) {
    container = new PIXI.Graphics();
    container.beginFill(0xfef400);
    container.drawRect(-w/2, -h/2, w, h);
    container.tag = 'testbox';
    container.x = x;
    container.y = y;
    container.velocity = {x:0, y:0};
    container.collisionBox = {width:w, height:h};
    physicalObjects.add(container);
    stage.add(container);
    return container;
}

function spawnRandomBlock() {
        let x = 0;
        let y = 0;
        let width = random(20, 60);
        let height = random(10, 60);
        while (svision.check({x, y, width, height})) {
            x = random(0, app.screen.width);
            y = random(0, app.screen.height - 100);
            width = random(20, 60);
            height = random(10, 60);
        }
        createBox(x, y, width, height);
}

onTexturesLoaded.push(() => {
    registerKeydown('z', spawnRandomBlock);
})

setInterval(spawnRandomBlock, 3000);