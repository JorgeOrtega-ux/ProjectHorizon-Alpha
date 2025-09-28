<div class="section-content <?php echo ($CURRENT_SECTION === 'login') ? 'active' : 'disabled'; ?>" data-section="login">
    <div class="auth-container">
        <h2 data-i18n="auth.loginTitle"></h2>
        <p data-i18n="auth.loginSubtitle"></p>
        <div class="auth-form">
            <div class="form-field">
                <input type="email" id="login-email" class="auth-input" placeholder=" " autocomplete="email">
                <label for="login-email" class="auth-label" data-i18n="auth.emailPlaceholder"></label>
            </div>
            <div class="form-field">
                <input type="password" id="login-password" class="auth-input" placeholder=" " autocomplete="current-password">
                <label for="login-password" class="auth-label" data-i18n="auth.passwordPlaceholder"></label>
            </div>
            <button class="load-more-btn" data-i18n="auth.loginButton"></button>
        </div>
        <p class="auth-switch-prompt"><a href="#" data-action="toggleSectionRegister" data-i18n="auth.registerPrompt"></a></p>
    </div>
</div>