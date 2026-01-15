# 🚀 CHILDCARE SAAS - MASTER PROMPT FOR CLAUDE CODE

## Project: ChildCare Pro - Multi-Tenant SaaS Platform

---

## 📁 Reference Documentation

This project has 3 essential documentation files that you MUST read and follow throughout development:

### 1. `CHILDCARE_SAAS_PROMPT.md`
**Purpose:** Complete technical specifications
**Contains:**
- Full database schema (PostgreSQL/Supabase)
- All tables with relationships
- RLS policies for multi-tenant security
- API endpoints structure
- Environment variables
- Development phases

### 2. `CHILDCARE_SAAS_STRUCTURE.md`
**Purpose:** Architecture and visual reference
**Contains:**
- System architecture diagrams
- Multi-tenant data flow
- User roles and permissions matrix
- Florida DCF compliance ratios
- Pricing tiers
- Development timeline
- Component structure

### 3. `LIQUID_GLASS_DESIGN_GUIDE.md`
**Purpose:** UI/UX Design System
**Contains:**
- Liquid Glass design principles
- CSS implementation code
- SVG filters for refraction effects
- Component variants (Regular, Clear, Frosted, Mist)
- Color system for light/dark modes
- Animation specifications
- Accessibility guidelines

---

## 🎯 Development Strategy: UI-FIRST APPROACH

### Phase A: User Interface (Complete ALL UI before functionality)

Build the complete visual interface using the Liquid Glass Design System BEFORE implementing any backend logic. This ensures:

1. **Visual consistency** across all screens
2. **Design system** is established early
3. **Component library** is reusable
4. **User experience** is validated before backend work

### Phase B: Backend & Functionality

After ALL UI is complete and approved, implement:
1. Database schema and migrations
2. Authentication system
3. API endpoints
4. Business logic
5. Integrations (Stripe, Twilio, etc.)

---

## 📋 PHASE A: UI DEVELOPMENT ORDER

### Step 1: Project Setup & Design System Foundation

```bash
# Create Next.js 14 project
npx create-next-app@latest childcare-saas --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# Install UI dependencies
npm install lucide-react clsx tailwind-merge class-variance-authority

# Install shadcn/ui
npx shadcn-ui@latest init
```

**Tasks:**
- [ ] Initialize Next.js 14 with App Router
- [ ] Configure Tailwind CSS with Liquid Glass custom properties
- [ ] Create `/styles/liquid-glass.css` with all glass effects
- [ ] Add SVG filters for refraction effects
- [ ] Set up color palette (light/dark mode support)
- [ ] Create base glass component variants

### Step 2: Layout Components (Liquid Glass)

**Files to create:**
```
components/
├── layout/
│   ├── sidebar.tsx           # Glass sidebar with navigation
│   ├── header.tsx            # Glass header with user menu
│   ├── mobile-nav.tsx        # Mobile glass navigation
│   ├── page-container.tsx    # Page wrapper with glass effects
│   └── location-switcher.tsx # Multi-location dropdown
```

**Design requirements:**
- Sidebar: Frosted glass with 85% opacity
- Header: Clear glass with specular highlights
- All elements must have hover/active states
- Smooth transitions (0.3s cubic-bezier)
- Support for collapsed/expanded states

### Step 3: Shared UI Components (Liquid Glass)

**Files to create:**
```
components/
├── ui/
│   ├── glass-card.tsx        # Base glass card component
│   ├── glass-button.tsx      # Glass buttons (primary, secondary, ghost)
│   ├── glass-input.tsx       # Glass form inputs
│   ├── glass-select.tsx      # Glass dropdown select
│   ├── glass-modal.tsx       # Glass modal/dialog
│   ├── glass-table.tsx       # Glass data table
│   ├── glass-tabs.tsx        # Glass tab navigation
│   ├── glass-badge.tsx       # Status badges
│   ├── glass-avatar.tsx      # User/child avatars
│   ├── glass-tooltip.tsx     # Glass tooltips
│   └── glass-toast.tsx       # Glass notifications
```

### Step 4: Dashboard Pages UI

