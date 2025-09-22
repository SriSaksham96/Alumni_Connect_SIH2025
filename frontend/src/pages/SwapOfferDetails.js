import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  HiArrowLeft, 
  HiStar, 
  HiLocationMarker, 
  HiBriefcase,
  HiHome,
  HiCog,
  HiTag,
  HiUser,
  HiClock,
  HiCurrencyDollar,
  HiEye,
  HiHeart,
  HiShare,
  HiMapPin,
  HiCalendar,
  HiCheckCircle,
  HiXCircle
} from 'react-icons/hi';
import { swapAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const SwapOfferDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [offer, setOffer] = useState(null);
  const [relatedOffers, setRelatedOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOfferDetails();
  }, [id]);

  const loadOfferDetails = async () => {
    try {
      setLoading(true);
      const response = await swapAPI.getOffer(id);
      setOffer(response.data.offer);
      setRelatedOffers(response.data.relatedOffers || []);
    } catch (error) {
      console.error('Error loading offer details:', error);
      toast.error('Failed to load offer details');
      navigate('/swap');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      skill: HiBriefcase,
      service: HiCog,
      accommodation: HiHome,
      item: HiTag,
      other: HiTag
    };
    return icons[category] || HiTag;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      skill: 'Skills',
      service: 'Services',
      accommodation: 'Accommodation',
      item: 'Items',
      other: 'Other'
    };
    return labels[category] || category;
  };

  const renderStars = (rating) => {
    if (!rating || rating === 0) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<HiStar key={i} className="h-5 w-5 text-yellow-400 fill-current" />);
    }

    if (hasHalfStar) {
      stars.push(<HiStar key="half" className="h-5 w-5 text-yellow-400 fill-current opacity-50" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<HiStar key={`empty-${i}`} className="h-5 w-5 text-gray-300" />);
    }

    return stars;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HiXCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Offer not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The offer you're looking for doesn't exist or has been removed.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/swap')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <HiArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(offer.category);
  const isOwner = user && offer.user._id === user._id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/swap')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <HiArrowLeft className="h-4 w-4 mr-1" />
            Back to Marketplace
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
                    <CategoryIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 text-white">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-3xl font-bold">{offer.title}</h1>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getCategoryLabel(offer.category)}
                    </span>
                  </div>
                  <p className="text-blue-100 text-lg">{offer.subcategory}</p>
                  {offer.location?.address && (
                    <div className="flex items-center mt-2 text-blue-100">
                      <HiLocationMarker className="h-4 w-4 mr-1" />
                      {offer.location.address.city}, {offer.location.address.state}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-100 hover:text-white">
                  <HiHeart className="h-6 w-6" />
                </button>
                <button className="text-blue-100 hover:text-white">
                  <HiShare className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* User Info */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-shrink-0">
                {offer.user.profile?.profilePicture ? (
                  <img
                    className="h-12 w-12 rounded-full object-cover"
                    src={offer.user.profile.profilePicture}
                    alt={`${offer.user.firstName} ${offer.user.lastName}`}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {offer.user.firstName[0]}{offer.user.lastName[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {offer.user.firstName} {offer.user.lastName}
                </h3>
                {offer.user.profile?.swap?.swapStats?.averageRating > 0 && (
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {renderStars(offer.user.profile.swap.swapStats.averageRating)}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      ({offer.user.profile.swap.swapStats.averageRating.toFixed(1)}) • {offer.user.profile.swap.swapStats.totalRatings} reviews
                    </span>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {offer.user.profile?.swap?.swapStats?.totalCompleted || 0} completed swaps
                </p>
              </div>
              {offer.user.profile?.verification?.isVerified && (
                <div className="flex items-center text-green-600">
                  <HiCheckCircle className="h-5 w-5 mr-1" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {offer.description}
              </p>
            </div>

            {/* What they want in return */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">What they want in return</h3>
              <p className="text-gray-600 leading-relaxed">
                {offer.wantsInReturn}
              </p>
            </div>

            {/* Tags */}
            {offer.tags && offer.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {offer.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated Value */}
            {offer.estimatedValue && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Estimated Value</h3>
                <div className="flex items-center text-gray-600">
                  <HiCurrencyDollar className="h-5 w-5 mr-2" />
                  <span>
                    {offer.estimatedValue.currency} {offer.estimatedValue.amount}
                    {offer.estimatedValue.isFlexible && ' (flexible)'}
                  </span>
                </div>
              </div>
            )}

            {/* Availability */}
            {offer.availability && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Availability</h3>
                <div className="space-y-3">
                  {offer.availability.startDate && offer.availability.endDate && (
                    <div className="flex items-center text-gray-600">
                      <HiCalendar className="h-5 w-5 mr-2" />
                      <span>
                        {formatDate(offer.availability.startDate)} - {formatDate(offer.availability.endDate)}
                      </span>
                    </div>
                  )}
                  
                  {offer.availability.timeSlots && offer.availability.timeSlots.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Time Slots:</p>
                      <div className="space-y-1">
                        {offer.availability.timeSlots.map((slot, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <HiClock className="h-4 w-4 mr-2" />
                            <span>
                              {slot.day.charAt(0).toUpperCase() + slot.day.slice(1)}: {formatTime(slot.startTime)} - {formatTime(slot.endTime)} ({slot.timezone})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {offer.availability.isRecurring && (
                    <div className="flex items-center text-gray-600">
                      <HiCheckCircle className="h-5 w-5 mr-2" />
                      <span>Recurring availability</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Accommodation Details */}
            {offer.category === 'accommodation' && offer.accommodation && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Accommodation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <HiHome className="h-5 w-5 mr-2" />
                      <span>Type: {offer.accommodation.propertyType}</span>
                    </div>
                    {offer.accommodation.bedrooms && (
                      <div className="flex items-center text-gray-600">
                        <span className="w-5 h-5 mr-2">🛏️</span>
                        <span>{offer.accommodation.bedrooms} bedrooms</span>
                      </div>
                    )}
                    {offer.accommodation.bathrooms && (
                      <div className="flex items-center text-gray-600">
                        <span className="w-5 h-5 mr-2">🚿</span>
                        <span>{offer.accommodation.bathrooms} bathrooms</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <HiUser className="h-5 w-5 mr-2" />
                      <span>Max {offer.accommodation.maxGuests} guests</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {offer.accommodation.minimumStay && (
                      <div className="flex items-center text-gray-600">
                        <HiCalendar className="h-5 w-5 mr-2" />
                        <span>Min {offer.accommodation.minimumStay} days</span>
                      </div>
                    )}
                    {offer.accommodation.maximumStay && (
                      <div className="flex items-center text-gray-600">
                        <HiCalendar className="h-5 w-5 mr-2" />
                        <span>Max {offer.accommodation.maximumStay} days</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      {offer.accommodation.smokingAllowed ? (
                        <HiCheckCircle className="h-5 w-5 mr-2 text-green-500" />
                      ) : (
                        <HiXCircle className="h-5 w-5 mr-2 text-red-500" />
                      )}
                      <span>Smoking {offer.accommodation.smokingAllowed ? 'allowed' : 'not allowed'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      {offer.accommodation.petsAllowed ? (
                        <HiCheckCircle className="h-5 w-5 mr-2 text-green-500" />
                      ) : (
                        <HiXCircle className="h-5 w-5 mr-2 text-red-500" />
                      )}
                      <span>Pets {offer.accommodation.petsAllowed ? 'allowed' : 'not allowed'}</span>
                    </div>
                  </div>
                </div>
                
                {offer.accommodation.amenities && offer.accommodation.amenities.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {offer.accommodation.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Offer Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{offer.views || 0}</div>
                  <div className="text-sm text-gray-500">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{offer.requests || 0}</div>
                  <div className="text-sm text-gray-500">Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {offer.rating?.average ? offer.rating.average.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Rating</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                {!isOwner ? (
                  <>
                    <Link
                      to={`/swap/offers/${offer._id}/request`}
                      className="flex-1 bg-green-600 text-white text-center py-3 px-6 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Make an Offer
                    </Link>
                    <Link
                      to={`/messages?user=${offer.user._id}`}
                      className="flex-1 bg-blue-600 text-white text-center py-3 px-6 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Contact User
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to={`/swap/offers/${offer._id}/edit`}
                      className="flex-1 bg-blue-600 text-white text-center py-3 px-6 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Edit Offer
                    </Link>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this offer?')) {
                          // Handle delete
                          console.log('Delete offer:', offer._id);
                        }
                      }}
                      className="flex-1 bg-red-600 text-white text-center py-3 px-6 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete Offer
                    </button>
                  </>
                )}
                <Link
                  to="/swap"
                  className="flex-1 bg-white text-gray-700 text-center py-3 px-6 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Back to Marketplace
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related Offers */}
        {relatedOffers.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More from {offer.user.firstName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedOffers.map((relatedOffer) => {
                const RelatedCategoryIcon = getCategoryIcon(relatedOffer.category);
                return (
                  <div key={relatedOffer._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <RelatedCategoryIcon className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                            {relatedOffer.title}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {getCategoryLabel(relatedOffer.category)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {relatedOffer.description}
                      </p>
                      <Link
                        to={`/swap/offers/${relatedOffer._id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapOfferDetails;
