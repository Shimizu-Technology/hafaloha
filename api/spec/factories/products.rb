FactoryBot.define do
  factory :product do
    sequence(:name) { |n| "Product #{n}" }
    sequence(:slug) { |n| "product-#{n}" }
    description { "Product description" }
    base_price_cents { 2500 }
    sku_prefix { "PRD" }
    track_inventory { false }
    weight_oz { 9.99 }
    published { true }
    featured { false }
    product_type { "apparel" }
    shopify_product_id { nil }
    vendor { "Hafaloha" }
    meta_title { "Product Meta Title" }
    meta_description { "Product meta description" }
    inventory_level { "none" }
    archived { false }
  end
end
