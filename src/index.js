var root = {};
var api = require("./data/contracts");

(function (ctx) {

    var data = require("sdk/self").data;
    var tabs = require("sdk/tabs");
    var _ = require("./data/external/lodash.min.js");

    ctx.addon = function () {

        var hotkeySubscriptions = [];
        var pseudoTabs = [{
            id: "[Open empty tab]",
            title: "[Open empty tab]",
            url: "about:blank",
            pseudoTab: true,
            action: function () {
                var tabs = require("sdk/tabs");
                tabs.open("about:blank");
            }
        }];
        var hotkeyMap = [];
        hotkeyMap[api.contracts.HotkeyTogglePanel] = function () {
            togglePanel();
        };

        var buildPanel = _.memoize(function () {
            return require("sdk/panel").Panel({
                width: 400,
                height: 300,
                contentURL: data.url("tabpanel.html"),
                contentScriptFile: []
            });
        });

        var togglePanel = function () {
            var panel = buildPanel();
            if (panel.isShowing) {
                panel.hide();
                return;
            }
            panel.show();
            panel.port.emit(api.contracts.Activated);
        };

        var purgeHotkeys = function () {
            _.forEach(hotkeySubscriptions, function (item) {
                item.destroy();
            });
            hotkeySubscriptions = [];
        };

        var wireupHotkeys = function (keyMap) {
            var hotkeys = require("sdk/hotkeys");
            purgeHotkeys();
            _.forEach(keyMap, function (h) {
                try {
                    var hotkey = hotkeys.Hotkey({
                        combo: h.key,
                        onPress: hotkeyMap[h.action]
                    });
                    hotkeySubscriptions.push(hotkey);
                } catch (e) {
                    console.error("Wiring up hotkey");
                }
            });
        };

        var collectTabs = function () {
            var tabs = require('sdk/tabs');
            return _.map(tabs, function (item) {
                return {id: item.id, title: item.title, url: item.url};
            }).concat(pseudoTabs);
        };

        var activateTab = function (tabToActivate) {
            var tabs = _.toArray(require('sdk/tabs')).concat(pseudoTabs);
            var match = _.find(tabs, {"id": tabToActivate.id});
            if (match) {
                if (typeof match.pseudoTab !== "undefined") {
                    match.action();
                }
                else {
                    match.activate();
                }
                return true;
            }
            return false;
        };

        var buildButton = _.memoize(function () {
            //noinspection JSUnusedGlobalSymbols
            return require("sdk/ui/button/action").ActionButton({
                id: "show-tabpanel",
                label: "Show tab filtering & switching panel",
                icon: {
                    "16": "./resources/icon-16.png",
                    "32": "./resources/icon-32.png",
                    "64": "./resources/icon-64.png"
                },
                onClick: function () {
                    togglePanel();
                }
            });
        });

        return {
            buildButton: buildButton,
            buildPanel: buildPanel,
            wireupHotkeys: wireupHotkeys,
            collectTabs: collectTabs,
            togglePanel: togglePanel,
            activateTab: activateTab,
            purgeHotkeys: purgeHotkeys
        }
    }();
})(root);

(function (ctx) {
    var minWidth = 300, minHeight = 300;
    var prefManager = require('sdk/simple-prefs');
    var addon = root.addon;
    addon.buildButton();
    var panel = addon.buildPanel();

    panel.port.on("resize", function (request) {
        var height = Math.max(minHeight, request.height);
        if (request.width > minWidth) {
            panel.resize(request.width + 35, height);
        }
    });

    panel.port.on(api.contracts.CloseMe, function () {
        panel.hide();
    });

    panel.port.on(api.contracts.CollectTabs, function (request) {
        var tabs = addon.collectTabs();
        panel.port.emit(api.contracts.CollectTabsCompleted, {request: request, tabs: tabs});
    });

    panel.port.on(api.contracts.ActivateTab, function (request) {
        if (addon.activateTab(request)) {
            panel.port.emit(api.contracts.ActivateTabCompleted, {request: request});
            return;
        }
        panel.port.emit(api.contracts.ActivateTabFailed, {request: request});
    });

    var setupHotkeys = function () {
        if (prefManager.prefs[api.contracts.HotkeyEnabled] === true) {
            var keyTogglePanel = prefManager.prefs[api.contracts.HotkeyTogglePanel];

            if (!keyTogglePanel || keyTogglePanel.length === 0) {
                keyTogglePanel = "accel-.";
            }
            addon.wireupHotkeys([{action: api.contracts.HotkeyTogglePanel, key: keyTogglePanel}]);
            return;
        }
        addon.purgeHotkeys();
    };

    setupHotkeys();

    prefManager.on(api.contracts.HotkeyEnabled, function () {
        setupHotkeys();
    });

    prefManager.on(api.contracts.HotkeyTogglePanel, function () {
        setupHotkeys();
    });

})(root);