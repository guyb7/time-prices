(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

function loadGoogleAnalytics() {
  ga('create', 'UA-91732173-1', 'auto');
  ga('set', 'checkProtocolTask', function(){});
  ga('require', 'displayfeatures');
}

var bg = this;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === 'exec' && bg[request.payload.fn]) {
      bg[request.payload.fn].call(bg, ...request.payload.args);
    }
  });
