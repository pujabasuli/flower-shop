'use client';

import Link from 'next/link';
import { Flower2, Instagram, Facebook, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { SHOP_NAME, SHOP_TAGLINE, CONTACT_INFO, SOCIAL_LINKS, NAV_LINKS } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-gradient-to-b from-rose-50/50 to-cream-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <Flower2 className="h-7 w-7 text-primary" />
              <span className="font-serif text-xl font-semibold">{SHOP_NAME}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{SHOP_TAGLINE}</p>
            <div className="mt-4 flex gap-3">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary">
                <Facebook className="h-5 w-5" />
              </a>
              <a href={`mailto:${CONTACT_INFO.email}`} className="text-muted-foreground transition-colors hover:text-primary">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-foreground">Explore</h3>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/orders" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-foreground">Account</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/account" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Order History
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-foreground">Visit Us</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {CONTACT_INFO.address}
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                {CONTACT_INFO.phone}
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                {CONTACT_INFO.email}
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {CONTACT_INFO.hours}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/40 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SHOP_NAME}. All rights reserved. Crafted with love.
          </p>
        </div>
      </div>
    </footer>
  );
}
