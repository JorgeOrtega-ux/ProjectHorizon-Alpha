<div class="section-content <?php echo ($CURRENT_SECTION === 'trends') ? 'active' : 'disabled'; ?>" data-section="trends">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="search-input-wrapper">
                    <div class="search-input-icon">
                        <span class="material-symbols-rounded">search</span>
                    </div>
                    <div class="search-input-text">
                        <input type="text" data-i18n-placeholder="trends.searchInputPlaceholder" maxlength="64">
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>
        <div class="category-section">
            <div class="category-section-title">
                <span class="material-symbols-rounded">trending_up</span>
                <span data-i18n="trends.trendingUsers"></span>
            </div>
            <div class="card-grid" id="trending-users-grid">
                </div>
        </div>
        <div class="category-section" id="trending-photos-section" style="display: none;">
            <div class="category-section-title">
                <span class="material-symbols-rounded">photo_camera</span>
                <span data-i18n="trends.trendingPhotos"></span>
            </div>
            <div class="card-grid" id="trending-photos-grid">
                </div>
        </div>
        <div class="category-section" id="trending-videos-section" style="display: none;">
            <div class="category-section-title">
                <span class="material-symbols-rounded">videocam</span>
                <span data-i18n="trends.trendingVideos"></span>
            </div>
            <div class="card-grid" id="trending-videos-grid">
                </div>
        </div>
    </div>
</div>