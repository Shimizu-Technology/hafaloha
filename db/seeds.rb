# db/seeds.rb
# Seed file for Hafaloha wholesale platform

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

puts "   ✓ Admin: #{admin.email} (admin: #{admin.admin?})"
puts ""

# ------------------------------------------------------------------------------
# 2) SITE SETTINGS
# ------------------------------------------------------------------------------
puts "2️⃣  Ensuring site settings exist..."

settings = SiteSetting.instance
if settings.new_record?
  settings.update!(
    payment_test_mode: Rails.env.production? ? false : true,
    send_customer_emails: Rails.env.production? ? false : false # Off by default
  )
  puts "   ✓ Site Settings created: test_mode=#{settings.payment_test_mode?}, emails=#{settings.send_customer_emails}"
else
  puts "   ✓ Site Settings already exist"
end
puts ""

# ------------------------------------------------------------------------------
# 3) SAMPLE DATA (Development Only)
# ------------------------------------------------------------------------------

if Rails.env.development? || Rails.env.test?
  puts "3️⃣  Creating sample development data..."
  puts ""
  
  # Only create sample data if no products exist
  if Product.count == 0
    # Create a simple collection
    collection = Collection.create!(
      name: "Sample Collection",
      slug: "sample-collection",
      description: "Sample products for development",
      active: true,
      published: true,
      position: 1
    )
    
    # Create a simple product with variants
    product = Product.create!(
      name: "Sample T-Shirt",
      slug: "sample-tshirt",
      description: "A sample product for development and testing",
      base_price_cents: 2999,
      sku_prefix: "SAMPLE",
      published: true,
      featured: true,
      product_type: "apparel",
      vendor: "Håfaloha",
      inventory_level: 'none',
      weight_oz: 6.5
    )
    
    product.collections << collection
    
    # Create variants
    ["Small", "Medium", "Large"].each do |size|
      ["Black", "White", "Red"].each do |color|
        product.product_variants.create!(
          option1: size,
          option2: color,
          price_cents: product.base_price_cents,
          stock_quantity: 0,
          weight_oz: 6.5,
          available: true
        )
      end
    end
    
    puts "   ✓ Created 1 sample product with 9 variants"
  else
    puts "   ⏭️  Products already exist, skipping sample data"
  end
  puts ""
else
  puts "3️⃣  Production environment - skipping sample data"
  puts ""
  puts "   💡 To import real products, use the admin dashboard:"
  puts "      1. Sign in as admin (#{admin.email})"
  puts "      2. Go to Admin > Import"
  puts "      3. Upload products_export.csv"
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
puts "   • Admin User: 1 (#{admin.email})"
puts "   • Collections: #{Collection.count}"
puts "   • Products: #{Product.count}"
puts "   • Variants: #{ProductVariant.count}"
puts "   • Images: #{ProductImage.count}"
puts ""
if Rails.env.production?
  puts "🎉 Ready for product import via admin dashboard!"
else
  puts "🎉 Ready to browse the catalog!"
end
puts "=" * 80
