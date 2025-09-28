<div class="header">
    <div class="header-left">
        <div class="header-item">
            <div class="header-button" data-action="toggleModuleSurface" data-i18n-tooltip="header.mainMenuTooltip">
                <span class="material-symbols-rounded">menu</span>
            </div>
        </div>
    </div>
    <div class="header-right">
        <div class="header-item">
            <div class="header-button" data-action="toggleHelp" data-i18n-tooltip="header.helpTooltip">
                <span class="material-symbols-rounded">help</span>
            </div>
            <div class="header-button" data-action="toggleSettings" data-i18n-tooltip="header.settingsTooltip">
                <span class="material-symbols-rounded">settings</span>
            </div>
            <button class="header-button login-btn" data-action="toggleAuth">
                <span data-i18n="header.login"></span>
            </button>
        </div>
    </div>
</div>
<style>
    .login-btn {
    width: auto;
    padding: 0 16px;
}

.login-btn span {
    font-size: 0.875rem;
    font-weight: 500;
}
</style>