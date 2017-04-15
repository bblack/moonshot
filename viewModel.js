define([], () => {
  function ViewModel(options){
    this.entities = options.entities;
    this.skybox = options.skybox;
  }
  return ViewModel;
})
