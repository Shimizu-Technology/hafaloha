# frozen_string_literal: true

require "rails_helper"

RSpec.describe FulfillmentValidator do
  describe ".valid_transition?" do
    {
      %w[pending confirmed] => true,
      %w[pending cancelled] => true,
      %w[confirmed processing] => true,
      %w[confirmed ready] => true,
      %w[confirmed cancelled] => true,
      %w[processing ready] => true,
      %w[processing shipped] => true,
      %w[processing cancelled] => true,
      %w[ready picked_up] => true,
      %w[ready cancelled] => true,
      %w[shipped delivered] => true,
      %w[pending processing] => true,
      %w[pending shipped] => false,
      %w[pending ready] => false,
      %w[confirmed delivered] => false,
      %w[ready shipped] => false,
      %w[shipped cancelled] => false,
      %w[delivered cancelled] => false,
      %w[delivered pending] => false,
      %w[cancelled pending] => false,
      %w[pending pending] => false
    }.each do |(from, to), expected|
      it "#{from} -> #{to} is #{expected}" do
        expect(described_class.valid_transition?(from, to)).to eq(expected)
      end
    end
  end

  describe ".transition_error" do
    it "returns nil for valid transitions" do
      expect(described_class.transition_error("pending", "confirmed")).to be_nil
    end

    it "returns error for same status" do
      expect(described_class.transition_error("pending", "pending")).to include("already")
    end

    it "returns error for terminal status" do
      expect(described_class.transition_error("delivered", "cancelled")).to include("Cannot change")
    end

    it "returns error with valid options" do
      error = described_class.transition_error("pending", "shipped")
      expect(error).to include("confirmed")
      expect(error).to include("cancelled")
    end
  end

  describe ".validate_transition!" do
    it "does not raise for valid transitions" do
      expect { described_class.validate_transition!("pending", "confirmed") }.not_to raise_error
    end

    it "raises InvalidTransitionError for invalid transitions" do
      expect { described_class.validate_transition!("pending", "shipped") }
        .to raise_error(FulfillmentValidator::InvalidTransitionError)
    end
  end
end
