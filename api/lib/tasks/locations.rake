namespace :locations do
  desc "Auto-deactivate expired popup/event locations"
  task auto_deactivate: :environment do
    count = Location.where(auto_deactivate: true, active: true)
                    .where("ends_at < ?", Time.current)
                    .count
    Location.auto_deactivate_expired!
    puts "Auto-deactivated #{count} expired location(s)."
  end
end
