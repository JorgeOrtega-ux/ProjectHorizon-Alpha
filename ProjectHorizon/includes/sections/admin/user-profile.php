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
                <button class="load-more-btn btn-danger" data-action="add-sanction">
                    <span class="button-text" data-i18n="admin.userProfile.sanctionButton"></span>
                </button>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y" id="user-profile-container">
        </div>
</div>