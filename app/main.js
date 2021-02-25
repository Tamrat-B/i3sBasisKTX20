require([
  "dojo/has",
  "esri/config",
  "esri/request",
  "esri/WebScene",
  "esri/core/watchUtils",
  "esri/layers/Layer",
  "esri/views/MapView",
  "esri/views/SceneView",
  "esri/views/support/waitForResources",
  "app/syncUtil"
], function(
  has,
  config,
  esriRequest,
  WebScene,
  watchUtils,
  Layer,
  MapView,
  SceneView,
  waitForResources,
  syncUtil
) {
  var params = {};
  var parts = window.parent.location.href.replace(
    /[?&]+([^=&]+)=([^&]*)/gi,
    function(m, key, value) {
      params[key] = value;
    }
  );

  has.add("disable-feature:single-idb-cache", 1);
  var slide2Swapkey_1 = "scene.1";
  var slide2Swapkey_2 = "scene.2";


  var portal = params["portal"];
  if (portal) {
    config.portalUrl = portal;
  }

  var sceneView = document.getElementById("SceneView");
  var view = sceneView
    ? new SceneView({ container: "SceneView", map: webscene })
    : new MapView({ container: "MapView", map: webscene, constraints: { snapToZoom: false } });
  var url = params["url"];
  var animate = params["animate"];
  var stats = params["stats"];

  if (url) {
    view.map = new WebScene({ basemap: "topo", ground: "world-elevation" });
    Layer.fromArcGISServerUrl({ url: url }).then(function(layer) {
      view.map.layers.add(layer);
      layer
        .when(function() {
          return layer.queryExtent();
        })
        .then(function(response) {
          view.goTo(response.extent);
        });
    });
  } else {
    var webscene = params["webscene"] || "e4a73fbc81aa402ea76dc49f14b25dcd";
    if (webscene.startsWith("http")) {
      esriRequest(webscene).then(function(json) {
        view.map = WebScene.fromJSON(json.data);
      });
    } else {
      view.map = new WebScene({ portalItem: { id: webscene } });
    }
  }

  // Clear the top-left corner to make place for the title
  view.ui.empty("top-left");

  // synchronize the two views
  syncUtil.connect(view);
  if (!animate) {
    syncUtil.syncView();
  }

  // The view must be ready (or resolved) before you can
  // access the properties of the WebScene
  view.when(function() {
    var slides = view.map.presentation.slides;
    var slidesDiv = document.getElementById("slides");
    var benchmarkDiv = document.getElementById("benchmark");
    var slideId2TitleMap = new Map();

    function addSlide(slide, time) {
      var div = slidesDiv || benchmarkDiv;
      if (!div) {
        return;
      }
      // Create a new <div> element for each slide and place the title of the slide in the element.
      var slideDiv = document.createElement("div");
      slideDiv.id = slide.id;
      slideDiv.classList.add("slide");

      if (time) {
        var textDiv = document.createElement("div");
        textDiv.innerHTML = time.toFixed(1) + "s";
        div.appendChild(textDiv);
      }

      // Create a new <img> element and place it inside the newly created <div>.
      // This will reference the thumbnail from the slide.
      if (slide.title.text.split("_")[1] ==  slide2Swapkey_2) {
        var img = new Image();
        img.src = slide.thumbnail.url;
        img.title = slide.title.text;
        slideDiv.appendChild(img);
        div.appendChild(slideDiv);
      }
      slideDiv.addEventListener("click", function() {
        slide.applyTo(view);
        let splitslidename = slide.title.text.split("_");
        let slideid2Sync2 = slide.id;
        let slide2Compare = splitslidename[0];
        if (splitslidename[1] == slide2Swapkey_2) {
          slide2Compare = slide2Compare + "_" + slide2Swapkey_1;
        }
         //else {
            //slide2Compare = slide2Compare + "_" + slide2Swapkey_2;
            //}
          for (let [key, value] of slideId2TitleMap) {
            console.log(`${key} - ${value}`);
           }
          slideid2Sync2 = slideId2TitleMap.get(slide2Compare);
          syncUtil.syncSlide(slideid2Sync2);
      });
    }

    function addSlideTitle2IDkey(slide, slideId2TitleMap) {
       slideId2TitleMap.set(slide.title.text, slide.id);
       return;
     }

    if (!!animate) {
      var current = -1;
      var start = window.performance.now();

      function nextSlide() {
        var time = (window.performance.now() - start) / 1000;
        if (current >= 0) {
          addSlide(slides.getItemAt(current), time);
        }

        ++current;
        if (current >= slides.length) {
          syncUtil.syncView();
          return;
        }

        start = window.performance.now();
        slides.getItemAt(current).applyTo(view, { animate: false });
        waitForResources(view, nextSlide);
      }

      syncUtil.syncStart(nextSlide);
      return;
    }

    slides.forEach(function(slide) {
      //if (slide.title.text.split("_")[1] ==  slide2Swapkey_2 &&
      //slideId2TitleMap.get(slide.title.text) == undefined) {
      addSlide(slide);
      //}
      addSlideTitle2IDkey(slide, slideId2TitleMap);
    });
  });

  function updateStats() {
    setTimeout(updateStats, 1000);
    var textContent = "";

    if (view.getStats) {
      var stats = view.getStats();
      var keys = Object.keys(stats);
      for (var i = 0; i < keys.length; ++i) {
        textContent += "<br/>" + keys[i] + ": " + stats[keys[i]];
      }
    } else {
      var rc = view.resourceController;
      var mc = rc.memoryController || rc._memoryController;
      if (mc && mc._cacheStorage) {
        textContent =
          "Memory: " +
          (mc._memoryUsed * mc._maxMemory).toFixed() +
          " of " +
          mc._maxMemory.toFixed() +
          "MB<br>" +
          "Cache: " +
          (mc._cacheStorage._size / 1048576).toFixed() +
          " of " +
          (mc._cacheStorage._maxSize / 1048576).toFixed() +
          "MB<br>";
      }
    }
    document.getElementById("stats").innerHTML = textContent;
  }

  !!stats &&
    sceneView &&
    watchUtils.whenTrueOnce(view, "ready").then(function() {
      setTimeout(updateStats, 1);
    });
});
