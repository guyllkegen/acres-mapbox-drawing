/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable class-methods-use-this */
class ExtendDrawBar {
  constructor(opt: any) {
    const ctrl: any = this;
    ctrl.draw = opt.draw;
    ctrl.buttons = opt.buttons || [];
    ctrl.onAddOrig = opt.draw.onAdd;
    ctrl.onRemoveOrig = opt.draw.onRemove;
  }

  onAdd(map:any) {
    const ctrl:any = this;
    ctrl.map = map;
    ctrl.elContainer = ctrl.onAddOrig(map);
    ctrl.buttons.forEach((b:any) => {
      ctrl.addButton(b);
    });
    return ctrl.elContainer;
  }

  onRemove(map: any) {
    const ctrl:any = this;
    (ctrl).buttons.forEach((b:any) => {
      ctrl.removeButton(b);
    });
    ctrl.onRemoveOrig(map);
  }

  addButton(opt:any) {
    const ctrl:any = this;
    const elButton = document.createElement('button');
    elButton.className = 'mapbox-gl-draw_ctrl-draw-btn';
    if (opt.classes instanceof Array) {
      opt.classes.forEach((c:any) => {
        elButton.classList.add(c);
      });
    }
    if (opt.content) {
      if (opt.content instanceof Element) {
        elButton.appendChild(opt.content);
      } else {
        elButton.innerHTML = opt.content;
      }
    }
    elButton.addEventListener(opt.on, opt.action);
    ctrl.elContainer.appendChild(elButton);
    opt.elButton = elButton;
  }

  removeButton(opt:any) {
    opt.elButton.removeEventListener(opt.on, opt.action);
    opt.elButton.remove();
  }
}

export default ExtendDrawBar;
