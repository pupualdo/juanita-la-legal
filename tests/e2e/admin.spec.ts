import { test, expect } from '@playwright/test';

/**
 * Admin dashboard E2E tests.
 */

test.describe('Admin feedback dashboard', () => {
  test('rejects access without secret', async ({ page }) => {
    await page.goto('/admin/feedback');
    // Should show an error message about needing a secret
    await expect(
      page.locator('text=secret').or(page.locator('text=ADMIN_SECRET')).or(
        page.locator('text=Accede con')
      ).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('admin API returns 401 with wrong secret', async ({ page }) => {
    const res = await page.request.get('/api/admin/feedback?secret=wrong-secret-123');
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('admin API returns 401 with no secret', async ({ page }) => {
    const res = await page.request.get('/api/admin/feedback');
    expect(res.status()).toBe(401);
  });

  test('dashboard page loads with mocked API', async ({ page }) => {
    const mockData = {
      stats: { totalSessions: 5, activeSessions: 1, ratedSessions: 3, avgRating: '4.20', thumbsUp: 8, thumbsDown: 2 },
      sessions: [
        {
          session_id: 'abc123', paid_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3_600_000).toISOString(),
          tema: 'laboral', rating: 4, feedback: 'Muy útil',
        },
      ],
      activeSessions: [
        {
          session_id: 'abc123', paid_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3_600_000).toISOString(),
          tema: 'laboral',
        },
      ],
      messageFeedback: [],
    };

    await page.route('**/api/admin/feedback**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData),
      });
    });

    await page.goto('/admin/feedback?secret=test-secret');

    // Stats should render
    await expect(page.locator('text=5').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=4.20 ★')).toBeVisible();

    // Tabs should be present
    await expect(page.locator('button', { hasText: /Sesiones/i })).toBeVisible();
    await expect(page.locator('button', { hasText: /Activas/i })).toBeVisible();
    await expect(page.locator('button', { hasText: /Evaluaciones/i })).toBeVisible();
  });

  test('active sessions tab shows countdown timer', async ({ page }) => {
    const futureExpiry = new Date(Date.now() + 2 * 3_600_000).toISOString(); // 2h from now

    const mockData = {
      stats: { totalSessions: 1, activeSessions: 1, ratedSessions: 0, avgRating: null, thumbsUp: 0, thumbsDown: 0 },
      sessions: [],
      activeSessions: [
        {
          session_id: 'live-session-xyz',
          paid_at: new Date().toISOString(),
          expires_at: futureExpiry,
          tema: 'arriendo',
        },
      ],
      messageFeedback: [],
    };

    await page.route('**/api/admin/feedback**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData),
      });
    });

    await page.goto('/admin/feedback?secret=test-secret');

    // Click the "Activas ahora" tab
    await page.locator('button', { hasText: /Activas/i }).click();

    // Should show the session's tema
    await expect(page.locator('text=arriendo')).toBeVisible({ timeout: 5_000 });

    // Countdown should be visible and tick (format: "Nh Nm Ns")
    await expect(page.locator('text=/\\d+h \\d+m \\d+s/')).toBeVisible({ timeout: 3_000 });
  });
});
