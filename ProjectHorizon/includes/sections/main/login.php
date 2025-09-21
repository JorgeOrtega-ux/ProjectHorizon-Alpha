<div class="section-content <?php echo ($CURRENT_SECTION === 'login') ? 'active' : 'disabled'; ?>" data-section="login">
    <div class="auth-container">
        <div class="auth-wrapper">
            <h1 class="auth-title">Iniciar Sesión</h1>
            <form id="login-form" class="auth-form" method="post">
                <div class="auth-input-wrapper">
                    <input class="auth-input" type="email" id="email-input" name="email" autocomplete="username" required placeholder=" ">
                    <label class="auth-label" for="email-input">Dirección de correo electrónico*</label>
                </div>
                <div class="auth-password-wrapper">
                    <input class="auth-input" type="password" id="password-input" name="password" autocomplete="current-password" required placeholder=" ">
                    <label class="auth-label" for="password-input">Contraseña*</label>
                    <span class="material-symbols-rounded" id="toggle-password" data-action="toggle-password-visibility">visibility</span>
                </div>
                <button class="auth-submit-btn" type="submit">Continuar</button>
            </form>
            <p class="auth-switch-page">¿No tienes una cuenta? <a data-action="toggleSectionRegister">Crear cuenta</a></p>
        </div>
    </div>
</div>