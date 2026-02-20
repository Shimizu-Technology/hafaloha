class SendOrderDeliveredEmailJob < ApplicationJob
  queue_as :default

  def perform(order_id)
    order = Order.find(order_id)

    settings = SiteSetting.instance
    return unless settings.send_emails_for?(order.order_type)

    EmailService.send_order_delivered_email(order)

    Rails.logger.info "✅ Sent delivered notification email for order #{order.order_number}"
  rescue StandardError => e
    Rails.logger.error "❌ Failed to send delivered email for order #{order_id}: #{e.message}"
  end
end
