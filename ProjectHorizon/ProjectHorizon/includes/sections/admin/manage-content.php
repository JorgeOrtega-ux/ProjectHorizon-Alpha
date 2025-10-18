<div class="section-content <?php echo ($CURRENT_SECTION === 'manageContent') ? 'active' : 'disabled'; ?>" data-section="manageContent">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="search-input-wrapper">
                    <div class="search-input-icon">
                        <span class="material-symbols-rounded">search</span>
                    </div>
                    <div class="search-input-text">
                        <input type="text" id="admin-gallery-search" data-i18n-placeholder="admin.manageContent.searchPlaceholder" maxlength="64">
                    </div>
                </div>
            </div>
            <div class="content-header-right">
                <button class="load-more-btn btn-primary" data-action="toggleSectionCreateGallery">
                    <span class="button-text" data-i18n="admin.manageContent.createButton"></span>
                </button>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
		<div class="settings-page-container">
			<div class="content-section header-section">
				<div class="item-details">
					<h2 data-i18n="admin.manageContent.title"></h2>
					<p data-i18n="admin.manageContent.description"></p>
				</div>
			</div>
			<div class="status-message-container disabled"></div>
			<div class="admin-list-container" id="admin-galleries-list">
				</div>
			<div class="load-more-container disabled" id="galleries-admin-load-more-container">
				<button class="load-more-btn" data-action="load-more-admin-galleries" data-i18n="home.showMore"></button>
			</div>
		</div>
    </div>
</div>