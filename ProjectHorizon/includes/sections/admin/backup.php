<?php
// includes/sections/admin/backup.php
?>
<div class="section-content <?php echo ($CURRENT_SECTION === 'backup') ? 'active' : 'disabled'; ?>" data-section="backup">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-title-container">
                    <span data-i18n="admin.backup.title"></span>
                </div>
            </div>
            <div class="content-header-right" id="backup-action-buttons">
                <button class="load-more-btn btn-primary" data-action="create-backup">
                    <span class="button-text" data-i18n="admin.backup.createButton"></span>
                    <div class="button-spinner"></div>
                </button>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
		<div class="settings-page-container">
			<div class="content-section header-section">
				<div class="item-details">
					<h2 data-i18n="admin.backup.title"></h2>
					<p data-i18n="admin.backup.description"></p>
				</div>
			</div>
			<div class="status-message-container disabled"></div>
			<div class="admin-list-container" id="backups-list">
				</div>
		</div>
    </div>
</div>