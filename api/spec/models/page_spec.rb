require 'rails_helper'

RSpec.describe Page, type: :model do
  describe 'validations' do
    it 'is valid with factory defaults' do
      expect(build(:page)).to be_valid
    end

    it 'requires unique slug' do
      create(:page, slug: 'about')
      duplicate = build(:page, slug: 'about')

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:slug]).to include('has already been taken')
    end

    it 'enforces slug format' do
      page = build(:page, slug: 'Invalid Slug')

      expect(page).not_to be_valid
      expect(page.errors[:slug]).to include('is invalid')
    end
  end

  describe 'callbacks and helpers' do
    it 'generates slug from title when blank' do
      page = Page.create!(title: 'Shipping Info', slug: nil)

      expect(page.slug).to eq('shipping-info')
      expect(page.to_param).to eq('shipping-info')
    end
  end
end
