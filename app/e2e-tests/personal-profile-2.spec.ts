import { test, expect } from '@playwright/test';
import { CREDENTIALS, login } from './auth.setup';

test.describe('Personal/Household Profile Pages - Part 2', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CREDENTIALS.business.email, CREDENTIALS.business.password);
  });

  // 8. Cash Flow & Reports - Cash Flow Forecast
  test('Cash Flow Forecast page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/cash-flow');
    await expect(page).toHaveURL(/.*personal\/cash-flow/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-cash-flow.png' });
    console.log('✅ Cash Flow Forecast page loaded successfully');
  });

  // 8b. Cash Flow & Reports - Financial Reports
  test('Financial Reports page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/reports');
    await expect(page).toHaveURL(/.*personal\/reports/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-reports.png' });
    console.log('✅ Financial Reports page loaded successfully');
  });

  // 9. Tax Management - Tax Documents
  test('Tax Documents page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/tax-documents');
    await expect(page).toHaveURL(/.*personal\/tax-documents/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-tax-documents.png' });
    console.log('✅ Tax Documents page loaded successfully');
  });

  // 9b. Tax Management - Tax Planning
  test('Tax Planning page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/tax-planning');
    await expect(page).toHaveURL(/.*personal\/tax-planning/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-tax-planning.png' });
    console.log('✅ Tax Planning page loaded successfully');
  });

  // 9c. Tax Management - Tax Breaks
  test('Tax Breaks page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/tax-breaks');
    await expect(page).toHaveURL(/.*personal\/tax-breaks/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-tax-breaks.png' });
    console.log('✅ Tax Breaks page loaded successfully');
  });

  // 9d. Tax Management - Charitable Giving
  test('Charitable Giving page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/charitable-giving');
    await expect(page).toHaveURL(/.*personal\/charitable-giving/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-charitable-giving.png' });
    console.log('✅ Charitable Giving page loaded successfully');
  });

  // 10. Insurance & Health - Insurance Policies
  test('Insurance Policies page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/insurance');
    await expect(page).toHaveURL(/.*personal\/insurance/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-insurance.png' });
    console.log('✅ Insurance Policies page loaded successfully');
  });

  // 10b. Insurance & Health - Healthcare Expenses
  test('Healthcare Expenses page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/healthcare');
    await expect(page).toHaveURL(/.*personal\/healthcare/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-healthcare.png' });
    console.log('✅ Healthcare Expenses page loaded successfully');
  });

  // 11. Family & Education - Household Members
  test('Household Members page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/household');
    await expect(page).toHaveURL(/.*personal\/household/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-household.png' });
    console.log('✅ Household Members page loaded successfully');
  });

  // 11b. Family & Education - Education Savings
  test('Education Savings page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/education-savings');
    await expect(page).toHaveURL(/.*personal\/education-savings/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-education-savings.png' });
    console.log('✅ Education Savings page loaded successfully');
  });

  // 12. Assets & Property - Home Inventory
  test('Home Inventory page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/home-inventory');
    await expect(page).toHaveURL(/.*personal\/home-inventory/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-home-inventory.png' });
    console.log('✅ Home Inventory page loaded successfully');
  });

  // 12b. Assets & Property - Vehicles
  test('Vehicles page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/vehicles');
    await expect(page).toHaveURL(/.*personal\/vehicles/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-vehicles.png' });
    console.log('✅ Vehicles page loaded successfully');
  });

  // 12c. Assets & Property - Vehicle Expenses
  test('Vehicle Expenses page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/vehicle-expenses');
    await expect(page).toHaveURL(/.*personal\/vehicle-expenses/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-vehicle-expenses.png' });
    console.log('✅ Vehicle Expenses page loaded successfully');
  });

  // 13. Shopping & Receipts - Wish Lists
  test('Wish Lists page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/wish-lists');
    await expect(page).toHaveURL(/.*personal\/wish-lists/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-wish-lists.png' });
    console.log('✅ Wish Lists page loaded successfully');
  });

  // 13b. Shopping & Receipts - Receipt Manager
  test('Receipt Manager page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/expenses/receipts');
    await expect(page).toHaveURL(/.*expenses\/receipts/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-receipts.png' });
    console.log('✅ Receipt Manager page loaded successfully');
  });

  // 14. Settings
  test('Settings page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page).toHaveURL(/.*settings/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-settings.png' });
    console.log('✅ Settings page loaded successfully');
  });
});

