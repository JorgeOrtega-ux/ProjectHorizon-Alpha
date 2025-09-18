<div class="section-content <?php echo ($CURRENT_SECTION === 'explore') ? 'active' : 'disabled'; ?>" data-section="explore">
    <div class="section-content-header">
        <div class="content-header-wrapper">
            <div class="content-header-left">
                <div class="search-input-wrapper">
                    <div class="search-input-icon">
                        <span class="material-symbols-rounded">search</span>
                    </div>
                    <div class="search-input-text">
                        <input type="text" placeholder="Buscar categorías...">
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="section-content-block overflow-y">
        <div class="category-section">
            <div class="category-section-title">
                <span class="material-symbols-rounded">trending_up</span>
                <span>Categorías más populares del momento</span>
            </div>
            <div class="category-grid">
                <?php for ($i = 1; $i <= 4; $i++) : ?>
                    <div class="card category-card">
                        <div class="card-background" style="background-image: url('https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=60');"></div>
                        <div class="category-card-overlay">
                            <h3>Categoría Popular <?php echo $i; ?></h3>
                        </div>
                    </div>
                <?php endfor; ?>
            </div>
        </div>
        <div class="category-section">
            <div class="category-section-title">
                <span class="material-symbols-rounded">category</span>
                <span>Todas las categorías</span>
            </div>
            <div class="category-grid">
                <?php for ($i = 1; $i <= 12; $i++) : ?>
                    <div class="card category-card">
                        <div class="card-background" style="background-image: url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=60');"></div>
                        <div class="category-card-overlay">
                            <h3>Categoría <?php echo $i; ?></h3>
                        </div>
                    </div>
                <?php endfor; ?>
            </div>
        </div>
    </div>
</div>