<div class="section-content <?php echo ($CURRENT_SECTION === 'accessibility') ? 'active' : 'disabled'; ?>" data-section="accessibility">
    <div class="settings-page-container">
        <div class="content-section header-section">
            <div class="item-details">
                <h2>Accesibilidad</h2>
                <p>Configura las opciones de accesibilidad para adaptar la interfaz a tus necesidades.</p>
            </div>
        </div>
        <div class="content-section select-section">
            <div class="item-details">
                <h4>Idioma</h4>
                <p>Elige tu idioma de preferencia para la interfaz.</p>
            </div>
            <div class="form-controls">
                <div class="select-wrapper body-title">
                    <div class="custom-select-trigger" data-action="toggle-select" data-target="language-select">
                        <div class="select-trigger-icon">
                            <span class="material-symbols-rounded">language</span>
                        </div>
                        <span class="select-trigger-text">Español (Latinoamérica)</span>
                        <div class="select-trigger-icon select-trigger-arrow">
                            <span class="material-symbols-rounded">expand_more</span>
                        </div>
                    </div>
                    <div class="module-content module-select disabled" id="language-select">
                        <div class="menu-content">
                            <div class="menu-list">
                                <div class="menu-link" data-value="es-LA">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div>
                                    <div class="menu-link-text"><span>Español (Latinoamérica)</span></div>
                                </div>
                                <div class="menu-link" data-value="en-US">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div>
                                    <div class="menu-link-text"><span>English (United States)</span></div>
                                </div>
                                <div class="menu-link" data-value="fr-FR">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div>
                                    <div class="menu-link-text"><span>Français (France)</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="content-section select-section">
            <div class="item-details">
                <h4>Tema</h4>
                <p>Personaliza la apariencia de tu cuenta. Selecciona un tema o sincroniza temas con las preferencias de tu sistema.</p>
            </div>
            <div class="form-controls">
                <div class="select-wrapper body-title">
                    <div class="custom-select-trigger" data-action="toggle-select" data-target="theme-select">
                        <div class="select-trigger-icon">
                            <span class="material-symbols-rounded">desktop_windows</span>
                        </div>
                        <span class="select-trigger-text">Sincronizar con el sistema</span>
                        <div class="select-trigger-icon select-trigger-arrow">
                            <span class="material-symbols-rounded">expand_more</span>
                        </div>
                    </div>
                    <div class="module-content module-select disabled" id="theme-select">
                        <div class="menu-content">
                            <div class="menu-list">
                                <div class="menu-link" data-value="system">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">desktop_windows</span></div>
                                    <div class="menu-link-text"><span>Sincronizar con el sistema</span></div>
                                </div>
                                <div class="menu-link" data-value="dark">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">dark_mode</span></div>
                                    <div class="menu-link-text"><span>Tema oscuro</span></div>
                                </div>
                                <div class="menu-link" data-value="light">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">light_mode</span></div>
                                    <div class="menu-link-text"><span>Tema claro</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="content-section data-group-section">
            <div class="data-item">
                <div class="view-container active">
                    <div class="item-details">
                        <h4>Abrir los enlaces en una pestaña nueva</h4>
                        <p>Al activar esta opción, todos los enlaces se abrirán en una nueva pestaña para no interrumpir tu navegación actual.</p>
                    </div>
                    <div class="item-actions">
                        <div class="toggle-switch" data-setting="open-links-in-new-tab">
                            <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="data-item">
                <div class="view-container active">
                    <div class="item-details">
                        <h4>Los atajos necesitan un modificador</h4>
                        <p>Para crear atajos, es necesario usar la tecla modificadora Alt.</p>
                    </div>
                    <div class="item-actions">
                        <div class="toggle-switch" data-setting="require-modifier-for-shortcuts">
                            <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>