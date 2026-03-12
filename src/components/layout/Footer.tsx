import Link from 'next/link';
import { Leaf, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Gaon<span className="text-primary-400">Gully</span></span>
            </Link>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Your trusted retail and wholesale marketplace. Quality products, competitive prices, and fast delivery across India.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Home', href: '/' },
                { label: 'All Products', href: '/products' },
                { label: 'Wholesale', href: '/wholesale' },
                { label: 'My Orders', href: '/orders' },
                { label: 'Wishlist', href: '/wishlist' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary-400 transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Customer Support</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Help Center', href: '/help' },
                { label: 'Track Your Order', href: '/orders' },
                { label: 'Returns & Refunds', href: '/returns' },
                { label: 'Shipping Policy', href: '/shipping' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary-400 transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <span>123, Market Street, Mumbai, Maharashtra - 400001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <a href="tel:+919999999999" className="hover:text-primary-400 transition-colors">+91 99999 99999</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <a href="mailto:support@gaongully.com" className="hover:text-primary-400 transition-colors">support@gaongully.com</a>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs">
              <p className="text-gray-400">Business Hours</p>
              <p className="text-white font-medium">Mon - Sat: 9 AM - 8 PM</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© 2024 Gaon Gully. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <img src="https://via.placeholder.com/40x25?text=Visa" alt="Visa" className="h-6 opacity-60" />
            <img src="https://via.placeholder.com/40x25?text=UPI" alt="UPI" className="h-6 opacity-60" />
            <img src="https://via.placeholder.com/50x25?text=Rzrpay" alt="Razorpay" className="h-6 opacity-60" />
          </div>
        </div>
      </div>
    </footer>
  );
}
