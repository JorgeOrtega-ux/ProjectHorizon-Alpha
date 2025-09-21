<div class="section-content <?php echo ($CURRENT_SECTION === 'history') ? 'active' : 'disabled'; ?>" data-section="history">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="toggleSectionHistoryPrivacy" data-tooltip="Volver">
                    <span class="material-symbols-rounded">arrow_back</span>
                </div>
                <div class="header-title-container">
                    <span>Mi historial</span>
                </div>
            </div>
            <div class="content-header-right">
                <div class="header-item" id="history-sorter">
                    <div class="select-wrapper body-title">
                        <div class="custom-select-trigger" data-action="toggle-select" data-target="history-select">
                            <div class="select-trigger-icon">
                                <span class="material-symbols-rounded">filter_list</span>
                            </div>
                            <span class="select-trigger-text">Vistos recientes</span>
                            <div class="select-trigger-icon select-trigger-arrow">
                                <span class="material-symbols-rounded">expand_more</span>
                            </div>
                        </div>
                        <div class="module-content module-select disabled" id="history-select">
                            <div class="menu-content">
                                <div class="menu-list">
                                    <div class="menu-link active" data-value="views">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">visibility</span></div>
                                        <div class="menu-link-text"><span>Vistos recientes</span></div>
                                    </div>
                                    <div class="menu-link" data-value="searches">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">search</span></div>
                                        <div class="menu-link-text"><span>Historial de búsqueda</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>
        <div class="history-paused-alert disabled">
            <span class="material-symbols-rounded">pause_circle</span>
            <span>El historial está pausado. No se guardará tu actividad.</span>
        </div>
        <div id="history-container">
            <div class="category-section" data-history-view="views">
                <div class="category-section-title">
                    <span class="material-symbols-rounded">person</span>
                    <span>Perfiles vistos recientemente</span>
                </div>
                <div class="card-grid" id="history-profiles-grid"></div>
            </div>
            <div class="category-section" data-history-view="views">
                <div class="category-section-title">
                    <span class="material-symbols-rounded">photo_camera</span>
                    <span>Fotos vistas recientemente</span>
                </div>
                <div class="card-grid" id="history-photos-grid"></div>
            </div>
            <div class="category-section" data-history-view="searches" style="display: none;">
                <div class="category-section-title">
                    <span class="material-symbols-rounded">search</span>
                    <span>Búsquedas Recientes</span>
                </div>
                <div id="history-searches-list"></div>
            </div>
        </div>
    </div>
</div>