let animations = [];
let filteredAnimations = [];
let currentPage = 1;
const itemsPerPage = 10;

let db = null;
let animationsCollection = null;
let dbReady = false;

// 全局清除函数，可在浏览器控制台调用: clearIndexedDB()
window.clearIndexedDB = async function() {
    console.log('开始清除 IndexedDB 中的章节数据...');
    try {
        // 确保数据库已初始化
        if (!dbReady) {
            await initDB();
        }
        
        if (!chaptersCollection) {
            console.error('chaptersCollection 未初始化');
            return false;
        }
        
        // 获取所有章节数据
        const result = await chaptersCollection.get();
        console.log('当前章节数据:', result);
        
        if (result && result.data && Array.isArray(result.data)) {
            // 删除所有文档
            for (const doc of result.data) {
                if (doc._id) {
                    await chaptersCollection.doc(doc._id).remove();
                    console.log('已删除文档:', doc._id);
                }
            }
            console.log(`已删除 ${result.data.length} 个章节数据文档`);
        }
        
        // 清除 localStorage
        localStorage.removeItem('chapterData');
        console.log('localStorage 中的 chapterData 已清除');
        
        // 重置内存中的数据
        chapterData = {};
        
        console.log('✅ IndexedDB 章节数据清除完成！请刷新页面重新加载。');
        return true;
    } catch (error) {
        console.error('❌ 清除 IndexedDB 失败:', error);
        return false;
    }
};

// 全局清除函数，可在浏览器控制台调用: clearAllData()
window.clearAllData = async function() {
    console.log('开始清除所有 IndexedDB 数据（包括动画和章节）...');
    try {
        if (!dbReady) {
            await initDB();
        }
        
        // 清除章节数据
        if (chaptersCollection) {
            const chaptersResult = await chaptersCollection.get();
            if (chaptersResult && chaptersResult.data) {
                for (const doc of chaptersResult.data) {
                    if (doc._id) await chaptersCollection.doc(doc._id).remove();
                }
                console.log(`已删除 ${chaptersResult.data.length} 个章节文档`);
            }
        }
        
        // 清除动画数据
        if (animationsCollection) {
            const animationsResult = await animationsCollection.get();
            if (animationsResult && animationsResult.data) {
                for (const doc of animationsResult.data) {
                    if (doc._id) await animationsCollection.doc(doc._id).remove();
                }
                console.log(`已删除 ${animationsResult.data.length} 个动画文档`);
            }
        }
        
        // 清除 localStorage
        localStorage.clear();
        console.log('localStorage 已完全清除');
        
        console.log('✅ 所有数据清除完成！请刷新页面重新加载。');
        return true;
    } catch (error) {
        console.error('❌ 清除数据失败:', error);
        return false;
    }
};

async function initDB() {
    console.log('开始初始化 IndexedDB...');

    if (dbReady) {
        console.log('IndexedDB 已经初始化');
        return true;
    }

    try {
        // 初始化 IndexedDB
        if (window.indexedDBService) {
            await window.indexedDBService.init();
            db = window.indexedDBAPI;

            // 初始化默认数据
            await window.indexedDBService.initDefaultData();

            // 获取集合
            const database = db.database();
            animationsCollection = database.collection('animations');
            chaptersCollection = database.collection('chapters');

            dbReady = true;
            console.log('IndexedDB 初始化成功');
            return true;
        } else {
            console.error('IndexedDB 服务未加载');
            return false;
        }
    } catch (error) {
        console.error('IndexedDB 初始化失败:', error);
        return false;
    }
}

async function loadAnimationsFromDB() {
    if (!animationsCollection) return false;

    try {
        const result = await animationsCollection.get();
        if (result && Array.isArray(result.data)) {
            animations = result.data;
            console.log('从 IndexedDB 加载动画数据成功，数量:', animations.length);
            return true;
        }
        return false;
    } catch (error) {
        console.error('从 IndexedDB 加载动画数据失败:', error);
        return false;
    }
}

async function addAnimationToDB(animationData) {
    if (!animationsCollection) return false;

    try {
        await animationsCollection.add(animationData);
        console.log('添加动画到 IndexedDB 成功');
        return true;
    } catch (error) {
        console.error('添加动画到 IndexedDB 失败:', error);
        return false;
    }
}

