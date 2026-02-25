class AddHsTariffNumberToProducts < ActiveRecord::Migration[8.1]
  def change
    add_column :products, :hs_tariff_number, :string
  end
end
