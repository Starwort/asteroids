/* main game */
import * as lib from './lib.js';
import { inputInit } from './input.js';
import * as sound from './sound.js';
import * as sprite from './sprite.js';

const game = {
  active: false,
  node: '#game',
  fps: '#fps span',
  toucharea: '#touch'
};

// initialise
window.addEventListener('DOMContentLoaded', () => {

  canvasInit();

  game.input = inputInit(document.querySelector(game.toucharea));
  sound.init();
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


// define initial sprites
function defineSprites() {

  // initial random rocks
  game.rock = new Set();
  for (let r = 5; r > 0; r--) game.rock.add( new sprite.Rock(game) );

  // user-controlled ship
  game.userShip = createShip();
  game.userShip.userControl = true;

}


// create a new ship
function createShip(line = '#6f0', blur = '#6f0', fill = '#131') {

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
    sound.play('shoot');
    ship.bullet.add( new sprite.Bullet(game, ship) );
  }

}


// game loop
function main() {

  const fpsRecMax = 100;
  let last = 0, fps = 0, fpsTot = 0, fpsRec = fpsRecMax;
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

      // detect user bullet/rock collision
      sprite.collideSet(game.userShip.bullet, game.rock, userBulletRock);

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


// user's bullet hits a rock
function userBulletRock(bullet, rock) {

  game.userShip.bullet.delete(bullet);
  splitRock(rock);

}


// split a rock
function splitRock(rock) {

  // create new rocks
  if (rock.scale > 0.5) {

    let
      rockNew = lib.randomInt(2,3),
      scale = rock.scale / rockNew;

    do {

      let r = new sprite.Rock(game);

      r.setScale = scale;
      r.setCollide = 1;
      r.x = rock.x;
      r.y = rock.y;

      r.velX = (Math.random() - 0.5) * (2.5 / scale);
      r.velY = (Math.random() - 0.5) * (2.5 / scale);

      game.rock.add(r);

      rockNew--;

    } while (rockNew);

  }

  // remove rock
  game.rock.delete(rock);
  sound.play('explode');

}
