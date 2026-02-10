require 'rails_helper'

RSpec.describe ProductCollection, type: :model do
  describe 'associations' do
    it 'is valid with product and collection' do
      expect(build(:product_collection)).to be_valid
    end
  end

  describe 'uniqueness' do
    it 'allows only one join per product/collection pair' do
      product = create(:product)
      collection = create(:collection)
      create(:product_collection, product: product, collection: collection)

      duplicate = build(:product_collection, product: product, collection: collection)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:product_id]).to include('has already been taken')
    end
  end
end
