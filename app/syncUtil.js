// small utility for synchronizing tabs through a broadcast channel
// based on code from sample: https://developers.arcgis.com/javascript/latest/sample-code/sandbox/index.html?sample=views-synchronize

define(["esri/Viewpoint", "esri/core/watchUtils"], function(Viewpoint, watchUtils) {
  var view;
  var channel;
  var loadedCB = false;
  var peerLoaded = false;

  return {
    connect: function(view_) {
      view = view_;
      channel = new BroadcastChannel("aBee.view.sync");

      channel.onmessage = function(newValue) {
        if (newValue.data.slide) {
          view.map.presentation.slides.forEach(function(slide) {
            if (slide.id === newValue.data.slide) {
              var slideNoViewpoint = slide.clone();
              slideNoViewpoint.viewpoint = null;
              slideNoViewpoint.applyTo(view, { ignoreViewpoint: true });
            }
          });
        } else if (newValue.data.loaded) {
          if (loadedCB) {
            loadedCB();
            loadedCB = false;
          } else {
            peerLoaded = true;
          }
        } else {
          view.viewpoint = Viewpoint.fromJSON(newValue.data);
        }
      };
    },

    syncView: function() {
      var viewpointWatchHandle;
      var scheduleId;

      function clear() {
        viewpointWatchHandle && viewpointWatchHandle.remove();
        viewStationaryHandle && viewStationaryHandle.remove();
        scheduleId && clearTimeout(scheduleId);
        viewpointWatchHandle = viewStationaryHandle = scheduleId = null;
      }

      view.watch("interacting,animation", function(newValue) {
        if (!newValue) {
          return;
        }

        if (viewpointWatchHandle || scheduleId) {
          return;
        }

        scheduleId = setTimeout(function() {
          scheduleId = null;
          viewpointWatchHandle = view.watch("viewpoint", function(newValue) {
            channel.postMessage(newValue.toJSON());
          });
        }, 0);

        viewStationaryHandle = watchUtils.whenTrue(view, "stationary", clear);
      });
    },

    syncSlide: function(slideId) {
      channel.postMessage({ slide: slideId });
    },

    syncStart: function(callback) {
      watchUtils.whenFalseOnce(view, "updating", function() {
        channel.postMessage({ loaded: true });
        if (peerLoaded) {
          callback();
          peerLoaded = false;
        } else {
          loadedCB = callback;
        }
      });
    }
  };
});
