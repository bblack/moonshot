define(['gl-matrix', 'underscore'], (glMatrix, _) => {
  var quat = glMatrix.quat;
  var vec3 = glMatrix.vec3;

  var stacks = 12;
  var slices = 24;
  var sphere = {
    model: {
      frames: [{
        verts: _.chain(stacks)
          .times(_.identity)
          .inject((memo, stack) => {
            _.times(slices, (slice) => {
              var v = vec3.fromValues(0, 1, 0);
              vec3.rotateZ(v, v, vec3.create(), Math.PI*((stack+1)/(stacks+1)));
              vec3.rotateY(v, v, vec3.create(), 2*Math.PI*slice/slices);
              memo.push(v);
            });
            return memo;
          }, [])
          .push(vec3.fromValues(0, 1, 0))
          .push(vec3.fromValues(0, -1, 0))
          .value()
      }],
      triangles: _.chain(stacks - 1)
        .times(_.identity)
        .inject((memo, stack) => {
          if (stack == 0) {
            _.times(slices, (slice) => {
              memo.push([
                stacks * slices, // top
                slice,
                (slice + 1) % slices
              ]);
            });
          }
          _.times(slices, (slice) => {
            var verts = [
              stack * slices + slice,
              stack * slices + (slice + 1) % slices,
              (stack + 1) * slices + slice,
              (stack + 1) * slices + (slice + 1) % slices
            ];
            memo.push([verts[2], verts[1], verts[0]]);
            memo.push([verts[1], verts[2], verts[3]]);
          });
          if (stack == stacks - 2) {
            _.times(slices, (slice) => {
              memo.push([
                stacks * slices + 1, // bottom
                (stacks - 1) * slices + (slice + 1) % slices,
                (stacks - 1) * slices + slice
              ]);
              if (memo[memo.length - 1][2] == 73) debugger;
            });
          }
          return memo;
        }, [])
        .value(),
      texture: (function(){
        var id = new ImageData(256, 256);
        id.data.fill(0xff);
        for (var i=0; i<id.data.length; i+=4) {
          id.data.fill(0x80, i, i+3);
        }
        return id;
      })()
    },
    o: quat.create(),
    rot: quat.rotateY(quat.create(), quat.create(), Math.PI / 8),
    pos: vec3.fromValues(0, 0, 15)
  };

  var beacon = {
    model: {
      triangles: [
        [0, 1, 2],
        [2, 3, 0],
        [0, 1, 4],
        [1, 2, 4],
        [2, 3, 4],
        [3, 0, 4]
      ],
      frames: [{
        verts: [
          [1/2, 0, 1/2],
          [1/2, 0, -1/2],
          [-1/2, 0, -1/2],
          [-1/2, 0, 1/2],
          [0, 1, 0]
        ]
      }],
      texture: (function(){
        var id = new ImageData(256, 256);
        id.data.fill(0xff);
        for (var i=0; i<id.data.length; i+=4) {
          id.data.fill(0x00, i+2, i+3);
        }
        return id;
      })(),
      // wire: true
    },
    o: quat.create(),
    rot: quat.rotateY(quat.create(), quat.create(), Math.PI / 8),
    pos: vec3.fromValues(0, 0, 10)
  };
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
  _.each(skybox.model.frames[0].verts, (v) => vec3.scale(v, v, 500))

  return [sphere, skybox];
})
