# 🎯 Hafaloha Project Overview

**Purpose:** High-level overview of the Hafaloha wholesale e-commerce platform.

---

## What is Hafaloha?

**Hafaloha** is a Guam-based business selling premium Chamorro pride merchandise:
- Apparel (t-shirts, polos, hoodies)
- Hats & bags
- Athletic wear
- Custom items
- Acai Cakes (with pickup scheduling)

**This Platform:**
- Replaces their old Shopify store
- Combines retail, wholesale/fundraiser, and Acai Cakes ordering
- Built from scratch for simplicity and performance

---

## Tech Stack

### **Frontend (`hafaloha-web`)**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS v4
- React Router
- Axios for API calls
- Clerk for authentication

### **Backend (`hafaloha-api`)**
- Ruby on Rails 8.1 (API-only)
- PostgreSQL (local dev, Neon for production)
- Sidekiq for background jobs
- Redis (for Sidekiq)
- Active Storage with S3
- Money-rails for currency

---

## Key Features

### **Customer-Facing**
- ✅ Product catalog (search, filter, pagination)
- ✅ Product detail pages (image gallery, variant selector)
- ✅ Shopping cart (guest + authenticated users)
- ✅ Checkout (EasyPost shipping, Stripe payment)
- ✅ Order confirmation & tracking
- ✅ Collections browsing
- ✅ Responsive design (mobile-first)

### **Admin Dashboard**
- ✅ Product management (CRUD, images, variants)
- ✅ Order management (view, update status, tracking)
- ✅ CSV import (Shopify products)
- ✅ Collections management
- ✅ Global settings (test mode, email toggle)
- ✅ Import history tracking

### **Future (Phase 1B & 2)**
- ⏳ Acai Cakes scheduling
- ⏳ Wholesale/fundraiser system
- ⏳ Inventory audit trail
- ⏳ Advanced analytics

---

## Project Structure

```
hafaloha/
├── hafaloha-api/        # Rails backend
│   ├── app/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── jobs/
│   │   └── mailers/
│   ├── db/
│   ├── lib/tasks/       # Import scripts
│   └── docs/            # Backend docs
│
└── hafaloha-web/        # React frontend
    ├── src/
    │   ├── pages/       # Route components
    │   ├── components/  # Reusable UI
    │   ├── services/    # API calls
    │   └── layouts/     # Admin/public layouts
    ├── public/
    └── docs/            # Frontend docs
```

---

## Design Principles

### **Mobile-First**
- Responsive layouts (320px → 1920px)
- Touch-friendly UI (44x44px tap targets)
- Hamburger menu for mobile nav
- Fast load times

### **Brand Identity**
- **Colors:** Red (#C1191F) and Gold (#FFD700)
- **Tone:** Island pride, Chamorro culture, community-focused
- **Aesthetic:** Clean, modern, professional

### **Ease of Use**
- Clear hierarchy
- Minimal clicks
- Visual feedback
- Consistent patterns

---

## Authentication

### **Customer Accounts**
- Managed by **Clerk**
- Sign up, sign in, profile management
- Guest checkout available (no account required)

### **Admin Access**
- Only `shimizutechnology@gmail.com` is admin
- Admin dashboard at `/admin`
- Requires Clerk authentication

---

## Key Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **Clerk** | User auth, admin login | ✅ Complete |
| **AWS S3** | Product images | ✅ Complete |
| **Stripe** | Payment processing | ✅ Complete |
| **EasyPost** | Shipping rates | ✅ Complete |
| **Resend** | Transactional emails | ✅ Complete |
| **ClickSend** | SMS notifications | ⏳ Phase 2 |

---

## Database Highlights

### **Core Models**
- `User` - Clerk-managed users
- `Product` - All products (retail, wholesale, acai)
- `ProductVariant` - Size/color combinations
- `ProductImage` - Photos stored in S3
- `Collection` - Product categories
- `Order` - All order types
- `OrderItem` - Line items

### **Inventory System**
**3 Levels:**
1. **No Tracking** (`'none'`) - Always available
2. **Product-Level** (`'product'`) - Track total quantity
3. **Variant-Level** (`'variant'`) - Track per size/color

### **Race Condition Prevention**
- Database row locking (`variant.with_lock`)
- Atomic SQL updates
- Transaction wrappers
- Stock validation before payment

---

## Deployment (Future)

| Component | Platform |
|-----------|----------|
| Backend | Render (Rails + Sidekiq) |
| Frontend | Netlify |
| Database | Neon (PostgreSQL) |
| Images | AWS S3 |

---

## Development Workflow

### **Backend Setup**
```bash
cd hafaloha-api
bundle install
bin/rails db:create db:migrate
bin/rails db:seed
bin/rails server  # http://localhost:3000
```

### **Frontend Setup**
```bash
cd hafaloha-web
npm install
npm run dev  # http://localhost:5173
```

### **Environment Variables**
- Backend: `.env` (Clerk, AWS, Stripe, EasyPost, Resend)
- Frontend: `.env` (Vite, Clerk)
- **Ask Leon for `.env` files!**

---

## Current Status

**Phase 1A: ✅ Complete**
- Product catalog
- Shopping cart
- Checkout & payments
- Admin dashboard
- CSV import

**Phase 1B: ⏳ In Progress**
- Acai Cakes scheduling
- Wholesale/fundraiser system

**Phase 2: 📋 Planned**
- Advanced analytics
- Inventory audit trail
- Newsletter system
- Customer reviews

---

## Key Differences from Old System

### **What We REMOVED:**
- ❌ Multi-tenancy (was for multiple restaurants)
- ❌ Restaurant-specific scoping
- ❌ POS integration
- ❌ Reservations
- ❌ Menu management

### **What We ADDED:**
- ✅ Simpler variant system
- ✅ Better mobile optimization
- ✅ Unified retail/wholesale/acai
- ✅ Admin CSV import
- ✅ Archive instead of delete
- ✅ 3-level inventory tracking

---

## Important Notes

### **Mobile Optimization**
- **ALWAYS** test mobile first
- Minimum 44x44px tap targets
- Hamburger menu must work
- No horizontal scroll
- Fast load times

### **Race Conditions**
- **CRITICAL:** Multiple users buying last item
- Use `variant.with_lock`
- Never trust cart contents
- Revalidate stock before payment

### **Admin Credentials**
- **Email:** `shimizutechnology@gmail.com`
- **Password:** Ask Leon
- **Role:** Set in `users` table (`role: 'admin'`)

---

## Documentation Links

- **Backend README:** [`hafaloha-api/README.md`](https://github.com/Shimizu-Technology/hafaloha-api)
- **Frontend README:** [`hafaloha-web/README.md`](https://github.com/Shimizu-Technology/hafaloha-web)
- **Database Schema:** [`hafaloha-api/docs/DATABASE-SCHEMA.md`](https://github.com/Shimizu-Technology/hafaloha-api/blob/main/docs/DATABASE-SCHEMA.md)
- **Shopify Import:** [`hafaloha-api/docs/SHOPIFY-IMPORT.md`](https://github.com/Shimizu-Technology/hafaloha-api/blob/main/docs/SHOPIFY-IMPORT.md)

---

## Contact

**Developer:** Leon Shimizu  
**Email:** shimizutechnology@gmail.com  
**Client:** Hafaloha (Guam)

---

**Let's build something great! 🚀**

