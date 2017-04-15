define([], () => `
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
  }
`);
