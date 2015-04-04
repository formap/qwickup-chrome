var options = new Storage({
  enableInline : false
});

function Storage(data) {
  var listeners = [];
  function reload() {
    chrome.storage.sync.get(data, function(update) {
      data = update;
      listeners.forEach(function(fn) {
        fn(data);
      });
    });
  }
  chrome.storage.onChanged.addListener(reload);
  reload();
  this.get = function get(a) {
    if (typeof a === 'undefined') {
      return data;
    } else {
      return data[a];
    }
  };
  this.set = function set(a, b) {
    if (typeof a === 'object') {
      chrome.storage.sync.set(a, reload);
    } else if (typeof a === 'string') {
      var o = {};
      o[a] = b;
      return set(o);
    }
  };
  this.listen = function listen(a) {
    listeners.push(a);
  };
}
