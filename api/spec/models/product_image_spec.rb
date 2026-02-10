require 'rails_helper'

RSpec.describe ProductImage, type: :model do
  describe 'validations' do
    it 'is valid with factory defaults' do
      expect(build(:product_image)).to be_valid
    end

    it 'requires url when s3_key is blank' do
      image = build(:product_image, s3_key: nil, url: nil)

      expect(image).not_to be_valid
      expect(image.errors[:url]).to include("can't be blank")
    end
  end

  describe 'callbacks' do
    it 'marks first image as primary' do
      product = create(:product)
      first = create(:product_image, product: product, primary: false)

      expect(first.reload.primary).to be(true)
    end

    it 'reassigns primary when primary image is deleted' do
      product = create(:product)
      first = create(:product_image, product: product, position: 1)
      second = create(:product_image, product: product, position: 2)
      first.update!(primary: true)
      second.update!(primary: false)

      first.destroy!

      expect(second.reload.primary).to be(true)
    end
  end

  describe '#signed_url' do
    it 'returns url fallback when s3_key is blank' do
      image = build(:product_image, s3_key: nil, url: 'https://legacy.example.com/image.jpg')

      expect(image.signed_url).to eq('https://legacy.example.com/image.jpg')
    end

    it 'returns url fallback when blob is missing' do
      image = build(:product_image, s3_key: 'missing/key.jpg', url: 'https://fallback.example.com/image.jpg')

      expect(image.signed_url).to eq('https://fallback.example.com/image.jpg')
    end
  end
end
