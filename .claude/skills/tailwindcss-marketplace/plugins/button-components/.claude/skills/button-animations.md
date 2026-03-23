---
name: button-animations
description: Adds smooth animations and micro-interactions to button components
autoLoads: true
triggers:
  - "animate.*button"
  - "button.*animation"
  - "hover.*effect"
  - "click.*effect"
  - "ripple.*effect"
---

# Button Animations Skill

Automatically enhances button components with smooth animations, transitions, and micro-interactions for improved user experience.

## Auto-Loading Triggers

This skill automatically activates when:
- Adding animations to buttons
- Implementing hover effects
- Creating interactive feedback
- Building engaging UI components

## Animation Types

### Hover Animations
Various hover effect implementations:

```css
/* Scale animation */
.btn-hover-scale {
  @apply transition-transform duration-200 ease-out;
}

.btn-hover-scale:hover {
  @apply scale-105;
}

/* Lift animation */
.btn-hover-lift {
  @apply transition-all duration-200 ease-out;
}

.btn-hover-lift:hover {
  @apply -translate-y-0.5 shadow-lg;
}

/* Glow animation */
.btn-hover-glow {
  @apply transition-shadow duration-300 ease-out;
}

.btn-hover-glow:hover {
  @apply shadow-[0_0_20px_rgba(59,130,246,0.5)];
}

/* Slide effect */
.btn-hover-slide {
  @apply relative overflow-hidden;
}

.btn-hover-slide::before {
  @apply absolute inset-0 bg-white/20 -translate-x-full transition-transform duration-300;
  content: '';
}

.btn-hover-slide:hover::before {
  @apply translate-x-0;
}
```

### Click Animations
Interactive feedback on click:

```css
/* Press animation */
.btn-click-press {
  @apply transition-all duration-100 ease-out;
}

.btn-click-press:active {
  @apply scale-95;
}

/* Bounce animation */
@keyframes bounce-click {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.95); }
}

.btn-click-bounce:active {
  animation: bounce-click 0.3s ease-out;
}

/* Pulse animation */
@keyframes pulse-click {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
  100% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
}

.btn-click-pulse:active {
  animation: pulse-click 0.4s ease-out;
}
```

### Ripple Effect
Material Design inspired ripple:

```javascript
class RippleButton {
  constructor(button) {
    this.button = button;
    this.button.addEventListener('click', this.createRipple.bind(this));
    this.button.classList.add('relative', 'overflow-hidden');
  }

  createRipple(event) {
    const ripple = document.createElement('span');
    const rect = this.button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('btn-ripple-effect');

    this.button.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }
}

// CSS for ripple
const rippleStyles = `
.btn-ripple-effect {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  transform: scale(0);
  animation: ripple-animation 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
`;
```

### Loading Animations
Smooth loading state transitions:

```css
/* Spinner animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-spinner {
  @apply inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full;
  animation: spin 0.6s linear infinite;
}

/* Progress bar loading */
.btn-loading-progress {
  @apply relative overflow-hidden;
}

.btn-loading-progress::after {
  @apply absolute bottom-0 left-0 h-1 bg-white/30;
  content: '';
  animation: progress 2s ease-in-out infinite;
}

@keyframes progress {
  0% { width: 0%; left: 0; }
  50% { width: 100%; left: 0; }
  100% { width: 0%; left: 100%; }
}

/* Dots animation */
@keyframes dots {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}

.btn-loading-dots span {
  animation: dots 1.4s infinite ease-in-out both;
}

.btn-loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.btn-loading-dots span:nth-child(2) { animation-delay: -0.16s; }
```

### Success/Error Animations
Feedback animations for form submissions:

```javascript
// Success animation
function animateSuccess(button) {
  button.classList.add('btn-success-animation');

  // Change to checkmark
  button.innerHTML = `
    <svg class="w-5 h-5 animate-scale-in" fill="none" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M5 13l4 4L19 7" />
    </svg>
    <span class="ml-2">Success!</span>
  `;

  setTimeout(() => {
    button.classList.remove('btn-success-animation');
    // Reset button
  }, 2000);
}

// Error shake animation
function animateError(button) {
  button.classList.add('animate-shake', 'btn-error');

  setTimeout(() => {
    button.classList.remove('animate-shake', 'btn-error');
  }, 500);
}

// CSS animations
const feedbackAnimations = `
@keyframes scale-in {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.animate-scale-in {
  animation: scale-in 0.3s ease-out;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.btn-success-animation {
  @apply bg-green-500 text-white;
  transition: background-color 0.3s ease;
}

.btn-error {
  @apply bg-red-500 text-white;
}
`;
```

### Morphing Animations
Shape-shifting button effects:

```css
/* Icon to text morph */
.btn-morph {
  @apply transition-all duration-300 ease-out;
  min-width: 44px;
}

.btn-morph.expanded {
  min-width: 120px;
}

.btn-morph-text {
  @apply overflow-hidden transition-all duration-300;
  max-width: 0;
  opacity: 0;
}

.btn-morph.expanded .btn-morph-text {
  max-width: 100px;
  opacity: 1;
  margin-left: 8px;
}

/* Round to pill morph */
.btn-morph-shape {
  @apply rounded-lg transition-all duration-300;
}

.btn-morph-shape:hover {
  @apply rounded-full px-8;
}
```

### Gradient Animations
Animated gradient backgrounds:

```css
/* Moving gradient */
@keyframes gradient-move {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.btn-gradient-animated {
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient-move 3s ease infinite;
}

/* Gradient on hover */
.btn-gradient-hover {
  @apply relative bg-gray-900 text-white overflow-hidden;
}

.btn-gradient-hover::before {
  @apply absolute inset-0 opacity-0 transition-opacity duration-300;
  content: '';
  background: linear-gradient(45deg, #667eea, #764ba2);
}

.btn-gradient-hover:hover::before {
  @apply opacity-100;
}

.btn-gradient-hover span {
  @apply relative z-10;
}
```

### Particle Effects
Advanced particle animations:

```javascript
class ParticleButton {
  constructor(button) {
    this.button = button;
    this.button.addEventListener('click', this.createParticles.bind(this));
  }

  createParticles(event) {
    const particleCount = 30;
    const rect = this.button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let i = 0; i < particleCount; i++) {
      this.createParticle(x, y);
    }
  }

  createParticle(x, y) {
    const particle = document.createElement('span');
    particle.classList.add('particle');

    const angle = (Math.PI * 2 * Math.random());
    const velocity = 50 + Math.random() * 50;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;

    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.setProperty('--vx', vx + 'px');
    particle.style.setProperty('--vy', vy + 'px');

    this.button.appendChild(particle);

    particle.addEventListener('animationend', () => {
      particle.remove();
    });
  }
}

// Particle CSS
const particleStyles = `
.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background-color: currentColor;
  border-radius: 50%;
  pointer-events: none;
  animation: particle-burst 0.6s ease-out forwards;
}

@keyframes particle-burst {
  to {
    transform: translate(var(--vx), var(--vy));
    opacity: 0;
  }
}
`;
```

## Performance Optimization

### GPU Acceleration
```css
.btn-animated {
  /* Use transform and opacity for GPU acceleration */
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .btn,
  .btn::before,
  .btn::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Best Practices

1. **Performance**: Use transform and opacity for smooth 60fps animations
2. **Accessibility**: Respect prefers-reduced-motion preference
3. **Timing**: Keep animations short (200-400ms) for responsive feel
4. **Feedback**: Provide immediate visual feedback for user actions
5. **Consistency**: Maintain consistent animation timing across the UI