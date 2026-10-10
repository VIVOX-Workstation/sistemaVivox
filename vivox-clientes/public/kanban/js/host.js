(function () {
  'use strict';
  if (window.parent === window) {
    window.vvoxSyncHostConfig = new Promise(function () {});
    window.location.replace('/gp' + window.location.search + window.location.hash);
    return;
  }
  window.vvoxSyncHostConfig = new Promise(function (resolve) {
    function receive(event) {
      if (event.source !== parent || event.origin !== location.origin || !event.data || event.data.type !== 'vvox-sync:init') return;
      if (typeof event.data.token !== 'string' || !event.data.token || !event.data.user || typeof event.data.user.id !== 'string' || typeof event.data.apiUrl !== 'string' || !event.data.apiUrl) return;
      window.removeEventListener('message', receive);
      resolve(event.data);
    }
    window.addEventListener('message', receive);
    parent.postMessage({type:'vvox-sync:ready'}, location.origin);
  });
})();
