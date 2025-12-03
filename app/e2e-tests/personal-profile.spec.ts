import { test, expect } from '@playwright/test';
import { CREDENTIALS, login } from './auth.setup';

test.describe('Personal/Household Profile Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Login with business account (which has both Personal and Business profiles)
    await login(page, CREDENTIALS.business.email, CREDENTIALS.business.password);
    
    // Switch to Personal profile if needed
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  // 1. Dashboard
  test('Personal Dashboard loads correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-dashboard.png' });
    console.log('✅ Personal Dashboard loaded successfully');
  });

  // 2. Net Worth Tracker
  test('Net Worth Tracker page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/net-worth');
    await expect(page).toHaveURL(/.*personal\/net-worth/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-net-worth.png' });
    console.log('✅ Net Worth Tracker page loaded successfully');
  });

  // 3. Transactions
  test('Personal Transactions page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await expect(page).toHaveURL(/.*transactions/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-transactions.png' });
    console.log('✅ Transactions page loaded successfully');
  });

  // 4. Budget & Goals - Budget Planner
  test('Budget Planner page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/budget');
    await expect(page).toHaveURL(/.*budget/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-budget.png' });
    console.log('✅ Budget Planner page loaded successfully');
  });

  // 4b. Budget & Goals - Financial Goals
  test('Financial Goals page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/goals');
    await expect(page).toHaveURL(/.*goals/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-goals.png' });
    console.log('✅ Financial Goals page loaded successfully');
  });

  // 4c. Budget & Goals - Emergency Fund
  test('Emergency Fund page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/emergency-fund');
    await expect(page).toHaveURL(/.*personal\/emergency-fund/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-emergency-fund.png' });
    console.log('✅ Emergency Fund page loaded successfully');
  });

  // 5. Income & Expenses - Categories
  test('Categories page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/categories');
    await expect(page).toHaveURL(/.*categories/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-categories.png' });
    console.log('✅ Categories page loaded successfully');
  });

  // 5b. Income & Expenses - Subscriptions
  test('Subscriptions page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/subscriptions');
    await expect(page).toHaveURL(/.*personal\/subscriptions/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-subscriptions.png' });
    console.log('✅ Subscriptions page loaded successfully');
  });

  // 5c. Income & Expenses - Bills Calendar
  test('Bills Calendar page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/bills-calendar');
    await expect(page).toHaveURL(/.*personal\/bills-calendar/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-bills-calendar.png' });
    console.log('✅ Bills Calendar page loaded successfully');
  });

  // 6. Debt & Credit - Debt Management
  test('Debt Management page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/debts');
    await expect(page).toHaveURL(/.*debts/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-debts.png' });
    console.log('✅ Debt Management page loaded successfully');
  });

  // 6b. Debt & Credit - Credit Score
  test('Credit Score page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/credit-score');
    await expect(page).toHaveURL(/.*personal\/credit-score/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-credit-score.png' });
    console.log('✅ Credit Score page loaded successfully');
  });

  // 7. Investments & Retirement - Portfolio
  test('Investment Portfolio page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/investments/portfolio');
    await expect(page).toHaveURL(/.*investments\/portfolio/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-investments-portfolio.png' });
    console.log('✅ Investment Portfolio page loaded successfully');
  });

  // 7b. Investments & Retirement - Retirement Planning
  test('Retirement Planning page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/personal/retirement');
    await expect(page).toHaveURL(/.*personal\/retirement/);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/personal-retirement.png' });
    console.log('✅ Retirement Planning page loaded successfully');
  });
});

