var namespace = 'timeprices-';

function getAllElements(addedNodes) {
  var elements = [];
  for (var i = 0; i < addedNodes.length; i++) {
    elements.push(addedNodes[i]);
    if (addedNodes[i].nodeType === 1) {
      var children = addedNodes[i].querySelectorAll('*');
      for (var j = 0; j < children.length; j++) {
        elements.push(children[j]);
      }
    }
  }
  var results = [];
  var child;
  for(var i = 0; i < elements.length; i++) {
    if (elements[i].childNodes) {
      for(var j = 0; j < elements[i].childNodes.length; j++) {
        child = elements[i].childNodes[j];
        if((elements[i].hasChildNodes() && child.nodeType === 3)) {
          results.push(child);
        }
      }
    }
  }
  return results;
}

function workTimeText(usd) {
  var times = [];
  for (var key in settings) {
    times.push({ period: key.replace('usd_per_', ''), amount: usd / settings[key] })
  }
  times = times.filter(function(a) {
      return a.amount > 1;
    }).sort(function(a, b) {
      if (a.amount > b.amount) {
        return 1;
      }
      if (a.amount < b.amount) {
        return -1;
      }
      return 0;
    });
  if (times.length > 0) {
    var amount;
    if (times[0].amount > 10) {
      amount = Math.round(times[0].amount);
    } else {
      amount = Math.round(times[0].amount*2)/2;
    }
    return `${amount} ${times[0].period}${amount === 1 ? '' : 's'}`;
  }
  return 'Less than a minute';
}

var tooltip = null;

function createTooltip() {
  tooltip = document.getElementById(namespace + 'tooltip')
  if (tooltip !== null) {
    return;
  }
  tooltip = document.createElement('div');
  tooltip.id = namespace + 'tooltip';
  tooltip.innerHTML = `<span class="${namespace}content"></span>`;
  document.body.append(tooltip);
  ga('tooltip', 'ready', base_currency);
}

function showTooltip(ev) {
  var el = ev.target;
  // Ugly way to look for up to 2 parents (for Amazon)
  if (!el.hasAttribute(namespace + 'text')) {
    if (el.parentNode && el.parentNode.hasAttribute(namespace + 'text')) {
      el = el.parentNode;
    } else {
      if (el.parentNode && el.parentNode.parentNode && el.parentNode.parentNode.hasAttribute(namespace + 'text')) {
        el = el.parentNode.parentNode;
      } else {
        return;
      }
    }
  }
  var content_el = tooltip.querySelector('.' + namespace + 'content');
  content_el.innerHTML = workTimeText(el.getAttribute(namespace + 'text'));
  var cords = el.getBoundingClientRect();
  var content_cords = content_el.getBoundingClientRect();
  var top, left, ttClass;
  var padding = 20;
  if (cords.left < content_cords.width + 5) {
    // Right
    top = Math.round(cords.top + cords.height/2 - content_cords.height/2) + 'px';
    left = (Math.round(cords.right) + padding) + 'px'
    ttClass = namespace + 'right';
  } else if (cords.right > window.innerWidth - content_cords.width/2 - 5) {
    // Left
    top = Math.round(cords.top + cords.height/2 - content_cords.height/2) + 'px';
    left = Math.round(cords.left - content_cords.width - padding) + 'px'
    ttClass = namespace + 'left';
  } else if (cords.top < content_cords.height + padding + 5) {
    // Bottom
    top = (cords.bottom + padding) + 'px';
    left = Math.round(cords.left + cords.width/2 - content_cords.width/2) + 'px';
    ttClass = namespace + 'bottom';
  } else {
    // Top
    top = (cords.top - content_cords.height - padding) + 'px';
    left = Math.round(cords.left + cords.width/2 - content_cords.width/2) + 'px';
    ttClass = namespace + 'top';
  }
  tooltip.style.left = left;
  tooltip.style.top = top;
  tooltip.classList.remove(namespace + 'right');
  tooltip.classList.remove(namespace + 'left');
  tooltip.classList.remove(namespace + 'top');
  tooltip.classList.remove(namespace + 'bottom');
  tooltip.classList.add(ttClass);
  tooltip.classList.add('visible');
  ga('tooltip', 'show', base_currency);
}
function hideTooltip() {
  tooltip.classList.remove('visible');
}

