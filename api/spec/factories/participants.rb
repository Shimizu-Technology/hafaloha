FactoryBot.define do
  factory :participant do
    fundraiser
    sequence(:name) { |n| "Participant #{n}" }
    sequence(:participant_number) { |n| n.to_s.rjust(3, '0') }
    sequence(:email) { |n| "participant#{n}@example.com" }
    phone { "671-555-1111" }
    notes { "Participant notes" }
    active { true }
    goal_amount_cents { 50_000 }
  end
end
