class AddSmsNewOrderAlertToSiteSettings < ActiveRecord::Migration[8.1]
  def change
    add_column :site_settings, :sms_new_order_alert, :boolean, default: true, null: false
  end
end
