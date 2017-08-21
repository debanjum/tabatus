'use strict';

let root = {};

(function (ctx) {

    let tabs = browser.tabs;

    ctx.addon = function () {

        let pseudoTabActions = {};
        let pseudoTabs = [{
            id: "[Open empty tab]",
            title: "[Open empty tab]",
            url: "about:blank",
            pseudoTab: true,
        }];

        pseudoTabActions[pseudoTabs[0].id] = {
            activate: async function () {
                tabs.create({url: "about:blank"});
            }
        };

        let collectTabs = async function () {
            return tabs.query({}).then(items => {
                return items.map(item => {
                    return {id: item.id, title: item.title, url: item.url};
                }).concat(pseudoTabs);
            });
        };

        let activateTab = async function (tabToActivate) {
            let pseudoTab = pseudoTabActions[tabToActivate.id];
            if (pseudoTab)
            {
                return pseudoTab.activate().then(() => {return true;})
            }
            return tabs.update(tabToActivate.id,{
                active: true
            }).then(() => {
                return true;
            }).catch(() => {
                return false;
            });
        };

        return {
            collectTabs: collectTabs,
            activateTab: activateTab,
        }
    }();
})(root);

(function () {
    let addon = root.addon;
    let handlers = {};

    handlers[contracts.ActivateTab] = async function (request, port) {
        if (await addon.activateTab(request.payload)) {
            port.postMessage({event: contracts.ActivateTabCompleted});
            return;
        }
        port.postMessage({event: contracts.ActivateTabFailed});
    };

    handlers[contracts.CollectTabs] = async function (request, port) {
        let tabs = await addon.collectTabs();
        port.postMessage({event: contracts.CollectTabsCompleted, payload: tabs});
    };

    function connected(p) {
        if (p.name === contracts.Port)
            p.onMessage.addListener(function (m) {
                let handler = handlers[m.command];
                if (handler) {
                    handler(m, p);
                }
            });
    }

    browser.runtime.onConnect.addListener(connected);
})(root);