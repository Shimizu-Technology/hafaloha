FactoryBot.define do
  factory :acai_blocked_slot do
    blocked_date { Date.current + 1.day }
    start_time { '09:00' }
    end_time { '17:00' }
    reason { 'Maintenance window' }
  end
end
