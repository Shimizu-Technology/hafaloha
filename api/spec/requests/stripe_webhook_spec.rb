require "rails_helper"

RSpec.describe "Stripe webhook handling", type: :request do
  let!(:fundraiser) do
    Fundraiser.create!(
      name: "Webhook QA Fundraiser",
      slug: "webhook-qa-fundraiser",
      organization_name: "Webhook QA Org",
      status: "active",
      published: true,
      start_date: Date.current - 1.day,
      end_date: Date.current + 7.days
    )
  end

  let!(:fundraiser_order) do
    FundraiserOrder.create!(
      fundraiser: fundraiser,
      status: "pending",
      payment_status: "pending",
      customer_name: "Webhook Customer",
      customer_email: "webhook@example.com",
      customer_phone: "6715552222",
      subtotal_cents: 2500,
      total_cents: 2500
    )
  end

  let(:payment_succeeded_event) do
    {
      id: "evt_test_123",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_fundraiser_123",
          metadata: {
            fundraiser_order_id: fundraiser_order.id.to_s
          }
        }
      }
    }
  end

  it "marks fundraiser order as paid when webhook references fundraiser_order_id metadata" do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("STRIPE_WEBHOOK_SECRET").and_return(nil)

    post "/webhooks/stripe",
         params: payment_succeeded_event.to_json,
         headers: { "CONTENT_TYPE" => "application/json" }

    expect(response).to have_http_status(:ok)
    expect(fundraiser_order.reload.payment_status).to eq("paid")
    expect(fundraiser_order.status).to eq("paid")
  end

  it "rejects unsigned webhooks when running in production without secret" do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("STRIPE_WEBHOOK_SECRET").and_return(nil)
    allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new("production"))

    post "/webhooks/stripe",
         params: payment_succeeded_event.to_json,
         headers: { "CONTENT_TYPE" => "application/json" }

    expect(response).to have_http_status(:bad_request)
  end
end

