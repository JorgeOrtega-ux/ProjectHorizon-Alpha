<div class="section-container <?php echo ($CURRENT_VIEW === 'main') ? 'active' : 'disabled'; ?>" data-view="main">
    <?php include 'includes/sections/main/home.php'; ?>
    <?php include 'includes/sections/main/explore.php'; ?>
    <?php include 'includes/sections/main/404.php'; ?>
</div>

<div class="section-container <?php echo ($CURRENT_VIEW === 'settings') ? 'active' : 'disabled'; ?>" data-view="settings">
    <?php include 'includes/sections/settings/accessibility.php'; ?>
    <?php include 'includes/sections/settings/historyPrivacy.php'; ?>
</div>