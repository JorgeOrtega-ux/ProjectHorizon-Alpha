<div class="section-container <?php echo ($CURRENT_VIEW === 'main') ? 'active' : 'disabled'; ?>" data-view="main">
    <?php include 'includes/sections/main/home.php'; ?>
    <?php include 'includes/sections/main/favorites.php'; ?>
    <?php include 'includes/sections/main/explore.php'; ?>
    <?php include 'includes/sections/main/404.php'; ?>
    <?php include 'includes/sections/main/user-photos.php'; ?>
    <?php include 'includes/sections/main/photo-view.php'; ?>
    <?php include 'includes/sections/main/access-code-prompt.php'; ?>
    <?php include 'includes/sections/main/login.php'; ?>
    <?php include 'includes/sections/main/register.php'; ?>
</div>

<div class="section-container <?php echo ($CURRENT_VIEW === 'settings') ? 'active' : 'disabled'; ?>" data-view="settings">
    <?php include 'includes/sections/settings/accessibility.php'; ?>
    <?php include 'includes/sections/settings/historyPrivacy.php'; ?>
</div>

<div class="section-container <?php echo ($CURRENT_VIEW === 'admin') ? 'active' : 'disabled'; ?>" data-view="admin">
    <?php include 'includes/sections/admin/manage-users.php'; ?>
    <?php include 'includes/sections/admin/manage-galleries.php'; ?>
</div>