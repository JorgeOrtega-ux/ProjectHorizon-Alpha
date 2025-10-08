<div class="section-content <?php echo ($CURRENT_SECTION === 'login') ? 'active' : 'disabled'; ?>" data-section="login">
    <div class="auth-container">
        <h2 data-i18n="auth.loginTitle"></h2>
        <p data-i18n="auth.loginSubtitle"></p>
        <div class="auth-form" id="login-form">
            <input type="hidden" name="csrf_token" value="">
            <div class="form-field">
                <input type="email" id="login-email" class="auth-input" placeholder=" " autocomplete="email">
                <label for="login-email" class="auth-label" data-i18n="auth.emailPlaceholder"></label>
            </div>
            <div class="form-field password-wrapper">
                <input type="password" id="login-password" class="auth-input" placeholder=" " autocomplete="current-password">
                <label for="login-password" class="auth-label" data-i18n="auth.passwordPlaceholder"></label>
                <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility">
                    <span class="material-symbols-rounded">visibility</span>
                </button>
            </div>
            <div class="form-link-container">
                <a href="#" class="form-link" data-action="toggleSectionForgotPassword" data-i18n="auth.forgotPasswordPrompt"></a>
            </div>
            <div class="auth-error-message-container" id="login-error-container">
                <ul id="login-error-list"></ul>
            </div>
            <button class="auth-submit-btn" data-action="submit-login">
                <span class="button-text" data-i18n="auth.loginButton"></span>
                <div class="button-spinner"></div>
            </button>
        </div>
        <p class="auth-switch-prompt"><a href="#" data-action="toggleSectionRegister" data-i18n="auth.registerPrompt"></a></p>
    </div>
</div>