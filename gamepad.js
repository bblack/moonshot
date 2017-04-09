define(['gl-matrix'], (glMatrix) => {
  var mat3 = glMatrix.mat3;
  var quat = glMatrix.quat;
  var vec3 = glMatrix.vec3;

  // TODO: change this module to affect inputState, like keyboard, so that among other things, it won't allow the player to double up on speed.
  // TODO: make the deadzone inequalities dry, generic, configurable fn
  // TODO: shouldn't need to know about camWorldMatrix
  function adjustPosAndRot(pos, rot, camWorldMatrix){
    // get scale only (discard translation)
    var camWorldScaleMatrix = mat3.fromMat4(mat3.create(), camWorldMatrix);
    var fwd = vec3.transformMat3(vec3.create(), [0, 0, 0.1],  camWorldScaleMatrix);
    var left = vec3.transformMat3(vec3.create(), [-0.1, 0, 0], camWorldScaleMatrix);
    var gamepad = navigator.getGamepads()[0];
    if (gamepad) {
      if (Math.abs(gamepad.axes[0]) > 0.1)
        vec3.subtract(pos, pos,
          vec3.scale(vec3.create(), left, gamepad.axes[0]));
      if (Math.abs(gamepad.axes[1]) > 0.1)
        vec3.subtract(pos, pos,
          vec3.scale(vec3.create(), fwd, gamepad.axes[1]));
      if (Math.abs(gamepad.axes[3]) > 0.1)
        quat.rotateY(rot, rot, -0.05 * gamepad.axes[3]);
      if (Math.abs(gamepad.axes[4]) > 0.1)
        quat.rotateX(rot, rot, 0.05 * gamepad.axes[4]);
      if (gamepad.buttons[4].pressed)
        quat.rotateZ(rot, rot, -0.05);
      if (gamepad.buttons[5].pressed)
        quat.rotateZ(rot, rot, 0.05);
    }
  }

  window.addEventListener('gamepadconnected', (evt) => {
    console.log('gamepad: ' + evt.gamepad.id);
    function pollButtons(){
      console.log(evt.gamepad.buttons)
      // window.requestAnimationFrame(pollButtons);
      setTimeout(pollButtons, 500);
    }
    // pollButtons();
  })

  return {
    adjustPosAndRot: adjustPosAndRot
  };
})
