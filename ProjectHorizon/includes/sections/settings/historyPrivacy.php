<div class="section-content <?php echo ($CURRENT_SECTION === 'historyPrivacy') ? 'active' : 'disabled'; ?>" data-section="historyPrivacy">
    <div class="settings-page-container">
        <div class="content-section header-section">
            <div class="item-details">
                <h2>Historial y Privacidad</h2>
                <p>Gestiona tu historial de visualización y configura tus opciones de privacidad.</p>
            </div>
        </div>

        <div class="content-section data-group-section">
            <div class="data-item">
                <div class="view-container active">
                    <div class="item-details">
                        <h4>Activar historial de perfiles y fotos</h4>
                        <p>Guarda los perfiles y las fotos que has visto recientemente.</p>
                    </div>
                    <div class="item-actions">
                        <div class="toggle-switch" data-setting="enable-view-history">
                            <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="data-item">
                <div class="view-container active">
                    <div class="item-details">
                        <h4>Activar historial de búsqueda</h4>
                        <p>Guarda los términos que buscas en la aplicación.</p>
                    </div>
                    <div class="item-actions">
                        <div class="toggle-switch" data-setting="enable-search-history">
                            <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="content-section content-section-stacked">
            <div class="item-details">
                <h4>Mi historial</h4>
                <p>Consulta los perfiles, fotos y búsquedas que has realizado.</p>
            </div>
            <div class="item-actions">
                <button class="load-more-btn" data-action="toggleSectionHistory">Administrar mi historial</button>
            </div>
        </div>

        <div class="content-section content-section-stacked">
            <div class="item-details">
                <h4>Borrar datos de navegación</h4>
                <p>Elimina permanentemente todo tu historial de la aplicación.</p>
            </div>
            <div class="item-actions">
                <button class="load-more-btn" data-action="clear-history">Borrar historial</button>
            </div>
        </div>
    </div>
</div>