class CreateLocations < ActiveRecord::Migration[8.0]
  def change
    create_table :locations do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.string :address
      t.string :phone
      t.text :description
      t.string :location_type, null: false, default: "permanent"
      t.boolean :active, null: false, default: true
      t.jsonb :hours_json, null: false, default: {}
      t.string :admin_email
      t.jsonb :admin_sms_phones, null: false, default: []
      t.datetime :starts_at
      t.datetime :ends_at
      t.boolean :auto_deactivate, null: false, default: false
      t.references :menu_collection, foreign_key: { to_table: :collections }, null: true
      t.string :qr_code_url

      t.timestamps
    end

    add_index :locations, :slug, unique: true
    add_index :locations, :active
    add_index :locations, :location_type
    add_index :locations, [ :active, :location_type ]
  end
end
