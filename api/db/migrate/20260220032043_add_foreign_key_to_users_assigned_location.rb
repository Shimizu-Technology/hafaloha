class AddForeignKeyToUsersAssignedLocation < ActiveRecord::Migration[8.0]
  def change
    add_foreign_key :users, :locations, column: :assigned_location_id
  end
end
