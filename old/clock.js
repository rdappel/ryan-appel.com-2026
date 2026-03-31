(function () {
  function pad2(num) {
    return String(num).padStart(2, "0");
  }

  function utcTimeText() {
    var now = new Date();
    var hh = pad2(now.getUTCHours());
    var mm = pad2(now.getUTCMinutes());
    var ss = pad2(now.getUTCSeconds());
    return hh + ":" + mm + ":" + ss + " UTC";
  }

  function updateUtcClocks() {
    var clocks = document.querySelectorAll(".bottombar-time");
    if (!clocks.length) {
      return;
    }

    var text = utcTimeText();
    clocks.forEach(function (el) {
      el.textContent = text;
    });
  }

  updateUtcClocks();
  setInterval(updateUtcClocks, 1000);
})();
