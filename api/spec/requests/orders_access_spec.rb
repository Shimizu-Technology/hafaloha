require "rails_helper"

RSpec.describe "Order access control", type: :request do
  let!(:order) do
    Order.create!(
      order_type: "retail",
      status: "pending",
      payment_status: "paid",
      subtotal_cents: 1000,
      shipping_cost_cents: 0,
      tax_cents: 0,
      total_cents: 1000,
      customer_name: "Guest Customer",
      customer_email: "guest-access@example.com",
      customer_phone: "6715551234"
    )
  end

  it "returns not found for guest requests without email verification" do
    get "/api/v1/orders/#{order.id}"

    expect(response).to have_http_status(:not_found)
  end

  it "returns not found for guest requests with a non-matching email" do
    get "/api/v1/orders/#{order.id}", params: { email: "wrong@example.com" }

    expect(response).to have_http_status(:not_found)
  end

  it "returns order details when guest email matches" do
    get "/api/v1/orders/#{order.id}", params: { email: "guest-access@example.com" }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("order", "id")).to eq(order.id)
    expect(response.parsed_body.dig("order", "customer_email")).to eq("guest-access@example.com")
  end
end

