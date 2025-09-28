<div class="section-content <?php echo ($CURRENT_SECTION === 'adView') ? 'active' : 'disabled'; ?>" data-section="adView">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-title-container">
                    <span id="ad-title"></span>
                </div>
            </div>
            <div class="content-header-right">
                <div class="ad-timer-container">
                    <div id="ad-timer">5</div>
                </div>
                <button id="skip-ad-button" class="load-more-btn" disabled data-i18n="adView.skipAd"></button>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="ad-container">
            <h1 id="ad-content-title" data-i18n="adView.adContentTitle"></h1>
        </div>
    </div>
</div>