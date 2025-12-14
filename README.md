# 🌺 Hafaloha Web (Frontend)

React 18 + TypeScript frontend for the Hafaloha e-commerce platform.

**Backend Repo:** [`hafaloha-api`](https://github.com/Shimizu-Technology/hafaloha-api) (Rails 8 API)

---

## 📋 What This Does

- Customer-facing store (browse products, cart, checkout)
- Admin dashboard (manage products, orders, settings)
- Stripe payments, Clerk authentication
- Mobile-first responsive design

---

## ⚡ Quick Start (5 minutes)

### Step 1: Install Node.js

**macOS:**
```bash
brew install node
```

**Windows/Linux:** [Download Node.js](https://nodejs.org/) (get version 18+)

**Verify:**
```bash
node -v   # Should be 18+
npm -v    # Should be 9+
```

---

### Step 2: Install Dependencies

```bash
cd hafaloha-web
npm install
```

---

### Step 3: Setup Environment

```bash
# Get the .env file from Leon (contains all API keys)
# Save it as .env in hafaloha-web/

# OR copy the example and ask Leon for the real values:
cp .env.example .env
```

**The `.env` file contains:**
```bash
# Backend URL (should already be running)
VITE_API_BASE_URL=http://localhost:3000

# Clerk (Authentication)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

**🔒 Keep the `.env` file private!** Never commit it to git.

---

### Step 4: Start Dev Server

```bash
npm run dev
```

**Frontend runs on:** http://localhost:5173

**Open browser:** http://localhost:5173

✅ **You should see the Hafaloha homepage with products!**

---

## 🔐 Sign In as Admin

To access the admin dashboard:

1. **Create your admin account in Clerk:**
   - Go to your Clerk dashboard (ask Leon for access)
   - Or ask Leon to add your email as an admin

2. **Sign in on the site:**
   - Click "Sign In" (top right)
   - Sign in with your email
   - You'll be redirected back to the site

3. **Access admin dashboard:**
   - Click your profile icon (top right)
   - Click "Admin Dashboard"
   - Or go directly to http://localhost:5173/admin

**Default admin email:** `shimizutechnology@gmail.com` (ask Leon to set you up)

---

## 🎯 What You Can Do

### As a Customer (No Login Required):
- ✅ Browse products (12 sample products, or 50 if imported)
- ✅ Search & filter by collection, type, price
- ✅ View product details (images, sizes, colors)
- ✅ Add items to cart
- ✅ Update cart quantities
- ✅ Proceed to checkout
- ✅ Enter shipping address
- ✅ Get real-time shipping rates
- ✅ Complete order with Stripe (test mode)
- ✅ Receive order confirmation

### As an Admin (Login Required):
1. **Sign in** (see "Sign In as Admin" section above)

2. **Go to Admin Dashboard:** http://localhost:5173/admin

3. **Manage Products:**
   - View all products
   - Create new products
   - Edit existing products
   - Upload product images (stored in S3)
   - Generate variants (sizes, colors)
   - Set inventory tracking (none/product/variant)
   - Assign products to collections
   - Delete products

4. **Manage Orders:**
   - View all orders
   - Filter by status (pending, processing, shipped, etc.)
   - Update order status
   - Add tracking numbers
   - Add admin notes
   - Send tracking emails to customers

5. **Settings:**
   - Toggle test mode (bypass Stripe for testing)
   - Enable/disable customer emails
   - View API key status

---

## 🔑 Environment Variables

**Don't create your own!** Ask Leon for the `.env` file with all API keys configured.

```bash
# What's in the .env file:
VITE_API_BASE_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Optional (for payments):
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**🔒 Keep the `.env` file private!** Never commit it to git.

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CartDrawer.tsx
│   ├── ProductCard.tsx
│   ├── ImageUpload.tsx
│   └── VariantManager.tsx
│
├── pages/               # Page components (routes)
│   ├── HomePage.tsx
│   ├── ProductsPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── CheckoutPage.tsx
│   └── admin/           # Admin pages
│       ├── AdminDashboardPage.tsx
│       ├── AdminProductsPage.tsx
│       ├── AdminOrdersPage.tsx
│       └── ProductFormPage.tsx
│
├── services/
│   └── api.ts           # Axios API client
│
├── store/
│   └── cartStore.ts     # Zustand cart state
│
├── types/               # TypeScript interfaces
│   └── cart.ts
│
├── App.tsx              # Main app, routing, nav
└── main.tsx             # Entry point
```

---

## 🛠️ Common Tasks

### Run Dev Server
```bash
npm run dev
# Open http://localhost:5173
```

### Build for Production
```bash
npm run build
# Creates dist/ folder
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

---

## 🧪 Test the App

### Customer Flow:
1. Go to http://localhost:5173
2. Browse products
3. Click a product → select size/color → add to cart
4. Open cart (top-right icon)
5. Click "Proceed to Checkout"
6. Fill in shipping address
7. Use Stripe test card: `4242 4242 4242 4242`
8. Any future date, any CVC
9. Submit order
10. See confirmation page

### Admin Flow:
1. Sign in with admin account
2. Go to http://localhost:5173/admin
3. Click "Products" → pick a product → "Edit"
4. Upload images, create variants, set inventory
5. Save changes
6. Go to "Orders" → view/manage orders
7. Go to "Settings" → toggle test mode

---

## 🎨 Styling

Uses **Tailwind CSS v4** with custom colors:

```jsx
// Hafaloha brand colors
<div className="bg-hafalohaRed text-white">
  Håfa Adai!
</div>

<button className="bg-hafalohaGold text-gray-900">
  Shop Now
</button>
```

**Colors:**
- `hafalohaRed` → #C1191F
- `hafalohaGold` → #FFD700

---

## 🚨 Troubleshooting

### "Network Error" in browser
**Issue:** Frontend can't reach backend

**Fix:**
1. Make sure backend is running: `curl http://localhost:3000/health`
2. Check `VITE_API_BASE_URL` in `.env`

---

### "Clerk is not initialized"
**Issue:** Missing or invalid Clerk key

**Fix:**
1. Check `VITE_CLERK_PUBLISHABLE_KEY` in `.env`
2. Verify key starts with `pk_test_`
3. Check key matches in backend `.env`

---

### "Admin Dashboard shows Unauthorized"
**Issue:** User is not marked as admin

**Fix:**
```bash
# In backend (hafaloha-api):
bin/rails console

user = User.find_by(email: "your-email@example.com")
user.update!(admin: true, role: "admin")
```

---

### More Help
See [`docs/SETUP.md`](docs/SETUP.md) for detailed troubleshooting.

---

## 📚 Documentation

- **Setup Guide:** [`docs/SETUP.md`](docs/SETUP.md) - Detailed setup, Clerk config, troubleshooting
- **Backend Docs:** [`../hafaloha-api/docs/`](../hafaloha-api/docs/)
- **Project Docs:** [`../docs-v2/`](../docs-v2/) - PRD, status, full documentation

---

## 🚀 Development Tips

### Hot Reload
Vite provides instant hot module replacement (HMR). Save a file and see changes immediately!

### TypeScript
All components use TypeScript for type safety. Check `src/types/` for interfaces.

### Mobile-First
All pages are optimized for mobile, tablet, and desktop. Test responsiveness!

### API Calls
All backend calls go through `src/services/api.ts` (Axios instance).

---

## 📚 More Documentation

- **Project Overview:** [`docs/PROJECT-OVERVIEW.md`](docs/PROJECT-OVERVIEW.md) - Full project context, tech stack, features
- **Backend Repo:** [`hafaloha-api`](https://github.com/Shimizu-Technology/hafaloha-api) - Rails API

---

## 🤝 Need Help?

- **Issues?** Check troubleshooting sections above
- **Questions?** Ask Leon (shimizutechnology@gmail.com)

---

**Frontend ready!** Open http://localhost:5173 and start browsing! 🎉
