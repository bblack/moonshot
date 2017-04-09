define([], () => `
  varying highp vec2 vTexCoord;
  varying highp vec4 vNorm;
  varying highp vec4 pos;
  uniform sampler2D uSampler;
  uniform bool fullbright;
  uniform highp vec3 camPos;
  uniform highp vec3 lightDir;
  void main(void){
    mediump vec4 color = texture2D(uSampler, vec2(vTexCoord.st));
    if (fullbright) {
      gl_FragColor = color;
    } else {
      highp vec3 ambient = vec3(0.01);

      highp vec3 norm = normalize(vNorm.xyz);
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
