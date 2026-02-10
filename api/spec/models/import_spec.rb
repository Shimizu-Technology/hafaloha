require 'rails_helper'

RSpec.describe Import, type: :model do
  describe 'validations' do
    it 'is valid with factory defaults' do
      expect(build(:import)).to be_valid
    end

    it 'restricts status values' do
      record = build(:import, status: 'unknown')

      expect(record).not_to be_valid
      expect(record.errors[:status]).to include('is not included in the list')
    end
  end

  describe 'state transitions' do
    it 'marks processing with start time' do
      record = create(:import, status: 'pending', started_at: nil)
      record.processing!

      expect(record.reload.status).to eq('processing')
      expect(record.started_at).to be_present
    end

    it 'updates progress metrics' do
      record = create(:import, status: 'processing')
      record.update_progress(processed: 2, total: 8, step: 'Parsing')

      record.reload
      expect(record.processed_products).to eq(2)
      expect(record.total_products).to eq(8)
      expect(record.progress_percent).to eq(25)
      expect(record.current_step).to eq('Parsing')
      expect(record.last_progress_at).to be_present
    end

    it 'marks completed with summary stats' do
      record = create(:import, status: 'processing', total_products: 3)
      record.complete!(
        products_created: 2,
        variants_created: 4,
        variants_skipped: 1,
        images_created: 2,
        collections_created: 1,
        products_skipped: 1,
        created_products: ['A', 'B'],
        warnings: ['warn']
      )

      record.reload
      expect(record.status).to eq('completed')
      expect(record.progress_percent).to eq(100)
      expect(record.current_step).to eq('Completed')
      expect(record.warnings).to include('✅ Created: A')
      expect(record.warnings).to include('warn')
    end

    it 'marks failed with error text' do
      record = create(:import, status: 'processing')
      record.fail!('failed reason')

      record.reload
      expect(record.status).to eq('failed')
      expect(record.error_messages).to eq('failed reason')
      expect(record.current_step).to eq('Failed')
    end
  end

  describe 'progress helpers' do
    it 'reports stale processing and marks it failed' do
      record = create(:import, status: 'processing', started_at: 2.hours.ago, last_progress_at: 2.hours.ago)

      expect(record.stale_processing?(30)).to be(true)
      expect(record.mark_stale_processing!(30)).to be(true)
      expect(record.reload.status).to eq('failed')
    end

    it 'returns eta_seconds when enough progress exists' do
      record = create(:import, status: 'processing', started_at: 20.seconds.ago, processed_products: 5, total_products: 10)

      expect(record.eta_seconds).to be_a(Integer)
      expect(record.eta_seconds).to be >= 0
    end
  end
end
