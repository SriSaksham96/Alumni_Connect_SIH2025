import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { HiArrowLeft, HiHeart, HiChat, HiEye, HiCalendar, HiTag, HiUser, HiShare } from 'react-icons/hi';
import { newsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NewsDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const { data: article, isLoading, error, refetch } = useQuery(
    ['newsArticle', id],
    () => newsAPI.getNewsArticle(id),
    {
      enabled: !!id,
    }
  );

  const handleLike = async () => {
    if (!user) {
      toast.error('Please log in to like articles');
      return;
    }

    try {
      await newsAPI.likeArticle(id);
      toast.success('Article liked!');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to like article');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await newsAPI.addComment(id, { content: comment });
      toast.success('Comment added!');
      setComment('');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Article not found</h3>
              <p className="text-gray-600 mb-4">The article you're looking for doesn't exist or has been removed.</p>
              <button
                onClick={() => navigate('/news')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to News
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/news')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <HiArrowLeft className="w-5 h-5" />
          Back to News
        </button>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Article Image */}
          {article.images && article.images.length > 0 && (
            <div className="h-64 md:h-96 bg-gray-200">
              <img
                src={article.images[0].url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            {/* Article Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(article.category)}`}>
                  {article.category}
                </span>
                {article.isFeatured && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                    Featured
                  </span>
                )}
                <span className="flex items-center text-sm text-gray-500">
                  <HiCalendar className="w-4 h-4 mr-1" />
                  {formatDate(article.publishDate)}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>

              {article.excerpt && (
                <p className="text-xl text-gray-600 mb-4">{article.excerpt}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <HiUser className="w-4 h-4" />
                    {article.author?.firstName} {article.author?.lastName}
                  </div>
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
                      onClick={handleLike}
                      className={`p-2 rounded-lg ${
                        article.isLiked 
                          ? 'text-red-600 bg-red-50' 
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <HiHeart className="w-5 h-5" />
                    </button>
                  )}
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                    <HiShare className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="prose max-w-none mb-8">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {article.content}
              </div>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <HiTag className="w-5 h-5 text-gray-400" />
                  <h3 className="font-medium text-gray-900">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Images */}
            {article.images && article.images.length > 1 && (
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">More Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {article.images.slice(1).map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={image.caption || article.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Comments ({article.comments?.length || 0})
                </h3>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {showComments ? 'Hide Comments' : 'Show Comments'}
                </button>
              </div>

              {/* Add Comment Form */}
              {user && (
                <form onSubmit={handleComment} className="mb-6">
                  <div className="mb-4">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Write a comment..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Comment
                  </button>
                </form>
              )}

              {/* Comments List */}
              {showComments && (
                <div className="space-y-4">
                  {article.comments && article.comments.length > 0 ? (
                    article.comments.map((comment, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {comment.user?.firstName} {comment.user?.lastName}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetails;
