<div class="section-content <?php echo ($CURRENT_SECTION === 'manageUsers') ? 'active' : 'disabled'; ?>" data-section="manageUsers">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="search-input-wrapper">
                    <div class="search-input-icon">
                        <span class="material-symbols-rounded">search</span>
                    </div>
                    <div class="search-input-text">
                        <input type="text" id="admin-user-search" data-i18n-placeholder="admin.manageUsers.searchPlaceholder" maxlength="64">
                    </div>
                </div>
            </div>
            <div class="content-header-right">
                <div id="user-action-buttons" class="header-item"></div>
                <div class="header-item">
                    <div class="header-button" data-action="toggle-select" data-target="admin-users-filter-menu" data-i18n-tooltip="admin.manageUsers.filterTooltip">
                        <span class="material-symbols-rounded">filter_list</span>
                    </div>
             <div class="module-content module-select disabled" id="admin-users-filter-menu">
    <div class="menu-content">
        <div class="menu-list">
            <div class="menu-link" data-value="newest">
                <div class="menu-link-icon"><span class="material-symbols-rounded">schedule</span></div>
                <div class="menu-link-text"><span data-i18n="admin.manageUsers.filter.newest"></span></div>
            </div>
            <div class="menu-link" data-value="oldest">
                <div class="menu-link-icon"><span class="material-symbols-rounded">schedule</span></div>
                <div class="menu-link-text"><span data-i18n="admin.manageUsers.filter.oldest"></span></div>
            </div>
        </div>
    </div>
</div>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="settings-page-container">
            <div class="content-section header-section">
                <div class="item-details">
                    <h2 data-i18n="admin.manageUsers.title"></h2>
                    <p data-i18n="admin.manageUsers.description"></p>
                </div>
            </div>
            <div class="status-message-container disabled"></div>
            <div class="admin-list-container" id="admin-users-list">
                </div>
            <div class="load-more-container disabled" id="users-admin-load-more-container">
                <button class="load-more-btn" data-action="load-more-admin-users" data-i18n="home.showMore"></button>
            </div>
        </div>
    </div>
</div>