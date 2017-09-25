define(['gl-matrix'], (glMatrix) => {
  var mat3 = glMatrix.mat3;
  var quat = glMatrix.quat;
  var vec3 = glMatrix.vec3;
  var THRESHOLD = 0.1;

  function val(){
    var gamepad = navigator.getGamepads()[0];
    var v = vec3.create();
    var vAng = quat.create();

    if (gamepad) {
      if (Math.abs(gamepad.axes[0]) > THRESHOLD)
        vec3.add(v, v, [gamepad.axes[0], 0, 0]);
      if (Math.abs(gamepad.axes[1]) > THRESHOLD)
        vec3.add(v, v, [0, 0, -gamepad.axes[1]]);
      if (Math.abs(gamepad.axes[2]) > THRESHOLD)
        quat.rotateY(vAng, vAng, 0.05 * gamepad.axes[2]);
      if (Math.abs(gamepad.axes[3]) > THRESHOLD)
        quat.rotateX(vAng, vAng, -0.05 * gamepad.axes[3]); // inverted
      if (gamepad.buttons[4].pressed)
        quat.rotateZ(vAng, vAng, 0.05);
      if (gamepad.buttons[5].pressed)
        quat.rotateZ(vAng, vAng, -0.05);
    }

    return {v: v, vAng: vAng};
  }

  window.addEventListener('gamepadconnected', (evt) => {
    console.log('gamepad: ' + evt.gamepad.id);
  });

  return {val: val};
})
