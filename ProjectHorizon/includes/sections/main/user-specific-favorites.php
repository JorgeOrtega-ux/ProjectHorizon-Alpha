<div class="section-content <?php echo ($CURRENT_SECTION === 'userSpecificFavorites') ? 'active' : 'disabled'; ?>" data-section="userSpecificFavorites">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="returnToFavorites" data-i18n-tooltip="userSpecificFavorites.backButtonTooltip">
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
        <div class="card-grid active" id="user-specific-favorites-grid">
        </div>
    </div>
</div>