async function updateAnimationInDB(docId, animationData) {
    if (!animationsCollection) return false;

    try {
        await animationsCollection.doc(docId).update(animationData);
        console.log('更新 IndexedDB 动画成功');
        return true;
    } catch (error) {
        console.error('更新 IndexedDB 动画失败:', error);
        return false;
    }
}

async function deleteAnimationFromDB(docId) {
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
                        console.log('从 IndexedDB 删除动画成功');
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
        console.error('从 IndexedDB 删除动画失败:', error);
        return false;
    }
}

// 章节数据结构 - 初始化为空对象，所有数据将从数据库加载
let chapterData = {};

// 章节数据集合
let chaptersCollection = null;

async function init() {
    bindEvents();
    await validatePassword();
}

function bindEvents() {
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
        if (dbReady) {
            await loadChaptersFromDB();
        }
        updateChapters();
    });
    document.getElementById('semester').addEventListener('change', async function() {
        // 从数据库重新加载章节数据，确保章节下拉列表与数据库同步
        if (dbReady) {
            await loadChaptersFromDB();
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
    if (dbReady) {
        await loadChaptersFromDB();
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
    if (dbReady) {
        await loadChaptersFromDB();
    }

    // 更新章节下拉列表
    updateChapters();
}

async function openEditAnimationModal(id) {
    console.log('openEditAnimationModal: 开始编辑, id:', id, '类型:', typeof id);
    console.log('openEditAnimationModal: 当前动画数量:', animations.length);
    console.log('openEditAnimationModal: 所有动画:', animations);
    
    // 尝试查找动画，同时比较字符串和数字形式的 id
    const animation = animations.find(item => {
        const itemId = item._id || item.id;
        const match = itemId === id || String(itemId) === String(id) || itemId == id;
        console.log('查找动画:', item.name, 'itemId:', itemId, '目标id:', id, '匹配:', match);
        return match;
    });
    
    if (animation) {
        console.log('openEditAnimationModal: 找到动画:', animation);
        document.getElementById('animation-id').value = animation._id || animation.id;
        document.getElementById('animation-name').value = animation.name;
        document.getElementById('animation-type').value = animation.type;

        // 从 chapterId 解析年级、学期、章节号
        let grade = '';
        let semester = '';
        let chapterName = '';

        if (animation.chapterId) {
            const parts = animation.chapterId.split('-');
            if (parts.length >= 3) {
                const gradeMap = { '1': '初一', '2': '初二', '3': '初三' };
                const semesterMap = { '1': '上册', '2': '下册' };
                grade = gradeMap[parts[0]] || '';
                semester = semesterMap[parts[1]] || '';

                // 从 chapterData 查找章节名称
                if (grade && semester && chapterData[grade] && chapterData[grade][semester]) {
                    const chapterNum = parseInt(parts[2]);
                    const chapters = chapterData[grade][semester];
                    const foundChapter = chapters.find(c => {
                        const cName = typeof c === 'object' ? c.name : c;
                        const match = cName.match(/第([一二三四五六七八九十百千]+)章/);
                        if (match) {
                            const num = chineseToNumber(match[1]);
                            return num === chapterNum;
                        }
                        return false;
                    });
                    if (foundChapter) {
                        chapterName = typeof foundChapter === 'object' ? foundChapter.name : foundChapter;
                    }
                }
            }
        }

        document.getElementById('grade').value = grade || '其他';
        document.getElementById('semester').value = semester || '其他';

        // 从数据库重新加载章节数据，确保章节下拉列表与数据库同步
        if (dbReady) {
            await loadChaptersFromDB();
        }

        updateChapters();

        const chapterSelect = document.getElementById('chapter');
        let chapterFound = false;

        for (let i = 0; i < chapterSelect.options.length; i++) {
            if (chapterSelect.options[i].value === chapterName) {
                chapterSelect.value = chapterName;
                chapterFound = true;
                break;
            }
        }

        if (!chapterFound && chapterName) {
            chapterSelect.value = '其他';
            document.getElementById('other-chapter-group').style.display = 'block';
            document.getElementById('other-chapter').value = chapterName;
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
        const existing = animations.find(item => {
            const itemId = item._id || item.id;
            return String(itemId) === String(editDocId) || itemId == editDocId;
        });
        if (existing && existing._id) {
            success = await updateAnimationInDB(existing._id, animationData);
            if (success) {
                const index = animations.findIndex(item => item._id === existing._id);
                if (index !== -1) {
                    animations[index] = { ...existing, ...animationData };
                }
            }
        } else {
            success = await addAnimationToDB(animationData);
            if (success) {
                animations.push(animationData);
            }
        }
    } else {
        success = await addAnimationToDB(animationData);
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

// 生成 chapterId，格式：年级-学期-章节号（如 1-1-1 表示初一上册第1章，2-2-21 表示初二下册第21章）
function generateChapterId(grade, semester, chapter) {
    const gradeMap = { '初一': 1, '初二': 2, '初三': 3, '其他': 0 };
    const semesterMap = { '上册': 1, '下册': 2, '其他': 0 };

    let chapterNum = 1;
    
    const chapterNumMatch = chapter.match(/第([零一二三四五六七八九十百千万]+)章/);
    if (chapterNumMatch) {
        const chineseNum = chapterNumMatch[1];
        chapterNum = chineseToNumber(chineseNum);
    }

    return `${gradeMap[grade]}-${semesterMap[semester]}-${chapterNum}`;
}

function chineseToNumber(chineseNum) {
    const numMap = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
        '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
        '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
        '二十一': 21, '二十二': 22, '二十三': 23, '二十四': 24, '二十五': 25,
        '二十六': 26, '二十七': 27, '二十八': 28, '二十九': 29, '三十': 30,
        '三十一': 31, '三十二': 32, '三十三': 33, '三十四': 34, '三十五': 35,
        '三十六': 36, '三十七': 37, '三十八': 38, '三十九': 39, '四十': 40,
        '四十一': 41, '四十二': 42, '四十三': 43, '四十四': 44, '四十五': 45,
        '四十六': 46, '四十七': 47, '四十八': 48, '四十九': 49, '五十': 50,
        '五十一': 51, '五十二': 52, '五十三': 53, '五十四': 54, '五十五': 55,
        '五十六': 56, '五十七': 57, '五十八': 58, '五十九': 59, '六十': 60,
        '六十一': 61, '六十二': 62, '六十三': 63, '六十四': 64, '六十五': 65,
        '六十六': 66, '六十七': 67, '六十八': 68, '六十九': 69, '七十': 70,
        '七十一': 71, '七十二': 72, '七十三': 73, '七十四': 74, '七十五': 75,
        '七十六': 76, '七十七': 77, '七十八': 78, '七十九': 79, '八十': 80,
        '八十一': 81, '八十二': 82, '八十三': 83, '八十四': 84, '八十五': 85,
        '八十六': 86, '八十七': 87, '八十八': 88, '八十九': 89, '九十': 90,
        '九十一': 91, '九十二': 92, '九十三': 93, '九十四': 94, '九十五': 95,
        '九十六': 96, '九十七': 97, '九十八': 98, '九十九': 99, '一百': 100
    };
    
    if (numMap[chineseNum]) {
        return numMap[chineseNum];
    }
    
    if (chineseNum.includes('十')) {
        if (chineseNum.startsWith('二十')) {
            const remainder = chineseNum.slice(2);
            return 20 + (numMap[remainder] || 0);
        } else if (chineseNum.startsWith('三十')) {
            const remainder = chineseNum.slice(2);
            return 30 + (numMap[remainder] || 0);
        } else if (chineseNum.startsWith('四十')) {
            const remainder = chineseNum.slice(2);
            return 40 + (numMap[remainder] || 0);
        } else if (chineseNum.startsWith('五十')) {
            const remainder = chineseNum.slice(2);
            return 50 + (numMap[remainder] || 0);
        } else if (chineseNum.startsWith('六十')) {
            const remainder = chineseNum.slice(2);
            return 60 + (numMap[remainder] || 0);
        } else if (chineseNum.startsWith('七十')) {
            const remainder = chineseNum.slice(2);
            return 70 + (numMap[remainder] || 0);
        } else if (chineseNum.startsWith('八十')) {
            const remainder = chineseNum.slice(2);
            return 80 + (numMap[remainder] || 0);
        } else if (chineseNum.startsWith('九十')) {
            const remainder = chineseNum.slice(2);
            return 90 + (numMap[remainder] || 0);
        } else if (chineseNum.startsWith('十')) {
            const remainder = chineseNum.slice(1);
            return 10 + (numMap[remainder] || 0);
        }
    }
    
    return 1; // 默认返回1
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
                    <button class="btn btn-secondary edit-btn" data-id="${docId}">编辑</button>
                    <button class="btn btn-danger delete-btn" data-id="${docId}">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    listContainer.appendChild(table);

    // 使用事件委托绑定编辑和删除按钮
    tbody.addEventListener('click', function(e) {
        const target = e.target;
        if (target.classList.contains('edit-btn')) {
            const id = target.getAttribute('data-id');
            console.log('编辑按钮点击, id:', id);
            editAnimation(id);
        } else if (target.classList.contains('delete-btn')) {
            const id = target.getAttribute('data-id');
            console.log('删除按钮点击, id:', id);
            deleteAnimation(id);
        }
    });

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
            const success = await deleteAnimationFromDB(id);

            if (success) {
                // 重新加载数据，确保前端显示的动画列表与数据库中的数据一致
                await loadAnimationsFromDB();
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
    const grade = document.getElementById('filter-grade').value;
    const semester = document.getElementById('filter-semester').value;
    const chapter = document.getElementById('filter-chapter').value;

    filteredAnimations = animations.filter(animation => {
        const matchesSearch = animation.name.toLowerCase().includes(searchTerm);
        const matchesType = !type || animation.type === type;
        
        // 从 chapterId 解析年级、学期、章节
        let matchesGrade = true;
        let matchesSemester = true;
        let matchesChapter = true;
        
        if (animation.chapterId && (grade || semester || chapter)) {
            const parts = animation.chapterId.split('-');
            if (parts.length >= 3) {
                const gradeMap = { '1': '初一', '2': '初二', '3': '初三' };
                const semesterMap = { '1': '上册', '2': '下册' };
                
                const animationGrade = gradeMap[parts[0]];
                const animationSemester = semesterMap[parts[1]];
                
                // 从 chapterData 查找章节名称（现在 parts[2] 直接是章节号）
                let animationChapter = '';
                if (animationGrade && animationSemester && chapterData[animationGrade] && chapterData[animationGrade][animationSemester]) {
                    const chapters = chapterData[animationGrade][animationSemester];
                    const chapterNum = parseInt(parts[2]);
                    // 在章节列表中查找对应章节号的章节
                    const foundChapter = chapters.find(c => {
                        const chapterName = typeof c === 'object' ? c.name : c;
                        const match = chapterName.match(/第([一二三四五六七八九十百千]+)章/);
                        if (match) {
                            const num = chineseToNumber(match[1]);
                            return num === chapterNum;
                        }
                        return false;
                    });
                    if (foundChapter) {
                        animationChapter = typeof foundChapter === 'object' ? foundChapter.name : foundChapter;
                    }
                }
                
                if (grade) {
                    matchesGrade = animationGrade === grade;
                }
                if (semester) {
                    matchesSemester = animationSemester === semester;
                }
                if (chapter) {
                    matchesChapter = animationChapter === chapter;
                }
            }
        }

        return matchesSearch && matchesType && matchesGrade && matchesSemester && matchesChapter;
    });

    currentPage = 1;
    renderAnimationList();
    updateStats();
}

function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-grade').value = '';
    document.getElementById('filter-semester').value = '';
    document.getElementById('filter-chapter').value = '';

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
            const success = await deleteAnimationFromDB(id);
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
                const success = await deleteAnimationFromDB(existing._id);
                if (!success) allSuccess = false;
            }
        }

        for (const animationData of updatedAnimations) {
            const existing = animations.find(a => a.id === animationData.id);
            if (existing && existing._id) {
                const success = await updateAnimationInDB(existing._id, animationData);
                if (!success) allSuccess = false;
            } else {
                const success = await addAnimationToDB(animationData);
                if (!success) allSuccess = false;
            }
        }

        await loadAnimationsFromDB();

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

async function loadChaptersFromDB() {
    if (!chaptersCollection) return false;

    try {
        const result = await chaptersCollection.get();
        if (result && Array.isArray(result.data) && result.data.length > 0) {
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
                console.log('从 IndexedDB 加载章节数据成功');
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('从 IndexedDB 加载章节数据失败:', error);
        return false;
    }
}

async function saveChaptersToDB() {
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
                                // 从章节名称中提取章节号（如"第五十章"提取50）
                                const chapterName = typeof chapter === 'string' ? chapter : chapter.name;
                                const chapterNumMatch = chapterName.match(/第([零一二三四五六七八九十百千万]+)章/);
                                let chapterNum = index + 1; // 默认使用索引
                                if (chapterNumMatch) {
                                    const chineseNum = chapterNumMatch[1];
                                    chapterNum = chineseToNumber(chineseNum);
                                }
                                const chapterId = `${gradeMap[grade]}-${semesterMap[semester]}-${chapterNum}`;
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
        console.log('章节数据保存到 IndexedDB 成功');
        return true;
    } catch (error) {
        console.error('章节数据保存到 IndexedDB 失败:', error);
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
        return false;
    }
}

async function openChaptersModal() {
    document.getElementById('chapters-modal').style.display = 'block';

    // 从数据库重新加载章节数据，确保显示的是最新的章节信息
    if (dbReady) {
        await loadChaptersFromDB();
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

    // 确保IndexedDB已初始化
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

    // 保存到IndexedDB
    const success = await saveChaptersToDB();

    if (success) {
        document.getElementById('chapter-name').value = '';
        renderChapterList();
        showMessage('章节添加成功！');
    } else {
        showMessage('章节添加失败，请重试', 'error');
    }
}

async function deleteChapter(grade, semester, index) {
    // 确保IndexedDB已初始化
    if (!chaptersCollection) {
        showMessage('系统初始化失败，请刷新页面重试', 'error');
        console.error('chaptersCollection 未初始化');
        return;
    }

    if (await showConfirm('确定要删除这个章节吗？')) {
        // 删除章节
        chapterData[grade][semester].splice(index, 1);

        // 保存到IndexedDB
        const success = await saveChaptersToDB();

        if (success) {
            renderChapterList();
            showMessage('章节删除成功！');
        } else {
            showMessage('章节删除失败，请重试', 'error');
        }
    }
}

function editChapter(grade, semester, index, oldName) {
    // 确保IndexedDB已初始化
    if (!chaptersCollection) {
        showMessage('系统初始化失败，请刷新页面重试', 'error');
        console.error('chaptersCollection 未初始化');
        return;
    }

    const newName = prompt('请输入新的章节名称:', oldName);
    if (newName && newName.trim() !== '') {
        // 更新章节名称
        chapterData[grade][semester][index] = newName.trim();

        // 保存到IndexedDB
        saveChaptersToDB().then(success => {
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
    console.log('开始初始化 IndexedDB...');
    let ready = false;
    try {
        ready = await initDB();
    } catch (error) {
        console.error('IndexedDB 初始化出错:', error);
    }
    console.log('IndexedDB 初始化结果:', ready);

    if (ready) {
        console.log('开始加载动画数据...');
        try {
            const animationsLoaded = await loadAnimationsFromDB();
            console.log('动画数据加载结果:', animationsLoaded);
        } catch (error) {
            console.error('加载动画数据出错:', error);
        }

        console.log('开始加载章节数据...');
        try {
            const chaptersLoaded = await loadChaptersFromDB();
            console.log('章节数据加载结果:', chaptersLoaded);
            console.log('当前章节数据:', chapterData);
        } catch (error) {
            console.error('加载章节数据出错:', error);
        }
    }

    updateChapters();
    filteredAnimations = [...animations];
    updateStats();
    renderAnimationList();
}

// 修复所有动画的 chapterId
async function fixChapterIds() {
    if (animations.length === 0) {
        showMessage('没有动画数据需要修复');
        return;
    }

    console.log('开始修复 chapterId...');
    console.log('当前动画数量:', animations.length);
    console.log('当前章节数据:', chapterData);

    let fixedCount = 0;

    for (const animation of animations) {
        console.log('处理动画:', animation.name, '当前 chapterId:', animation.chapterId);

        // 从 URL 或名称推断年级、学期、章节
        let grade = '';
        let semester = '';
        let chapter = '';

        // 尝试从 URL 解析
        if (animation.url) {
            const urlMatch = animation.url.match(/animations\/(初一|初二|初三)\/(上册|下册)\/([^/]+)/);
            if (urlMatch) {
                grade = urlMatch[1];
                semester = urlMatch[2];
                chapter = urlMatch[3].replace(/_/g, ' ');
            }
        }

        // 如果 URL 解析失败，尝试从 chapterId 解析
        if (!grade && animation.chapterId) {
            const parts = animation.chapterId.split('-');
            if (parts.length >= 3) {
                const gradeMap = { '1': '初一', '2': '初二', '3': '初三' };
                const semesterMap = { '1': '上册', '2': '下册' };
                grade = gradeMap[parts[0]];
                semester = semesterMap[parts[1]];

                // 从 chapterData 查找章节名称（现在 parts[2] 直接是章节号）
                if (grade && semester && chapterData[grade] && chapterData[grade][semester]) {
                    const chapterNum = parseInt(parts[2]);
                    // 在章节列表中查找对应章节号的章节
                    const chapters = chapterData[grade][semester];
                    const foundChapter = chapters.find(c => {
                        const chapterName = typeof c === 'object' ? c.name : c;
                        const match = chapterName.match(/第([一二三四五六七八九十百千]+)章/);
                        if (match) {
                            const num = chineseToNumber(match[1]);
                            return num === chapterNum;
                        }
                        return false;
                    });
                    if (foundChapter) {
                        chapter = typeof foundChapter === 'object' ? foundChapter.name : foundChapter;
                    }
                }
            }
        }

        if (!grade || !semester || !chapter) {
            console.log('无法解析动画的年级/学期/章节:', animation.name);
            continue;
        }

        // 生成正确的 chapterId（使用新的基于章节号的逻辑）
        const newChapterId = generateChapterId(grade, semester, chapter);
        console.log('生成新的 chapterId:', newChapterId, '年级:', grade, '学期:', semester, '章节:', chapter);

        if (newChapterId !== animation.chapterId) {
            // 更新动画数据
            const updatedData = {
                ...animation,
                chapterId: newChapterId
            };

            try {
                if (animation._id) {
                    await updateAnimationInDB(animation._id, updatedData);
                    // 更新本地数组
                    const index = animations.findIndex(a => a._id === animation._id);
                    if (index !== -1) {
                        animations[index] = updatedData;
                    }
                }
                fixedCount++;
                console.log('已修复:', animation.name, '新 chapterId:', newChapterId);
            } catch (error) {
                console.error('修复失败:', animation.name, error);
            }
        }
    }

    // 重新渲染列表
    filteredAnimations = [...animations];
    renderAnimationList();
    updateStats();

    showMessage(`修复完成！共修复 ${fixedCount} 个动画的章节ID。`);
    console.log('修复完成，共修复', fixedCount, '个动画');
}

// 清除章节数据缓存，让系统从代码重新加载默认数据
async function clearChapterData() {
    if (!await showConfirm('确定要清除章节数据缓存吗？这将删除数据库中存储的错误章节数据，系统会自动从代码加载正确的章节结构。')) {
        return;
    }

    console.log('开始清除章节数据缓存...');

    try {
        if (!chaptersCollection) {
            showMessage('数据库未初始化，请刷新页面后重试', 'error');
            return;
        }

        // 获取所有章节数据文档
        const result = await chaptersCollection.get();
        
        if (result && result.data && Array.isArray(result.data)) {
            // 删除所有章节数据文档
            for (const doc of result.data) {
                if (doc._id) {
                    await chaptersCollection.doc(doc._id).remove();
                    console.log('已删除章节数据文档:', doc._id);
                }
            }
        }

        // 同时清除 localStorage 中的缓存
        localStorage.removeItem('chapterData');
        
        // 重置内存中的章节数据为空对象，让系统重新初始化
        chapterData = {};
        
        showMessage('章节数据缓存已清除！请刷新页面，系统会自动加载正确的章节数据。');
        console.log('章节数据缓存清除成功');
        
    } catch (error) {
        console.error('清除章节数据缓存时出错:', error);
        showMessage('清除章节数据缓存时出错: ' + error.message, 'error');
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
                // 从chapterData查找章节名称（现在 parts[2] 直接是章节号）
                if (grade && semester && chapterData[grade] && chapterData[grade][semester]) {
                    const chapters = chapterData[grade][semester];
                    const chapterNum = parseInt(parts[2]);
                    // 在章节列表中查找对应章节号的章节
                    const foundChapter = chapters.find(c => {
                        const chapterName = typeof c === 'object' ? c.name : c;
                        const match = chapterName.match(/第([一二三四五六七八九十百千]+)章/);
                        if (match) {
                            const num = chineseToNumber(match[1]);
                            return num === chapterNum;
                        }
                        return false;
                    });
                    if (foundChapter) {
                        chapter = typeof foundChapter === 'object' ? foundChapter.name : foundChapter;
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

                // 保存到IndexedDB
                try {
                    await addAnimationToDB(animationData);
                    successCount++;
                } catch (error) {
                    console.error('保存动画失败:', animationData, error);
                    errorCount++;
                }
            }

            // 重新加载动画数据
            await loadAnimationsFromDB();
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
