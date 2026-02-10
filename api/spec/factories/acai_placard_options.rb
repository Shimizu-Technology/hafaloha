FactoryBot.define do
  factory :acai_placard_option do
    sequence(:name) { |n| "Placard Option #{n}" }
    description { "A message placard option." }
    price_cents { 0 }
    available { true }
    sequence(:position) { |n| n - 1 }
  end
end
