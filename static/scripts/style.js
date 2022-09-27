let styleCooldowns = {
    'high_jump': 0,
    'enemy_killed': 0,
    'juggling': 0,
}

let styleFreshness = {
    'high_jump': 1,
    'enemy_killed': 1,
    'juggling': 1,
}

function styleChecks(delta) {
    timeSpeed += (1 - timeSpeed) * TIME_RESTORATION_SPEED * delta;

    for (sf in styleFreshness) {
        styleFreshness[sf] += (1 - styleFreshness[sf]) * 0.002 * delta;
        styleCooldowns[sf] -= 1;
    }

    styleHighJump(delta);
}

let heroInTheAirTime = 0;
function styleHighJump(delta) {
    for (sf in styleFreshness) {
        if (styleCooldowns[sf] > 0) {
            return;
        }
    }
    if (styleFreshness['high_jump'] < 0.5 || skeletonsPool.pool.length < 10) {
        return;
    }
    if (hero.velocity.y < 0) {
        heroInTheAirTime += delta;
    } else if (hero.velocity.y > 5) {
        heroInTheAirTime += hero.velocity.y * 0.1;
    } else {
        heroInTheAirTime = 0;
    }
    if (heroInTheAirTime > 20 && hero.velocity.y > -3) {
        if (!checkCollisionsInArea(hero, stage.children, {x:hero.x+16, y:hero.y+64, width: 32*1.5, height: 64*5}, 'solid')) {
            heroInTheAirTime = 0;
            styleFreshness['high_jump'] *= 0.5;
            styleCooldowns['high_jump'] = 60;
            timeSpeed *= 0.1;
        }
    }
}

function styleEnemyKilled(delta) {
    for (sf in styleFreshness) {
        if (styleCooldowns[sf] > 0) {
            return;
        }
    }
    if (styleFreshness['enemy_killed'] < 0.5 || skeletonsPool.pool.length < 10) {
        return;
    }
    styleFreshness['enemy_killed'] *= 0.5;
    styleCooldowns['enemy_killed'] = 0;
    timeSpeed *= 0.8;
}

function styleJuggling(delta) {
    for (sf in styleFreshness) {
        if (styleCooldowns[sf] > 0) {
            return;
        }
    }
    if (styleFreshness['juggling'] < 0.5 || skeletonsPool.pool.length < 10) {
        return;
    }
    styleFreshness['juggling'] *= 0.5;
    styleCooldowns['juggling'] = 180;
    timeSpeed *= 0.005;
}