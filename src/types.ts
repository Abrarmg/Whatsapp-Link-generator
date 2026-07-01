/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RecentLink {
  id: string;
  phoneNumber: string; // original input or nicely formatted
  sanitizedNumber: string; // clean version
  message: string;
  url: string;
  createdAt: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  placeholder: string;
  formatLength: number; // typical length without country code
}

export interface MessageTemplate {
  id: string;
  label: string;
  text: string;
  category: string;
}
