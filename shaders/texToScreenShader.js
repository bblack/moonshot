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
    uniform mediump float warpPeak;
    void main(void){
      mediump vec2 st = vTexCoord.st;
      mediump float a = 0.01;
      mediump float b = 0.01;
      mediump float c = 0.005;
      st.s += (
        a *
        pow(
          2.718,
          -pow((warpPeak - st.t) - b, 2.0) / (2.0 * pow(c, 2.0))
        )
      ) - (
        a *
        pow(
          2.718,
          -pow((warpPeak - st.t) + b, 2.0) / (2.0 * pow(c, 2.0))
        )
      );
      st.s += 0.01*(0.5-fract(sin(st.s)*100000.0));
      st.t += 0.01*(0.5-fract(sin(st.t)*10000.0));
      mediump vec2 offset = vec2(0.005, 0.0);
      mediump vec4 colorR = texture2D(uSampler, st - offset);
      mediump vec4 colorG = texture2D(uSampler, st);
      mediump vec4 colorB = texture2D(uSampler, st + offset);
      gl_FragColor = vec4(colorR.x, colorG.y, colorB.z, 1.0);
    }
  `;
  return function(gl){
    return buildShader(gl, vertSrc, fragSrc);
  }
});
