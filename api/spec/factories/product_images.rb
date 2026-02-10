FactoryBot.define do
  factory :product_image do
    product
    url { "https://example.com/image.jpg" }
    alt_text { "Product image" }
    position { 1 }
    primary { false }
    shopify_image_id { nil }
    sequence(:s3_key) { |n| "products/image-#{n}.jpg" }
  end
end
