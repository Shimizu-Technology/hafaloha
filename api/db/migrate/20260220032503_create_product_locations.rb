class CreateProductLocations < ActiveRecord::Migration[8.0]
  def change
    create_table :product_locations do |t|
      t.references :product, null: false, foreign_key: true
      t.references :location, null: false, foreign_key: true
      t.boolean :available, default: true, null: false
      t.integer :price_override_cents

      t.timestamps
    end

    add_index :product_locations, [ :product_id, :location_id ], unique: true
    add_index :product_locations, :available
  end
end
