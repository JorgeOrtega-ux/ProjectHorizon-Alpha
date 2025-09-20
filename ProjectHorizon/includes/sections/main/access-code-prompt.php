<div class="section-content <?php echo ($CURRENT_SECTION === 'accessCodePrompt') ? 'active' : 'disabled'; ?>" data-section="accessCodePrompt">
    <div class="access-code-container">
        <h2 id="access-code-title">Galería Privada</h2>
        <p>Para ver las fotos de este usuario, por favor, introduce el código de acceso.</p>
        <div class="access-code-form">
            <input type="text" id="access-code-input" placeholder="XXXX-XXXX" maxlength="9">
            <button id="access-code-submit" class="load-more-btn" data-action="access-code-submit">Acceder</button>
        </div>
        <p id="access-code-error" class="error-message"></p>
        <div class="header-button" data-action="returnToHome" style="margin-top: 20px;">
            <span class="material-symbols-rounded">arrow_back</span>
            <span>Volver a la página principal</span>
        </div>
    </div>
</div>