<div class="section-content <?php echo ($CURRENT_SECTION === 'favorites') ? 'active' : 'disabled'; ?>" data-section="favorites">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="search-input-wrapper" id="favorites-search-wrapper">
                    <div class="search-input-icon">
                        <span class="material-symbols-rounded">search</span>
                    </div>
                    <div class="search-input-text">
                        <input type="text" id="favorites-search-input" placeholder="Buscar en favoritos...">
                    </div>
                </div>
            </div>
            <div class="content-header-right" id="favorites-controls-wrapper">
                <div class="header-item hide-on-mobile" id="favorites-sorter">
                    <div class="select-wrapper body-title">
                        <div class="custom-select-trigger" data-action="toggle-select" data-target="favorites-sort-select">
                            <div class="select-trigger-icon">
                                <span class="material-symbols-rounded">swap_vert</span>
                            </div>
                            <span class="select-trigger-text">Agrupar por usuario</span>
                            <div class="select-trigger-icon select-trigger-arrow">
                                <span class="material-symbols-rounded">expand_more</span>
                            </div>
                        </div>
                        <div class="module-content module-select disabled" id="favorites-sort-select">
                            <div class="menu-content">
                                <div class="menu-list">
                                    <div class="menu-link" data-value="newest">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">schedule</span></div>
                                        <div class="menu-link-text"><span>Agregados recientemente</span></div>
                                    </div>
                                    <div class="menu-link" data-value="oldest">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">schedule</span></div>
                                        <div class="menu-link-text"><span>Agregados antiguamente</span></div>
                                    </div>
                                    <div class="menu-link" data-value="user">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">person</span></div>
                                        <div class="menu-link-text"><span>Agrupar por usuario</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="header-item show-on-mobile">
                    <div class="header-button" data-action="toggle-select" data-target="favorites-sort-select-mobile">
                        <span class="material-symbols-rounded">filter_list</span>
                    </div>
                    <div class="module-content module-select disabled" id="favorites-sort-select-mobile">
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>
        <div class="card-grid active" id="favorites-grid-view">
        </div>
        <div class="card-grid disabled" id="favorites-grid-view-by-user">
        </div>
    </div>
</div>