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

    .password-toggle-btn:hover {
        background-color: #f5f5fa; /* Color de fondo al pasar el cursor */
        color: var(--text-color);
    }

    .dark-theme .password-toggle-btn:hover {
        background-color: var(--hover-bg);
    }

    /* --- NUEVOS ESTILOS PARA EL CONTENEDOR DE ERRORES --- */
    .auth-error-message-container {
        border: 2px solid var(--danger-color);
        border-radius: 8px;
        padding: 12px 16px;
        background-color: rgba(229, 57, 53, 0.05);
        display: none; /* Oculto por defecto */
    }

    .auth-error-message-container ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .auth-error-message-container li {
        color: var(--danger-color);
        font-size: 0.875rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        text-align: left;
    }

    .auth-error-message-container li::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--danger-color);
        margin-right: 8px;
        flex-shrink: 0;
    }
</style>

<div class="section-content <?php echo ($CURRENT_SECTION === 'login') ? 'active' : 'disabled'; ?>" data-section="login">
    <div class="auth-container">
        <h2 data-i18n="auth.loginTitle"></h2>
        <p data-i18n="auth.loginSubtitle"></p>
        <div class="auth-form" id="login-form">
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
            <div class="auth-error-message-container" id="login-error-container">
                <ul id="login-error-list"></ul>
            </div>
            <button class="load-more-btn" data-action="submit-login" data-i18n="auth.loginButton"></button>
        </div>
        <p class="auth-switch-prompt"><a href="#" data-action="toggleSectionRegister" data-i18n="auth.registerPrompt"></a></p>
    </div>
</div>