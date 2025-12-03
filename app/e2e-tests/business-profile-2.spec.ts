import { test, expect } from '@playwright/test';
import { CREDENTIALS, login } from './auth.setup';

test.describe('Business Profile Pages - Part 2', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CREDENTIALS.business.email, CREDENTIALS.business.password);
  });

  // 8. Risk Management - Assessment
  test('Risk Assessment page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/risk/assessment');
    await expect(page).toHaveURL(/.*risk\/assessment/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-risk-assessment.png' });
    console.log('✅ Risk Assessment page loaded successfully');
  });

  // 8b. Risk Management - Incidents
  test('Risk Incidents page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/risk/incidents');
    await expect(page).toHaveURL(/.*risk\/incidents/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-risk-incidents.png' });
    console.log('✅ Risk Incidents page loaded successfully');
  });

  // 8c. Risk Management - Insurance
  test('Insurance Policies page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/risk/insurance');
    await expect(page).toHaveURL(/.*risk\/insurance/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-risk-insurance.png' });
    console.log('✅ Insurance Policies page loaded successfully');
  });

  // 8d. Risk Management - Dashboard
  test('Risk Dashboard page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/risk/dashboard');
    await expect(page).toHaveURL(/.*risk\/dashboard/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-risk-dashboard.png' });
    console.log('✅ Risk Dashboard page loaded successfully');
  });

  // 9. Advanced Reports - Custom
  test('Custom Reports page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/reports/custom');
    await expect(page).toHaveURL(/.*reports\/custom/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-reports-custom.png' });
    console.log('✅ Custom Reports page loaded successfully');
  });

  // 9b. Advanced Reports - Executive
  test('Executive Dashboard page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/reports/executive');
    await expect(page).toHaveURL(/.*reports\/executive/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-reports-executive.png' });
    console.log('✅ Executive Dashboard page loaded successfully');
  });

  // 9c. Advanced Reports - Investor
  test('Investor Reports page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/reports/investor');
    await expect(page).toHaveURL(/.*reports\/investor/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-reports-investor.png' });
    console.log('✅ Investor Reports page loaded successfully');
  });

  // 9d. Advanced Reports - Compliance
  test('Compliance Reports page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/reports/compliance');
    await expect(page).toHaveURL(/.*reports\/compliance/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-reports-compliance.png' });
    console.log('✅ Compliance Reports page loaded successfully');
  });

  // 10. Expenses - Main
  test('Expenses page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/expenses');
    await expect(page).toHaveURL(/.*expenses/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-expenses.png' });
    console.log('✅ Expenses page loaded successfully');
  });

  // 10b. Expenses - Bills
  test('Bills to Pay page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/expenses/bills');
    await expect(page).toHaveURL(/.*expenses\/bills/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-expenses-bills.png' });
    console.log('✅ Bills to Pay page loaded successfully');
  });

  // 10c. Expenses - Receipts
  test('Receipts page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/expenses/receipts');
    await expect(page).toHaveURL(/.*expenses\/receipts/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-expenses-receipts.png' });
    console.log('✅ Receipts page loaded successfully');
  });

  // 10d. Recurring Charges
  test('Recurring Charges page loads correctly', async ({ page }) => {
    await page.goto('/recurring-charges');
    await expect(page).toHaveURL(/.*recurring-charges/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-recurring-charges.png' });
    console.log('✅ Recurring Charges page loaded successfully');
  });

  // 11. Accounting - Chart of Accounts
  test('Chart of Accounts page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/accounting/chart-of-accounts');
    await expect(page).toHaveURL(/.*accounting\/chart-of-accounts/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-accounting-coa.png' });
    console.log('✅ Chart of Accounts page loaded successfully');
  });

  // 11b. Accounting - Reconciliation
  test('Reconciliation page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/accounting/reconciliation');
    await expect(page).toHaveURL(/.*accounting\/reconciliation/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-accounting-reconciliation.png' });
    console.log('✅ Reconciliation page loaded successfully');
  });

  // 12. Settings
  test('Settings page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page).toHaveURL(/.*settings/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-settings.png' });
    console.log('✅ Settings page loaded successfully');
  });
});

