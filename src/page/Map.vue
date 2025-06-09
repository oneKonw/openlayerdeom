<template>
  <div class="full-screen">
    <div id="map" class="map-container"></div>
    <!-- <button @click="animate" class="animate-button">Animate Map</button>
    <button @click="swapLayer()" class="swap-button">Swap Layer</button> -->

    <!-- 左上角面板 -->
    <div class="control-panel">
      <div class="panel-section">
        <div class="section-title">图层</div>
        <div class="layer-item" v-for="(item, index) in layerList" :key="index">
          <input
            type="checkbox"
            :id="`layer${index}`"
            :checked="item.checked"
            @click="handleLayerClick(item, index)"
          />
          <label :for="`layer${index}`">{{ item.name }}</label>
        </div>
      </div>

      <div class="panel-section">
        <div class="section-title">分析</div>
        <div class="analysis-item">
          <div class="analysis-label">分析范围</div>
          <div class="analysis-input">
            <input
              type="number"
              v-model.number="bufferDistance"
              @input="validateBufferDistance"
            />
            <span class="unit">km</span>
          </div>
        </div>
        <div class="analysis-item button-group">
          <button class="upload-btn" @click="drawPolygon">绘制</button>
          <input
            type="file"
            id="fileInput"
            @change="handleFileUpload"
            style="display: none"
            accept=".geojson"
          />
          <button class="upload-btn" @click="triggerFileInput">上传文件</button>
        </div>
        <div class="analysis-item">
          <button class="analysis-btn" @click="analysisEvaluate">
            分析评估
          </button>
        </div>
        <div>
          <button class="clear-btn" @click="clear">清除</button>
        </div>
      </div>
    </div>
    <!-- 左下角面板 -->
    <div class="left-bottom-panel" v-show="isAnalysis">
      <div class="panel-section">
        <div class="section-title">输出结果</div>
        <div class="result-item">
          <template v-if="analysisResult.length > 0">
            存在交集：选址与{{
              analysisResult.join("/")
            }}存在交集，请注意复核是否存在冲突
          </template>
          <template v-else> 不存在交集 </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import "ol/ol.css";
