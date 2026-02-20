# frozen_string_literal: true

class SendOrderSmsJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: :polynomially_longer, attempts: 3
  discard_on ActiveRecord::RecordNotFound

  # @param order_id [Integer]
  # @param event [String] one of: "placed", "confirmed", "preparing", "ready",
  #   "shipped", "picked_up", "delivered", "cancelled"
  def perform(order_id, event)
    order = Order.find(order_id)
    SmsService.send_order_sms(order, event)
  end
end
