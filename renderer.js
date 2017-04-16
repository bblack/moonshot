define(['gl-matrix', './shaders/entity', './shaders/skybox'], (glMatrix, entityShader, buildSkyboxShader) => {
  var mat4 = glMatrix.mat4;
  var vec3 = glMatrix.vec3;
  var MAX_RESOLUTION = [640, 360];

  function buildTexture(ent, gl){
    ent.model.glTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, ent.model.glTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ent.model.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
     ent.model.mipmap == false ? gl.LINEAR : gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return
  }

  function calculateNorms(tri, verts, method){
    var out = new Float32Array(9)
    if (method == 'flatface') {
      var norm = vec3.cross(
        vec3.create(),
        vec3.subtract(vec3.create(), verts[tri[1]], verts[tri[0]]),
        vec3.subtract(vec3.create(), verts[tri[2]], verts[tri[1]])
      );
      vec3.normalize(norm, norm);
      for (var i=0; i<3; i++) {
        out.set(norm, i*3);
      }
    } else {
      // TODO: compute relative to center of mass, or to neighboring triangles.
      // this falsely assumes a center-of-mass at the origin.
      for (var i=0; i<3; i++) {
        out.set(verts[tri[i]], i*3)
      }
    }
    return out;
  }

  function buildPerspectiveProjectionMatrix(aspect, n, f){
    return [
      1/aspect, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, (f+n)/(f-n), 1,
      0, 0, (-2*f*n)/(f-n), 0
    ];
  }

  function buildSkyboxProjectionMatrix(aspect){
    return mat4.fromValues(
      1/aspect, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 1,
      0, 0, 0, 0
    )
  }

  function invalidateCanvasSize(gl, entityShader, skyboxShader){
    var w = gl.canvas.offsetWidth;
    var h = gl.canvas.offsetHeight;
    var aspect = w/h;
    var f = 1000;
    var n = 0.1;
    var projMatrix = buildPerspectiveProjectionMatrix(aspect, n, f);
    gl.canvas.width = w;
    gl.canvas.height = h;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.useProgram(entityShader);
    var uProjMatrix = gl.getUniformLocation(entityShader, 'projMatrix');
    gl.uniformMatrix4fv(uProjMatrix, false, new Float32Array(projMatrix));

    gl.useProgram(skyboxShader);
    var skyboxProjMatrix = buildSkyboxProjectionMatrix(aspect);
    var uSkyboxProjMatrix = gl.getUniformLocation(skyboxShader, 'projMatrix');
    gl.uniformMatrix4fv(uSkyboxProjMatrix, false, new Float32Array(skyboxProjMatrix));
  };

  function Renderer(canvas, viewModel, camera, crap){
    // TODO: figure out where crap goes (probably not here at all)
    var worldCamMatrix = crap.worldCamMatrix;
    var rotMatrix = crap.rotMatrix;
    var gl = canvas.getContext('webgl');
    var shaderProgram = entityShader(gl);
    var skyboxShader = buildSkyboxShader(gl);
    var vertBuf = gl.createBuffer();
    var normBuf = gl.createBuffer();
    var vertTexCoordsBuf = gl.createBuffer();
    var entities = viewModel.entities;
    var skybox = viewModel.skybox;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // let skybox pass depth test at exactly max z

    for (var ent of entities) {
      buildTexture(ent, gl);
    }
    buildTexture(skybox, gl);

    invalidateCanvasSize(gl, shaderProgram, skyboxShader);
    window.addEventListener('resize', () => invalidateCanvasSize(gl, shaderProgram));

    function drawSkybox(skybox){
      var frame = skybox.model.frames[0];
      var verts = skybox.model.triangles.reduce((memo, tri) => {
        tri.forEach((vertIndex) => memo.push(frame.verts[vertIndex]));
        return memo;
      }, []);
      var texCoords = skybox.model.triangles.reduce((memo, tri) => {
        memo.push(0, 0, 1, 0, 0, 1);
        return memo;
      }, []);

      gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_.flatten(verts)), gl.STATIC_DRAW);
      aVertPos = gl.getAttribLocation(skyboxShader, 'aVertPos');
      gl.enableVertexAttribArray(aVertPos);
      gl.vertexAttribPointer(aVertPos, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, vertTexCoordsBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
      aTexCoord = gl.getAttribLocation(skyboxShader, 'aTexCoord')
      gl.enableVertexAttribArray(aTexCoord);
      gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

      var uMvMatrix = gl.getUniformLocation(skyboxShader, 'mvMatrix');
      gl.uniformMatrix4fv(uMvMatrix, false, rotMatrix);
      gl.bindTexture(gl.TEXTURE_2D, skybox.model.glTexture);
      gl.drawArrays(gl.TRIANGLES, 0, skybox.model.triangles.length*3);
    }

    function drawEntity(ent, aVertPos, aTexCoord, aNorm){
      var verts = [];
      var norms = [];
      var texCoords = [];
      var frame = ent.model.frames[0];
      for (var tri of ent.model.triangles) {
        for (var i = 0; i < (ent.model.wire ? 2 : 1); i++) {
          verts.push.apply(verts, frame.verts[tri[0]]);
          verts.push.apply(verts, frame.verts[tri[1]]);
          verts.push.apply(verts, frame.verts[tri[2]]);
          norms.push.apply(norms, calculateNorms(tri, frame.verts, ent.model.normMethod))
          texCoords.push(0, 0, 1, 0, 0, 1);
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_.flatten(verts)), gl.STATIC_DRAW);
      gl.vertexAttribPointer(aVertPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_.flatten(norms)), gl.STATIC_DRAW);
      gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertTexCoordsBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
      gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
      var uMwMatrix = gl.getUniformLocation(shaderProgram, 'mwMatrix');
      var uWvMatrix = gl.getUniformLocation(shaderProgram, 'wvMatrix');
      var mw = mat4.fromRotationTranslation(mat4.create(), ent.o, ent.pos);
      var wv = worldCamMatrix;
      gl.uniformMatrix4fv(uMwMatrix, false, mw);
      gl.uniformMatrix4fv(uWvMatrix, false, wv);
      var uNormMatrix = gl.getUniformLocation(shaderProgram, 'normMatrix');
      gl.uniformMatrix4fv(uNormMatrix, false, new Float32Array(
        mat4.transpose(mat4.create(), mat4.invert(mat4.create(), mw))
      ));
      gl.bindTexture(gl.TEXTURE_2D, ent.model.glTexture);

      ent.model.wire ?
        gl.drawArrays(gl.LINES, 0, ent.model.triangles.length*6) :
        gl.drawArrays(gl.TRIANGLES, 0, ent.model.triangles.length*3);
    }

    function render(){
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(shaderProgram);
      var aVertPos = gl.getAttribLocation(shaderProgram, 'aVertPos');
      gl.enableVertexAttribArray(aVertPos);
      var aTexCoord = gl.getAttribLocation(shaderProgram, 'aTexCoord');
      gl.enableVertexAttribArray(aTexCoord);
      var aNorm = gl.getAttribLocation(shaderProgram, 'aNorm');
      gl.enableVertexAttribArray(aNorm);
      var uCamPos = gl.getUniformLocation(shaderProgram, 'camPos');
      gl.uniform3fv(uCamPos, camera.position);
      var uLightDir = gl.getUniformLocation(shaderProgram, 'lightDir');
      gl.uniform3fv(uLightDir, vec3.fromValues(1, 0, 0));
      for (ent of entities) {
        drawEntity(ent, aVertPos, aTexCoord, aNorm);
      }

      gl.useProgram(skyboxShader);
      drawSkybox(skybox);

      window.requestAnimationFrame(render);
    }
    render();
  }

  return Renderer;
})
