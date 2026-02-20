# frozen_string_literal: true

module Api
  module V1
    module Admin
      class LocationsController < ApplicationController
        include Authenticatable
        before_action :authenticate_request
        before_action :require_manager!
        before_action :set_location, only: [ :show, :update, :destroy, :toggle_active, :qr_code ]

        # GET /api/v1/admin/locations
        def index
          locations = Location.by_name

          if params[:location_type].present?
            locations = locations.where(location_type: params[:location_type])
          end

          if params[:active].present?
            locations = locations.where(active: params[:active] == "true")
          end

          render json: {
            locations: locations.map { |loc| location_json(loc) }
          }
        end

        # GET /api/v1/admin/locations/:id
        def show
          render json: { location: location_json(@location) }
        end

        # POST /api/v1/admin/locations
        def create
          location = Location.new(location_params)

          if location.save
            render json: { location: location_json(location) }, status: :created
          else
            render json: { errors: location.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/admin/locations/:id
        def update
          if @location.update(location_params)
            render json: { location: location_json(@location) }
          else
            render json: { errors: @location.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/admin/locations/:id
        def destroy
          @location.destroy!
          head :no_content
        end

        # GET /api/v1/admin/locations/:id/qr_code
        def qr_code
          base_url = ENV.fetch("FRONTEND_URL", "https://hafaloha.com")
          size = (params[:size] || 600).to_i
          format = params[:format] || "png"
          service = QrCodeService.new(@location, base_url: base_url)

          case format
          when "svg"
            render plain: service.to_svg, content_type: "image/svg+xml"
          when "base64"
            render json: { data_uri: service.to_data_uri(size: size), menu_url: service.menu_url }
          else # png
            send_data service.to_png(size: size),
                      type: "image/png",
                      disposition: "inline",
                      filename: "#{@location.slug}-qr.png"
          end
        end

            created_at: location.created_at,
            updated_at: location.updated_at
          }
        end
      end
    end
  end
end
