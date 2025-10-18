<div class="section-content <?php echo ($CURRENT_SECTION === 'manageGalleryPhotos') ? 'active' : 'disabled'; ?>" data-section="manageGalleryPhotos">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="return-to-edit-gallery" data-i18n-tooltip="admin.manageGalleryPhotos.backButtonTooltip">
                    <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span id="manage-photos-title"></span>
                </div>
            </div>
            <div class="content-header-right">
                <input type="file" id="add-photos-input" multiple accept="image/*,video/*" style="display:none;">
                <button class="header-button" data-action="add-gallery-photos" data-i18n-tooltip="admin.manageGalleryPhotos.addPhotosButton">
                    <span class="material-symbols-rounded">add</span>
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
            <div class="status-message-container disabled" id="manage-content-status-container"></div>

            <div class="category-section" id="photos-management-section" style="display: none;">
                <div class="category-section-title">
                    <span class="material-symbols-rounded">photo_library</span>
                    <span data-i18n="userPhotos.showPhotos"></span>
                </div>
                <div class="photo-grid-edit" id="manage-photos-grid"></div>
            </div>

            <div class="category-section" id="videos-management-section" style="display: none;">
                <div class="category-section-title">
                    <span class="material-symbols-rounded">video_library</span>
                    <span data-i18n="userPhotos.showVideos"></span>
                </div>
                <div class="photo-grid-edit" id="manage-videos-grid"></div>
            </div>
        </div>
    </div>
</div>