#!/usr/bin/env node

/**
 * PWA Icon Generator for ChildCare Pro
 * Generates all necessary icons for PWA manifest and push notifications
 *
 * Run with: node scripts/generate-pwa-icons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Icon sizes needed for PWA
const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Additional icons for notifications
const NOTIFICATION_ICONS = [
  { name: 'badge-72x72.png', size: 72, monochrome: true },
  { name: 'view.png', size: 48, icon: 'eye' },
  { name: 'close.png', size: 48, icon: 'x' },
  { name: 'sign.png', size: 48, icon: 'pen' },
  { name: 'pay.png', size: 48, icon: 'credit-card' },
  { name: 'phone.png', size: 48, icon: 'phone' },
  { name: 'attendance.png', size: 96, icon: 'clipboard-check' },
  { name: 'billing.png', size: 96, icon: 'receipt' },
  { name: 'incidents.png', size: 96, icon: 'alert-triangle' },
];

// Base SVG for app icon (child-friendly design)
function createAppIconSVG(size) {
  const padding = size * 0.1;
  const innerSize = size - (padding * 2);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Background circle -->
      <rect width="${size}" height="${size}" fill="url(#grad1)" rx="${size * 0.2}"/>
      <!-- Child figure -->
      <g transform="translate(${padding}, ${padding})">
        <!-- Head -->
        <circle cx="${innerSize * 0.5}" cy="${innerSize * 0.25}" r="${innerSize * 0.15}" fill="white"/>
        <!-- Body -->
        <ellipse cx="${innerSize * 0.5}" cy="${innerSize * 0.55}" rx="${innerSize * 0.15}" ry="${innerSize * 0.2}" fill="white"/>
        <!-- Arms -->
        <line x1="${innerSize * 0.35}" y1="${innerSize * 0.5}" x2="${innerSize * 0.2}" y2="${innerSize * 0.65}" stroke="white" stroke-width="${innerSize * 0.06}" stroke-linecap="round"/>
        <line x1="${innerSize * 0.65}" y1="${innerSize * 0.5}" x2="${innerSize * 0.8}" y2="${innerSize * 0.65}" stroke="white" stroke-width="${innerSize * 0.06}" stroke-linecap="round"/>
        <!-- Legs -->
        <line x1="${innerSize * 0.45}" y1="${innerSize * 0.75}" x2="${innerSize * 0.4}" y2="${innerSize * 0.95}" stroke="white" stroke-width="${innerSize * 0.06}" stroke-linecap="round"/>
        <line x1="${innerSize * 0.55}" y1="${innerSize * 0.75}" x2="${innerSize * 0.6}" y2="${innerSize * 0.95}" stroke="white" stroke-width="${innerSize * 0.06}" stroke-linecap="round"/>
      </g>
    </svg>
  `;
}

// Badge icon (monochrome for notification badge)
function createBadgeSVG(size) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#3b82f6" rx="${size * 0.15}"/>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">C</text>
    </svg>
  `;
}

// Simple icon SVGs
const SIMPLE_ICONS = {
  eye: (size) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#3b82f6"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="white" stroke-width="2" fill="none"/>
    </svg>
  `,
  x: (size) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#6b7280"/>
      <line x1="8" y1="8" x2="16" y2="16" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <line x1="16" y1="8" x2="8" y2="16" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  pen: (size) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#10b981"/>
      <path d="M15 6l3 3-9 9H6v-3z" stroke="white" stroke-width="1.5" fill="none"/>
    </svg>
  `,
  'credit-card': (size) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#8b5cf6"/>
      <rect x="5" y="7" width="14" height="10" rx="2" stroke="white" stroke-width="1.5" fill="none"/>
      <line x1="5" y1="11" x2="19" y2="11" stroke="white" stroke-width="1.5"/>
    </svg>
  `,
  phone: (size) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#ef4444"/>
      <path d="M8 6h8v12H8z" stroke="white" stroke-width="1.5" fill="none" rx="1"/>
      <line x1="10" y1="16" x2="14" y2="16" stroke="white" stroke-width="1.5"/>
    </svg>
  `,
  'clipboard-check': (size) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#10b981"/>
      <rect x="7" y="5" width="10" height="14" rx="1" stroke="white" stroke-width="1.5" fill="none"/>
      <path d="M9 12l2 2 4-4" stroke="white" stroke-width="1.5" fill="none"/>
    </svg>
  `,
  receipt: (size) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#f59e0b"/>
      <rect x="7" y="4" width="10" height="16" stroke="white" stroke-width="1.5" fill="none"/>
      <line x1="9" y1="8" x2="15" y2="8" stroke="white" stroke-width="1"/>
      <line x1="9" y1="11" x2="15" y2="11" stroke="white" stroke-width="1"/>
      <line x1="9" y1="14" x2="13" y2="14" stroke="white" stroke-width="1"/>
    </svg>
  `,
  'alert-triangle': (size) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#ef4444"/>
      <path d="M12 6l7 12H5z" stroke="white" stroke-width="1.5" fill="none"/>
      <line x1="12" y1="10" x2="12" y2="13" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="15" r="0.5" fill="white"/>
    </svg>
  `,
};

async function generateIcon(svgContent, outputPath) {
  const buffer = Buffer.from(svgContent);
  await sharp(buffer)
    .png()
    .toFile(outputPath);
  console.log(`  Created: ${path.basename(outputPath)}`);
}

async function main() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');

  // Create icons directory if it doesn't exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('Generating PWA icons for ChildCare Pro...\n');

  // Generate main app icons
  console.log('Generating app icons:');
  for (const size of PWA_SIZES) {
    const svg = createAppIconSVG(size);
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await generateIcon(svg, outputPath);
  }

  // Generate notification icons
  console.log('\nGenerating notification icons:');
  for (const iconDef of NOTIFICATION_ICONS) {
    let svg;
    if (iconDef.monochrome) {
      svg = createBadgeSVG(iconDef.size);
    } else if (iconDef.icon && SIMPLE_ICONS[iconDef.icon]) {
      svg = SIMPLE_ICONS[iconDef.icon](iconDef.size);
    } else {
      svg = createBadgeSVG(iconDef.size);
    }
    const outputPath = path.join(iconsDir, iconDef.name);
    await generateIcon(svg, outputPath);
  }

  console.log('\n✅ All icons generated successfully!');
  console.log(`   Location: ${iconsDir}`);
}

main().catch(console.error);
