FactoryBot.define do
  factory :acai_pickup_window do
    day_of_week { 1 } # Monday
    start_time { '09:00' }
    end_time { '17:00' }
    active { true }
    capacity { 5 }
  end
end
