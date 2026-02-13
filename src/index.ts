import { Application } from './app';

/**
 * Application entry point
 */
async function main() {
  try {
    const app = new Application();
    await app.start();
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

main();
