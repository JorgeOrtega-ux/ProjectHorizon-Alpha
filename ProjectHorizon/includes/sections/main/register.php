<div class="section-content <?php echo ($CURRENT_SECTION === 'register') ? 'active' : 'disabled'; ?>" data-section="register">
    <div class="auth-container">
        <div class="auth-form">
            <h2>Crear Cuenta</h2>
            <p>Completa el siguiente formulario para registrarte.</p>
            <div class="form-field">
                <input type="text" id="register-name" placeholder=" ">
                <label for="register-name">Nombre Completo</label>
            </div>
            <div class="form-field">
                <input type="email" id="register-email" placeholder=" ">
                <label for="register-email">Correo Electrónico</label>
            </div>
            <div class="form-field">
                <input type="password" id="register-password" placeholder=" ">
                <label for="register-password">Contraseña</label>
            </div>
            <button class="auth-button">Registrarse</button>
            <p class="auth-link">¿Ya tienes una cuenta? <a href="#" data-action="navigateToLogin">Inicia sesión aquí</a>.</p>
        </div>
    </div>
</div>