---
name: layout-create
description: Create responsive layout patterns with modern CSS Grid and Flexbox
category: layouts
tags: [layouts, grid, flexbox, responsive]
---

# /layout-create

Generate modern layout patterns using CSS Grid and Flexbox.

## Usage

```
/layout-create [pattern] [options]
```

## Parameters

- `pattern`: Layout pattern (holy-grail, sidebar, dashboard, magazine, masonry, kanban)
- `options`: Additional options (--responsive, --sticky-header, --collapsible-sidebar)

## Examples

### Dashboard Layout
```
/layout-create dashboard --sticky-header --collapsible-sidebar
```

Creates a full dashboard layout with navigation, header, and main content area.

### Magazine Layout
```
/layout-create magazine --responsive
```

Generates a magazine-style layout with featured articles and grid sections.

### Holy Grail Layout
```
/layout-create holy-grail
```

Creates the classic holy grail layout with header, footer, and three columns.