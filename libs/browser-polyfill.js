(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define("webextension-polyfill", ["module"], factory);
  } else if (typeof exports !== "undefined") {
    factory(module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod);
    global.browser = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (module) {
  /* webextension-polyfill - v0.10.0 - Mozilla */

  if (typeof browser === "undefined" || Object.getPrototypeOf(browser) !== Object.prototype) {
    const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";

    const wrapAPIs = extensionAPIs => {
      const apiMetadata = {
        "runtime": {
          "lastError": "value",
          "onMessage": {
            "minArgs": 1,
            "maxArgs": 3
          },
          "onMessageExternal": {
            "minArgs": 1,
            "maxArgs": 3
          },
          "sendMessage": {
            "minArgs": 1,
            "maxArgs": 3
          }
        },
        "history": {
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getVisits": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "addUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteRange": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        }
      };

      const namespace = {
        runtime: {
          lastError: null,
          onMessage: {
            addListener(callback) {
              if (chrome.runtime.onMessage) {
                chrome.runtime.onMessage.addListener(callback);
              }
            }
          }
        }
      };

      const wrapObject = (target, wrappers = {}, metadata = {}) => {
        let cache = Object.create(null);
        let handlers = {
          has(proxyTarget, prop) {
            return prop in target || prop in cache;
          },
          get(proxyTarget, prop, receiver) {
            if (prop in cache) {
              return cache[prop];
            }

            if (!(prop in target)) {
              return undefined;
            }

            let value = target[prop];

            if (typeof value === "function") {
              value = (...args) => {
                return new Promise((resolve, reject) => {
                  target[prop](...args, (...results) => {
                    if (chrome.runtime.lastError) {
                      reject(new Error(chrome.runtime.lastError.message));
                    } else {
                      resolve(results.length > 1 ? results : results[0]);
                    }
                  });
                });
              };
            }

            cache[prop] = value;
            return value;
          }
        };

        return new Proxy(target, handlers);
      };

      for (const [api, endpoints] of Object.entries(apiMetadata)) {
        if (!(api in chrome)) {
          continue;
        }

        namespace[api] = {};
        
        for (const [key, value] of Object.entries(chrome[api])) {
          if (typeof value === "function") {
            namespace[api][key] = (...args) => {
              return new Promise((resolve, reject) => {
                chrome[api][key](...args, (...results) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve(results.length > 1 ? results : results[0]);
                  }
                });
              });
            };
          } else {
            namespace[api][key] = value;
          }
        }
      }

      return namespace;
    };

    if (typeof chrome !== "undefined" && chrome) {
      module.exports = wrapAPIs(chrome);
    } else {
      module.exports = typeof browser !== "undefined" ? browser : null;
    }
  } else {
    module.exports = browser;
  }
}); 