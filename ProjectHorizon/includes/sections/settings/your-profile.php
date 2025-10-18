<?php
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
$is_staff = isset($_SESSION['loggedin']) && $_SESSION['loggedin'] === true && isset($_SESSION['user_role']) && in_array($_SESSION['user_role'], ['moderator', 'administrator', 'founder']);
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
            <div class="profile-picture-container">
                <div class="pfp-avatar-wrapper">
                    <div id="profile-picture-preview" class="profile-btn pfp-avatar">
                        <span class="profile-initials"></span>
                    </div>
                    <input type="file" id="profile-picture-input" accept="image/*" style="display: none;">
                </div>
                <div class="pfp-details">
                    <h4 data-i18n="settings.yourProfile.pfpTitle"></h4>
                    <p data-i18n="settings.yourProfile.pfpDescription"></p>
                </div>
                <div class="pfp-actions">
                    <button type="button" class="load-more-btn" id="upload-picture-btn" data-i18n="settings.yourProfile.pfpUploadBtn" style="display: none;"></button>
                    <button type="button" class="load-more-btn" id="delete-picture-btn" data-i18n="settings.yourProfile.pfpDeleteBtn" style="display: none;"></button>
                    <button type="button" class="load-more-btn" id="change-picture-btn" data-i18n="settings.yourProfile.pfpChangeBtn" style="display: none;"></button>
                    <button type="button" class="load-more-btn" id="cancel-picture-btn" data-i18n="general.cancel" style="display: none;"></button>
                    <button type="button" class="load-more-btn btn-primary" id="save-picture-btn" style="display: none;">
                        <span class="button-text" data-i18n="general.save"></span>
                        <div class="button-spinner"></div>
                    </button>
                </div>
            </div>
        </div>

        <div class="content-section">
            <div id="username-view-mode" class="form-group-inline">
                <div class="form-group-text">
                    <label class="form-label" data-i18n="settings.yourProfile.usernameLabel"></label>
                    <span id="username-display">Cargando...</span>
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