<div class="section-content <?php echo ($CURRENT_SECTION === 'register') ? 'active' : 'disabled'; ?>" data-section="register">
    <div class="auth-container">
        <div class="auth-wrapper">
            <h1 class="auth-title">Crear Cuenta</h1>
            <form id="register-form" class="auth-form" method="post">
                 <div class="auth-input-wrapper">
                    <input class="auth-input" type="text" id="name-input" name="name" autocomplete="name" required placeholder=" ">
                    <label class="auth-label" for="name-input">Nombre*</label>
                </div>
                <div class="auth-input-wrapper">
                    <input class="auth-input" type="email" id="email-input" name="email" autocomplete="username" required placeholder=" ">
                    <label class="auth-label" for="email-input">Dirección de correo electrónico*</label>
                </div>
                <div class="auth-password-wrapper">
                    <input class="auth-input" type="password" id="password-input" name="password" autocomplete="new-password" required placeholder=" ">
                    <label class="auth-label" for="password-input">Contraseña*</label>
                    <span class="material-symbols-rounded" id="toggle-password" data-action="toggle-password-visibility">visibility</span>
                </div>
                <button class="auth-submit-btn" type="submit">Crear Cuenta</button>
            </form>
            <p class="auth-switch-page">¿Ya tienes una cuenta? <a data-action="toggleSectionLogin">Iniciar sesión</a></p>
        </div>
    </div>
</div>