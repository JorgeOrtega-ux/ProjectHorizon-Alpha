<div class="section-content <?php echo ($CURRENT_SECTION === 'galleryPhotos') ? 'active' : 'disabled'; ?>" data-section="galleryPhotos">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="returnToHome" data-i18n-tooltip="userPhotos.backButtonTooltip">
                    <span class="material-symbols-rounded">arrow_left</span>
                </div>
            </div>
        </div>
    </div>
    <div class="profile-banner-container" id="gallery-profile-banner">
        <div class="profile-banner-main">
            <div class="profile-banner-avatar"></div>
            <div class="profile-banner-info">
                <h2 class="profile-banner-name"></h2>
                <div class="profile-banner-socials">
                    <a href="#" class="social-badge"><span>Facebook</span></a>
                    <a href="#" class="social-badge"><span>Twitter</span></a>
                    <a href="#" class="social-badge"><span>Instagram</span></a>
                    <a href="#" class="social-badge"><span>YouTube</span></a>
                    <a href="#" class="social-badge"><span>Twitch</span></a>
                </div>
            </div>
            <div class="profile-banner-actions">
                <button class="load-more-btn btn-primary">Seguir</button>
            </div>
        </div>
        <div class="profile-banner-stats">
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
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>
        <div class="card-grid active" id="user-photos-grid">
        </div>
        <div class="load-more-container disabled" id="photos-load-more-container">
            <button class="load-more-btn" data-action="load-more-photos" data-i18n="userPhotos.showMore"></button>
        </div>
    </div>
</div>