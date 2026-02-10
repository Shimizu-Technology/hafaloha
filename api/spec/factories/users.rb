FactoryBot.define do
  factory :user do
    sequence(:clerk_id) { |n| "clerk_test_#{n}" }
    sequence(:email) { |n| "user#{n}@example.com" }
    name { "Test User" }
    phone { "671-555-0100" }
    role { "customer" }

    trait :admin do
      role { "admin" }
    end
  end
end
