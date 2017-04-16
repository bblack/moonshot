define([], () => `
  attribute vec3 aVertPos;
  attribute vec2 aTexCoord;
  uniform mat4 projMatrix;
  uniform mat4 mvMatrix;
  varying highp vec2 vTexCoord;
  void main(void){
    gl_Position = projMatrix * mvMatrix * vec4(aVertPos, 1.0);
    vTexCoord = aTexCoord;
  }
`);
