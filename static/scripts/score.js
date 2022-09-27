let scoreText = new PIXI.Text('score: 0', new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 70,
    fontWeight: 'bold',
    fill: '#e28a4f',
    wordWrap: true,
    wordWrapWidth: 440,
    lineJoin: 'round',
}));
scoreText.x = 832;
scoreText.y = app.stage.height/2;
scoreText.anchor.set(0.5);
scoreText.number = 0;
scoreText.colorTint = 0;

function scoreStep() {
    scoreText.colorTint += (0 - scoreText.colorTint) * 0.1;
    scoreText.style.fill = hslToHex(22, 48, (50 + 50 * scoreText.colorTint));
}

function plusScore() {
    scoreText.number++;
    scoreText.colorTint = 0.5;
    scoreText.text = `score: ${scoreText.number}`
}

stage.add(scoreText, 'back');