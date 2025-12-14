# db/seeds.rb
# Seed file for Hafaloha wholesale platform
# 
# This file creates the minimum required data:
# - Admin user
# - Site settings with real Hafaloha configuration
#
# For products, use the Admin > Import UI

puts "=" * 80
puts "🌺 SEEDING HAFALOHA WHOLESALE PLATFORM"
puts "=" * 80
puts ""

# ------------------------------------------------------------------------------
# 1) ADMIN USER
# ------------------------------------------------------------------------------
puts "1️⃣  Creating admin user..."

admin = User.find_or_create_by!(email: "shimizutechnology@gmail.com") do |u|
  u.clerk_id = "seed_admin_#{SecureRandom.hex(8)}"
  u.name = "Leon Shimizu"
  u.phone = "+16714830219"
  u.role = "admin"
end

# Ensure the user is always an admin (in case they existed already)
admin.update!(role: "admin") unless admin.admin?

puts "   ✓ Admin: #{admin.email} (role: #{admin.role})"
puts ""

# ------------------------------------------------------------------------------
# 2) SITE SETTINGS
# ------------------------------------------------------------------------------
puts "2️⃣  Configuring site settings..."

settings = SiteSetting.instance

# Only update if settings are using defaults (no store_email set)
if settings.store_email.blank?
  settings.update!(
    # Store Info
    store_name: "Hafaloha",
    store_email: "sales@hafaloha.com",
    store_phone: "+1 (671) 989-3444",
    
    # Order Notifications (admin emails to receive order alerts)
    order_notification_emails: ["shimizutechnology@gmail.com"],
    
    # Shipping Origin (for rate calculations)
    shipping_origin_address: {
      company: "Hafaloha",
      street1: "215 Rojas Street",
      street2: "Ixora Industrial Park, Unit 104",
      city: "Tamuning",
      state: "GU",
      zip: "96913",
      country: "US",
      phone: "+1 (671) 989-3444"
    },
    
    # Payment Settings
    # NOTE: Set payment_test_mode to false when ready for real payments
    payment_test_mode: Rails.env.production? ? false : true,
    payment_processor: "stripe",
    
    # Email Settings
    # NOTE: Set send_customer_emails to true once domain is verified
    send_customer_emails: false
  )
  puts "   ✓ Site Settings configured with Hafaloha defaults"
else
  puts "   ⏭️  Site Settings already configured (skipping)"
end

puts "   • Store: #{settings.store_name}"
puts "   • Email: #{settings.store_email}"
puts "   • Phone: #{settings.store_phone}"
puts "   • Shipping Origin: #{settings.shipping_origin_address['city']}, #{settings.shipping_origin_address['state']}"
puts "   • Payment Test Mode: #{settings.payment_test_mode?}"
puts "   • Send Customer Emails: #{settings.send_customer_emails}"
puts ""

# ------------------------------------------------------------------------------
# 3) INSTRUCTIONS
# ------------------------------------------------------------------------------
puts "3️⃣  Next steps:"
puts ""
puts "   💡 To import products, use the Admin dashboard:"
puts "      1. Sign in as admin (#{admin.email})"
puts "      2. Go to Admin > Import"
puts "      3. Upload products_export.csv"
puts ""
if settings.payment_test_mode?
  puts "   ⚠️  Payment is in TEST MODE - no real charges will be made"
  puts "      To enable real payments, update payment_test_mode in Admin > Settings"
  puts ""
end

# ------------------------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------------------------
puts "=" * 80
puts "✅ SEED COMPLETE"
puts "=" * 80
puts ""
puts "📊 Summary:"
puts "   • Admin User: #{admin.email}"
puts "   • Site Settings: Configured"
puts "   • Collections: #{Collection.count}"
puts "   • Products: #{Product.count}"
puts "   • Variants: #{ProductVariant.count}"
puts ""
puts "🎉 Ready!"
puts "=" * 80
