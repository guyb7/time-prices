function saveSettings(e) {
  e.preventDefault();
  hideEl('settings-save-success');
  autoFill();
  inputsIterator(function(el) {
    var name = el.getAttribute('name');
    if (settings[name] !== undefined) {
      var value = parseInt(el.value.replace(/\..*/g, '').replace(/[^\d]/g, ''), 10);
      el.value = isNaN(value) ? '' : value;
      settings[name] = value;
    }
  });
  chrome.storage.sync.set({ 'base_currency': document.getElementById('base_currency').value }, function() {
    chrome.storage.sync.set({'settings': settings}, function() {
      showEl('settings-save-success');
      window.setTimeout(function() {
        hideEl('settings-save-success');
      }, 5000);
    });
  });
  ga('settings', 'saveSettings');
  return false;
}

function fillSettingsForm() {
  inputsIterator(function(el) {
    var name = el.getAttribute('name');
    if (settings[name] !== undefined) {
      el.value = settings[name];
    }
  });
  document.getElementById('base_currency').value = base_currency;
}

function removeEmptyElements(arr) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].length === 0) {
      arr.splice(i, 1);
      i--;
    }
  }
  return arr;
}

function saveAdvancedSettings(e) {
  e.preventDefault();
  hideEl('settings-advanced-save-success');
  var blacklist = removeEmptyElements(document.getElementById('domains-blacklist').value.split("\n"));
  var whitelist = removeEmptyElements(document.getElementById('domains-whitelist').value.split("\n"));
  var settings_advanced = {
    blacklist_domains: blacklist,
    whitelist_domains: whitelist,
    usage_statistics: document.getElementById('usage-statistics').checked
  };
  chrome.storage.sync.set({'settings_advanced': settings_advanced}, function() {
    showEl('settings-advanced-save-success');
    window.setTimeout(function() {
      hideEl('settings-advanced-save-success');
    }, 5000);
  });
  ga('settings', 'saveAdvancedSettings');
  return false;
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
    if (name === 'base_currency') {
      return;
    }
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
    document.getElementById('base_currency').value = 'USD';
  }
  ga('settings', 'loadProfile', chosenProfile);
}

var tab_buttons = document.querySelectorAll('[tab-target]');
for (var i = 0; i < tab_buttons.length; i++) {
  tab_buttons[i].addEventListener('click', function() {
    changeTab(this.getAttribute('tab-target'));
  });
}
function changeTab(tab) {
  var tabs = document.querySelectorAll('[tab-id]');
  for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].getAttribute('tab-id') === tab) {
      tabs[i].classList.remove('hidden');
    } else {
      tabs[i].classList.add('hidden');
    }
  }
  for (var i = 0; i < tab_buttons.length; i++) {
    if (tab_buttons[i].getAttribute('tab-target') === tab) {
      tab_buttons[i].classList.add('active');
    } else {
      tab_buttons[i].classList.remove('active');
    }
  }
  ga('settings', 'changeTab', tab);
}

var form = document.getElementById('settings-form');
form.addEventListener('submit', saveSettings);
document.getElementById('profiles').addEventListener('change', loadProfile);
document.getElementById('currencies-force-update').addEventListener('click', function() {
  updateRates(function() {
    fillRatesData();
  }, true);
  ga('settings', 'currencies-force-update');
});

loadSettings(function() {
  fillSettingsForm();
});
updateRates(function() {
  fillRatesData();
});
loadAdvancedSettings(function() {
  document.getElementById('domains-blacklist').value = settings_advanced.blacklist_domains.join("\n");
  document.getElementById('domains-whitelist').value = settings_advanced.whitelist_domains.join("\n");
  document.getElementById('usage-statistics').checked = settings_advanced.usage_statistics;
});
document.getElementById('advanced-settings-form').addEventListener('submit', saveAdvancedSettings);
document.getElementById('usage-statistics').addEventListener('change', function() {
  var thankyou = this.parentNode.querySelector('.success-icon');
  if (this.checked === true) {
    thankyou.classList.remove('hidden');
  } else {
    thankyou.classList.add('hidden');
  }
});
ga('settings', 'ready');
