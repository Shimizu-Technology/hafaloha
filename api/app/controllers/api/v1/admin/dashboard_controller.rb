# frozen_string_literal: true

module Api
  module V1
    module Admin
      class DashboardController < ApplicationController
        include Authenticatable
        before_action :authenticate_request
        before_action :require_staff!

        # GET /api/v1/admin/dashboard/stats
        def stats
          base_scope = if current_user.respond_to?(:location_scoped?) && current_user.location_scoped?
            Order.where(location_id: current_user.assigned_location_id)
          else
            Order.all
          end

          today_start = Time.current.beginning_of_day
          week_start = Time.current.beginning_of_week
          month_start = Time.current.beginning_of_month

          paid_scope = base_scope.where(payment_status: "paid")

          render json: {
            total_orders: base_scope.count,
            total_revenue_cents: paid_scope.sum(:total_cents),
            pending_orders: base_scope.where(status: "pending").count,
            total_products: Product.where(published: true).count,
            revenue_today: paid_scope.where("orders.created_at >= ?", today_start).sum(:total_cents),
            revenue_this_week: paid_scope.where("orders.created_at >= ?", week_start).sum(:total_cents),
            revenue_this_month: paid_scope.where("orders.created_at >= ?", month_start).sum(:total_cents),
            status_breakdown: base_scope.group(:status).count,
            recent_orders: recent_orders_data(base_scope),
            top_products_today: top_products_data(today_start),
            location_breakdown: location_breakdown_data(base_scope),
            fulfillment_breakdown: base_scope.group(:fulfillment_type).count
          }
        end

        # GET /api/v1/admin/dashboard/chart_data
        def chart_data
          days = (params[:days] || 30).to_i.clamp(7, 90)
          start_date = days.days.ago.beginning_of_day

          orders_by_day = Order.where("created_at >= ?", start_date).group("DATE(created_at)").count
          revenue_by_day = Order.where("created_at >= ?", start_date).where(payment_status: "paid").group("DATE(created_at)").sum(:total_cents)

          series = (0...days).map do |i|
            date = (start_date + i.days).to_date
            { date: date.to_s, label: date.strftime("%b %d"), orders: orders_by_day[date] || 0, revenue_cents: revenue_by_day[date] || 0 }
          end

          this_week_start = Time.current.beginning_of_week
          last_week_start = 1.week.ago.beginning_of_week

          render json: {
            series: series,
            comparison: {
              this_week: {
                orders: Order.where("created_at >= ?", this_week_start).count,
                revenue_cents: Order.where(payment_status: "paid").where("created_at >= ?", this_week_start).sum(:total_cents)
              },
              last_week: {
                orders: Order.where("created_at >= ? AND created_at < ?", last_week_start, this_week_start).count,
                revenue_cents: Order.where(payment_status: "paid").where("created_at >= ? AND created_at < ?", last_week_start, this_week_start).sum(:total_cents)
              }
            }
          }
        end

        private

        def recent_orders_data(base_scope)
          base_scope.order(created_at: :desc).limit(10).map do |order|
            {
              id: order.id,
              order_number: order.respond_to?(:order_number) ? order.order_number : "##{order.id}",
              customer_name: order.respond_to?(:customer_name) ? order.customer_name : "Guest",
              total_cents: order.total_cents,
              status: order.status,
              created_at: order.created_at
            }
          end
        end

        def top_products_data(today_start)
          OrderItem.joins(:order).where("orders.created_at >= ?", today_start)
            .group(:product_id)
            .select("product_id, COALESCE(SUM(quantity), 0) as total_qty, COALESCE(SUM(price_cents * quantity), 0) as total_revenue")
            .order("total_qty DESC").limit(5)
            .map do |item|
              product = Product.find_by(id: item.product_id)
              { product_id: item.product_id, name: product&.name || "Unknown", quantity_sold: item.total_qty, revenue_cents: item.total_revenue }
            end
        end

        def location_breakdown_data(base_scope)
          grouped_orders = base_scope.left_joins(:location).group("locations.name").count
          grouped_revenue = base_scope.left_joins(:location).where(payment_status: "paid").group("locations.name").sum(:total_cents)

          grouped_orders.map do |location_name, count|
            { name: location_name.presence || "Shipping / No Pickup Location", orders: count, revenue_cents: grouped_revenue[location_name] || 0 }
          end.sort_by { |e| -e[:orders] }
        end
      end
    end
  end
end
