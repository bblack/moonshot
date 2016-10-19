$(() => {
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
    _.each(skybox.model.frames[0].verts, (v) => {
        // TODO: instead of choosing some big number less than the distance to the far frustum plane, have a special projection matrix for skyboxes that always gives max Z
        var n = 500;
        v[0] *= n;
        v[1] *= n;
        v[2] *= n;
    })

    var entities = [sphere, skybox];

    var camera = {
        position: vec3.create(),
        velocity: vec3.create(),
        o: quat.create()
    };
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

    window.addEventListener('gamepadconnected', (evt) => {
        console.log('gamepad: ' + evt.gamepad.id);
        function pollButtons(){
            console.log(evt.gamepad.buttons)
            // window.requestAnimationFrame(pollButtons);
            setTimeout(pollButtons, 500);
        }
        // pollButtons();
    })

    var gl = $('canvas')[0].getContext('webgl');
    gl.enable(gl.DEPTH_TEST);

    for (var ent of entities) {
        ent.model.glTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, ent.model.glTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ent.model.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
            ent.model.mipmap == false ? gl.LINEAR : gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, `
        attribute vec3 aVertPos;
        attribute vec2 aTexCoord;
        attribute vec3 aNorm;
        uniform mat4 projMatrix;
        uniform mat4 mwMatrix;
        uniform mat4 wvMatrix;
        uniform mat4 normMatrix;
        varying highp vec2 vTexCoord;
        varying highp vec4 vNorm;
        varying highp vec4 pos;
        void main(void){
            pos = mwMatrix * vec4(aVertPos, 1.0);
            gl_Position = projMatrix * wvMatrix * mwMatrix * vec4(aVertPos, 1.0);
            vTexCoord = aTexCoord;
            vNorm = normMatrix * vec4(aNorm, 1.0);
            gl_PointSize = 7.0;
        }
    `);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(vertShader));
    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, `
        varying highp vec2 vTexCoord;
        varying highp vec4 vNorm;
        varying highp vec4 pos;
        uniform sampler2D uSampler;
        uniform bool fullbright;
        uniform highp vec3 camPos;
        void main(void){
            mediump vec4 color = texture2D(uSampler, vec2(vTexCoord.st));
            if (fullbright) {
                gl_FragColor = color;
            } else {
                highp vec3 ambient = vec3(0.01);

                highp vec3 norm = normalize(vNorm.xyz);
                highp vec3 lightDir = vec3(1, 0, 0);
                highp float lightDirDotNorm = dot(lightDir, norm);

                highp vec3 diffuse = color.rgb * max(0.0, -lightDirDotNorm);

                highp vec3 reflectDir = (lightDirDotNorm >= 0.0) ? vec3(0.0) :
                    (lightDir - (2.0 * lightDirDotNorm * norm));
                highp vec3 viewDir = normalize(camPos - (pos.xyz / pos.w));
                highp float spec = max(0.0, dot(viewDir, reflectDir));
                spec = pow(spec, 5.0) * 0.5; // magic numbars

                gl_FragColor = vec4(ambient + diffuse + vec3(spec), color.a);
            }
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
    var normBuf = gl.createBuffer();

    var worldCamMatrix = mat4.create();
    var camWorldMatrix = mat4.create();
    var rotMatrix = mat4.create();
    var lastTick;
    function tick(){
        var sinceLastTick = Date.now() - lastTick;
        lastTick = Date.now();
        var camWorldScaleMatrix = mat3.fromMat4(mat3.create(), camWorldMatrix); // discard translation
        var fwd = vec3.transformMat3(vec3.create(), [0, 0, 0.1],  camWorldScaleMatrix);
        var left = vec3.transformMat3(vec3.create(), [-0.1, 0, 0], camWorldScaleMatrix);
        var rot = quat.create();
        if (inputState.forward)
            vec3.add(camera.position, camera.position, fwd);
        if (inputState.back)
            vec3.subtract(camera.position, camera.position, fwd);
        if (inputState.left)
            vec3.add(camera.position, camera.position, left);
        if (inputState.right)
            vec3.subtract(camera.position, camera.position, left);
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
        var gamepad = navigator.getGamepads()[0];
        if (gamepad) {
            // TODO: clean this up. put it in a separate function, that is invoked by animation frames, and have it affect inputState like keyboard, so that among other things, it won't allow the player to double up on speed. also dry up the notion (and value) of threshold.
            if (Math.abs(gamepad.axes[0]) > 0.1)
                vec3.subtract(camera.position, camera.position,
                    vec3.scale(vec3.create(), left, gamepad.axes[0]));
            if (Math.abs(gamepad.axes[1]) > 0.1)
                vec3.subtract(camera.position, camera.position,
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
        quat.mul(camera.o, rot, camera.o);
        var worldCamTranslateMatrix = mat4.fromValues(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -camera.position[0], -camera.position[1], -camera.position[2], 1
        );
        rotMatrix = mat4.fromQuat(mat4.create(), camera.o);
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
        for (ent of entities) {
            drawEntity(ent, aVertPos, aTexCoord, aNorm);
        }

        window.requestAnimationFrame(render);
    }
    render();
})
