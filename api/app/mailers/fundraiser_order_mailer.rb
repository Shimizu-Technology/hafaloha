# frozen_string_literal: true

class FundraiserOrderMailer < ApplicationMailer
  default from: -> { "Hafaloha <#{SiteSetting.instance.store_email || 'info@hafaloha.com'}>" }

  # Sent to the fundraiser contact when a new order is placed
  def order_notification(fundraiser_order)
    @order = fundraiser_order
    @fundraiser = fundraiser_order.fundraiser
    @participant = fundraiser_order.participant

    return unless @fundraiser.contact_email.present?

    mail(
      to: @fundraiser.contact_email,
      subject: "New Fundraiser Order ##{@order.order_number} - #{@fundraiser.name}"
    )
  end

  # Sent to the customer confirming their order
  def order_confirmation(fundraiser_order)
    @order = fundraiser_order
    @fundraiser = fundraiser_order.fundraiser
    @participant = fundraiser_order.participant

    return unless @order.customer_email.present?

    mail(
      to: @order.customer_email,
      subject: "Order Confirmation ##{@order.order_number} - #{@fundraiser.name}"
    )
  end
end
