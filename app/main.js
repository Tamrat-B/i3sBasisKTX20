require([
  "esri/config",
  "esri/request",
  "esri/WebScene",
  "esri/layers/Layer",
  "esri/views/MapView",
  "esri/views/SceneView",
  "esri/views/support/waitForResources",
  "app/syncUtil",
  "esri/widgets/Expand",
  "esri/widgets/Daylight"
], function(
  config,
  esriRequest,
  WebScene,
  Layer,
  MapView,
  SceneView,
  waitForResources,
  syncUtil,
  Expand,
  Daylight
) {
  var params = {};
  var slide2Swapkey_1 = "scene.1";
  var slide2Swapkey_2 = "scene.2";

  var portal = params["portal"];
  if (portal) {
    config.portalUrl = portal;
  }

  var sceneView = document.getElementById("SceneView");
  var view = sceneView ?
    new SceneView({
      container: "SceneView",
      map: webscene,
      qualityProfile: "high",
      environment: {
        atmosphere: {
          quality: "high"
        },
        weather: {
          type: "cloudy",
          cloudCover: 0.4 // autocasts as new CloudyWeather({ cloudCover: 0.4 })
        },
        highlightOptions: {
          haloOpacity: 0
        }
      }
    }) :
    new MapView({
      container: "MapView",
      map: webscene,
      constraints: {
        snapToZoom: false
      }
    });
  view.when(() => {
    view.ui.add("performanceInfo", "bottom-left");
    updatePerformanceInfo();
  });
  const updatePerformanceInfo = () => {
    const performanceInfo = view.performanceInfo;
    updateMemoryTitle(
      performanceInfo.usedMemory,
      performanceInfo.totalMemory,
      performanceInfo.quality
    );
    updateTables(performanceInfo);
    setTimeout(updatePerformanceInfo, 1000);
  };

  function updateMemoryTitle(used, total, quality) {
    const title = document.getElementById("title");
    title.innerHTML = `Scene Memory (Used/Available) : ${getMB(used)}MB/${getMB(
          total
        )}MB  -  Quality: ${Math.round(100 * quality)} %`;
  }

  function updateTables(stats) {
    const tableMemoryContainer = document.getElementById("memory");
    tableMemoryContainer.innerHTML = `<tr>
          <th>Layer</th>
          <th>Memory used (MB)</th>
        </tr>`;
    for (layerInfo of stats.layerPerformanceInfos) {
      if (layerInfo.layer.type == "integrated-mesh" ||
        layerInfo.layer.type == "3dobject") {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${
            layerInfo.layer.title
          }</td><td class="center">${getMB(layerInfo.memory)}</td>`;
        tableMemoryContainer.appendChild(row);
      }
    }
    //uncomment next blocks for feature layer stat support
    //const tableCountContainer = document.getElementById("count");
    /* tableCountContainer.innerHTML = `<tr>
          <th>Layer - Features</th>
          <th>Displayed / Max<br>(count)</th>
          <th>Total<br>(count)</th>
        </tr>`;
    */

    /*
    for (layerInfo of stats.layerPerformanceInfos) {
      if (layerInfo.maximumNumberOfFeatures) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${layerInfo.layer.title}`;
        row.innerHTML += `<td class="center">${
              layerInfo.displayedNumberOfFeatures
                ? layerInfo.displayedNumberOfFeatures
                : "-"
            } / ${
              layerInfo.maximumNumberOfFeatures
                ? layerInfo.maximumNumberOfFeatures
                : "-"
            }</td>`;
        row.innerHTML += `<td class="center">${
              layerInfo.totalNumberOfFeatures
                ? layerInfo.totalNumberOfFeatures
                : "-"
            }</td>`;
        tableCountContainer.appendChild(row);
      }
    }
    */
  }

  function getMB(bytes) {
    const kilobyte = 1024;
    const megabyte = kilobyte * 1024;
    return Math.round(bytes / megabyte);
  }
  var url = params["url"];
  var animate = params["animate"];
  var stats = true; //params["stats"];
  /***********************************
   * Add UI elements to the view
   ***********************************/
  const weatherDropdown = document.getElementById("weatherDropdown");
  view.ui.add(weatherDropdown, "top-right");

  const daylightExpand = new Expand({
    view: view,
    content: new Daylight({
      view: view
    })
  });
  view.ui.add(daylightExpand, "bottom-right");

  /***********************************
   * Add functionality to the dropdown menu
   ***********************************/
  // Listen to changes in the dropdown
  weatherDropdown.addEventListener("calciteDropdownSelect", () => {
    // Read the id of the current selected item
    let selectedWeather = weatherDropdown.selectedItems[0].id;
    // Get the new weather instance and set it to the weather property of the view
    view.environment.weather = setWeather(selectedWeather);
  });

  // Returns instances of the different weather types
  function setWeather(selectedWeather) {
    switch (selectedWeather) {
      case "Sunny":
        return {
          type: "sunny", cloudCover: 0.8
        }; // autocasts as new SunnyWeather({ cloudCover: 0.8 })
      case "Cloudy":
        return {
          type: "cloudy", cloudCover: 0.4
        }; // autocasts as new CloudyWeather({ cloudCover: 0.4})
      case "Rainy":
        return {
          type: "rainy", cloudCover: 0.4
        }; // autocasts as new RainyWeather({ cloudCover: 0.4 })
      case "Foggy":
        return {
          type: "foggy", fogStrength: 0.6
        }; // autocasts as new FoggyWeather({ fogStrength: 0.6 })
    }
  }

  if (url) {
    view.map = new WebScene({
      basemap: "topo",
      ground: "world-elevation"
    });
    Layer.fromArcGISServerUrl({
      url: url
    }).then(function(layer) {
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
    var webscene = params["webscene"] || "e6373629940b4e299ac3d49a08bc6856";
    if (webscene.startsWith("http")) {
      esriRequest(webscene).then(function(json) {
        view.map = WebScene.fromJSON(json.data);
      });
    } else {
      view.map = new WebScene({
        portalItem: {
          id: webscene
        }
      });
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
      if (slide.title.text.split("_")[1] == slide2Swapkey_2) {
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
        slides.getItemAt(current).applyTo(view, {
          animate: false
        });
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
});
