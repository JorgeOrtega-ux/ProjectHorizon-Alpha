<?php
// includes/sections/admin/view-comment-reports.php
?>
<div class="section-content <?php echo ($CURRENT_SECTION === 'viewCommentReports') ? 'active' : 'disabled'; ?>" data-section="viewCommentReports">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="toggleSectionManageComments" data-i18n-tooltip="admin.viewCommentReports.backButtonTooltip">
                    <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span id="view-reports-title"></span>
                </div>
            </div>
            <div class="content-header-right">
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="settings-page-container" id="view-reports-container">
            </div>
    </div>
</div>