**Pages to create:**
```
app/(dashboard)/
├── layout.tsx                # Dashboard layout with sidebar
├── page.tsx                  # Main dashboard with stats
├── children/
│   ├── page.tsx             # Children list view
│   ├── [id]/page.tsx        # Child profile view
│   └── new/page.tsx         # Add child form
├── families/
│   ├── page.tsx             # Families list
│   └── [id]/page.tsx        # Family detail
├── staff/
│   ├── page.tsx             # Staff list
│   ├── [id]/page.tsx        # Staff profile
│   └── time-clock/page.tsx  # Time clock interface
├── classrooms/
│   ├── page.tsx             # Classrooms list
│   ├── [id]/page.tsx        # Classroom detail
│   └── ratios/page.tsx      # Real-time ratio tracking
├── attendance/
│   ├── page.tsx             # Daily attendance view
│   ├── check-in/page.tsx    # Quick check-in
│   └── reports/page.tsx     # Attendance reports
├── billing/
│   ├── page.tsx             # Billing overview
│   ├── invoices/page.tsx    # Invoice list
│   └── payments/page.tsx    # Payment history
├── communication/
│   ├── page.tsx             # Messages inbox
│   ├── daily-reports/page.tsx # Daily reports
│   └── announcements/page.tsx # Announcements
├── reports/
│   └── page.tsx             # Reports dashboard
├── incidents/
│   └── page.tsx             # Incident reports
└── settings/
    ├── page.tsx             # Settings overview
    ├── organization/page.tsx # Org settings
    └── users/page.tsx       # User management
```

### Step 5: Parent Portal UI

**Pages to create:**
```
app/(parent-portal)/
├── layout.tsx               # Parent portal layout
├── page.tsx                 # Parent dashboard
├── children/
│   └── [id]/page.tsx       # Child view
├── messages/page.tsx        # Messages
├── billing/page.tsx         # Bills & payments
└── documents/page.tsx       # Documents upload
```

### Step 6: Kiosk Mode UI

**Pages to create:**
```
app/(kiosk)/
├── layout.tsx               # Fullscreen kiosk layout
├── page.tsx                 # Location selector
└── [locationId]/
    ├── page.tsx            # PIN entry screen
    ├── check-in/page.tsx   # Check-in flow
    └── check-out/page.tsx  # Check-out flow
```

### Step 7: Public Website UI

**Pages to create:**
```
app/(public)/
├── layout.tsx              # Marketing layout
├── page.tsx                # Landing page (hero + features)
├── pricing/page.tsx        # Pricing tiers
├── features/page.tsx       # Feature showcase
└── contact/page.tsx        # Contact form
```

### Step 8: Auth Pages UI

**Pages to create:**
```
app/(auth)/
├── layout.tsx              # Auth layout (centered)
├── login/page.tsx          # Login form
├── register/page.tsx       # Registration form
├── forgot-password/page.tsx # Password reset request
└── reset-password/page.tsx  # Password reset form
```

---

## 🎨 LIQUID GLASS DESIGN SPECIFICATIONS

### Color System

```css
:root {
  /* Light Mode Glass */
  --glass-bg-light: rgba(255, 255, 255, 0.15);
  --glass-bg-medium: rgba(255, 255, 255, 0.25);
  --glass-bg-heavy: rgba(255, 255, 255, 0.35);
  --glass-border: rgba(255, 255, 255, 0.3);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  
  /* Primary Brand Colors */
  --primary: #4F46E5;        /* Indigo */
  --primary-glass: rgba(79, 70, 229, 0.15);
  --secondary: #10B981;      /* Emerald */
  --secondary-glass: rgba(16, 185, 129, 0.15);
  
  /* Status Colors */
  --success: #22C55E;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;
  
  /* Blur Levels */
  --blur-sm: 6px;
  --blur-md: 10px;
  --blur-lg: 20px;
  --blur-xl: 30px;
}

[data-theme="dark"] {
  /* Dark Mode Glass */
  --glass-bg-light: rgba(0, 0, 0, 0.2);
  --glass-bg-medium: rgba(0, 0, 0, 0.35);
  --glass-bg-heavy: rgba(0, 0, 0, 0.5);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Component Styling Rules

1. **Cards:** Use `backdrop-filter: blur(10px)` with subtle borders
2. **Buttons:** Frosted glass with hover glow effects
3. **Inputs:** Clear glass with focus rings
4. **Modals:** Heavy blur background overlay
5. **Tables:** Alternating row opacity for readability
6. **Navigation:** Persistent glass sidebar with active state highlights

### Animation Guidelines

```css
/* Standard transition */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Hover lift */
transform: translateY(-2px);

/* Press effect */
transform: scale(0.98);

