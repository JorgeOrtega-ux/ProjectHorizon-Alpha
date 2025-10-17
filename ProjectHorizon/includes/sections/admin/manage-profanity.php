<?php
// includes/sections/admin/manage-profanity.php
?>
<div class="section-content <?php echo ($CURRENT_SECTION === 'manageProfanity') ? 'active' : 'disabled'; ?>" data-section="manageProfanity">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="toggleSectionGeneralSettings" data-i18n-tooltip="admin.manageProfanity.backButtonTooltip">
                    <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="search-input-wrapper">
                    <div class="search-input-icon">
                        <span class="material-symbols-rounded">search</span>
                    </div>
                    <div class="search-input-text">
                        <input type="text" id="profanity-search-input" data-i18n-placeholder="admin.manageProfanity.searchPlaceholder" maxlength="64">
                    </div>
                </div>
            </div>
            <div class="content-header-right">
                <div id="profanity-action-buttons" class="header-item"></div>
                <div class="add-profanity-form">
                    <input type="text" id="profanity-word-input" class="feedback-input" data-i18n-placeholder="admin.generalSettings.profanityFilter.wordPlaceholder">
                    <div class="select-wrapper body-title">
                            <div class="custom-select-trigger" data-action="toggle-select" data-target="profanity-language-select">
                            <div class="select-trigger-icon"><span class="material-symbols-rounded">language</span></div>
                            <span class="select-trigger-text" data-i18n="admin.generalSettings.profanityFilter.languagePlaceholder"></span>
                            <div class="select-trigger-icon select-trigger-arrow">
                                <span class="material-symbols-rounded">expand_more</span>
                            </div>
                        </div>
                        <div class="module-content module-select disabled" id="profanity-language-select">
                            <div class="menu-content">
                                <div class="menu-list">
                                    <div class="menu-link" data-value="es-419"><div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div><div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.es-419"></span></div></div>
                                    <div class="menu-link" data-value="en-US"><div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div><div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.en-US"></span></div></div>
                                    <div class="menu-link" data-value="fr-FR"><div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div><div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.fr-FR"></span></div></div>
                                    <div class="menu-link" data-value="de-DE"><div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div><div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.de-DE"></span></div></div>
                                    <div class="menu-link" data-value="pt-BR"><div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div><div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.pt-BR"></span></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button class="load-more-btn btn-primary" data-action="add-profanity-word">
                        <span class="button-text" data-i18n="admin.manageProfanity.addButton"></span>
                        <div class="button-spinner"></div>
                    </button>
                </div>
                <div class="header-item">
                    <div class="header-button" data-action="toggle-select" data-target="profanity-filter-select" data-i18n-tooltip="admin.manageUsers.filterTooltip">
                        <span class="material-symbols-rounded">filter_list</span>
                    </div>
                    <div class="module-content module-select disabled" id="profanity-filter-select">
                        <div class="menu-content">
                            <div class="menu-list">
                                <div class="menu-link active" data-value="all"><div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div><div class="menu-link-text"><span data-i18n="admin.manageProfanity.filter.all"></span></div></div>
                                <div class="menu-link" data-value="es-419"><div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div><div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.es-419"></span></div></div>
                                <div class="menu-link" data-value="en-US"><div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div><div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.en-US"></span></div></div>
                                <div class="menu-link" data-value="fr-FR"><div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div><div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.fr-FR"></span></div></div>
                                <div class="menu-link" data-value="de-DE"><div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div><div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.de-DE"></span></div></div>
                                <div class="menu-link" data-value="pt-BR"><div class="menu-link-icon"><span class="material-symbols-rounded">language</span></div><div class="menu-link-text"><span data-i18n="settings.accessibility.languageOptions.pt-BR"></span></div></div>
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
					<h2 data-i18n="admin.manageProfanity.title"></h2>
					<p data-i18n="admin.generalSettings.profanityFilter.description"></p>
				</div>
			</div>
			<div class="status-message-container disabled"></div>
			<div class="admin-list-container" id="profanity-words-list">
			</div>
		</div>
    </div>
</div>