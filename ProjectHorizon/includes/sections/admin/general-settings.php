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

            <div class="content-section">
                <div class="form-group-inline" style="flex-direction: column; align-items: stretch; gap: 16px; width: 100%;">
                    <label class="form-label standalone" data-i18n="admin.generalSettings.allowedDomains.title"></label>
                    <p data-i18n="admin.generalSettings.allowedDomains.description" style="margin-bottom: 8px; font-size: 1rem; color: var(--muted-text-color);"></p>
                    <textarea id="allowed-domains-textarea" class="feedback-textarea" rows="3" placeholder="gmail.com, outlook.com, yahoo.com"></textarea>
                </div>
            </div>

            <div class="content-section">
                <div class="form-group-inline" style="flex-direction: column; align-items: stretch; gap: 16px; width: 100%;">
                    <h4 data-i18n="admin.generalSettings.adSettings.title" style="margin-bottom: 8px;"></h4>
                    <div class="form-group">
                        <label class="form-label" for="unlock-duration-input" data-i18n="admin.generalSettings.adSettings.unlockDuration"></label>
                        <input type="number" id="unlock-duration-input" class="feedback-input" value="60">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="ad-probability-input" data-i18n="admin.generalSettings.adSettings.adProbability"></label>
                        <input type="number" id="ad-probability-input" class="feedback-input" value="15" min="0" max="100">
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>