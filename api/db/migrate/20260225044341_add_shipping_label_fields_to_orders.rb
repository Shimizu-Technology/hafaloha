class AddShippingLabelFieldsToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :tracking_url, :string
    add_column :orders, :shipping_label_url, :string
    add_column :orders, :shipping_country, :string
  end
end
