define(['./buildShader',], (buildShader) => {
  var vertShader = `
    attribute vec3 aVertPos;
    void main(void){
      gl_PointSize = 4.0;
      gl_Position = vec4(aVertPos, 1.0);
    }
  `;
  var fragShader = `
    uniform highp vec4 uColor;
    void main(void){
      gl_FragColor = uColor;
    }
  `;
  return function(gl){
    return buildShader(gl, vertShader, fragShader);
  }
});
