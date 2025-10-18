<?php
// Inicia la sesión si aún no se ha hecho, para poder acceder a las variables de sesión.
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
$is_logged_in = isset($_SESSION['loggedin']) && $_SESSION['loggedin'] === true;
?>
<div class="header">
    <div class="header-left">
        <div class="header-item">
            <div class="header-button" data-action="toggleModuleSurface" data-i18n-tooltip="header.mainMenuTooltip">
                <span class="material-symbols-rounded">menu</span>
            </div>
        </div>
    </div>
    <div class="header-right">
        <div class="header-item">
            <div class="header-button <?php echo $is_logged_in ? 'disabled' : ''; ?>" id="help-btn" data-action="toggleHelp" data-i18n-tooltip="header.helpTooltip">
                <span class="material-symbols-rounded">help</span>
            </div>
            <div class="header-button <?php echo $is_logged_in ? 'disabled' : ''; ?>" id="settings-btn" data-action="toggleSettings" data-i18n-tooltip="header.settingsTooltip">
                <span class="material-symbols-rounded">settings</span>
            </div>

            <div id="auth-container-logged-out" class="header-item <?php echo $is_logged_in ? 'disabled' : ''; ?>">
                <button class="header-button login-btn" data-action="toggleAuth">
                    <span data-i18n="header.login"></span>
                </button>
            </div>

            <div id="auth-container-logged-in" class="header-item <?php echo !$is_logged_in ? 'disabled' : ''; ?>">
                <div class="header-button profile-btn" data-action="toggle-select" data-target="profile-menu" data-user-role="<?php echo isset($_SESSION['user_role']) ? $_SESSION['user_role'] : 'user'; ?>">
                    <span class="profile-initials"></span>
                </div>
                <div class="module-content module-select disabled body-title" id="profile-menu">
                    <div class="menu-content">
                        <div class="menu-list">
                             <div class="menu-link" data-action="toggleSettings">
                                <div class="menu-link-icon"><span class="material-symbols-rounded">settings</span></div>
                                <div class="menu-link-text"><span data-i18n="header.settings"></span></div>
                            </div>
                            <div class="menu-link admin-only" data-action="toggleAdminPanel" style="display: none;">
                                <div class="menu-link-icon"><span class="material-symbols-rounded">admin_panel_settings</span></div>
                                <div class="menu-link-text"><span data-i18n="header.adminPanel"></span></div>
                            </div>
                             <div class="menu-link" data-action="toggleHelp">
                                <div class="menu-link-icon"><span class="material-symbols-rounded">help</span></div>
                                <div class="menu-link-text"><span data-i18n="header.help"></span></div>
                            </div>
                            <div class="menu-link" data-action="logout">
                                <div class="menu-link-icon"><span class="material-symbols-rounded">logout</span></div>
                                <div class="menu-link-text"><span data-i18n="header.logout"></span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>
<style>
    .login-btn {
        width: auto;
        padding: 0 16px;
    }

    .login-btn span {
        font-size: 0.875rem;
        font-weight: 500;
    }

    .profile-btn {
        background-color: var(--primary-bg);
        font-size: 1rem;
        font-weight: 500;
    }

    .profile-initials {
        color: var(--text-color);
    }
    
    #profile-menu {
        left: auto;
        right: 0;
        top: calc(100% + 5px);
        /* --- ANCHO AJUSTADO --- */
        width: 325px;
    }
</style>