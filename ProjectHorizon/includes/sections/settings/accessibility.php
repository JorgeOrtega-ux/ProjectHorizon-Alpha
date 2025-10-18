<div class="section-content <?php echo ($CURRENT_SECTION === 'accessibility') ? 'active' : 'disabled'; ?>" data-section="accessibility">
    <div class="settings-page-container">
        <div class="content-section header-section">
            <div class="item-details">
                <h2 data-i18n="settings.accessibility.title"></h2>
                <p data-i18n="settings.accessibility.description"></p>
            </div>
        </div>
        <div class="content-section select-section">
            <div class="item-details">
                <h4 data-i18n="settings.accessibility.languageTitle"></h4>
                <p data-i18n="settings.accessibility.languageDescription"></p>
            </div>
            <div class="form-controls">
                <div class="select-wrapper body-title">
                    <div class="custom-select-trigger" data-action="toggle-select" data-target="language-select">
                        <div class="select-trigger-icon">
                            <span class="material-symbols-rounded">language</span>
                        </div>
                        <span class="select-trigger-text" data-i18n="settings.accessibility.languageOptions.es-419"></span>
                        <div class="select-trigger-icon select-trigger-arrow">
                            <span class="material-symbols-rounded">expand_more</span>
                        </div>
                    </div>
                    <div class="module-content module-select disabled" id="language-select">
                        <div class="menu-content">
                            <div class="menu-list">
                                <div class="menu-link" data-value="es-419"> <div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div>
                                    <div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.es-419"></span></div>
                                </div>
                                <div class="menu-link" data-value="en-US">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div>
                                    <div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.en-US"></span></div>
                                </div>
                                <div class="menu-link" data-value="fr-FR">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div>
                                    <div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.fr-FR"></span></div>
                                </div>
                                <div class="menu-link" data-value="de-DE">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div>
                                    <div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.de-DE"></span></div>
                                </div>
                                <div class="menu-link" data-value="pt-BR">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div>
                                    <div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.pt-BR"></span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="content-section select-section">
            <div class="item-details">
                <h4 data-i18n="settings.accessibility.themeTitle"></h4>
                <p data-i18n="settings.accessibility.themeDescription"></p>
            </div>
            <div class="form-controls">
                <div class="select-wrapper body-title">
                    <div class="custom-select-trigger" data-action="toggle-select" data-target="theme-select">
                        <div class="select-trigger-icon">
                            <span class="material-symbols-rounded">desktop_windows</span>
                        </div>
                        <span class="select-trigger-text" data-i18n="settings.accessibility.themeOptions.system"></span>
                        <div class="select-trigger-icon select-trigger-arrow">
                            <span class="material-symbols-rounded">expand_more</span>
                        </div>
                    </div>
                    <div class="module-content module-select disabled" id="theme-select">
                        <div class="menu-content">
                            <div class="menu-list">
                                <div class="menu-link" data-value="system">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">desktop_windows</span></div>
                                    <div class="menu-link-text"><span data-i18n="settings.accessibility.themeOptions.system"></span></div>
                                </div>
                                <div class="menu-link" data-value="dark">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">dark_mode</span></div>
                                    <div class="menu-link-text"><span data-i18n="settings.accessibility.themeOptions.dark"></span></div>
                                </div>
                                <div class="menu-link" data-value="light">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">light_mode</span></div>
                                    <div class="menu-link-text"><span data-i18n="settings.accessibility.themeOptions.light"></span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="content-section data-group-section">
            <div class="data-item">
                <div class="view-container active">
                    <div class="item-details">
                        <h4 data-i18n="settings.accessibility.openLinksTitle"></h4>
                        <p data-i18n="settings.accessibility.openLinksDescription"></p>
                    </div>
                    <div class="item-actions">
                        <div class="toggle-switch" data-setting="open-links-in-new-tab">
                            <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="data-item">
                <div class="view-container active">
                    <div class="item-details">
                        <h4 data-i18n="settings.accessibility.longerNotificationsTitle"></h4>
                        <p data-i18n="settings.accessibility.longerNotificationsDescription"></p>
                    </div>
                    <div class="item-actions">
                        <div class="toggle-switch" data-setting="longer-message-duration">
                            <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>