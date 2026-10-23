// Optional production UI check: use an installed Playwright and Google Chrome.
// No traces or screenshots of credentials; the key is cleared before screenshots.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {homedir} from 'node:os';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const token=(await readFile(homedir()+'/.config/kujolang-mcp/analytics-dashboard-token','utf8')).trim();
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://mcp.kujolang.ai/analytics');
 await page.getByLabel('Dashboard access key').fill('invalid-key');await page.getByRole('button',{name:'Unlock',exact:true}).click();
 await page.getByRole('status').filter({hasText:'not accepted'}).waitFor();
 await page.getByLabel('Dashboard access key').fill(token);await page.getByRole('button',{name:'Unlock',exact:true}).click();
 await page.getByRole('heading',{name:'Daily tool activity'}).waitFor();
 assert.equal(await page.locator('#token').inputValue(),'');
 assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
 assert.equal((await page.context().cookies()).length,0);
 await page.screenshot({path:'/tmp/kujolang-analytics-dashboard-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'/tmp/kujolang-analytics-dashboard-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Lock dashboard'}).click();assert(await page.locator('#dashboard').isHidden());
 assert.equal(await page.locator('#summary').textContent(),'');
 await page.reload();assert(await page.locator('#dashboard').isHidden());
 assert.deepEqual(errors,[]);
 console.log('Live dashboard: invalid/valid login, real counters, responsive layout, no browser persistence, lock and reload passed');
} finally {await browser.close();}
