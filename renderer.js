define(['gl-matrix', './shaders/entity', './shaders/skybox', './shaders/target', './shaders/targetLabel', './shaders/texToScreenShader'], (glMatrix, entityShader, buildSkyboxShader, buildTargetShader, buildTargetLabelShader, buildTexToScreenShader) => {
  var mat4 = glMatrix.mat4;
  var vec3 = glMatrix.vec3;
  var MAX_RESOLUTION = [640, 360];

  function buildTexture(gl, imageData, opts){
    opts = opts || {};
    var glTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, glTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opts.maxFilter || gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return glTexture;
  }

  function buildEntityTexture(ent, gl){
    ent.model.glTexture = buildTexture(gl, ent.model.texture, {
      maxFilter: ent.model.mipmap == false ? gl.LINEAR : gl.LINEAR_MIPMAP_NEAREST
    });
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

  function buildTargetProjectionMatrix(aspect){
    return mat4.fromValues(
      1/aspect, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 0, 1,
      0, 0, 0, 0
    )
  }

  function invalidateCanvasSize(gl, entityShader, skyboxShader, targetShader){
    var w = gl.canvas.offsetWidth;
    var h = gl.canvas.offsetHeight;
    var aspect = w/h;
    var f = 1000;
    var n = 0.1;
    var projMatrix = buildPerspectiveProjectionMatrix(aspect, n, f);
    gl.canvas.width = w;
    gl.canvas.height = h;

    gl.useProgram(entityShader);
    var uProjMatrix = gl.getUniformLocation(entityShader, 'projMatrix');
    gl.uniformMatrix4fv(uProjMatrix, false, new Float32Array(projMatrix));

    gl.useProgram(skyboxShader);
    var skyboxProjMatrix = buildSkyboxProjectionMatrix(aspect);
    var uSkyboxProjMatrix = gl.getUniformLocation(skyboxShader, 'projMatrix');
    gl.uniformMatrix4fv(uSkyboxProjMatrix, false, new Float32Array(skyboxProjMatrix));
  };

  function buildModelWorldMatrix(ent){
    return mat4.fromRotationTranslation(mat4.create(), ent.o, ent.pos);
  }

  function buildEntityNorms(ent) {
    ent.model.frames.forEach((frame) => {
      frame.norms = ent.model.triangles.reduce((memo, tri) => {
        calculateNorms(tri, frame.verts, 'flatface')
          .forEach((coord) => memo.push(coord));
        return memo;
      }, []);
    });
  }

  function Renderer(canvas, viewModel, camera, crap){
    // TODO: figure out where crap goes (probably not here at all)
    var worldCamMatrix = crap.worldCamMatrix;
    var rotMatrix = crap.rotMatrix;
    var gl = canvas.getContext('webgl');
    var shaderProgram = entityShader(gl);
    var skyboxShader = buildSkyboxShader(gl);
    var targetShader = buildTargetShader(gl);
    var targetLabelShader = buildTargetLabelShader(gl);
    var texToScreenShader = buildTexToScreenShader(gl);
    var vertBuf = gl.createBuffer();
    var normBuf = gl.createBuffer();
    var vertTexCoordsBuf = gl.createBuffer();
    var entities = viewModel.entities;
    var skybox = viewModel.skybox;
    var targets = viewModel.targets;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // let skybox pass depth test at exactly max z

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    for (var ent of entities) {
      buildEntityTexture(ent, gl);
      buildEntityNorms(ent);
    }
    buildEntityTexture(skybox, gl);

    invalidateCanvasSize(gl, shaderProgram, skyboxShader, targetShader);
    window.addEventListener('resize', () => invalidateCanvasSize(gl, shaderProgram, skyboxShader, targetShader));

    var targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    var attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, 0);
    // create & attach depthBuffer to framebuffer:
    var depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 1024, 1024);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

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

      gl.useProgram(skyboxShader);

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
      var frame = ent.model.frames[0];
      var triangles = ent.model.triangles;
      var verts = triangles.reduce((memo, tri) => {
        tri.forEach((vertIndex) => {
          frame.verts[vertIndex].forEach((coord) => memo.push(coord));
        });
        return memo;
      }, []);
      var texCoords = triangles.reduce((memo, tri) => {
        memo.push(0, 0, 1, 0, 0, 1);
        return memo;
      }, []);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_.flatten(verts)), gl.STATIC_DRAW);
      gl.vertexAttribPointer(aVertPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_.flatten(frame.norms)), gl.STATIC_DRAW);
      gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertTexCoordsBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
      gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
      var uMwMatrix = gl.getUniformLocation(shaderProgram, 'mwMatrix');
      var uWvMatrix = gl.getUniformLocation(shaderProgram, 'wvMatrix');
      var mw = buildModelWorldMatrix(ent);
      var wv = worldCamMatrix;
      gl.uniformMatrix4fv(uMwMatrix, false, mw);
      gl.uniformMatrix4fv(uWvMatrix, false, wv);
      var uNormMatrix = gl.getUniformLocation(shaderProgram, 'normMatrix');
      gl.uniformMatrix4fv(uNormMatrix, false, new Float32Array(
        mat4.transpose(mat4.create(), mat4.invert(mat4.create(), mw))
      ));
      gl.bindTexture(gl.TEXTURE_2D, ent.model.glTexture);

      gl.drawArrays(gl.TRIANGLES, 0, ent.model.triangles.length*3);
    }

    function drawTarget(ent){
      var frame = ent.model.frames[0];
      var max = [-Infinity, -Infinity, -Infinity];
      var min = [Infinity, Infinity, Infinity];
      var mw = buildModelWorldMatrix(ent);
      var wv = worldCamMatrix;
      frame.bbox.forEach((bboxVert) => {
        var viewVert = vec3.create();
        vec3.transformMat4(viewVert, bboxVert, mw);
        vec3.transformMat4(viewVert, viewVert, wv);
        vec3.transformMat4(viewVert, viewVert, buildTargetProjectionMatrix(gl.canvas.width/gl.canvas.height))
        viewVert.forEach((coord, i) => {
          min[i] = Math.min(min[i], coord);
          max[i] = Math.max(max[i], coord);
        })
      });
      var corners = [
        min,
        [min[0], max[1], 0],
        max,
        [max[0], min[1], 0]
      ];

      gl.useProgram(targetShader);

      gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_.flatten(corners)), gl.STATIC_DRAW);
      aVertPos = gl.getAttribLocation(targetShader, 'aVertPos');
      gl.enableVertexAttribArray(aVertPos);
      gl.vertexAttribPointer(aVertPos, 3, gl.FLOAT, false, 0, 0);

      uColor = gl.getUniformLocation(targetShader, 'uColor');
      gl.uniform4fv(uColor, new Float32Array([1, 1, 1, 1]));

      gl.drawArrays(gl.POINTS, 0, 4);

      // then the label:
      var canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px carrois gothic';
      ctx.fillText('Omicron Perseii VII', 0, 20);
      var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var targetLabelTexture = buildTexture(gl, imageData);
      gl.bindTexture(gl.TEXTURE_2D, targetLabelTexture);

      gl.useProgram(targetLabelShader);

      gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        min[0], min[1], 0,
        min[0], min[1] - 1/4, 0,
        min[0] + 1/2, min[1], 0,
        min[0] + 1/2, min[1] - 1/4, 0
      ]), gl.STATIC_DRAW);
      aVertPos = gl.getAttribLocation(targetLabelShader, 'aVertPos');
      gl.enableVertexAttribArray(aVertPos);
      gl.vertexAttribPointer(aVertPos, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, vertTexCoordsBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        0, 1,
        1, 0,
        1, 1,
      ]), gl.STATIC_DRAW);
      aTexCoord = gl.getAttribLocation(targetLabelShader, 'aTexCoord');
      gl.enableVertexAttribArray(aTexCoord);
      gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function render(){
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

      gl.viewport(0, 0, 1024, 1024);
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
      drawSkybox(skybox);
      for (ent of targets) {
        drawTarget(ent);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, targetTexture);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(texToScreenShader);

      gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, 1, 1, 1, 1, -1, 1, -1, -1, -1, -1, 1]),
        gl.STATIC_DRAW);
      var aVertPos = gl.getAttribLocation(texToScreenShader, 'aVertPos');
      gl.enableVertexAttribArray(aVertPos);
      gl.vertexAttribPointer(aVertPos, 2, gl.FLOAT, false, 0, 0);

      gl.uniform1f(
        gl.getUniformLocation(texToScreenShader, 'warpPeak'),
        // 0.0
        (Date.now() % 10000) / 10000
      );

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      window.requestAnimationFrame(render);
    }
    render();
  }

  return Renderer;
})
