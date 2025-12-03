import { test, expect } from '@playwright/test';
import { CREDENTIALS, login } from './auth.setup';

test.describe('Business Profile Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, CREDENTIALS.business.email, CREDENTIALS.business.password);
  });

  // 1. Dashboard
  test('Dashboard loads correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Check for key dashboard elements
    await expect(page.locator('body')).toBeVisible();
    
    // Check no error messages
    const errorTexts = await page.locator('text=/error|Error|failed|Failed/i').count();
    
    // Take screenshot for documentation
    await page.screenshot({ path: 'test-results/business-dashboard.png' });
    
    console.log('✅ Business Dashboard loaded successfully');
  });

  // 2. Transactions
  test('Transactions page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await expect(page).toHaveURL(/.*transactions/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-transactions.png' });
    console.log('✅ Transactions page loaded successfully');
  });

  // 3. Financial Statements (Bank Statements)
  test('Financial Statements page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/bank-statements');
    await expect(page).toHaveURL(/.*bank-statements/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-statements.png' });
    console.log('✅ Financial Statements page loaded successfully');
  });

  // 4. Business Finance - Budget
  test('Budget Planner page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/budget');
    await expect(page).toHaveURL(/.*budget/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-budget.png' });
    console.log('✅ Budget Planner page loaded successfully');
  });

  // 4b. Business Finance - Goals
  test('Financial Goals page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/goals');
    await expect(page).toHaveURL(/.*goals/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-goals.png' });
    console.log('✅ Financial Goals page loaded successfully');
  });

  // 4c. Business Finance - Debts
  test('Debt Management page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/debts');
    await expect(page).toHaveURL(/.*debts/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-debts.png' });
    console.log('✅ Debt Management page loaded successfully');
  });

  // 5. Investment Management - Portfolio
  test('Investment Portfolio page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/investments/portfolio');
    await expect(page).toHaveURL(/.*investments\/portfolio/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-investments-portfolio.png' });
    console.log('✅ Investment Portfolio page loaded successfully');
  });

  // 5b. Investment Management - Allocation
  test('Asset Allocation page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/investments/allocation');
    await expect(page).toHaveURL(/.*investments\/allocation/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-investments-allocation.png' });
    console.log('✅ Asset Allocation page loaded successfully');
  });

  // 6. Burn Rate
  test('Burn Rate page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/burn-rate');
    await expect(page).toHaveURL(/.*burn-rate/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-burn-rate.png' });
    console.log('✅ Burn Rate page loaded successfully');
  });

  // 7. Treasury & Cash - Positions
  test('Cash Positions page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/treasury/positions');
    await expect(page).toHaveURL(/.*treasury\/positions/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-treasury-positions.png' });
    console.log('✅ Cash Positions page loaded successfully');
  });

  // 7b. Treasury & Cash - Cash Flow
  test('Cash Flow Management page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/treasury/cash-flow');
    await expect(page).toHaveURL(/.*treasury\/cash-flow/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-treasury-cashflow.png' });
    console.log('✅ Cash Flow Management page loaded successfully');
  });

  // 7c. Treasury & Cash - Forecasting
  test('Cash Forecasting page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/treasury/forecasting');
    await expect(page).toHaveURL(/.*treasury\/forecasting/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/business-treasury-forecasting.png' });
    console.log('✅ Cash Forecasting page loaded successfully');
  });
});

