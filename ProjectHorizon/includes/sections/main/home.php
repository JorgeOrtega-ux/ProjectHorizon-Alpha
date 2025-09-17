<div class="section-content <?php echo ($CURRENT_SECTION === 'home') ? 'active' : 'disabled'; ?>" data-section="home">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="search-input-wrapper">
                    <div class="search-input-icon">
                        <span class="material-symbols-rounded">search</span>
                    </div>
                    <div class="search-input-text">
                        <input type="text" placeholder="Buscar...">
                    </div>
                </div>
            </div>
            <div class="content-header-right">
                <div class="header-item">
                    <div class="select-wrapper body-title">
                        <div class="custom-select-trigger" data-action="toggle-select" data-target="view-select">
                            <div class="select-trigger-icon">
                                <span class="material-symbols-rounded">pageview</span>
                            </div>
                            <span class="select-trigger-text">Página principal</span>
                            <div class="select-trigger-icon select-trigger-arrow">
                                <span class="material-symbols-rounded">expand_more</span>
                            </div>
                        </div>
                        <div class="module-content module-select disabled" id="view-select">
                            <div class="menu-content">
                                <div class="menu-list">
                                    <div class="menu-link" data-value="home">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">home</span></div>
                                        <div class="menu-link-text"><span>Página principal</span></div>
                                    </div>
                                    <div class="menu-link" data-value="favorites">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">favorite</span></div>
                                        <div class="menu-link-text"><span>Mostrar favoritos</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="header-item" id="relevance-sorter">
                    <div class="select-wrapper body-title">
                        <div class="custom-select-trigger" data-action="toggle-select" data-target="relevance-select">
                            <div class="select-trigger-icon">
                                <span class="material-symbols-rounded">swap_vert</span>
                            </div>
                            <span class="select-trigger-text">Más relevante</span>
                            <div class="select-trigger-icon select-trigger-arrow">
                                <span class="material-symbols-rounded">expand_more</span>
                            </div>
                        </div>
                        <div class="module-content module-select disabled" id="relevance-select">
                            <div class="menu-content">
                                <div class="menu-list">
                                    <div class="menu-link" data-value="relevant">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">star_shine</span></div>
                                        <div class="menu-link-text"><span>Más relevante</span></div>
                                    </div>
                                    <div class="menu-link" data-value="newest">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">schedule</span></div>
                                        <div class="menu-link-text"><span>Ediciones más recientes</span></div>
                                    </div>
                                    <div class="menu-link" data-value="oldest">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">schedule</span></div>
                                        <div class="menu-link-text"><span>Ediciones más antiguas</span></div>
                                    </div>
                                    <div class="menu-link" data-value="alpha-asc">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_upward</span></div>
                                        <div class="menu-link-text"><span>Ordenar alfabéticamente (A-Z)</span></div>
                                    </div>
                                    <div class="menu-link" data-value="alpha-desc">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_downward</span></div>
                                        <div class="menu-link-text"><span>Ordenar alfabéticamente (Z-A)</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="header-item">
                    <div class="header-button" data-action="toggle-view">
                        <span class="material-symbols-rounded">view_list</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>
        <div class="card-grid active" id="grid-view"></div>

        <div class="table-view-container body-title disabled" id="table-view">
            <table class="user-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Privacidad</th>
                        <th>Tipo</th>
                        <th>Editado</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        </div>
        <div class="load-more-container disabled" id="users-load-more-container">
            <button class="load-more-btn" data-action="load-more-users">Mostrar más</button>
        </div>
    </div>
</div>