<div class="section-content <?php echo ($CURRENT_SECTION === 'userSpecificFavorites') ? 'active' : 'disabled'; ?>" data-section="userSpecificFavorites">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="returnToPreviousView" data-i18n-tooltip="userSpecificFavorites.backButtonTooltip">
                <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span id="user-specific-favorites-title" data-i18n="userSpecificFavorites.title"></span>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>
        <div class="category-section" id="user-specific-favorites-photos-section" style="display: none;">
            <div class="category-section-title">
                <span class="material-symbols-rounded">photo_library</span>
                <span data-i18n="favorites.favoritePhotos"></span>
            </div>
            <div class="card-grid" id="user-specific-favorites-photos-grid"></div>
        </div>
        <div class="category-section" id="user-specific-favorites-videos-section" style="display: none;">
            <div class="category-section-title">
                <span class="material-symbols-rounded">video_library</span>
                <span data-i18n="favorites.favoriteVideos"></span>
            </div>
            <div class="card-grid" id="user-specific-favorites-videos-grid"></div>
        </div>
    </div>
</div>