var supported_currencies = [
  {
    currency: 'USD',
    sign: '$'
  }, {
    currency: 'GBP',
    sign: '£'
  }, {
    currency: 'JPY',
    sign: '¥'
  }, {
    currency: 'EUR',
    sign: '€'
  }
];
function getCurrencyFromSign(sign) {
  for (var i = 0; i < supported_currencies.length; i++) {
    if (supported_currencies[i].sign === sign) {
      return supported_currencies[i].currency;
    }
  }
  return 'USD';
}
var currencies_regex_str = '';
for (var i = 0; i < supported_currencies.length; i++) {
  currencies_regex_str += (supported_currencies[i].sign === '$' ? '\\' : '') + supported_currencies[i].sign;
}
var re_currencies = new RegExp('[' + currencies_regex_str + ']', 'g');
var re = new RegExp('([' + currencies_regex_str + '])\\s*([\\d,]+)[\\.\\s]?(\\d+)?([KMB]\\b)?', 'ig');
var re_function = function(original, sign, amount, cents, kilo) {
  amount = parseInt(amount.replace(/,/g, ''), 10);
  if (cents) {
    amount += parseInt(cents, 10) / Math.pow(10, cents.length);
  }
  if (kilo) {
    switch (kilo.toLowerCase()) {
      case 'k':
        amount *= 1000;
        break;
      case 'm':
        amount *= 1000000;
        break;
      case 'b':
        amount *= 1000000000;
        break;
    }
  }
  var amount_in_base_currency;
  if (getCurrencyFromSign(sign) === base_currency) {
    amount_in_base_currency = amount;
  } else {
    amount_in_base_currency = convertCurrency(amount, getCurrencyFromSign(sign))
  }
  return {
    usd: amount_in_base_currency,
    original: original
  };
};
var html_tag = 'span-tp';
function findPrices(addedNodes) {
  createTooltip();
  var nodes = getAllElements(addedNodes);
  for (var i = 0, len = nodes.length; i < len; i++) {
    var el = nodes[i];
    if (!el || !el.parentNode || el.parentNode.hasAttribute(namespace + 'text')) {
      continue;
    }
    if (el.nodeValue && el.nodeValue.match(re)) {
      var new_html = el.parentNode.textContent.replace(re, function(original, sign, amount, cents, kilo) {
        var matches = re_function(original, sign, amount, cents, kilo);
        return `<${html_tag} ${namespace}text="${matches.usd}" ${namespace}isnew="true">${matches.original}</${html_tag}>`;
      });
      el.parentNode.innerHTML = new_html;
    } else if (el.nodeValue && el.nodeValue.match(re_currencies)) {
      var parent = el.parentNode.parentNode;
      if (parent.childNodes.length < 10) {
        var matches = re.exec(el.parentNode.parentNode.textContent);
        if (matches) {
          var usd = re_function(...matches);
          parent.setAttribute(namespace + 'text', usd.usd);
          parent.setAttribute(namespace + 'isnew', 'true');
        }
      }
    }
  }
  removeDuplicates();
  attachHoverEvents();
  fixHoverBlockers();
}

function removeDuplicates() {
  // Leave only the most deep instances
  var elements = document.querySelectorAll('[' + namespace + 'text]');
  for(var i = 0; i < elements.length; i++) {
    var el = elements[i];
    var parent = el.parentNode;
    var max_depth = 50;
    while (max_depth > 0 && parent && parent !== document) {
      if (parent.hasAttribute(namespace + 'text')) {
        parent.removeAttribute(namespace + 'text');
        parent.removeAttribute(namespace + 'isnew');
      }
      parent = parent.parentNode;
      max_depth--;
    }
  }
}

