class Haf176177178SyncFixes < ActiveRecord::Migration[8.0]
  def change
    # HAF-176: Standardize order source values to match TSQ
    # Change default from "web" to "online" and update existing records
    change_column_default :orders, :source, from: "web", to: "online"

    reversible do |dir|
      dir.up do
        # Migrate existing source values to match TSQ convention
        execute <<~SQL
          UPDATE orders SET source = 'online' WHERE source = 'web';
          UPDATE orders SET source = 'phone' WHERE source = 'api';
        SQL
      end

      dir.down do
        execute <<~SQL
          UPDATE orders SET source = 'web' WHERE source = 'online';
          UPDATE orders SET source = 'api' WHERE source = 'phone';
        SQL
      end
    end

    # HAF-178: Add NOT NULL constraint and default for fulfillment_type
    change_column_default :orders, :fulfillment_type, "pickup"
    change_column_null :orders, :fulfillment_type, false, "pickup"

    # HAF-177: Add missing indexes for query performance
    add_index :orders, :fulfillment_type, name: "index_orders_on_fulfillment_type"
    add_index :orders, :staff_created, name: "index_orders_on_staff_created"
    add_index :users, :assigned_location_id, name: "index_users_on_assigned_location_id"
  end
end
