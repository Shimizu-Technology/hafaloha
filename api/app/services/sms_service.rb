# frozen_string_literal: true

require "net/http"
require "json"

# Sends SMS notifications via ClickSend API
# Ported from Three Squares, adapted for Hafaloha
class SmsService
  CLICKSEND_API_URL = "https://rest.clicksend.com/v3/sms/send"

  class << self
    # Send SMS to customer for order status updates
    def send_order_sms(order, event)
      return skip_result("No customer phone") unless order.customer_phone.present?
      return skip_result("SMS notifications disabled") unless sms_enabled?

      message = order_message(order, event)
      return skip_result("No message for event: #{event}") unless message

      send_sms(to: order.customer_phone, body: message, context: "#{event}:#{order.id}")
    end

    # Send SMS to admin phones when a new order comes in
    def send_admin_order_sms(order)
      return skip_result("SMS not configured") unless clicksend_configured?
      return skip_result("SMS notifications disabled") unless SiteSetting.instance.send_sms_notifications

      # Try location-specific admin phones first, fall back to global
      location = order.location
      admin_phones = if location&.admin_sms_phones.present? && location.admin_sms_phones.any?
        location.admin_sms_phones
      else
        SiteSetting.instance.admin_sms_phones || []
      end
      return skip_result("No admin SMS phones configured") if admin_phones.empty?

      location_name = location&.name || "Online"
      order_type = order.order_type&.capitalize || "Retail"
      message = "NEW ORDER ##{order.order_number} (#{order_type}) - " \
                "$#{format_price(order.total_cents)} - #{order.name || 'Guest'} " \
                "- #{location_name}"

      results = admin_phones.map do |phone|
        send_sms(to: phone, body: message, context: "admin_new_order:#{order.id}")
      end

      { success: results.all? { |r| r[:success] }, results: results }
    end

    private

    def sms_enabled?
      return false unless clicksend_configured?

      settings = SiteSetting.instance
      settings.send_sms_notifications && settings.sms_order_updates
    end

    def clicksend_configured?
      ENV["CLICKSEND_USERNAME"].present? && ENV["CLICKSEND_API_KEY"].present?
    end

    def send_sms(to:, body:, context: nil)
      normalized = normalize_phone(to)
      return skip_result("Invalid phone number: #{to}") unless normalized

      uri = URI(CLICKSEND_API_URL)
      request = Net::HTTP::Post.new(uri)
      request.basic_auth(ENV["CLICKSEND_USERNAME"], ENV["CLICKSEND_API_KEY"])
      request.content_type = "application/json"
      request.body = {
        messages: [ {
          source: "hafaloha",
          from: "Hafaloha",
          body: body,
          to: normalized,
          custom_string: context
        } ]
      }.to_json

      response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, open_timeout: 10, read_timeout: 15) do |http|
        http.request(request)
      end

      if response.is_a?(Net::HTTPSuccess)
        parsed = JSON.parse(response.body)
        msg_data = parsed.dig("data", "messages", 0) || {}
        Rails.logger.info "[SmsService] SMS sent to #{normalized} (#{context}): status=#{msg_data['status']}"
        { success: true, message_id: msg_data["message_id"], status: msg_data["status"] }
      else
        Rails.logger.error "[SmsService] ClickSend error #{response.code}: #{response.body.to_s.truncate(500)}"
        { success: false, error: "ClickSend API error: #{response.code}" }
      end
    rescue StandardError => e
      Rails.logger.error "[SmsService] Error sending SMS: #{e.class} - #{e.message}"
      { success: false, error: e.message }
    end

    def normalize_phone(phone)
      digits = phone.to_s.gsub(/\D/, "")

      case digits.length
      when 7
        "+1671#{digits}"
      when 10
        "+1#{digits}"
      when 11
        return nil unless digits.start_with?("1")
        "+#{digits}"
      when 12..15
        "+#{digits}"
      else
        nil
      end
    end

    def order_message(order, event)
      store = SiteSetting.instance.store_name || "Hafaloha"
      location_name = order.location&.name || store

      case event
      when "placed"
        "#{store}: Order ##{order.order_number} received! " \
        "Total: $#{format_price(order.total_cents)}. " \
        "We'll text you when it's ready."
      when "confirmed"
        "#{store}: Your order ##{order.order_number} has been confirmed! " \
        "We're preparing it now."
      when "preparing"
        "#{store}: Your order ##{order.order_number} is now being prepared!"
      when "ready"
        "#{store}: Your order ##{order.order_number} is READY for pickup " \
        "at #{location_name}!"
      when "shipped"
        tracking = order.tracking_number.present? ? " Tracking: #{order.tracking_number}" : ""
        "#{store}: Your order ##{order.order_number} has shipped!#{tracking}"
      when "picked_up"
        "#{store}: Your order ##{order.order_number} has been picked up. Thank you!"
      when "delivered"
        "#{store}: Your order ##{order.order_number} has been delivered! Thank you!"
      when "cancelled"
        phone = SiteSetting.instance.store_phone.presence || "671-777-1234"
        "#{store}: Your order ##{order.order_number} has been cancelled. " \
        "If you were charged, a refund will be processed. Questions? Call #{phone}."
      end
    end

    def format_price(cents)
      "%.2f" % (cents.to_i / 100.0)
    end

    def skip_result(reason)
      Rails.logger.info "[SmsService] Skipped: #{reason}"
      { success: false, skipped: true, reason: reason }
    end
  end
end
