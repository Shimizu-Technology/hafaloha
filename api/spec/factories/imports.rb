FactoryBot.define do
  factory :import do
    user
    status { "pending" }
    filename { "products.csv" }
    products_count { 0 }
    variants_count { 0 }
    images_count { 0 }
    collections_count { 0 }
    error_messages { nil }
    started_at { nil }
    completed_at { nil }
    processed_products { 0 }
    total_products { 0 }
    progress_percent { 0 }
    skipped_count { 0 }
    current_step { nil }
    warnings { nil }
  end
end
