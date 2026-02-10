require 'rails_helper'

RSpec.describe Collection, type: :model do
  describe 'validations' do
    it 'is valid with factory defaults' do
      expect(build(:collection)).to be_valid
    end

    it 'requires unique slug' do
      create(:collection, slug: 'tees')
      duplicate = build(:collection, slug: 'tees')

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:slug]).to include('has already been taken')
    end

    it 'enforces slug format' do
      collection = build(:collection, slug: 'Invalid Slug')

      expect(collection).not_to be_valid
      expect(collection.errors[:slug]).to include('is invalid')
    end
  end

  describe 'callbacks and helpers' do
    it 'generates slug when missing' do
      collection = Collection.create!(name: 'Summer Collection', slug: nil)

      expect(collection.slug).to eq('summer-collection')
      expect(collection.to_param).to eq('summer-collection')
    end
  end

  describe 'scopes' do
    it 'filters published, featured, and ordered collections' do
      featured = create(:collection, published: true, featured: true, sort_order: 1, name: 'A')
      published_only = create(:collection, published: true, featured: false, sort_order: 2, name: 'B')
      unpublished = create(:collection, published: false, featured: false, sort_order: 0, name: 'C')

      expect(described_class.published).to include(featured, published_only)
      expect(described_class.featured).to include(featured)
      expect(described_class.by_position.to_a).to eq([unpublished, featured, published_only])
    end
  end
end
