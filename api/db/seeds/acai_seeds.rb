# frozen_string_literal: true

# Acai Cakes Seed Data
# Run with: bin/rails runner db/seeds/acai_seeds.rb

puts "🍰 Seeding Acai Cakes data..."

# Create default settings (singleton will create with defaults if not exists)
settings = AcaiSetting.instance
settings.update!(
  name: 'Acai Cake (10" )',
  description: "Choose Set A or Set B and customize with crust and add-ons.\n\nPick-up available: Monday - Saturday (9:00am - 4:00pm)\nPick-up time slots are limited and subject to availability.",
  pickup_instructions: "Reservations made on this site are not final and may be subject to cancellation. Acai Cake reservations made within 48 hours notice cannot be guaranteed.",
  toppings_info: {
    display_copy: "Set A: Blueberry, Banana, Strawberry | Set B: Coconut, Mango, Strawberry",
    add_on_options: [
      { name: "None", price_cents: 0, position: 1 },
      { name: "Banana", price_cents: 300, position: 2 },
      { name: "Blueberry", price_cents: 300, position: 3 },
      { name: "Strawberry", price_cents: 300, position: 4 },
      { name: "Mango", price_cents: 300, position: 5 },
      { name: "Coconut", price_cents: 300, position: 6 }
    ]
  }.to_json
)
puts "  ✅ AcaiSetting created/loaded: #{settings.name} - #{settings.formatted_price}"

# Create crust options matching hafaloha.com pricing
crust_options = [
  { name: 'Peanut Butter', description: 'Creamy peanut butter base for a nutty twist', price_cents: 0, position: 1 },
  { name: 'Nutella', description: 'Rich chocolate hazelnut spread base', price_cents: 450, position: 2 },
  { name: 'Honey', description: 'Simple sweet honey drizzle base', price_cents: 450, position: 3 }
]

crust_options.each do |attrs|
  option = AcaiCrustOption.find_or_initialize_by(name: attrs[:name])
  option.assign_attributes(
    description: attrs[:description],
    price_cents: attrs[:price_cents],
    position: attrs[:position],
    available: true
  )
  option.save!
  puts "  ✅ Crust Option: #{option.name} (#{option.formatted_price})"
end

# Create placard options
placard_options = [
  { name: 'Happy Birthday', description: 'Birthday celebration placard', price_cents: 0, position: 1 },
  { name: 'Happy Anniversary', description: 'Anniversary celebration placard', price_cents: 0, position: 2 },
  { name: 'Congratulations', description: 'Congratulations placard', price_cents: 0, position: 3 },
  { name: 'Happy Mother\'s Day', description: 'Mother\'s Day special placard', price_cents: 0, position: 4 },
  { name: 'Happy Father\'s Day', description: 'Father\'s Day special placard', price_cents: 0, position: 5 },
  { name: 'Thank You', description: 'Appreciation placard', price_cents: 0, position: 6 },
  { name: 'Custom Message', description: 'Write your own message', price_cents: 0, position: 7 }
]

placard_options.each do |attrs|
  option = AcaiPlacardOption.find_or_initialize_by(name: attrs[:name])
  option.assign_attributes(
    description: attrs[:description],
    price_cents: attrs[:price_cents],
    position: attrs[:position],
    available: true
  )
  option.save!
  puts "  ✅ Placard Option: #{option.name}"
end

pickup_windows = [
  { day_of_week: 0, start_time: '09:00', end_time: '16:00', active: false, capacity: 10 }, # Sunday
  { day_of_week: 1, start_time: '09:00', end_time: '16:00', active: true,  capacity: 10 }, # Monday
  { day_of_week: 2, start_time: '09:00', end_time: '16:00', active: true,  capacity: 10 }, # Tuesday
  { day_of_week: 3, start_time: '09:00', end_time: '16:00', active: true,  capacity: 10 }, # Wednesday
  { day_of_week: 4, start_time: '09:00', end_time: '16:00', active: true,  capacity: 10 }, # Thursday
  { day_of_week: 5, start_time: '09:00', end_time: '16:00', active: true,  capacity: 10 }, # Friday
  { day_of_week: 6, start_time: '09:00', end_time: '16:00', active: true,  capacity: 10 }  # Saturday
]

pickup_windows.each do |attrs|
  window = AcaiPickupWindow.find_or_initialize_by(day_of_week: attrs[:day_of_week])
  window.assign_attributes(
    start_time: attrs[:start_time],
    end_time: attrs[:end_time],
    active: attrs[:active],
    capacity: attrs[:capacity]
  )
  window.save!
  puts "  ✅ Pickup Window: #{window.display_name}"
end

puts ""
puts "🎉 Acai Cakes seed data complete!"
puts "   - #{AcaiCrustOption.count} crust options"
puts "   - #{AcaiPlacardOption.count} placard options"
puts "   - Add-ons: None, Banana, Blueberry, Strawberry, Mango, Coconut"
puts "   - #{AcaiPickupWindow.count} pickup windows"
puts ""
puts "💡 To test, visit: GET /api/v1/acai/config"
