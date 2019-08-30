/* main game */
import * as lib from './lib.js';
import { inputInit } from './input.js';
import * as sound from './sound.js';
import * as sprite from './sprite.js';

const game = {
  active: false,
  node: '#game',
  start: '#start',
  health: '#health',
  score: '#score span',
  points: 0,
  fps: '#fps span',
  toucharea: '#touch',
  hiscore: '#hiscore',
  hipoints: parseInt(localStorage.getItem('hipoints') || 0, 10)
};

// requestAnimationFrame object
let rAF;

// fake service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../sw.js', { scope: '../'})
    .then(() => {})
    .catch(() => {});
}


// initialise
window.addEventListener('DOMContentLoaded', () => {

  // start
  game.start = document.querySelector(game.start);
  game.start.addEventListener('click', gameNew);

  // health
  game.health = document.querySelector(game.health);

  // scores
  game.score = document.querySelector(game.score);
  game.hiscore = document.querySelector(game.hiscore);

  // FPS counter
  game.fps = document.querySelector(game.fps);

  canvasInit();

  game.input = inputInit(document.querySelector(game.toucharea));
  sound.init();

  document.addEventListener('visibilitychange', gameActive, false);

  gameOver();

});


//pause/resume on tab visibility
function gameActive() {
  if (rAF) cancelAnimationFrame(rAF);
  game.active = (document.visibilityState === 'visible');
  if (game.active) main();
}


// game over
function gameOver() {

  // update highscore
  if (game.points > game.hipoints) {
    game.hipoints = game.points;
    localStorage.setItem('hipoints', game.hipoints);
  }

  game.hiscore.textContent = game.hipoints;
  game.start.classList.add('active');

}


// restart
function gameNew() {

  game.start.classList.remove('active');
  game.rockCount = 1;
  updatePoints();
  defineSprites();
  game.health.value = game.userShip.health;
  gameActive();

}


// update points
function updatePoints(p) {

  if (p) game.points += p;
  else game.points = 0;

  game.score.textContent = game.points;

}


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

  // five random rocks
  game.rock = new Set();
  createRocks();

  // explosions
  game.explode = new Set();

  // user-controlled ship
  game.userShip = createShip();
  game.userShip.userControl = true;

}


// create rocks
function createRocks(count) {

  count = count || game.rockCount;

  while (count > 0) {
    game.rock.add(new sprite.Rock(game));
    count--;
  }

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
  let last = 0, fpsPrev = 0, fpsTot = 0, fpsRec = fpsRecMax;

  rAF = requestAnimationFrame(loop);

  // main game look
  function loop(timer) {

    let time = timer - (last || timer);
    last = timer;

    if (time) {

      let fps = 1000 / time;

      // FPS calculation
      fpsTot += fps;
      fpsRec--;
      if (fpsRec <= 0) {

        let fpsNow = Math.round(fpsTot / fpsRecMax);
        fpsTot = 0;
        fpsRec = fpsRecMax;

        if (fpsNow && fpsNow !== fpsPrev) {
          fpsPrev = fpsNow;
          game.fps.textContent = fpsPrev;
        }
      }

      // create shots
      shoot(game.userShip);

      // draw canvas
      canvasClear();

      // draw rocks
      drawAll(game.rock, fps);

      // draw user ship
      game.userShip.draw(fps);

      // draw user bullets
      drawAll(game.userShip.bullet, fps);

      // draw explosions
      drawAll(game.explode, fps);

      // detect user bullet/rock collision
      sprite.collideSetUnique(game.userShip.bullet, game.rock, userBulletRock);

      // detect user ship/rock collision
      sprite.collideOne(game.userShip, game.rock, userShipRock);

    }

    // next frame
    rAF = requestAnimationFrame(loop);

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

  updatePoints(10 / rock.scale);
  game.userShip.bullet.delete(bullet);
  splitRock(rock);

}


// user's ship hits a rock
function userShipRock(ship, rock) {

  if (!ship.health) return;

  ship.health -= rock.size;
  ship.velX += rock.velX * rock.scale;
  ship.velY += rock.velY * rock.scale;

  if (ship.health <= 0) {
    ship.health = 0;
    ship.lifespan = 300;
    explode(ship);
    gameOver();
  }

  game.health.value = ship.health;

  splitRock(rock);
  sound.play('explode');

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

  // any rocks left?
  if (!game.rock.size) {
    updatePoints(game.rockCount * 100);
    game.rockCount++;
    game.userShip.bulletMax++;
    createRocks();
  }

}


// explode a sprite
function explode(item, count = 6) {

  do {

    let r = new sprite.Rock(game);
    r.setScale = 0.2;
    r.lifespan = 3000;

    r.x = item.x;
    r.y = item.y;

    r.lineColor = item.lineColor;
    r.lineBlurColor = item.lineBlurColor;
    r.fillColor = item.fillColor;

    r.velX = (Math.random() - 0.5) * Math.random() * 8;
    r.velY = (Math.random() - 0.5) * Math.random() * 8;

    game.explode.add(r);

    count--;

  } while (count);

}
