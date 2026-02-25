require "rails_helper"

RSpec.describe ProcessPaymentReversalJob, type: :job do
  before do
    allow(Rails.logger).to receive(:info)
    allow(Rails.logger).to receive(:error)
  end

  it "creates a refund for payment intents with idempotency key" do
    expect(Stripe::Refund).to receive(:create).with(
      hash_including(
        payment_intent: "pi_123",
        reason: "requested_by_customer"
      ),
      hash_including(
        idempotency_key: "order-finalize-failed-refund:pi_123"
      )
    )

    described_class.perform_now("pi_123", "HAF-R-123456")
  end

  it "creates a refund for charges with idempotency key" do
    expect(Stripe::Refund).to receive(:create).with(
      hash_including(
        charge: "ch_123",
        reason: "requested_by_customer"
      ),
      hash_including(
        idempotency_key: "order-finalize-failed-refund:ch_123"
      )
    )

    described_class.perform_now("ch_123", "HAF-R-123456")
  end

  it "ignores non-stripe references" do
    expect(Stripe::Refund).not_to receive(:create)
    described_class.perform_now("test_charge_local", "pending")
  end

  it "logs and swallows invalid request errors" do
    allow(Stripe::Refund).to receive(:create).and_raise(Stripe::InvalidRequestError.new("bad ref", "payment_intent"))
    expect { described_class.perform_now("pi_bad", "HAF-R-123456") }.not_to raise_error
    expect(Rails.logger).to have_received(:error).with(/PAYMENT_REVERSAL_INVALID_REQUEST/)
  end

  it "re-raises retriable stripe errors" do
    allow(Stripe::Refund).to receive(:create).and_raise(Stripe::APIConnectionError.new("network error"))
    expect { described_class.perform_now("pi_123", "HAF-R-123456") }.to raise_error(Stripe::APIConnectionError)
  end
end
