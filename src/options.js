document.addEventListener('DOMContentLoaded', function() {
  var checkbox = document.getElementById('enableInline');
  document.addEventListener('change', function() {
    options.set('enableInline', !!checkbox.checked);
    status('Saved.');
  });
  options.listen(function(opts) {
    checkbox.checked = opts.enableInline;
  });

  var statusTimeout;
  function status(text) {
    var status = document.getElementById('status');
    status.innerHTML = text;

    window.clearTimeout(statusTimeout);
    statusTimeout = setTimeout(function() {
      status.innerHTML = '';
    }, 2000);
  }
});