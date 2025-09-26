<div class="section-content <?php echo ($CURRENT_SECTION === 'galleryPhotos') ? 'active' : 'disabled'; ?>" data-section="galleryPhotos">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="returnToHome" data-i18n-tooltip="userPhotos.backButtonTooltip">
                    <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span id="user-photos-title" data-i18n="userPhotos.title"></span>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>
        <div class="card-grid active" id="user-photos-grid">
        </div>

        <div class="load-more-container disabled" id="photos-load-more-container">
            <button class="load-more-btn" data-action="load-more-photos" data-i18n="userPhotos.showMore"></button>
        </div>
    </div>
</div>