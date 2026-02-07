# Hafaloha QA Testing Checklist

Use this checklist to validate core product flows, variant behavior, inventory tracking, and order fulfillment across Retail, Acai, and Fundraiser order types. Mark each item as you complete it.

Last updated: 2026-02-06

---

## Environment

- [ ] Backend running (`rails s`) and frontend running (`npm run dev`)
- [ ] Admin login works (test-admin@hafaloha.com / HafalohaAdmin!)
- [ ] Stripe in test mode
- [ ] At least one fundraiser exists and is active

---

## Products: Creation & Editing (No Variants)

- [ ] Create a product with inventory level **None** and no variants
- [ ] Confirm product shows in storefront
- [ ] Confirm product can be added to cart and checked out
- [ ] Confirm admin order is created and shows correct line item
- [ ] Edit product name/description and verify changes in storefront

---

## Products: Creation & Editing (Variants)

- [ ] Create a product with inventory level **Variant**
- [ ] Add an option type (Size) and values (S/M/L)
- [ ] Generate variants
- [ ] Verify variants show correct option labels and pricing
- [ ] Adjust variant prices and confirm they persist
- [ ] Delete a variant and confirm it disappears from admin and storefront
- [ ] Attempt to generate variants with base price = 0 (should be blocked)

---

## Inventory Tracking (Product-Level)

- [ ] Set inventory level to **Product**
- [ ] Set product stock quantity to a low number (e.g., 2)
- [ ] Place orders to reduce stock and confirm it decrements
- [ ] Confirm out-of-stock behavior when stock reaches 0
- [ ] Verify inventory history log records changes

---

## Inventory Tracking (Variant-Level)

- [ ] Set inventory level to **Variant**
- [ ] Set stock for each variant (different values)
- [ ] Place order for a specific variant
- [ ] Confirm only that variant stock decrements
- [ ] Confirm out-of-stock variant cannot be purchased
- [ ] Verify inventory history log records changes per variant

---

## Import Workflow

- [ ] Run a Shopify import and confirm import completes
- [ ] Verify product count matches CSV handles
- [ ] Verify variant count matches CSV rows (minus skipped)
- [ ] Confirm warnings appear for:
  - [ ] Auto-generated SKUs
  - [ ] Missing option labels
  - [ ] Missing weights (default 8oz)
- [ ] Open a product with missing options and click **Auto-detect sizes**
- [ ] Confirm sizes appear correctly in variants table
- [ ] Update SKUs on one product and mark resolved

---

## Customer Orders: Retail

- [ ] Place order for product **without variants**
- [ ] Place order for product **with variants**
- [ ] Confirm order totals, shipping, and tax are correct
- [ ] Confirm order appears in admin and status can be updated

---

## Acai Orders

- [ ] Update Acai availability settings
- [ ] Place an Acai order with valid pickup date/time
- [ ] Confirm order appears in admin
- [ ] Move order through fulfillment states

---

## Fundraiser Orders

- [ ] Add a product to an active fundraiser
- [ ] Confirm fundraiser product appears on public fundraiser page
- [ ] Place a fundraiser order
- [ ] Confirm order appears in admin fundraiser orders
- [ ] Update fundraiser order status and verify changes

---

## Admin Fulfillment

- [ ] View and update Retail order status
- [ ] View and update Acai order status
- [ ] View and update Fundraiser order status
- [ ] Confirm order emails send (if enabled)

---

## Refunds & Inventory Reconciliation

- [ ] Issue a **full refund** for a retail order
- [ ] Confirm refund status is reflected in admin
- [ ] Verify inventory is **restocked** appropriately for refunded items
- [ ] Issue a **partial refund** (single line item)
- [ ] Confirm partial refund appears correctly in order details
- [ ] Verify inventory is **restocked only** for refunded line items
- [ ] Issue a **partial refund** for quantity (e.g., refund 1 of 2 units)
- [ ] Confirm stock increases by the refunded quantity

---

## Visual/UX Checks

- [ ] Verify product thumbnails load quickly
- [ ] Verify variant option labels display consistently
- [ ] Verify no console errors during checkout
- [ ] Verify mobile layout for product page and cart

---

## Edge Cases & Regression

- [ ] Cart stock race: add to cart → reduce stock → attempt checkout (expect clear out-of-stock error)
- [ ] Attempt to delete a variant with existing orders (should be blocked)
- [ ] Switch inventory level: variant → product (verify stock reconciliation and variant cleanup)
- [ ] Shipping rate validation: invalid address (error), valid address (rate returned)
- [ ] Disable retail customer emails → place retail order → confirm no customer email sent
- [ ] Upload product image → delete it → confirm placeholder shows on storefront
- [ ] Acai blackout date/time → verify unavailable in customer flow
- [ ] Fundraiser participant attribution: place order with participant → verify totals and attribution
