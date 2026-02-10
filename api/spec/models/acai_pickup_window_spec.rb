require 'rails_helper'

RSpec.describe AcaiPickupWindow, type: :model do
  describe 'validations' do
    it 'is valid with factory defaults' do
      expect(build(:acai_pickup_window)).to be_valid
    end

    it 'requires day_of_week to be between 0 and 6' do
      window = build(:acai_pickup_window, day_of_week: 7)

      expect(window).not_to be_valid
      expect(window.errors[:day_of_week]).to include('is not included in the list')
    end

    it 'requires end_time to be after start_time' do
      window = build(:acai_pickup_window, start_time: '17:00', end_time: '09:00')

      expect(window).not_to be_valid
      expect(window.errors[:end_time]).to include('must be after start time')
    end
  end

  describe 'display helpers' do
    let(:window) { build(:acai_pickup_window, day_of_week: 1, start_time: '09:00', end_time: '17:00') }

    it 'returns day_name' do
      expect(window.day_name).to eq('Monday')
    end

    it 'returns start/end time in HH:MM format' do
      expect(window.start_time_hhmm).to eq('09:00')
      expect(window.end_time_hhmm).to eq('17:00')
    end

    it 'builds display_name with day and range' do
      expect(window.display_name).to include('Monday')
      expect(window.display_name).to include('9:00 AM')
      expect(window.display_name).to include('5:00 PM')
    end
  end

  describe '#includes_time?' do
    let(:window) { build(:acai_pickup_window, day_of_week: 1, start_time: '09:00', end_time: '17:00') }

    it 'returns true for datetime on same day and in range' do
      datetime = Time.zone.local(2026, 2, 9, 10, 30) # Monday
      expect(window.includes_time?(datetime)).to be(true)
    end

    it 'returns false for datetime on a different day' do
      datetime = Time.zone.local(2026, 2, 10, 10, 30) # Tuesday
      expect(window.includes_time?(datetime)).to be(false)
    end
  end

  describe '#available_slots_for_date' do
    it 'returns empty list when window is inactive' do
      window = create(:acai_pickup_window, active: false, day_of_week: 1, start_time: '09:00', end_time: '10:00')
      date = Date.new(2026, 2, 9) # Monday

      expect(window.available_slots_for_date(date)).to eq([])
    end

    it 'returns empty list when date does not match day_of_week' do
      window = create(:acai_pickup_window, active: true, day_of_week: 1, start_time: '09:00', end_time: '10:00')
      date = Date.new(2026, 2, 10) # Tuesday

      expect(window.available_slots_for_date(date)).to eq([])
    end
  end
end
