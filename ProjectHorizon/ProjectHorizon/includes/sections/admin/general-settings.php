<?php
// includes/sections/admin/general-settings.php
?>
<div class="section-content <?php echo ($CURRENT_SECTION === 'generalSettings') ? 'active' : 'disabled'; ?>" data-section="generalSettings">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-title-container">
                    <span data-i18n="admin.generalSettings.title"></span>
                </div>
            </div>
            <div class="content-header-right">
                <button class="load-more-btn btn-primary" data-action="save-general-settings">
                    <span class="button-text" data-i18n="general.save"></span>
                    <div class="button-spinner"></div>
                </button>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="settings-page-container">

            <div class="content-section header-section">
                <div class="item-details">
                    <h2 data-i18n="admin.generalSettings.title"></h2>
                    <p data-i18n="admin.generalSettings.description"></p>
                </div>
            </div>

            <div class="content-section data-group-section">
                <div class="data-item">
                    <div class="view-container active">
                        <div class="item-details">
                            <h4 data-i18n="admin.generalSettings.maintenanceMode.title"></h4>
                            <p data-i18n="admin.generalSettings.maintenanceMode.description"></p>
                        </div>
                        <div class="item-actions">
                            <div class="toggle-switch" data-setting="maintenance-mode">
                                <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="data-item">
                    <div class="view-container active">
                        <div class="item-details">
                            <h4 data-i18n="admin.generalSettings.userRegistration.title"></h4>
                            <p data-i18n="admin.generalSettings.userRegistration.description"></p>
                        </div>
                        <div class="item-actions">
                            <div class="toggle-switch active" data-setting="allow-new-registrations">
                                <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="content-section select-section">
                <div class="item-details">
                    <h4 data-i18n="admin.generalSettings.adSettings.unlockDuration"></h4>
                    <p data-i18n="admin.generalSettings.adSettings.unlockDurationDescription"></p>
                </div>
                <div class="form-controls">
                    <div class="select-wrapper body-title">
                        <div class="custom-select-trigger" data-action="toggle-select" data-target="unlock-duration-select">
                            <div class="select-trigger-icon"><span class="material-symbols-rounded">timer</span></div>
                            <span class="select-trigger-text">60 minutos</span>
                            <div class="select-trigger-icon select-trigger-arrow"><span class="material-symbols-rounded">expand_more</span></div>
                        </div>
                        <div class="module-content module-select disabled" id="unlock-duration-select">
                            <div class="menu-content"><div class="menu-list">
                                <?php for ($i = 5; $i <= 120; $i += 5): ?>
                                    <div class="menu-link" data-value="<?php echo $i; ?>">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">timer</span></div>
                                        <div class="menu-link-text"><span><?php echo $i; ?> minutos</span></div>
                                    </div>
                                <?php endfor; ?>
                            </div></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="content-section select-section">
                <div class="item-details">
                    <h4 data-i18n="admin.generalSettings.adSettings.adProbability"></h4>
                    <p data-i18n="admin.generalSettings.adSettings.adProbabilityDescription"></p>
                </div>
                <div class="form-controls">
                    <div class="select-wrapper body-title">
                        <div class="custom-select-trigger" data-action="toggle-select" data-target="ad-probability-select">
                            <div class="select-trigger-icon"><span class="material-symbols-rounded">percent</span></div>
                            <span class="select-trigger-text">15% + Cooldown</span>
                            <div class="select-trigger-icon select-trigger-arrow"><span class="material-symbols-rounded">expand_more</span></div>
                        </div>
                        <div class="module-content module-select disabled" id="ad-probability-select">
                            <div class="menu-content"><div class="menu-list">
                                <div class="menu-link" data-value="0_no_cooldown"><div class="menu-link-icon"><span class="material-symbols-rounded">play_disabled</span></div><div class="menu-link-text"><span>Sin anuncios</span></div></div>
                                <?php for ($i = 5; $i <= 100; $i += 5): ?>
                                    <div class="menu-link" data-value="<?php echo $i; ?>_cooldown">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">percent</span></div>
                                        <div class="menu-link-text"><span><?php echo $i; ?>% + Cooldown</span></div>
                                    </div>
                                    <div class="menu-link" data-value="<?php echo $i; ?>_no_cooldown">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">percent</span></div>
                                        <div class="menu-link-text"><span><?php echo $i; ?>% sin Cooldown</span></div>
                                    </div>
                                <?php endfor; ?>
                            </div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="content-section content-section-stacked">
                <div class="item-details">
                    <h4 data-i18n="admin.generalSettings.profanityFilter.title"></h4>
                    <p data-i18n="admin.generalSettings.profanityFilter.description"></p>
                </div>
                <div class="item-actions">
                    <button class="load-more-btn" data-action="toggleSectionManageProfanity">
                        <span class="button-text" data-i18n="admin.generalSettings.profanityFilter.manageButton"></span>
                    </button>
                </div>
            </div>

            <div class="content-section content-section-stacked delete-section">
                <div class="item-details">
                    <h4 data-i18n="admin.generalSettings.dangerZone.title"></h4>
                    <p data-i18n="admin.generalSettings.dangerZone.description"></p>
                </div>
                <div class="item-actions">
                    <button class="load-more-btn btn-danger" data-action="truncate-database">
                        <span class="button-text" data-i18n="admin.generalSettings.dangerZone.button"></span>
                    </button>
                </div>
            </div>

        </div>
    </div>
</div>