/* Glass shimmer on hover */
background-position: 200% center;
```

---

## 🖼️ BACKGROUND REQUIREMENTS

The Liquid Glass effect requires colorful/gradient backgrounds to be visible. Use:

### Dashboard Background
```css
.dashboard-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* OR use a blurred image */
  background-image: url('/images/dashboard-bg.jpg');
  background-size: cover;
  filter: blur(50px) saturate(150%);
}
```

### Suggested Background Options
1. **Gradient meshes** - Colorful, abstract
2. **Blurred nature photos** - Professional, calming
3. **Abstract shapes** - Modern, playful (good for childcare)
4. **Solid gradients** - Clean, minimal

---

## ✅ UI COMPLETION CHECKLIST

Before moving to Phase B (backend), ALL these must be complete:

### Layout & Navigation
- [ ] Sidebar with all menu items (glass effect)
- [ ] Header with user menu dropdown
- [ ] Mobile responsive navigation
- [ ] Location switcher component
- [ ] Breadcrumb navigation

### Dashboard
- [ ] Stats cards (children count, attendance, revenue)
- [ ] Activity feed
- [ ] Quick actions panel
- [ ] Today's attendance summary
- [ ] Ratio compliance indicators

### Children Module
- [ ] Children list with search/filter
- [ ] Child card component
- [ ] Child profile page (all tabs)
- [ ] Add/Edit child form (wizard)
- [ ] Document upload interface

### Families Module
- [ ] Family list view
- [ ] Family detail page
- [ ] Guardian cards
- [ ] Billing summary

### Staff Module
- [ ] Staff list with role badges
- [ ] Staff profile page
- [ ] Time clock interface
- [ ] Certification tracker

### Classrooms Module
- [ ] Classroom cards grid
- [ ] Ratio indicator component
- [ ] Real-time ratio dashboard
- [ ] Classroom detail page

### Attendance Module
- [ ] Daily calendar view
- [ ] Check-in/out interface
- [ ] Attendance table with status
- [ ] Kiosk mode (fullscreen)

### Billing Module
- [ ] Invoice list with status
- [ ] Invoice detail view
- [ ] Payment form
- [ ] Tuition plan cards

### Communication Module
- [ ] Message inbox/list
- [ ] Message composer
- [ ] Daily report form
- [ ] Photo gallery grid

### Reports Module
- [ ] Report cards/tiles
- [ ] Chart placeholders
- [ ] Export buttons

### Settings Module
- [ ] Organization settings form
- [ ] Location management
- [ ] User/role management
- [ ] Billing settings

### Parent Portal
- [ ] Parent dashboard
- [ ] Child activity view
- [ ] Payment interface
- [ ] Document upload

### Kiosk Mode
- [ ] PIN entry pad
- [ ] Child selection grid
- [ ] Signature capture
- [ ] Health screening form

### Public Website
- [ ] Hero section
- [ ] Features showcase
- [ ] Pricing table (3 tiers)
- [ ] Contact form

### Auth Pages
- [ ] Login form
- [ ] Registration form
- [ ] Password reset forms

---

## 🚀 HOW TO START

Copy and paste this prompt to Claude Code:

```
Read the following documentation files in this order:

1. LIQUID_GLASS_DESIGN_GUIDE.md - Design system and CSS implementation
2. CHILDCARE_SAAS_STRUCTURE.md - Architecture and component organization  
3. CHILDCARE_SAAS_PROMPT.md - Full technical specifications

We are following a UI-FIRST development approach. This means:
- Build ALL user interface components FIRST
- Use the Liquid Glass design system throughout
- NO backend/database work until UI is 100% complete
- Every page must be visually complete with mock data

Start with Step 1: Project Setup & Design System Foundation

Create the Next.js 14 project and implement the Liquid Glass CSS system with:
- Custom Tailwind configuration
- Glass effect CSS variables
- SVG filters for refraction
- Base glass component (glass-card)

Show me the code for each file as you create it.
```

---

## 📌 IMPORTANT NOTES

1. **Mock Data:** Use realistic mock data for all UI components. Create a `/lib/mock-data.ts` file with sample children, families, staff, etc.

2. **Responsive Design:** All components must work on:
   - Desktop (1920px+)
   - Laptop (1366px)
   - Tablet (768px)
   - Mobile (375px)

3. **Accessibility:** 
   - Minimum contrast ratio 4.5:1 for text
   - Focus states on all interactive elements
   - ARIA labels where needed

4. **Performance:**
   - Use `will-change` for animated elements
   - Lazy load images
   - Minimize SVG filter complexity on mobile

5. **Dark Mode:** Implement full dark mode support from the start

---

## 🔄 AFTER UI COMPLETION

Once ALL UI is approved and complete, start Phase B:

1. Set up Supabase project
2. Run database migrations (from CHILDCARE_SAAS_PROMPT.md)
3. Implement authentication
4. Connect real data to UI components
5. Add Stripe integration
6. Implement all API routes
7. Add real-time features
8. Testing and deployment

---

**Document Version:** 1.0  
**Created:** January 2026  
**Author:** HENOC Marketing  

---

*This master prompt ensures Claude Code has complete context for building the ChildCare SaaS platform with a professional Liquid Glass UI first, followed by full backend implementation.*
