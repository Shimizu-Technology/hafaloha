# db/seeds.rb
# Seed file for Hafaloha wholesale platform
# 
# This file creates the minimum required data:
# - Admin user
# - Site settings
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
puts "2️⃣  Ensuring site settings exist..."

settings = SiteSetting.instance
puts "   ✓ Site Settings: test_mode=#{settings.payment_test_mode?}, emails=#{settings.send_customer_emails}"
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

# ------------------------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------------------------
puts "=" * 80
puts "✅ SEED COMPLETE"
puts "=" * 80
puts ""
puts "📊 Summary:"
puts "   • Admin User: #{admin.email}"
puts "   • Collections: #{Collection.count}"
puts "   • Products: #{Product.count}"
puts "   • Variants: #{ProductVariant.count}"
puts ""
puts "🎉 Ready!"
puts "=" * 80
