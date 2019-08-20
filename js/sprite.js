// base sprite class
class Sprite {

  // initialise
  constructor(game) {

    // type
    this.type = 'sprite';

    // canvas
    this.ctx = game.ctx;

    // input
    this.input = game.input;

    // is alive?
    this.alive = true;
    this.lifespan = null;

    // is user-controlled?
    this.userControl = false;

    // shape
    this.shape = [];

    // initial position
    this.x = 0;
    this.y = 0;
    this.maxX = game.maxX;
    this.maxY = game.maxY;

    // direction
    this.dir = Math.random() * Math.PI * 2;

    // sizing
    this.size = game.spriteSize;
    this.setScale = 1;

    // rotation acceleration and deceleration
    this.dirRot = 0;
    this.dirRotAcc = 0.4;
    this.dirRotMax = 0.4;
    this.dirRotDec = 0.25;

    // velocity acceleration and deceleration
    this.velX = 0;
    this.velY = 0;
    this.velAcc = 15;
    this.velMax = 80;
    this.velDec = 2;

    // styles
    this.lineWidth = Math.ceil(this.maxX / 250);
    this.lineColor = '#fff';
    this.lineBlur = Math.floor(this.lineWidth * 1.5);
    this.lineBlurColor = this.lineColor;
    this.fillColor = '';
    this.fillStep = 1; // 0 = no fill, 1 = fill before stroke, 2 = fill after stroke

  }

  // set relative scale
  set setScale(relative) {
    this.scale = relative;
    this.boundX = this.maxX + this.size * this.scale;
    this.boundY = this.maxY + this.size * this.scale;
  }

  // move sprite
  move(time) {

    // reduce lifespan
    if (this.lifespan) {
      this.lifespan -= time;
      if (this.lifespan <= 0) {
        this.lifespan = 0;
        this.alive = false;
      }
    }

    // rotate
    let rot = (this.userControl ? this.input.right - this.input.left : 0);

    if (rot) {

      // increase rotation
      this.dirRot += (this.dirRotAcc / time) * rot;
      this.dirRot = Math.min(Math.max(-this.dirRotMax, this.dirRot), this.dirRotMax);

    }

    if (this.dirRot) {

      // decrease rotation
      let f = (this.dirRot > 0 ? -1 : 1);
      this.dirRot += (this.dirRotDec / time) * f;
      if ((f === -1 && this.dirRot < 0) || (f === 1 && this.dirRot > 0)) this.dirRot = 0;

    }

    // change direction
    this.dir += this.dirRot;

    // velocity
    if (this.userControl && this.input.down) {

      // increase velocity
      let v = this.velAcc / time;

      this.velX += v * Math.cos(this.dir);
      this.velX = Math.min(this.velX, this.velMax);

      this.velY += v * Math.sin(this.dir);
      this.velY = Math.min(this.velY, this.velMax);

    }

    // decrease X velocity
    if (this.velX) this.velX += (this.velDec / time) * (this.velX > 0 ? -1 : 1);

    // decrease Y velocity
    if (this.velY) this.velY += (this.velDec / time) * (this.velY > 0 ? -1 : 1);

    // change position
    this.x += this.velX;
    this.y += this.velY;

    // wrap around
    if (this.x < -this.boundX) this.x = this.boundX;
    else if (this.x > this.boundX) this.x = -this.boundX;

    if (this.y < -this.boundY) this.y = this.boundY;
    else if (this.y > this.boundY) this.y = -this.boundY;

  }

  // draw sprite
  draw(time) {

    // sprite is dead?
    if (!this.alive) return;

    // move
    this.move(time);

    let ctx = this.ctx;

    // line style
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.lineColor;
    ctx.shadowBlur = this.lineBlur;
    ctx.shadowColor = this.lineBlurColor;

    // fill colour
    if (this.fillColor) {
      ctx.fillStyle = this.fillColor;
      this.fillStep = this.fillStep || 1;
    }
    else this.fillStep = 0;

    // alpha
    ctx.globalAlpha = this.lifespan && this.lifespan < 1000 ? this.lifespan / 1000 : 1;

    // draw
    ctx.beginPath();

    // draw points
    for (let p = 0; p < this.shape.length; p++) {

      let
        r = this.shape[p][0] * Math.PI + this.dir,
        s = this.shape[p][1] * this.size * this.scale,
        x = Math.cos(r) * s + this.x,
        y = Math.sin(r) * s + this.y;

      if (p) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);

    }

    // close and draw
    ctx.closePath();

    // fill style (first)
    if (this.fillStep === 1) ctx.fill();

    ctx.stroke();

    // fill style (last)
    if (this.fillStep === 2) ctx.fill();

  }

}


// ship
export class Ship extends Sprite {

  constructor(game) {

    super(game);
    this.type = 'ship';

    // style
    this.lineColor = '#eef';
    this.lineBlurColor = '#ccf';
    this.fillColor = '#113';

    // radian (pi multiples) and radius pairs
    this.shape = [
      [0, 1],
      [0.7, 0.5],
      [0.7, 1],
      [0.9, 1],
      [1, 0.8],
      [-0.9, 1],
      [-0.7, 1],
      [-0.7, 0.5]
    ];

  }

}


// bullet
export class Bullet extends Sprite {

  constructor(game, ship) {

    super(game);
    this.type = 'bullet';
    this.alive = ship && ship.alive;

    // style
    this.setScale = 0.2;
    this.lineWidth = 3;
    this.lineColor = '#99f';
    this.lineBlur = 0;
    this.lineBlurColor = '';
    this.fillColor = '';

    // position and velocity
    this.dir = ship.dir;
    this.x = ship.x + Math.cos(ship.dir) * ship.size * ship.scale;
    this.y = ship.y + Math.sin(ship.dir) * ship.size * ship.scale;

    this.velX = Math.cos(this.dir) * 10;
    this.velY = Math.sin(this.dir) * 10;
    this.velDec = 2;
    this.lifespan = 3000;

    // radian (pi multiples) and radius pairs
    this.shape = [
      [0, 1],
      [1, 1]
    ];

  }

}


// rock
export class Rock extends Sprite {

  constructor(game) {

    super(game);
    this.type = 'rock';

    // style
    this.setScale = 2;
    this.lineColor = '#999';
    this.lineBlurColor = '#ccc';
    this.fillColor = '#111';
    this.fillStep = 1;

    // random position
    let
      rPos = Math.ceil((Math.random() - 0.5) * 2 * this.maxX),
      fPos = Math.random < 0.5 ? -this.boundX : this.boundX;

    if (Math.random() < 0.5) {
      this.x = rPos;
      this.y = fPos;
    }
    else {
      this.x = fPos;
      this.y = rPos;
    }

    // random rotation
    this.dirRot = Math.random() * 0.03;
    this.dirRotDec = 0;

    // velocity acceleration and deceleration
    this.velX = (Math.random() - 0.5) * 2;
    this.velY = (Math.random() - 0.5) * 2;
    this.velDec = 0;

    // random shape
    let slast = 0, sides = 4 + Math.ceil(Math.random() * 4);
    this.shape = [[0, 1]];

    for (let s = 1; s < sides; s++) {
      slast += 2 / sides * Math.max(0.8, Math.random() * 1.2);
      this.shape.push([slast, Math.max(0.6, Math.random()) ]);
    }

  }

}