import { Map, View } from "ol";
import Tile from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { defaults } from "ol/interaction";
import { fromLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import GeoJSON from "ol/format/GeoJSON";
import Circle from "ol/style/Circle";
import LayerHelper from "../tools/LayerHelper";
import DrawHelper from "../tools/DrawHelper";
import ComputeHelper from "../tools/ComputeHelper";
let map = null;

import zdxmxz from "../assets/geosjon/point/zdxmxz.geojson";
import zdgnpq from "../assets/geosjon/point/zdgnpq.geojson";
import zdxmaqkzq from "../assets/geosjon/point/zdxmaqkzq.geojson";
import zdjsxm from "../assets/geosjon/point/zdjsxm.geojson";


// 默认样式
let defaultStyle = new Style({
  image: new Circle({
    radius: 5,
    fill: new Fill({
      color: "rgba(0,255,0,1)",
    }),
  }),
});

// 高亮样式
let highlightStyle = new Style({
  image: new Circle({
    radius: 5,
    fill: new Fill({ color: "rgba(255,0,0,1)" }),
  }),
});

// // 普通样式
let normalStyle = new Style({
  image: new Circle({
    radius: 5,
    fill: new Fill({ color: "rgba(0,0,255,0.5)" }),
  }),
});

export default {
  name: "MapPage",
  data() {
    return {
      layerList: [
        {
          name: "重点建设项目",
          url: zdjsxm,
          checked: false,
        },
        {
          name: "重点项目选址",
          url: zdxmxz,
          checked: false,
        },
        {
          name: "重点功能片区",
          url: zdgnpq,
          checked: false,
        },
        {
          name: "重大项目安全控制区",
          url: zdxmaqkzq,
          checked: false,
        },
      ],
      mapCenter: [113.33779344641266, 23.160504749489746],
      mapZoom: 13,
      layerStatus: [],
      bufferDistance: 1,
      analysisResult: new Set(),
      isAnalysis: false,
      bufferArray: [],
    };
  },
  mounted() {
    console.log("init")
    // 设置浮动层
    map = new Map({
      target: "map",

      layers: [
        new Tile({
          zIndex: 1,
          source: new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          }),
        }),
        // 高德地图
      ],
      view: new View({
        // projection: "EPSG:4326",
        // center: [114.064839, 22.548857],
        projection: "EPSG:3857",
        center: fromLonLat(this.mapCenter),
        zoom: this.mapZoom,
      }),
      interactions: defaults({
        doubleClickZoom: false,
      }),
    });
    this.layerHelper = new LayerHelper(map);
    // 添加绘制图层
    this.drawLayer = new VectorLayer({
      style: new Style({
        fill: new Fill({
          color: "rgba(143,195,179,0.7)",
        }),
        stroke: new Stroke({
          color: "rgba( 79,253,253,1)",
        }),
      }),
      source: new VectorSource({
        projection: "EPSG:3857",
      }),
    });
    this.layerHelper.addLayer(this.drawLayer);
    // 添加缓冲图层
    this.bufferLayer = new VectorLayer({
      source: new VectorSource({
        projection: "EPSG:3857",
      }),
      style: new Style({
        fill: new Fill({
          color: "rgba(143,195,179,0.7)",
        }),
        stroke: new Stroke({
          color: "rgba( 79,253,253,1)",
        }),
      }),
    });
    this.layerHelper.addLayer(this.bufferLayer);

    this.drawHelper = new DrawHelper(map, this.drawLayer);
    this.computeHelper = new ComputeHelper();
    window.map = map;
  },
  methods: {
    handleLayerClick(item) {
      item.checked = !item.checked;
      if (item.checked) {
        this.layerHelper.addLayer(this.loadGeojson(item.url, item.name));
      } else {
        this.layerHelper.removeLayer(this.loadGeojson(item.url, item.name));
      }
    },
    // 通过url加载geojson
    loadGeojson(url, name) {
      const layer = this.layerStatus.find((item) => item.name === name);
      if (layer) {
        return layer.layer;
      }
      const vectorLayer = new VectorLayer({
        zIndex: 3,
        source: new VectorSource({
          features: new GeoJSON().readFeatures(url, {
            featureProjection: "EPSG:3857",
          }),
        }),
        style: defaultStyle,
      });
      this.layerStatus.push({
        name: name,
        layer: vectorLayer,
      });
      return vectorLayer;
    },
    // 移除geojson图层
    removeGeojsonLayer(url) {
      const layersToRemove = [];
      map.getLayers().forEach((layer) => {
        if (
          layer.getSource() instanceof VectorSource &&
          layer.getSource().getUrl() === url
        ) {
          layersToRemove.push(layer);
        }
      });
      layersToRemove.forEach((layer) => map.removeLayer(layer));
    },
    // 设置feature样式
    setFeatureStyle(feature) {
      feature.setStyle(
        new Style({
          fill: new Fill({ color: "rgba(255,255,0,1)" }),
        })
      );
    },
    // 分析评估
    analysisEvaluate() {
      this.bufferLayer.getSource().clear();
      this.isAnalysis = true;
      // 遍历计算drawlayer中feature缓冲区
      this.bufferArray = [];
      const features = this.drawLayer.getSource().getFeatures();
      features.forEach((feature) => {
        let buffer = this.computeHelper.polygonBuffer(
          [feature],
          this.bufferDistance * 1000
        );
        if (buffer.length > 0) {
          this.bufferLayer.getSource().addFeatures(buffer);
          this.bufferArray.push(buffer[0]);
        }
      });

      this.isPointInBuffer(this.bufferArray);
    },

    // 绘制面
    drawPolygon() {
      this.drawHelper.drawPolygon(() => {
        // // 利用turf对feature计算缓冲区
        // let buffer = this.computeHelper.polygonBuffer(
        //   [feature],
        //   this.bufferDistance * 1000
        // );
        // this.bufferArray.push(buffer[0]);
      });
    },
    // 判断点落在缓冲区内部
    isPointInBuffer(buffers) {
      // 清空分析结果数组
      this.analysisResult = [];

      // 存储所有相交点的数组
      const intersectingPoints = [];
      // 存储所有点的数组
      const allPoints = [];

      // 获取选中的图层
      const checkedItems = this.layerList.filter((item) => item.checked);

      // 遍历所有buffer
      buffers.forEach((buffer) => {
        const bufferGeometry = buffer.getGeometry();

        // 遍历选中图层
        checkedItems.forEach((item) => {
          const layerInfo = this.layerStatus.find(
            (statusItem) => statusItem.name === item.name
          );
          if (!layerInfo) return;

          const features = layerInfo.layer.getSource().getFeatures();
          let hasIntersection = false;

          // 检查每个点位
          features.forEach((feature) => {
            const point = feature.getGeometry().getLastCoordinate();
            allPoints.push(feature);

            if (bufferGeometry.intersectsCoordinate(point)) {
              intersectingPoints.push(feature);
              hasIntersection = true;
            }
          });

          // 如果存在交集，添加到结果中
          if (hasIntersection && !this.analysisResult.includes(item.name)) {
            this.analysisResult.push(item.name);
          }
        });
      });

      // 统一设置样式
      allPoints.forEach((feature) => {
        const style = intersectingPoints.includes(feature)
          ? highlightStyle
          : normalStyle;
        feature.setStyle(style);
      });
    },
    // 上传文件
    triggerFileInput() {
      document.getElementById("fileInput").click();
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const geojsonData = JSON.parse(e.target.result);
          this.loadGeojsonData(geojsonData);
        };
        reader.readAsText(file);
      }
      // 清空文件输入的值
      event.target.value = "";
    },
    loadGeojsonData(data) {
      let features = new GeoJSON().readFeatures(data, {
        featureProjection: "EPSG:3857",
      });
      this.drawLayer.getSource().addFeatures(features);
    },

    // clear
    clear() {
      this.analysisResult = new Set();
      this.isAnalysis = false;
      this.drawLayer.getSource().clear();
      this.bufferLayer.getSource().clear();
      // 重置所有点的样式
      this.layerStatus.forEach((item) => {
        item.layer.getSource().forEachFeature((feature) => {
          feature.setStyle(defaultStyle);
        });
      });
    },
    validateBufferDistance() {
      if (isNaN(this.bufferDistance)) {
        this.bufferDistance = 1;
      }
    },
  },
};
</script>

