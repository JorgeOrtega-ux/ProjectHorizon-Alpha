<div class="section-content <?php echo ($CURRENT_SECTION === 'photoView') ? 'active' : 'disabled'; ?>" data-section="photoView">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="returnToPreviousView" data-i18n-tooltip="photoView.backButtonTooltip">
                <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span id="photo-view-user-title" data-i18n="photoView.userTitle"></span>
                </div>
            </div>
            <div class="content-header-center">
                <div class="header-button" data-action="toggle-play-pause" data-i18n-tooltip="photoView.playButtonTooltip" style="display: none;">
                    <span class="material-symbols-rounded">play_arrow</span>
                </div>
            </div>
            <div class="content-header-right">
                <div class="header-button" data-action="toggle-favorite" data-i18n-tooltip="photoView.favoriteButtonTooltip">
                    <span class="material-symbols-rounded">favorite</span>
                </div>
                <div class="header-button" data-action="toggle-photo-comments" data-i18n-tooltip="photoView.commentsButtonTooltip">
                    <span class="material-symbols-rounded">comment</span>
                </div>
                <div class="header-button" data-action="toggle-photo-options-menu" data-i18n-tooltip="photoView.optionsButtonTooltip">
                    <span class="material-symbols-rounded">more_vert</span>
                </div>
                <div class="module-content module-select photo-options-menu disabled body-title">
                    <div class="menu-content">
                        <div class="menu-list">
                            <div class="menu-link" data-action="rotate-photo-left">
                                <div class="menu-link-icon"><span class="material-symbols-rounded">rotate_left</span></div>
                                <div class="menu-link-text"><span data-i18n="photoView.rotateLeft"></span></div>
                            </div>
                            <div class="menu-link" data-action="rotate-photo-right">
                                <div class="menu-link-icon"><span class="material-symbols-rounded">rotate_right</span></div>
                                <div class="menu-link-text"><span data-i18n="photoView.rotateRight"></span></div>
                            </div>
                            <div class="menu-link" data-action="download-photo-view">
                                <div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div>
                                <div class="menu-link-text"><span data-i18n="photoView.download"></span></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="photo-nav-control">
                    <div class="photo-nav-button" data-action="previous-photo" data-i18n-tooltip="photoView.previousPhotoButtonTooltip">
                        <span class="material-symbols-rounded">chevron_left</span>
                    </div>
                    <div class="photo-nav-counter" id="photo-counter">1 / 1</div>
                    <div class="photo-nav-button" data-action="next-photo" data-i18n-tooltip="photoView.nextPhotoButtonTooltip">
                        <span class="material-symbols-rounded">chevron_right</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y" id="photo-view-block">
        <div class="photo-viewer-container">
            <img id="photo-viewer-image" src="" alt="Vista ampliada" style="display: none;">
            <video id="photo-viewer-video" controls style="display: none;"></video>
        </div>
    </div>
</div>