// base sprite object
function Sprite(game) {

  // canvas
  this.ctx = game.ctx;

  // position
  this.x = 0;
  this.y = 0;
  this.dir = Math.random() * Math.PI * 2;
  this.size = Math.round(game.width / 30);
  this.scale = 1;

  // rotation acceleration and deceleration
  this.dirMov = 0;
  this.dirAcc = 0.4;
  this.dirMax = 0.4;
  this.dirDec = 0.2;

}

// rotate sprite
Sprite.prototype.rotate = function(left, right, time) {

  let d = right - left;

  if (d) {

    // increase rotation
    this.dirMov += (this.dirAcc / time) * d;
    this.dirMov = Math.min(Math.max(-this.dirMax, this.dirMov), this.dirMax);

  }

  if (this.dirMov) {

    // decrease rotation
    let f = (this.dirMov > 0 ? -1 : 1);
    this.dirMov += (this.dirDec / time) * f;
    if ((f === -1 && this.dirMov < 0) || (f === 1 && this.dirMov > 0)) this.dirMov = 0;

  }

  this.dir += this.dirMov;

};


// ship sprite
export function Ship(...arg) {
  Sprite.call(this, ...arg);
}
Ship.prototype = Object.create(Sprite.prototype);

Ship.prototype.draw = function() {

  let
    ctx = this.ctx,
    d = this.dir,
    x = this.x,
    y = this.y,
    pi = Math.PI,
    otR = this.size * this.scale,
    inR = otR * 0.5,
    bkR = otR * 0.8;

  ctx.strokeStyle = '#eef';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#eef';
  ctx.shadowBlur = 5;

  ctx.beginPath();
  ctx.moveTo(otR * Math.cos(d) + x, otR * Math.sin(d) + y);
  ctx.lineTo(inR * Math.cos(d + pi * 0.7) + x, inR * Math.sin(d + pi * 0.7) + y);
  ctx.lineTo(otR * Math.cos(d + pi * 0.7) + x, otR * Math.sin(d + pi * 0.7) + y);
  ctx.lineTo(otR * Math.cos(d + pi * 0.9) + x, otR * Math.sin(d + pi * 0.9) + y);
  ctx.lineTo(bkR * Math.cos(d + pi) + x, bkR * Math.sin(d + pi) + y);
  ctx.lineTo(otR * Math.cos(d - pi * 0.9) + x, otR * Math.sin(d - pi * 0.9) + y);
  ctx.lineTo(otR * Math.cos(d - pi * 0.7) + x, otR * Math.sin(d - pi * 0.7) + y);
  ctx.lineTo(inR * Math.cos(d - pi * 0.7) + x, inR * Math.sin(d - pi * 0.7) + y);
  ctx.closePath();
  ctx.stroke();

};
