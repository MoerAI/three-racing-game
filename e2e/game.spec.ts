import { test, expect } from '@playwright/test';

test.describe('Racing Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for Three.js to initialize
    await page.waitForTimeout(1000);
  });

  test('page loads with canvas and debug object', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Canvas should exist
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // __DEBUG__ object should exist
    const hasDebug = await page.evaluate(() => typeof (window as any).__DEBUG__ !== 'undefined');
    expect(hasDebug).toBe(true);

    // Wait briefly to catch any late errors
    await page.waitForTimeout(500);
    expect(consoleErrors).toHaveLength(0);
  });

  test('start screen is visible on load', async ({ page }) => {
    const startScreen = page.locator('#start-screen');
    await expect(startScreen).toBeVisible();

    const startBtn = page.locator('#start-btn');
    await expect(startBtn).toBeVisible();
  });

  test('HUD elements exist', async ({ page }) => {
    // HUD should be in DOM even before game starts
    await expect(page.locator('#hud')).toBeAttached();
    await expect(page.locator('#speed')).toBeAttached();
    await expect(page.locator('#lap')).toBeAttached();
    await expect(page.locator('#timer')).toBeAttached();
  });

  test('minimap canvas exists', async ({ page }) => {
    const minimap = page.locator('canvas#minimap');
    await expect(minimap).toBeAttached();
  });

  test('FPS counter is running', async ({ page }) => {
    await page.waitForTimeout(500);
    const fps = await page.evaluate(() => (window as any).__DEBUG__.fps);
    expect(fps).toBeGreaterThan(0);
  });

  test('game starts after clicking start button', async ({ page }) => {
    // Click start
    await page.click('#start-btn');

    // Wait for countdown to finish (4 seconds: 3, 2, 1, GO)
    await page.waitForTimeout(4500);

    // Game should now be in playing state
    const gameState = await page.evaluate(() => (window as any).__DEBUG__.gameState);
    expect(gameState).toBe('playing');

    // Start screen should be hidden
    const startScreenVisible = await page.evaluate(() => {
      const el = document.getElementById('start-screen');
      return el ? el.style.display !== 'none' : false;
    });
    expect(startScreenVisible).toBe(false);
  });

  test('car moves when W key is pressed after game starts', async ({ page }) => {
    // Start the game
    await page.click('#start-btn');
    await page.waitForTimeout(4500); // wait for countdown

    // Get initial position
    const initialPos = await page.evaluate(() => (window as any).__DEBUG__.carPosition);

    // Press W for 2 seconds
    await page.keyboard.down('w');
    await page.waitForTimeout(2000);
    await page.keyboard.up('w');

    // Get new position
    const newPos = await page.evaluate(() => (window as any).__DEBUG__.carPosition);
    const speed = await page.evaluate(() => (window as any).__DEBUG__.carSpeed);

    // Car should have moved
    const moved =
      Math.abs(newPos.x - initialPos.x) > 0.1 || Math.abs(newPos.z - initialPos.z) > 0.1;
    expect(moved).toBe(true);
    expect(speed).toBeGreaterThan(0);
  });

  test('obstacle count is zero (obstacles removed)', async ({ page }) => {
    const obstacleCount = await page.evaluate(() => (window as any).__DEBUG__.obstacleCount);
    expect(obstacleCount).toBe(0);
  });

  test('debug panel appears with ?debug param', async ({ page }) => {
    await page.goto('/?debug');
    await page.waitForTimeout(1500);
    const guiPanel = page.locator('.lil-gui').first();
    await expect(guiPanel).toBeVisible();
  });
});
