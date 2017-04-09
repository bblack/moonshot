define(['jquery', 'gl-matrix', './vertShaderSource', './fragShaderSource'], ($, glMatrix, vertShaderSource, fragShaderSource) => {
  var mat4 = glMatrix.mat4;
  var vec3 = glMatrix.vec3;

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

  function invalidateCanvasSize(gl, shaderProgram){
    var w = $(gl.canvas).width();
    var h = $(gl.canvas).height();
    var aspect = w/h;
    var f = 1000;
    var n = 0.1;
    var projMatrix = [
      1/aspect, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, (f+n)/(f-n), 1,
      0, 0, (-2*f*n)/(f-n), 0
    ];
    gl.canvas.width = w;
    gl.canvas.height = h;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(shaderProgram);
    var uProjMatrix = gl.getUniformLocation(shaderProgram, 'projMatrix');
    gl.uniformMatrix4fv(uProjMatrix, false, new Float32Array(projMatrix));
  };

  function Renderer(canvas, entities, camera, crap){
    // TODO: figure out where crap goes (probably not here at all)
    var worldCamMatrix = crap.worldCamMatrix;
    var rotMatrix = crap.rotMatrix;

    var gl = canvas.getContext('webgl');
    gl.enable(gl.DEPTH_TEST);

    for (var ent of entities) {
      buildTexture(ent, gl);
    }

    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertShaderSource);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(vertShader));
    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragShaderSource);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(fragShader));
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);

    var vertBuf = gl.createBuffer();
    var normBuf = gl.createBuffer();

    invalidateCanvasSize(gl, shaderProgram);
    $(window).on('resize', () => invalidateCanvasSize(gl, shaderProgram));

    var vertTexCoordsBuf = gl.createBuffer();

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
          var norm = vec3.cross(
            vec3.create(),
            vec3.subtract(vec3.create(), frame.verts[tri[1]], frame.verts[tri[0]]),
            vec3.subtract(vec3.create(), frame.verts[tri[2]], frame.verts[tri[1]])
          );
          vec3.normalize(norm, norm);
          if (ent.model.flatface) {
            norms.push.apply(norms, norm);
            norms.push.apply(norms, norm);
            norms.push.apply(norms, norm);
          } else {
            norms.push.apply(norms, frame.verts[tri[0]]);
            norms.push.apply(norms, frame.verts[tri[1]]);
            norms.push.apply(norms, frame.verts[tri[2]]);
          }
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
      var mw = ent.skybox ? mat4.create() : mat4.fromRotationTranslation(mat4.create(), ent.o, ent.pos);
      var wv = ent.skybox ? rotMatrix : worldCamMatrix;
      gl.uniformMatrix4fv(uMwMatrix, false, mw);
      gl.uniformMatrix4fv(uWvMatrix, false, wv);
      var uNormMatrix = gl.getUniformLocation(shaderProgram, 'normMatrix');
      gl.uniformMatrix4fv(uNormMatrix, false, new Float32Array(
        mat4.transpose(mat4.create(), mat4.invert(mat4.create(), mw))
      ));
      gl.bindTexture(gl.TEXTURE_2D, ent.model.glTexture);
      var uFullbright = gl.getUniformLocation(shaderProgram, 'fullbright');
      gl.uniform1i(uFullbright, ent.model.fullbright);
      ent.model.wire ?
        gl.drawArrays(gl.LINES, 0, ent.model.triangles.length*6) :
        gl.drawArrays(gl.TRIANGLES, 0, ent.model.triangles.length*3);
    }

    function render(){
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

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

      window.requestAnimationFrame(render);
    }
    render();
  }

  return Renderer;
})
