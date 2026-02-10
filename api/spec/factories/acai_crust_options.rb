FactoryBot.define do
  factory :acai_crust_option do
    sequence(:name) { |n| "Crust Option #{n}" }
    description { "A custom crust/base option." }
    price_cents { 0 }
    available { true }
    sequence(:position) { |n| n - 1 }
  end
end
