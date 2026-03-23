---
name: form-create
description: Create complete forms with validation and accessibility
category: forms
tags: [forms, validation, inputs, accessibility]
---

# /form-create

Generate complete form layouts with proper validation, accessibility, and styling.

## Usage

```
/form-create [type] [fields] [options]
```

## Parameters

- `type`: Form type (contact, login, registration, checkout, survey)
- `fields`: Field configuration
- `options`: Additional options (--validation, --floating-labels, --dark-mode)

## Examples

### Contact Form
```
/form-create contact
```

Generates a complete contact form with name, email, message fields, and validation.

### Login Form with Floating Labels
```
/form-create login --floating-labels
```

Creates a modern login form with floating label animations.