<div class="section-content <?php echo ($CURRENT_SECTION === 'history') ? 'active' : 'disabled'; ?>" data-section="history">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="toggleSectionHistoryPrivacy">
                    <span class="material-symbols-rounded">arrow_back</span>
                </div>
                <div class="header-title-container">
                    <span>Mi historial</span>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>
        <div id="history-container">
            <div class="category-section">
                <div class="category-section-title">
                    <span class="material-symbols-rounded">person</span>
                    <span>Perfiles vistos recientemente</span>
                </div>
                <div class="card-grid" id="history-profiles-grid"></div>
            </div>
            <div class="category-section">
                <div class="category-section-title">
                    <span class="material-symbols-rounded">photo_camera</span>
                    <span>Fotos vistas recientemente</span>
                </div>
                <div class="card-grid" id="history-photos-grid"></div>
            </div>
        </div>
    </div>
</div>