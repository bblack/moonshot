define(['mousetrap'], (Mousetrap) => {
  return (inputState) => {
    Mousetrap.bind('w', () => inputState.forward = true, 'keydown');
    Mousetrap.bind('w', () => inputState.forward = false, 'keyup');
    Mousetrap.bind('s', () => inputState.back = true, 'keydown');
    Mousetrap.bind('s', () => inputState.back = false, 'keyup');
    Mousetrap.bind('a', () => inputState.left = true, 'keydown');
    Mousetrap.bind('a', () => inputState.left = false, 'keyup');
    Mousetrap.bind('d', () => inputState.right = true, 'keydown');
    Mousetrap.bind('d', () => inputState.right = false, 'keyup');
    Mousetrap.bind('left', () => inputState.turnleft = true, 'keydown');
    Mousetrap.bind('left', () => inputState.turnleft = false, 'keyup');
    Mousetrap.bind('right', () => inputState.turnright = true, 'keydown');
    Mousetrap.bind('right', () => inputState.turnright = false, 'keyup');
    Mousetrap.bind('up', () => inputState.pitchdown = true, 'keydown');
    Mousetrap.bind('up', () => inputState.pitchdown = false, 'keyup');
    Mousetrap.bind('down', () => inputState.pitchup = true, 'keydown');
    Mousetrap.bind('down', () => inputState.pitchup = false, 'keyup');
    Mousetrap.bind('q', () => inputState.rollleft = true, 'keydown');
    Mousetrap.bind('q', () => inputState.rollleft = false, 'keyup');
    Mousetrap.bind('e', () => inputState.rollright = true, 'keydown');
    Mousetrap.bind('e', () => inputState.rollright = false, 'keyup');
  };
})
