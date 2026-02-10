require 'rails_helper'

RSpec.describe Participant, type: :model do
  describe 'validations' do
    it 'is valid with factory defaults' do
      expect(build(:participant)).to be_valid
    end

    it 'requires valid email format when present' do
      participant = build(:participant, email: 'not-an-email')

      expect(participant).not_to be_valid
      expect(participant.errors[:email]).to be_present
    end

    it 'requires participant_number uniqueness within fundraiser' do
      fundraiser = create(:fundraiser)
      create(:participant, fundraiser: fundraiser, participant_number: '007')
      duplicate = build(:participant, fundraiser: fundraiser, participant_number: '007')

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:participant_number]).to include('has already been taken')
    end
  end

  describe 'callbacks and helpers' do
    it 'auto-generates unique_code when blank' do
      participant = create(:participant, unique_code: nil)

      expect(participant.unique_code).to be_present
      expect(participant.unique_code).to match(/\A[A-Z0-9]{4}-[A-Z0-9]{4}\z/)
    end

    it 'formats display_name with participant number when present' do
      participant = build(:participant, participant_number: '012', name: 'Jane')
      expect(participant.display_name).to eq('#012 - Jane')
    end
  end

  describe 'goal and progress' do
    it 'sets goal_amount_cents from decimal assignment' do
      participant = build(:participant)
      participant.goal_amount = 123.45

      expect(participant.goal_amount_cents).to eq(12_345)
    end

    it 'computes raised totals and progress from paid fundraiser orders' do
      fundraiser = create(:fundraiser)
      participant = create(:participant, fundraiser: fundraiser, goal_amount_cents: 10_000)

      FundraiserOrder.create!(
        fundraiser: fundraiser,
        participant: participant,
        customer_email: 'paid@example.com',
        status: 'paid',
        payment_status: 'paid',
        total_cents: 2_500
      )
      FundraiserOrder.create!(
        fundraiser: fundraiser,
        participant: participant,
        customer_email: 'pending@example.com',
        status: 'pending',
        payment_status: 'pending',
        total_cents: 4_000
      )

      expect(participant.total_raised_cents).to eq(2_500)
      expect(participant.order_count).to eq(1)
      expect(participant.progress_percentage).to eq(25.0)
    end
  end
end
