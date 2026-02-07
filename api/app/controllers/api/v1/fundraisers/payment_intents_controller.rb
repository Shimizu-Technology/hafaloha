# frozen_string_literal: true

module Api
  module V1
    module Fundraisers
      class PaymentIntentsController < ApplicationController
        # Public endpoint - no authentication required

        # POST /api/v1/fundraisers/:fundraiser_slug/payment_intents
        # Creates a Stripe PaymentIntent for a fundraiser order
        def create
          @fundraiser = Fundraiser.find_by!(slug: params[:fundraiser_slug])

          unless @fundraiser.active?
            return render json: { error: "This fundraiser is no longer accepting orders" }, status: :unprocessable_entity
          end

          # Validate required params
          email = params[:email]
          amount_cents = params[:amount_cents].to_i
          items = params[:items] || []

          unless email.present?
            return render json: { error: "Email is required" }, status: :unprocessable_entity
          end

          if amount_cents <= 0
            return render json: { error: "Amount must be greater than zero" }, status: :unprocessable_entity
          end

          if items.empty?
            return render json: { error: "Items are required" }, status: :unprocessable_entity
          end

          # Validate items exist and calculate expected total
          calculated_total = 0
          items.each do |item|
            variant = FundraiserProductVariant.find_by(id: item[:variant_id])
            unless variant && variant.fundraiser_product.fundraiser_id == @fundraiser.id
              return render json: { error: "Invalid product variant" }, status: :unprocessable_entity
            end
            calculated_total += variant.price_cents * item[:quantity].to_i
          end

          # Create payment intent
          settings = SiteSetting.instance
          result = PaymentService.create_payment_intent(
            amount_cents: amount_cents,
            customer_email: email,
            order_id: 0, # Will be set when order is created
            test_mode: settings.payment_test_mode
          )

          if result[:success]
            render json: {
              client_secret: result[:client_secret],
              payment_intent_id: result[:payment_intent_id],
              amount_cents: amount_cents
            }, status: :ok
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Fundraiser not found" }, status: :not_found
        rescue StandardError => e
          Rails.logger.error "Fundraiser PaymentIntent error: #{e.class} - #{e.message}"
          Rails.logger.error e.backtrace.first(5).join("\n")
          render json: { error: "Failed to create payment intent" }, status: :internal_server_error
        end
      end
    end
  end
end
