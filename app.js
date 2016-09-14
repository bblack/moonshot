$(() => {
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
            }]
        }
    };

    var camera = {
        position: vec3.create(),
        velocity: vec3.create(),
        o: {yaw: 0},
        heading: () => {
            var v = vec3.fromValues(0, 0, 1);
            var yawMatrix = mat3.fromValues(
                Math.cos(camera.o.yaw), 0, Math.sin(camera.o.yaw),
                0, 1, 0,
                -Math.sin(camera.o.yaw), 0, Math.cos(camera.o.yaw)
            );
            var speed = 0.1;
            vec3.transformMat3(v, v, yawMatrix);
            return vec3.scale(v, v, speed);
        }
    };
    Mousetrap.bind('w', () => camera.forward = true, 'keydown');
    Mousetrap.bind('w', () => camera.forward = false, 'keyup');
    Mousetrap.bind('s', () => camera.back = true, 'keydown');
    Mousetrap.bind('s', () => camera.back = false, 'keyup');
    Mousetrap.bind('a', () => camera.left = true, 'keydown');
    Mousetrap.bind('a', () => camera.left = false, 'keyup');
    Mousetrap.bind('d', () => camera.right = true, 'keydown');
    Mousetrap.bind('d', () => camera.right = false, 'keyup');
    Mousetrap.bind('left', () => camera.turnleft = true, 'keydown');
    Mousetrap.bind('left', () => camera.turnleft = false, 'keyup');
    Mousetrap.bind('right', () => camera.turnright = true, 'keydown');
    Mousetrap.bind('right', () => camera.turnright = false, 'keyup');

    var gl = $('canvas')[0].getContext('webgl');

    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, `
        attribute vec3 aVertPos;
        uniform mat4 projMatrix;
        uniform mat4 mvMatrix;
        void main(void){
            gl_Position = projMatrix * mvMatrix * vec4(aVertPos, 1.0);
            gl_PointSize = 7.0;
        }
    `);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(vertShader));
    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, `
        void main(void){
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
    `);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(fragShader));
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);

    var vertBuf = gl.createBuffer();

    var worldCamMatrix = mat4.create();
    var camWorldMatrix = mat4.create();
    function tick(){
        var camWorldScaleMatrix = mat3.fromMat4(mat3.create(), camWorldMatrix); // discard translation
        var fwd = vec3.transformMat3(vec3.create(), [0, 0, 0.1],  camWorldScaleMatrix);
        var left = vec3.transformMat3(vec3.create(), [-0.1, 0, 0], camWorldScaleMatrix);
        if (camera.forward)
            vec3.add(camera.position, camera.position, fwd);
        if (camera.back)
            vec3.subtract(camera.position, camera.position, fwd);
        if (camera.left)
            vec3.add(camera.position, camera.position, left);
        if (camera.right)
            vec3.subtract(camera.position, camera.position, left);
        if (camera.turnleft)
            camera.o.yaw += 0.05;
        if (camera.turnright)
            camera.o.yaw -= 0.05;
        var worldCamTranslateMatrix = mat4.fromValues(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -camera.position[0], -camera.position[1], -camera.position[2], 1
        );
        var worldCamYawMatrix = mat4.fromValues(
            Math.cos(-camera.o.yaw), 0, Math.sin(-camera.o.yaw), 0,
            0, 1, 0, 0,
            -Math.sin(-camera.o.yaw), 0, Math.cos(-camera.o.yaw), 0,
            0, 0, 0, 1
        );
        mat4.mul(worldCamMatrix, worldCamYawMatrix, worldCamTranslateMatrix);
        mat4.invert(camWorldMatrix, worldCamMatrix);
        var t = (Date.now() % 8000) / 8000 * 2 * Math.PI;
        var modelWorldMatrix = mat4.fromValues(
            Math.cos(t), 0, Math.sin(t), 0,
            0, 1, 0, 0,
            -Math.sin(t), 0, Math.cos(t), 0,
            0, -1/2, 2, 1
        );
        var mvMatrix = mat4.create();
        mat4.mul(mvMatrix, worldCamMatrix, modelWorldMatrix);
        gl.useProgram(shaderProgram);
        var uMvMatrix = gl.getUniformLocation(shaderProgram, 'mvMatrix');
        gl.uniformMatrix4fv(uMvMatrix, false, new Float32Array(mvMatrix));
        window.requestAnimationFrame(tick);
    }
    tick();

    function invalidateCanvasSize(){
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
    invalidateCanvasSize();
    $(window).on('resize', invalidateCanvasSize);

    function render(){
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(shaderProgram);
        var aVertPos = gl.getAttribLocation(shaderProgram, 'aVertPos');
        gl.enableVertexAttribArray(aVertPos);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
        // wireframe:
        var verts = [];
        var frame = beacon.model.frames[0];
        for (var tri of beacon.model.triangles) {
            verts.push.apply(verts, frame.verts[tri[0]]);
            verts.push.apply(verts, frame.verts[tri[1]]);
            verts.push.apply(verts, frame.verts[tri[1]]);
            verts.push.apply(verts, frame.verts[tri[2]]);
            verts.push.apply(verts, frame.verts[tri[2]]);
            verts.push.apply(verts, frame.verts[tri[0]]);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_.flatten(verts)), gl.STATIC_DRAW);
        gl.vertexAttribPointer(aVertPos, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINES, 0, verts.length/3);

        window.requestAnimationFrame(render);
    }
    render();
})
