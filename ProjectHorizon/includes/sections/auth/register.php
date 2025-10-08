<div class="section-content <?php echo ($CURRENT_SECTION === 'register') ? 'active' : 'disabled'; ?>" data-section="register">
    <div class="auth-container">
        <h2 data-i18n="auth.registerTitle"></h2>
        <p data-i18n="auth.registerSubtitle"></p>
        <div class="auth-form" id="register-form" data-step="user-info">
            <input type="hidden" name="csrf_token" value="">
            
            <div id="user-info-group" class="form-step-group">
                <div class="form-field">
                    <input type="text" id="register-username" class="auth-input" placeholder=" " autocomplete="nickname" maxlength="24">
                    <label for="register-username" class="auth-label" data-i18n="auth.usernamePlaceholder"></label>
                </div>
                <div class="form-field">
                    <input type="email" id="register-email" class="auth-input" placeholder=" " autocomplete="email">
                    <label for="register-email" class="auth-label" data-i18n="auth.emailPlaceholder"></label>
                </div>
            </div>

            <div id="password-group" class="form-step-group">
                <div class="form-field password-wrapper">
                    <input type="password" id="register-password" class="auth-input" placeholder=" " autocomplete="new-password">
                    <label for="register-password" class="auth-label" data-i18n="auth.passwordPlaceholder"></label>
                    <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility">
                        <span class="material-symbols-rounded">visibility</span>
                    </button>
                </div>
                <div class="form-field password-wrapper">
                    <input type="password" id="register-confirm-password" class="auth-input" placeholder=" " autocomplete="new-password">
                    <label for="register-confirm-password" class="auth-label" data-i18n="auth.confirmPasswordPlaceholder"></label>
                </div>
            </div>

            <div id="verify-code-group" class="form-step-group">
                 <div class="form-field">
                    <input type="text" id="register-code" class="auth-input" placeholder=" " autocomplete="one-time-code" maxlength="7">
                    <label for="register-code" class="auth-label" data-i18n="auth.codePlaceholder"></label>
                </div>
            </div>

            <div class="auth-error-message-container" id="register-error-container">
                <ul id="register-error-list"></ul>
            </div>
            <button class="auth-submit-btn" data-action="submit-register">
                <span class="button-text" data-i18n="general.next"></span>
                <div class="button-spinner"></div>
            </button>
        </div>
        <p class="auth-switch-prompt"><a href="#" data-action="toggleSectionLogin" data-i18n="auth.loginPrompt"></a></p>
    </div>
</div>

<style>
    .form-step-group {
        flex-direction: column;
        gap: 16px;
        width: 100%;
    }
</style>