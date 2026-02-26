/* 分类与位置配置面板的标签切换 */
function switchTab(t) {
    document.getElementById('catPanel').style.display = t === 'cat' ? 'block' : 'none';
    document.getElementById('locPanel').style.display = t === 'loc' ? 'block' : 'none';
    document.getElementById('tabCat').className = t === 'cat' ? 'active' : '';
    document.getElementById('tabLoc').className = t === 'loc' ? 'active' : '';
    t === 'cat' ? renderCatList() : renderLocList();
}

/* 树形列表折叠/展开交互 */
function toggleTree(e, id) {
    e.stopPropagation();
    const item = e.currentTarget;
    const group = document.getElementById(id);
    const isExpanded = item.classList.toggle('expanded');
    if (group) group.classList.toggle('show', isExpanded);
}

/* 渲染分类管理列表 */
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

/* 渲染位置管理列表 */
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

/* 添加分类与位置的级联选项更新 */
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

/* 执行添加分类/位置的 API 请求 */
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

/* 删除分类/位置的 API 请求 */
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