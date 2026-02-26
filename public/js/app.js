let allCategories = [], allLocations = [], allItems = [], isManageMode = false;
let currentCat1 = '全部', currentCat2 = '', filterLoc = '';

window.onload = refreshAll;

async function refreshAll() {
    const [c, i, l] = await Promise.all([
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/items').then(r => r.json()),
        fetch('/api/locations').then(r => r.json())
    ]);
    allCategories = c; allItems = i; allLocations = l;
    renderSideNav(); renderSubNav(); initDropdowns(); renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('itemGrid');
    let list = allItems;
    if (currentCat1 !== '全部') {
        list = list.filter(i => i.cat1 === currentCat1);
        if (currentCat2) list = list.filter(i => i.cat2 === currentCat2);
    }
    if (filterLoc) list = list.filter(i => i.locations && i.locations[0] === filterLoc);
    
    grid.innerHTML = list.map(item => {
        const line2Info = [item.brand, item.spec, item.quantity].filter(v => v && v.trim() !== "").join(' · ');
        const locationStr = (item.locations || []).filter(v => v).join(' · ');
        return `
        <div class="card">
            <div class="card-mask">
                <button onclick="editItem('${item._id}')">修改</button>
                <button onclick="deleteItem('${item._id}')" style="color:red">删除</button>
            </div>
            <img src="${item.imageUrl || ''}" onerror="this.src='https://via.placeholder.com/200?text=NONE'">
            <div class="card-body">
                <div class="line1">
                    <span class="name">${item.name}</span>
                    ${item.notes ? `<span class="notes-mini">${item.notes}</span>` : ''}
                </div>
                <div class="line2">${line2Info}</div>
                <div class="line3">${locationStr}</div>
            </div>
        </div>
    `}).join('');
}

function renderSideNav() {
    const nav = document.getElementById('sideNav');
    let html = `<div class="nav-item ${currentCat1 === '全部' ? 'active' : ''}" onclick="setCat1('全部')">全部</div>`;
    allCategories.filter(c => c.level === 1).forEach(c => {
        html += `<div class="nav-item ${currentCat1 === c.name ? 'active' : ''}" onclick="setCat1('${c.name}')">${c.name}</div>`;
    });
    nav.innerHTML = html;
}

function renderSubNav() {
    const nav = document.getElementById('subNav');
    if (currentCat1 === '全部') {
        nav.innerHTML = `<span class="tag ${filterLoc === '' ? 'active' : ''}" onclick="setLocFilter('')">全部位置</span>` + allLocations.filter(l => l.level === 1).map(l => `<span class="tag ${filterLoc === l.name ? 'active' : ''}" onclick="setLocFilter('${l.name}')">${l.name}</span>`).join('');
    } else {
        const p = allCategories.find(c => c.name === currentCat1);
        nav.innerHTML = `<span class="tag ${currentCat2 === '' ? 'active' : ''}" onclick="setCat2('')">全部子类</span>` + allCategories.filter(c => c.parentId === p?._id).map(c => `<span class="tag ${currentCat2 === c.name ? 'active' : ''}" onclick="setCat2('${c.name}')">${c.name}</span>`).join('');
    }
}

function switchTab(t) {
    document.getElementById('catPanel').style.display = t === 'cat' ? 'block' : 'none';
    document.getElementById('locPanel').style.display = t === 'loc' ? 'block' : 'none';
    document.getElementById('tabCat').className = t === 'cat' ? 'active' : '';
    document.getElementById('tabLoc').className = t === 'loc' ? 'active' : '';
    t === 'cat' ? renderCatList() : renderLocList();
}

function toggleTree(e, id) {
    e.stopPropagation();
    const item = e.currentTarget;
    const group = document.getElementById(id);
    const isExpanded = item.classList.toggle('expanded');
    if (group) group.classList.toggle('show', isExpanded);
}

