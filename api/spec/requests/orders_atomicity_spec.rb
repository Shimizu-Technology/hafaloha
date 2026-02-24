require "rails_helper"

RSpec.describe "Orders atomicity", type: :request do
  let(:session_id) { "spec-session-atomicity" }
  let!(:product) { create(:product, inventory_level: "variant", track_inventory: true, published: true) }
  let!(:variant) { create(:product_variant, product: product, stock_quantity: 5, available: true, price_cents: 2500) }

  let(:order_payload) do
    {
      order: {
        customer_name: "Guest Test",
        customer_email: "guest@example.com",
        customer_phone: "6715551234",
        payment_method: {
          type: "test"
        }
      }
    }
  end

  before do
    settings = instance_double(
      SiteSetting,
      payment_test_mode: true,
      payment_test_mode?: true,
      send_emails_for?: false
    )
    allow(SiteSetting).to receive(:instance).and_return(settings)

    allow(PaymentService).to receive(:process_payment).and_return(
      { success: true, charge_id: "test_charge_atomicity" }
    )
  end

  it "rolls back order persistence when inventory commit fails after payment authorization" do
    CartItem.create!(session_id: session_id, product_variant: variant, quantity: 1)

    allow_any_instance_of(Api::V1::OrdersController)
      .to receive(:deduct_inventory)
      .and_raise(Api::V1::OrdersController::InventoryCommitError, "Not enough stock for test")

    expect do
      post "/api/v1/orders", params: order_payload, headers: { "X-Session-ID" => session_id }
    end.not_to change(Order, :count)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.parsed_body["error"]).to include("no longer available")
    expect(CartItem.where(session_id: session_id).count).to eq(1)
    expect(variant.reload.stock_quantity).to eq(5)
  end

  it "creates the order and clears the cart when finalize succeeds" do
    CartItem.create!(session_id: session_id, product_variant: variant, quantity: 1)

    expect do
      post "/api/v1/orders", params: order_payload, headers: { "X-Session-ID" => session_id }
    end.to change(Order, :count).by(1)

    expect(response).to have_http_status(:created)
    expect(CartItem.where(session_id: session_id).count).to eq(0)
    expect(variant.reload.stock_quantity).to eq(4)
  end
end
