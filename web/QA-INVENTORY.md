# Inventory Management QA Report
Date: 2026-02-05
Tester: Jerry (Subagent)
App: Hafaloha V2 (http://localhost:4173)

## Summary
✅ 8 passed | ⚠️ 3 warnings | ❌ 1 failed

---

## Inventory Structure

### Tracking Levels
The system supports **three inventory tracking modes** (per product):

| Mode | Description | Use Case |
|------|-------------|----------|
| **None** | Always available, no tracking | Digital products, services |
| **Product Level** | Single quantity shared across all variants | "50 hats total" |
| **Variant Level** | Individual stock per size/color combo | "10 Red/Small, 5 Blue/Large" |

### Data Model (Backend)
- **Product**: `inventory_level` (enum), `product_stock_quantity`, `product_low_stock_threshold`
- **ProductVariant**: `stock_quantity`, `low_stock_threshold`, `available` (boolean)
- **InventoryAudit**: Tracks all changes with types: `order_placed`, `order_cancelled`, `order_refunded`, `restock`, `manual_adjustment`, `damaged`, `csv_import`, `variant_created`, `inventory_sync`

### Key Methods
- `variant.in_stock?` - Returns true if stock > 0 (or always true if not tracking)
- `variant.actually_available?` - Must be both `available=true` AND `stock_quantity > 0`
- `variant.stock_status` - Returns `not_tracked`, `out_of_stock`, `low_stock`, or `in_stock`
- `variant.decrement_stock!(qty)` / `increment_stock!(qty)` - With row locking

---

## Test Results

### Part 1: Inventory Structure Analysis ✅
- [✅] Three tracking modes available in UI
- [✅] Can switch between modes on product edit page
- [✅] Variant-level shows Stock column in variants table
- [✅] Per-variant quantities displayed

### Part 2: Setting Test Inventory ✅
- [✅] Can edit individual variant via modal
- [✅] Stock Quantity field present
- [✅] Low Stock Threshold field present (default: 5)
- [✅] Save Changes persists to database
- [✅] `inventory_level: "variant"` saved correctly via API

**Variant Edit Modal Fields:**
- Price ($)
- Stock Quantity
- Low Stock Threshold
- Available for purchase (checkbox)

### Part 3: Order Deduction ✅ (Code Review)
**Backend Implementation (`orders_controller.rb`):**
```ruby
def deduct_inventory(cart_items, order)
  cart_items.each do |item|
    variant = item.product_variant
    product = variant.product
    
    case product.inventory_level
    when "variant"
      variant.with_lock do  # Row-level locking!
        new_stock = variant.stock_quantity - item.quantity
        raise "Not enough stock" if new_stock < 0
        variant.update!(stock_quantity: new_stock)
        InventoryAudit.record_order_placed(...)
      end
    when "product"
      product.with_lock do
        # Similar logic for product-level
      end
    end
  end
end
```

- [✅] Stock deducted atomically with `with_lock`
- [✅] InventoryAudit created for each change
- [✅] Prevents over-ordering (raises error if stock < 0)

### Part 4: Inventory Limits ✅ (Code Review)
**Validation on Checkout:**
```ruby
# Line 312 in orders_controller.rb
message: "Only #{variant.stock_quantity} of #{product.name} - #{variant.display_name} available"
```

- [✅] Backend validates stock before processing order
- [✅] Clear error message with available quantity
- [⚠️] **Frontend validation not verified** - need live test

### Part 5: Out of Stock Handling ✅ (Code Review)
- [✅] `variant.actually_available?` returns false when stock = 0
- [✅] `variant.stock_status` returns "out_of_stock"
- [⚠️] **Frontend UI behavior not tested** (need browser test)

Expected behavior (from E2E tests):
- Disabled variant buttons
- "Out of Stock" label
- Add to Cart button disabled

### Part 6: Refund → Inventory Restoration ⚠️
**Key Finding:**
```ruby
# Line 165-167 in admin/orders_controller.rb
# Restore inventory for full refunds
if @order.fully_refunded?
  restore_inventory_for_refund(@order, current_user)
end
```

- [✅] Full refunds restore inventory automatically
- [✅] InventoryAudit created with `audit_type: "order_refunded"`
- [❌] **Partial refunds do NOT restore inventory**

This is a **significant limitation** - if customer returns 1 of 3 items and gets partial refund, the stock is NOT restored.

### Part 7: Admin Inventory Management ✅
**Dedicated Inventory Page (`/admin/inventory`):**
- Shows Inventory History (audit log)
- Stats: Total Changes, Stock Added, Stock Removed, Orders Affecting Stock
- Filters by:
  - Change Type (Order Placed, Cancelled, Refunded, Restock, Manual Adjustment, etc.)
  - Date Range

- [✅] Inventory audit log exists
- [✅] Can filter by change type
- [⚠️] No bulk inventory update UI visible
- [⚠️] No dedicated "low stock alerts" page (only product list filter)

---

## Issues Found

### ❌ Critical: Partial Refunds Don't Restore Inventory
**Severity:** High
**Location:** `app/controllers/api/v1/admin/orders_controller.rb:165-167`

**Problem:** Only fully refunded orders restore inventory. Partial refunds (e.g., return 1 of 3 items) do not restore the returned item's stock.

**Impact:** Manual inventory adjustment required after every partial refund, or stock counts become inaccurate.

**Recommendation:** Add option to restore inventory for partial refunds, or at minimum a manual "restock" button per order item.

### ⚠️ Warning: All Products Default to "No Tracking"
**Severity:** Medium

All 60 existing products have `inventory_level: "none"`. This means:
- No stock limits enforced
- No inventory audit trail
- Orders don't affect stock

**Recommendation:** 
1. Create migration or script to enable tracking on appropriate products
2. Set initial stock quantities based on actual inventory counts

### ⚠️ Warning: No Bulk Inventory Update
**Severity:** Low

Admins must edit variants one-by-one to set stock. No bulk CSV import or batch update for inventory.

**Recommendation:** Add bulk inventory update via:
- Inventory page with editable grid
- CSV import for stock quantities

### ⚠️ Warning: Frontend Stock Validation Incomplete
**Severity:** Medium

Backend validates stock, but frontend may allow adding items to cart even when out of stock (if no tracking enabled). Need live testing to confirm.

---

## Race Condition Prevention ✅

**Implemented correctly:**
```ruby
variant.with_lock do
  # All stock operations use row-level locking
  variant.update!(stock_quantity: new_stock)
end
```

This prevents two simultaneous orders from creating negative stock.

---

## Recommendations

### Immediate (Before Launch)
1. **Enable inventory tracking** on all products that should track stock
2. **Set initial stock quantities** based on physical inventory count
3. **Add partial refund inventory restoration** option

### Future Improvements
1. Bulk inventory update UI
2. Low stock email alerts to admin
3. Out-of-stock product auto-unpublish option
4. Reserved stock for items in cart (prevent overselling)
5. Pre-order/backorder functionality

---

## Files Referenced

### Frontend
- `src/pages/admin/ProductFormPage.tsx` - Inventory tracking settings
- `src/components/VariantManager.tsx` - Per-variant stock editing
- `src/pages/admin/AdminInventoryPage.tsx` - Inventory history

### Backend
- `app/models/product_variant.rb` - Stock fields and methods
- `app/models/product.rb` - Product-level inventory
- `app/models/order.rb` - Cancellation inventory restore
- `app/models/inventory_audit.rb` - Audit trail
- `app/controllers/api/v1/orders_controller.rb` - Order inventory deduction
- `app/controllers/api/v1/admin/orders_controller.rb` - Refund inventory restore

---

## Test Coverage

### E2E Tests Available
- `e2e/comprehensive/inventory-stock.spec.ts` - Stock display, OOS handling
- `e2e/comprehensive/inventory-audit.spec.ts` - Audit log testing
- `e2e/comprehensive/race-conditions.spec.ts` - Concurrent order testing

### Tests Needed
- [ ] Full order → inventory deduction flow (live test)
- [ ] Out of stock variant UI behavior
- [ ] Partial refund inventory behavior
- [ ] Low stock threshold alerts
