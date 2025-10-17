<?php
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
?>
<div class="module-content module-surface body-title disabled" data-module="moduleSurface">
    <div class="menu-content <?php echo ($CURRENT_VIEW === 'main') ? 'active' : 'disabled'; ?>" data-menu="main">
        <div class="menu-list">
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'home') ? 'active' : ''; ?>" data-action="toggleSectionHome">
                <div class="menu-link-icon"><span class="material-symbols-rounded">home</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.mainPage"></span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'trends') ? 'active' : ''; ?>" data-action="toggleSectionTrends">
                <div class="menu-link-icon"><span class="material-symbols-rounded">trending_up</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.trends"></span></div>
            </div>
            <div class="menu-link auth-required disabled <?php echo ($CURRENT_SECTION === 'favorites') ? 'active' : ''; ?>" data-action="toggleSectionFavorites">
                <div class="menu-link-icon"><span class="material-symbols-rounded">favorite</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.favorites"></span></div>
            </div>
        </div>
    </div>

    <div class="menu-content <?php echo ($CURRENT_VIEW === 'settings') ? 'active' : 'disabled'; ?>" data-menu="settings">
        <div class="menu-list">
            <div class="menu-link" data-action="toggleMainView">
                <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_back</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.backToHome"></span></div>
            </div>
            <div class="menu-link auth-required disabled <?php echo ($CURRENT_SECTION === 'yourProfile') ? 'active' : ''; ?>" data-action="toggleSectionYourProfile">
                <div class="menu-link-icon"><span class="material-symbols-rounded">person</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.yourProfile"></span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'accessibility') ? 'active' : ''; ?>" data-action="toggleSectionAccessibility">
                <div class="menu-link-icon"><span class="material-symbols-rounded">accessibility</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.accessibility"></span></div>
            </div>
            
            <div class="menu-link auth-required disabled <?php echo ($CURRENT_SECTION === 'loginSecurity') ? 'active' : ''; ?>" data-action="toggleSectionLoginSecurity">
                <div class="menu-link-icon"><span class="material-symbols-rounded">security</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.loginSecurity"></span></div>
            </div>

            <div class="menu-link auth-required disabled <?php echo ($CURRENT_SECTION === 'historyPrivacy') ? 'active' : ''; ?>" data-action="toggleSectionHistoryPrivacy">
                <div class="menu-link-icon"><span class="material-symbols-rounded">history</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.historyPrivacy"></span></div>
            </div>
        </div>
    </div>

    <div class="menu-content <?php echo ($CURRENT_VIEW === 'help') ? 'active' : 'disabled'; ?>" data-menu="help">
        <div class="menu-list">
            <div class="menu-link" data-action="toggleMainView">
                <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_back</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.backToHome"></span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'privacyPolicy') ? 'active' : ''; ?>" data-action="toggleSectionPrivacyPolicy">
                <div class="menu-link-icon"><span class="material-symbols-rounded">privacy_tip</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.privacyPolicy"></span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'termsConditions') ? 'active' : ''; ?>" data-action="toggleSectionTermsConditions">
                <div class="menu-link-icon"><span class="material-symbols-rounded">gavel</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.termsConditions"></span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'cookiePolicy') ? 'active' : ''; ?>" data-action="toggleSectionCookiePolicy">
                <div class="menu-link-icon"><span class="material-symbols-rounded">cookie</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.cookiePolicy"></span></div>
            </div>
            <div class="menu-link <?php echo ($CURRENT_SECTION === 'sendFeedback') ? 'active' : ''; ?>" data-action="toggleSectionSendFeedback">
                <div class="menu-link-icon"><span class="material-symbols-rounded">feedback</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.sendFeedback"></span></div>
            </div>
        </div>
    </div>

    <div class="menu-content <?php echo ($CURRENT_VIEW === 'admin') ? 'active' : 'disabled'; ?>" data-menu="admin">
        <div class="menu-list">
            <div class="menu-link" data-action="toggleMainView">
                <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_back</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.backToHome"></span></div>
            </div>

            <div class="menu-link admin-only disabled <?php echo ($CURRENT_SECTION === 'dashboard') ? 'active' : ''; ?>" data-action="toggleSectionDashboard">
                <div class="menu-link-icon"><span class="material-symbols-rounded">dashboard</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.dashboard"></span></div>
            </div>
            <div class="menu-link admin-only disabled <?php echo ($CURRENT_SECTION === 'manageUsers') ? 'active' : ''; ?>" data-action="toggleSectionManageUsers">
                <div class="menu-link-icon"><span class="material-symbols-rounded">manage_accounts</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.manageUsers"></span></div>
            </div>
            <div class="menu-link admin-only disabled <?php echo ($CURRENT_SECTION === 'manageContent') ? 'active' : ''; ?>" data-action="toggleSectionManageContent">
                <div class="menu-link-icon"><span class="material-symbols-rounded">folder_managed</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.manageContent"></span></div>
            </div>
            <div class="menu-link moderator-only disabled <?php echo ($CURRENT_SECTION === 'manageComments') ? 'active' : ''; ?>" data-action="toggleSectionManageComments">
                <div class="menu-link-icon"><span class="material-symbols-rounded">comment</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.manageComments"></span></div>
            </div>
            <div class="menu-link admin-only disabled <?php echo ($CURRENT_SECTION === 'manageFeedback') ? 'active' : ''; ?>" data-action="toggleSectionManageFeedback">
                <div class="menu-link-icon"><span class="material-symbols-rounded">rate_review</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.manageFeedback"></span></div>
            </div>
            <div class="menu-link admin-only disabled <?php echo ($CURRENT_SECTION === 'manageLogs') ? 'active' : ''; ?>" data-action="toggleSectionManageLogs">
                <div class="menu-link-icon"><span class="material-symbols-rounded">description</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.manageLogs"></span></div>
            </div>
            
        </div>
        <div class="menu-list">
             <div class="menu-link admin-only disabled <?php echo ($CURRENT_SECTION === 'backup') ? 'active' : ''; ?>" data-action="toggleSectionBackup">
                <div class="menu-link-icon"><span class="material-symbols-rounded">backup</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.backup"></span></div>
            </div>

            <div class="menu-link admin-only disabled <?php echo ($CURRENT_SECTION === 'generalSettings') ? 'active' : ''; ?>" data-action="toggleSectionGeneralSettings">
                <div class="menu-link-icon"><span class="material-symbols-rounded">dns</span></div>
                <div class="menu-link-text"><span data-i18n="moduleSurface.serverSettings"></span></div>
            </div>
        </div>
    </div>
</div>