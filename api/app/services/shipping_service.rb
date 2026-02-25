# frozen_string_literal: true

class ShippingService
  # Hafaloha's warehouse address (Guam) - default fallback
  ORIGIN_ADDRESS = {
    company: "Hafaloha",
    street1: "215 Rojas Street",
    street2: "Ixora Industrial Park, Unit 104",
    city: "Tamuning",
    state: "GU",
    zip: "96913",
    country: "US",
    phone: "671-989-3444"
  }.freeze

  class ShippingError < StandardError; end

  # Default weight for items without weight (8oz = typical apparel)
  DEFAULT_WEIGHT_OZ = 8.0

  # Calculate shipping rates for a cart/order
  # @param cart_items [Array<CartItem>] - Items to ship
  # @param destination [Hash] - Shipping address (street1, city, state, zip, country)
  # @return [Array<Hash>] - Array of shipping options with rates
  def self.calculate_rates(cart_items, destination)
    raise ShippingError, "No items to ship" if cart_items.blank?
    raise ShippingError, "Destination address required" if destination.blank?

    # Calculate total weight (use default 8oz per item if weight not set)
    total_weight_oz = cart_items.sum do |item|
      weight = item.product_variant.weight_oz.presence || DEFAULT_WEIGHT_OZ
      weight * item.quantity
    end

    # Ensure minimum weight for shipping calculation
    total_weight_oz = DEFAULT_WEIGHT_OZ if total_weight_oz <= 0

    # Try EasyPost first if configured
    if ENV["EASYPOST_API_KEY"].present?
      begin
        return calculate_easypost_rates(cart_items, destination, total_weight_oz)
      rescue StandardError => e
        Rails.logger.error "EasyPost failed, using fallback rates: #{e.message}"
        # Fall through to fallback rates
      end
    else
      Rails.logger.warn "EasyPost API key not configured, using fallback rates"
    end

    # Fallback to table rates
    calculate_fallback_rates(total_weight_oz, destination)
  end

  private

  # Calculate rates using EasyPost API
  def self.calculate_easypost_rates(cart_items, destination, total_weight_oz)
    origin = origin_address

    Rails.logger.info "🚀 Attempting EasyPost API call..."
    Rails.logger.info "   Weight: #{total_weight_oz}oz"
    Rails.logger.info "   From: #{origin[:city]}, #{origin[:state]} #{origin[:zip]}"
    Rails.logger.info "   To: #{destination[:city]}, #{destination[:state]} #{destination[:zip]}"

    # Create custom HTTP executor to work around macOS SSL/CRL issue
    # This uses Net::HTTP with SSL verification but without CRL checking
    custom_http_exec = lambda do |method, uri, headers, open_timeout, read_timeout, body = nil|
      require "net/http"

      # Log the API request for debugging
      if body && method.to_s.downcase == "post"
        Rails.logger.debug "📤 EasyPost Request: #{uri}"
        Rails.logger.debug "   Body: #{body[0..500]}" # First 500 chars
      end

      # Build request
      request = Net::HTTP.const_get(method.to_s.capitalize).new(uri)
      headers.each { |k, v| request[k] = v }
      request.body = body if body

      # Execute request with custom SSL settings
      response = Net::HTTP.start(
        uri.host,
        uri.port,
        use_ssl: true,
        read_timeout: read_timeout,
        open_timeout: open_timeout,
        verify_mode: OpenSSL::SSL::VERIFY_PEER,
        ca_file: ENV["SSL_CERT_FILE"],
        # Custom verify callback that bypasses CRL checking
        verify_callback: proc { |preverify_ok, _cert_store| preverify_ok }
      ) do |http|
        http.request(request)
      end

      # Log response for debugging
      if response.body
        Rails.logger.debug "📥 EasyPost Response: #{response.code}"
        Rails.logger.debug "   Body: #{response.body[0..500]}" # First 500 chars
      end

      response
    end

    # Create EasyPost client with custom HTTP executor
    client = EasyPost::Client.new(
      api_key: ENV["EASYPOST_API_KEY"],
      read_timeout: 60,
      open_timeout: 30,
      custom_client_exec: custom_http_exec
    )

    Rails.logger.info "✅ EasyPost client created with custom HTTP executor (CRL checking disabled)"

    # Create EasyPost shipment
    shipment = client.shipment.create(
      from_address: origin,
      to_address: {
        street1: destination[:street1],
        street2: destination[:street2],
        city: destination[:city],
        state: destination[:state],
        zip: destination[:zip],
        country: destination[:country] || "US",
        name: destination[:name],
        phone: destination[:phone]
      },
      parcel: {
        weight: total_weight_oz,
        # Assume standard box dimensions (can be customized per product later)
        length: 12,
        width: 10,
        height: 8
      }
    )

    Rails.logger.info "✅ EasyPost shipment created: #{shipment.id}"
    Rails.logger.info "   Origin verified: #{shipment.from_address&.city}, #{shipment.from_address&.state}"
    Rails.logger.info "   Found #{shipment.rates.count} rates"

    # Log first rate for verification
    if shipment.rates.any?
      first_rate = shipment.rates.first
      Rails.logger.info "   Example rate: #{first_rate.carrier} #{first_rate.service} - $#{first_rate.rate}"
    end

    # Format rates for frontend
    formatted = format_rates(shipment.rates)
    Rails.logger.info "✅ Returning #{formatted.count} formatted rates"
    formatted
  rescue StandardError => e
    Rails.logger.error "❌ EasyPost Error Details:"
    Rails.logger.error "   Class: #{e.class.name}"
    Rails.logger.error "   Message: #{e.message}"
    Rails.logger.error "   Backtrace: #{e.backtrace.first(5).join("\n   ")}"
    raise e
  end

  def self.origin_address
    settings_address = SiteSetting.instance.shipping_origin_address || {}
    normalized = deep_symbolize_keys(settings_address)

    ORIGIN_ADDRESS.merge(normalized).compact
  end

  # Calculate rates using fallback table
  def self.calculate_fallback_rates(total_weight_oz, destination)
    settings = SiteSetting.instance
    rates_table = settings.fallback_shipping_rates

    # Determine if international (non-US) or domestic
    country = destination[:country] || "US"
    is_international = country.upcase != "US"

    rate_type = is_international ? "international" : "domestic"
    rate_tiers = rates_table[rate_type] || rates_table["domestic"]

    # Find matching rate tier based on weight
    matching_tier = rate_tiers.find do |tier|
      max_weight = tier["max_weight_oz"]
      max_weight.nil? || total_weight_oz <= max_weight
    end

    rate_cents = matching_tier ? matching_tier["rate_cents"] : 5000 # Default $50 if no match

    # Return a single fallback rate in the same format as EasyPost rates
    [ {
      id: "fallback_standard",
      carrier: "Standard Shipping",
      service: is_international ? "International Mail" : "USPS Priority Mail",
      rate_cents: rate_cents, # Use cents directly
      rate_formatted: "$#{'%.2f' % (rate_cents / 100.0)}",
      delivery_days: is_international ? 14 : 5,
      delivery_date: nil,
      delivery_date_guaranteed: false,
      fallback: true # Mark as fallback rate
    } ]
  end

  # Purchase a shipping label for an order
  # Creates a shipment with customs info (for off-island), buys the selected rate,
  # and returns the label URL for printing.
  # @param order [Order] - The order to ship
  # @param rate_id [String] - The EasyPost rate ID selected by admin
  # @return [Hash] - { label_url:, tracking_number:, tracking_url:, shipment_id: }
  def self.purchase_label(order, rate_id)
    raise ShippingError, "EasyPost API key not configured" unless ENV["EASYPOST_API_KEY"].present?
    raise ShippingError, "Order has no shipping address" unless order.requires_shipping?

    client = easypost_client

    # Build customs info for off-island / international shipments
    customs = build_customs_info(order)

    # Build shipment with customs
    shipment_params = {
      from_address: origin_address,
      to_address: {
        name: order.customer_name,
        street1: order.shipping_address_line1,
        street2: order.shipping_address_line2,
        city: order.shipping_city,
        state: order.shipping_state,
        zip: order.shipping_zip,
        country: order.shipping_country || "US",
        phone: order.customer_phone,
        email: order.customer_email
      },
      parcel: {
        weight: calculate_order_weight_oz(order),
        length: 12,
        width: 10,
        height: 8
      }
    }

    # Add customs info if needed (off-island or international)
    shipment_params[:customs_info] = customs if customs.present?

    shipment = client.shipment.create(shipment_params)

    # Buy the selected rate
    purchased = client.shipment.buy(shipment.id, rate: { id: rate_id })

    # Extract label and tracking info
    {
      label_url: purchased.postage_label&.label_url,
      label_format: purchased.postage_label&.label_file_type || "PDF",
      tracking_number: purchased.tracking_code,
      tracking_url: purchased.tracker&.public_url,
      shipment_id: purchased.id,
      carrier: purchased.selected_rate&.carrier,
      service: purchased.selected_rate&.service,
      rate_cents: (purchased.selected_rate&.rate.to_f * 100).to_i
    }
  rescue EasyPost::Errors::EasyPostError => e
    Rails.logger.error "EasyPost label purchase failed: #{e.message}"
    raise ShippingError, "Failed to purchase shipping label: #{e.message}"
  end

  # Get rates for an existing order (admin re-rating)
  # @param order [Order] - The order to get rates for
  # @return [Array<Hash>] - Shipping rate options
  def self.get_order_rates(order)
    raise ShippingError, "EasyPost API key not configured" unless ENV["EASYPOST_API_KEY"].present?
    raise ShippingError, "Order has no shipping address" unless order.requires_shipping?

    client = easypost_client
    customs = build_customs_info(order)

    shipment_params = {
      from_address: origin_address,
      to_address: {
        name: order.customer_name,
        street1: order.shipping_address_line1,
        street2: order.shipping_address_line2,
        city: order.shipping_city,
        state: order.shipping_state,
        zip: order.shipping_zip,
        country: order.shipping_country || "US",
        phone: order.customer_phone
      },
      parcel: {
        weight: calculate_order_weight_oz(order),
        length: 12,
        width: 10,
        height: 8
      }
    }
    shipment_params[:customs_info] = customs if customs.present?

    shipment = client.shipment.create(shipment_params)
    formatted = format_rates(shipment.rates)

    { rates: formatted, shipment_id: shipment.id }
  end

  # Build customs info for an order (required for off-island / international shipments)
  def self.build_customs_info(order)
    # Determine if customs are needed
    destination_state = order.shipping_state&.upcase
    destination_country = (order.shipping_country || "US").upcase

    # Customs required for: non-US countries, or US territories shipping via USPS
    # (Guam → mainland is domestic USPS, but Guam → international needs customs)
    needs_customs = destination_country != "US"

    # Also include customs for territory-to-territory shipments as some carriers require it
    us_territories = %w[GU AS VI MP PR]
    origin_is_territory = us_territories.include?(origin_address[:state]&.upcase)
    dest_is_territory = us_territories.include?(destination_state)

    return nil unless needs_customs || (origin_is_territory && !dest_is_territory)

    customs_items = order.order_items.map do |item|
      {
        description: item.product_name.truncate(50),
        quantity: item.quantity,
        weight: (item.product_variant&.weight_oz || DEFAULT_WEIGHT_OZ) * item.quantity,
        value: (item.unit_price_cents / 100.0) * item.quantity,
        origin_country: "US",
        hs_tariff_number: item.product&.hs_tariff_number.presence || "6109.10" # Default: cotton t-shirts
      }
    end

    {
      customs_certify: true,
      customs_signer: "Hafaloha",
      contents_type: "merchandise",
      restriction_type: "none",
      non_delivery_option: "return",
      customs_items: customs_items
    }
  end

  # Calculate total weight for an order
  def self.calculate_order_weight_oz(order)
    total = order.order_items.sum do |item|
      weight = item.product_variant&.weight_oz.presence || DEFAULT_WEIGHT_OZ
      weight * item.quantity
    end
    [total, DEFAULT_WEIGHT_OZ].max
  end

  # Create a shared EasyPost client instance
  def self.easypost_client
    custom_http_exec = lambda do |method, uri, headers, open_timeout, read_timeout, body = nil|
      require "net/http"
      request = Net::HTTP.const_get(method.to_s.capitalize).new(uri)
      headers.each { |k, v| request[k] = v }
      request.body = body if body
      Net::HTTP.start(
        uri.host, uri.port,
        use_ssl: true,
        read_timeout: read_timeout,
        open_timeout: open_timeout,
        verify_mode: OpenSSL::SSL::VERIFY_PEER,
        ca_file: ENV["SSL_CERT_FILE"],
        verify_callback: proc { |preverify_ok, _| preverify_ok }
      ) { |http| http.request(request) }
    end

    EasyPost::Client.new(
      api_key: ENV["EASYPOST_API_KEY"],
      read_timeout: 60,
      open_timeout: 30,
      custom_client_exec: custom_http_exec
    )
  end

  # Validate a shipping address
  # @param address [Hash] - Address to validate
  # @return [Hash] - Validated/corrected address
  def self.validate_address(address)
    raise ShippingError, "EasyPost API key not configured" unless ENV["EASYPOST_API_KEY"].present?

    # Create EasyPost client
    client = EasyPost::Client.new(api_key: ENV["EASYPOST_API_KEY"])

    easypost_address = client.address.create(
      street1: address[:street1],
      street2: address[:street2],
      city: address[:city],
      state: address[:state],
      zip: address[:zip],
      country: address[:country] || "US",
      verify: [ "delivery" ]
    )

    # Return the verified address or original if verification fails
    if easypost_address.verifications&.delivery&.success
      {
        street1: easypost_address.street1,
        street2: easypost_address.street2,
        city: easypost_address.city,
        state: easypost_address.state,
        zip: easypost_address.zip,
        country: easypost_address.country,
        verified: true
      }
    else
      address.merge(verified: false)
    end
  rescue StandardError => e
    Rails.logger.error "EasyPost Address Verification Error: #{e.message}"
    address.merge(verified: false, error: e.message)
  end

  private

  # Format EasyPost rates for frontend consumption
  def self.format_rates(rates)
    return [] if rates.blank?

    # Filter and sort rates
    rates
      .select { |rate| rate.rate.present? && rate.rate.to_f > 0 }
      .sort_by { |rate| rate.rate.to_f }
      .map do |rate|
        # Use delivery_days from EasyPost, fall back to est_delivery_days,
        # then estimate based on service name (EasyPost often returns nil for Guam shipments)
        days = rate.delivery_days || rate.est_delivery_days || estimate_delivery_days(rate.service, rate.carrier)

        {
          id: rate.id,
          carrier: rate.carrier,
          service: rate.service,
          rate_cents: (rate.rate.to_f * 100).to_i,
          rate_formatted: "$#{'%.2f' % rate.rate}",
          delivery_days: days,
          delivery_date: rate.delivery_date,
          delivery_date_guaranteed: rate.delivery_date_guaranteed || false,
          est_delivery_days: rate.est_delivery_days
        }
      end
  end

  # Estimate delivery days based on service name when EasyPost doesn't provide them.
  # These are rough estimates for shipments originating from Guam.
  def self.estimate_delivery_days(service, carrier)
    service_lower = service.to_s.downcase

    if service_lower.include?("express") || service_lower.include?("overnight") || service_lower.include?("next day")
      3  # Express from Guam is typically 2-4 days to mainland US
    elsif service_lower.include?("priority") && !service_lower.include?("first")
      5  # Priority Mail from Guam is typically 4-7 days
    elsif service_lower.include?("first class") || service_lower.include?("firstclass")
      7  # First Class from Guam is typically 5-10 days
    elsif service_lower.include?("ground") || service_lower.include?("parcel")
      10 # Ground/Parcel from Guam is typically 7-14 days
    elsif service_lower.include?("media") || service_lower.include?("library")
      14 # Media mail from Guam is slow
    else
      7  # Default estimate for unknown services
    end
  end

  def self.deep_symbolize_keys(value)
    case value
    when Hash
      value.each_with_object({}) do |(k, v), memo|
        memo[k.to_sym] = deep_symbolize_keys(v)
      end
    when Array
      value.map { |v| deep_symbolize_keys(v) }
    else
      value
    end
  end
end
