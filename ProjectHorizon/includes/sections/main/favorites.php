<div class="section-content <?php echo ($CURRENT_SECTION === 'favorites') ? 'active' : 'disabled'; ?>" data-section="favorites">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="select-wrapper body-title">
                    <div class="custom-select-trigger" data-action="toggle-select" data-target="view-select-fav">
                        <div class="select-trigger-icon">
                            <span class="material-symbols-rounded">favorite</span>
                        </div>
                        <span class="select-trigger-text">Mostrar favoritos</span>
                        <div class="select-trigger-icon select-trigger-arrow">
                            <span class="material-symbols-rounded">expand_more</span>
                        </div>
                    </div>
                    <div class="module-content module-select disabled" id="view-select-fav">
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
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="card-grid active" id="favorites-grid-view">
            </div>
    </div>
</div>