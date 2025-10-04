<?php
// ProjectHorizon/includes/sections/settings/your-profile.php
?>
<div class="section-content <?php echo ($CURRENT_SECTION === 'yourProfile') ? 'active' : 'disabled'; ?>" data-section="yourProfile">
    <div class="settings-page-container">
        <div class="content-section header-section">
            <div class="item-details">
                <h2 data-i18n="settings.yourProfile.title"></h2>
                <p data-i18n="settings.yourProfile.description"></p>
            </div>
        </div>

        <div class="content-section">
            <div id="username-view-mode" class="form-group-inline">
                <div class="form-group-text">
                    <label class="form-label" data-i18n="settings.yourProfile.usernameLabel"></label>
                    <span id="username-display">Cargando...</span>
                    <small id="username-cooldown-message" class="cooldown-message" style="display: none;"></small>
                </div>
                <button type="button" class="load-more-btn" id="edit-username-btn" data-i18n="general.edit"></button>
            </div>
            <div id="username-edit-mode" class="form-group-inline" style="display: none;">
                <label class="form-label standalone" data-i18n="settings.yourProfile.usernameLabel"></label>
                <div class="input-with-buttons">
                    <input type="text" id="username-edit-input" class="feedback-input" data-i18n-placeholder="settings.yourProfile.usernamePlaceholder" maxlength="24">
                    <div class="form-group-buttons">
                        <button type="button" class="load-more-btn" id="cancel-username-btn" data-i18n="general.cancel"></button>
                        <button type="button" class="load-more-btn btn-primary" id="save-username-btn" data-action="save-username">
                            <span class="button-text" data-i18n="general.save"></span>
                            <div class="button-spinner"></div>
                        </button>
                    </div>
                </div>
                <div class="auth-error-message-container" id="username-error-container" style="margin-top: 12px;">
                    <ul id="username-error-list"></ul>
                </div>
            </div>
        </div>

        <div class="content-section">
            <div id="email-view-mode" class="form-group-inline">
                <div class="form-group-text">
                    <label class="form-label" data-i18n="settings.yourProfile.emailLabel"></label>
                    <span id="email-display">Cargando...</span>
                    <small id="email-cooldown-message" class="cooldown-message" style="display: none;"></small>
                </div>
                <button type="button" class="load-more-btn" id="edit-email-btn" data-i18n="general.edit"></button>
            </div>
            <div id="email-edit-mode" class="form-group-inline" style="display: none;">
                <label class="form-label standalone" data-i18n="settings.yourProfile.emailLabel"></label>
                <div class="input-with-buttons">
                    <input type="email" id="email-edit-input" class="feedback-input" data-i18n-placeholder="settings.yourProfile.emailPlaceholder">
                    <div class="form-group-buttons">
                        <button type="button" class="load-more-btn" id="cancel-email-btn" data-i18n="general.cancel"></button>
                        <button type="button" class="load-more-btn btn-primary" id="save-email-btn" data-action="save-email">
                            <span class="button-text" data-i18n="general.save"></span>
                            <div class="button-spinner"></div>
                        </button>
                    </div>
                </div>
                <div class="auth-error-message-container" id="email-error-container" style="margin-top: 12px;">
                    <ul id="email-error-list"></ul>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .cooldown-message {
        color: var(--muted-text-color);
        font-size: 0.8rem;
        margin-top: 4px;
    }
</style>