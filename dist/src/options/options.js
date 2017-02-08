function saveSettings(e) {
  e.preventDefault();
  hideSaveSuccess();
  autoFill();
  inputsIterator(function(el) {
    var name = el.getAttribute('name');
    if (settings[name] !== undefined) {
      var value = parseInt(el.value.replace(/\..*/g, '').replace(/[^\d]/g, ''), 10);
      el.value = isNaN(value) ? '' : value;
      settings[name] = value;
    }
  });
  chrome.storage.sync.set({'settings': settings}, function() {
    showSaveSuccess();
    window.setTimeout(function() {
      hideSaveSuccess();
    }, 5000);
  });
  return false;
}

function showSaveSuccess() {
  document.getElementById('settings-save-success').classList.remove('hidden');
}
function hideSaveSuccess() {
  document.getElementById('settings-save-success').classList.add('hidden');
}

function fillSettingsForm() {
  inputsIterator(function(el) {
    var name = el.getAttribute('name');
    if (settings[name] !== undefined) {
      el.value = settings[name];
    }
  });
}

function timeSince(seconds) {
  var interval = Math.floor(seconds / 31536000);
  if (interval > 1) {
    return interval + ' years';
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + ' months';
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + ' days';
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + ' hours';
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + ' minutes';
  }
  return Math.floor(seconds) + ' seconds';
}

function fillRatesData() {
  var now_ts = Math.floor(Date.now() / 1000);
  var lastcheck_value;
  if (isNaN(rates_last_check)) {
    lastcheck_value = 'Never';
  } else if (now_ts - parseInt(rates_last_check, 10) < 10) {
    lastcheck_value = 'Just now';
  } else {
    lastcheck_value = timeSince(now_ts - parseInt(rates_last_check, 10)) + ' ago';
  }
  document.getElementById('currencies-lastcheck-value').innerHTML = lastcheck_value;
  document.getElementById('rate-eur').innerHTML = '$' + rates.EUR;
  document.getElementById('rate-gbp').innerHTML = '$' + rates.GBP;
  document.getElementById('rate-jpy').innerHTML = '$' + rates.JPY;
  document.getElementById('currencies-rates').classList.remove('hidden');
  document.getElementById('currencies-lastcheck').classList.remove('hidden');
}

function inputsIterator(cb) {
  var inputs = form.querySelectorAll('[name]');
  for (var i = 0; i < inputs.length; i++) {
    cb(inputs[i], i);
  }
}

function autoFill() {
  var partialSettings = {};
  inputsIterator(function(el) {
    var name = el.getAttribute('name');
    var value = parseInt(el.value.replace(/\..*/g, '').replace(/[^\d]/g, ''), 10);
    partialSettings[name] = isNaN(value) ? null : value;
  });
  getAutoSettings(partialSettings, function(autoSettings) {
    inputsIterator(function(el) {
      var name = el.getAttribute('name');
      if (autoSettings[name] !== undefined) {
        el.value = Math.round(autoSettings[name]);
      }
    });
  });
}

function loadProfile() {
  var chosenProfile = document.getElementById('profiles').value;
  if (profiles[chosenProfile] !== undefined) {
    settings = profiles[chosenProfile];
    fillSettingsForm();
  }
}

var form = document.getElementById('settings-form');
form.addEventListener('submit', saveSettings);
document.getElementById('profiles').addEventListener('change', loadProfile);
document.getElementById('currencies-force-update').addEventListener('click', function() {
  updateRates(function() {
    fillRatesData();
  }, true);
});

loadSettings(function() {
  fillSettingsForm();
});
updateRates(function() {
  fillRatesData();
});
