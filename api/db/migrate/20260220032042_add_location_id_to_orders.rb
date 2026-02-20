class AddLocationIdToOrders < ActiveRecord::Migration[8.0]
  def change
    add_reference :orders, :location, foreign_key: true, null: true
  end
end
