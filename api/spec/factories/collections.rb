FactoryBot.define do
  factory :collection do
    sequence(:name) { |n| "Collection #{n}" }
    sequence(:slug) { |n| "collection-#{n}" }
    description { "Collection description" }
    image_url { "https://example.com/collection.jpg" }
    published { true }
    featured { false }
    sort_order { 1 }
    meta_title { "Collection Meta Title" }
    meta_description { "Collection meta description" }
  end
end
