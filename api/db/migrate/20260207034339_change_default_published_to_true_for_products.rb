class ChangeDefaultPublishedToTrueForProducts < ActiveRecord::Migration[8.1]
  def change
    change_column_default :products, :published, from: false, to: true
  end
end
