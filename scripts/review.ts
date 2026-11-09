import puppeteer from 'puppeteer';

async function runReview() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    const title = await page.title();
    console.log('Page Title:', title);

    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (emailInput && passwordInput) {
      console.log('Found login inputs. Entering credentials...');
      await emailInput.type('admin@deepa.local');
      await passwordInput.type('ChangeMe-Immediately-1');
      
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await new Promise(r => setTimeout(r, 2000));
        console.log('Current URL after login:', page.url());
      }
    } else {
      console.log('Login inputs not found, taking screenshot or dump...');
    }
  } catch (err) {
    console.error('Headless review error:', err);
  } finally {
    await browser.close();
  }
}

runReview();
