class AddAllowShippingToProducts < ActiveRecord::Migration[8.1]
  def change
    add_column :products, :allow_shipping, :boolean, default: true, null: false
  end
end
