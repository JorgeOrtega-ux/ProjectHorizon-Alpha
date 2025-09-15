<div class="module-content module-surface body-title disabled" data-module="moduleSurface">
    <div class="menu-content <?php echo ($CURRENT_VIEW === 'main') ? 'active' : 'disabled'; ?>" data-menu="main">
        <div class="menu-list">
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'home') ? 'active' : ''; ?>" data-action="toggleSectionHome">
                <div class="menu-link-icon"><span class="material-symbols-rounded">home</span></div>
                <div class="menu-link-text"><span>Pagina principal</span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'explore') ? 'active' : ''; ?>" data-action="toggleSectionExplore">
                <div class="menu-link-icon"><span class="material-symbols-rounded">explore</span></div>
                <div class="menu-link-text"><span>Explorar categorias</span></div>
            </div>
        </div>
    </div>

    <div class="menu-content <?php echo ($CURRENT_VIEW === 'settings') ? 'active' : 'disabled'; ?>" data-menu="settings">
        <div class="menu-list">
            <div class="menu-link" data-action="toggleMainView">
                <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_back</span></div>
                <div class="menu-link-text"><span>Volver a inicio</span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'accessibility') ? 'active' : ''; ?>" data-action="toggleSectionAccessibility">
                <div class="menu-link-icon"><span class="material-symbols-rounded">accessibility</span></div>
                <div class="menu-link-text"><span>Accesibilidad</span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'historyPrivacy') ? 'active' : ''; ?>" data-action="toggleSectionHistoryPrivacy">
                <div class="menu-link-icon"><span class="material-symbols-rounded">history</span></div>
                <div class="menu-link-text"><span>Historial y Privacidad</span></div>
            </div>
        </div>
    </div>
</div>