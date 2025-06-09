import Overlay from "ol/Overlay";

class PopupHelper {
  constructor(map) {
    this.map = map;
    this.popups = new Map(); // 使用 Map 来存储多个弹出窗口
  }

  // 创建弹出窗口
  createPopup(id, element) {
    if (this.popups.has(id)) {
      this.map.removeOverlay(this.popups.get(id));
    }
    // element.className = "ol-tooltip ol-tooltip-static";
    const popup = new Overlay({
      element: element,
      offset: [0, -15],
      positioning: "bottom-center",
      stopEvent: false,
      insertFirst: false,
    });
    this.map.addOverlay(popup);
    this.popups.set(id, popup);
    return popup;
  }

  // 显示弹出窗口
  showPopup(id, coordinate, content) {
    const popup = this.popups.get(id);
    if (!popup) {
      console.error(
        `Popup with id ${id} not created. Call createPopup() first.`
      );
      return;
    }
    const element = popup.getElement();
    element.innerHTML = content;
    popup.setPosition(coordinate);
    element.style.display = "block";
  }

  // 隐藏弹出窗口
  hidePopup(id) {
    const popup = this.popups.get(id);
    if (popup) {
      const element = popup.getElement();
      element.style.display = "none";
    }
  }

  // 更新弹出窗口内容
  updatePopupContent(id, content) {
    const popup = this.popups.get(id);
    if (popup) {
      const element = popup.getElement();
      element.innerHTML = content;
    }
  }

  // 移除弹出窗口
  removePopup(id) {
    const popup = this.popups.get(id);
    if (popup) {
      this.map.removeOverlay(popup);
      this.popups.delete(id);
    }
  }
}

export default PopupHelper;
