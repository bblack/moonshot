define(['./buildShader', './skyboxVert', './skyboxFrag'], (buildShader, vertShader, fragShader) => {
  return function(gl){
    return buildShader(gl, vertShader, fragShader);
  }
});
