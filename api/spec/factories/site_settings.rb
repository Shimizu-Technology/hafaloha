FactoryBot.define do
  factory :site_setting do
    payment_test_mode { true }
    payment_processor { 'stripe' }
    store_name { 'Hafaloha' }
    store_email { 'info@hafaloha.com' }
    store_phone { '671-777-1234' }
    order_notification_emails { ['ops@hafaloha.com'] }
    shipping_origin_address do
      {
        company: 'Hafaloha',
        street1: '215 Rojas Street',
        city: 'Tamuning',
        state: 'GU',
        zip: '96913',
        country: 'US',
        phone: '671-989-3444'
      }
    end
    send_retail_emails { true }
    send_acai_emails { false }
    send_wholesale_emails { false }
  end
end
