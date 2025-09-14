import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  HiUsers, 
  HiCalendar, 
  HiNewspaper, 
  HiCurrencyDollar,
  HiArrowRight,
  HiStar,
  HiChat,
  HiHeart
} from 'react-icons/hi';
import { eventsAPI, newsAPI, donationsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Home = () => {
  // Fetch featured data
  const { data: featuredEvents, isLoading: eventsLoading } = useQuery(
    'featuredEvents',
    () => eventsAPI.getEvents({ limit: 3, featured: true }),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: featuredNews, isLoading: newsLoading } = useQuery(
    'featuredNews',
    () => newsAPI.getFeaturedNews({ limit: 3 }),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: donationStats, isLoading: statsLoading } = useQuery(
    'donationStats',
    () => donationsAPI.getDonationStats(),
    { staleTime: 10 * 60 * 1000 }
  );

  const features = [
    {
      icon: HiUsers,
      title: 'Alumni Directory',
      description: 'Connect with fellow alumni from your graduation year, major, or location.',
      href: '/alumni',
      color: 'bg-blue-500',
    },
    {
      icon: HiCalendar,
      title: 'Events & Reunions',
      description: 'Stay updated on upcoming events, reunions, and networking opportunities.',
      href: '/events',
      color: 'bg-green-500',
    },
    {
      icon: HiNewspaper,
      title: 'News & Updates',
      description: 'Read the latest news about your university and fellow alumni achievements.',
      href: '/news',
      color: 'bg-purple-500',
    },
    {
      icon: HiChat,
      title: 'Messaging',
      description: 'Connect directly with other alumni through our secure messaging system.',
      href: '/messages',
      color: 'bg-pink-500',
    },
    {
      icon: HiCurrencyDollar,
      title: 'Donations',
      description: 'Support your university and fellow students through our donation platform.',
      href: '/donations',
      color: 'bg-yellow-500',
    },
    {
      icon: HiHeart,
      title: 'Community',
      description: 'Join a vibrant community of alumni supporting each other\'s success.',
      href: '/register',
      color: 'bg-red-500',
    },
  ];

  const stats = [
    { label: 'Active Alumni', value: '10,000+', icon: HiUsers },
    { label: 'Events This Year', value: '150+', icon: HiCalendar },
    { label: 'News Articles', value: '500+', icon: HiNewspaper },
    { label: 'Total Donations', value: donationStats?.data?.stats?.totalAmount ? `$${donationStats.data.stats.totalAmount.toLocaleString()}` : '$50,000+', icon: HiCurrencyDollar },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to{' '}
              <span className="text-yellow-300">Alumni Connect</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Reconnect with your university community, discover new opportunities, 
              and make lasting connections with fellow alumni worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              >
                Join Our Community
                <HiArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/alumni"
                className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold"
              >
                Explore Alumni
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-lg mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Stay Connected
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools you need to maintain and grow 
              your alumni network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={index}
                  to={feature.href}
                  className="group card card-hover"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${feature.color} text-white rounded-lg mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                    Learn more
                    <HiArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Upcoming Events
              </h2>
              <p className="text-gray-600">
                Don't miss out on these exciting upcoming events
              </p>
            </div>
            <Link
              to="/events"
              className="btn btn-outline"
            >
              View All Events
              <HiArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {eventsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents?.data?.events?.map((event) => (
                <div key={event._id} className="card card-hover">
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    {event.images?.[0] ? (
                      <img
                        src={event.images[0].url}
                        alt={event.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <HiCalendar className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <HiCalendar className="h-4 w-4 mr-2" />
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <Link
                    to={`/events/${event._id}`}
                    className="text-primary-600 font-medium hover:text-primary-700"
                  >
                    Learn More →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured News Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Latest News
              </h2>
              <p className="text-gray-600">
                Stay updated with the latest from our community
              </p>
            </div>
            <Link
              to="/news"
              className="btn btn-outline"
            >
              View All News
              <HiArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {newsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredNews?.data?.featuredNews?.map((article) => (
                <div key={article._id} className="card card-hover">
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    {article.featuredImage?.url ? (
                      <img
                        src={article.featuredImage.url}
                        alt={article.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <HiNewspaper className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <span className="badge badge-primary mr-2">{article.category}</span>
                    <span>{new Date(article.publishDate).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {article.excerpt || article.content}
                  </p>
                  <Link
                    to={`/news/${article._id}`}
                    className="text-primary-600 font-medium hover:text-primary-700"
                  >
                    Read More →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Reconnect?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of alumni who are already building meaningful connections 
            and advancing their careers through our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              Get Started Today
            </Link>
            <Link
              to="/login"
              className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
