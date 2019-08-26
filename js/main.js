/*
TODO:
problem occurs with ship when switching tabs
current direction appears to be reset in some way?
*/


import * as lib from './lib.js';
import * as sprite from './sprite.js';

const game = {
  active: false,
  node: '#game',
  fps: '#fps span'
};

// initialise
window.addEventListener('DOMContentLoaded', () => {

  canvasInit();
  inputInit();
  defineSounds();
  defineSprites();

  gameActive();

  // pause/resume on tab visibility
  document.addEventListener('visibilitychange', gameActive, false);

  function gameActive() {
    game.active = (document.visibilityState === 'visible');
    if (game.active) main();
  }

});


// initialize canvas
function canvasInit() {

  game.canvas = document.querySelector(game.node);
  game.width = game.canvas.width;
  game.height = game.canvas.height;
  game.maxX = game.width / 2;
  game.maxY = game.width / 2;
  game.ratio = game.width / game.height;

  game.spriteSize = Math.ceil(game.width / 30);

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
    32: 'up',
    38: 'up',
    87: 'up',
    40: 'down',
    83: 'down'
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


// load sound effects
function defineSounds() {

  let effect = ['shoot', 'explode'];

  game.sound = {};
  effect.forEach(s => game.sound[s] = new Audio(`audio/${s}.mp3`) );

}


// define initial sprites
function defineSprites() {

  // initial random rocks
  game.rock = new Set();
  for (let r = 5; r > 0; r--) game.rock.add( new sprite.Rock(game) );

  // user-controlled ship
  game.userShip = createShip('#ccf', '#aae', '#115');
  game.userShip.userControl = true;

}


// create a new ship
function createShip(line = '#fff', blur = '#eee', fill = '#000') {

  let ship = new sprite.Ship(game);

  // bullet set
  ship.bullet = new Set();
  ship.bulletMax = 3;
  ship.bulletFire = false;

  ship.lineColor = line;
  ship.lineBlurColor = blur;
  ship.fillColor = fill;

  return ship;

}


// shoot bullet
function shoot(ship) {

  if (!ship || !ship.alive || ship.bullet.size >= ship.bulletMax || (ship.bulletFire && game.input.up)) return;

  ship.bulletFire = !!game.input.up;
  if (ship.bulletFire) {
    sound(game.sound.shoot);
    ship.bullet.add( new sprite.Bullet(game, ship) );
  }

}


// game loop
function main() {

  const fpsRecMax = 100;
  let last, fps = 0, fpsTot = 0, fpsRec = fpsRecMax;
  loop();

  // main game look
  function loop(timer) {

    if (last) {

      let time = 1000 / (timer - last);

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

      // create shots
      shoot(game.userShip);

      // draw canvas
      canvasClear();

      // draw rocks
      drawAll(game.rock, time);

      // draw user ship
      game.userShip.draw(time);

      // draw user bullets
      drawAll(game.userShip.bullet, time);

      // detect bullet/rock collision
      collide(game.userShip.bullet, game.rock, function(bullet, rock) {
        game.userShip.bullet.delete(bullet);
        rock.fillColor = `rgb(${Math.random() * 256}, ${Math.random() * 256}, ${Math.random() * 256})`;
        sound(game.sound.explode);
      });

    }

    // next frame
    last = timer;
    if (game.active) requestAnimationFrame(loop);

  }

}


// draw all items in a set
function drawAll(set, time) {

  set.forEach(item => {
    item.draw(time);
    if (!item.alive) set.delete(item);
  });

}


// detect collsions between two sets of sprites
function collide(set1, set2, cfunc) {

  set1.forEach(i1 => {
    set2.forEach(i2 => {

      if (sprite.collision(i1, i2)) cfunc(i1, i2);

    });
  });

}


// play a sound effect
function sound(audio) {

  audio.fastSeek(0);
  audio.play();

}
