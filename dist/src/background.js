(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

function loadGoogleAnalytics() {
  ga('create', 'UA-91732173-1', 'auto');
  ga('set', 'checkProtocolTask', function(){});
  ga('require', 'displayfeatures');
}

var rates_json_url = 'https://api.fixer.io/latest?base=USD&symbols=GBP,EUR,JPY';
function loadExchangeRates(cb) {
  fetchJSONFile(rates_json_url, function(data) {
    if (data.rates && Object.keys(data.rates).length > 0) {
      data.rates.USD = 1;
      var new_rates = {
        last_check: Math.floor(Date.now() / 1000),
        rates: data.rates
      };
      chrome.storage.sync.set({ 'rates': new_rates });
    }
  });
}

function fetchJSONFile(path, callback) {
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function() {
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) {
        var data = JSON.parse(httpRequest.responseText);
        if (callback) callback(data);
      }
    }
  };
  httpRequest.open('GET', path);
  httpRequest.send(); 
}

var bg = this;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === 'exec' && bg[request.payload.fn]) {
      bg[request.payload.fn].call(bg, ...request.payload.args);
    }
  });
