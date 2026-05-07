# Blueprint: My Wedding Book

## Overview
**My Wedding Book** is a modern, high-performance web application designed for Korean couples to manage their wedding preparation journey. It provides a centralized dashboard for tracking tasks, managing budgets, and finding style inspiration, all powered by Firebase for real-time synchronization.

## Project Details & Progress
### Architecture
- **Framework-less**: Built with native Web Components for modularity and performance.
- **Styling**: Uses modern CSS features (Container Queries, `:has()`, Cascade Layers, OKLCH colors, logical properties).
- **Backend**: Firebase (Authentication, Firestore, Storage).
- **Interactivity**: Smooth animations, mobile-responsive layouts, and tactile UI elements.

### Features
- **Firebase Authentication**: Secure login and signup for couples.
- **User Onboarding**: Collect wedding details (names, wedding date, venue) during signup.
- **Modern Dashboard**: Visual overview of wedding progress and quick access to modules.
- **D-day Countdown**: Real-time tracking of days remaining until the wedding.
- **Wedding Checklist**: Customizable list of tasks with status tracking.
- **Budget Tracker**: Expense management with category breakdowns and budget monitoring.
- **Inspiration Gallery**: Curated collections for wedding nails, hair, makeup, and dress styles.

### Design System (Romantic & Elegant)
- **Colors**: Soft Pinks, Creams, and Gold accents using OKLCH for perceptual uniformity.
- **Typography**: Elegant Serif fonts for headings, clean Sans-serif for body text.
- **Visual Effects**: Multi-layered soft shadows, subtle noise textures, and elegant transitions.

## Current Plan: Phase 2 - Functional Modules
1. **Web Components - Checklist**:
    - [ ] Implement `<wedding-checklist>` component.
    - [ ] Create Firestore schema for user-specific tasks.
    - [ ] Add default Korean wedding tasks (Sang-gyeon-rye, SDM, etc.).
    - [ ] Implement add/toggle/delete functionality.
2. **Web Components - Budget**:
    - [ ] Implement `<budget-tracker>` component.
    - [ ] Create Firestore schema for expenses.
3. **Polishing**:
    - [ ] Update Dashboard stats to reflect real Firestore data.
    - [ ] Add responsive design refinements.
