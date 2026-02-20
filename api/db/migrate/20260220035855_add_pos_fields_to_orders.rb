class AddPosFieldsToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :source, :string, default: "web" unless column_exists?(:orders, :source)
    add_column :orders, :staff_created, :boolean, default: false unless column_exists?(:orders, :staff_created)
    add_column :orders, :payment_method, :string, default: "stripe" unless column_exists?(:orders, :payment_method)
    add_column :orders, :cash_received_cents, :integer unless column_exists?(:orders, :cash_received_cents)
    add_column :orders, :cash_change_cents, :integer unless column_exists?(:orders, :cash_change_cents)
    add_column :orders, :created_by_user_id, :bigint unless column_exists?(:orders, :created_by_user_id)
    add_column :orders, :fulfillment_type, :string unless column_exists?(:orders, :fulfillment_type)

    add_index :orders, :source unless index_exists?(:orders, :source)
    add_index :orders, :created_by_user_id unless index_exists?(:orders, :created_by_user_id)
  end
end
