<?php
// includes/sections/admin/manage-feedback.php
?>
<div class="section-content <?php echo ($CURRENT_SECTION === 'manageFeedback') ? 'active' : 'disabled'; ?>" data-section="manageFeedback">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="search-input-wrapper">
                    <div class="search-input-icon">
                        <span class="material-symbols-rounded">search</span>
                    </div>
                    <div class="search-input-text">
                        <input type="text" id="admin-feedback-search" data-i18n-placeholder="admin.manageFeedback.searchPlaceholder" maxlength="64">
                    </div>
                </div>
            </div>
            <div class="content-header-right">
                </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>
        <div class="admin-table-container">
            <table id="feedback-table" class="body-title">
                <thead>
                    <tr>
                        <th data-i18n="admin.manageFeedback.table.type"></th>
                        <th data-i18n="admin.manageFeedback.table.title"></th>
                        <th data-i18n="admin.manageFeedback.table.description"></th>
                        <th data-i18n="admin.manageFeedback.table.attachments"></th>
                        <th data-i18n="admin.manageFeedback.table.date"></th>
                    </tr>
                </thead>
                <tbody>
                    </tbody>
            </table>
        </div>
        <div class="load-more-container disabled" id="feedback-admin-load-more-container">
            <button class="load-more-btn" data-action="load-more-admin-feedback" data-i18n="home.showMore"></button>
        </div>
    </div>
</div>