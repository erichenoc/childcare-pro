# Card Systems Plugin for Tailwind CSS

Flexible card components with layouts, shadows, interactions, and content patterns for building modern card-based interfaces.

## Features

- **8 Card Types**: Basic, image, profile, product, article, pricing, testimonial, and stats cards
- **4 Layout Styles**: Vertical, horizontal, overlay, and compact layouts
- **Interactive Effects**: Hover animations, flip cards, and expandable cards
- **Responsive Grids**: Auto-responsive card grids with masonry support
- **Dark Mode**: Full dark mode support for all card variations
- **Performance**: Optimized for smooth animations and lazy loading

## Installation

```bash
npm install @skillstash/tailwind-card-systems
```

## Basic Usage

### Simple Card
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
  </div>
  <div class="card-body">
    <p class="card-text">Card content goes here.</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
  </div>
</div>
```

### Image Card
```html
<div class="card card-image">
  <img src="image.jpg" class="card-img-top" alt="...">
  <div class="card-body">
    <h3 class="card-title">Featured Article</h3>
    <p class="card-text">Article excerpt...</p>
    <a href="#" class="card-link">Read more →</a>
  </div>
</div>
```

### Product Card
```html
<div class="card card-product">
  <div class="card-image-wrapper">
    <img src="product.jpg" class="card-img" alt="Product">
    <span class="card-badge">Sale</span>
  </div>
  <div class="card-body">
    <h3 class="card-title">Product Name</h3>
    <div class="card-price">
      <span class="price-current">$49.99</span>
      <span class="price-original">$79.99</span>
    </div>
    <button class="btn btn-primary btn-block">Add to Cart</button>
  </div>
</div>
```

### Horizontal Card
```html
<div class="card card-horizontal">
  <img src="thumbnail.jpg" class="card-img-left" alt="...">
  <div class="card-body">
    <h3 class="card-title">Horizontal Layout</h3>
    <p class="card-text">Content flows horizontally...</p>
  </div>
</div>
```

## Advanced Features

### Flip Cards
```html
<div class="card-flip">
  <div class="card-flip-inner">
    <div class="card-flip-front">
      <!-- Front content -->
    </div>
    <div class="card-flip-back">
      <!-- Back content -->
    </div>
  </div>
</div>
```

### Expandable Cards
```html
<div class="card card-expandable">
  <div class="card-summary">
    <h3>Click to expand</h3>
  </div>
  <div class="card-details">
    <!-- Expanded content -->
  </div>
</div>
```

### Card Grid
```html
<div class="card-grid">
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
</div>
```

## License

MIT License