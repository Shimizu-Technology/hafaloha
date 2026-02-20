class SendOrderPickedUpEmailJob < ApplicationJob
  queue_as :default

  def perform(order_id)
    order = Order.find(order_id)

    settings = SiteSetting.instance
    return unless settings.send_emails_for?(order.order_type)

    EmailService.send_order_picked_up_email(order)

    Rails.logger.info "✅ Sent picked up notification email for order #{order.order_number}"
  rescue StandardError => e
    Rails.logger.error "❌ Failed to send picked up email for order #{order_id}: #{e.message}"
  end
end
