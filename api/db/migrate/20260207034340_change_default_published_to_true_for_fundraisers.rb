class ChangeDefaultPublishedToTrueForFundraisers < ActiveRecord::Migration[8.1]
  def change
    change_column_default :fundraisers, :published, from: false, to: true
  end
end
