/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CountryConfig, MessageTemplate } from '../types';

// Default country prefix - easily configurable
export const DEFAULT_COUNTRY_CODE = '92'; // Pakistan

export const COUNTRIES: CountryConfig[] = [
  {
    code: '92',
    name: 'Pakistan',
    flag: '🇵🇰',
    placeholder: '300 1234567',
    formatLength: 10,
  },
  {
    code: '1',
    name: 'United States / Canada',
    flag: '🇺🇸',
    placeholder: '555-0199',
    formatLength: 10,
  },
  {
    code: '44',
    name: 'United Kingdom',
    flag: '🇬🇧',
    placeholder: '7911 123456',
    formatLength: 10,
  },
  {
    code: '971',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    placeholder: '50 123 4567',
    formatLength: 9,
  },
  {
    code: '966',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    placeholder: '50 123 4567',
    formatLength: 9,
  },
  {
    code: '91',
    name: 'India',
    flag: '🇮🇳',
    placeholder: '98765 43210',
    formatLength: 10,
  },
  {
    code: '61',
    name: 'Australia',
    flag: '🇦🇺',
    placeholder: '412 345 678',
    formatLength: 9,
  },
  {
    code: '49',
    name: 'Germany',
    flag: '🇩🇪',
    placeholder: '151 23456789',
    formatLength: 11,
  },
  {
    code: '60',
    name: 'Malaysia',
    flag: '🇲🇾',
    placeholder: '12-345 6789',
    formatLength: 9,
  },
  {
    code: '90',
    name: 'Turkey',
    flag: '🇹🇷',
    placeholder: '532 123 45 67',
    formatLength: 10,
  },
  {
    code: '55',
    name: 'Brazil',
    flag: '🇧🇷',
    placeholder: '11 91234-5678',
    formatLength: 11,
  },
];

export const TEMPLATES: MessageTemplate[] = [
  {
    id: 'general',
    label: 'General Inquiry',
    text: 'Hello! I came across your page and wanted to inquire about your services.',
    category: 'Sales',
  },
  {
    id: 'consultation',
    label: 'Book Consultation',
    text: 'Hi, I would like to schedule a 1-on-1 consultation session with your team.',
    category: 'Booking',
  },
  {
    id: 'discount',
    label: 'Claim Offer',
    text: 'Hey! I saw your promo and would love to claim my active discount code.',
    category: 'Marketing',
  },
  {
    id: 'support',
    label: 'Order Support',
    text: 'Hello, I need assistance with my order. My Order ID is: [Insert ID]',
    category: 'Support',
  },
  {
    id: 'pricing',
    label: 'Request Pricing',
    text: 'Hi there! Could you please share your latest pricing packages and catalog?',
    category: 'Sales',
  },
];
