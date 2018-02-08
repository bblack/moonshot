define(['./buildShader'], (buildShader) => {
  var vertSrc = `
    attribute vec2 aVertPos;
    varying highp vec2 vTexCoord;
    void main(void){
      gl_Position = vec4(aVertPos, 1.0, 1.0);
      vTexCoord = vec2(aVertPos.x + 1.0, aVertPos.y + 1.0) / 2.0;
    }
  `;
  var fragSrc = `
    varying highp vec2 vTexCoord;
    uniform sampler2D uSampler;
    void main(void){
      mediump vec4 colorR = texture2D(uSampler, vec2(vTexCoord.st) - vec2(0.001, 0.0));
      mediump vec4 colorG = texture2D(uSampler, vec2(vTexCoord.st));
      mediump vec4 colorB = texture2D(uSampler, vec2(vTexCoord.st) + vec2(0.001, 0.0));
      gl_FragColor = vec4(colorR.x, colorG.y, colorB.z, 1.0);
    }
  `;
  return function(gl){
    return buildShader(gl, vertSrc, fragSrc);
  }
});
