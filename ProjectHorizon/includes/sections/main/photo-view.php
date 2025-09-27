<div class="section-content <?php echo ($CURRENT_SECTION === 'photoView') ? 'active' : 'disabled'; ?>" data-section="photoView">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="returnToUserPhotos" data-i18n-tooltip="photoView.backButtonTooltip">
                    <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span id="photo-view-user-title" data-i18n="photoView.userTitle"></span>
                </div>
            </div>
            <div class="content-header-center">

            </div>
            <div class="content-header-right">
                <div class="header-button" data-action="toggle-favorite">
                    <span class="material-symbols-rounded">favorite</span>
                </div>
                <div class="header-button" data-action="toggle-photo-options-menu">
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
                    <div class="photo-nav-button" data-action="previous-photo">
                        <span class="material-symbols-rounded">chevron_left</span>
                    </div>
                    <div class="photo-nav-counter" id="photo-counter">1 / 1</div>
                    <div class="photo-nav-button" data-action="next-photo">
                        <span class="material-symbols-rounded">chevron_right</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y" id="photo-view-block">
        <div class="photo-viewer-container">
            <img id="photo-viewer-image" src="" alt="Vista ampliada">
        </div>
    </div>
</div>