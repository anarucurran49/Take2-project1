document.addEventListener('DOMContentLoaded', function () {
  var STORAGE_KEY = 'wherearethenoodles.items';

  function getItems() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function fmt(d) {
    if (!d) return '';
    var dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString();
  }

  function escapeHtml(s) {
    s = String(s || '');
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderItemView(li, item) {
    li.innerHTML =
      '<strong class="item-name">' + escapeHtml(item.name) + '</strong>' +
      '<span class="item-qty">x' + escapeHtml(String(item.quantity)) + '</span>' +
      (item.expirationDate ? '<span class="item-exp">exp: ' + escapeHtml(fmt(item.expirationDate)) + '</span>' : '') +
      '<button class="edit-item" data-id="' + escapeHtml(item.id) + '">Edit</button>' +
      '<button class="delete-item" data-id="' + escapeHtml(item.id) + '">Delete</button>';
  }

  function findItemById(items, id) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function findIndexById(items, id) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return i;
    }
    return -1;
  }

  document.addEventListener('click', function (e) {
    var editBtn = e.target.closest ? e.target.closest('.edit-item') : null;
    if (editBtn) {
      e.preventDefault();
      var li = editBtn.closest('.item');
      var id = editBtn.getAttribute('data-id');
      var items = getItems();
      var item = findItemById(items, id);
      if (!li || !item) return;

      // show inline edit form (keep dataset.id on li element)
      li.innerHTML =
        '<input class="edit-name" type="text" value="' + escapeHtml(item.name) + '" />' +
        '<input class="edit-qty" type="number" min="1" value="' + escapeHtml(String(item.quantity)) + '" style="width:4.5rem;margin-left:.5rem" />' +
        '<input class="edit-exp" type="date" value="' + (item.expirationDate ? escapeHtml(item.expirationDate) : '') + '" style="margin-left:.5rem" />' +
        '<button class="save-edit" data-id="' + escapeHtml(item.id) + '" style="margin-left:.5rem">Save</button>' +
        '<button class="cancel-edit" style="margin-left:.25rem">Cancel</button>';
      var nameInput = li.querySelector('.edit-name');
      if (nameInput) nameInput.focus();
      return;
    }

    var saveBtn = e.target.closest ? e.target.closest('.save-edit') : null;
    if (saveBtn) {
      e.preventDefault();
      var liSave = saveBtn.closest('.item');
      var idSave = saveBtn.getAttribute('data-id');
      if (!liSave) return;
      var newName = (liSave.querySelector('.edit-name') && liSave.querySelector('.edit-name').value.trim()) || '';
      var newQty = Math.max(1, Number(liSave.querySelector('.edit-qty') && liSave.querySelector('.edit-qty').value) || 1);
      var newExp = (liSave.querySelector('.edit-exp') && liSave.querySelector('.edit-exp').value) || null;
      if (!newName) return;

      var all = getItems();
      var idx = findIndexById(all, idSave);
      if (idx === -1) return;
      all[idx] = {
        id: all[idx].id,
        name: newName,
        quantity: newQty,
        expirationDate: newExp,
        createdAt: all[idx].createdAt || (new Date()).toISOString()
      };
      saveItems(all);
      renderItemView(liSave, all[idx]);
      return;
    }

    var cancelBtn = e.target.closest ? e.target.closest('.cancel-edit') : null;
    if (cancelBtn) {
      e.preventDefault();
      var liCancel = cancelBtn.closest('.item');
      var idCancel = liCancel && liCancel.getAttribute('data-id');
      if (!liCancel || !idCancel) return;
      var list = getItems();
      var itemCur = findItemById(list, idCancel);
      if (itemCur) renderItemView(liCancel, itemCur);
      return;
    }
  });
});