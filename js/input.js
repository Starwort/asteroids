/* keyboard, touch, and gamepad input */
const
  input = {},

  // key bindings: cursor/WASD, space
  key = {
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


// initialise input
export function inputInit(toucharea) {

  for (let k in key) input[key[k]] = 0;

  // key press events
  window.addEventListener('keydown', keyHandler);
  window.addEventListener('keyup', keyHandler);

  // touch events
  if (toucharea) {
    input.touchactive = false;
    input.toucharea = toucharea;
    toucharea.addEventListener('touchstart', touchHandler);
    toucharea.addEventListener('touchend', touchHandler);
  }

  return input;

}


// keyboard handler
function keyHandler(e) {
  let
    down = (e.type === 'keydown' ? 1 : 0),
    k = key[e.keyCode];

  if (k) input[k] = down;
}


// touch handler
function touchHandler(e) {

  if (!input.touchactive) {
    input.touchactive = true;
    input.toucharea.classList.add('active');
  }

  let
    down = (e.type === 'touchstart' ? 1 : 0),
    point = e.changedTouches;

  for (let p = 0; p < point.length; p++) {
    let t = point[p].target.dataset.input;
    if (t) input[t] = down;
  }

}
