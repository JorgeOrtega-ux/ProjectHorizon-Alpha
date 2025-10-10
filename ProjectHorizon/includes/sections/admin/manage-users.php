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
                <div id="batch-actions-container" class="header-item" style="display: none;">
                    <select id="batch-action-select" class="custom-select-trigger">
                        <option value="suspend">Suspender</option>
                        <option value="activate">Activar</option>
                        <option value="delete">Eliminar</option>
                    </select>
                    <button class="load-more-btn btn-primary" data-action="batch-action">Aplicar</button>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>
        <div class="admin-table-container">
            <table id="users-table" class="body-title">
                <thead>
                    <tr>
                        <th><input type="checkbox" id="select-all-users"></th>
                        <th data-i18n="admin.manageUsers.table.user"></th>
                        <th data-i18n="admin.manageUsers.table.role"></th>
                        <th data-i18n="admin.manageUsers.table.status"></th>
                        <th data-i18n="admin.manageUsers.table.created"></th>
                        <th data-i18n="admin.manageUsers.table.actionsTitle"></th>
                    </tr>
                </thead>
                <tbody>
                    </tbody>
            </table>
        </div>
        <div class="load-more-container disabled" id="users-admin-load-more-container">
            <button class="load-more-btn" data-action="load-more-admin-users" data-i18n="home.showMore"></button>
        </div>
    </div>
</div>