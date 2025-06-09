import { Map } from "ol";

class LayerHelper {
  constructor(map) {
    if (!(map instanceof Map)) {
      throw new Error("Invalid map object");
    }
    this.map = map;
    this.updateZIndex();
  }
  // 添加并更新图层
  addLayer(layer) {
    this.map.addLayer(layer);
    this.updateZIndex();
  }  

  // 移除图层
  removeLayer(layer) {
    this.map.removeLayer(layer);
    this.updateZIndex();
  }

  // 获取所有图层
  getLayers() {
    return this.map.getLayers().getArray();
  }

  // 上移图层
  moveLayerUp(layer) {
    const layers = this.getLayers();
    const index = layers.indexOf(layer);
    if (index > 0) {
      layers.splice(index, 1);
      layers.splice(index - 1, 0, layer);
      this.updateZIndex();
    }
  }

  // 下移图层
  moveLayerDown(layer) {
    const layers = this.getLayers();
    const index = layers.indexOf(layer);
    if (index < layers.length - 1) {
      layers.splice(index, 1);
      layers.splice(index + 1, 0, layer);
      this.updateZIndex();
    }
  }

  // 交换两个图层的位置
  swapLayers(layer1, layer2) {
    const layers = this.getLayers();
    const index1 = layers.indexOf(layer1);
    const index2 = layers.indexOf(layer2);
    if (index1 !== -1 && index2 !== -1) {
      layers[index1] = layer2;
      layers[index2] = layer1;
      this.updateZIndex();
    }
  }

  // 更新所有图层的zIndex
  updateZIndex() {
    const layers = this.getLayers();
    layers.forEach((layer, index) => {
      layer.setZIndex(index);
    });
  }
}

export default LayerHelper;
