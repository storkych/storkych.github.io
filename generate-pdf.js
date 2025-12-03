const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF(theme, outputFileName) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  const htmlPath = path.join(__dirname, 'index.html');
  const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;
  
  await page.goto(fileUrl, { 
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  await new Promise(resolve => setTimeout(resolve, 3000));

  await page.evaluate(async (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    
    const avatar = document.getElementById('avatar');
    if (avatar) {
      avatar.src = theme === 'light' ? 'itsme_inv.png' : 'itsme.png';
    }
    
    const githubLink = document.querySelector('.link[data-social-icon="github"]');
    if (githubLink) {
      const iconColor = theme === 'dark' 
        ? githubLink.getAttribute('data-color-dark') 
        : githubLink.getAttribute('data-color-light');
      
      try {
        const svgResponse = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/github.svg`);
        if (svgResponse.ok) {
          const svgText = await svgResponse.text();
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
          const svgElement = svgDoc.documentElement;
          const path = svgElement.querySelector('path');
          
          if (path) {
            const viewBox = svgElement.getAttribute('viewBox') || '0 0 24 24';
            const pathD = path.getAttribute('d');
            const iconColorHex = `#${iconColor}`;
            
            const iconSvg = `<svg width="20" height="20" viewBox="${viewBox}" fill="${iconColorHex}" xmlns="http://www.w3.org/2000/svg"><path d="${pathD}"/></svg>`;
            const iconSpan = githubLink.querySelector('.social-icon');
            if (iconSpan) {
              iconSpan.innerHTML = iconSvg;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load GitHub icon', e);
      }
    }
  }, theme);

  await new Promise(resolve => setTimeout(resolve, 1500));

  await page.addStyleTag({
    content: `
      .navbar {
        display: none !important;
      }
      body {
        padding-top: 0 !important;
      }
      .certificate-button {
        display: none !important;
      }
      .skill-category {
        display: inline !important;
        margin-right: 16px !important;
      }
      .skill-label {
        display: none !important;
      }
      .skill-tags {
        display: inline !important;
      }
      .skill-tags .tag {
        margin-right: 8px !important;
      }
    `
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      bottom: '10mm',
      left: '10mm',
      right: '10mm'
    }
  });

  await browser.close();

  const outputPath = path.join(__dirname, outputFileName);
  fs.writeFileSync(outputPath, pdf);
  
  console.log(`✅ PDF успешно создан: ${outputPath}`);
}

(async () => {
  console.log('🔄 Генерация PDF с темной темой...');
  await generatePDF('dark', 'Доленков_Игорь_резюме.pdf');
  
  console.log('🔄 Генерация PDF со светлой темой...');
  await generatePDF('light', 'Доленков_Игорь_резюме_светлая.pdf');
  
  console.log('✅ Все PDF файлы успешно созданы!');
})();

