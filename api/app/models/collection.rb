class Collection < ApplicationRecord
  include Sanitizable
  sanitize_fields :name, :description

  # Collection types
  COLLECTION_TYPES = %w[standard seasonal event limited_time].freeze

  # Associations
  has_many :product_collections, dependent: :destroy
  has_many :products, through: :product_collections

  # Validations
  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true, format: { with: /\A[a-z0-9\-]+\z/ }
  validates :collection_type, inclusion: { in: COLLECTION_TYPES }

  validate :ends_at_after_starts_at

  # Scopes
  scope :published, -> { where(published: true) }
  scope :featured, -> { where(featured: true) }
  scope :is_featured, -> { where(is_featured: true) }
  scope :by_position, -> { order(sort_order: :asc, name: :asc) }

  # Collection type scopes
  scope :standard, -> { where(collection_type: "standard") }
  scope :seasonal, -> { where(collection_type: "seasonal") }
  scope :event, -> { where(collection_type: "event") }
  scope :limited_time, -> { where(collection_type: "limited_time") }
  scope :by_collection_type, ->(type) { type.present? ? where(collection_type: type) : all }

  # Within date range (or no date range set)
  scope :within_date_range, -> {
    now = Time.current
    where("starts_at IS NULL OR starts_at <= ?", now)
      .where("ends_at IS NULL OR ends_at >= ?", now)
  }

  # Currently active: published AND within date range
  scope :currently_active, -> { published.within_date_range }

  # Callbacks
  before_validation :generate_slug, if: -> { slug.blank? }

  # Class methods

  # Auto-hide expired collections (for cron)
  def self.auto_hide_expired!
    where(auto_hide: true, published: true)
      .where("ends_at < ?", Time.current)
      .update_all(published: false)
  end

  # Instance methods
  def to_param
    slug
  end

  def active_now?
    return false unless published?
    return true if starts_at.nil? && ends_at.nil?
    now = Time.current
    (starts_at.nil? || starts_at <= now) && (ends_at.nil? || ends_at >= now)
  end

  def expired?
    ends_at.present? && ends_at < Time.current
  end

  def upcoming?
    starts_at.present? && starts_at > Time.current
  end

  private

  def generate_slug
    sanitized_name = ActionController::Base.helpers.strip_tags(name.to_s)
    self.slug = sanitized_name.parameterize
  end

  def ends_at_after_starts_at
    return if starts_at.blank? || ends_at.blank?
    if ends_at <= starts_at
      errors.add(:ends_at, "must be after starts_at")
    end
  end
end
