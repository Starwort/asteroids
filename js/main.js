import * as lib from './lib.js';
import * as sprite from './sprite.js';

const game = {
  node: '#game',
  fps: '#fps span'
};

// initialise
window.addEventListener('DOMContentLoaded', () => {

  canvasInit();
  inputInit();

  main();

});


// initialize canvas
function canvasInit() {

  game.canvas = document.querySelector(game.node);
  game.width = game.canvas.width;
  game.height = game.canvas.height;
  game.maxX = game.width / 2;
  game.maxY = game.width / 2;
  game.ratio = game.width / game.height;

  game.ctx = game.canvas.getContext('2d');

  // 0,0 at middle
  game.ctx.translate(game.width / 2, game.height / 2);

  // size to viewport
  canvasClear();
  canvasResize();
  lib.eventDebounce(window, 'resize', canvasResize);

  // FPS counter
  game.fps = document.querySelector(game.fps);

}

// resize canvas to viewport
function canvasResize() {

  let b = document.body;
  game.scale = Math.min(b.clientWidth / game.width, b.clientHeight / game.height);

  game.canvas.style.width = game.width * game.scale + 'px';
  game.canvas.style.height = game.height * game.scale + 'px';

}

// clear canvas
function canvasClear() {
  game.ctx.clearRect(-game.maxX, -game.maxY, game.width, game.height);
}


// keyboard input control
function inputInit() {

  // key bindings: cursor/WASD, space/P
  let key = {
    37: 'left',
    65: 'left',
    39: 'right',
    68: 'right',
    38: 'up',
    87: 'up',
    40: 'down',
    83: 'down',
    32: 'fire',
    80: 'fire'
  };

  game.input = {};
  for (let k in key) game.input[key[k]] = 0;

  // key press events
  window.addEventListener('keydown', keyHandler);
  window.addEventListener('keyup', keyHandler);

  function keyHandler(e) {
    let
      down = (e.type === 'keydown' ? 1 : 0),
      k = key[e.keyCode];

    if (k) game.input[k] = down;
  }

}


// game loop
function main() {

  const ship = new sprite.Ship(game);
  ship.userControl = true;

  let
    last = 0,
    fps = 0, fpsTot = 0, fpsRecMax = 100, fpsRec = fpsRecMax;

  // main game look
  function loop(timer) {

    let time = 1000 / (timer - last);
    last = timer;

    // FPS calculation
    fpsTot += time;
    fpsRec--;
    if (fpsRec <= 0) {

      let fpsNow = Math.round(fpsTot / fpsRecMax);
      fpsTot = 0;
      fpsRec = fpsRecMax;

      if (fpsNow && fpsNow !== fps) {
        fps = fpsNow;
        game.fps.textContent = fps;
      }
    }

    // draw canvas
    canvasClear();
    ship.draw(time);

    requestAnimationFrame(loop);
  }
  loop();

}

