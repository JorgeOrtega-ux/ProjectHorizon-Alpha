<div class="section-content <?php echo ($CURRENT_SECTION === 'sendFeedback') ? 'active' : 'disabled'; ?>" data-section="sendFeedback">
    <div class="settings-page-container">
        <div class="content-section header-section">
            <div class="item-details">
                <h2 data-i18n="help.sendFeedback.title"></h2>
                <p data-i18n="help.sendFeedback.description"></p>
            </div>
        </div>

        <div class="content-section">
            <div class="feedback-form-container">
                <div class="form-group select-section">
                    <label class="form-label" data-i18n="help.sendFeedback.issueTypeLabel"></label>
                    <div class="select-wrapper body-title">
                        <div class="custom-select-trigger" data-action="toggle-select" data-target="feedback-issue-type-select">
                            <div class="select-trigger-icon">
                                <span class="material-symbols-rounded">report</span>
                            </div>
                            <span class="select-trigger-text" data-i18n="help.sendFeedback.issueTypeDefault"></span>
                            <div class="select-trigger-icon select-trigger-arrow">
                                <span class="material-symbols-rounded">expand_more</span>
                            </div>
                        </div>
                        <div class="module-content module-select disabled" id="feedback-issue-type-select">
                            <div class="menu-content">
                                <div class="menu-list">
                                    <div class="menu-link" data-value="suggestion">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">lightbulb</span></div>
                                        <div class="menu-link-text"><span data-i18n="help.sendFeedback.issueTypeSuggestion"></span></div>
                                    </div>
                                    <div class="menu-link" data-value="problem">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">bug_report</span></div>
                                        <div class="menu-link-text"><span data-i18n="help.sendFeedback.issueTypeProblem"></span></div>
                                    </div>
                                    <div class="menu-link" data-value="other">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">help</span></div>
                                        <div class="menu-link-text"><span data-i18n="help.sendFeedback.issueTypeOther"></span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="form-group disabled" id="feedback-other-title-group">
                    <label class="form-label" for="feedback-other-title" data-i18n="help.sendFeedback.otherTitleLabel"></label>
                    <input type="text" id="feedback-other-title" class="feedback-input" data-i18n-placeholder="help.sendFeedback.otherTitlePlaceholder" maxlength="100">
                </div>

                <div class="form-group">
                    <label class="form-label" for="feedback-description" data-i18n="help.sendFeedback.descriptionLabel"></label>
                    <textarea id="feedback-description" class="feedback-textarea" rows="6" data-i18n-placeholder="help.sendFeedback.descriptionPlaceholder"></textarea>
                     <div class="feedback-actions-toolbar">
                        <div class="header-button" id="feedback-upload-btn" data-i18n-tooltip="help.sendFeedback.uploadButtonTooltip">
                            <span class="material-symbols-rounded">attachment</span>
                        </div>
                        <input type="file" id="feedback-file-input" multiple accept="image/*" style="display: none;">
                    </div>
                </div>

                <div class="form-group">
                    <div class="file-preview-container" id="feedback-file-preview"></div>
                     <p class="file-upload-info" data-i18n="help.sendFeedback.fileUploadInfo"></p>
                </div>


                <div class="form-group form-actions">
                    <button class="load-more-btn" id="send-feedback-btn">
                        <span class="button-text" data-i18n="help.sendFeedback.sendButton"></span>
                        <div class="button-spinner"></div>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>