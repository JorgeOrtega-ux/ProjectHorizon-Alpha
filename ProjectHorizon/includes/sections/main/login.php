<div class="section-content <?php echo ($CURRENT_SECTION === 'login') ? 'active' : 'disabled'; ?>" data-section="login">
    <div class="auth-container">
        <div class="auth-form">
            <h2>Iniciar Sesión</h2>
            <p>Introduce tus credenciales para acceder a tu cuenta.</p>
            <div class="form-field">
                <input type="email" id="login-email" placeholder=" ">
                <label for="login-email">Correo Electrónico</label>
            </div>
            <div class="form-field">
                <input type="password" id="login-password" placeholder=" ">
                <label for="login-password">Contraseña</label>
            </div>
            <button class="auth-button login-button">Acceder</button>
            <p class="auth-link">¿No tienes una cuenta? <a href="#" data-action="navigateToRegister">Crea una aquí</a>.</p>
        </div>
    </div>
</div>