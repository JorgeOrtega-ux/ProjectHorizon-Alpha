<style>
    .password-wrapper {
        position: relative;
        display: flex;
        align-items: center;
    }

    .password-wrapper .auth-input {
        padding-right: 50px; /* Aumentamos el espacio para el botón */
    }

    .password-toggle-btn {
        position: absolute;
        right: 5px; /* Posición del botón */
        top: 50%;
        transform: translateY(-50%);
        height: 40px;
        width: 40px;
        background-color: transparent;
        border: none;
        border-radius: 50px; /* Botón circular */
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--muted-text-color);
        outline: none;
        transition: background-color 0.2s ease; /* Transición suave */
    }

    /* --- ESTILO HOVER AÑADIDO --- */
    .password-toggle-btn:hover {
        background-color: #f5f5fa; /* Color de fondo al pasar el cursor */
        color: var(--text-color);
    }

    /* Para el tema oscuro, usamos la variable correspondiente */
    .dark-theme .password-toggle-btn:hover {
        background-color: var(--hover-bg);
    }
</style>

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
            <div class="form-field password-wrapper">
                <input type="password" id="register-password" class="auth-input" placeholder=" " autocomplete="new-password">
                <label for="register-password" class="auth-label" data-i18n="auth.passwordPlaceholder"></label>
                <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility">
                    <span class="material-symbols-rounded">visibility</span>
                </button>
            </div>
            <button class="load-more-btn" data-i18n="auth.registerButton"></button>
        </div>
        <p class="auth-switch-prompt"><a href="#" data-action="toggleSectionLogin" data-i18n="auth.loginPrompt"></a></p>
    </div>
</div>