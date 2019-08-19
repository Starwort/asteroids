// base sprite class
class Sprite {

  // initialise
  constructor(game) {

    // canvas
    this.ctx = game.ctx;

    // input
    this.input = game.input;

    // is user-controlled?
    this.userControl = false;

    // shape
    this.shape = [];

    // initial position
    this.x = 0;
    this.y = 0;

    // direction
    this.dir = Math.random() * Math.PI * 2;

    // size
    this.size = Math.round(game.width / 30);

    // rotation acceleration and deceleration
    this.dirRot = 0;
    this.dirRotAcc = 0.4;
    this.dirRotMax = 0.4;
    this.dirRotDec = 0.2;

    // styles
    this.lineColor = '#fff';
    this.lineWidth = Math.ceil(this.size / 12);
    this.lineBlur = 0;
    this.lineBlurColor = this.lineColor;
    this.fillColor = '';

  }

  // move sprite
  move(time) {

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

    this.dir += this.dirRot;

  }

  // draw sprite
  draw(time) {

    // move
    this.move(time);

    let ctx = this.ctx;

    // draw
    ctx.beginPath();

    // draw points
    for (let p = 0; p < this.shape.length; p++) {

      let
        r = this.shape[p][0] * Math.PI + this.dir,
        s = this.shape[p][1] * this.size,
        x = Math.cos(r) * s + this.x,
        y = Math.sin(r) * s + this.y;

      if (p) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);

    }

    // close and draw
    ctx.closePath();

    // fill style
    if (this.fillColor) {
      this.fillStyle = this.fillColor;
      ctx.fill();
    }

    // line style
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.lineColor;
    ctx.shadowBlur = this.lineBlur;
    ctx.shadowColor = this.lineBlurColor;
    ctx.stroke();

  }

}


// ship
export class Ship extends Sprite {

  constructor(game) {

    super(game);

    // ship is control
    this.userControl = true;

    // style
    this.lineColor = '#eef';
    this.lineBlurColor = '#ccd';
    this.lineBlur = this.lineWidth * 2;

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
