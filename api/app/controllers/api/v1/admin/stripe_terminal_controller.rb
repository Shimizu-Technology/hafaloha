# frozen_string_literal: true

module Api
  module V1
    module Admin
      class StripeTerminalController < BaseController
        before_action :ensure_stripe_configured!

        # POST /api/v1/admin/stripe_terminal/connection_token
        def connection_token
          token = Stripe::Terminal::ConnectionToken.create
          render json: { secret: token.secret }
        rescue Stripe::StripeError => e
          Rails.logger.error "Stripe Terminal connection token error: #{e.message}"
          render json: { error: e.message }, status: :bad_request
        end

        # GET /api/v1/admin/stripe_terminal/readers
        def readers
          readers = Stripe::Terminal::Reader.list({ limit: 10 })
          render json: {
            readers: readers.data.map { |r|
              {
                id: r.id,
                label: r.label,
                serial_number: r.serial_number,
                device_type: r.device_type,
                status: r.status,
                ip_address: r.ip_address,
                location: r.location
              }
            }
          }
        rescue Stripe::StripeError => e
          render json: { error: e.message }, status: :bad_request
        end

        private

        def ensure_stripe_configured!
          stripe_key = ENV["STRIPE_SECRET_KEY"]
          if stripe_key.blank?
            render json: { error: "Stripe is not configured" }, status: :service_unavailable
            return
          end
          Stripe.api_key = stripe_key
        end
      end
    end
  end
end
