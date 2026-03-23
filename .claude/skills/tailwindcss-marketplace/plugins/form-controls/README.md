# Form Controls Plugin for Tailwind CSS

Advanced form control components with validation states, accessibility features, and modern styling patterns for Tailwind CSS.

## Features

- **9 Control Types**: Text inputs, textareas, selects, checkboxes, radios, switches, file uploads, date pickers, and range sliders
- **Validation States**: Error, success, warning, and info states with icons and messages
- **Floating Labels**: Modern floating label animations
- **Input Groups**: Combine inputs with addons, buttons, and icons
- **Custom Selects**: Styled select dropdowns with search functionality
- **Dark Mode**: Full dark mode support for all controls
- **Accessibility**: WCAG-compliant with proper ARIA attributes
- **Responsive**: Mobile-optimized touch targets and layouts

## Installation

```bash
npm install @skillstash/tailwind-form-controls
```

Add to your `tailwind.config.js`:

```javascript
module.exports = {
  plugins: [
    require('@skillstash/tailwind-form-controls')
  ]
}
```

## Basic Usage

### Text Input

```html
<div class="form-group">
  <label for="email" class="form-label">Email</label>
  <input type="email" id="email" class="form-input" placeholder="Enter your email">
  <p class="form-hint">We'll never share your email with anyone else.</p>
</div>
```

### Input with Validation

```html
<!-- Error state -->
<div class="form-group">
  <label for="username" class="form-label">Username</label>
  <input type="text" id="username" class="form-input form-input-error" value="admin">
  <p class="form-error">This username is already taken</p>
</div>

<!-- Success state -->
<div class="form-group">
  <label for="username" class="form-label">Username</label>
  <input type="text" id="username" class="form-input form-input-success" value="johndoe">
  <p class="form-success">Username is available</p>
</div>
```

### Floating Labels

```html
<div class="form-floating">
  <input type="text" id="name" class="form-input" placeholder="Name">
  <label for="name">Full Name</label>
</div>
```

### Input Groups

```html
<!-- With addon -->
<div class="input-group">
  <span class="input-addon">@</span>
  <input type="text" class="form-input" placeholder="Username">
</div>

<!-- With button -->
<div class="input-group">
  <input type="search" class="form-input" placeholder="Search">
  <button class="btn btn-primary">Search</button>
</div>
```

### Custom Select

```html
<div class="form-group">
  <label for="country" class="form-label">Country</label>
  <select id="country" class="form-select">
    <option>Choose a country</option>
    <option>United States</option>
    <option>Canada</option>
    <option>United Kingdom</option>
  </select>
</div>
```

### Checkbox and Radio

```html
<!-- Checkbox -->
<div class="form-check">
  <input type="checkbox" id="terms" class="form-checkbox">
  <label for="terms" class="form-check-label">
    I agree to the terms and conditions
  </label>
</div>

<!-- Radio buttons -->
<div class="form-radio-group">
  <div class="form-radio">
    <input type="radio" id="option1" name="options" class="form-radio-input">
    <label for="option1" class="form-radio-label">Option 1</label>
  </div>
  <div class="form-radio">
    <input type="radio" id="option2" name="options" class="form-radio-input">
    <label for="option2" class="form-radio-label">Option 2</label>
  </div>
</div>
```

### Switch Toggle

```html
<div class="form-switch">
  <input type="checkbox" id="notifications" class="switch-input">
  <label for="notifications" class="switch-label">
    Enable notifications
  </label>
</div>
```

### File Upload

```html
<div class="form-group">
  <label class="form-label">Upload File</label>
  <div class="file-upload">
    <input type="file" id="file" class="file-input">
    <label for="file" class="file-label">
      <svg class="file-icon"><!-- Upload icon --></svg>
      <span>Choose a file or drag it here</span>
    </label>
  </div>
</div>
```

### Range Slider

```html
<div class="form-group">
  <label for="volume" class="form-label">Volume</label>
  <input type="range" id="volume" class="form-range" min="0" max="100" value="50">
  <div class="range-labels">
    <span>0</span>
    <span>50</span>
    <span>100</span>
  </div>
</div>
```

## Advanced Features

### Form Validation

```javascript
// Real-time validation
const form = document.querySelector('.form-validated');
const inputs = form.querySelectorAll('.form-input');

inputs.forEach(input => {
  input.addEventListener('blur', () => {
    validateInput(input);
  });

  input.addEventListener('input', () => {
    if (input.classList.contains('form-input-error')) {
      validateInput(input);
    }
  });
});

function validateInput(input) {
  if (!input.value) {
    input.classList.add('form-input-error');
    showError(input, 'This field is required');
  } else {
    input.classList.remove('form-input-error');
    input.classList.add('form-input-success');
    hideError(input);
  }
}
```

### Custom Styling

```css
:root {
  --form-input-bg: theme('colors.white');
  --form-input-border: theme('colors.gray.300');
  --form-input-focus: theme('colors.blue.500');
  --form-input-error: theme('colors.red.500');
  --form-input-success: theme('colors.green.500');
}

.dark {
  --form-input-bg: theme('colors.gray.800');
  --form-input-border: theme('colors.gray.600');
}
```

## Accessibility Features

- **Label Association**: All inputs properly associated with labels
- **ARIA Attributes**: Error messages linked with aria-describedby
- **Keyboard Navigation**: Full keyboard support for all controls
- **Screen Reader Support**: Descriptive labels and error announcements
- **Focus Management**: Clear focus indicators and logical tab order

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## License

MIT License - see LICENSE file for details