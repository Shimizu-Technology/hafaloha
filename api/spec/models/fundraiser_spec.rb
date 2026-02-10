require 'rails_helper'

RSpec.describe Fundraiser, type: :model do
  describe 'validations' do
    it 'is valid with factory defaults' do
      expect(build(:fundraiser)).to be_valid
    end

    it 'requires unique slug' do
      create(:fundraiser, slug: 'spring-drive')
      duplicate = build(:fundraiser, slug: 'spring-drive')

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:slug]).to include('has already been taken')
    end
  end

  describe 'callbacks and helpers' do
    it 'generates slug from name when blank' do
      fundraiser = Fundraiser.create!(name: 'Island Drive', slug: nil, organization_name: 'Org', status: 'draft')

      expect(fundraiser.slug).to eq('island-drive')
      expect(fundraiser.to_param).to eq('island-drive')
    end

    it 'reports current and active status correctly' do
      fundraiser = build(:fundraiser, status: 'active', start_date: Date.current - 1.day, end_date: Date.current + 1.day)

      expect(fundraiser.current?).to be(true)
      expect(fundraiser.active?).to be(true)
      expect(fundraiser.ended?).to be(false)
    end
  end

  describe 'money and progress helpers' do
    it 'updates goal_amount_cents from decimal assignment' do
      fundraiser = build(:fundraiser)
      fundraiser.goal_amount = 250.75

      expect(fundraiser.goal_amount_cents).to eq(25_075)
    end

    it 'computes progress percentage and organization payout' do
      fundraiser = build(:fundraiser, goal_amount_cents: 100_000, raised_amount_cents: 25_000, payout_percentage: 20.0)

      expect(fundraiser.progress_percentage).to eq(25.0)
      expect(fundraiser.organization_payout_cents).to eq(5_000)
    end
  end

  describe '#update_raised_amount!' do
    it 'recomputes raised total from paid fundraiser orders' do
      fundraiser = create(:fundraiser, raised_amount_cents: 0)
      participant = create(:participant, fundraiser: fundraiser)

      FundraiserOrder.create!(
        fundraiser: fundraiser,
        participant: participant,
        customer_email: 'paid@example.com',
        status: 'paid',
        payment_status: 'paid',
        total_cents: 5_000
      )
      FundraiserOrder.create!(
        fundraiser: fundraiser,
        participant: participant,
        customer_email: 'pending@example.com',
        status: 'pending',
        payment_status: 'pending',
        total_cents: 9_000
      )

      fundraiser.update_raised_amount!

      expect(fundraiser.reload.raised_amount_cents).to eq(5_000)
    end
  end
end
