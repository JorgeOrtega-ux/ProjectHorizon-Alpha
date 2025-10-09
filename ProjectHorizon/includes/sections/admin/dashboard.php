<?php
// includes/sections/admin/dashboard.php
?>
<div class="section-content <?php echo ($CURRENT_SECTION === 'dashboard') ? 'active' : 'disabled'; ?>" data-section="dashboard">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-title-container">
                    <span data-i18n="admin.dashboard.title"></span>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div id="dashboard-loader" class="loader-container">
            <div class="spinner"></div>
        </div>
        <div id="dashboard-content" class="dashboard-container" style="display: none;">
            <div class="dashboard-row">
                <div class="stat-card">
                    <div class="stat-card-icon"><span class="material-symbols-rounded">group</span></div>
                    <div class="stat-card-info">
                        <span class="stat-card-title" data-i18n="admin.dashboard.totalUsers"></span>
                        <span class="stat-card-value" id="total-users-value">0</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon"><span class="material-symbols-rounded">person_add</span></div>
                    <div class="stat-card-info">
                        <span class="stat-card-title" data-i18n="admin.dashboard.newUsers"></span>
                        <span class="stat-card-value" id="new-users-value">0</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon"><span class="material-symbols-rounded">photo_library</span></div>
                    <div class="stat-card-info">
                        <span class="stat-card-title" data-i18n="admin.dashboard.totalGalleries"></span>
                        <span class="stat-card-value" id="total-galleries-value">0</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon"><span class="material-symbols-rounded">image</span></div>
                    <div class="stat-card-info">
                        <span class="stat-card-title" data-i18n="admin.dashboard.totalPhotos"></span>
                        <span class="stat-card-value" id="total-photos-value">0</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon"><span class="material-symbols-rounded">pending</span></div>
                    <div class="stat-card-info">
                        <span class="stat-card-title" data-i18n="admin.dashboard.pendingComments"></span>
                        <span class="stat-card-value" id="pending-comments-value">0</span>
                    </div>
                </div>
            </div>

            <div class="dashboard-row">
                <div class="dashboard-chart-container">
                    <h4 data-i18n="admin.dashboard.userGrowth"></h4>
                    <canvas id="user-growth-chart"></canvas>
                </div>
                <div class="dashboard-chart-container">
                    <h4 data-i18n="admin.dashboard.contentActivity"></h4>
                    <canvas id="content-activity-chart"></canvas>
                </div>
            </div>

            <div class="dashboard-row">
                <div class="dashboard-list-container">
                    <h4 data-i18n="admin.dashboard.topGalleries"></h4>
                    <ul id="top-galleries-list" class="top-list"></ul>
                </div>
                <div class="dashboard-list-container">
                    <h4 data-i18n="admin.dashboard.topPhotos"></h4>
                    <ul id="top-photos-list" class="top-list"></ul>
                </div>
            </div>
        </div>
    </div>
</div>