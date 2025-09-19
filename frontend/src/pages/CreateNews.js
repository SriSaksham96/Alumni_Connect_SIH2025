import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { HiNewspaper, HiX, HiPlus } from 'react-icons/hi';
import { newsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CreateNews = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      category: 'general',
      isPublic: true,
      isFeatured: false
    }
  });

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    if (!user) {
      toast.error('Please log in to create news articles');
      return;
    }

    setIsSubmitting(true);
    try {
      // For now, send JSON data without images
      // TODO: Implement proper image upload with FormData
      const articleData = {
        title: data.title,
        content: data.content,
        category: data.category,
        excerpt: data.excerpt
      };

      await newsAPI.createNews(articleData);
      toast.success('News article created successfully!');
      navigate('/news');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create news article');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Create News Article</h1>
            <p className="mt-1 text-sm text-gray-600">
              Share news and updates with the alumni community
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Article Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Article Title *
                </label>
                <input
                  {...register('title', { required: 'Article title is required' })}
                  type="text"
                  className={`input ${errors.title ? 'input-error' : ''}`}
                  placeholder="Enter article title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className={`input ${errors.category ? 'input-error' : ''}`}
                  >
                    <option value="general">General</option>
                    <option value="alumni">Alumni</option>
                    <option value="events">Events</option>
                    <option value="achievements">Achievements</option>
                    <option value="fundraising">Fundraising</option>
                    <option value="academic">Academic</option>
                    <option value="sports">Sports</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    {...register('tags')}
                    type="text"
                    className="input"
                    placeholder="alumni, success, career"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt
                </label>
                <textarea
                  {...register('excerpt')}
                  rows={3}
                  className="input"
                  placeholder="Brief summary of the article..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  A short description that will appear in article previews
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Article Content</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  {...register('content', { required: 'Article content is required' })}
                  rows={12}
                  className={`input ${errors.content ? 'input-error' : ''}`}
                  placeholder="Write your article content here..."
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  You can use basic HTML formatting for better presentation
                </p>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Article Images</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="input"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Upload images to accompany your article
                </p>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.preview}
                        alt={image.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Publishing Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Publishing Options</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    {...register('isPublic')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Make this article public
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    {...register('isFeatured')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Feature this article (admin only)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publish Date
                </label>
                <input
                  {...register('publishDate')}
                  type="datetime-local"
                  className="input"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Leave empty to publish immediately
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/news')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Article...' : 'Create Article'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateNews;
