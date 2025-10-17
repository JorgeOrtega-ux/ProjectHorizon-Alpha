<div class="section-content <?php echo ($CURRENT_SECTION === 'historySearches') ? 'active' : 'disabled'; ?>" data-section="historySearches">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="toggleSectionHistoryPrivacy" data-tooltip="Volver">
                    <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span>Historial de Búsqueda</span>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="status-message-container disabled"></div>
        <div id="search-history-container">
        </div>
    </div>
</div>