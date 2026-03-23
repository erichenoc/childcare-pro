# Animation Suite Plugin for Tailwind CSS

Rich animation utilities with keyframes, transitions, and effects for creating engaging UI animations.

## Features

- **8 Core Animations**: Fade, slide, zoom, rotate, bounce, shake, pulse, flip
- **Advanced Effects**: Parallax, morphing, typewriter, gradients, particles
- **Scroll Animations**: Trigger animations on scroll
- **Stagger Effects**: Sequential animation delays
- **Performance Optimized**: GPU-accelerated animations
- **Accessibility**: Respects prefers-reduced-motion

## Installation

```bash
npm install @skillstash/tailwind-animation-suite
```

## Basic Usage

### Simple Animations
```html
<div class="animate-fade-in">Fades in</div>
<div class="animate-slide-up">Slides up</div>
<div class="animate-scale-in">Scales in</div>
<div class="animate-bounce-in">Bounces in</div>
```

### Hover Animations
```html
<button class="hover:animate-pulse">Hover me</button>
<card class="hover:animate-lift">Lift on hover</card>
```

### Scroll Animations
```html
<div class="animate-on-scroll" data-animation="fade-up">
  Animates when scrolled into view
</div>
```

### Stagger Effects
```html
<ul class="stagger-children">
  <li class="animate-fade-in">Item 1</li>
  <li class="animate-fade-in">Item 2</li>
  <li class="animate-fade-in">Item 3</li>
</ul>
```

## Advanced Effects

- Parallax scrolling
- Morphing shapes
- Typewriter text
- Animated gradients
- Particle effects
- Path animations

## License

MIT License