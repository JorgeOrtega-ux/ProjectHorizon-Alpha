<div class="section-content <?php echo ($CURRENT_SECTION === 'loginSecurity') ? 'active' : 'disabled'; ?>" data-section="loginSecurity">
    <div class="settings-page-container">
        <div class="content-section header-section">
            <div class="item-details">
                <h2 data-i18n="settings.loginSecurity.title"></h2>
                <p data-i18n="settings.loginSecurity.description"></p>
            </div>
        </div>

        <div class="content-section">
            <div class="item-icon">
                <span class="material-symbols-rounded">lock</span>
            </div>
            <div class="item-details">
                <h4 data-i18n="settings.loginSecurity.passwordTitle"></h4>
                <p id="password-last-updated"></p>
            </div>
            <div class="item-actions">
                <button class="load-more-btn" data-action="update-password" data-i18n="settings.loginSecurity.updateButton"></button>
            </div>
        </div>

        <div class="content-section">
            <div class="item-icon">
                <span class="material-symbols-rounded">enhanced_encryption</span>
            </div>
            <div class="item-details">
                <h4 data-i18n="settings.loginSecurity.twoFactorAuthTitle"></h4>
                <p data-i18n="settings.loginSecurity.twoFactorAuthDescription"></p>
            </div>
            <div class="item-actions">
                <button class="load-more-btn" data-action="toggle-2fa"></button>
            </div>
        </div>

        <div class="content-section content-section-stacked">
            <div class="item-details">
                <h4 data-i18n="settings.loginSecurity.deleteAccountTitle"></h4>
                <p id="delete-account-description"></p>
            </div>
            <div class="item-actions">
                <button class="load-more-btn btn-danger" data-action="delete-account" data-i18n="settings.loginSecurity.deleteAccountButton"></button>
            </div>
        </div>
    </div>
</div>