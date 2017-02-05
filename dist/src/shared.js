var settings;
var profiles = {
  empty: {
    usd_per_minute: '',
    usd_per_hour: '',
    usd_per_day: '',
    usd_per_week: '',
    usd_per_month: '',
    usd_per_year: ''
  },
  default: {
    usd_per_minute: 0.333333,
    usd_per_hour: 20,
    usd_per_day: 160,
    usd_per_week: 800,
    usd_per_month: 3200,
    usd_per_year: 38400
  },
  trump: {
    usd_per_minute: 358.333333,
    usd_per_hour: 21500,
    usd_per_day: 172000,
    usd_per_week: 1210000,
    usd_per_month: 5250000,
    usd_per_year: 63000000
  },
  engineer: {
    usd_per_minute: 0.8,
    usd_per_hour: 48,
    usd_per_day: 385,
    usd_per_week: 1923,
    usd_per_month: 8333,
    usd_per_year: 100000
  },
  barista: {
    usd_per_minute: 0.184,
    usd_per_hour: 11,
    usd_per_day: 88,
    usd_per_week: 442,
    usd_per_month: 1916,
    usd_per_year: 23000
  },
  office_manager: {
    usd_per_minute: 0.4,
    usd_per_hour: 24,
    usd_per_day: 192,
    usd_per_week: 962,
    usd_per_month: 4167,
    usd_per_year: 50000
  }
};

function loadSettings(cb) {
  chrome.storage.sync.get('settings', function(storage) {
    if (Object.keys(storage).length > 0) {
      getAutoSettings(storage.settings, function(autoSettings) {
        settings = autoSettings;
        if (cb) {
          cb(settings);
        }
      });
    } else {
      settings = profiles.default;
      cb(settings);
    }
  });
}

function reloadSettings(newSettings, oldSettings) {
  settings = newSettings;
}

function reloadRates(newSettings, oldSettings) {
  rates = newSettings.rates;
}

function getAutoSettings(partialSettings, cb) {
  for (var k in partialSettings) {
    if (partialSettings[k] === 0 || partialSettings[k] === '') {
      partialSettings[k] = null;
    }
  }
  var autoSettings = Object.assign({
    usd_per_year: null,
    usd_per_month: null,
    usd_per_week: null,
    usd_per_day: null,
    usd_per_hour: null
  }, partialSettings);
  var countNullValues = function() {
    var n = 0;
    for (var k in autoSettings) {
      if (autoSettings[k] === null || autoSettings[k] === 0) {
        n++;
      }
    }
    return n;
  };
  if (countNullValues() >= Object.keys(autoSettings).length) {
    cb(profiles.default);
    return;
  }
  var max_iterations = 100;
  while (countNullValues() > 0 && max_iterations > 0) {
    max_iterations--;
    if (autoSettings.usd_per_year === null && autoSettings.usd_per_month !== null) {
      autoSettings.usd_per_year = autoSettings.usd_per_month * 12;
    }
    if (autoSettings.usd_per_year === null && autoSettings.usd_per_week !== null) {
      autoSettings.usd_per_year = autoSettings.usd_per_week * 52;
    }
    if (autoSettings.usd_per_month === null && autoSettings.usd_per_year !== null) {
      autoSettings.usd_per_month = autoSettings.usd_per_year / 12;
    }
    if (autoSettings.usd_per_month === null && autoSettings.usd_per_week !== null) {
      autoSettings.usd_per_month = autoSettings.usd_per_week * 4.333333;
    }
    if (autoSettings.usd_per_week === null && autoSettings.usd_per_year !== null) {
      autoSettings.usd_per_week = autoSettings.usd_per_year / 52;
    }
    if (autoSettings.usd_per_week === null && autoSettings.usd_per_month !== null) {
      autoSettings.usd_per_week = autoSettings.usd_per_month / 4.333333;
    }
    if (autoSettings.usd_per_week === null && autoSettings.usd_per_day !== null) {
      autoSettings.usd_per_week = autoSettings.usd_per_day * 5;
    }
    if (autoSettings.usd_per_day === null && autoSettings.usd_per_week !== null) {
      autoSettings.usd_per_day = autoSettings.usd_per_week / 5;
    }
    if (autoSettings.usd_per_day === null && autoSettings.usd_per_hour !== null) {
      autoSettings.usd_per_day = autoSettings.usd_per_hour * 8;
    }
    if (autoSettings.usd_per_hour === null && autoSettings.usd_per_day !== null) {
      autoSettings.usd_per_hour = autoSettings.usd_per_day / 8;
    }
  }
  for (var k in autoSettings) {
    autoSettings[k] = Math.max(Math.round(autoSettings[k]), 1);
  }
  autoSettings.usd_per_minute = autoSettings.usd_per_hour / 60;
  cb(autoSettings);
}

var rates_json_url = 'https://raw.githubusercontent.com/guyb7/time-prices/master/static/rates.json';
function updateRates() {
  chrome.storage.sync.get('rates', function(storage) {
    if (Object.keys(storage).length === 0 || !storage.rates || !storage.rates.rates || !storage.rates.last_check || (Math.floor(Date.now() / 1000) - storage.rates.last_check > 86400)) {
      fetchJSONFile(rates_json_url, function(data){
        if (data.rates && Object.keys(data.rates).length > 0) {
          rates = data.rates;
          var new_rates = {
            last_check: Math.floor(Date.now() / 1000),
            rates: data.rates
          };
          chrome.storage.sync.set({ 'rates': new_rates });
        }
      });
    } else if (storage.rates && storage.rates.rates) {
      rates = storage.rates.rates;
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

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

function addSettingsChangeListener() {
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.settings !== undefined) {
      reloadSettings(changes.settings.newValue, changes.settings.oldValue);
    }
    if (changes.rates !== undefined) {
      reloadRates(changes.rates.newValue, changes.rates.oldValue);
    }
  });
}
