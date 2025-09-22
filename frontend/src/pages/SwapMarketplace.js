import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HiSearch, 
  HiFilter, 
  HiLocationMarker, 
  HiStar, 
  HiUser, 
  HiBriefcase,
  HiHome,
  HiCog,
  HiTag,
  HiEye,
  HiHeart,
  HiPlus,
  HiClock,
  HiCurrencyDollar
} from 'react-icons/hi';
import { swapAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const SwapMarketplace = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subcategory: '',
    tags: [],
    location: '',
    radius: 50
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOffers: 0
  });

  const categories = [
    { value: 'skill', label: 'Skills', icon: HiBriefcase },
    { value: 'service', label: 'Services', icon: HiCog },
    { value: 'accommodation', label: 'Accommodation', icon: HiHome },
    { value: 'item', label: 'Items', icon: HiTag },
    { value: 'other', label: 'Other', icon: HiTag }
  ];

  const popularTags = [
    'web-development', 'design', 'marketing', 'consulting', 'photography',
    'writing', 'translation', 'tutoring', 'cooking', 'fitness',
    'travel', 'business', 'finance', 'legal', 'healthcare'
  ];

  useEffect(() => {
    loadOffers();
  }, [filters, pagination.currentPage]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: 12,
        excludeUser: true,
        ...filters
      };

      // Convert tags array to query string
      if (filters.tags.length > 0) {
        params.tags = filters.tags;
      }

      const response = await swapAPI.getOffers(params);
      setOffers(response.data.offers);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading offers:', error);
      toast.error('Failed to load swap offers');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const handleTagToggle = (tag) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      subcategory: '',
      tags: [],
      location: '',
      radius: 50
    });
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const getCategoryIcon = (category) => {
    const categoryObj = categories.find(c => c.value === category);
    return categoryObj ? categoryObj.icon : HiTag;
  };

  const getCategoryLabel = (category) => {
    const categoryObj = categories.find(c => c.value === category);
    return categoryObj ? categoryObj.label : category;
  };

  const renderStars = (rating) => {
    if (!rating || rating === 0) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<HiStar key={i} className="h-4 w-4 text-yellow-400 fill-current" />);
    }

    if (hasHalfStar) {
      stars.push(<HiStar key="half" className="h-4 w-4 text-yellow-400 fill-current opacity-50" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<HiStar key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Alumni Swap Marketplace</h1>
              <p className="mt-2 text-gray-600">
                Exchange skills, services, and accommodations with fellow alumni
              </p>
            </div>
            {user?.role === 'admin' || user?.role === 'super_admin' ? (
              <Link
                to="/swap/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <HiPlus className="h-4 w-4 mr-2" />
                Create Offer
              </Link>
            ) : null}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filter Offers</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search offers..."
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All categories</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <div className="relative">
                <HiLocationMarker className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City, state, or country"
                />
              </div>
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Radius (km)
              </label>
              <select
                value={filters.radius}
                onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
                <option value={500}>500 km</option>
              </select>
            </div>
          </div>

          {/* Popular Tags */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Popular Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    filters.tags.includes(tag)
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found {pagination.totalOffers} offers
            {filters.search && ` matching "${filters.search}"`}
          </p>
        </div>

        {/* Offers Grid */}
        {offers.length === 0 ? (
          <div className="text-center py-12">
            <HiTag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No offers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria or create a new offer
            </p>
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <div className="mt-6">
                <Link
                  to="/swap/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <HiPlus className="h-4 w-4 mr-2" />
                  Create Offer
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => {
              const CategoryIcon = getCategoryIcon(offer.category);
              
              return (
                <div key={offer._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Offer Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <CategoryIcon className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                            {offer.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {getCategoryLabel(offer.category)} • {offer.subcategory}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="text-gray-400 hover:text-red-500">
                          <HiHeart className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {offer.description}
                    </p>

                    {/* User Info */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="flex-shrink-0">
                        {offer.user.profile?.profilePicture ? (
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={offer.user.profile.profilePicture}
                            alt={`${offer.user.firstName} ${offer.user.lastName}`}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {offer.user.firstName[0]}{offer.user.lastName[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {offer.user.firstName} {offer.user.lastName}
                        </p>
                        {offer.user.profile?.swap?.swapStats?.averageRating > 0 && (
                          <div className="flex items-center">
                            <div className="flex items-center">
                              {renderStars(offer.user.profile.swap.swapStats.averageRating)}
                            </div>
                            <span className="ml-1 text-xs text-gray-500">
                              ({offer.user.profile.swap.swapStats.averageRating.toFixed(1)})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {offer.location?.address && (
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <HiLocationMarker className="h-4 w-4 mr-1" />
                        {offer.location.address.city}, {offer.location.address.state}
                      </div>
                    )}

                    {/* Tags */}
                    {offer.tags && offer.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {offer.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {offer.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{offer.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Estimated Value */}
                    {offer.estimatedValue && (
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <HiCurrencyDollar className="h-4 w-4 mr-1" />
                        <span>
                          Est. value: {offer.estimatedValue.currency} {offer.estimatedValue.amount}
                          {offer.estimatedValue.isFlexible && ' (flexible)'}
                        </span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <HiEye className="h-4 w-4 mr-1" />
                        <span>{offer.views || 0} views</span>
                      </div>
                      <div className="flex items-center">
                        <HiClock className="h-4 w-4 mr-1" />
                        <span>{new Date(offer.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bg-gray-50 px-6 py-3 flex space-x-3">
                    <Link
                      to={`/swap/offers/${offer._id}`}
                      className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/swap/offers/${offer._id}/request`}
                      className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Make Offer
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={!pagination.hasPrev}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={!pagination.hasNext}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapMarketplace;
