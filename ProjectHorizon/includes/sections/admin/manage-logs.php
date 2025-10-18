<?php
// includes/sections/admin/manage-logs.php
?>
<div class="section-content <?php echo ($CURRENT_SECTION === 'manageLogs') ? 'active' : 'disabled'; ?>" data-section="manageLogs">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="search-input-wrapper">
                    <div class="search-input-icon">
                        <span class="material-symbols-rounded">search</span>
                    </div>
                    <div class="search-input-text">
                        <input type="text" id="admin-logs-search" data-i18n-placeholder="admin.manageLogs.searchPlaceholder" maxlength="64">
                    </div>
                </div>
            </div>
            <div class="content-header-right">
                </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
		<div class="settings-page-container">
			<div class="content-section header-section">
				<div class="item-details">
					<h2 data-i18n="admin.manageLogs.title"></h2>
					<p data-i18n="admin.manageLogs.description"></p>
				</div>
			</div>
			<div class="status-message-container disabled"></div>
			<div class="admin-list-container" id="logs-list">
				</div>
		</div>
    </div>
</div>