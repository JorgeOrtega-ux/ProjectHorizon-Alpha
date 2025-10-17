<div class="section-content <?php echo ($CURRENT_SECTION === 'createGallery') ? 'active' : 'disabled'; ?>" data-section="createGallery">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="toggleSectionManageContent" data-i18n-tooltip="admin.createGallery.backButtonTooltip">
                    <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span id="create-gallery-title" data-i18n="admin.createGallery.title"></span>
                </div>
            </div>
            <div class="content-header-right">
                <button class="load-more-btn btn-primary" data-action="create-gallery-submit">
                    <span class="button-text" data-i18n="admin.createGallery.createButton"></span>
                    <div class="button-spinner"></div>
                </button>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="edit-gallery-container" id="create-gallery-form-container">
            </div>
    </div>
</div>