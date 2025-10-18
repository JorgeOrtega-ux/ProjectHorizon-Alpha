<?php
// includes/sections/admin/view-log.php
$filename = isset($ROUTE_DATA) && $ROUTE_DATA ? json_decode($ROUTE_DATA, true)['filename'] : '';
?>
<div class="section-content <?php echo ($CURRENT_SECTION === 'viewLog') ? 'active' : 'disabled'; ?>" data-section="viewLog">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="toggleSectionManageLogs" data-i18n-tooltip="admin.manageLogs.backButtonTooltip">
                    <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span><?php echo htmlspecialchars($filename); ?></span>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="log-viewer-container">
            <pre><code id="log-content"></code></pre>
        </div>
    </div>
</div>
<style>
.log-viewer-container {
    width: 100%;
    height: 100%;
    padding: 16px;
    background-color: var(--primary-bg);
    border-radius: 8px;
    overflow: auto;
    font-family: monospace;
    font-size: 0.875rem;
}
.log-viewer-container pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
}
</style>