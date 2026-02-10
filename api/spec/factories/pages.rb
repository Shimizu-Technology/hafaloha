FactoryBot.define do
  factory :page do
    sequence(:title) { |n| "Page #{n}" }
    sequence(:slug) { |n| "page-#{n}" }
    content { "Page content" }
    published { true }
    meta_title { "Page Meta Title" }
    meta_description { "Page meta description" }
  end
end
