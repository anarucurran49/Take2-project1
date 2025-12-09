document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = Array.from(document.querySelectorAll('.main-tab-btn'));
  const tabContents = Array.from(document.querySelectorAll('.tab-content'));

  function activateTab(targetId) {
    tabButtons.forEach(btn => {
      const isActive = btn.dataset.tab === targetId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    tabContents.forEach(content => {
      const isActive = content.id === targetId;
      content.classList.toggle('active', isActive);
      content.style.display = isActive ? '' : 'none';
      content.setAttribute('aria-hidden', String(!isActive));
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateTab(btn.dataset.tab);
      }
      // optional arrow-key navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const idx = tabButtons.indexOf(btn);
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const next = (idx + dir + tabButtons.length) % tabButtons.length;
        tabButtons[next].focus();
        activateTab(tabButtons[next].dataset.tab);
      }
    });
  });

  // initialize first active tab (based on markup or first button)
  const initial = document.querySelector('.main-tab-btn.active')?.dataset.tab || tabButtons[0]?.dataset.tab;
  if (initial) activateTab(initial);

  // --- New: localStorage-backed items and rendering ---
  const STORAGE_KEY = 'wherearethenoodles.items';
  let items = loadItems();

  const addItemForm = document.getElementById('addItemForm');
  const inputName = document.getElementById('itemName');
  const inputQty = document.getElementById('item-quantity');
  const inputLocation = document.getElementById('item-location');
  const inputExp = document.getElementById('expiration-date');

  function loadItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to parse stored items', e);
      return [];
    }
  }

  function saveItems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function formatExpiry(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
  }

  function renderItems() {
    const locations = ['cupboard', 'fridge', 'freezer'];
    locations.forEach(loc => {
      const tab = document.getElementById(`tab-${loc}`);
      if (!tab) return;
      const section = tab.querySelector('section');
      const headingText = section.querySelector('h2')?.textContent || loc;
      // build list HTML
      const itemsForLoc = items.filter(i => i.location === loc);
      let listHtml = '';
      if (itemsForLoc.length === 0) {
        listHtml = '<p class="no-items">No items</p>';
      } else {
        listHtml = '<ul class="items-list">';
        itemsForLoc.forEach(it => {
          listHtml += `<li class="item" data-id="${it.id}">
            <strong class="item-name">${escapeHtml(it.name)}</strong>
            <span class="item-qty">x${it.quantity}</span>
            ${it.expirationDate ? `<span class="item-exp">exp: ${escapeHtml(formatExpiry(it.expirationDate))}</span>` : ''}
            <button class="edit-item" data-id="${it.id}" aria-label="Edit ${escapeHtml(it.name)}">Edit</button>
            <button class="delete-item" data-id="${it.id}" aria-label="Delete ${escapeHtml(it.name)}">Delete</button>
          </li>`;
        });
        listHtml += '</ul>';
      }
      section.innerHTML = `<h2>${escapeHtml(headingText)}</h2>${listHtml}`;
    });
  }

  function escapeHtml(str = '') {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = inputName.value.trim();
    const qty = Math.max(1, Number(inputQty.value) || 1);
    const location = inputLocation.value;
    const expirationDate = inputExp.value || null;

    if (!name) return;

    const newItem = {
      id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8),
      name,
      quantity: qty,
      location,
      expirationDate,
      createdAt: new Date().toISOString()
    };

    items.push(newItem);
    saveItems();
    renderItems();

    addItemForm.reset();
    inputQty.value = 1;
    // switch to the tab where the item was added
    const targetTab = `tab-${location}`;
    activateTab(targetTab);
    // focus the added item (short timeout to allow render)
    setTimeout(() => {
      const addedEl = document.querySelector(`#${targetTab} .item[data-id="${newItem.id}"]`);
      if (addedEl) addedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  });

  // Event delegation for delete buttons in tabs
  document.addEventListener('click', (e) => {
    const del = e.target.closest('.delete-item');
    if (!del) return;
    const id = del.dataset.id;
    if (!id) return;
    items = items.filter(i => i.id !== id);
    saveItems();
    renderItems();
  });

  // initial render
  renderItems();
});