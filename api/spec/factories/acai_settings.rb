FactoryBot.define do
  factory :acai_setting do
    base_price_cents { 6200 }
    name { 'Acai Cake (10")' }
    description { "House acai cake with customizable toppings." }
    pickup_location { "121 E. Marine Corps Dr, Hagatna, Guam" }
    pickup_instructions { "Call when you arrive for curbside pickup." }
    pickup_phone { "671-472-7733" }
    advance_hours { 48 }
    max_per_slot { 5 }
    active { true }
    placard_enabled { true }
    placard_price_cents { 0 }
    toppings_info { "Set A: Blueberry, Banana, Strawberry | Set B: Coconut, Mango, Strawberry" }
  end
end
