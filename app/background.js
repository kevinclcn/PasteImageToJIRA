var dataURL = [];

function sendRequest(r) {
    chrome.runtime.sendMessage(r);
}

function sendMessageToTab(tabid, request) {
  chrome.tabs.sendMessage(tabid, request);
}

function checkContentScript() {
    chrome.tabs.executeScript({
        file: 'app/isload.js'
    });
}

function getSelectedTab(func) {
  chrome.tabs.query({active:true}, function(tabs) {
    var tab = tabs[0];
    if (func != null)
        func(tab);
  });
}

// Listen for a click on the camera icon.  On that click, take a screenshot.
chrome.browserAction.onClicked.addListener(function(tab) {
  sendRequest({action: 'selected'});
});


var editArea;
var editTab;
var editImageURL;
chrome.runtime.onMessage.addListener(function(message) {
  switch(message.action) {
    case 'selected':
      checkContentScript();
      break;
    case 'insert_script':
      chrome.tabs.query({active:true}, function(tabs) {
        var tab = tabs[0];
        var tabid = tab.id;
        chrome.tabs.executeScript(tabid, {
          file: 'lib/jquery-2.1.1.min.js'
        });
        chrome.tabs.executeScript(tabid, {
          file: 'lib/dragresize.js'
        });
        chrome.tabs.insertCSS(tabid, {
          file: 'stylesheets/selected.css'
        });
        chrome.tabs.executeScript(tabid, {
          file: 'app/capture.js'
        }, function() {
          chrome.tabs.sendMessage(tabid, {
            action: 'init_selected_capture'
          });
        });
      });
      break;
    case 'script_running':
      chrome.tabs.query({active:true}, function(tabs) {
        var tab = tabs[0];
        var tabid = tab.id;
        chrome.tabs.executeScript(tabid, {
          file: 'app/capture.js'
        }, function() {
          chrome.tabs.sendMessage(tabid, {
            action: 'init_selected_capture'
          });
        });
      });
      break;
    case 'capture_selected_done':
      centerH = message.data.h;
      centerW = message.data.w;
      centerOffX = message.data.x;
      centerOffY = message.data.y;
      var selectedArea = {
        "centerH": centerH,
        "centerW": centerW,
        "centerOffX": centerOffX,
        "centerOffY": centerOffY
      };

      captureVisible(selectedArea);
      break;
    case 'scroll_next_done':
      break;
    case 'exit':
      getSelectedTab(closeTab);
      break;
    case 'ready':
      var image = document.getElementById('test_image');

      function imageOnload() {
          sendMessageToTab(editTab.id, {
              menuType: "selected",
              type: "visible",
              data: [editImageURL],
              centerW: editArea.centerW,
              centerH: editArea.centerH,
              w: image.width,
              h: image.height,
              centerOffX: editArea.centerOffX,
              centerOffY: editArea.centerOffY
          });
          
          image.src = '';
          image.removeEventListener('onload', imageOnload, false);
          image = null;
      }
      image.onload = imageOnload;
      console.log(editImageURL);
      image.src = editImageURL;
      break;
  }
});

function closeTab(tab) {
  chrome.tabs.remove(tab.id);
}

function captureVisible(selectedArea) {
    function captureVisibleTab(tab) {
        chrome.tabs.captureVisibleTab(null, {
            format: 'png'
        }, function(imageURL) {
            dataURL.push(imageURL);
            console.log('image is:', imageURL);
            newTab(tab, selectedArea, imageURL);
        });
    }

    getSelectedTab(captureVisibleTab);
}

function newTab(tab, selectedArea, imageURL) {
    sendMessageToTab(tab.id, {
      action: 'destroy_selected'
    });

    chrome.tabs.create({
        'url': 'edit.html'
    }, function(t) {
        editTab = t;
        editArea = selectedArea;
        editImageURL = imageURL;
    });   
}
