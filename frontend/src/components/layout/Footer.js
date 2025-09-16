import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HiMail, 
  HiPhone, 
  HiLocationMarker, 
  HiGlobeAlt,
  HiShare,
  HiHeart,
  HiLink,
  HiSparkles
} from 'react-icons/hi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { name: 'Alumni Directory', href: '/alumni' },
      { name: 'Events', href: '/events' },
      { name: 'News', href: '/news' },
      { name: 'Messages', href: '/messages' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
    resources: [
      { name: 'Career Services', href: '/career' },
      { name: 'Mentorship', href: '/mentorship' },
      { name: 'Donations', href: '/donations' },
      { name: 'Volunteer', href: '/volunteer' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', href: '#', icon: HiShare },
    { name: 'Twitter', href: '#', icon: HiHeart },
    { name: 'LinkedIn', href: '#', icon: HiLink },
    { name: 'Instagram', href: '#', icon: HiSparkles },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand and description */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AC</span>
              </div>
              <span className="ml-2 text-xl font-bold">Alumni Connect</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Connecting alumni worldwide, fostering lifelong relationships, and supporting 
              our community through networking, events, and shared experiences.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-300">
                <HiMail className="h-4 w-4 mr-2" />
                <span>alumni@university.edu</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <HiPhone className="h-4 w-4 mr-2" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <HiLocationMarker className="h-4 w-4 mr-2" />
                <span>123 University Ave, City, State 12345</span>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              © {currentYear} Alumni Connect. All rights reserved.
            </div>
            
            {/* Social links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={social.name}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
