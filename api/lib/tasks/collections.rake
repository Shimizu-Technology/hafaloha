namespace :collections do
  desc "Auto-hide expired seasonal/event/limited_time collections"
  task auto_hide_expired: :environment do
    count = Collection.where(auto_hide: true, published: true)
                      .where("ends_at < ?", Time.current)
                      .count
    Collection.auto_hide_expired!
    puts "Auto-hid #{count} expired collection(s)."
  end
end
