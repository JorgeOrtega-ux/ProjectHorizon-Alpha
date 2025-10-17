<div class="section-content <?php echo ($CURRENT_SECTION === 'galleryPhotos') ? 'active' : 'disabled'; ?>" data-section="galleryPhotos">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="returnToPreviousView" data-i18n-tooltip="userPhotos.backButtonTooltip">
                <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="gallery-header-info">
                    <div class="gallery-header-avatar"></div>
                    <div class="gallery-header-details">
                        <h2 class="gallery-header-name"></h2>
                        <div class="gallery-header-stats">
                            <div class="stat-badge">
                                <span class="material-symbols-rounded">favorite</span>
                                <span class="stat-value" id="gallery-total-likes">0</span>
                            </div>
                            <div class="stat-badge">
                                <span class="material-symbols-rounded">visibility</span>
                                <span class="stat-value" id="gallery-total-interactions">0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="content-header-right">
                <div class="header-item">
                    <div class="header-button" data-action="toggle-select" data-target="gallery-filter-menu" data-i18n-tooltip="userPhotos.filterTooltip">
                        <span class="material-symbols-rounded">filter_list</span>
                    </div>
                    <div class="module-content module-select disabled body-title" id="gallery-filter-menu">
                        <div class="menu-content">
                            <div class="menu-list">
                                <div class="menu-link active" data-filter="all">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">collections</span></div>
                                    <div class="menu-link-text"><span data-i18n="userPhotos.showAll"></span></div>
                                </div>
                                <div class="menu-link" data-filter="photos">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">photo_library</span></div>
                                    <div class="menu-link-text"><span data-i18n="userPhotos.showPhotos"></span></div>
                                </div>
                                <div class="menu-link" data-filter="videos">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">video_library</span></div>
                                    <div class="menu-link-text"><span data-i18n="userPhotos.showVideos"></span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="load-more-btn btn-primary" id="follow-gallery-btn" data-action="toggle-follow">
                    <span class="button-text" data-i18n="userPhotos.followButton"></span>
                    <div class="button-spinner"></div>
                </button>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>

        <div class="category-section" id="photos-section" style="display: none;">
            <div class="category-section-title">
                <span class="material-symbols-rounded">photo_library</span>
                <span data-i18n="userPhotos.showPhotos"></span>
            </div>
            <div class="card-grid" id="user-photos-grid"></div>
        </div>

        <div class="category-section" id="videos-section" style="display: none;">
            <div class="category-section-title">
                <span class="material-symbols-rounded">video_library</span>
                <span data-i18n="userPhotos.showVideos"></span>
            </div>
            <div class="card-grid" id="user-videos-container"></div>
        </div>

        <div class="load-more-container disabled" id="photos-load-more-container">
            <button class="load-more-btn" data-action="load-more-photos" data-i18n="userPhotos.showMore"></button>
        </div>
    </div>
</div>