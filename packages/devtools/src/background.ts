let devToolOpenCount = 0;
let preInjectedOpenCount = 0;
chrome.runtime.onConnect.addListener(function (port) {
  if (port.name == 'rippling-devtools') {
    if (devToolOpenCount == 0) {
      console.log('DevTools window opening.');
    }
    devToolOpenCount++;

    port.onDisconnect.addListener(function () {
      devToolOpenCount--;
      if (devToolOpenCount == 0) {
        console.log('Last DevTools window closing.');
      }
    });
  } else if (port.name == 'rippling-preinjection') {
    if (preInjectedOpenCount == 0) {
      console.log('PreInjected window opening.');
    }
    preInjectedOpenCount++;

    port.onDisconnect.addListener(function () {
      preInjectedOpenCount--;
      if (preInjectedOpenCount == 0) {
        console.log('Last PreInjected window closing.');
      }
    });
  }
});
