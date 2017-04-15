define(['gl-matrix'], (glMatrix) => {
  var vec3 = glMatrix.vec3;

  var skybox = {
    model: {
      triangles: [
        [0, 1, 3],
        [1, 2, 3],
        [1, 5, 2],
        [5, 6, 2],
        [2, 6, 3],
        [3, 6, 7],
        [0, 3, 7],
        [0, 7, 4],
        [0, 4, 5],
        [1, 0, 5],
        [4, 5, 6],
        [6, 7, 4]
      ],
      frames: [{
        verts: [
          [-1, 1, 1],
          [1, 1, 1],
          [1, 1, -1],
          [-1, 1, -1],
          [-1, -1, 1],
          [1, -1, 1],
          [1, -1, -1],
          [-1, -1, -1],
        ]
      }],
      texture: (function(){
        var id = new ImageData(1024, 1024);
        id.data.fill(0xff);
        for (var i=0; i<id.data.length; i+=4) {
          if (Math.random() > 0.001)
            id.data.fill(0x00, i, i+3);
        }
        return id;
      })(),
      mipmap: false,
      fullbright: true
    },
    skybox: true
  };
  // TODO: instead of choosing some big number less than the distance to the far frustum plane, have a special projection matrix for skyboxes that always gives max Z
  skybox.model.frames[0].verts.forEach((v) => vec3.scale(v, v, 500));

  return skybox;
})
