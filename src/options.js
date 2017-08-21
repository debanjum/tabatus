'use strict';

(function () {
    let app = angular.module("tabsapp", ["mgcrea.ngStrap"]);

    app.controller("settingsctrl", ["$scope", SettingsCtrl]);

    function SettingsCtrl($scope) {
        let ctx = this;
        ctx.settings = {};
        ctx.categories = categories;
        ctx.save = ctx.save.bind(this);
    }

    SettingsCtrl.prototype.save = function () {
        let ctx = this;
        browser.storage.sync.set(ctx.settings);
    };

    const categories = [
        {
            'label': browser.i18n.getMessage('general'),
            'options': [{
                'key': contracts.OptionDisableFuzzyMatching,
                'label': browser.i18n.getMessage('option_disable_fuzzy_matching'),
            }]
        }];

})(window);