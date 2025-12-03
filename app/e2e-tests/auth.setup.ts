import { test as setup, expect } from '@playwright/test';

// Test credentials for Business profile (uses khouston account with data)
const BUSINESS_USER = {
  email: 'khouston@thebasketballfactorynj.com',
  password: 'hunterrr777'
};

// Test credentials for Personal profile (demo account)
const PERSONAL_USER = {
  email: 'john.doe@example.com',
  password: 'password123'
};

export const CREDENTIALS = {
  business: BUSINESS_USER,
  personal: PERSONAL_USER
};

// Helper to login
export async function login(page: any, email: string, password: string) {
  await page.goto('/auth/signin');
  await page.waitForLoadState('networkidle');
  
  // Fill in credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click sign in button
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
}

// Setup for authenticated state (can be used with test dependencies)
setup('authenticate', async ({ page }) => {
  await login(page, BUSINESS_USER.email, BUSINESS_USER.password);
  
  // Store state
  await page.context().storageState({ path: '.auth/user.json' });
});

