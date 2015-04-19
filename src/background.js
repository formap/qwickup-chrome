var lookup_url = 'http://qwickup.com/';

chrome.contextMenus.create({
  'title' : chrome.i18n.getMessage('open_tab'),
  'contexts' : [ 'all' ],
  'onclick' : function(info, tab) {
    lookupOpen(info.selectionText, 'tab');
  }
});

false && chrome.contextMenus.create({
  'title' : chrome.i18n.getMessage('open_popup'),
  'contexts' : [ 'all' ],
  'onclick' : function(info, tab) {
    lookupOpen(info.selectionText, 'popup');
  }
});

chrome.contextMenus.create({
  'contexts' : [ 'all' ],
  'type' : 'separator'
});

var ctxInlineCheckbox = chrome.contextMenus.create({
  'title' : chrome.i18n.getMessage('enable_inline'),
  'type' : 'checkbox',
  'contexts' : [ 'all' ],
  'checked' : options.get('enableInline'),
  'onclick' : function(info, tab) {
    options.set('enableInline', !!info.checked);
  }
});

options.listen(function(opts) {
  chrome.contextMenus.update(ctxInlineCheckbox, {
    'type' : 'checkbox',
    'checked' : opts.enableInline
  });
});

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type === 'lookup') {
    lookupOpen(msg.query);
  }
  sendResponse(true);
});

chrome.browserAction.onClicked.addListener(function(tab) {
  // only executeScript can go into iframes?
  chrome.tabs.executeScript(tab.id, {
    code : 'typeof capture === "function" && capture();',
    allFrames : true
  }, function(results) {
    var query = null, timestamp = 0;
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      if (result && result.timestamp > timestamp) {
        query = result.query;
      }
    }
    if (query === null) {
      alert(chrome.i18n.getMessage('reload_page'));
    } else {
      lookupOpen(query);
    }
  });
});

function lookupOpen(query, mode) {
  query = (query || '').trim();
  mode = /^(tab|popup)$/.test(mode) ? mode : 'tab';
  if (mode == 'tab') {
    openTab(query);
  } else if (mode == 'popup') {
    openPopup(query);
  }
}

function openTab(query) {
  chrome.windows.getCurrent(function(win) {
    chrome.tabs.getSelected(win.id, function(tab) {
      // same tab
      if (isQwickup(tab.url)) {
        chrome.tabs.update(tab.id, {
          url : makeUrl(query, tab.url),
          selected : true
        });
        return;
      }
      // existing tab
      chrome.tabs.getAllInWindow(win.id, function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
          var tab = tabs[i];
          if (isQwickup(tab.url)) {
            chrome.tabs.update(tab.id, {
              url : makeUrl(query, tab.url),
              selected : true
            });
            return;
          }
        }
        // new tab
        chrome.tabs.create({
          url : makeUrl(query)
        }, function(tab) {
        });
      });

      // chrome.tabs.query({
      // currentWindow : true,
      // url : '*://*.qwickup.com/*'
      // }, function(tabs) {
      // });
    });
  });
}

var popup_win;

chrome.windows.onRemoved.addListener(function(windowId) {
  if (popup_win && popup_win.id == windowId) {
    popup_win = null;
  }
});

// chrome.tabs.onRemoved.addListener(function(tabId) {
// if (popup_tab && popup_tab.id == tabId) {
// popup_tab = null;
// }
// });

function openPopup(query) {
  if (!popup_win) {
    var x = (screen.width / 4) | 0;
    var y = (screen.height / 4) | 0;
    chrome.windows.create({
      url : makeUrl(query),
      left : x,
      top : y,
      width : x * 2,
      height : y * 2,
      focused : true,
      type : 'popup'
    }, function(win) {
      popup_win = win;
      chrome.tabs.getSelected(popup_win.id, function(tab) {
        // popup_tab = tab;
        // if (!options.get('enableInline')) {
        // chrome.tabs.executeScript(tab.id, {
        // file : 'popup.js',
        // allFrames : false
        // });
        // }
      });
    });
  } else {
    // left : x, top : y, width : x * 2, height : y * 2,
    chrome.windows.update(popup_win.id, {
      focused : true
    });

    chrome.tabs.getSelected(popup_win.id, function(tab) {
      // popup_tab = tab;
      chrome.tabs.update(tab.id, {
        url : makeUrl(query, tab.url),
        selected : true
      });
    });
  }
}

function makeUrl(query, url) {
  query = query || '';
  if (isQwickup(url)) {
    var split = url.split('#', 2);
    url = split[0] + '#';
    if (split.length > 1) {
      split = split[1].split('/', 2);
      if (split.length > 1) {
        url += split[0] + '/';
      }
    }
    url += query;
  } else {
    url = lookup_url + '?ap=ch'
        + (query ? '&query=' + encodeURIComponent(query) : '');
  }
  return url;
}

function isQwickup(url) {
  return url
      && (url === lookup_url || startsWith(url, lookup_url + '?') || startsWith(
          url, lookup_url + '#'));
}

function startsWith(str, prefix) {
  return str && (str + '').substr(0, prefix.length) === prefix;
}