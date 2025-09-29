<div class="section-content <?php echo ($CURRENT_SECTION === 'forgotPassword') ? 'active' : 'disabled'; ?>" data-section="forgotPassword">
    <div class="auth-container">
        <h2 data-i18n="auth.forgotPasswordTitle"></h2>
        <p data-i18n="auth.forgotPasswordSubtitle"></p>
        <div class="auth-form" id="forgot-password-form">
            <input type="hidden" name="csrf_token" value="">
            <div class="form-field">
                <input type="email" id="forgot-email" class="auth-input" placeholder=" " autocomplete="email">
                <label for="forgot-email" class="auth-label" data-i18n="auth.emailPlaceholder"></label>
            </div>
            <div class="auth-error-message-container" id="forgot-error-container">
                <ul id="forgot-error-list"></ul>
            </div>
            <button class="load-more-btn" data-action="submit-forgot-password" data-i18n="auth.forgotPasswordButton"></button>
        </div>
        <p class="auth-switch-prompt"><a href="#" data-action="toggleSectionLogin" data-i18n="auth.backToLogin"></a></p>
    </div>
</div>