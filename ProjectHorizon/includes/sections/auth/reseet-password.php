<div class="section-content <?php echo ($CURRENT_SECTION === 'resetPassword') ? 'active' : 'disabled'; ?>" data-section="resetPassword">
    <div class="auth-container">
        <h2 data-i18n="auth.resetPasswordTitle"></h2>
        <p data-i18n="auth.resetPasswordSubtitle"></p>
        <div class="auth-form" id="reset-password-form">
            <input type="hidden" name="csrf_token" value="">
            <input type="hidden" id="reset-email" value="">
            <div class="form-field">
                <input type="text" id="reset-code" class="auth-input" placeholder=" " autocomplete="one-time-code">
                <label for="reset-code" class="auth-label" data-i18n="auth.codePlaceholder"></label>
            </div>
            <div class="form-field password-wrapper">
                <input type="password" id="reset-password" class="auth-input" placeholder=" " autocomplete="new-password">
                <label for="reset-password" class="auth-label" data-i18n="auth.newPasswordPlaceholder"></label>
                <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility">
                    <span class="material-symbols-rounded">visibility</span>
                </button>
            </div>
             <div class="form-field password-wrapper">
                <input type="password" id="reset-confirm-password" class="auth-input" placeholder=" " autocomplete="new-password">
                <label for="reset-confirm-password" class="auth-label" data-i18n="auth.confirmPasswordPlaceholder"></label>
            </div>
            <div class="auth-error-message-container" id="reset-error-container">
                <ul id="reset-error-list"></ul>
            </div>
            <button class="load-more-btn" data-action="submit-reset-password" data-i18n="auth.resetPasswordButton"></button>
        </div>
        <p class="auth-switch-prompt"><a href="#" data-action="toggleSectionLogin" data-i18n="auth.backToLogin"></a></p>
    </div>
</div>