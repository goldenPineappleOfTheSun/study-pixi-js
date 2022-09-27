

function createBlock(x, y, options) {
    let result = new PIXI.Container();

    const scale = options && options.scale ? options.scale : {x:1, y:1};

    result.sprite = new PIXI.Graphics();
    result.sprite.beginFill(0xffffff);
    result.sprite.drawRect(-CELL_WIDTH/2, -CELL_HEIGHT/2, CELL_WIDTH, CELL_HEIGHT);
    result.sprite.alpha = 0;

    result.collisionBox = {width: 64 * scale.x, height: 64 * scale.y};
    result.tag = 'block'
    result.x = x * CELL_WIDTH + CELL_WIDTH * 0.5;
    result.y = y * CELL_HEIGHT + CELL_HEIGHT * 0.5;
    result.scale = scale;
    result.addChild(result.sprite);
    return result;
}

function createPlatform(x, y, options) {
    let result = new PIXI.Container();

    const scale = options && options.scale ? options.scale : {x:1, y:1};

    result.collisionBox = {width: CELL_WIDTH * scale.x, height: CELL_HEIGHT * 0.75 * scale.y};
    result.sprite = new PIXI.Graphics();
    result.sprite.beginFill(0xffffff);
    result.sprite.drawRect(-result.collisionBox.width/2, -result.collisionBox.height/2, result.collisionBox.width, result.collisionBox.height);
    result.sprite.alpha = 0;

    result.tag = 'platform';
    result.isPlatform = true;
    result.x = x * CELL_WIDTH + CELL_WIDTH * 0.5;
    result.y = y * CELL_HEIGHT + CELL_HEIGHT * 0.5;
    result.scale = scale;
    result.addChild(result.sprite);
    return result;
}