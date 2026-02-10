require 'rails_helper'

RSpec.describe AcaiSetting, type: :model do
  describe 'validations' do
    it 'is valid with factory defaults' do
      expect(build(:acai_setting)).to be_valid
    end

    it 'requires a name' do
      setting = build(:acai_setting, name: nil)

      expect(setting).not_to be_valid
      expect(setting.errors[:name]).to include("can't be blank")
    end

    it 'requires max_per_slot to be greater than zero' do
      setting = build(:acai_setting, max_per_slot: 0)

      expect(setting).not_to be_valid
      expect(setting.errors[:max_per_slot]).to include('must be greater than 0')
    end

    it 'requires non-negative base_price_cents' do
      setting = build(:acai_setting, base_price_cents: -1)

      expect(setting).not_to be_valid
      expect(setting.errors[:base_price_cents]).to include('must be greater than or equal to 0')
    end
  end

  describe 'price helpers' do
    it 'formats base price as USD string' do
      setting = build(:acai_setting, base_price_cents: 6200)

      expect(setting.formatted_price).to eq('$62.00')
    end

    it 'sets base_price_cents from decimal input' do
      setting = build(:acai_setting)
      setting.base_price = 12.34

      expect(setting.base_price_cents).to eq(1234)
    end
  end

  describe '#ordering_enabled?' do
    it 'returns false when setting is inactive' do
      setting = build(:acai_setting, active: false)
      create(:acai_pickup_window, active: true, day_of_week: 1, start_time: '09:00', end_time: '17:00')

      expect(setting.ordering_enabled?).to be(false)
    end

    it 'returns true when active and at least one active pickup window exists' do
      setting = build(:acai_setting, active: true)
      create(:acai_pickup_window, active: true, day_of_week: 2, start_time: '09:00', end_time: '17:00')

      expect(setting.ordering_enabled?).to be(true)
    end
  end

  describe '#minimum_order_date' do
    it 'uses advance_hours offset from current time' do
      setting = build(:acai_setting, advance_hours: 48)

      expect(setting.minimum_order_date).to eq((Time.current + 48.hours).to_date)
    end
  end

  describe '.instance' do
    it 'returns a singleton record' do
      first = described_class.instance
      second = described_class.instance

      expect(first.id).to eq(second.id)
    end
  end
end
