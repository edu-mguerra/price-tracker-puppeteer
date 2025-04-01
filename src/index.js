const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

async function getSortedProducts(productName) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://lista.mercadolivre.com.br/${productName}`, { waitUntil: 'load' });

  try {
    await page.waitForSelector('.poly-card__portada');
  } catch (error) {
    console.error("Erro ao esperar o seletor:", error);
    await browser.close();
    return [];
  }

  const products = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.poly-card'));
    return items.map(item => {
      const title = item.querySelector('.poly-component__title-wrapper a') ? item.querySelector('.poly-component__title-wrapper a').textContent.trim() : 'Título não encontrado';
      const priceElement = item.querySelector('.andes-money-amount__fraction');
      const centsElement = item.querySelector('.andes-money-amount__cents');
     
     
      
    
          
      
      const link = item.querySelector('.poly-component__title-wrapper a') ? item.querySelector('.poly-component__title-wrapper a').href : 'Link não encontrado';
      const ratingElement = item.querySelector('.poly-reviews__rating');

      let price = priceElement ? priceElement.textContent.replace('.', '').trim() : null;
      let cents = centsElement ? centsElement.textContent.trim() : '00';
      let finalPrice = price ? parseFloat(`${price}.${cents}`) : null;

      return {
        title,
        price: finalPrice,
        image,
        link,
        rating: ratingElement ? parseFloat(ratingElement.textContent) : 0 
      };
    });
  });

  // Filtragem em sequência:
  products.sort((a, b) => {
    // Primeiro, ordena pelo preço (menor preço primeiro)
    if ((a.price || Infinity) !== (b.price || Infinity)) {
      return (a.price || Infinity) - (b.price || Infinity);
    }
    
    // Se o preço for igual, ordena pela relevância (maior relevância primeiro)
    if (a.relevanceScore !== b.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    
    // Se o preço e a relevância forem iguais, ordena pela avaliação (maior avaliação primeiro)
    return b.rating - a.rating;
  });
  

  await browser.close();
  return products;
}

app.get('/products', async (req, res) => {
  const productName = req.query.productName 
  const products = await getSortedProducts(productName);
  res.json(products); 
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
