class ChangePublishedDefaultToTrue < ActiveRecord::Migration[8.0]
  def change
    # Products should default to published
    change_column_default :products, :published, from: nil, to: true

    # Fundraisers should default to published
    change_column_default :fundraisers, :published, from: false, to: true
  end
end
