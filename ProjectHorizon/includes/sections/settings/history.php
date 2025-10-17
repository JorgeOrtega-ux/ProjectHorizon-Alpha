<div class="section-content <?php echo ($CURRENT_SECTION === 'history') ? 'active' : 'disabled'; ?>" data-section="history">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="toggleSectionHistoryPrivacy" data-i18n-tooltip="settings.history.backButtonTooltip">
                    <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span data-i18n="settings.history.title"></span>
                </div>
            </div>
            <div class="content-header-right">
                <div class="header-item" id="history-sorter">
                    <div class="select-wrapper body-title">
                        <div class="custom-select-trigger" data-action="toggle-select" data-target="history-select">
                            <div class="select-trigger-icon">
                                <span class="material-symbols-rounded">filter_list</span>
                            </div>
                            <span class="select-trigger-text" data-i18n="settings.history.filterRecentViews"></span>
                            <div class="select-trigger-icon select-trigger-arrow">
                                <span class="material-symbols-rounded">expand_more</span>
                            </div>
                        </div>
                        <div class="module-content module-select disabled" id="history-select">
                            <div class="menu-content">
                                <div class="menu-list">
                                    <div class="menu-link active" data-value="views">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">visibility</span></div>
                                        <div class="menu-link-text"><span data-i18n="settings.history.filterRecentViews"></span></div>
                                    </div>
                                    <div class="menu-link" data-value="searches">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">search</span></div>
                                        <div class="menu-link-text"><span data-i18n="settings.history.filterSearchHistory"></span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>
        <div class="history-paused-alert disabled">
            <span class="material-symbols-rounded">pause_circle</span>
            <span data-i18n="settings.history.historyPausedAlert"></span>
        </div>
        <div id="history-container">
            <div class="category-section" data-history-view="views">
                <div class="category-section-title">
                    <span class="material-symbols-rounded">person</span>
                    <span data-i18n="settings.history.recentProfiles"></span>
                </div>
                <div class="card-grid" id="history-profiles-grid"></div>
                <div class="load-more-container disabled" id="history-profiles-load-more"></div>
            </div>
            <div class="category-section" data-history-view="views">
                <div class="category-section-title">
                    <span class="material-symbols-rounded">photo_camera</span>
                    <span data-i18n="settings.history.recentPhotos"></span>
                </div>
                <div class="card-grid" id="history-photos-grid"></div>
                <div class="load-more-container disabled" id="history-photos-load-more"></div>
            </div>
            <div data-history-view="searches" style="display: none;">
                <div class="settings-page-container" style="padding: 0; max-width: none;">
                    <div class="content-section header-section">
                        <div class="item-details">
                            <h2 data-i18n="settings.history.recentSearches"></h2>
                        </div>
                    </div>
                    <div class="admin-list-container" id="history-searches-list"></div>
                    <div class="load-more-container disabled" id="history-searches-load-more"></div>
                </div>
            </div>
        </div>
    </div>
</div>