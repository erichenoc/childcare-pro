---
name: card-create
description: Create responsive card components with various layouts
category: components
tags: [cards, layouts, responsive, content]
---

# /card-create

Generate card components with flexible layouts and content patterns.

## Usage

```
/card-create [type] [layout] [options]
```

## Parameters

- `type`: Card type (basic, image, profile, product, article, pricing)
- `layout`: Layout style (vertical, horizontal, overlay, compact)
- `options`: Additional options (--shadow, --hover, --animate)

## Examples

### Product Card
```
/card-create product vertical --shadow --hover
```

Creates a product card with image, title, price, and hover effects.

### Profile Card
```
/card-create profile horizontal --animate
```

Generates a horizontal profile card with animation effects.