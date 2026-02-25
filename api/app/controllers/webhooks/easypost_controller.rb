# frozen_string_literal: true

module Webhooks
  class EasypostController < ApplicationController
    # EasyPost sends raw JSON — we need the raw body for signature verification.
    # No authentication needed — webhooks come from EasyPost, not users.
    # CSRF is already disabled (Rails API-only app).
    before_action :set_raw_body

    # POST /webhooks/easypost
    def create
      event = verify_and_parse_event
      return head :bad_request unless event

      Rails.logger.info "[EasyPost Webhook] Received event: #{event.dig('description')} (id: #{event.dig('id')})"

      handle_event(event)

      head :ok
    end

    private

    # ── Signature Verification ──────────────────────────────────────

    def set_raw_body
      @raw_body = request.body.read
    end

    def verify_and_parse_event
      webhook_secret = ENV["EASYPOST_WEBHOOK_SECRET"]

      if webhook_secret.present?
        verify_signature(webhook_secret)
      else
        if Rails.env.production?
          Rails.logger.error "❌ EasyPost webhook secret missing in production; rejecting webhook"
          return nil
        end
        Rails.logger.warn "⚠️  EasyPost webhook signature verification SKIPPED (no webhook secret configured)"
      end

      parse_event
    rescue StandardError => e
      Rails.logger.error "❌ EasyPost webhook verification failed: #{e.message}"
      nil
    end

    def verify_signature(webhook_secret)
      signature = request.headers["X-Hmac-Signature"]

      unless signature.present?
        raise "Missing X-Hmac-Signature header"
      end

      expected = "hmac-sha256-hex=#{OpenSSL::HMAC.hexdigest('SHA256', webhook_secret, @raw_body)}"

      unless ActiveSupport::SecurityUtils.secure_compare(expected, signature)
        raise "Signature mismatch"
      end
    end

    def parse_event
      JSON.parse(@raw_body)
    rescue JSON::ParserError => e
      Rails.logger.error "❌ EasyPost webhook JSON parse error: #{e.message}"
      nil
    end

    # ── Event Routing ───────────────────────────────────────────────

    def handle_event(event)
      description = event["description"]

      case description
      when "tracker.updated"
        handle_tracker_updated(event["result"])
      else
        Rails.logger.info "[EasyPost Webhook] Unhandled event: #{description}"
      end
    end

    # ── Event Handlers ──────────────────────────────────────────────

    def handle_tracker_updated(tracker)
      return unless tracker.present?

      tracking_code = tracker["tracking_code"]
      tracker_status = tracker["status"]

      Rails.logger.info "[EasyPost Webhook] Tracker updated: #{tracking_code} → #{tracker_status}"

      order = Order.find_by(tracking_number: tracking_code)

      unless order
        Rails.logger.warn "[EasyPost Webhook] No order found for tracking_code: #{tracking_code}"
        return
      end

      Rails.logger.info "[EasyPost Webhook] Matched order ##{order.order_number} (current status: #{order.status})"

      case tracker_status
      when "in_transit"
        transition_order(order, "shipped")
      when "out_for_delivery"
        # Keep as shipped — don't change status
        Rails.logger.info "[EasyPost Webhook] Order ##{order.order_number} out for delivery (keeping status: #{order.status})"
      when "delivered"
        transition_order(order, "delivered")
      when "return_to_sender", "failure"
        Rails.logger.warn "[EasyPost Webhook] ⚠️  Tracker #{tracker_status} for order ##{order.order_number} — manual review required"
      else
        Rails.logger.info "[EasyPost Webhook] Tracker status '#{tracker_status}' — no action taken for order ##{order.order_number}"
      end
    end

    # ── Helpers ──────────────────────────────────────────────────────

    def transition_order(order, new_status)
      old_status = order.status

      # Don't transition backwards or to the same status
      return if old_status == new_status
      return if old_status == "delivered" # Already in terminal state
      return if %w[cancelled refunded].include?(old_status) # Don't touch cancelled/refunded orders

      order.update_column(:status, new_status)
      Rails.logger.info "[EasyPost Webhook] Order ##{order.order_number} status: #{old_status} → #{new_status}"

      # Send customer notifications
      case new_status
      when "shipped"
        SendOrderShippedEmailJob.perform_later(order.id)
        SendOrderSmsJob.perform_later(order.id, "shipped")
      when "delivered"
        SendOrderDeliveredEmailJob.perform_later(order.id)
        SendOrderSmsJob.perform_later(order.id, "delivered")
      end
    end
  end
end
