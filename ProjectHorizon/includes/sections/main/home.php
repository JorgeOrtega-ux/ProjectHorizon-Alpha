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
                        <div class="custom-select-trigger" data-action="toggle-select" data-target="relevance-select">
                            <div class="select-trigger-icon">
                                <span class="material-symbols-rounded">reorder</span>
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
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">reorder</span></div>
                                        <div class="menu-link-text"><span>Más relevante</span></div>
                                    </div>
                                    <div class="menu-link" data-value="newest">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">schedule</span></div>
                                        <div class="menu-link-text"><span>Ediciones más recientes</span></div>
                                    </div>
                                    <div class="menu-link" data-value="oldest">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">history</span></div>
                                        <div class="menu-link-text"><span>Más antiguos</span></div>
                                    </div>
                                    <div class="menu-link" data-value="alpha-asc">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">sort_by_alpha</span></div>
                                        <div class="menu-link-text"><span>Ordenar alfabéticamente (A-Z)</span></div>
                                    </div>
                                    <div class="menu-link" data-value="alpha-desc">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">sort_by_alpha</span></div>
                                        <div class="menu-link-text"><span>Ordenar alfabéticamente (Z-A)</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="header-item">
                   <div class="header-button">
                       <span class="material-symbols-rounded">view_list</span>
                   </div>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block">
       </div>
</div>