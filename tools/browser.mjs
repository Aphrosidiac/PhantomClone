// Shared Playwright launcher for the capture/probe tools.
import { chromium } from 'playwright';
export async function launch() {
  return chromium.launch({
    headless: true,
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}), // e.g. PW_CHANNEL=chrome when Playwright's own browser is not installed
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
