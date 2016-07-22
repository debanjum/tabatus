var ns = this.window ? (this.window.contracts = {}) : ({});
(function (ctx) {
    ctx.CollectTabs = "CollectTabs";
    ctx.CollectTabsCompleted = "CollectTabsCompleted";
    ctx.ActivateTab = "ActivateTab";
    ctx.ActivateTabCompleted = "ActivateTabCompleted";
    ctx.ActivateTabFailed = "ActivateTabFailed";
    ctx.CloseMe = "CloseMe";
    ctx.Activated = "Activated";
    ctx.HotkeyEnabled = "hotkeyEnabled";
    ctx.HotkeyTogglePanel = "hotkeyTogglePanel";
})(ns);

var exports = module.exports = {};
exports.contracts = ns;