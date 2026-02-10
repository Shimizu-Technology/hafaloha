FactoryBot.define do
  factory :fundraiser do
    sequence(:name) { |n| "Fundraiser #{n}" }
    sequence(:slug) { |n| "fundraiser-#{n}" }
    organization_name { "Hafaloha Foundation" }
    description { "Fundraiser description" }
    contact_name { "Fundraiser Contact" }
    sequence(:contact_email) { |n| "fundraiser#{n}@example.com" }
    contact_phone { "671-555-0000" }
    start_date { Date.current - 1.day }
    end_date { Date.current + 30.days }
    status { "active" }
    goal_amount_cents { 100_000 }
    raised_amount_cents { 0 }
    image_url { "https://example.com/fundraiser.jpg" }
    payout_percentage { 20.0 }
    published { true }
  end
end
