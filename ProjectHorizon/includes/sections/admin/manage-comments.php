<?php
// includes/sections/admin/manage-comments.php
?>
<div class="section-content <?php echo ($CURRENT_SECTION === 'manageComments') ? 'active' : 'disabled'; ?>" data-section="manageComments">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="search-input-wrapper">
                    <div class="search-input-icon">
                        <span class="material-symbols-rounded">search</span>
                    </div>
                    <div class="search-input-text">
                        <input type="text" id="admin-comment-search" data-i18n-placeholder="admin.manageComments.searchPlaceholder" maxlength="64">
                    </div>
                </div>
            </div>
            <div class="content-header-right">
                <div id="comment-action-buttons" class="header-item"></div>
                <div class="select-wrapper body-title">
                    <div class="custom-select-trigger" data-action="toggle-select" data-target="comments-filter-select">
                        <div class="select-trigger-icon">
                            <span class="material-symbols-rounded">filter_list</span>
                        </div>
                        <span class="select-trigger-text" data-i18n="admin.manageComments.filter.all"></span>
                        <div class="select-trigger-icon select-trigger-arrow">
                            <span class="material-symbols-rounded">expand_more</span>
                        </div>
                    </div>
                    <div class="module-content module-select disabled" id="comments-filter-select">
                        <div class="menu-content">
                            <div class="menu-list">
                                <div class="menu-link active" data-value="all">
                                    <div class="menu-link-text"><span data-i18n="admin.manageComments.filter.all"></span></div>
                                </div>
                                <div class="menu-link" data-value="reported">
                                    <div class="menu-link-text"><span data-i18n="admin.manageComments.filter.reported"></span></div>
                                </div>
                                 <div class="menu-link" data-value="pending">
                                    <div class="menu-link-text"><span data-i18n="admin.manageComments.filter.pending"></span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="settings-page-container">
            <div class="content-section header-section">
                <div class="item-details">
                    <h2 data-i18n="admin.manageComments.title"></h2>
                    <p data-i18n="admin.manageComments.description"></p>
                </div>
            </div>
            <div class="status-message-container disabled"></div>
            <div class="admin-list-container" id="admin-comments-list">
            </div>
            <div class="load-more-container disabled" id="comments-admin-load-more-container">
                <button class="load-more-btn" data-action="load-more-admin-comments" data-i18n="home.showMore"></button>
            </div>
        </div>
    </div>
</div>