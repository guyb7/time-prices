function saveSettings(e) {
  e.preventDefault();
  hideSaveSuccess();
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
    }, 3000);
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
document.getElementById('autoFill').addEventListener('click', autoFill);

loadSettings(function() {
  fillSettingsForm();
});
