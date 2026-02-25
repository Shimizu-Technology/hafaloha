# 🚀 Hafaloha API (Backend)

Rails 8 API for the Hafaloha e-commerce platform.

**Frontend Repo:** [`hafaloha-web`](https://github.com/Shimizu-Technology/hafaloha-web) (React + TypeScript)

---

## 📋 What This Does

- Serves product catalog (products, variants, images)
- Handles orders, payments (Stripe), shipping (EasyPost)
- Admin API for managing products/orders
- Background jobs for emails
- Shopify CSV import for product migration

---

## ⚡ Quick Start (5 minutes)

### Step 1: Install Ruby & PostgreSQL

**macOS:**
```bash
brew install ruby postgresql@14
brew services start postgresql@14
```

**Windows/Linux:** [Ruby Install Guide](https://www.ruby-lang.org/en/documentation/installation/)

**Verify:**
```bash
ruby -v   # Should be 3.3+
psql --version   # Should be 14+
```

---

### Step 2: Install Dependencies

```bash
cd hafaloha-api

# Install Bundler (manages Ruby gems)
gem install bundler

# Install all dependencies (includes Rails)
bundle install
```

**Note:** This installs Rails and all other gems needed for the project.

---

### Step 3: Setup Database

```bash
# Get the .env file from Leon (contains all API keys)
# Save it as .env in hafaloha-api/

# OR copy the example and ask Leon for the real values:
cp .env.example .env

# Create database
bin/rails db:create

# Run migrations
bin/rails db:migrate

# Load sample data (12 products, 5 collections)
bin/rails db:seed
```

**You should see:**
```
🌺 SEEDING HAFALOHA WHOLESALE PLATFORM
   ℹ️  Admin users are auto-created when signing in with Clerk.
   ✓ Site settings configured
   ✓ Homepage sections created
```

---

### Step 4: Start Server

```bash
bin/rails server
```

**Server runs on:** http://localhost:3000

**Test it works:**
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok",...}
```

✅ **Backend is ready!**

---

## 🔑 Environment Variables

**Don't create your own!** Ask Leon for the `.env` file with all API keys configured.

If you need to know what's inside, here's what it contains:

```bash
# Database (local development)
DATABASE_URL=postgresql://localhost/hafaloha_api_development

# CORS (allow frontend to connect)
FRONTEND_URL=http://localhost:5173

# Clerk (Authentication)
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_FRONTEND_API=your-app.clerk.accounts.dev

# AWS S3 (Image uploads)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2
AWS_S3_BUCKET=hafaloha-images

# Stripe (Payments) - Optional for local dev
STRIPE_SECRET_KEY=sk_test_...

# EasyPost (Shipping) - Optional for local dev
EASYPOST_API_KEY=EZAT...

# Resend (Emails) - Optional for local dev
RESEND_API_KEY=re_...
```

**🔒 Keep the `.env` file private!** It contains API keys and should never be committed to git.

---

## 📦 What You Get (Seed Data)

`bin/rails db:seed` creates:

- ✅ **Site settings:** Store info, shipping origin, payment config
- ✅ **Homepage sections:** Hero banner, category cards

**Admin users** are auto-created when signing in with Clerk.
- Development: if `ADMIN_EMAILS` is unset, local default admin emails are used.
- Production: `ADMIN_EMAILS` **must** be set (comma-separated) or the API will fail to boot.

Example:
```bash
ADMIN_EMAILS=admin@hafaloha.com,ops@hafaloha.com
```

**Want to import products?** Use the Admin > Import UI, or:
```bash
bin/rails import:shopify[scripts/products_export.csv]
```

---

## 🧪 Test the API

```bash
# Get all products
curl http://localhost:3000/api/v1/products

# Get a specific product
curl http://localhost:3000/api/v1/products/hafaloha-championship-t-shirt

# Get collections
curl http://localhost:3000/api/v1/collections
```

---

## 🎯 What's Next?

1. ✅ Backend is running on `localhost:3000`
2. **Next:** Set up the [frontend](../hafaloha-web)
3. **Then:** Open browser to `http://localhost:5173`

---

## 📁 Project Structure

```
app/
├── controllers/
│   ├── api/v1/          # Public API (products, orders)
│   └── admin/           # Admin API (requires auth)
├── models/              # 13 models (Product, Order, etc.)
├── jobs/                # Background jobs (emails, imports)
└── services/            # Business logic

db/
├── migrate/             # Database migrations
├── seeds.rb             # Sample data
└── schema.rb            # Current schema

lib/tasks/
└── import.rake          # Shopify importer
```

---

## 🛠️ Common Tasks

### Open Rails Console
```bash
bin/rails console

# Try:
Product.count
Order.last
User.where(role: "admin")
```

### Reset Database
```bash
bin/rails db:reset   # Drops, creates, migrates, seeds
```

### Import Real Products
```bash
bin/rails import:shopify[scripts/products_export.csv]
# See docs/IMPORT.md
```

### Admin Users

**How admin access works:**
1. User signs in via Clerk (Google, Facebook, or email)
2. Rails automatically creates a user record with their Clerk ID
3. `shimizutechnology@gmail.com` is automatically made admin

**To make someone else an admin:**
```bash
# Step 1: Have them sign in to the site first (creates their user record)
# Step 2: Then update their role:

bin/rails console
User.find_by(email: "their-email@example.com")&.update!(role: "admin")
```

That's it! The user must sign in first so they have a real Clerk ID in the database.

---

## 🚨 Troubleshooting

### "Could not connect to database"
```bash
# Check if PostgreSQL is running
pg_isready

# If not running:
brew services start postgresql@14   # macOS
sudo service postgresql start        # Linux
```

### "Wrong Ruby version"
```bash
# Check your version
ruby -v

# Install Ruby 3.3+ (use rbenv or rvm)
```

### "Bundle install fails"
```bash
# Try:
gem install bundler
bundle install
```

### More Help
See [`docs/SETUP.md`](docs/SETUP.md) for detailed troubleshooting.

---

## 📚 Documentation

- **Database Schema:** [`docs/DATABASE-SCHEMA.md`](docs/DATABASE-SCHEMA.md) - All tables, fields, relationships
- **Shopify Import:** [`docs/SHOPIFY-IMPORT.md`](docs/SHOPIFY-IMPORT.md) - CSV product import guide
- **Frontend Repo:** [`hafaloha-web`](https://github.com/Shimizu-Technology/hafaloha-web) - React frontend

---

## 🤝 Need Help?

- **Issues?** Check troubleshooting sections above
- **Questions?** Ask Leon (shimizutechnology@gmail.com)

---

**Backend ready!** Now set up the [frontend](https://github.com/Shimizu-Technology/hafaloha-web) →
