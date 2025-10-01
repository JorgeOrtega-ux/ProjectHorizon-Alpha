<div class="section-content <?php echo ($CURRENT_SECTION === 'historyPrivacy') ? 'active' : 'disabled'; ?>" data-section="historyPrivacy">
    <div class="settings-page-container">
        <div class="content-section header-section">
            <div class="item-details">
                <h2 data-i18n="settings.historyPrivacy.title"></h2>
                <p data-i18n="settings.historyPrivacy.description"></p>
            </div>
        </div>

        <div class="content-section data-group-section">
           <div class="data-item">
        <div class="view-container active">
            <div class="item-details">
                <h4 data-i18n="settings.historyPrivacy.saveViewsTitle"></h4>
                <p data-i18n="settings.historyPrivacy.saveViewsDescription"></p>
            </div>
            <div class="item-actions">
                <div class="toggle-switch active" data-setting="enable-view-history">
                    <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                </div>
            </div>
        </div>
    </div>

    <div class="data-item">
        <div class="view-container active">
            <div class="item-details">
                <h4 data-i18n="settings.historyPrivacy.saveSearchesTitle"></h4>
                <p data-i18n="settings.historyPrivacy.saveSearchesDescription"></p>
            </div>
            <div class="item-actions">
                <div class="toggle-switch active" data-setting="enable-search-history">
                    <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                </div>
            </div>
        </div>
    </div>
        </div>

        <div class="content-section content-section-stacked">
            <div class="item-details">
                <h4 data-i18n="settings.historyPrivacy.myHistoryTitle"></h4>
                <p data-i18n="settings.historyPrivacy.myHistoryDescription"></p>
            </div>
            <div class="item-actions">
                <button class="load-more-btn" data-action="toggleSectionHistory" data-i18n="settings.historyPrivacy.manageHistoryButton"></button>
            </div>
        </div>

        <div class="content-section content-section-stacked">
            <div class="item-details">
                <h4 data-i18n="settings.historyPrivacy.clearDataTitle"></h4>
                <p data-i18n="settings.historyPrivacy.clearDataDescription"></p>
            </div>
            <div class="item-actions">
                <button class="load-more-btn" data-action="clear-history" data-i18n="settings.historyPrivacy.clearHistoryButton"></button>
            </div>
        </div>
    </div>
</div>