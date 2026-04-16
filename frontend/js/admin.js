const CLOUDBASE_ENV = 'math-animations-2ga3njm77f3944eb';

let animations = [];
let filteredAnimations = [];
let currentPage = 1;
const itemsPerPage = 10;
const DEFAULT_PASSWORD = '202486';

let app = null;
let db = null;
let animationsCollection = null;
let cloudBaseReady = false;

async function initCloudBase() {
    console.log('开始初始化 CloudBase...');
    console.log('当前时间:', new Date().toLocaleString());
    console.log('CLOUDBASE_ENV:', CLOUDBASE_ENV);
    
    if (cloudBaseReady) {
        console.log('CloudBase 已经初始化');
        return true;
    }

    // 检查网络连接
    if (navigator.onLine) {
        console.log('网络连接状态: 在线');
    } else {
        console.error('网络连接状态: 离线');
        return false;
    }

    // 等待 SDK 加载
    let attempts = 0;
    const maxAttempts = 50; // 最多等待 5 秒
    console.log('等待 CloudBase SDK 加载...');

    while (!(window.cloudbase || window.tcb) && attempts < maxAttempts) {
        console.log('等待 SDK 加载中... 尝试次数:', attempts);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    console.log('等待后 - window.tcb:', typeof window.tcb, window.tcb ? '已加载' : '未加载');
    console.log('等待后 - window.cloudbase:', typeof window.cloudbase, window.cloudbase ? '已加载' : '未加载');
    console.log('总尝试次数:', attempts);

    const sdk = window.cloudbase || window.tcb;
    if (!sdk) {
        console.error('CloudBase SDK 未加载，请检查网络连接或SDK URL是否正确');
        return false;
    }

    try {
        console.log('初始化 CloudBase 应用...');
        app = sdk.init({
            env: CLOUDBASE_ENV
        });
        console.log('CloudBase 应用初始化成功');

        console.log('获取认证对象...');
        const auth = app.auth();
        console.log('认证对象获取成功');

        console.log('检查登录状态...');
        let loginState;
        try {
            loginState = await auth.getLoginState();
            console.log('登录状态检查成功:', loginState ? '已登录' : '未登录');
        } catch (loginError) {
            console.error('登录状态检查失败:', loginError);
            return false;
        }

        if (!loginState) {
            console.log('执行匿名登录...');
            try {
                await auth.signInAnonymously();
                console.log('匿名登录成功');
            } catch (loginError) {
                console.error('匿名登录失败:', loginError);
                return false;
            }
        } else {
            console.log('已登录状态，无需重新登录');
        }

        console.log('获取登录状态...');
        let state;
        try {
            state = await auth.getLoginState();
            console.log('登录状态获取成功:', state);
        } catch (stateError) {
            console.error('登录状态获取失败:', stateError);
            return false;
        }

        // CloudBase返回的登录状态对象结构是 {user: {uid: ...}}
        if (state && state.user && state.user.uid) {
            authUid = state.user.uid;
            console.log('认证成功，用户 ID:', authUid);
        } else if (state && state.uid) {
            // 兼容旧版本SDK
            authUid = state.uid;
            console.log('认证成功，用户 ID:', authUid);
        } else {
            console.error('获取用户 UID 失败，登录状态对象:', state);
            return false;
        }

        console.log('初始化数据库...');
        try {
            db = app.database();
            console.log('数据库初始化成功:', db);
        } catch (dbError) {
            console.error('数据库初始化失败:', dbError);
            return false;
        }
        
        console.log('初始化 animations 集合...');
        try {
            animationsCollection = db.collection('animations');
            console.log('animationsCollection 初始化成功:', animationsCollection);
        } catch (collectionError) {
            console.error('animationsCollection 初始化失败:', collectionError);
            return false;
        }
        
        console.log('初始化 chapters 集合...');
        try {
            chaptersCollection = db.collection('chapters');
            console.log('chaptersCollection 初始化成功:', chaptersCollection);
        } catch (collectionError) {
            console.error('chaptersCollection 初始化失败:', collectionError);
            return false;
        }

        cloudBaseReady = true;
        console.log('CloudBase 初始化成功');
        return true;
    } catch (error) {
        console.error('CloudBase 初始化失败:', error);
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
        return false;
    }
}

async function loadAnimationsFromCloudBase() {
    if (!animationsCollection) return false;

    try {
        const result = await animationsCollection.get();
        if (result && result.data && Array.isArray(result.data)) {
            animations = result.data;
            console.log('从 CloudBase 加载动画数据成功，数量:', animations.length);
            return true;
        }
        return false;
    } catch (error) {
        console.error('从 CloudBase 加载动画数据失败:', error);
        return false;
    }
}

async function addAnimationToCloudBase(animationData) {
    if (!animationsCollection) return false;

    try {
        await animationsCollection.add(animationData);
        console.log('添加动画到 CloudBase 成功');
        return true;
    } catch (error) {
        console.error('添加动画到 CloudBase 失败:', error);
        return false;
    }
}

async function updateAnimationInCloudBase(docId, animationData) {
    if (!animationsCollection) return false;

    try {
        await animationsCollection.doc(docId).update(animationData);
        console.log('更新 CloudBase 动画成功');
        return true;
    } catch (error) {
        console.error('更新 CloudBase 动画失败:', error);
        return false;
    }
}

async function deleteAnimationFromCloudBase(docId) {
    if (!animationsCollection) {
        console.error('animationsCollection 未初始化');
        return false;
    }

    try {
        console.log('开始删除动画，docId:', docId);
        
        // 先获取所有动画数据
        const allAnimations = await animationsCollection.get();
        console.log('当前数据库中的所有动画:', allAnimations);
        
        if (allAnimations && allAnimations.data) {
            console.log('找到', allAnimations.data.length, '个动画');
            for (const doc of allAnimations.data) {
                console.log('检查动画:', doc);
                console.log('doc.id:', doc.id, 'doc._id:', doc._id);
                if (doc.id === docId || doc._id === docId) {
                    console.log('找到匹配的文档，_id:', doc._id);
                    try {
                        await animationsCollection.doc(doc._id).remove();
                        console.log('从 CloudBase 删除动画成功');
                        return true;
                    } catch (removeError) {
                        console.error('删除文档失败，_id:', doc._id, '错误:', removeError);
                        return false;
                    }
                }
            }
        }
        console.log('未找到匹配的文档');
        return false;
    } catch (error) {
        console.error('从 CloudBase 删除动画失败:', error);
        return false;
    }
}

// 章节数据结构 - 初始化为空对象，所有数据将从数据库加载
let chapterData = {};

// 章节数据集合
let chaptersCollection = null;

function init() {
    bindEvents();
}

function bindEvents() {
    document.getElementById('password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        validatePassword();
    });

    document.getElementById('animation-type').addEventListener('change', function() {
        const type = this.value;
        if (type === 'ggb' || type === 'external') {
            document.getElementById('ggb-url-group').style.display = 'block';
            document.getElementById('html-file-group').style.display = 'none';
        } else {
            document.getElementById('ggb-url-group').style.display = 'none';
            document.getElementById('html-file-group').style.display = 'block';
        }
    });

    document.getElementById('grade').addEventListener('change', async function() {
        // 从数据库重新加载章节数据，确保章节下拉列表与数据库同步
        if (cloudBaseReady) {
            await loadChaptersFromCloudBase();
        }
        updateChapters();
    });
    document.getElementById('semester').addEventListener('change', async function() {
        // 从数据库重新加载章节数据，确保章节下拉列表与数据库同步
        if (cloudBaseReady) {
            await loadChaptersFromCloudBase();
        }
        updateChapters();
    });

    document.getElementById('filter-grade').addEventListener('change', async function() {
        await updateFilterChapters();
    });
    document.getElementById('filter-semester').addEventListener('change', async function() {
        await updateFilterChapters();
    });

    document.getElementById('chapter').addEventListener('change', function() {
        const chapter = this.value;
        if (chapter === '其他') {
            document.getElementById('other-chapter-group').style.display = 'block';
        } else {
            document.getElementById('other-chapter-group').style.display = 'none';
        }
    });

    // 文件上传时自动读取文件名并填充到动画名称
    document.getElementById('html-file').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            // 去掉.html后缀作为动画名称
            const fileName = file.name.replace(/\.html$/i, '');
            document.getElementById('animation-name').value = fileName;
            console.log('自动填充动画名称:', fileName);
        }
    });

    document.getElementById('animation-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveAnimation();
    });

    window.addEventListener('click', function(event) {
        const modal = document.getElementById('animation-modal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

async function updateFilterChapters() {
    const grade = document.getElementById('filter-grade').value;
    const semester = document.getElementById('filter-semester').value;
    const chapterSelect = document.getElementById('filter-chapter');

    // 从数据库重新加载章节数据，确保章节下拉列表与数据库同步
    if (cloudBaseReady) {
        await loadChaptersFromCloudBase();
    }

    chapterSelect.innerHTML = '<option value="">所有章节</option>';

    if (grade && semester && grade !== '其他' && semester !== '其他' && chapterData[grade] && chapterData[grade][semester]) {
        chapterData[grade][semester].forEach(chapter => {
            const option = document.createElement('option');
            // 处理对象格式的章节数据
            const chapterName = typeof chapter === 'object' && chapter !== null ? chapter.name : chapter;
            option.value = chapterName;
            option.textContent = chapterName;
            chapterSelect.appendChild(option);
        });
    }
}

async function openAddAnimationModal() {
    document.getElementById('animation-id').value = '';
    document.getElementById('animation-form').reset();
    document.getElementById('ggb-url-group').style.display = 'block';
    document.getElementById('html-file-group').style.display = 'none';
    document.getElementById('other-chapter-group').style.display = 'none';
    document.getElementById('modal-title').textContent = '添加新动画';
    document.getElementById('animation-modal').style.display = 'block';
    
    // 从数据库重新加载章节数据，确保章节下拉列表与数据库同步
    if (cloudBaseReady) {
        await loadChaptersFromCloudBase();
    }
    
    // 更新章节下拉列表
    updateChapters();
}

async function openEditAnimationModal(id) {
    const animation = animations.find(item => item._id === id || item.id === id);
    if (animation) {
        document.getElementById('animation-id').value = animation._id || animation.id;
        document.getElementById('animation-name').value = animation.name;
        document.getElementById('animation-type').value = animation.type;
        document.getElementById('grade').value = animation.grade;
        document.getElementById('semester').value = animation.semester;

        // 从数据库重新加载章节数据，确保章节下拉列表与数据库同步
        if (cloudBaseReady) {
            await loadChaptersFromCloudBase();
        }

        updateChapters();

        const chapterSelect = document.getElementById('chapter');
        let chapterFound = false;

        for (let i = 0; i < chapterSelect.options.length; i++) {
            if (chapterSelect.options[i].value === animation.chapter) {
                chapterSelect.value = animation.chapter;
                chapterFound = true;
                break;
            }
        }

        if (!chapterFound) {
            chapterSelect.value = '其他';
            document.getElementById('other-chapter-group').style.display = 'block';
            document.getElementById('other-chapter').value = animation.chapter;
        } else {
            document.getElementById('other-chapter-group').style.display = 'none';
        }

        if (animation.type === 'ggb' || animation.type === 'external') {
            document.getElementById('ggb-url').value = animation.url;
            document.getElementById('ggb-url-group').style.display = 'block';
            document.getElementById('html-file-group').style.display = 'none';
        } else {
            document.getElementById('ggb-url-group').style.display = 'none';
            document.getElementById('html-file-group').style.display = 'block';
        }

        document.getElementById('modal-title').textContent = '编辑动画';
        document.getElementById('animation-modal').style.display = 'block';
    }
}

function closeModal() {
    document.getElementById('animation-modal').style.display = 'none';
}

function updateChapters() {
    const grade = document.getElementById('grade').value;
    const semester = document.getElementById('semester').value;
    const chapterSelect = document.getElementById('chapter');

    chapterSelect.innerHTML = '<option value="">请选择章节</option>';

    if (grade && semester && grade !== '其他' && semester !== '其他' && chapterData[grade] && chapterData[grade][semester]) {
        chapterData[grade][semester].forEach(chapter => {
            const option = document.createElement('option');
            // 处理对象格式的章节数据
            const chapterName = typeof chapter === 'object' && chapter !== null ? chapter.name : chapter;
            option.value = chapterName;
            option.textContent = chapterName;
            chapterSelect.appendChild(option);
        });
    }

    const otherOption = document.createElement('option');
    otherOption.value = '其他';
    otherOption.textContent = '其他';
    chapterSelect.appendChild(otherOption);

    document.getElementById('other-chapter-group').style.display = 'none';
}

async function saveAnimation() {
    const editDocId = document.getElementById('animation-id').value;
    const name = document.getElementById('animation-name').value;
    const type = document.getElementById('animation-type').value;
    const grade = document.getElementById('grade').value;
    const semester = document.getElementById('semester').value;
    let chapter = document.getElementById('chapter').value;

    if (chapter === '其他') {
        chapter = document.getElementById('other-chapter').value || '其他';
    }

    // 验证章节是否存在于chapters集合中
    if (grade !== '其他' && semester !== '其他' && chapter !== '其他') {
        const gradeData = chapterData[grade];
        if (!gradeData || !gradeData[semester]) {
            showMessage('该年级或学期不存在，请先添加章节', 'error');
            return;
        }
        const chapters = gradeData[semester];
        const chapterExists = chapters.some(c => {
            const chapterName = typeof c === 'object' ? c.name : c;
            return chapterName === chapter;
        });
        if (!chapterExists) {
            showMessage('该章节不存在，请先添加章节', 'error');
            return;
        }
    }

    // 生成 chapterId
    const chapterId = generateChapterId(grade, semester, chapter);

    let url;
    if (type === 'ggb' || type === 'external') {
        url = document.getElementById('ggb-url').value;
    } else {
        const gradePath = grade === '其他' ? '其他' : grade;
        const semesterPath = semester === '其他' ? '其他' : semester;
        const chapterPath = chapter === '其他' ? '其他' : chapter.replace(/\s+/g, '_');
        url = `animations/${gradePath}/${semesterPath}/${chapterPath}/${name}.html`;
    }

    const animationData = {
        id: editDocId || generateId(),
        name,
        type,
        url,
        chapterId
    };

    let success = false;

    if (editDocId) {
        const existing = animations.find(item => item._id === editDocId || item.id === editDocId);
        if (existing && existing._id) {
            success = await updateAnimationInCloudBase(existing._id, animationData);
            if (success) {
                const index = animations.findIndex(item => item._id === existing._id);
                if (index !== -1) {
                    animations[index] = { ...existing, ...animationData };
                }
            }
        } else {
            success = await addAnimationToCloudBase(animationData);
            if (success) {
                animations.push(animationData);
            }
        }
    } else {
        success = await addAnimationToCloudBase(animationData);
        if (success) {
            animations.push(animationData);
        }
    }

    if (success) {
        applyFilters();
        closeModal();
        renderAnimationList();
        updateStats();
        showMessage('保存成功！');
    } else {
        showMessage('保存失败，请重试', 'error');
    }
}

// 生成 chapterId，格式：年级-学期-章节索引（如 1-1-1 表示初一上册第一章）
function generateChapterId(grade, semester, chapter) {
    const gradeMap = { '初一': 1, '初二': 2, '初三': 3, '其他': 0 };
    const semesterMap = { '上册': 1, '下册': 2, '其他': 0 };
    
    // 查找章节在章节列表中的索引
    let chapterIndex = 1;
    if (grade !== '其他' && semester !== '其他' && chapterData[grade] && chapterData[grade][semester]) {
        const chapters = chapterData[grade][semester];
        const chapterIndexInList = chapters.findIndex(c => {
            const chapterName = typeof c === 'object' ? c.name : c;
            return chapterName === chapter;
        });
        if (chapterIndexInList !== -1) {
            chapterIndex = chapterIndexInList + 1;
        }
    }
    
    return `${gradeMap[grade]}-${semesterMap[semester]}-${chapterIndex}`;
}

// 生成动画ID，使用随机字符串
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function renderAnimationList() {
    const listContainer = document.getElementById('animation-list');
    listContainer.innerHTML = '';

    if (filteredAnimations.length === 0) {
        listContainer.innerHTML = '<p>暂无动画资源</p>';
        renderPagination();
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageAnimations = filteredAnimations.slice(startIndex, endIndex);

    const table = document.createElement('table');
    table.className = 'animation-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th class="checkbox-cell"><input type="checkbox" id="select-all"></th>
            <th>动画名称</th>
            <th>类型</th>
            <th>章节ID</th>
            <th>URL</th>
            <th>操作</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    currentPageAnimations.forEach(animation => {
        const docId = animation._id || animation.id;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="checkbox-cell"><input type="checkbox" class="animation-checkbox" data-id="${docId}"></td>
            <td>${animation.name}</td>
            <td>${animation.type === 'ggb' ? 'GGB在线动画' : animation.type === 'external' ? '外部网站动画' : '本地HTML动画'}</td>
            <td>${animation.chapterId || '-'}</td>
            <td><a href="${animation.url}" target="_blank">${animation.url}</a></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="editAnimation('${docId}')">编辑</button>
                    <button class="btn btn-danger" onclick="deleteAnimation('${docId}')">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    listContainer.appendChild(table);

    document.getElementById('select-all').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.animation-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });

    renderPagination();
}

function editAnimation(id) {
    openEditAnimationModal(id);
}

async function deleteAnimation(id) {
    if (await showConfirm('确定要删除这个动画吗？')) {
        try {
            // 从数据库中删除
            const success = await deleteAnimationFromCloudBase(id);
            
            if (success) {
                // 重新加载数据，确保前端显示的动画列表与数据库中的数据一致
                await loadAnimationsFromCloudBase();
                applyFilters();
                renderAnimationList();
                updateStats();
                showMessage('删除成功！');
            } else {
                showMessage('删除失败，请重试', 'error');
            }
        } catch (error) {
            showMessage('删除过程中发生错误，请重试', 'error');
        }
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const type = document.getElementById('filter-type').value;

    filteredAnimations = animations.filter(animation => {
        const matchesSearch = animation.name.toLowerCase().includes(searchTerm);
        const matchesType = !type || animation.type === type;

        return matchesSearch && matchesType;
    });

    currentPage = 1;
    renderAnimationList();
    updateStats();
}

function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-type').value = '';

    filteredAnimations = [...animations];
    currentPage = 1;
    renderAnimationList();
    updateStats();
}

function updateStats() {
    const statsElement = document.getElementById('animation-stats');
    statsElement.textContent = `共 ${animations.length} 个动画，当前显示 ${filteredAnimations.length} 个`;
}

function renderPagination() {
    const paginationElement = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredAnimations.length / itemsPerPage);

    if (totalPages <= 1) {
        paginationElement.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    paginationHTML += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">上一页</button>`;

    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<button ${i === currentPage ? 'class="active"' : ''} onclick="goToPage(${i})")">${i}</button>`;
    }

    paginationHTML += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">下一页</button>`;

    paginationElement.innerHTML = paginationHTML;
}

function goToPage(page) {
    currentPage = page;
    renderAnimationList();
}

async function batchDelete() {
    const checkboxes = document.querySelectorAll('.animation-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(checkbox => checkbox.getAttribute('data-id'));

    if (selectedIds.length === 0) {
        showMessage('请选择要删除的动画');
        return;
    }

    if (await showConfirm(`确定要删除选中的 ${selectedIds.length} 个动画吗？`)) {
        let allSuccess = true;
        for (const id of selectedIds) {
            const success = await deleteAnimationFromCloudBase(id);
            if (!success) allSuccess = false;
        }

        animations = animations.filter(animation => !selectedIds.includes(animation._id || animation.id));

        applyFilters();
        renderAnimationList();
        updateStats();

        if (allSuccess) {
            showMessage('批量删除成功！');
        } else {
            showMessage('部分删除失败', 'error');
        }
    }
}

function openUpdateDataModal() {
    const jsonData = JSON.stringify(animations.map(a => {
        const { _id, ...rest } = a;
        return rest;
    }), null, 2);
    document.getElementById('json-data').value = jsonData;
    document.getElementById('update-data-modal').style.display = 'block';
}

function closeUpdateDataModal() {
    document.getElementById('update-data-modal').style.display = 'none';
}

async function updateAnimationsData() {
    try {
        const jsonData = document.getElementById('json-data').value;
        const updatedAnimations = JSON.parse(jsonData);

        if (!Array.isArray(updatedAnimations)) {
            throw new Error('数据格式错误，必须是数组');
        }

        let allSuccess = true;

        for (const existing of animations) {
            const stillExists = updatedAnimations.some(a => a.id === existing.id);
            if (!stillExists && existing._id) {
                const success = await deleteAnimationFromCloudBase(existing._id);
                if (!success) allSuccess = false;
            }
        }

        for (const animationData of updatedAnimations) {
            const existing = animations.find(a => a.id === animationData.id);
            if (existing && existing._id) {
                const success = await updateAnimationInCloudBase(existing._id, animationData);
                if (!success) allSuccess = false;
            } else {
                const success = await addAnimationToCloudBase(animationData);
                if (!success) allSuccess = false;
            }
        }

        await loadAnimationsFromCloudBase();

        filteredAnimations = [...animations];
        applyFilters();
        renderAnimationList();
        updateStats();

        closeUpdateDataModal();

        if (allSuccess) {
            showMessage('数据更新成功！');
        } else {
            showMessage('部分数据更新失败', 'error');
        }
    } catch (error) {
        console.error('更新数据失败:', error);
        showMessage('数据格式错误，请检查JSON格式', 'error');
    }
}

async function loadChaptersFromCloudBase() {
    if (!chaptersCollection) return false;

    try {
        const result = await chaptersCollection.get();
        if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
            const chapterDataFromDB = result.data[0];
            if (chapterDataFromDB.data) {
                // 确保章节数据的格式正确，将对象转换为数组
                const normalizedData = JSON.parse(JSON.stringify(chapterDataFromDB.data));
                // 检查并修复章节数据格式
                for (const grade in normalizedData) {
                    if (normalizedData.hasOwnProperty(grade)) {
                        const gradeData = normalizedData[grade];
                        for (const semester in gradeData) {
                            if (gradeData.hasOwnProperty(semester)) {
                                const chapters = gradeData[semester];
                                // 如果章节数据是对象，转换为数组
                                if (typeof chapters === 'object' && chapters !== null && !Array.isArray(chapters)) {
                                    const chapterArray = [];
                                    for (const key in chapters) {
                                        if (chapters.hasOwnProperty(key)) {
                                            chapterArray.push(chapters[key]);
                                        }
                                    }
                                    gradeData[semester] = chapterArray;
                                } else if (Array.isArray(chapters)) {
                                    // 确保每个章节都是对象，并且有 id 和 name 属性
                                    chapters.forEach((chapter, index) => {
                                        if (typeof chapter === 'string') {
                                            // 生成章节 ID：年级-学期-章节索引
                                            const gradeMap = { '初一': 1, '初二': 2, '初三': 3 };
                                            const semesterMap = { '上册': 1, '下册': 2 };
                                            const chapterId = `${gradeMap[grade]}-${semesterMap[semester]}-${index + 1}`;
                                            gradeData[semester][index] = {
                                                name: chapter,
                                                id: chapterId
                                            };
                                        } else if (typeof chapter === 'object' && chapter !== null) {
                                            // 确保章节对象有 id 属性
                                            if (!chapter.id) {
                                                // 生成章节 ID：年级-学期-章节索引
                                                const gradeMap = { '初一': 1, '初二': 2, '初三': 3 };
                                                const semesterMap = { '上册': 1, '下册': 2 };
                                                const chapterId = `${gradeMap[grade]}-${semesterMap[semester]}-${index + 1}`;
                                                chapter.id = chapterId;
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
                chapterData = normalizedData;
                console.log('从 CloudBase 加载章节数据成功');
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('从 CloudBase 加载章节数据失败:', error);
        return false;
    }
}

async function saveChaptersToCloudBase() {
    // 保存到本地存储，以便调试
    localStorage.setItem('chapterData', JSON.stringify(chapterData));
    console.log('章节数据已保存到本地存储:', chapterData);
    
    console.log('开始保存章节数据');
    console.log('chaptersCollection:', chaptersCollection);
    
    if (!chaptersCollection) {
        console.error('chaptersCollection 未初始化');
        return false;
    }

    try {
        // 确保章节数据的格式正确，并为每个章节生成章节 id
        const normalizedData = JSON.parse(JSON.stringify(chapterData));
        
        // 为每个章节生成章节 id
        const gradeMap = { '初一': 1, '初二': 2, '初三': 3 };
        const semesterMap = { '上册': 1, '下册': 2 };
        
        for (const grade in normalizedData) {
            if (normalizedData.hasOwnProperty(grade)) {
                const gradeData = normalizedData[grade];
                for (const semester in gradeData) {
                    if (gradeData.hasOwnProperty(semester)) {
                        const chapters = gradeData[semester];
                        if (Array.isArray(chapters)) {
                            chapters.forEach((chapter, index) => {
                                // 生成章节 ID：年级-学期-章节索引
                                const chapterId = `${gradeMap[grade]}-${semesterMap[semester]}-${index + 1}`;
                                // 确保章节数据是对象，添加章节 id
                                if (typeof chapter === 'string') {
                                    gradeData[semester][index] = {
                                        name: chapter,
                                        id: chapterId
                                    };
                                } else if (typeof chapter === 'object' && chapter !== null) {
                                    chapter.id = chapterId;
                                }
                            });
                        }
                    }
                }
            }
        }
        
        console.log('要保存的章节数据:', normalizedData);
        
        console.log('尝试获取 chapters 集合中的数据');
        const result = await chaptersCollection.get();
        console.log('获取 chapters 集合结果:', result);
        
        if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
            console.log('chapters 集合存在，更新现有文档');
            const docId = result.data[0]._id;
            console.log('更新文档 ID:', docId);
            
            // 尝试更新文档
            try {
                const updateResult = await chaptersCollection.doc(docId).update({ data: normalizedData });
                console.log('更新文档结果:', updateResult);
                console.log('更新文档成功');
            } catch (updateError) {
                console.error('更新文档失败，尝试替换文档:', updateError);
                // 如果更新失败，尝试删除后重新添加
                await chaptersCollection.doc(docId).remove();
                const addResult = await chaptersCollection.add({ data: normalizedData });
                console.log('重新创建文档结果:', addResult);
                console.log('重新创建文档成功');
            }
        } else {
            console.log('chapters 集合不存在或为空，创建新文档');
            const addResult = await chaptersCollection.add({ data: normalizedData });
            console.log('创建新文档结果:', addResult);
            console.log('创建新文档成功');
        }
        console.log('章节数据保存到 CloudBase 成功');
        return true;
    } catch (error) {
        console.error('章节数据保存到 CloudBase 失败:', error);
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
        return false;
    }
}

async function openChaptersModal() {
    document.getElementById('chapters-modal').style.display = 'block';
    
    // 从数据库重新加载章节数据，确保显示的是最新的章节信息
    if (cloudBaseReady) {
        await loadChaptersFromCloudBase();
    }
    
    renderChapterList();
}

function closeChaptersModal() {
    document.getElementById('chapters-modal').style.display = 'none';
}

function renderChapterList() {
    const chapterListElement = document.getElementById('chapter-list');
    if (!chapterListElement) return;

    let html = '';
    
    // 按年级和学期遍历章节
    for (const grade in chapterData) {
        if (chapterData.hasOwnProperty(grade)) {
            html += `<h4 style="margin-top: 20px; margin-bottom: 10px; color: #333;">${grade}</h4>`;
            
            const semesters = chapterData[grade];
            for (const semester in semesters) {
                if (semesters.hasOwnProperty(semester)) {
                    html += `<h5 style="margin-left: 20px; margin-bottom: 8px; color: #666;">${semester}</h5>`;
                    html += `<ul style="margin-left: 40px; list-style: none; padding: 0;">`;
                    
                    const chapters = semesters[semester];
                    chapters.forEach((chapter, index) => {
                        // 处理对象格式的章节数据
                        const chapterName = typeof chapter === 'object' && chapter !== null ? chapter.name : chapter;
                        html += `<li style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">`;
                        html += `<span>${chapterName}</span>`;
                        html += `<div style="display: flex; gap: 5px;">`;
                        html += `<button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="editChapter('${grade}', '${semester}', ${index}, '${chapterName}')"><span style="font-size: 10px;">✏️</span> 编辑</button>`;
                        html += `<button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="deleteChapter('${grade}', '${semester}', ${index})"><span style="font-size: 10px;">🗑️</span> 删除</button>`;
                        html += `</div>`;
                        html += `</li>`;
                    });
                    
                    html += `</ul>`;
                }
            }
        }
    }
    
    chapterListElement.innerHTML = html;
}

async function addChapter() {
    const grade = document.getElementById('chapter-grade').value;
    const semester = document.getElementById('chapter-semester').value;
    const chapterName = document.getElementById('chapter-name').value.trim();
    
    if (!chapterName) {
        showMessage('请输入章节名称', 'error');
        return;
    }
    
    // 确保CloudBase已初始化
    if (!chaptersCollection) {
        showMessage('系统初始化失败，请刷新页面重试', 'error');
        console.error('chaptersCollection 未初始化');
        return;
    }
    
    // 确保章节数据结构存在
    if (!chapterData[grade]) {
        chapterData[grade] = {};
    }
    if (!chapterData[grade][semester]) {
        chapterData[grade][semester] = [];
    }
    
    // 添加章节
    chapterData[grade][semester].push(chapterName);
    
    // 保存到CloudBase
    const success = await saveChaptersToCloudBase();
    
    if (success) {
        document.getElementById('chapter-name').value = '';
        renderChapterList();
        showMessage('章节添加成功！');
    } else {
        showMessage('章节添加失败，请重试', 'error');
    }
}

async function deleteChapter(grade, semester, index) {
    // 确保CloudBase已初始化
    if (!chaptersCollection) {
        showMessage('系统初始化失败，请刷新页面重试', 'error');
        console.error('chaptersCollection 未初始化');
        return;
    }
    
    if (await showConfirm('确定要删除这个章节吗？')) {
        // 删除章节
        chapterData[grade][semester].splice(index, 1);
        
        // 保存到CloudBase
        const success = await saveChaptersToCloudBase();
        
        if (success) {
            renderChapterList();
            showMessage('章节删除成功！');
        } else {
            showMessage('章节删除失败，请重试', 'error');
        }
    }
}

function editChapter(grade, semester, index, oldName) {
    // 确保CloudBase已初始化
    if (!chaptersCollection) {
        showMessage('系统初始化失败，请刷新页面重试', 'error');
        console.error('chaptersCollection 未初始化');
        return;
    }
    
    const newName = prompt('请输入新的章节名称:', oldName);
    if (newName && newName.trim() !== '') {
        // 更新章节名称
        chapterData[grade][semester][index] = newName.trim();
        
        // 保存到CloudBase
        saveChaptersToCloudBase().then(success => {
            if (success) {
                renderChapterList();
                showMessage('章节编辑成功！');
            } else {
                showMessage('章节编辑失败，请重试', 'error');
            }
        });
    }
}

async function validatePassword() {
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('password-error');

    if (password === DEFAULT_PASSWORD) {
        document.getElementById('password-modal').style.display = 'none';
        document.querySelector('.admin-container').style.display = 'block';

        console.log('开始初始化 CloudBase...');
        const ready = await initCloudBase();
        console.log('CloudBase 初始化结果:', ready);
        
        if (ready) {
            console.log('开始加载动画数据...');
            const animationsLoaded = await loadAnimationsFromCloudBase();
            console.log('动画数据加载结果:', animationsLoaded);
            
            console.log('开始加载章节数据...');
            const chaptersLoaded = await loadChaptersFromCloudBase();
            console.log('章节数据加载结果:', chaptersLoaded);
            console.log('当前章节数据:', chapterData);
        }

        updateChapters();
        filteredAnimations = [...animations];
        updateStats();
        renderAnimationList();
    } else {
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    }
}

// 导出Excel功能
function exportToExcel() {
    // 准备数据
    const data = animations.map(animation => {
        // 从chapterId解析年级、学期、章节
        let grade = '', semester = '', chapter = '';
        if (animation.chapterId) {
            const parts = animation.chapterId.split('-');
            if (parts.length >= 3) {
                const gradeMap = { '1': '初一', '2': '初二', '3': '初三' };
                const semesterMap = { '1': '上册', '2': '下册' };
                grade = gradeMap[parts[0]] || '';
                semester = semesterMap[parts[1]] || '';
                // 从chapterData查找章节名称
                if (grade && semester && chapterData[grade] && chapterData[grade][semester]) {
                    const chapters = chapterData[grade][semester];
                    const chapterIndex = parseInt(parts[2]) - 1;
                    if (chapters && chapters[chapterIndex]) {
                        const chapterItem = chapters[chapterIndex];
                        chapter = typeof chapterItem === 'object' ? chapterItem.name : chapterItem;
                    }
                }
            }
        }

        // 转换类型为中文
        const typeMap = {
            'ggb': 'GGB在线动画',
            'html': '本地HTML动画',
            'external': '外部网站动画'
        };

        return {
            '年级': grade,
            '学期': semester,
            '章节': chapter,
            '动画名称': animation.name || '',
            '动画类型': typeMap[animation.type] || animation.type || '',
            'URL': animation.url || ''
        };
    });

    // 如果没有数据，创建一个空模板
    if (data.length === 0) {
        data.push({
            '年级': '',
            '学期': '',
            '章节': '',
            '动画名称': '',
            '动画类型': '',
            'URL': ''
        });
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // 设置列宽
    ws['!cols'] = [
        { wch: 10 },  // 年级
        { wch: 10 },  // 学期
        { wch: 20 },  // 章节
        { wch: 30 },  // 动画名称
        { wch: 15 },  // 动画类型
        { wch: 60 }   // URL
    ];

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '动画数据');

    // 生成文件名
    const date = new Date().toISOString().split('T')[0];
    const filename = `动画数据_${date}.xlsx`;

    // 下载文件
    XLSX.writeFile(wb, filename);

    showMessage('Excel导出成功！');
}

// 打开导入Excel模态框
function openImportExcelModal() {
    document.getElementById('import-excel-modal').style.display = 'block';
    document.getElementById('excel-file').value = '';
}

// 关闭导入Excel模态框
function closeImportExcelModal() {
    document.getElementById('import-excel-modal').style.display = 'none';
}

// 从Excel导入数据
async function importFromExcel() {
    const fileInput = document.getElementById('excel-file');
    const file = fileInput.files[0];

    if (!file) {
        showMessage('请选择Excel文件', 'error');
        return;
    }

    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // 获取第一个工作表
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // 转换为JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length < 2) {
                showMessage('Excel文件格式不正确或数据为空', 'error');
                return;
            }

            // 解析表头
            const headers = jsonData[0];
            const gradeIndex = headers.indexOf('年级');
            const semesterIndex = headers.indexOf('学期');
            const chapterIndex = headers.indexOf('章节');
            const nameIndex = headers.indexOf('动画名称');
            const typeIndex = headers.indexOf('动画类型');
            const urlIndex = headers.indexOf('URL');

            if (gradeIndex === -1 || semesterIndex === -1 || chapterIndex === -1 || 
                nameIndex === -1 || typeIndex === -1 || urlIndex === -1) {
                showMessage('Excel文件格式不正确，请确保包含以下列：年级、学期、章节、动画名称、动画类型、URL', 'error');
                return;
            }

            // 解析数据行
            let successCount = 0;
            let errorCount = 0;

            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (row.length === 0) continue; // 跳过空行

                const grade = row[gradeIndex] || '';
                const semester = row[semesterIndex] || '';
                const chapter = row[chapterIndex] || '';
                const name = row[nameIndex] || '';
                const typeText = row[typeIndex] || '';
                const url = row[urlIndex] || '';

                // 验证必填字段
                if (!grade || !semester || !chapter || !name || !typeText || !url) {
                    console.warn('第', i + 1, '行数据不完整，跳过');
                    errorCount++;
                    continue;
                }

                // 转换类型
                const typeMap = {
                    'GGB在线动画': 'ggb',
                    '本地HTML动画': 'html',
                    '外部网站动画': 'external'
                };
                const type = typeMap[typeText] || 'html';

                // 生成chapterId
                const chapterId = generateChapterId(grade, semester, chapter);

                const animationData = {
                    id: generateId(),
                    name: name,
                    type: type,
                    url: url,
                    chapterId: chapterId
                };

                // 保存到CloudBase
                try {
                    await addAnimationToCloudBase(animationData);
                    successCount++;
                } catch (error) {
                    console.error('保存动画失败:', animationData, error);
                    errorCount++;
                }
            }

            // 重新加载动画数据
            await loadAnimationsFromCloudBase();
            filteredAnimations = [...animations];
            renderAnimationList();
            updateStats();

            closeImportExcelModal();

            if (errorCount === 0) {
                showMessage(`成功导入 ${successCount} 个动画！`);
            } else {
                showMessage(`导入完成：成功 ${successCount} 个，失败 ${errorCount} 个`, 'warning');
            }
        };

        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('读取Excel文件失败:', error);
        showMessage('读取Excel文件失败，请检查文件格式', 'error');
    }
}

window.addEventListener('DOMContentLoaded', init);
