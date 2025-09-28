<div class="section-content <?php echo ($CURRENT_SECTION === 'register') ? 'active' : 'disabled'; ?>" data-section="register">
    <div class="auth-container">
        <h2 data-i18n="auth.registerTitle"></h2>
        <p data-i18n="auth.registerSubtitle"></p>
        <div class="auth-form">
            <div class="form-field">
                <input type="text" id="register-username" class="auth-input" placeholder=" " autocomplete="username">
                <label for="register-username" class="auth-label" data-i18n="auth.usernamePlaceholder"></label>
            </div>
            <div class="form-field">
                <input type="email" id="register-email" class="auth-input" placeholder=" " autocomplete="email">
                <label for="register-email" class="auth-label" data-i18n="auth.emailPlaceholder"></label>
            </div>
            <div class="form-field">
                <input type="password" id="register-password" class="auth-input" placeholder=" " autocomplete="new-password">
                <label for="register-password" class="auth-label" data-i18n="auth.passwordPlaceholder"></label>
            </div>
            <button class="load-more-btn" data-i18n="auth.registerButton"></button>
        </div>
        <p class="auth-switch-prompt"><a href="#" data-action="toggleSectionLogin" data-i18n="auth.loginPrompt"></a></p>
    </div>
</div>