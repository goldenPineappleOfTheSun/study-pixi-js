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

function fireworkBones() {
    let count = random(2, 15);
    const x = 850 + random(-100, 100);
    const y = 400 + random(-100, 100);
    for (let i=0; i<count; i++) {
        const tex = random(0, 10) < 1 ? 'head' : 'separate bone';
        const size = {width: getTexture(tex).width, height: getTexture(tex).height}; 
        junkPool.create(
            x + random(-10, 10), y + random(-10, 10), size, tex, 
            {x: random(-10, 10), y: random(-10, 10)}, 
            random(-Math.PI, Math.PI), random(-0.1, 0.1));
    }
}

onTexturesLoaded.push(() => {
    registerKeydown('z', fireworkBones);
})

setInterval(fireworkBones, 400);