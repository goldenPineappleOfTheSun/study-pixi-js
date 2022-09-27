/*--- utils ---*/

function areSpritesIntersect(sprite1, sprite2) {
    a = getCollisionBox(sprite1);
    b = getCollisionBox(sprite2);
    return areRectsIntersect(a, b)
}

function areRectsIntersect(a, b) {
    return a.x + a.width > b.x && a.x < b.x + b.width && a.y + a.height > b.y && a.y < b.y + b.height;
}

/*
checks if two rects intersect and return intersection rectangle and collision normal for first (a) rect
*/
function getRectsIntersection(a, b) {
    const max = Math.max;
    const min = Math.min;
    const abs = Math.abs;
    let ar = a.x + a.width;
    let ab = a.y + a.height;
    let br = b.x + b.width;
    let bb = b.y + b.height;
    if (areRectsIntersect(a, b)) {
        let result = {x:max(a.x, b.x), y:max(a.y, b.y), r:min(ar, br), b:min(ab, bb)}
        result.width = result.r - result.x;
        result.height = result.b - result.y;
        let bevel = 10;
        if (bevel * 2 > Math.min(a.width, a.height, b.width, b.height)) {
            bevel = Math.min(a.width, a.height, b.width, b.height) / 2;
        }
        const rectCenter = {x: a.x + a.width/2, y: a.y + a.height/2};
        const intersectionCenter = {x: result.x + result.width/2, y: result.y + result.height/2};
        const horizontal = result.width > bevel;
        const vertical = result.height > bevel;
        const squaredBevelDepth = bevel * bevel; /* half of hypoten */
        const squaredPenetration = result.width * result.width + result.height * result.height;
        if (squaredPenetration < squaredBevelDepth) {
            result.normal = {x: 0, y: 0};
        } else if (horizontal && !vertical) {
            result.normal = {x: 0, y: rectCenter.y < intersectionCenter.y ? -1 : 1};
        } else if (vertical && !horizontal) {
            result.normal = {x: rectCenter.x < intersectionCenter.x ? -1 : 1, y: 0};
        } else if (vertical && horizontal) {
            result.normal = result.width < result.height 
                ? {x: a.x < b.x ? -0.7 : 0.7, y: 0}
                : {x: 0, y: a.y < b.y ? -0.7 : 0.7};
        } else if (result.width + result.height) {
            /* bevel */
            const force = (squaredPenetration - squaredBevelDepth) / squaredBevelDepth;
            result.normal = {x: a.x < b.x ? -0.7 * force : 0.7 * force, y: a.y < b.y ? -0.7 * force : 0.7 * force};   
        }
        return result;
    } else {
        return null;
    }
}

function getCollisionBox(container) {
    const collisionBox = container.collisionBox || {width:0, height:0};
    return {
        x: container.x - collisionBox.width / 2,
        y: container.y - collisionBox.height / 2,
        r: container.x + collisionBox.width / 2,
        b: container.y + collisionBox.height / 2,
        width: collisionBox.width,
        height: collisionBox.height };
}

/*
checks if between a and b lays object with tag "tag"
*/
function checkLine(tag, a, b) {
    for (let block of stage.children.filter(o => o.tag === tag)) {
        const rect = getCollisionBox(block);
        const top = rect.y;
        const bottom = rect.y+rect.height;
        const left = rect.x;
        const right = rect.x+rect.width;
        const line = {x1:a.x, y1:a.y, x2:b.x, y2:b.y};
        const checkTop = getLinesIntersection(line, {x1:left, y1:top, x2:right, y2:top});
        const checkBottom = getLinesIntersection(line, {x1:left, y1:bottom, x2:right, y2:bottom});
        const checkLeft = getLinesIntersection(line, {x1:left, y1:top, x2:left, y2:bottom});
        const checkRight = getLinesIntersection(line, {x1:right, y1:top, x2:right, y2:bottom});
        if (checkTop || checkRight || checkLeft || checkBottom) {
            return true;
        }
    }
    return false;
}

function getLinesIntersection(a, b) {
    /* second line must be straight horizontal or vertical */
    const isHor = b.y1 === b.y2;
    const isVert = b.x1 === b.x2;
    if (!isHor && !isVert) {
        if (a.x1 === a.x2 && a.y1 === a.x2) {
            return getLinesIntersection(b, a);
        } else {
            console.warn('one of the lines must be straight horizontal or vertical');
            return null;
        }
    }

    const dx = a.x2 - a.x1;
    const dy = a.y2 - a.y1;

    if (isHor) {
        const point = {x: a.x1 - (a.y1-b.y1) * (dx/dy), y: b.y1};         
        return point.x > b.x1 && point.x < b.x2 && (point.y < a.y1 !== point.y < a.y2)
            ? point 
            : null;
    } else {
        const point = {x: b.x1, y: a.y1 - (a.x1-b.x1) * (dy/dx)}; 
        return point.y > b.y1 && point.y < b.y2 && point.x > a.x1 && point.x < a.x2 
            ? point 
            : null;
    }

    return null;
}

function random(from, to) {
    return from + Math.random() * (to - from);
}

/*--- debug ---*/

debugIndex = 0;

function debug(rect, color) {
    color = color || '#ff0000';
    debugIndex = (debugIndex + 1) % 10;
    const element = document.querySelectorAll('.debug')[debugIndex];
    element.style.left = `${rect.x}px`;
    element.style.top = `${rect.y}px`;
    element.style.width = `${rect.width}px`;
    element.style.height = `${rect.height}px`;
    element.style.background = color;
}

function clearDebug(rect) {
    debugIndex = 0;
        document.querySelectorAll('.debug').forEach(x => {
        x.style.width = `0px`;
        x.style.height = `0px`;
    });
}

/*--- color --- */

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}