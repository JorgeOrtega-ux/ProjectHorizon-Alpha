<?php
// includes/sections/admin/gallery-stats.php
?>
<div class="section-content <?php echo ($CURRENT_SECTION === 'galleryStats') ? 'active' : 'disabled'; ?>" data-section="galleryStats">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="toggleSectionManageContent" data-i18n-tooltip="admin.galleryStats.backButtonTooltip">
                    <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span id="gallery-stats-title"></span>
                </div>
            </div>
            <div class="content-header-right">
                <button class="load-more-btn btn-primary" data-action="save-gallery-stats">
                    <span class="button-text" data-i18n="general.save"></span>
                    <div class="button-spinner"></div>
                </button>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="dashboard-container" id="gallery-stats-container" style="padding: 8px;">
            </div>
    </div>
</div>