function renderCatList() {
    let html = '';
    allCategories.filter(c => c.level === 1).forEach(c1 => {
        const children = allCategories.filter(c => c.parentId === c1._id);
        const hasChild = children.length > 0;
        const childGroupId = `cat-group-${c1._id}`;
        
        html += `
            <div class="mgr-item" onclick="toggleTree(event, '${childGroupId}')">
                <span><span class="toggle-icon">${hasChild ? '▶' : ''}</span><b>${c1.name}</b></span>
                <span class="del-btn" onclick="deleteCat(event, '${c1._id}')">删除</span>
            </div>
            <div id="${childGroupId}" class="child-group">
                ${children.map(c2 => `
                    <div class="mgr-item" style="padding-left:30px">
                        <span>${c2.name}</span>
                        <span class="del-btn" onclick="deleteCat(event, '${c2._id}')">删除</span>
                    </div>
                `).join('')}
            </div>`;
    });
    document.getElementById('catList').innerHTML = html;
}

function renderLocList() {
    let html = '';
    allLocations.filter(l => l.level === 1).forEach(l1 => {
        const l2Children = allLocations.filter(l => l.parentId === l1._id);
        const hasChild1 = l2Children.length > 0;
        const g1Id = `loc-g-${l1._id}`;

        html += `
            <div class="mgr-item" onclick="toggleTree(event, '${g1Id}')">
                <span><span class="toggle-icon">${hasChild1 ? '▶' : ''}</span><b>${l1.name}</b></span>
                <span class="del-btn" onclick="deleteLoc(event, '${l1._id}')">删除</span>
            </div>
            <div id="${g1Id}" class="child-group">
                ${l2Children.map(l2 => {
                    const l3Children = allLocations.filter(l => l.parentId === l2._id);
                    const hasChild2 = l3Children.length > 0;
                    const g2Id = `loc-g-${l2._id}`;
                    return `
                        <div class="mgr-item" style="padding-left:25px" onclick="toggleTree(event, '${g2Id}')">
                            <span><span class="toggle-icon">${hasChild2 ? '▶' : ''}</span>${l2.name}</span>
                            <span class="del-btn" onclick="deleteLoc(event, '${l2._id}')">删除</span>
                        </div>
                        <div id="${g2Id}" class="child-group">
                            ${l3Children.map(l3 => `
                                <div class="mgr-item" style="padding-left:50px">
                                    <span>${l3.name}</span>
                                    <span class="del-btn" onclick="deleteLoc(event, '${l3._id}')">删除</span>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }).join('')}
            </div>`;
    });
    document.getElementById('locList').innerHTML = html;
}

document.getElementById('itemForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-submit');
    const id = document.getElementById('editItemId').value;
    const fileInput = document.getElementById('fileInput');
    const originalText = btn.innerText;
    btn.innerText = '正在上传...'; btn.disabled = true;

    try {
        let finalImageUrl = document.getElementById('formImg').value;
        
        // 关键修复：确保文件上传逻辑执行并获取正确的 URL
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const cat1 = document.getElementById('sel1').value;
            const cat2 = document.getElementById('sel2').value || '未分类';
            
            const d = new Date();
            const timeStr = d.getFullYear().toString().slice(-2) + (d.getMonth() + 1).toString().padStart(2, '0') + d.getDate().toString().padStart(2, '0') + d.getHours().toString().padStart(2, '0') + d.getMinutes().toString().padStart(2, '0') + d.getSeconds().toString().padStart(2, '0');
            const ext = file.name.split('.').pop();
            const customName = `${cat1}-${cat2}-${timeStr}.${ext}`;
            
            const fd = new FormData();
            fd.append('file', file); 
            fd.append('fileName', customName);
            
            const upRes = await fetch('/api/upload', { method: 'POST', body: fd }).then(r => r.json());
            if (upRes && upRes.url) {
                finalImageUrl = upRes.url;
            } else {
                throw new Error("图片上传返回格式错误");
            }
        }
        
        btn.innerText = '提交中...';
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.imageUrl = finalImageUrl;
        data.locations = [
            document.getElementById('locSel1').value, 
            document.getElementById('locSel2').value, 
            document.getElementById('locSel3').value
        ].filter(v => v);
        
        const res = await fetch(id ? `/api/items/${id}` : '/api/items', { 
            method: id ? 'PUT' : 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(data) 
        });

        if (!res.ok) throw new Error("数据库保存失败");
        
        alert("操作成功");
        toggleModal('itemModal', false); 
        refreshAll();
    } catch (err) { 
        console.error(err);
        alert('操作失败: ' + err.message); 
    } finally { 
        btn.innerText = originalText; 
        btn.disabled = false; 
    }
};

