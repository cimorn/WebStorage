/* 渲染左侧分类导航栏 */
function renderSideNav() {
    const nav = document.getElementById('sideNav');
    let html = `<div class="nav-item ${currentCat1 === '全部' ? 'active' : ''}" onclick="setCat1('全部')">全部</div>`;
    allCategories.filter(c => c.level === 1).forEach(c => {
        html += `<div class="nav-item ${currentCat1 === c.name ? 'active' : ''}" onclick="setCat1('${c.name}')">${c.name}</div>`;
    });
    nav.innerHTML = html;
}

/* 渲染二级分类/位置标签栏 */
function renderSubNav() {
    const nav = document.getElementById('subNav');
    if (currentCat1 === '全部') {
        nav.innerHTML = `<span class="tag ${filterLoc === '' ? 'active' : ''}" onclick="setLocFilter('')">全部位置</span>` + 
        allLocations.filter(l => l.level === 1).map(l => `<span class="tag ${filterLoc === l.name ? 'active' : ''}" onclick="setLocFilter('${l.name}')">${l.name}</span>`).join('');
    } else {
        const p = allCategories.find(c => c.name === currentCat1);
        nav.innerHTML = `<span class="tag ${currentCat2 === '' ? 'active' : ''}" onclick="setCat2('')">全部子类</span>` + 
        allCategories.filter(c => c.parentId === p?._id).map(c => `<span class="tag ${currentCat2 === c.name ? 'active' : ''}" onclick="setCat2('${c.name}')">${c.name}</span>`).join('');
    }
}

/* 导航点击过滤逻辑 */
function setCat1(n) { 
    currentCat1 = n; currentCat2 = ''; filterLoc = ''; 
    renderSideNav(); renderSubNav(); renderGrid(); 
}

function setCat2(n) { 
    currentCat2 = n; 
    renderSubNav(); renderGrid(); 
}

function setLocFilter(n) { 
    filterLoc = n; 
    renderSubNav(); renderGrid(); 
}