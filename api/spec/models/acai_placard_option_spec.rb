require 'rails_helper'

RSpec.describe AcaiPlacardOption, type: :model do
  describe 'validations' do
    it 'is valid with factory defaults' do
      expect(build(:acai_placard_option)).to be_valid
    end

    it 'requires a name' do
      option = build(:acai_placard_option, name: nil)

      expect(option).not_to be_valid
      expect(option.errors[:name]).to include("can't be blank")
    end

    it 'requires non-negative price_cents' do
      option = build(:acai_placard_option, price_cents: -1)

      expect(option).not_to be_valid
      expect(option.errors[:price_cents]).to include('must be greater than or equal to 0')
    end
  end

  describe 'price helpers' do
    it 'formats included option text for zero price' do
      option = build(:acai_placard_option, price_cents: 0)
      expect(option.formatted_price).to eq('Included')
    end

    it 'formats positive price with plus prefix' do
      option = build(:acai_placard_option, price_cents: 125)
      expect(option.formatted_price).to eq('+$1.25')
    end

    it 'sets price_cents from decimal assignment' do
      option = build(:acai_placard_option)
      option.price = 4.5

      expect(option.price_cents).to eq(450)
    end
  end

  describe '.for_display' do
    it 'returns available options ordered by position then name' do
      a = create(:acai_placard_option, name: 'A', position: 1, available: true)
      _hidden = create(:acai_placard_option, name: 'Hidden', position: 0, available: false)
      b = create(:acai_placard_option, name: 'B', position: 1, available: true)
      c = create(:acai_placard_option, name: 'C', position: 2, available: true)

      expect(described_class.for_display).to eq([a, b, c])
    end
  end
end
