(function (ns) {
    var app = angular.module("tabsapp", ["ngAnimate", "mgcrea.ngStrap"]);

    app.factory("port", [PortFactory]);
    app.factory("focus", ["$timeout", "$window", FocusFactory]);
    app.filter("byTitleAndUrl", [FilterFactory]);
    app.controller("tabsctrl", ["$scope", "port", "focus", TabsCtrl]);
    app.directive("broadcastResize", ["$document", "port", BroadCastResizeFactory]);

    function PortFactory() {
        if (typeof(addon) !== 'undefined') {
            return addon.port;
        }
        return {
            emit: function () {
            },
            on: function () {
            }
        }
    }

    function BroadCastResizeFactory($document, port) {
        return function (scope, element) {
            scope.getWindowDimensions = function () {
                return {
                    width: element.width(),
                    height: element.height()
                };
            };
            scope.$watch(scope.getWindowDimensions, _.debounce(function (newValue) {

                port.emit("resize", {
                    width: newValue.width,
                    height: newValue.height
                });

            }, 150),true);
        };
    }

    function FilterFactory() {
        return function (items, filterValue) {
            if (typeof filterValue !== "string") {
                return items;
            }
            var filterValueLowerCased = filterValue.toLowerCase();
            return _.filter(items, function (item) {
                return item.title.toLowerCase().indexOf(filterValueLowerCased) > -1 ||
                    item.url.toLowerCase().indexOf(filterValueLowerCased) > -1;
            });
        }
    }

    function FocusFactory($timeout, $window) {
        return function (id) {
            $timeout(function () {
                var element = $window.document.getElementById(id);
                if (element) {
                    element.focus();
                }
            });
        };
    }

    function TabsCtrl($scope, port, focus) {

        var ctx = this;

        ctx.tabs = [];
        ctx.$scope = $scope;
        ctx.port = port;
        ctx.focus = focus;
        ctx.activateTab = ctx.activateTab.bind(this);

        port.on(ns.contracts.Activated, ctx.onActivated.bind(this));
        port.on(ns.contracts.CollectTabsCompleted, ctx.onTabs.bind(this));
        port.on(ns.contracts.ActivateTabCompleted, ctx.onTabActivated.bind(this));
    }

    TabsCtrl.prototype.onActivated = function () {
        var ctx = this;
        ctx.selectedTab = null;
        ctx.focus("searchinput");
        ctx.port.emit(ns.contracts.CollectTabs);
    };

    TabsCtrl.prototype.onTabActivated = function () {
        var ctx = this;
        ctx.port.emit(ns.contracts.CloseMe);
    };

    TabsCtrl.prototype.activateTab = function (tabToActivate) {
        var ctx = this;
        ctx.port.emit(ns.contracts.ActivateTab, tabToActivate);
    };

    TabsCtrl.prototype.onTabs = function (collectTabsCompleted) {
        var ctx = this;
        ctx.$scope.$apply(function () {
            ctx.tabs = collectTabsCompleted.tabs;
        });
    };

})(window);