class AddAssignedLocationIdToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :assigned_location_id, :bigint
  end
end
