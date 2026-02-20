class Api::V1::MeController < ApplicationController
  include Authenticatable

  def show
    render json: {
      id: current_user.id,
      clerk_id: current_user.clerk_id,
      email: current_user.email,
      role: current_user.role,
      role_level: current_user.role_level,
      admin: current_user.admin?,
      staff_or_above: current_user.staff_or_above?
    }
  end
end
