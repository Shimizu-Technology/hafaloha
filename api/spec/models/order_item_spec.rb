require 'rails_helper'

RSpec.describe OrderItem, type: :model do
  describe 'validations' do
    it 'is valid with factory defaults' do
      expect(build(:order_item)).to be_valid
    end

    it 'requires quantity greater than zero' do
      item = build(:order_item, quantity: 0)

      expect(item).not_to be_valid
      expect(item.errors[:quantity]).to include('must be greater than 0')
    end
  end

  describe 'callbacks' do
    it 'calculates total_price_cents before validation' do
      item = build(:order_item, unit_price_cents: 1250, quantity: 3, total_price_cents: nil)
      item.valid?

      expect(item.total_price_cents).to eq(3_750)
    end

    it 'populates product fields from associations on new record' do
      product = create(:product, name: 'Team Shirt', sku_prefix: 'TS')
      variant = create(:product_variant, product: product, variant_name: 'M / Black', sku: 'TS-M-BLK', price_cents: 2999)
      item = described_class.new(order: create(:order, :guest), product: product, product_variant: variant, quantity: 1)

      item.valid?

      expect(item.product_name).to eq('Team Shirt')
      expect(item.variant_name).to eq('M / Black')
      expect(item.product_sku).to eq('TS-M-BLK')
      expect(item.unit_price_cents).to eq(2999)
    end
  end

  describe 'display helpers' do
    it 'uses variant name when product_variant exists' do
      item = build(:order_item, product_name: 'Açaí Cake', variant_name: 'Set A')
      expect(item.display_name).to eq('Açaí Cake - Set A')
    end
  end
end
