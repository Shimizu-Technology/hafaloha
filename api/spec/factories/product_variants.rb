FactoryBot.define do
  factory :product_variant do
    product
    size { "M" }
    color { "Black" }
    variant_key { "m-black" }
    variant_name { "M / Black" }
    sequence(:sku) { |n| "PRD-VAR-#{n}" }
    price_cents { 2500 }
    stock_quantity { 10 }
    available { true }
    weight_oz { 9.99 }
    shopify_variant_id { nil }
    barcode { nil }
  end
end
