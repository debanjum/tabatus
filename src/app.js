'use strict';

(function () {
    let app = angular.module("tabsapp", ["mgcrea.ngStrap"]);

    app.factory("port", [PortFactory]);
    app.factory("focus", ["$timeout", "$window", FocusFactory]);
    app.filter("byTitleAndUrl", [FilterFactory]);
    app.controller("tabsctrl", ["$scope", "port", "focus", TabsCtrl]);

    function PortFactory() {
        if (typeof(browser) !== 'undefined') {
            return browser.runtime.connect({name: contracts.Port});
        }
        return {
            postMessage: function () {
            },
            onMessage: function () {
            }
        }
    }

    function FilterFactory() {

        const options = {
            shouldSort: true,
            tokenize: true,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: [
                "title",
                "url"
            ]
        };

        return async function (items, filterValue) {
            if (typeof filterValue !== "string") {
                return items;
            }

            let filterValueLowerCased = filterValue.toLowerCase();

            let noFuzzyMatch = await browser.storage.sync.get(contracts.OptionDisableFuzzyMatching);

            if (noFuzzyMatch && noFuzzyMatch[contracts.OptionDisableFuzzyMatching]) {

                return items.filter(item => {
                    return item.title.toLowerCase().indexOf(filterValueLowerCased) > -1 ||
                        item.url.toLowerCase().indexOf(filterValueLowerCased) > -1;
                });
            }

            let fuse = new Fuse(items, options);
            return fuse.search(filterValueLowerCased);
        };
    }

    function FocusFactory($timeout, $window) {
        return function (id) {
            $timeout(function () {
                let element = $window.document.getElementById(id);
                if (element) {
                    element.focus();
                }
            });
        };
    }

    function TabsCtrl($scope, port, focus) {

        let ctx = this;
        let handlers = {};

        ctx.tabs = [];
        ctx.$scope = $scope;
        ctx.port = port;
        ctx.focus = focus;
        ctx.activateTab = ctx.activateTab.bind(this);

        handlers[contracts.CollectTabsCompleted] = ctx.onTabs.bind(this);
        handlers[contracts.ActivateTabCompleted] = () => {
            window.close();
        };

        port.onMessage.addListener(e => {
            let handler = handlers[e.event];
            if (handler) {
                handler(e, port);
            }
        });

        ctx.$onInit = function () {
            ctx.port.postMessage({command: contracts.CollectTabs});
            ctx.focus("searchinput");
        };
    }

    TabsCtrl.prototype.activateTab = function (tabToActivate) {
        let ctx = this;
        ctx.port.postMessage({command: contracts.ActivateTab, payload: tabToActivate});
    };

    TabsCtrl.prototype.onTabs = function (collectTabsCompleted) {
        let ctx = this;
        ctx.$scope.$apply(function () {
            ctx.tabs = collectTabsCompleted.payload;
        });
    };
})(window);