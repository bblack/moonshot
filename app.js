require.config({
  paths: {
    'gl-matrix': './bower_components/gl-matrix/dist/gl-matrix',
    jquery: './bower_components/jquery/dist/jquery.min',
    mousetrap: './bower_components/mousetrap/mousetrap.min',
    underscore: './bower_components/underscore/underscore-min'
  },
  shim: {
    jquery: '$',
    mousetrap: 'Mousetrap',
    underscore: '_'
  }
})

require([
  'gl-matrix',
  'jquery',
  'underscore',
  './entities',
  './keyboard',
  './gamepad',
  './renderer'
], (glMatrix, $, _, entities, keyboard, gamepad, Renderer) => {
  var mat3 = glMatrix.mat3;
  var mat4 = glMatrix.mat4;
  var quat = glMatrix.quat;
  var vec3 = glMatrix.vec3;

  var camera = {
    position: vec3.create(),
    velocity: vec3.create(),
    o: quat.create()
  };
  var inputs = [keyboard, gamepad];
  var worldCamMatrix = mat4.create();
  var camWorldMatrix = mat4.create();
  var rotMatrix = mat4.create();
  var lastTick;
  function tick(){
    var sinceLastTick = Date.now() - lastTick;
    lastTick = Date.now();
    var rot = quat.create();
    inputs.forEach((input) => input.adjustPosAndRot(camera.position, rot, camWorldMatrix));
    quat.mul(camera.o, rot, camera.o);
    var worldCamTranslateMatrix = mat4.fromValues(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      -camera.position[0], -camera.position[1], -camera.position[2], 1
    );
    mat4.fromQuat(rotMatrix, camera.o);
    mat4.mul(worldCamMatrix, rotMatrix, worldCamTranslateMatrix);
    mat4.invert(camWorldMatrix, worldCamMatrix);
    for (var ent of entities) {
      if (ent.rot && sinceLastTick) {
        quat.slerp(ent.o, ent.o, quat.mul(quat.create(), ent.rot, ent.o), sinceLastTick/1000);
        // TODO: normalize to prevent drift?
      }
    }
    window.requestAnimationFrame(tick);
  }
  tick();

  var canvas = $('canvas')[0];
  var renderer = new Renderer(canvas, entities, camera, {
    worldCamMatrix: worldCamMatrix,
    rotMatrix: rotMatrix
  });
})
