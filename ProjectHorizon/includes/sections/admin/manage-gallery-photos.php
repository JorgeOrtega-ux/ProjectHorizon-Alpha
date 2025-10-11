<div class="section-content <?php echo ($CURRENT_SECTION === 'manageGalleryPhotos') ? 'active' : 'disabled'; ?>" data-section="manageGalleryPhotos">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" id="back-to-edit-gallery-btn" data-i18n-tooltip="admin.manageGalleryPhotos.backButtonTooltip">
                    <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span id="manage-photos-title"></span>
                </div>
            </div>
            <div class="content-header-right">
                <input type="file" id="add-photos-input" multiple accept="image/*" style="display:none;">
                <button class="load-more-btn" data-action="add-gallery-photos">
                    <span class="button-text" data-i18n="admin.manageGalleryPhotos.addPhotosButton"></span>
                </button>
                <button class="load-more-btn btn-primary" data-action="save-gallery-photo-changes">
                    <span class="button-text" data-i18n="admin.editGallery.saveButton"></span>
                    <div class="button-spinner"></div>
                </button>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="edit-gallery-container">
            <div class="photo-grid-edit" id="manage-photos-grid">
                </div>
        </div>
    </div>
</div>