<style lang="less" scoped>
// 设置全屏宽度和高度
@full-screen-width: 100vw;
@full-screen-height: 100vh;
// 按钮背景颜色
@button-bg: #007bff;
// 按钮悬停时的背景颜色
@button-hover-bg: #0056b3;
// 控制面板背景颜色
@panel-bg: rgba(0, 32, 96, 0.8);
// 主蓝色
@primary-blue: #1890ff;
// 主蓝色悬停时的颜色
@primary-blue-hover: #40a9ff;
// 左侧面板宽度
@left-panel-width: 240px;

// 全屏容器样式
.full-screen {
  width: @full-screen-width;
  height: @full-screen-height;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  position: relative;
}

// 地图容器样式
.map-container {
  width: 100%;
  height: 100%;
}

// 按钮基础样式
.button-base() {
  position: absolute;
  top: 20px;
  margin-left: 10px;
  padding: 10px 20px;
  background-color: @button-bg;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: @button-hover-bg;
  }
}

// 动画按钮样式
.animate-button {
  .button-base();
  right: 20px;
}

// 图层切换按钮样式
.swap-button {
  .button-base();
  right: 20px;
}

// 绘制按钮样式
.draw-button {
  .button-base();
  right: 20px;
}

// 绘制多边形按钮样式
.draw-polygon {
  .button-base();
  right: 120px;
}

// 选择要素按钮样式
.select-feature {
  .button-base();
  right: 220px;
}

// 控制面板样式
.control-panel {
  position: absolute;
  top: 20px;
  left: 40px;
  background-color: @panel-bg;
  color: white;
  padding: 15px;
  border-radius: 5px;
  width: @left-panel-width;
  font-size: 14px;

  // 面板部分样式
  .panel-section {
    margin-bottom: 20px;
  }

  // 部分标题样式
  .section-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #fff;
  }

  // 图层项样式
  .layer-item {
    margin-bottom: 12px;
    display: flex;
    align-items: center;

    input[type="checkbox"] {
      margin-right: 8px;
      width: 16px;
      height: 16px;
    }
  }

  // 分析项样式
  .analysis-item {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &.button-group {
      gap: 10px;

      .upload-btn,
      .analysis-btn {
        flex: 1;
        margin-top: 0;
        width: auto;
      }
    }
    // 分析标签样式
    .analysis-label {
      flex: 1;
    }

    // 分析输入框样式
    .analysis-input {
      display: flex;
      align-items: center;
      background: white;
      border-radius: 3px;
      padding: 2px 5px;

      input {
        width: 40px;
        border: none;
        outline: none;
        text-align: right;
        padding: 2px;
      }

      .unit {
        color: #333;
        margin-left: 2px;
      }
    }
  }
}

// 主按钮样式
.button-primary() {
  background-color: @primary-blue;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    background-color: @primary-blue-hover;
  }
}

// 上传按钮样式
.upload-btn {
  .button-primary();
  padding: 4px 12px;
}

// 分析按钮样式
.analysis-btn {
  .button-primary();
  width: 100%;
  padding: 6px;
  margin-top: 10px;
}
.clear-btn {
  .button-primary();
  background-color: red;
  width: 100%;
  padding: 6px;
  margin-top: 10px;
  &:hover {
    background-color: #b30000;
  }
}

// 左下角面板样式
.left-bottom-panel {
  position: absolute;
  bottom: 40px;
  left: 40px;
  background-color: @panel-bg;
  color: white;
  padding: 15px;
  border-radius: 5px;
  width: @left-panel-width;
  font-size: 14px;
  .result-item {
    color: yellow;
    margin-bottom: 12px;
    height: 200px;
    border-radius: 5px;
    padding: 10px;
  }
}
</style>
