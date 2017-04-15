define(['./buildShader', './entityVert', './entityFrag'], (buildShader, entityVert, entityFrag) => {
  return function(gl){
    return buildShader(gl, entityVert, entityFrag);
  }
});
