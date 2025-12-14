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
  u.admin = true
end

puts "   ✓ Admin: #{admin.email} (admin: #{admin.admin?})"
puts ""

# ------------------------------------------------------------------------------
# 2) SITE SETTINGS
# ------------------------------------------------------------------------------
puts "2️⃣  Creating site settings..."

settings = SiteSetting.instance
settings.update!(
  payment_test_mode: Rails.env.production? ? false : true,
  send_customer_emails: Rails.env.production? ? false : false # Off by default, enable via admin dashboard
)

puts "   ✓ Site Settings: test_mode=#{settings.payment_test_mode?}, emails=#{settings.send_customer_emails}"
puts ""

# ------------------------------------------------------------------------------
# 3) IMPORT REAL PRODUCTS (Production + Staging)
# ------------------------------------------------------------------------------

if Rails.env.production? || Rails.env.staging?
  puts "3️⃣  Importing real Hafaloha products from Shopify CSV..."
  puts ""
  
  csv_path = Rails.root.join('scripts', 'products_export.csv')
  
  if File.exist?(csv_path)
    require 'csv'
    require 'open-uri'
    require 'net/http'
    
    # Import logic (inline to avoid Rake dependency)
    rows = CSV.read(csv_path, headers: true, encoding: 'UTF-8')
    
    grouped_products = rows.group_by { |row| row['Handle'] }
    products_created = 0
    variants_created = 0
    images_downloaded = 0
    collections_created = 0
    existing_collections = {}
    
    puts "   Found #{grouped_products.size} products to import..."
    puts ""
    
    grouped_products.each do |handle, product_rows|
      first_row = product_rows.first
      
      # Skip if no title
      next if first_row['Title'].blank?
      
      slug = handle.parameterize
      
      # Skip if product already exists
      if Product.exists?(slug: slug)
        puts "   ⏭️  Skipping #{first_row['Title']} (already exists)"
        next
      end
      
      # Extract base price from first variant
      base_price = (first_row['Variant Price'].to_f * 100).to_i
      
      # Create product
      product = Product.create!(
        name: first_row['Title'],
        slug: slug,
        description: first_row['Body (HTML)'],
        base_price_cents: base_price,
        sku_prefix: first_row['Variant SKU']&.split('-')&.first || slug.upcase,
        published: first_row['Published']&.downcase == 'true',
        product_type: first_row['Type']&.parameterize || 'apparel',
        vendor: first_row['Vendor'] || 'Hafaloha',
        inventory_level: 'none', # Default to no tracking for imports
        weight_oz: (first_row['Variant Grams'].to_f * 0.035274).round(2)
      )
      
      products_created += 1
      
      # Create variants
      product_rows.each do |row|
        next if row['Variant SKU'].blank?
        
        variant = product.product_variants.create!(
          sku: row['Variant SKU'],
          option1: row['Option1 Value'],
          option2: row['Option2 Value'],
          option3: row['Option3 Value'],
          price_cents: (row['Variant Price'].to_f * 100).to_i,
          compare_at_price_cents: row['Variant Compare At Price'].present? ? (row['Variant Compare At Price'].to_f * 100).to_i : nil,
          cost_cents: row['Cost per item'].present? ? (row['Cost per item'].to_f * 100).to_i : nil,
          stock_quantity: 0,
          weight_oz: (row['Variant Grams'].to_f * 0.035274).round(2),
          available: true
        )
        
        variants_created += 1
      end
      
      # Download and attach images
      image_urls = product_rows.map { |r| r['Image Src'] }.compact.uniq
      
      image_urls.each_with_index do |url, index|
        next if url.blank?
        
        # Skip logo/placeholder images
        next if url.downcase.include?('christmaspua.png')
        next if url.downcase.include?('logo') || url.downcase.include?('placeholder')
        
        begin
          # Download image
          uri = URI.parse(url)
          image_data = Net::HTTP.get_response(uri).body
          
          # Create temporary file
          temp_file = Tempfile.new(['product_image', File.extname(uri.path)], encoding: 'ascii-8bit')
          temp_file.binmode
          temp_file.write(image_data)
          temp_file.rewind
          
          # Upload to S3 via Active Storage
          blob = ActiveStorage::Blob.create_and_upload!(
            io: temp_file,
            filename: File.basename(uri.path),
            content_type: 'image/jpeg'
          )
          
          # Store S3 key
          s3_key = blob.key
          
          # Create product image record
          product.product_images.create!(
            url: url, # Original Shopify URL (for reference)
            s3_key: s3_key,
            alt_text: product.name,
            primary: (index == 0),
            position: index
          )
          
          images_downloaded += 1
          
          temp_file.close
          temp_file.unlink
        rescue => e
          puts "      ⚠️  Failed to download image: #{e.message}"
        end
      end
      
      # Create collections from tags
      tags = first_row['Tags']&.split(',')&.map(&:strip) || []
      tags.each do |tag|
        next if tag.blank?
        
        collection_slug = tag.parameterize
        
        # Find or create collection
        collection = existing_collections[collection_slug]
        unless collection
          collection = Collection.find_or_create_by!(slug: collection_slug) do |c|
            c.name = tag
            c.active = true
            c.published = true
          end
          existing_collections[collection_slug] = collection
          collections_created += 1 if collection.id_previously_changed?
        end
        
        # Link product to collection
        product.collections << collection unless product.collections.include?(collection)
      end
      
      puts "   ✅ #{product.name} (#{product.product_variants.count} variants)"
    end
    
    puts ""
    puts "   📦 Import Summary:"
    puts "      • Products: #{products_created}"
    puts "      • Variants: #{variants_created}"
    puts "      • Images: #{images_downloaded}"
    puts "      • Collections: #{collections_created}"
    puts ""
  else
    puts "   ⚠️  CSV file not found at: #{csv_path}"
    puts "   Skipping product import."
    puts ""
  end
else
  # Development/Test: Create sample data
  puts "3️⃣  Creating sample development data..."
  puts ""
  
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
puts "🎉 Ready to browse the catalog!"
puts "=" * 80
