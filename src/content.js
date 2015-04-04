injectCSS('.qwickup_inline_button,.qwickup_hide_on_ext{display:none;}');

document.addEventListener('focus', touch, false);
document.addEventListener('mousedown', touch, false);
document.addEventListener('keydown', touch, false);
var timestamp = 0;
function touch() {
  timestamp = Date.now() + '';
}
function capture() {
  return {
    query : getSelectionText(),
    timestamp : timestamp
  };
};

var inlineIcon = new InlineIcon(function(ev) {
  lookupOpen();
}, chrome.extension.getURL('icon16.png'));

document.addEventListener('keydown', onkey);
document.addEventListener('keyup', onkey);
function onkey(e) {
  if (e.altKey || e.keyCode == 27) {
    inlineIcon.hide();
  }
}

document.addEventListener('mouseup', function(ev) {
  if (!options.get('enableInline')) {
    return;
  }

  if (getSelectionText()) {
    inlineIcon.show(getSelectionXY(ev));
  } else {
    inlineIcon.hide();
  }
});

var i18n = [ 'reload_page' ].reduce(function(map, name) {
  map[name] = chrome.i18n.getMessage(name);
  return map;
}, {});

function lookupOpen(query) {
  query = query || getSelectionText();
  try {
    chrome.extension.sendMessage({
      type : 'lookup',
      lookup : query
    }, function(response) {
    });
  } catch (e) {
    alert(i18n['reload_page']);
  }
};

function getSelectionXY(ev) {
  var xy = null;

  if (ev && (ev.pageX || ev.pageY)) {
    xy = {
      x : ev.pageX + 10,
      y : ev.pageY + 10
    };
  }

  if (document.activeElement
      && /(textarea|input)/i.test(document.activeElement.tagName)) {
    return xy;
  }

  var selection = window.getSelection();
  if (selection) {
    var range = selection.getRangeAt(0);
    var rect = range.getBoundingClientRect();
    return {
      x : rect.right + window.pageXOffset,
      y : rect.bottom + window.pageYOffset
    };
  }

  return xy;
}

function getSelectionText() {
  var selection = window.getSelection();
  return selection ? selection.toString().trim() : '';
}

function injectCSS(styles, parent) {
  var elem = document.createElement('style');
  elem.type = 'text/css';
  if (elem.styleSheet) {
    elem.styleSheet.cssText = styles;
  } else {
    elem.appendChild(document.createTextNode(styles));
  }
  parent = parent || document.head || document.body || document;
  parent && parent.appendChild(elem);
}

function resetElem(el) {
  el.style.position = 'relative';
  el.style.border = '0 none';
  el.style.padding = '0';
  el.style.margin = '0';
  el.style.background = 'none trasparent';
  el.style.verticalAlign = 'baseline';
  el.style.lineHeight = '1';
  return el;
}

function InlineIcon(click, url) {
  var self = this;
  var icon = resetElem(document.createElement('span'));
  icon.className = 'qwickup_outline_button';
  icon.style.display = 'none';
  icon.style.position = 'absolute';
  icon.style.zIndex = 99999;

  var link = resetElem(document.createElement('a'));
  link.href = '#';
  link.title = 'QwickUp';
  link.addEventListener('click', function(ev) {
    ev.preventDefault();
    self.hide();
    click(ev);
  });
  icon.appendChild(link);

  var img = resetElem(document.createElement('img'));
  img.src = url;
  link.appendChild(img);

  var timeout;

  this.show = function(xy) {
    icon.style.display = '';
    icon.style.top = xy.y + 'px';
    icon.style.left = xy.x + 'px';
    document.body.appendChild(icon);

    window.clearTimeout(timeout);
    timeout = window.setTimeout(function() {
      self.hide();
    }, 2500);
  };
  this.hide = function() {
    icon.style.display = 'none';
    icon.parentNode && icon.parentNode.removeChild(icon);
  };
}
