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

<div class="section-content <?php echo ($CURRENT_SECTION === 'register') ? 'active' : 'disabled'; ?>" data-section="register">
    <div class="auth-container">
        <h2 data-i18n="auth.registerTitle"></h2>
        <p data-i18n="auth.registerSubtitle"></p>
        <div class="auth-form" id="register-form">
            <input type="hidden" name="csrf_token" value="">
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
            <div class="auth-error-message-container" id="register-error-container">
                <ul id="register-error-list"></ul>
            </div>
            <button class="load-more-btn" data-action="submit-register" data-i18n="auth.registerButton"></button>
        </div>
        <p class="auth-switch-prompt"><a href="#" data-action="toggleSectionLogin" data-i18n="auth.loginPrompt"></a></p>
    </div>
</div>