function attachHoverEvents() {
  var elements = document.querySelectorAll('[' + namespace + 'isnew="true"]');
  for(var i = 0; i < elements.length; i++) {
    var el = elements[i];
    el.addEventListener('mouseover', function(ev) {
      showTooltip(ev);
    });
    el.addEventListener('mouseout', function(){ hideTooltip(); }, false);
    el.setAttribute(namespace + 'isnew', 'false');
  }
}

function fixHoverBlockers() {
  // Look for transparent elements over the prices that block mouseover events
  if (window.location.hostname.match(/\.walmart\.com$/)) {
    // Walmart
    var elements = document.querySelectorAll('.Tile-linkOverlay:not(.' + namespace + 'hoverfix)');
    for(var i = 0; i < elements.length; i++) {
      var el = elements[i];
      el.classList.add(namespace + 'hoverfix');
      el.addEventListener('mouseover', function(ev) {
        var instances = ev.target.parentNode.querySelectorAll('[' + namespace + 'isnew]');
        var mouseoverEvent = new CustomEvent('mouseover', {target: instances[0]});
        instances[0].dispatchEvent(mouseoverEvent);
      });
      el.addEventListener('mouseout', function(ev) {
        var instances = ev.target.parentNode.querySelectorAll('[' + namespace + 'isnew]');
        var mouseoutEvent = new CustomEvent('mouseout', {target: instances[0]});
        instances[0].dispatchEvent(mouseoutEvent);
      });
    }
  }
}

var addedNodes = [];
// Rapid DOM changes may be missed because of debounce. It's a tradeoff for not overloading the user's CPU on heavy DOM manipulating websites
var handleDomChanges = debounce(function() {
  findPrices(addedNodes);
  addedNodes = [];
}, 150);

function listenForDomChanges() {
  var target = document.querySelector('body');
  var observer = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var nodes = mutations[i].addedNodes;
      if (nodes.length > 0) {
        for (var j = 0; j < nodes.length; j++) {
          addedNodes.push(nodes[j]);
        }
      }
    }
    handleDomChanges();
  });
  var config = { childList: true, subtree: true };
  observer.observe(target, config);
}

// For the rare case that the DOM is done loading before the extension
function triggerDomChange() {
  addedNodes.push(document.body);
  handleDomChanges();
}

// https://api.fixer.io/latest?base=USD&symbols=GBP,EUR,JPY
var rates = { USD: 1, EUR: 0.94082, GBP: 0.80243, JPY: 113.51 };
var rates_last_check = null;

function convertCurrency(amount, to) {
  if (rates[to]) {
    return amount * (rates[base_currency] / rates[to]);
  } else {
    return null;
  }
}

function startTimeprices(cb) {
  loadAdvancedSettings(function() {
    var current_domain = window.location.hostname;
    if (settings_advanced.whitelist_domains.length > 0) {
      for (var i = 0; i < settings_advanced.whitelist_domains.length; i++) {
        var domain_regex = new RegExp(settings_advanced.whitelist_domains[i].replace('.', '\.') + '$', 'i');
        if (current_domain.match(domain_regex)) {
          cb();
          return;
        }
      }
    } else {
      for (var i = 0; i < settings_advanced.blacklist_domains.length; i++) {
        var domain_regex = new RegExp(settings_advanced.blacklist_domains[i].replace('.', '\.') + '$', 'i');
        if (current_domain.match(domain_regex)) {
          return;
        }
      }
      cb();
    }
  });
}

startTimeprices(function() {
  loadSettings(function() {
    if (settings_advanced.usage_statistics !== false) {
      loadGoogleAnalytics();
    }
    updateRates();
    listenForDomChanges();
    triggerDomChange();
    addSettingsChangeListener();
  });
});
