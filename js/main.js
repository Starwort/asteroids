/* main game */
import * as lib from './lib.js';
import { canvasInit } from './canvas.js';
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
  hipoints: parseInt(localStorage.getItem('hipoints') || 0, 10),
  powers: ['shield', 'shots', 'spread']
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

  // canvas
  canvasInit(game);

  // game input
  game.input = inputInit(document.querySelector(game.toucharea));
  sound.init();

  // tab active handler
  document.addEventListener('visibilitychange', gameActive, false);

  // click to start
  gameOver();

});


// show game over
function gameOver() {

  // update highscore
  if (game.points > game.hipoints) {
    game.hipoints = game.points;
    localStorage.setItem('hipoints', game.hipoints);
  }

  game.hiscore.textContent = game.hipoints;
  game.start.classList.add('active');

}


// start new game
function gameNew() {

  game.start.classList.remove('active');
  game.rockCount = 1;
  updatePoints();
  defineSprites();
  game.health.value = game.userShip.health;
  gameActive();

}


//pause/resume on tab visibility
function gameActive() {
  if (rAF) cancelAnimationFrame(rAF);
  game.active = (document.visibilityState === 'visible');
  if (game.active) main();
}


// update points
function updatePoints(p) {

  if (p) game.points += p;
  else game.points = 0;

  game.score.textContent = game.points;

}


// update shield
function updateShield(ship, s) {

  if (!ship.health) return;

  ship.health = Math.min(100, ship.health + s);

  if (ship.health <= 0) {
    ship.health = 0;
    ship.lifespan = 300;
    explode(ship);
    gameOver();
  }

  game.health.value = ship.health;

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

  // power up
  game.powerUp = null;

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
  ship.bulletMax = 1;
  ship.bulletDist = 800;
  ship.bulletFire = false;

  ship.lineColor = line;
  ship.lineBlurColor = blur;
  ship.fillColor = fill;

  return ship;

}


// create random power-up
function createPowerup() {

  if (Math.random() < 0.999) return null;
  return new sprite.PowerUp(game, game.powers[lib.randomInt(0, game.powers.length - 1)], (Math.random() > 0.4 ? 1 : -1));

}


// shoot bullet
function shoot(ship) {

  if (!ship || !ship.alive || ship.bullet.size >= ship.bulletMax || (ship.bulletFire && game.input.up)) return;

  ship.bulletFire = !!game.input.up;
  if (ship.bulletFire) {
    sound.play('shoot');
    ship.bullet.add( new sprite.Bullet(game, ship, ship.bulletDist) );
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

      // clear canvas
      game.ctx.clearRect(-game.maxX, -game.maxY, game.width, game.height);

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

      // powerup
      if (game.powerUp) {

        game.powerUp.draw(fps);

        // detect user bullet/powerup collision
        sprite.collideOne(game.powerUp, game.userShip.bullet, userBulletPowerUp);

        // detect user ship/powerup collision
        if (sprite.collision(game.userShip, game.powerUp)) userShipPowerUp(game.userShip, game.powerUp);

        // powerup gone
        if (!game.powerUp.alive) game.powerUp = null;

      }
      else {

        // create a random powerup
        game.powerUp = createPowerup();

      }

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

// user's bullet hits a powerup
function userBulletPowerUp(powerup, bullet) {

  if (!powerup.inc) updatePoints(100);
  powerup.inc = 0;
  powerup.lifespan = 300;
  game.userShip.bullet.delete(bullet);

}

// user's ship hits a powerup
function userShipPowerUp(ship, powerup) {

  if (powerup.inc) {
    sound.play(powerup.inc > 0 ? 'powerup' : 'powerdown');
  }

  switch (powerup.text) {

    case 'shield':
      updateShield(ship, 20 * powerup.inc);
      break;

    case 'shots':
      ship.bulletMax = Math.min(Math.max(1, ship.bulletMax + powerup.inc), 10);
      break;

    case 'spread':
      ship.bulletDist = Math.min(Math.max(500, ship.bulletDist + (powerup.inc * 100)), 2000);
      break;

  }

  powerup.lifespan = 100;
  powerup.inc = 0;

}


// user's ship hits a rock
function userShipRock(ship, rock) {

  updateShield(ship, -rock.size);

  ship.velX += rock.velX * rock.scale;
  ship.velY += rock.velY * rock.scale;
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

  // any rocks left?
  if (!game.rock.size) {
    updatePoints(game.rockCount * 100);
    game.rockCount++;
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

  sound.play('explode');

}
