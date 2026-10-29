(function () {
  'use strict';
  var F = window.FreeCard;
  var a = F.sampleCard('chasuna', 'aichivoryfloral1', 'he');
  var b = F.sampleCard('barmitzvah', 'aibmnavyfiligree1', 'en');
  F.renderCard(a, document.getElementById('heroA'));
  F.renderCard(b, document.getElementById('heroB'));
  // v20261029b: the home page no longer lists every design; the designs are shown in the card maker.
})();
