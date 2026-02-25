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
# 1) ADMIN USER (Auto-created on first sign-in)
# ------------------------------------------------------------------------------
puts "1️⃣  Admin user setup..."
puts "   ℹ️  Admin users are auto-created when signing in with Clerk."
puts "   ℹ️  shimizutechnology@gmail.com is automatically set as admin."
puts "   ℹ️  To manually grant admin access, run in Rails console:"
puts "      User.find_by(email: 'user@example.com')&.update!(role: 'admin')"
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
    order_notification_emails: [ "shimizutechnology@gmail.com" ],

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
# 3) HOMEPAGE SECTIONS
# ------------------------------------------------------------------------------
puts "3️⃣  Setting up homepage sections..."

if HomepageSection.count == 0
  # Hero Section
  HomepageSection.create!(
    section_type: "hero",
    position: 0,
    active: true,
    title: "H\u00e5faloha",
    subtitle: "Chamorro pride. Island style. Premium quality merchandise.",
    button_text: "Shop Now",
    button_link: "/products",
    background_image_url: "/images/hafaloha-hero-v2.jpg",
    settings: {
      "overlay_opacity" => 0.4,
      "text_alignment" => "center",
      "badge_text" => "Island Living Apparel",
      "secondary_button_text" => "Browse Collections",
      "secondary_button_link" => "/collections"
    }
  )

  # Category Cards
  [
    {
      title: "Shop Women's",
      subtitle: "Vibrant styles for island living",
      button_text: "Shop Now",
      button_link: "/products?collection=womens",
      image_url: "/images/hafaloha-womens-img.webp",
      position: 0
    },
    {
      title: "Shop Men's",
      subtitle: "Bold designs with island pride",
      button_text: "Shop Now",
      button_link: "/products?collection=mens",
      image_url: "/images/hafaloha-mens-img.webp",
      position: 1
    }
  ].each do |card|
    HomepageSection.create!(
      section_type: "category_card",
      position: card[:position],
      active: true,
      title: card[:title],
      subtitle: card[:subtitle],
      button_text: card[:button_text],
      button_link: card[:button_link],
      image_url: card[:image_url]
    )
  end

  puts "   ✓ Created #{HomepageSection.count} homepage sections"
else
  puts "   ⏭️  Homepage sections already exist (#{HomepageSection.count} sections)"
end
puts ""

# ------------------------------------------------------------------------------
# 4) ACAI DEMO AVAILABILITY
# ------------------------------------------------------------------------------
puts "4️⃣  Configuring Acai demo availability..."

acai_setting = AcaiSetting.instance
demo_advance_hours = Rails.env.production? ? 24 : 0

acai_setting.update!(
  active: true,
  advance_hours: demo_advance_hours,
  max_per_slot: [acai_setting.max_per_slot.to_i, 10].max
)

demo_pickup_windows = [
  { day_of_week: 0, start_time: "09:00", end_time: "15:00", capacity: 10 }, # Sunday
  { day_of_week: 1, start_time: "09:00", end_time: "18:00", capacity: 10 }, # Monday
  { day_of_week: 2, start_time: "09:00", end_time: "18:00", capacity: 10 }, # Tuesday
  { day_of_week: 3, start_time: "09:00", end_time: "18:00", capacity: 10 }, # Wednesday
  { day_of_week: 4, start_time: "09:00", end_time: "18:00", capacity: 10 }, # Thursday
  { day_of_week: 5, start_time: "09:00", end_time: "18:00", capacity: 10 }, # Friday
  { day_of_week: 6, start_time: "09:00", end_time: "18:00", capacity: 10 }  # Saturday
]

demo_pickup_windows.each do |window|
  record = AcaiPickupWindow.find_or_initialize_by(day_of_week: window[:day_of_week])
  record.assign_attributes(
    start_time: window[:start_time],
    end_time: window[:end_time],
    capacity: window[:capacity],
    active: true
  )
  record.save!
end

if Rails.env.production?
  puts "   • Production mode: keeping existing blocked slots intact"
else
  cleared_count = AcaiBlockedSlot.upcoming.delete_all
  puts "   • Cleared upcoming blocked slots for demo: #{cleared_count}"
end

puts "   • Acai active: #{acai_setting.active}"
puts "   • Advance hours: #{acai_setting.advance_hours}"
puts "   • Max per slot: #{acai_setting.max_per_slot}"
puts "   • Active pickup windows: #{AcaiPickupWindow.active.count}"
puts ""

# ------------------------------------------------------------------------------
# 5) INSTRUCTIONS
# ------------------------------------------------------------------------------
puts "5️⃣  Next steps:"
puts ""
puts "   💡 To import products, use the Admin dashboard:"
puts "      1. Sign in with Clerk (shimizutechnology@gmail.com)"
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
puts "   • Admin User: Auto-created on Clerk sign-in"
puts "   • Site Settings: Configured"
puts "   • Homepage Sections: #{HomepageSection.count}"
puts "   • Collections: #{Collection.count}"
puts "   • Products: #{Product.count}"
puts "   • Variants: #{ProductVariant.count}"
puts "   • Acai Pickup Windows: #{AcaiPickupWindow.count}"
puts ""
puts "🎉 Ready!"
puts "=" * 80
