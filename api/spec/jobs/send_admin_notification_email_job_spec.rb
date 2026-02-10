require 'rails_helper'

RSpec.describe SendAdminNotificationEmailJob, type: :job do
  describe '#perform' do
    let(:order) { create(:order, :guest) }

    before do
      allow(Rails.logger).to receive(:info)
      allow(Rails.logger).to receive(:error)
    end

    it 'sends admin notification for existing order' do
      expect(EmailService).to receive(:send_admin_notification).with(order).and_return({ success: true })

      described_class.perform_now(order.id)
    end

    it 'handles missing order gracefully' do
      expect(EmailService).not_to receive(:send_admin_notification)

      expect { described_class.perform_now(-1) }.not_to raise_error
      expect(Rails.logger).to have_received(:error).with(/not found/)
    end

    it 're-raises unexpected errors for retries' do
      allow(EmailService).to receive(:send_admin_notification).and_raise(StandardError, 'boom')

      expect { described_class.perform_now(order.id) }.to raise_error(StandardError, 'boom')
    end
  end
end
