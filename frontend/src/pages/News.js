import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { HiNewspaper, HiSearch, HiFilter, HiX, HiHeart, HiChat, HiEye, HiCalendar, HiTag, HiPlus } from 'react-icons/hi';
import { newsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const News = () => {
  const { user, hasPermission } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    startDate: '',
    endDate: '',
    graduationYear: '',
    featured: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery(
    ['news', page, filters],
    () => newsAPI.getNews({ page, ...filters }),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        console.log('News API Success:', data);
      },
      onError: (error) => {
        console.error('News API Error:', error);
      }
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      startDate: '',
      endDate: '',
      graduationYear: '',
      featured: false
    });
    setPage(1);
  };

  const handleLike = async (articleId) => {
    if (!user) {
      toast.error('Please log in to like articles');
      return;
    }

    try {
      await newsAPI.likeArticle(articleId);
      toast.success('Article liked!');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to like article');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      alumni: 'bg-blue-100 text-blue-800',
      events: 'bg-green-100 text-green-800',
      achievements: 'bg-yellow-100 text-yellow-800',
      fundraising: 'bg-purple-100 text-purple-800',
      academic: 'bg-indigo-100 text-indigo-800',
      sports: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">News & Updates</h1>
              <p className="mt-2 text-gray-600">Stay connected with the latest alumni news and updates</p>
            </div>
            {user && hasPermission('create_news') && (
              <Link
                to="/news/create"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <HiPlus className="w-4 h-4" />
                Create Article
              </Link>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search news articles..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <HiFilter className="w-5 h-5" />
                Filters
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="general">General</option>
                    <option value="alumni">Alumni</option>
                    <option value="events">Events</option>
                    <option value="achievements">Achievements</option>
                    <option value="fundraising">Fundraising</option>
                    <option value="academic">Academic</option>
                    <option value="sports">Sports</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                  <input
                    type="number"
                    placeholder="e.g., 2020"
                    value={filters.graduationYear}
                    onChange={(e) => handleFilterChange('graduationYear', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.featured}
                      onChange={(e) => handleFilterChange('featured', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured only</span>
                  </label>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    <HiX className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* News Articles */}
        {data?.data?.news?.length > 0 ? (
          <div className="space-y-6 mb-8">
            {data.data.news.map((article) => (
              <div key={article._id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(article.category)}`}>
                          {article.category}
                        </span>
                        {article.isFeatured && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                        <span className="flex items-center text-sm text-gray-500">
                          <HiCalendar className="w-4 h-4 mr-1" />
                          {formatDate(article.publishDate)}
                        </span>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
                        <Link to={`/news/${article._id}`}>
                          {article.title}
                        </Link>
                      </h2>
                      
                      {article.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {article.excerpt}
                        </p>
                      )}

                      {/* Author Information */}
                      <div className="flex items-center mb-4 p-2 bg-gray-50 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {article.author?.profile?.profilePicture ? (
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={article.author.profile.profilePicture}
                              alt={article.author.firstName}
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {article.author?.firstName?.[0]}{article.author?.lastName?.[0]}
                            </span>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {article.author?.firstName} {article.author?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {article.author?.role === 'admin' || article.author?.role === 'super_admin' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Alumni
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {article.images && article.images.length > 0 && (
                      <div className="ml-4 w-32 h-24 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={article.images[0].url}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <HiEye className="w-4 h-4" />
                        {article.viewCount || 0} views
                      </div>
                      <div className="flex items-center gap-1">
                        <HiHeart className="w-4 h-4" />
                        {article.likeCount || 0} likes
                      </div>
                      <div className="flex items-center gap-1">
                        <HiChat className="w-4 h-4" />
                        {article.commentCount || 0} comments
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user && (
                        <button
                          onClick={() => handleLike(article._id)}
                          className={`p-2 rounded-lg ${
                            article.isLiked 
                              ? 'text-red-600 bg-red-50' 
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <HiHeart className="w-5 h-5" />
                        </button>
                      )}
                      <Link
                        to={`/news/${article._id}`}
                        className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                      >
                        Read More
                      </Link>
                    </div>
                  </div>

                  {article.tags && article.tags.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <HiTag className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-wrap gap-2">
                          {article.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-12 text-center">
              <HiNewspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No news articles found</h3>
              <p className="text-gray-600">
                {Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters to see more articles.'
                  : 'Check back later for new articles.'
                }
              </p>
            </div>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!data.pagination.hasPrev}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {data.pagination.currentPage} of {data.pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={!data.pagination.hasNext}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
