# frozen_string_literal: true

module Api
  module V1
    module Admin
      class LocationsController < ApplicationController
        include Authenticatable
        before_action :authenticate_request
        before_action :require_manager!
        before_action :set_location, only: [ :show, :update, :destroy, :toggle_active ]

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

        # POST /api/v1/admin/locations/:id/toggle_active
        def toggle_active
          if @location.active?
            @location.deactivate!
          else
            @location.activate!
          end

          render json: { location: location_json(@location) }
        end

        private

        def set_location
          @location = Location.find(params[:id])
        end

        def location_params
          params.require(:location).permit(
            :name, :slug, :address, :phone, :description,
            :location_type, :active, :admin_email,
            :starts_at, :ends_at, :auto_deactivate,
            :menu_collection_id,
            hours_json: {},
            admin_sms_phones: []
          )
        end

        def location_json(location)
          {
            id: location.id,
            name: location.name,
            slug: location.slug,
            address: location.address,
            phone: location.phone,
            description: location.description,
            location_type: location.location_type,
            active: location.active,
            hours_json: location.hours_json,
            admin_email: location.admin_email,
            admin_sms_phones: location.admin_sms_phones,
            starts_at: location.starts_at,
            ends_at: location.ends_at,
            auto_deactivate: location.auto_deactivate,
            menu_collection_id: location.menu_collection_id,
            qr_code_url: location.qr_code_url,
            created_at: location.created_at,
            updated_at: location.updated_at
          }
        end
      end
    end
  end
end
