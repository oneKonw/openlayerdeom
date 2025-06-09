import { getLength as sphereLength, getArea as sphereArea } from "ol/sphere";
import Polygon from "ol/geom/Polygon";
import LineString from "ol/geom/LineString";
import Feature from "ol/Feature";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import * as turf from "@turf/turf";
import { GeoJSON } from "ol/format";

class ComputeHelper {
  // 计算多边形的面积
  static calculateArea(feature) {
    let polygon = feature.getGeometry();
    if (!(polygon instanceof Polygon)) {
      throw new Error("Invalid polygon object");
    }
    const area = sphereArea(polygon); // 结果一致
    const area4 = sphereArea(polygon, window.map.getView().getProjection()); // 结果一致
    const turfFeature = new GeoJSON().writeFeatureObject(feature, {
      featureProjection: "EPSG:3857",
    });
    const area3 = turf.area(turfFeature); // 些许误差

    const area2 = polygon.getArea(); // 差距较大

    console.log("area", area);
    console.log("area2", area2);
    console.log("area3", area3);
    console.log("area4", area4);
    return area;
  }

  // 计算线的长度
  static calculateLength(feature) {
    let line = feature.getGeometry();
    if (!(line instanceof LineString)) {
      throw new Error("Invalid line object");
    }
    return sphereLength(line);
  }

  // 计算两个feature的交集
  intersection(feature1, feature2) {
    let polygon1 = turf.polygon(feature1.getGeometry().getCoordinates());
    let polygon2 = turf.polygon(feature2.getGeometry().getCoordinates());
    const intersection = turf.intersect(
      turf.featureCollection([polygon1, polygon2])
    );

    if (intersection) {
      // 如果有交集，创建一个新的Feature
      let intersectionFeature = new Feature({
        geometry: new Polygon(intersection.geometry.coordinates),
      });
      intersectionFeature.setStyle(
        new Style({
          fill: new Fill({ color: "#ffff00" }),
          stroke: new Stroke({
            color: "#0000ff",
            width: 1,
          }),
        })
      );
      return intersectionFeature;
    } else {
      console.log("No intersection found.");
      return null;
    }
  }
  // 计算两个feature的并集
  union(feature1, feature2) {
    let polygon1 = turf.polygon(feature1.getGeometry().getCoordinates());
    let polygon2 = turf.polygon(feature2.getGeometry().getCoordinates());
    const union = turf.union(turf.featureCollection([polygon1, polygon2]));
    if (union) {
      // 如果有交集，创建一个新的Feature
      let unionFeature = new Feature({
        geometry: new Polygon(union.geometry.coordinates),
      });
      unionFeature.setStyle(
        new Style({
          fill: new Fill({ color: "#ffffff" }),
          stroke: new Stroke({
            color: "#ffffff",
            width: 1,
          }),
        })
      );
      return unionFeature;
    } else {
      console.log("No union found.");
      return null;
    }
  }
  // 计算两个feature的差集
  difference(feature1, feature2) {
    let polygon1 = turf.polygon(feature1.getGeometry().getCoordinates());
    let polygon2 = turf.polygon(feature2.getGeometry().getCoordinates());
    const difference = turf.difference(
      turf.featureCollection([polygon1, polygon2])
    );
    if (difference) {
      let differenceFeature = new Feature({
        geometry: new Polygon(difference.geometry.coordinates),
      });
      differenceFeature.setStyle(
        new Style({
          fill: new Fill({ color: "#ffffff" }),
          stroke: new Stroke({
            color: "#ff0000",
            width: 1,
          }),
        })
      );
      return differenceFeature;
    } else {
      console.log("No difference found.");
      return null;
    }
  }

  // 线缓冲
  lineBuffer(features, distance) {
    // let line = turf.lineString(feature.getGeometry().getCoordinates());
    const turfLines = new GeoJSON().writeFeaturesObject(features, {
      featureProjection: "EPSG:3857",
    });
    let buffered = turf.buffer(turfLines, distance, { units: "meters" });
    return new GeoJSON().readFeatures(buffered, {
      featureProjection: "EPSG:3857",
    });
  }
  // 传入turf polygon，返回 openlayer feature
  //   turfToOl(turfPolygon) {
  //     let olPolygon = new Feature({
  //       geometry: new Polygon(turfPolygon.geometry.coordinates),
  //     });
  //     return olPolygon;
  //   }
  // 面缓冲
  polygonBuffer(features, distance) {
    const turfPolygons = new GeoJSON().writeFeaturesObject(features, {
      featureProjection: "EPSG:3857",
    });
    let buffered = turf.buffer(turfPolygons, distance, { units: "meters" });
    return new GeoJSON().readFeatures(buffered, {
      featureProjection: "EPSG:3857",
    });
  }
}

export default ComputeHelper;
