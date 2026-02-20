class AddAllowPickupToProducts < ActiveRecord::Migration[8.1]
  def change
    add_column :products, :allow_pickup, :boolean, default: true, null: false
    add_index :products, :allow_pickup
  end
end
