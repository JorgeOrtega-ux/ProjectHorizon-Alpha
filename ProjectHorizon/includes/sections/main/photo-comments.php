<div class="section-content <?php echo ($CURRENT_SECTION === 'photoComments') ? 'active' : 'disabled'; ?>" data-section="photoComments">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="header-button" data-action="returnToPreviousView" data-i18n-tooltip="photoView.backButtonTooltip">
                <span class="material-symbols-rounded">arrow_left</span>
                </div>
                <div class="header-title-container">
                    <span id="photo-comment-title" data-i18n="photoView.comments.title"></span>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="photo-preview-container">
            <img id="photo-preview-img" src="" alt="Vista previa de la foto" style="display: none;">
            <video id="photo-preview-video" muted playsinline style="display: none;"></video>
        </div>
        <div class="comments-section-container">
            <div class="comment-form-container">
                <textarea id="comment-input" class="feedback-textarea" rows="2" maxlength="500" data-i18n-placeholder="photoView.comments.placeholder"></textarea>
                <button id="submit-comment-btn" class="load-more-btn">
                    <span class="button-text" data-i18n="photoView.comments.publish"></span>
                    <div class="button-spinner"></div>
                </button>
            </div>
            <div id="comments-list"></div>
        </div>
    </div>
</div>