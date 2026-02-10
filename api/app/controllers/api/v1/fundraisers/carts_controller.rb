require "digest"

module Api
  module V1
    module Fundraisers
      class CartsController < ApplicationController
        before_action :set_fundraiser
        before_action :load_cart

        # GET /api/v1/fundraisers/:fundraiser_slug/cart
        def show
          render json: { cart: serialize_cart }
        end

        # PUT /api/v1/fundraisers/:fundraiser_slug/cart
        # Add or update items in cart
        def update
          items = params[:items] || []
          errors = []

          items.each do |item_data|
            variant = FundraiserProductVariant.joins(:fundraiser_product)
                                              .where(fundraiser_products: { fundraiser_id: @fundraiser.id, published: true })
                                              .find_by(id: item_data[:variant_id])

            unless variant
              errors << { variant_id: item_data[:variant_id], error: "Variant not found" }
              next
            end

            quantity = item_data[:quantity].to_i

            if quantity <= 0
              # Remove item if quantity is 0 or less
              @cart[:items].delete(variant.id.to_s)
            else
              # Check stock
              if variant.fundraiser_product.inventory_level == "variant" && quantity > variant.stock_quantity
                errors << { variant_id: variant.id, error: "Only #{variant.stock_quantity} available" }
                next
              end

              @cart[:items][variant.id.to_s] = {
                variant_id: variant.id,
                quantity: quantity,
                price_cents: variant.price_cents,
                product_id: variant.fundraiser_product_id,
                product_name: variant.fundraiser_product.name,
                variant_name: variant.display_name
              }
            end
          end

          save_cart

          if errors.any?
            render json: { cart: serialize_cart, errors: errors }, status: :unprocessable_entity
          else
            render json: { cart: serialize_cart }
          end
        end

        # DELETE /api/v1/fundraisers/:fundraiser_slug/cart
        def destroy
          @cart = { items: {}, participant_code: nil }
          save_cart
          render json: { cart: serialize_cart, message: "Cart cleared" }
        end

        private

        def set_fundraiser
          @fundraiser = Fundraiser.published.find_by(slug: params[:fundraiser_slug])

          unless @fundraiser&.active?
            render json: { error: "Fundraiser not available" }, status: :not_found
          end
        end

        def load_cart
          @cart = Rails.cache.read(fundraiser_cart_key) || { items: {}, participant_code: nil }
          @cart = @cart.with_indifferent_access
          @cart[:items] ||= {}
        end

        def save_cart
          Rails.cache.write(fundraiser_cart_key, @cart, expires_in: 30.days)
        end

        def fundraiser_cart_key
          "fundraiser_cart:#{@fundraiser.id}:#{cart_session_id}"
        end

        # Get or generate a unique session ID for cart tracking
        # Priority: X-Session-ID header > session_id cookie > generate new
        def cart_session_id
          @cart_session_id ||= begin
            sid = request.headers["X-Session-ID"].presence || cookies[:fundraiser_session_id].presence

            if sid.blank?
              # Generate a secure random session ID
              sid = SecureRandom.uuid
              # Set as HTTP-only cookie for subsequent requests (30 days)
              cookies[:fundraiser_session_id] = {
                value: sid,
                expires: 30.days.from_now,
                httponly: true,
                secure: Rails.env.production?,
                same_site: :lax
              }
            end

            sid
          end
        end

        def serialize_cart
          items = @cart[:items].map do |variant_id, item_data|
            variant = FundraiserProductVariant.includes(:fundraiser_product).find_by(id: variant_id)
            next nil unless variant

            product = variant.fundraiser_product

            {
              variant_id: variant.id,
              product_id: product.id,
              product_name: product.name,
              variant_name: variant.display_name,
              sku: variant.sku,
              quantity: item_data[:quantity],
              unit_price_cents: variant.price_cents,
              total_price_cents: variant.price_cents * item_data[:quantity],
              in_stock: variant.in_stock?,
              actually_available: variant.actually_available?,
              image_url: product.primary_image&.url
            }
          end.compact

          subtotal = items.sum { |i| i[:total_price_cents] }
          item_count = items.sum { |i| i[:quantity] }

          {
            fundraiser_id: @fundraiser.id,
            fundraiser_slug: @fundraiser.slug,
            items: items,
            item_count: item_count,
            subtotal_cents: subtotal,
            participant_code: @cart[:participant_code]
          }
        end
      end
    end
  end
end
