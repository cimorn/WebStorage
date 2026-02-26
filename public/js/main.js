/* 全局状态变量 */
let allCategories = [], allLocations = [], allItems = [], isManageMode = false;
let currentCat1 = '全部', currentCat2 = '', filterLoc = '';

/* 初始化：页面加载时刷新所有数据 */
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

/* 全局弹窗控制 */
function toggleModal(id, s) { 
    document.getElementById(id).style.display = s ? 'flex' : 'none'; 
}

/* 打开物品新增弹窗 */
function openItemModal() { 
    document.getElementById('itemForm').reset(); 
    document.getElementById('editItemId').value = ''; 
    initDropdowns(); 
    toggleModal('itemModal', true); 
}

/* 打开管理后台弹窗 */
function openAdminModal() { 
    toggleModal('adminModal', true); 
    switchTab('cat'); 
}

/* 切换编辑模式（显示删除/修改按钮） */
function toggleManageMode() {
    isManageMode = !isManageMode;
    const btn = document.getElementById('manageBtn');
    const grid = document.getElementById('itemGrid');
    if (isManageMode) { 
        grid.classList.add('manage-on'); 
        btn.innerText = '退出'; 
        btn.style.background = '#333'; 
        btn.style.color = '#fff'; 
    } else { 
        grid.classList.remove('manage-on'); 
        btn.innerText = '编辑'; 
        btn.style.background = '#eee'; 
        btn.style.color = '#666'; 
    }
}