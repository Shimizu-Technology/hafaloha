# frozen_string_literal: true

module Api
  module V1
    class LocationsController < ApplicationController
      # GET /api/v1/locations
      # Public endpoint — no auth required
      def index
        locations = Location.customer_visible.by_name

        render json: {
          locations: locations.map { |loc| location_json(loc) }
        }
      end

=======
<<<<<<< HEAD
>>>>>>> main
      # GET /api/v1/locations/:slug
      # Public endpoint — lookup by slug
      def show
        location = Location.customer_visible.find_by!(slug: params[:id])
        render json: location_json(location)
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Location not found" }, status: :not_found
      end

<<<<<<< HEAD
>>>>>>> main
      private

      def location_json(location)
        {
          id: location.id,
          name: location.name,
          slug: location.slug,
          address: location.address,
          phone: location.phone,
          description: location.description,
          location_type: location.location_type,
          hours_json: location.hours_json,
          starts_at: location.starts_at,
          ends_at: location.ends_at,
          qr_code_url: location.qr_code_url
        }
      end
    end
  end
end
