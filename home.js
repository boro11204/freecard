(function () {
  'use strict';
  var F = window.FreeCard;
  var a = F.sampleCard('chasuna', 'aichivoryfloral1', 'he');
  var b = F.sampleCard('barmitzvah', 'aibmnavyfiligree1', 'en');
  F.renderCard(a, document.getElementById('heroA'));
  F.renderCard(b, document.getElementById('heroB'));
  var grid = document.getElementById('designGrid');
  var langs = ['he', 'en', 'yi'];
  Object.keys(F.DESIGNS).forEach(function (key, i) {
    var D = F.DESIGNS[key], t = D.types[0];
    var link = document.createElement('a');
    link.className = 'design-tile';
    link.href = 'make.html?type=' + t + '&design=' + key;
    var wrap = document.createElement('div');
    wrap.className = 'fc-wrap';
    link.appendChild(wrap);
    var n = document.createElement('div'); n.className = 'dn'; n.textContent = D.name;
    var d = document.createElement('div'); d.className = 'dd'; d.textContent = D.types.slice(0, 3).map(function (x) { return F.TYPES[x].en; }).join(' · ');
    link.appendChild(n); link.appendChild(d);
    if (D.nb) { var nb = document.createElement('i'); nb.className = 'nb'; nb.textContent = 'New'; link.appendChild(nb); }
    if (D.ai) { var ai = document.createElement('div'); ai.className = 'ai-note'; ai.textContent = D.src === 'leo' ? 'Background art AI-generated with Leonardo.ai' : 'Background art AI-generated with Canva'; link.appendChild(ai); }
    grid.appendChild(link);
    // drawn once on the page, so long wording is fitted inside the art the same way the maker does
    F.renderCard(F.sampleCard(t, key, langs[i % 3]), wrap, { thumb: true });
  });
})();
