const levelLayout = [
    'X                       X',
    'X                       X',
    'X                       X',
    'X                       X',
    'X                       X',
    'X                   X   X',
    'X           X      XXX  X',
    'X    X      X     XXXX  X',
    'XXXXXXXXXXXXXXXXXXXXXXXXX',
    'X                       X',
    'X                       X',
    'X                       X',
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