/* 渲染物品展示网格 */
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

/* 物品表单提交（含文件上传） */
document.getElementById('itemForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-submit');
    const id = document.getElementById('editItemId').value;
    const fileInput = document.getElementById('fileInput');
    const originalText = btn.innerText;
    btn.innerText = '正在上传...'; btn.disabled = true;

    try {
        let finalImageUrl = document.getElementById('formImg').value;
        
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

/* 初始化物品表单的分类与位置下拉菜单级联 */
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

/* 编辑物品与删除物品 */
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

async function deleteItem(id) { if (confirm('确认删除？')) { await fetch(`/api/items/${id}`, { method: 'DELETE' }); refreshAll(); } }