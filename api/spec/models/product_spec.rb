require 'rails_helper'

RSpec.describe Product, type: :model do
  describe 'validations' do
    it 'is valid with factory defaults' do
      expect(build(:product)).to be_valid
    end

    it 'requires inventory_level to be one of allowed values' do
      product = build(:product, inventory_level: 'invalid')

      expect(product).not_to be_valid
      expect(product.errors[:inventory_level]).to include('is not included in the list')
    end
  end

  describe 'callbacks and identifiers' do
    it 'generates slug when blank' do
      product = Product.create!(name: 'Island Tee', slug: nil, inventory_level: 'none')

      expect(product.slug).to eq('island-tee')
      expect(product.to_param).to eq('island-tee')
    end

    it 'generates sku_prefix when blank' do
      product = Product.create!(name: 'Hafaloha Shirt', slug: 'hafaloha-shirt', sku_prefix: nil, inventory_level: 'none')

      expect(product.sku_prefix).to be_present
    end
  end

  describe 'availability helpers' do
    it 'treats inventory_level none as in stock' do
      product = build(:product, inventory_level: 'none', published: true, archived: false)

      expect(product.in_stock?).to be(true)
      expect(product.actually_available?).to be(true)
    end

    it 'uses product stock quantity for product-level tracking' do
      product = build(:product, inventory_level: 'product', product_stock_quantity: 0, published: true, archived: false)

      expect(product.in_stock?).to be(false)
      expect(product.product_stock_status).to eq('out_of_stock')
    end
  end

  describe 'archive helpers' do
    it 'archives and unarchives correctly' do
      product = create(:product, published: true, archived: false)

      product.archive!
      expect(product.reload.archived?).to be(true)
      expect(product.published).to be(false)

      product.unarchive!
      expect(product.reload.archived?).to be(false)
    end
  end
end
