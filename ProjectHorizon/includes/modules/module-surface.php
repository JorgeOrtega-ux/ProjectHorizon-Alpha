<div class="module-content module-surface body-title disabled" data-module="moduleSurface">
    <div class="menu-content <?php echo ($CURRENT_VIEW === 'main') ? 'active' : 'disabled'; ?>" data-menu="main">
        <div class="menu-list">
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'home') ? 'active' : ''; ?>" data-action="toggleSectionHome">
                <div class="menu-link-icon"><span class="material-symbols-rounded">home</span></div>
                <div class="menu-link-text"><span>Pagina principal</span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'trends') ? 'active' : ''; ?>" data-action="toggleSectionTrends">
                <div class="menu-link-icon"><span class="material-symbols-rounded">trending_up</span></div>
                <div class="menu-link-text"><span>Explorar tendencias</span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'favorites') ? 'active' : ''; ?>" data-action="toggleSectionFavorites">
                <div class="menu-link-icon"><span class="material-symbols-rounded">favorite</span></div>
                <div class="menu-link-text"><span>Mis favoritos</span></div>
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

    <div class="menu-content <?php echo ($CURRENT_VIEW === 'help') ? 'active' : 'disabled'; ?>" data-menu="help">
        <div class="menu-list">
            <div class="menu-link" data-action="toggleMainView">
                <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_back</span></div>
                <div class="menu-link-text"><span>Volver a inicio</span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'privacyPolicy') ? 'active' : ''; ?>" data-action="toggleSectionPrivacyPolicy">
                <div class="menu-link-icon"><span class="material-symbols-rounded">privacy_tip</span></div>
                <div class="menu-link-text"><span>Política de Privacidad</span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'termsConditions') ? 'active' : ''; ?>" data-action="toggleSectionTermsConditions">
                <div class="menu-link-icon"><span class="material-symbols-rounded">gavel</span></div>
                <div class="menu-link-text"><span>Términos y Condiciones</span></div>
            </div>
             <div class="menu-link <?php echo ($CURRENT_SECTION === 'cookiePolicy') ? 'active' : ''; ?>" data-action="toggleSectionCookiePolicy">
                <div class="menu-link-icon"><span class="material-symbols-rounded">cookie</span></div>
                <div class="menu-link-text"><span>Política de Cookies</span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'sendFeedback') ? 'active' : ''; ?>" data-action="toggleSectionSendFeedback">
                <div class="menu-link-icon"><span class="material-symbols-rounded">feedback</span></div>
                <div class="menu-link-text"><span>Enviar Comentarios</span></div>
            </div>
        </div>
    </div>
</div>