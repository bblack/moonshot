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
  'underscore',
  './entities',
  './skybox',
  './viewModel',
  './keyboard',
  './gamepad',
  './renderer'
], (glMatrix, _, entities, skybox, ViewModel, keyboard, gamepad, Renderer) => {
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
  var rotMatrix = mat4.create();
  var lastTick;
  var viewModel = new ViewModel({
    entities: entities,
    skybox: skybox
  });
  var ship = entities[2];
  function tick(){
    var sinceLastTick = Date.now() - lastTick;
    lastTick = Date.now();
    inputs.forEach((input) => {
      var inputVal = input.val();
      quat.mul(ship.o, ship.o, inputVal.vAng);
      var v = vec3.create();
      vec3.scale(v, inputVal.v, 0.1);
      vec3.transformQuat(v, v, ship.o)
      vec3.add(ship.pos, ship.pos, v);
    });
    // then update the camera position and orientation based on the ship
    quat.slerp(camera.o, camera.o, quat.invert(quat.create(), ship.o), 0.1);
    vec3.copy(camera.position, ship.pos);
    var oVec = vec3.create();
    vec3.transformQuat(oVec, vec3.fromValues(0, -1, 2), ship.o);
    vec3.sub(camera.position, camera.position, oVec);

    var worldCamTranslateMatrix = mat4.fromValues(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      -camera.position[0], -camera.position[1], -camera.position[2], 1
    );
    mat4.fromQuat(rotMatrix, camera.o);
    mat4.mul(worldCamMatrix, rotMatrix, worldCamTranslateMatrix);
    for (var ent of viewModel.entities) {
      if (ent.rot && sinceLastTick) {
        quat.slerp(ent.o, ent.o, quat.mul(quat.create(), ent.rot, ent.o), sinceLastTick/1000);
        // TODO: normalize to prevent drift?
      }
    }
    window.requestAnimationFrame(tick);
  }
  tick();

  var canvas = document.getElementsByTagName('canvas')[0];
  var renderer = new Renderer(canvas, viewModel, camera, {
    worldCamMatrix: worldCamMatrix,
    rotMatrix: rotMatrix
  });
})
