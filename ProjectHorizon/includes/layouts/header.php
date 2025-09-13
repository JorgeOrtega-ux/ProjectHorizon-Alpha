<div class="header">
    <div class="header-left">
        <div class="header-item">
            <div class="header-button" data-action="toggleModuleSurface">
                <span class="material-symbols-rounded">menu</span>
            </div>
        </div>
    </div>
    <div class="header-right">
        <div class="header-item" id="user-session-container" style="display: none;">
            <div class="user-avatar-button" data-action="toggle-user-menu">
                <span id="user-initials"></span>
            </div>
            <div class="module-content module-select disabled" id="user-menu">
                <div class="menu-content">
                    <div class="menu-list">
                        <div class="menu-link" data-action="toggleSettings">
                            <div class="menu-link-icon"><span class="material-symbols-rounded">settings</span></div>
                            <div class="menu-link-text"><span>Configuración</span></div>
                        </div>
                        <div class="menu-link" data-action="logout">
                            <div class="menu-link-icon"><span class="material-symbols-rounded">logout</span></div>
                            <div class="menu-link-text"><span>Cerrar sesión</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="header-item" id="login-button-container">
            <div class="header-button" data-action="navigateToLogin">
                <span class="material-symbols-rounded">login</span>
            </div>
        </div>
    </div>
</div>