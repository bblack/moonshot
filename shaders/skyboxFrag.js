define([], () => `
  varying highp vec2 vTexCoord;
  uniform sampler2D uSampler;
  void main(void){
    mediump vec4 color = texture2D(uSampler, vec2(vTexCoord.st));
    gl_FragColor = color;
  }
`);
