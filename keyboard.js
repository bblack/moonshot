define(['mousetrap', 'gl-matrix'], (Mousetrap, glMatrix) => {
  var mat3 = glMatrix.mat3;
  var quat = glMatrix.quat;
  var vec3 = glMatrix.vec3;
  var inputState = {};

  Mousetrap.bind('w', () => inputState.forward = true, 'keydown');
  Mousetrap.bind('w', () => inputState.forward = false, 'keyup');
  Mousetrap.bind('s', () => inputState.back = true, 'keydown');
  Mousetrap.bind('s', () => inputState.back = false, 'keyup');
  Mousetrap.bind('a', () => inputState.left = true, 'keydown');
  Mousetrap.bind('a', () => inputState.left = false, 'keyup');
  Mousetrap.bind('d', () => inputState.right = true, 'keydown');
  Mousetrap.bind('d', () => inputState.right = false, 'keyup');
  Mousetrap.bind('left', () => inputState.turnleft = true, 'keydown');
  Mousetrap.bind('left', () => inputState.turnleft = false, 'keyup');
  Mousetrap.bind('right', () => inputState.turnright = true, 'keydown');
  Mousetrap.bind('right', () => inputState.turnright = false, 'keyup');
  Mousetrap.bind('up', () => inputState.pitchdown = true, 'keydown');
  Mousetrap.bind('up', () => inputState.pitchdown = false, 'keyup');
  Mousetrap.bind('down', () => inputState.pitchup = true, 'keydown');
  Mousetrap.bind('down', () => inputState.pitchup = false, 'keyup');
  Mousetrap.bind('q', () => inputState.rollleft = true, 'keydown');
  Mousetrap.bind('q', () => inputState.rollleft = false, 'keyup');
  Mousetrap.bind('e', () => inputState.rollright = true, 'keydown');
  Mousetrap.bind('e', () => inputState.rollright = false, 'keyup');

  function adjustPosAndRot(pos, rot, fwd, left){
    if (inputState.forward)
      vec3.add(pos, pos, fwd);
    if (inputState.back)
      vec3.subtract(pos, pos, fwd);
    if (inputState.left)
      vec3.add(pos, pos, left);
    if (inputState.right)
      vec3.subtract(pos, pos, left);
    if (inputState.turnleft)
      quat.rotateY(rot, rot, 0.05);
    if (inputState.turnright)
      quat.rotateY(rot, rot, -0.05);
    if (inputState.pitchup)
      quat.rotateX(rot, rot, 0.05);
    if (inputState.pitchdown)
      quat.rotateX(rot, rot, -0.05);
    if (inputState.rollleft)
      quat.rotateZ(rot, rot, -0.05);
    if (inputState.rollright)
      quat.rotateZ(rot, rot, 0.05);
  }

  return {adjustPosAndRot: adjustPosAndRot};
})
