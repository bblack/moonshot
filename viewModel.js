define([], () => {
  function ViewModel(options){
    this.entities = options.entities;
    this.skybox = options.skybox;
    this.targets = options.entities.filter((e, i) => i == 1);
  }
  return ViewModel;
})
