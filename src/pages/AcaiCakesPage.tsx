import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { 
  acaiApi, 
  configApi,
  formatPrice,
  type AcaiConfigResponse, 
  type AcaiAvailableDate, 
  type AcaiTimeSlot
} from '../services/api';
import type { AppConfig } from '../types/order';
import toast from 'react-hot-toast';

export default function AcaiCakesPage() {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  
  // Config state
  const [config, setConfig] = useState<AcaiConfigResponse | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Available dates and slots
  const [availableDates, setAvailableDates] = useState<AcaiAvailableDate[]>([]);
  const [timeSlots, setTimeSlots] = useState<AcaiTimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedCrust, setSelectedCrust] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [includePlacard, setIncludePlacard] = useState(false);
  const [selectedPlacardOption, setSelectedPlacardOption] = useState<number | null>(null);
  const [placardText, setPlacardText] = useState('');
  
  // Contact info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Load config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [acaiConfig, appConf] = await Promise.all([
          acaiApi.getConfig(),
          configApi.getConfig()
        ]);
        setConfig(acaiConfig);
        setAppConfig(appConf);
        
        // Auto-select first crust option
        if (acaiConfig.crust_options.length > 0) {
          setSelectedCrust(acaiConfig.crust_options[0].id);
        }
        
        // Load available dates
        const datesResponse = await acaiApi.getAvailableDates(60);
        setAvailableDates(datesResponse.dates.filter(d => !d.fully_booked));
      } catch (err) {
        console.error('Failed to load Acai config:', err);
        setError('Unable to load ordering options. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
  }, []);

  // Load time slots when date changes
  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([]);
      setSelectedSlot('');
      return;
    }
    
    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const response = await acaiApi.getAvailableSlots(selectedDate);
        setTimeSlots(response.slots);
        setSelectedSlot('');
      } catch (err) {
        console.error('Failed to load time slots:', err);
        toast.error('Unable to load time slots for this date');
      } finally {
        setLoadingSlots(false);
      }
    };
    
    loadSlots();
  }, [selectedDate]);

  // Calculate total price
  const calculateTotal = () => {
    if (!config) return 0;
    
    let total = config.settings.base_price_cents * quantity;
    
    // Add crust price
    const crust = config.crust_options.find(c => c.id === selectedCrust);
    if (crust) {
      total += crust.price_cents * quantity;
    }
    
    // Add placard price
    if (includePlacard && selectedPlacardOption) {
      const placardOption = config.placard_options.find(p => p.id === selectedPlacardOption);
      if (placardOption) {
        total += placardOption.price_cents * quantity;
      }
    }
    
    return total;
  };

  // Get selected placard option details
  const selectedPlacardOptionDetails = config?.placard_options.find(p => p.id === selectedPlacardOption);
  const isCustomPlacard = selectedPlacardOptionDetails?.name?.toLowerCase().includes('custom');

  // Form validation
  const isFormValid = () => {
    // If placard is included with custom option, require placard text
    const placardValid = !includePlacard || (
      selectedPlacardOption !== null &&
      (!isCustomPlacard || placardText.trim() !== '')
    );
    
    return (
      selectedDate &&
      selectedSlot &&
      selectedCrust !== null &&
      name.trim() !== '' &&
      email.trim() !== '' &&
      phone.trim() !== '' &&
      placardValid
    );
  };

  // Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid() || !config) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      let token: string | null = null;
      if (isSignedIn) {
        token = await getToken();
      }
      
      const response = await acaiApi.createOrder({
        pickup_date: selectedDate,
        pickup_time: selectedSlot,
        crust_option_id: selectedCrust!,
        name,
        email,
        phone,
        quantity,
        include_placard: includePlacard,
        placard_option_id: includePlacard ? selectedPlacardOption || undefined : undefined,
        placard_text: includePlacard ? placardText : undefined,
        notes: notes || undefined,
      }, token);
      
      if (response.success) {
        toast.success('Order placed successfully!');
        navigate(`/orders/${response.order.id}`);
      }
    } catch (err: any) {
      console.error('Order failed:', err);
      const message = err.response?.data?.error || 'Failed to place order. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hafalohaRed mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!config || !config.settings.active) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🍰</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acai Cakes Coming Soon!</h1>
          <p className="text-gray-600 mb-6">
            We're not currently accepting Acai Cake orders online. 
            Please call us to place an order!
          </p>
          <a 
            href={`tel:${config?.settings.pickup_phone || '671-989-3444'}`}
            className="inline-block bg-hafalohaRed text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            📞 Call to Order
          </a>
        </div>
      </div>
    );
  }

  const selectedCrustOption = config.crust_options.find(c => c.id === selectedCrust);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            🍰 {config.settings.name}
          </h1>
          <p className="text-2xl font-bold text-hafalohaRed mb-4">
            {config.settings.formatted_price}
          </p>
          {config.settings.description && (
            <p className="text-gray-600 max-w-2xl mx-auto whitespace-pre-line">
              {config.settings.description}
            </p>
          )}
        </div>

        {/* Test Mode Banner */}
        {appConfig?.app_mode === 'test' && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <div className="flex items-center justify-center">
              <span className="text-yellow-800 font-medium">
                ⚙️ Test Mode — No real payment will be charged
              </span>
            </div>
          </div>
        )}

        {/* Product Image */}
        {config.settings.image_url && (
          <div className="mb-8">
            <img
              src={config.settings.image_url}
              alt={config.settings.name}
              className="w-full max-w-lg mx-auto rounded-xl shadow-lg"
            />
          </div>
        )}

        {/* Ordering Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Date */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-hafalohaRed text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              Select Pickup Date
            </h2>
            
            {availableDates.length === 0 ? (
              <p className="text-gray-500 italic">No available pickup dates at this time.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableDates.slice(0, 12).map((dateInfo) => {
                  const date = new Date(dateInfo.date + 'T00:00:00');
                  const isSelected = selectedDate === dateInfo.date;
                  
                  return (
                    <button
                      key={dateInfo.date}
                      type="button"
                      onClick={() => setSelectedDate(dateInfo.date)}
                      className={`p-4 rounded-lg border-2 transition text-center ${
                        isSelected
                          ? 'border-hafalohaRed bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm text-gray-500">{dateInfo.day_name}</div>
                      <div className="text-lg font-bold text-gray-900">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {dateInfo.available_slots} slots
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Select Time Slot */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-hafalohaRed text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
              Select Pickup Time
            </h2>
            
            {!selectedDate ? (
              <p className="text-gray-500 italic">Please select a date first.</p>
            ) : loadingSlots ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hafalohaRed mx-auto"></div>
              </div>
            ) : timeSlots.length === 0 ? (
              <p className="text-gray-500 italic">No time slots available for this date.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {timeSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.slot_value;
                  
                  return (
                    <button
                      key={slot.slot_value}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.slot_value)}
                      className={`p-3 rounded-lg border-2 transition ${
                        !slot.available
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : isSelected
                          ? 'border-hafalohaRed bg-red-50 text-gray-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-900'
                      }`}
                    >
                      <div className="font-semibold">{slot.time}</div>
                      {!slot.available && (
                        <div className="text-xs text-gray-400">Fully booked</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Choose Crust */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-hafalohaRed text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              Choose Your Base
            </h2>
            
            <div className="space-y-3">
              {config.crust_options.map((crust) => {
                const isSelected = selectedCrust === crust.id;
                
                return (
                  <button
                    key={crust.id}
                    type="button"
                    onClick={() => setSelectedCrust(crust.id)}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      isSelected
                        ? 'border-hafalohaRed bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{crust.name}</div>
                        {crust.description && (
                          <div className="text-sm text-gray-500 mt-1">{crust.description}</div>
                        )}
                      </div>
                      <div className="text-gray-600 font-medium whitespace-nowrap shrink-0">{crust.formatted_price}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Quantity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-hafalohaRed text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
              Quantity
            </h2>
            
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-xl font-bold hover:border-hafalohaRed transition"
              >
                −
              </button>
              <span className="text-3xl font-bold text-gray-900 w-16 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-xl font-bold hover:border-hafalohaRed transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Step 5: Placard (Optional) */}
          {config.settings.placard_enabled && config.placard_options.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-hafalohaRed text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
                Add a Message Placard
                <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>
              </h2>
              
              <div className="space-y-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePlacard}
                    onChange={(e) => {
                      setIncludePlacard(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedPlacardOption(null);
                        setPlacardText('');
                      }
                    }}
                    className="w-5 h-5 text-hafalohaRed border-gray-300 rounded focus:ring-hafalohaRed"
                  />
                  <span className="ml-3 text-gray-700">
                    Yes, add a message placard
                  </span>
                </label>
                
                {includePlacard && (
                  <div className="space-y-4 pl-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select a Placard Type
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {config.placard_options.map((placard) => {
                          const isSelected = selectedPlacardOption === placard.id;
                          
                          return (
                            <button
                              key={placard.id}
                              type="button"
                              onClick={() => {
                                setSelectedPlacardOption(placard.id);
                                // Pre-fill placard text for non-custom options
                                if (!placard.name.toLowerCase().includes('custom')) {
                                  setPlacardText(placard.name);
                                } else {
                                  setPlacardText('');
                                }
                              }}
                              className={`p-3 rounded-lg border-2 transition text-left ${
                                isSelected
                                  ? 'border-hafalohaRed bg-red-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="font-medium text-gray-900">{placard.name}</div>
                                <div className="text-sm text-gray-600">{placard.formatted_price}</div>
                              </div>
                              {placard.description && (
                                <div className="text-xs text-gray-500 mt-1">{placard.description}</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Show text input for custom placard or to personalize standard ones */}
                    {selectedPlacardOption && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isCustomPlacard ? 'Your Custom Message *' : 'Personalize Your Message (Optional)'}
                        </label>
                        <input
                          type="text"
                          value={placardText}
                          onChange={(e) => setPlacardText(e.target.value)}
                          placeholder={isCustomPlacard ? 'Enter your custom message' : `e.g., ${selectedPlacardOptionDetails?.name} to Mom!`}
                          maxLength={50}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">{placardText.length}/50 characters</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-hafalohaRed text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                {config.settings.placard_enabled ? '6' : '5'}
              </span>
              Contact Information
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  placeholder="(671) 123-4567"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  placeholder="Any special requests..."
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {config.settings.name} × {quantity}
                </span>
                <span className="text-gray-900">{formatPrice(config.settings.base_price_cents * quantity)}</span>
              </div>
              
              {selectedCrustOption && selectedCrustOption.price_cents > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{selectedCrustOption.name} × {quantity}</span>
                  <span className="text-gray-900">{formatPrice(selectedCrustOption.price_cents * quantity)}</span>
                </div>
              )}
              
              {includePlacard && selectedPlacardOptionDetails && selectedPlacardOptionDetails.price_cents > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{selectedPlacardOptionDetails.name} Placard × {quantity}</span>
                  <span className="text-gray-900">{formatPrice(selectedPlacardOptionDetails.price_cents * quantity)}</span>
                </div>
              )}
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-hafalohaRed">{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            </div>

            {selectedDate && selectedSlot && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📍 Pickup:</strong> {config.settings.pickup_location}<br />
                  <strong>📅 Date:</strong> {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}<br />
                  <strong>🕐 Time:</strong> {selectedSlot.replace('-', ' - ').replace(/(\d{2}):(\d{2})/g, (_, h, m) => {
                    const hour = parseInt(h);
                    const period = hour >= 12 ? 'PM' : 'AM';
                    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                    return `${hour12}:${m} ${period}`;
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid() || submitting}
            className="w-full bg-hafalohaRed text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing...
              </>
            ) : (
              `Place Order — ${formatPrice(calculateTotal())}`
            )}
          </button>

          {/* Phone Order Alternative */}
          <div className="text-center text-gray-600">
            <p>Prefer to order by phone?</p>
            <a 
              href={`tel:${config.settings.pickup_phone}`}
              className="text-hafalohaRed font-semibold hover:underline"
            >
              📞 Call {config.settings.pickup_phone}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
