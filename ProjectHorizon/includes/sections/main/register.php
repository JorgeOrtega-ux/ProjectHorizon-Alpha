<div class="section-content <?php echo ($CURRENT_SECTION === 'register') ? 'active' : 'disabled'; ?>" data-section="register">
    <div class="auth-container">
        <div class="auth-form">
            <h2>Crear Cuenta</h2>
            <p>Completa el siguiente formulario para registrarte.</p>
            <div class="form-field">
                <label for="register-name">Nombre Completo</label>
                <input type="text" id="register-name" placeholder="Tu nombre completo">
            </div>
            <div class="form-field">
                <label for="register-email">Correo Electrónico</label>
                <input type="email" id="register-email" placeholder="tucorreo@ejemplo.com">
            </div>
            <div class="form-field">
                <label for="register-password">Contraseña</label>
                <input type="password" id="register-password" placeholder="Crea una contraseña segura">
            </div>
            <button class="auth-button">Registrarse</button>
            <p class="auth-link">¿Ya tienes una cuenta? <a href="#" data-action="navigateToLogin">Inicia sesión aquí</a>.</p>
        </div>
    </div>
</div>