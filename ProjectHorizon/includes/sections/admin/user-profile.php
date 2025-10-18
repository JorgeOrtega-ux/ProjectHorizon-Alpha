<div class="section-content <?php echo ($CURRENT_SECTION === 'userProfile') ? 'active' : 'disabled'; ?>" data-section="userProfile">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="toggleSectionManageUsers" data-i18n-tooltip="admin.userProfile.backButtonTooltip">
                    <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span id="user-profile-title" data-i18n="admin.userProfile.title"></span>
                </div>
            </div>
            <div class="content-header-right">
                <div class="header-item">
                    <button class="header-button" data-action="toggle-select" data-target="user-profile-actions-menu" data-i18n-tooltip="admin.userProfile.actionsTooltip">
                        <span class="material-symbols-rounded">more_vert</span>
                    </button>
                    <div class="module-content module-select disabled" id="user-profile-actions-menu">
                        <div class="menu-content">
                            <div class="menu-list">
                                <div class="menu-link" data-action="add-sanction">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">gavel</span></div>
                                    <div class="menu-link-text"><span data-i18n="admin.userProfile.actions.sanction"></span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y" id="user-profile-container">
        </div>
</div>