define(['./buildShader',], (buildShader) => {
  var vertShader = `
    attribute vec3 aVertPos;
    attribute vec2 aTexCoord;
    varying highp vec2 vTexCoord;
    void main(void){
      gl_PointSize = 4.0;
      gl_Position = vec4(aVertPos, 1.0);
      vTexCoord = aTexCoord;
    }
  `;
  var fragShader = `
    uniform sampler2D uSampler;
    varying highp vec2 vTexCoord;
    void main(void){
      mediump vec4 color = texture2D(uSampler, vec2(vTexCoord.st));
      gl_FragColor = color;
    }
  `;
  return function(gl){
    return buildShader(gl, vertShader, fragShader);
  }
});
