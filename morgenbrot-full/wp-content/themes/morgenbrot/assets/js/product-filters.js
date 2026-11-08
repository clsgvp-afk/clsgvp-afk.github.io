(() => {
  'use strict';

  const form = document.querySelector('[data-product-filters]');
  const grid = document.querySelector('.card-grid.products');
  const count = document.querySelector('.result-count');
  if (!form || !grid) return;

  const flags = {
    vegan: new Set(['120', '119', '129', '121', '122', '123', '118']),
    vegetarian: new Set(['126', '125', '120', '124', '119', '129', '121', '128', '127']),
    seasonal: new Set(['126', '125', '120', '119', '118']),
    available: new Set(['126', '125', '120', '124', '119', '129', '121', '128', '127']),
  };

  const productId = (card) => card.className.match(/\bpost-(\d+)\b/)?.[1] || '';
  const title = (card) => card.querySelector('h3')?.textContent.trim() || '';
  const price = (card) => {
    const value = card.querySelector('.product-price strong')?.textContent || '0';
    return Number.parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const applyFilters = () => {
    const search = form.elements.produkt_suche.value.trim().toLocaleLowerCase('de');
    const category = form.elements.kategorie.value;
    const sort = form.elements.sort.value;
    const selectedFlags = Object.keys(flags).filter((name) => form.elements[name].checked);
    const cards = [...grid.querySelectorAll('.product-card')];

    cards.sort((a, b) => {
      if (sort === 'title_desc') return title(b).localeCompare(title(a), 'de');
      if (sort === 'price_asc') return price(a) - price(b);
      if (sort === 'price_desc') return price(b) - price(a);
      return title(a).localeCompare(title(b), 'de');
    });

    let visible = 0;
    cards.forEach((card) => {
      const id = productId(card);
      const matchesSearch = !search || card.textContent.toLocaleLowerCase('de').includes(search);
      const matchesCategory = !category || card.classList.contains(`bakery_product_category-${category}`);
      const matchesFlags = selectedFlags.every((name) => flags[name].has(id));
      const show = matchesSearch && matchesCategory && matchesFlags;
      card.hidden = !show;
      grid.append(card);
      if (show) visible += 1;
    });

    if (count) count.textContent = `${visible} ${visible === 1 ? 'Produkt' : 'Produkte'}`;
  };

  const loadAllProducts = async () => {
    try {
      const response = await fetch('/morgenbrot-full/sortiment/page/2/');
      if (!response.ok) throw new Error('Second product page could not be loaded.');
      const copy = new DOMParser().parseFromString(await response.text(), 'text/html');
      copy.querySelectorAll('.card-grid.products .product-card').forEach((card) => {
        if (!grid.querySelector(`.post-${productId(card)}`)) grid.append(card);
      });
      document.querySelector('.navigation.pagination')?.remove();
    } catch (error) {
      console.warn(error.message);
    }
    applyFilters();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilters();
  });
  form.querySelectorAll('select,input[type="checkbox"]').forEach((field) => field.addEventListener('change', applyFilters));
  form.elements.produkt_suche.addEventListener('input', applyFilters);
  form.querySelector('.reset-link')?.addEventListener('click', (event) => {
    event.preventDefault();
    form.reset();
    applyFilters();
  });

  loadAllProducts();
})();
