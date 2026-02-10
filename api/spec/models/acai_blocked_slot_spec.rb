require 'rails_helper'

RSpec.describe AcaiBlockedSlot, type: :model do
  describe 'validations' do
    it 'is valid with factory defaults' do
      expect(build(:acai_blocked_slot)).to be_valid
    end

    it 'requires end_time to be after start_time' do
      slot = build(:acai_blocked_slot, start_time: '17:00', end_time: '09:00')

      expect(slot).not_to be_valid
      expect(slot.errors[:end_time]).to include('must be after start time')
    end
  end

  describe '.is_blocked?' do
    it 'returns true when a time falls inside a blocked window' do
      date = Date.current + 1.day
      create(:acai_blocked_slot, blocked_date: date, start_time: '09:00', end_time: '11:00')

      expect(described_class.is_blocked?(date, '10:00')).to be(true)
      expect(described_class.is_blocked?(date, '12:00')).to be(false)
    end
  end

  describe '.blocks_slot?' do
    it 'parses 12-hour slot strings and checks block status' do
      date = Date.current + 1.day
      create(:acai_blocked_slot, blocked_date: date, start_time: '13:30', end_time: '14:30')

      expect(described_class.blocks_slot?(date, '01:30 PM - 02:00 PM')).to be(true)
      expect(described_class.blocks_slot?(date, '03:00 PM - 03:30 PM')).to be(false)
    end
  end

  describe '.block_day!' do
    it 'creates a full-day blocked slot' do
      date = Date.current + 2.days
      slot = described_class.block_day!(date, reason: 'Holiday')

      expect(slot.blocked_date).to eq(date)
      expect(slot.start_time_hhmm).to eq('00:00')
      expect(slot.end_time_hhmm).to eq('23:59')
      expect(slot.reason).to eq('Holiday')
    end
  end

  describe 'display helpers' do
    it 'builds a readable display_name' do
      slot = build(:acai_blocked_slot, blocked_date: Date.new(2026, 2, 12), start_time: '09:00', end_time: '10:00', reason: 'Event')

      expect(slot.display_name).to include('February 12, 2026')
      expect(slot.display_name).to include('9:00 AM - 10:00 AM')
      expect(slot.display_name).to include('(Event)')
    end
  end
end
