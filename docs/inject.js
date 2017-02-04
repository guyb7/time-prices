var namespace = 'timeprices-';

function getAllElements() {
  var elements = document.querySelectorAll('body, body *');
  var results = [];
  var child;
  for(var i = 0; i < elements.length; i++) {
    child = elements[i].childNodes[0];
    if((elements[i].hasChildNodes() && child.nodeType === 3)) {
      results.push(child);
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
  if (tooltip !== null) {
    return;
  }
  tooltip = document.createElement('div');
  tooltip.id = namespace + 'tooltip';
  tooltip.innerHTML = `<span class="${namespace}content"></span>`;
  document.body.append(tooltip);
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
  content_el.innerHTML = el.getAttribute(namespace + 'text');
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
}
function hideTooltip() {
  tooltip.classList.remove('visible');
}

var re_currencies = /[\$(USD)]/g;
var re = /(USD?\s*)?(\$)\s*([\d,]+)\.?(\d+)?([KMB]\b)?/ig;
var re_function = function(original, us, currency, usd, cents, kilo) {
  usd = parseInt(usd.replace(/,/g, ''), 10);
  if (cents) {
    usd += parseInt(cents, 10) / Math.pow(10, cents.length);
  }
  if (kilo) {
    switch (kilo.toLowerCase()) {
      case 'k':
        usd *= 1000;
        break;
      case 'm':
        usd *= 1000000;
        break;
      case 'b':
        usd *= 1000000000;
        break;
    }
  }
  return { usd: usd, original: original };
};
var re_function_html = function(original, us, currency, usd, cents, kilo) {
  var usd = re_function(original, us, currency, usd, cents, kilo);
  return `<span ${namespace}text="${workTimeText(usd.usd)}" ${namespace}isnew="true">${usd.original}</span>`;
};
function findPrices() {
  createTooltip();
  var textnodes = getAllElements();
  for (var i = 0, len = textnodes.length; i < len; i++) {
    var el = textnodes[i];
    if (!el || el.parentNode.hasAttribute(namespace + 'text')) {
      continue;
    }
    if (el.nodeValue && el.nodeValue.match(re)) {
      var new_html = el.parentNode.textContent.replace(re, re_function_html);
      el.parentNode.innerHTML = new_html;
    } else if (el.nodeValue && el.nodeValue.match(re_currencies)) {
      var parent = el.parentNode.parentNode;
      if (parent.childNodes.length < 10) {
        var matches = re.exec(el.parentNode.parentNode.textContent);
        if (matches) {
          var usd = re_function(...matches);
          parent.setAttribute(namespace + 'text', workTimeText(usd.usd));
          parent.setAttribute(namespace + 'isnew', "true");
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
    while (max_depth > 0 && parent && parent !== document.body && parent !== document) {
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

var handleDomChanges = debounce(function() {
  findPrices();
}, 150);

function listenForDomChanges() {
  var target = document.querySelector('body');
  var observer = new MutationObserver(function(mutations) {
    handleDomChanges();
  });
  var config = { childList: true, subtree: true };
  observer.observe(target, config);
}

// For the rare case that the DOM is done loading before the extension
function triggerDomChange() {
  document.body.append(document.createElement('span'));
}

loadSettings(function() {
  listenForDomChanges();
  triggerDomChange();
});
