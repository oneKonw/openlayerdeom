import { Draw } from "ol/interaction";

import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";

class DrawHelper {
  constructor(map, layer) {
    this.map = map;
    this.layer = layer;
    this.draw = null;
  }

  addInteraction(type, callback, customStyle) {
    if (this.draw) {
      this.map.removeInteraction(this.draw);
    }
    this.draw = new Draw({
      source: this.layer.getSource(),
      type: type,
      style:
        customStyle ||
        new Style({
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.5)",
          }),
          stroke: new Stroke({
            color: "#ffcc33",
            width: 2,
          }),
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({
              color: "#ffcc33",
            }),
          }),
        }),
    });
    this.map.addInteraction(this.draw);
    this.draw.on("drawend", (event) => {
      this.map.removeInteraction(this.draw);
      if (callback) {
        callback(event.feature);
      }
    });
  }

  drawPoint(callback, customStyle) {
    this.addInteraction("Point", callback, customStyle);
  }

  drawLine(callback, customStyle) {
    this.addInteraction("LineString", callback, customStyle);
  }

  drawPolygon(callback, customStyle) {
    this.addInteraction("Polygon", callback, customStyle);
  }
}

export default DrawHelper;
