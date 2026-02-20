# frozen_string_literal: true

# HAF-163: Validates order status transitions
class FulfillmentValidator
  class InvalidTransitionError < StandardError; end

  TRANSITIONS = {
    "pending"    => %w[confirmed processing cancelled],
    "confirmed"  => %w[processing ready cancelled],
    "processing" => %w[ready shipped cancelled],
    "ready"      => %w[picked_up cancelled],
    "shipped"    => %w[delivered]
  }.freeze

  TERMINAL_STATUSES = %w[delivered cancelled].freeze

  def self.valid_transition?(from, to)
    return false if from == to
    return false if TERMINAL_STATUSES.include?(from)
    allowed = TRANSITIONS[from]
    return false unless allowed
    allowed.include?(to)
  end

  def self.transition_error(from, to)
    return nil if valid_transition?(from, to)
    if from == to
      "Order is already #{from}"
    elsif TERMINAL_STATUSES.include?(from)
      "Cannot change status of a #{from} order"
    else
      allowed = TRANSITIONS[from]
      if allowed.nil? || allowed.empty?
        "No transitions available from #{from}"
      else
        "Cannot transition from #{from} to #{to}. Valid transitions: #{allowed.join(', ')}"
      end
    end
  end

  def self.validate_transition!(from, to)
    error = transition_error(from, to)
    raise InvalidTransitionError, error if error
  end
end
