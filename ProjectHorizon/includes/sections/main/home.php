<div class="section-content <?php echo ($CURRENT_SECTION === 'home') ? 'active' : 'disabled'; ?>" data-section="home">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="search-input-wrapper">
                    <div class="search-input-icon">
                        <span class="material-symbols-rounded">search</span>
                    </div>
                    <div class="search-input-text">
                        <input type="text" data-i18n-placeholder="home.searchInputPlaceholder" maxlength="64">
                    </div>
                </div>
            </div>
            <div class="content-header-right">
                <div class="header-item hide-on-mobile" id="relevance-sorter">
                    <div class="select-wrapper body-title">
                        <div class="custom-select-trigger" data-action="toggle-select" data-target="relevance-select">
                            <div class="select-trigger-icon">
                                <span class="material-symbols-rounded">swap_vert</span>
                            </div>
                            <span class="select-trigger-text" data-i18n="home.filterRelevant"></span>
                            <div class="select-trigger-icon select-trigger-arrow">
                                <span class="material-symbols-rounded">expand_more</span>
                            </div>
                        </div>
                        <div class="module-content module-select disabled" id="relevance-select">
                            <div class="menu-content">
                                <div class="menu-list">
                                    <div class="menu-link" data-value="relevant">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">star_shine</span></div>
                                        <div class="menu-link-text"><span data-i18n="home.filterRelevant"></span></div>
                                    </div>
                                    <div class="menu-link" data-value="newest">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">schedule</span></div>
                                        <div class="menu-link-text"><span data-i18n="home.filterNewest"></span></div>
                                    </div>
                                    <div class="menu-link" data-value="oldest">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">schedule</span></div>
                                        <div class="menu-link-text"><span data-i18n="home.filterOldest"></span></div>
                                    </div>
                                    <div class="menu-link" data-value="alpha-asc">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_upward</span></div>
                                        <div class="menu-link-text"><span data-i18n="home.filterAlphaAsc"></span></div>
                                    </div>
                                    <div class="menu-link" data-value="alpha-desc">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_downward</span></div>
                                        <div class="menu-link-text"><span data-i18n="home.filterAlphaDesc"></span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="header-item show-on-mobile">
                    <div class="header-button" data-action="toggle-select" data-target="relevance-select-mobile" data-i18n-tooltip="home.filterTooltip">
                        <span class="material-symbols-rounded">filter_list</span>
                    </div>
                    <div class="module-content module-select body-title disabled" id="relevance-select-mobile">
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>
        <div class="card-grid active" id="grid-view"></div>
        <div class="load-more-container disabled" id="users-load-more-container">
            <button class="load-more-btn" data-action="load-more-users" data-i18n="home.showMore"></button>
        </div>
    </div>
</div>