async function deleteCat(e, id) { 
    e.stopPropagation();
    if (confirm('确认删除？其下所有子类也将被删除！')) { 
        await fetch(`/api/categories/${id}`, { method: 'DELETE' }); 
        refreshAll().then(renderCatList); 
    } 
}
async function deleteLoc(e, id) { 
    e.stopPropagation();
    if (confirm('确认删除？其下所有子级位置也将被删除！')) { 
        await fetch(`/api/locations/${id}`, { method: 'DELETE' }); 
        refreshAll().then(renderLocList); 
    } 
}
async function deleteItem(id) { if (confirm('确认删除？')) { await fetch(`/api/items/${id}`, { method: 'DELETE' }); refreshAll(); } }

function initDropdowns() {
    const s1 = document.getElementById('sel1'), s2 = document.getElementById('sel2');
    s1.innerHTML = '<option value="">主分类</option>' + allCategories.filter(c => c.level === 1).map(c => `<option value="${c.name}" data-id="${c._id}">${c.name}</option>`).join('');
    s1.onchange = () => {
        const pid = s1.options[s1.selectedIndex].dataset.id;
        s2.innerHTML = '<option value="">子分类</option>' + allCategories.filter(c => c.parentId === pid).map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    };
    const ls1 = document.getElementById('locSel1'), ls2 = document.getElementById('locSel2'), ls3 = document.getElementById('locSel3');
    ls1.innerHTML = '<option value="">一级位置</option>' + allLocations.filter(l => l.level === 1).map(l => `<option value="${l.name}" data-id="${l._id}">${l.name}</option>`).join('');
    ls1.onchange = () => {
        const pid = ls1.options[ls1.selectedIndex].dataset.id;
        ls2.innerHTML = '<option value="">二级位置</option>' + allLocations.filter(l => l.parentId === pid).map(l => `<option value="${l.name}" data-id="${l._id}">${l.name}</option>`).join('');
        ls3.innerHTML = '<option value="">三级位置</option>';
    };
    ls2.onchange = () => {
        const pid = ls2.options[ls2.selectedIndex].dataset.id;
        ls3.innerHTML = '<option value="">三级位置</option>' + allLocations.filter(l => l.parentId === pid).map(l => `<option value="${l.name}">${l.name}</option>`).join('');
    };
}

function updateParentOptions(type) {
    if (type === 'cat') {
        const lv = document.getElementById('newCatLevel').value;
        const ps = document.getElementById('parentSelect');
        ps.style.display = lv === "2" ? "block" : "none";
        ps.innerHTML = '<option value="">选主类</option>' + allCategories.filter(c => c.level === 1).map(c => `<option value="${c._id}">${c.name}</option>`).join('');
    } else {
        const lv = document.getElementById('newLocLevel').value;
        const p1 = document.getElementById('locP1'), p2 = document.getElementById('locP2');
        p1.style.display = lv > 1 ? "block" : "none";
        p2.style.display = lv > 2 ? "block" : "none";
        p1.innerHTML = '<option value="">一级父项</option>' + allLocations.filter(l => l.level === 1).map(l => `<option value="${l._id}">${l.name}</option>`).join('');
    }
}

