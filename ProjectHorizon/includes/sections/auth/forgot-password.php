<div class="section-content <?php echo ($CURRENT_SECTION === 'forgotPassword') ? 'active' : 'disabled'; ?>" data-section="forgotPassword">
    <div class="auth-container">
        <h2 data-i18n="auth.forgotPasswordTitle"></h2>
        <p data-i18n="auth.forgotPasswordSubtitle"></p>
        <div class="auth-form" id="forgot-password-form" data-step="enter-email">
            <input type="hidden" name="csrf_token" value="">
            
            
            <div id="email-group">
                <div class="form-field">
                    <input type="email" id="forgot-email" class="auth-input" placeholder=" " autocomplete="email">
                    <label for="forgot-email" class="auth-label" data-i18n="auth.emailPlaceholder"></label>
                </div>
            </div>

            
            <div id="code-group" style="display: none;">
                 <input type="hidden" id="reset-email" value="">
                <div class="form-field">
                    <input type="text" id="reset-code" class="auth-input" placeholder=" " autocomplete="one-time-code" maxlength="7">
                    <label for="reset-code" class="auth-label" data-i18n="auth.codePlaceholder"></label>
                </div>
            </div>

            
            <div id="password-group" style="display: none;">
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
            </div>

            <div class="auth-error-message-container" id="forgot-error-container">
                <ul id="forgot-error-list"></ul>
            </div>

            <button class="auth-submit-btn" data-action="submit-forgot-password">
                <span class="button-text" data-i18n="auth.forgotPasswordButton"></span>
                <div class="button-spinner"></div>
            </button>
        </div>
        <p class="auth-switch-prompt"><a href="#" data-action="toggleSectionLogin" data-i18n="auth.backToLogin"></a></p>
    </div>
</div>