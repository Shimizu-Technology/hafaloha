require 'rails_helper'

RSpec.describe ProductVariant, type: :model do
  describe 'validations' do
    it 'is valid with factory defaults' do
      expect(build(:product_variant)).to be_valid
    end

    it 'requires unique sku' do
      create(:product_variant, sku: 'UNIQUE-SKU-1')
      duplicate = build(:product_variant, sku: 'UNIQUE-SKU-1')

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:sku]).to include('has already been taken')
    end
  end

  describe 'display helpers' do
    it 'builds display_name from options when present' do
      variant = build(:product_variant, options: { 'Size' => 'L', 'Color' => 'Blue' }, variant_name: nil)

      expect(variant.display_name).to eq('L / Blue')
    end

    it 'normalizes default size tokens in legacy display name' do
      variant = build(:product_variant, options: {}, variant_name: nil, size: 'Default Title', color: 'Red')

      expect(variant.display_name).to eq('One Size / Red')
    end
  end

  describe 'availability helpers' do
    it 'requires both available and stock for variant-level tracking' do
      product = create(:product, inventory_level: 'variant', published: true, archived: false)
      variant = create(:product_variant, product: product, available: true, stock_quantity: 0)

      expect(variant.actually_available?).to be(false)

      variant.update!(stock_quantity: 5)
      expect(variant.reload.actually_available?).to be(true)
    end
  end

  describe 'callbacks' do
    it 'generates variant_key from options when blank' do
      product = create(:product, inventory_level: 'variant')
      variant = described_class.create!(
        product: product,
        options: { 'Size' => 'XL', 'Color' => 'Black' },
        variant_key: nil,
        variant_name: nil,
        sku: nil,
        price_cents: 3000,
        stock_quantity: 5,
        available: true,
        weight_oz: 8.0
      )

      expect(variant.variant_key).to eq('xl-black')
      expect(variant.sku).to include(product.sku_prefix)
    end
  end
end