function loadLocChildren(pId, targetId) {
    const pid = document.getElementById(pId).value;
    document.getElementById(targetId).innerHTML = '<option value="">二级父项</option>' + allLocations.filter(l => l.parentId === pid).map(l => `<option value="${l._id}">${l.name}</option>`).join('');
}

function setCat1(n) { currentCat1 = n; currentCat2 = ''; filterLoc = ''; renderSideNav(); renderSubNav(); renderGrid(); }
function setCat2(n) { currentCat2 = n; renderSubNav(); renderGrid(); }
function setLocFilter(n) { filterLoc = n; renderSubNav(); renderGrid(); }
function toggleModal(id, s) { document.getElementById(id).style.display = s ? 'flex' : 'none'; }
function openItemModal() { document.getElementById('itemForm').reset(); document.getElementById('editItemId').value = ''; initDropdowns(); toggleModal('itemModal', true); }
function openAdminModal() { toggleModal('adminModal', true); switchTab('cat'); }

async function handleAddCategory() {
    const name = document.getElementById('newCatName').value.trim();
    const lv = parseInt(document.getElementById('newCatLevel').value);
    const pid = document.getElementById('parentSelect').value || null;
    if(!name) return alert("请输入名称");
    const exists = allCategories.find(c => c.name === name && c.level === lv && String(c.parentId) === String(pid));
    if(exists) return alert("该分类层级下已存在相同名称");
    try {
        await fetch('/api/categories', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ name, level: lv, parentId: pid }) 
        });
        alert("添加成功");
        document.getElementById('newCatName').value = "";
        refreshAll().then(renderCatList);
    } catch(e) { alert("添加失败"); }
}

async function handleAddLocation() {
    const name = document.getElementById('newLocName').value.trim();
    const lv = parseInt(document.getElementById('newLocLevel').value);
    let pid = null; 
    if(lv === 2) pid = document.getElementById('locP1').value; 
    if(lv === 3) pid = document.getElementById('locP2').value;
    if(!name) return alert("请输入名称");
    const exists = allLocations.find(l => l.name === name && l.level === lv && String(l.parentId) === String(pid));
    if(exists) return alert("该位置层级下已存在相同名称");
    try {
        await fetch('/api/locations', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ name, level: lv, parentId: pid }) 
        });
        alert("添加成功");
        document.getElementById('newLocName').value = "";
        refreshAll().then(renderLocList);
    } catch(e) { alert("添加失败"); }
}

async function editItem(id) {
    const item = allItems.find(i => i._id === id);
    if(!item) return;
    document.getElementById('editItemId').value = item._id;
    document.getElementById('formName').value = item.name;
    document.getElementById('formBrand').value = item.brand || '';
    document.getElementById('formSpec').value = item.spec || '';
    document.getElementById('formQty').value = item.quantity || '';
    document.getElementById('formNotes').value = item.notes || '';
    document.getElementById('formImg').value = item.imageUrl || '';
    
    document.getElementById('sel1').value = item.cat1;
    document.getElementById('sel1').dispatchEvent(new Event('change'));
    setTimeout(() => {
        document.getElementById('sel2').value = item.cat2;
        document.getElementById('locSel1').value = item.locations[0] || '';
        document.getElementById('locSel1').dispatchEvent(new Event('change'));
        setTimeout(() => {
            document.getElementById('locSel2').value = item.locations[1] || '';
            document.getElementById('locSel2').dispatchEvent(new Event('change'));
            setTimeout(() => { document.getElementById('locSel3').value = item.locations[2] || ''; }, 50);
        }, 50);
    }, 50);
    toggleModal('itemModal', true);
}

function toggleManageMode() {
    isManageMode = !isManageMode;
    const btn = document.getElementById('manageBtn');
    const grid = document.getElementById('itemGrid');
    if (isManageMode) { grid.classList.add('manage-on'); btn.innerText = '退出'; btn.style.background = '#333'; btn.style.color = '#fff'; }
    else { grid.classList.remove('manage-on'); btn.innerText = '编辑'; btn.style.background = '#eee'; btn.style.color = '#666'; }
}