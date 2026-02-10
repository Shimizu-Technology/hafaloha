FactoryBot.define do
  factory :order_item do
    order
    product
    product_variant
    quantity { 2 }
    unit_price_cents { 1500 }
    total_price_cents { 3000 }
    product_name { product.name }
    variant_name { product_variant.display_name }
    product_sku { product_variant.sku }
  end
end
