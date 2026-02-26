const API_BASE = '';
let allCategories = [], allLocations = [], allItems = [];
let currentCat1 = '全部', currentCat2 = '', filterLoc = '';

const zhSort = (list, key) => [...list].sort((a, b) => (a[key] || '').localeCompare((b[key] || ''), 'zh'));

window.onload = refreshAll;

async function refreshAll() {
    try {
        const [c, i, l] = await Promise.all([
            fetch(`${API_BASE}/api/categories`).then(r => r.json()),
            fetch(`${API_BASE}/api/items`).then(r => r.json()),
            fetch(`${API_BASE}/api/locations`).then(r => r.json())
        ]);
        allCategories = c; allItems = i; allLocations = l;
        renderSideNav(); renderSubNav(); initDropdowns(); renderGrid();
    } catch (e) { console.error("数据加载失败", e); }
}

function renderGrid() {
    const grid = document.getElementById('itemGrid');
    let list = allItems;
    if (currentCat1 !== '全部') {
        list = list.filter(i => i.cat1 === currentCat1);
        if (currentCat2) list = list.filter(i => i.cat2 === currentCat2);
    }
    if (filterLoc) list = list.filter(i => i.locations.includes(filterLoc));
    
    list = zhSort(list, 'name');

    grid.innerHTML = list.map(item => {
        const meta = [item.spec, item.quantity ? `${item.quantity}件` : '', item.locations.join(','), item.notes]
            .filter(v => v && v.trim() !== '').join(' · ');

        return `
            <div class="card">
                <div class="card-opt">
                    <span onclick="editItem('${item._id}')">编辑</span>
                    <span onclick="deleteItem('${item._id}')" style="color:#ff3b30">删除</span>
                </div>
                <img src="${item.imageUrl || ''}" onerror="this.src='https://via.placeholder.com/300?text=未上传图片'">
                <div class="card-body">
                    <div class="card-title">${item.name}</div>
                    <div class="card-meta">${meta || '点击编辑补充参数'}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderSideNav() {
    const nav = document.getElementById('sideNav');
    const c1s = zhSort(allCategories.filter(c => c.level === 1), 'name');
    let html = `<div class="nav-item ${currentCat1 === '全部' ? 'active' : ''}" onclick="setCat1('全部')">全部</div>`;
    c1s.forEach(c => {
        html += `<div class="nav-item ${currentCat1 === c.name ? 'active' : ''}" onclick="setCat1('${c.name}')">${c.name}</div>`;
    });
    nav.innerHTML = html;
}

function renderSubNav() {
    const nav = document.getElementById('subNav');
    if (currentCat1 === '全部') {
        const locs = zhSort(allLocations, 'name');
        nav.innerHTML = `<span class="tag ${filterLoc === '' ? 'active' : ''}" onclick="setLocFilter('')">全部位置</span>` +
            locs.map(l => `<span class="tag ${filterLoc === l.name ? 'active' : ''}" onclick="setLocFilter('${l.name}')">${l.name}</span>`).join('');
    } else {
        const parent = allCategories.find(c => c.name === currentCat1);
        const subs = zhSort(allCategories.filter(c => c.parentId === parent?._id), 'name');
        nav.innerHTML = `<span class="tag ${currentCat2 === '' ? 'active' : ''}" onclick="setCat2('')">全部子类</span>` +
            subs.map(c => `<span class="tag ${currentCat2 === c.name ? 'active' : ''}" onclick="setCat2('${c.name}')">${c.name}</span>`).join('');
    }
}

function initDropdowns() {
    const c1s = zhSort(allCategories.filter(c => c.level === 1), 'name');
    document.getElementById('sel1').innerHTML = '<option value="">主分类</option>' + 
        c1s.map(c => `<option value="${c.name}" data-id="${c._id}">${c.name}</option>`).join('');
    
    document.getElementById('sel1').onchange = (e) => {
        const pid = e.target.options[e.target.selectedIndex].dataset.id;
        const c2s = zhSort(allCategories.filter(c => c.parentId === pid), 'name');
        document.getElementById('sel2').innerHTML = '<option value="">子分类</option>' + c2s.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    };

    const locs = zhSort(allLocations, 'name');
    document.getElementById('locationCheckList').innerHTML = locs.map(l => `
        <label class="cb-item"><input type="checkbox" name="loc-cb" value="${l.name}"><span>${l.name}</span></label>
    `).join('');
}

function setCat1(n) { currentCat1 = n; currentCat2 = ''; filterLoc = ''; renderSideNav(); renderSubNav(); renderGrid(); }
function setCat2(n) { currentCat2 = n; renderSubNav(); renderGrid(); }
function setLocFilter(l) { filterLoc = l; renderSubNav(); renderGrid(); }
function toggleModal(id, show) { document.getElementById(id).style.display = show ? 'flex' : 'none'; }

document.getElementById('itemForm').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('editItemId').value;
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.locations = Array.from(document.querySelectorAll('input[name="loc-cb"]:checked')).map(cb => cb.value);
    
    await fetch(id ? `${API_BASE}/api/items/${id}` : `${API_BASE}/api/items`, {
        method: id ? 'PUT' : 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    toggleModal('itemModal', false);
    refreshAll();
};

async function editItem(id) {
    const item = allItems.find(i => i._id === id);
    document.getElementById('editItemId').value = item._id;
    document.getElementById('formName').value = item.name;
    document.getElementById('formImg').value = item.imageUrl;
    document.getElementById('formSpec').value = item.spec;
    document.getElementById('formQty').value = item.quantity;
    document.getElementById('formNotes').value = item.notes;
    document.getElementById('sel1').value = item.cat1;
    document.getElementById('sel1').dispatchEvent(new Event('change'));
    setTimeout(() => { document.getElementById('sel2').value = item.cat2; }, 10);
    document.querySelectorAll('input[name="loc-cb"]').forEach(cb => cb.checked = item.locations.includes(cb.value));
    toggleModal('itemModal', true);
}

function switchTab(t) {
    document.getElementById('catPanel').style.display = t === 'cat' ? 'block' : 'none';
    document.getElementById('locPanel').style.display = t === 'loc' ? 'block' : 'none';
    document.getElementById('tabCat').className = t === 'cat' ? 'active' : '';
    document.getElementById('tabLoc').className = t === 'loc' ? 'active' : '';
    t === 'cat' ? renderCatList() : renderLocList();
}

function renderCatList() {
    let html = '';
    const c1s = zhSort(allCategories.filter(c => c.level === 1), 'name');
    c1s.forEach(c1 => {
        html += `<div class="mgr-item primary"><span>${c1.name}</span> <span onclick="deleteCat('${c1._id}')" style="color:red;cursor:pointer">删除</span></div>`;
        const c2s = zhSort(allCategories.filter(c => c.parentId === c1._id), 'name');
        c2s.forEach(c2 => {
            html += `<div class="mgr-item secondary"><span>└ ${c2.name}</span> <span onclick="deleteCat('${c2._id}')" style="color:red;cursor:pointer">删除</span></div>`;
        });
    });
    document.getElementById('catList').innerHTML = html;
}

function renderLocList() {
    const locs = zhSort(allLocations, 'name');
    document.getElementById('locList').innerHTML = locs.map(l => `<div class="mgr-item"><span>${l.name}</span> <span onclick="deleteLoc('${l._id}')" style="color:red;cursor:pointer">删除</span></div>`).join('');
}

async function handleAddCategory() {
    const name = document.getElementById('newCatName').value;
    const level = parseInt(document.getElementById('newCatLevel').value);
    const parentId = document.getElementById('parentSelect').value;
    if(!name) return;
    await fetch(`${API_BASE}/api/categories`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name, level, parentId:level===2?parentId:null}) });
    document.getElementById('newCatName').value = '';
    refreshAll().then(renderCatList);
}

async function handleAddLocation() {
    const name = document.getElementById('newLocName').value;
    if(!name) return;
    await fetch(`${API_BASE}/api/locations`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name}) });
    document.getElementById('newLocName').value = '';
    refreshAll().then(renderLocList);
}

function updateParentOptions() {
    const isL2 = document.getElementById('newCatLevel').value === "2";
    const ps = document.getElementById('parentSelect');
    ps.style.display = isL2 ? "block" : "none";
    ps.innerHTML = allCategories.filter(c => c.level === 1).map(c => `<option value="${c._id}">${c.name}</option>`).join('');
}

function openItemModal() { document.getElementById('itemForm').reset(); document.getElementById('editItemId').value = ''; document.querySelectorAll('input[name="loc-cb"]').forEach(c=>c.checked=false); toggleModal('itemModal', true); }
function openAdminModal() { toggleModal('adminModal', true); switchTab('cat'); updateParentOptions(); }
async function deleteCat(id) { if(confirm('确认删除分类？')) { await fetch(`${API_BASE}/api/categories/${id}`, {method:'DELETE'}); refreshAll().then(renderCatList); } }
async function deleteLoc(id) { if(confirm('确认删除位置？')) { await fetch(`${API_BASE}/api/locations/${id}`, {method:'DELETE'}); refreshAll().then(renderLocList); } }
async function deleteItem(id) { if(confirm('确认从清单中移除？')) { await fetch(`${API_BASE}/api/items/${id}`, {method:'DELETE'}); refreshAll(); } }