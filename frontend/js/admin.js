// 全局变量
let animations = [];
let filteredAnimations = [...animations];
let currentPage = 1;
const itemsPerPage = 10;
const DEFAULT_PASSWORD = '202486';

// 检测是否在部署环境（腾讯云）
const isDeployed = window.location.host.includes('cloudbase') || window.location.host.includes('tencentcloud');

// CloudBase配置
let app = null;
let db = null;
let animationsCollection = null;

// 初始化CloudBase
function initCloudBase() {
    console.log('开始初始化CloudBase...');
    console.log('部署环境检测:', isDeployed);
    console.log('tcb是否存在:', typeof tcb !== 'undefined');
    
    if (isDeployed) {
        try {
            if (typeof tcb === 'undefined') {
                console.error('CloudBase SDK未加载');
                return;
            }
            
            app = tcb.init({
                env: 'math-animations-7ggh9q6lf3f13465' // 使用你的环境ID
            });
            console.log('CloudBase app初始化成功:', app);
            
            db = app.database();
            console.log('数据库初始化成功:', db);
            
            animationsCollection = db.collection('animations');
            console.log('集合初始化成功:', animationsCollection);
            
            console.log('CloudBase初始化成功');
        } catch (error) {
            console.error('CloudBase初始化失败:', error);
        }
    } else {
        console.log('不在部署环境，跳过CloudBase初始化');
    }
}

// 从JSON文件加载动画数据
async function loadAnimationsFromJSON() {
    try {
        const response = await fetch('animations.json');
        if (!response.ok) {
            throw new Error('Failed to load animations.json');
        }
        const data = await response.json();
        animations = data;
        // 同步到本地存储
        localStorage.setItem('animations', JSON.stringify(animations));
        console.log('从JSON文件加载动画数据成功:', animations);
        return true;
    } catch (error) {
        console.error('加载动画数据失败:', error);
        // 如果JSON文件加载失败，使用本地存储的数据
        animations = JSON.parse(localStorage.getItem('animations')) || [];
        return false;
    }
}

// 从CloudBase数据库加载动画数据
async function loadAnimationsFromCloudBase() {
    try {
        if (!isDeployed) {
            console.log('不在部署环境，跳过数据库加载');
            return false;
        }
        
        if (!animationsCollection) {
            console.log('CloudBase未初始化，跳过数据库加载');
            return false;
        }
        
        console.log('开始从CloudBase数据库加载数据...');
        const result = await animationsCollection.get();
        console.log('CloudBase返回结果:', result);
        
        animations = result.data;
        console.log('从CloudBase数据库加载到的动画数据:', animations);
        
        // 同步到本地存储
        localStorage.setItem('animations', JSON.stringify(animations));
        console.log('动画数据已同步到本地存储');
        return true;
    } catch (error) {
        console.error('从CloudBase数据库加载动画数据失败:', error);
        // 如果数据库加载失败，尝试从JSON文件加载
        return await loadAnimationsFromJSON();
    }
}

// 保存动画数据到CloudBase数据库
async function saveAnimationsToCloudBase() {
    try {
        if (!isDeployed || !animationsCollection) {
            console.log('不在部署环境或CloudBase未初始化，跳过数据库保存');
            return false;
        }
        
        // 先清空现有数据
        const countResult = await animationsCollection.count();
        if (countResult.total > 0) {
            const batch = db.batch();
            const records = await animationsCollection.get();
            records.data.forEach(record => {
                batch.remove(record._id);
            });
            await batch.commit();
        }
        
        // 批量添加新数据
        if (animations.length > 0) {
            const batch = db.batch();
            animations.forEach(animation => {
                batch.add(animationsCollection, animation);
            });
            await batch.commit();
        }
        
        console.log('动画数据已保存到CloudBase数据库');
        return true;
    } catch (error) {
        console.error('保存动画数据到CloudBase数据库失败:', error);
        return false;
    }
}

// 保存动画数据到JSON文件
async function saveAnimationsToJSON() {
    try {
        // 这里只是模拟保存，实际需要后端API支持
        // 在前端环境中，我们无法直接写入JSON文件
        // 所以我们只是更新本地存储和显示成功消息
        localStorage.setItem('animations', JSON.stringify(animations));
        console.log('动画数据已保存到本地存储:', animations);
        return true;
    } catch (error) {
        console.error('保存动画数据失败:', error);
        return false;
    }
}

// 章节数据
const chapterData = {
    '初一': {
        '上册': [
            '第一章 有理数',
            '第二章 有理数的运算',
            '第三章 代数式',
            '第四章 整式的加减',
            '第五章 一元一次方程',
            '第六章 几何图形初步'
        ],
        '下册': [
            '第七章 相交线与平行线',
            '第八章 实数',
            '第九章 平面直角坐标系',
            '第十章 二元一次方程组',
            '第十一章 不等式与不等式组',
            '第十二章 数据的收集、整理与描述'
        ]
    },
    '初二': {
        '上册': [
            '第十三章 三角形',
            '第十四章 全等三角形',
            '第十五章 轴对称',
            '第十六章 整式的乘法',
            '第十七章 因式分解',
            '第十八章 分式'
        ],
        '下册': [
            '第十九章 二次根式',
            '第二十章 勾股定理',
            '第二十一章 四边形',
            '第二十二章 函数',
            '第二十三章 一次函数',
            '第二十四章 数据的分析'
        ]
    },
    '初三': {
        '上册': [
            '第二十一章 一元二次方程',
            '第二十二章 二次函数',
            '第二十三章 旋转',
            '第二十四章 圆',
            '第二十五章 概率初步'
        ],
        '下册': [
            '第二十六章 反比例函数',
            '第二十七章 相似',
            '第二十八章 锐角三角函数',
            '第二十九章 投影与视图'
        ]
    }
};

// 初始化函数
function init() {
    bindEvents();
    // 初始状态下不加载管理内容，等待密码验证
}

// 绑定事件
function bindEvents() {
    // 密码表单提交
    document.getElementById('password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        validatePassword();
    });
    
    // 动画类型切换
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
    
    // 年级或学期变化时更新章节
    document.getElementById('grade').addEventListener('change', updateChapters);
    document.getElementById('semester').addEventListener('change', updateChapters);
    
    // 筛选区域的年级或学期变化时更新章节
    document.getElementById('filter-grade').addEventListener('change', updateFilterChapters);
    document.getElementById('filter-semester').addEventListener('change', updateFilterChapters);
    
    // 章节选择变化时显示/隐藏其他章节输入框
    document.getElementById('chapter').addEventListener('change', function() {
        const chapter = this.value;
        if (chapter === '其他') {
            document.getElementById('other-chapter-group').style.display = 'block';
        } else {
            document.getElementById('other-chapter-group').style.display = 'none';
        }
    });
    
    // 表单提交
    document.getElementById('animation-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveAnimation();
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('animation-modal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

// 更新筛选区域的章节选择
function updateFilterChapters() {
    const grade = document.getElementById('filter-grade').value;
    const semester = document.getElementById('filter-semester').value;
    const chapterSelect = document.getElementById('filter-chapter');
    
    // 清空现有选项
    chapterSelect.innerHTML = '<option value="">所有章节</option>';
    
    // 添加对应章节
    if (grade && semester && grade !== '其他' && semester !== '其他' && chapterData[grade] && chapterData[grade][semester]) {
        chapterData[grade][semester].forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = chapter;
            chapterSelect.appendChild(option);
        });
    }
}

// 打开添加动画模态框
function openAddAnimationModal() {
    document.getElementById('animation-id').value = '';
    document.getElementById('animation-form').reset();
    document.getElementById('ggb-url-group').style.display = 'block';
    document.getElementById('html-file-group').style.display = 'none';
    document.getElementById('other-chapter-group').style.display = 'none';
    document.getElementById('modal-title').textContent = '添加新动画';
    document.getElementById('animation-modal').style.display = 'block';
}

// 打开编辑动画模态框
function openEditAnimationModal(id) {
    const animation = animations.find(item => item.id === id);
    if (animation) {
        document.getElementById('animation-id').value = animation.id;
        document.getElementById('animation-name').value = animation.name;
        document.getElementById('animation-type').value = animation.type;
        document.getElementById('grade').value = animation.grade;
        document.getElementById('semester').value = animation.semester;
        
        // 更新章节选择
        updateChapters();
        
        // 检查动画的章节是否在当前章节列表中
        const chapterSelect = document.getElementById('chapter');
        let chapterFound = false;
        
        for (let i = 0; i < chapterSelect.options.length; i++) {
            if (chapterSelect.options[i].value === animation.chapter) {
                chapterSelect.value = animation.chapter;
                chapterFound = true;
                break;
            }
        }
        
        // 如果章节不在列表中，选择"其他"并显示输入框
        if (!chapterFound) {
            chapterSelect.value = '其他';
            document.getElementById('other-chapter-group').style.display = 'block';
            document.getElementById('other-chapter').value = animation.chapter;
        } else {
            document.getElementById('other-chapter-group').style.display = 'none';
        }
        
        if (animation.type === 'ggb') {
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

// 关闭模态框
function closeModal() {
    document.getElementById('animation-modal').style.display = 'none';
}

// 更新章节选择
function updateChapters() {
    const grade = document.getElementById('grade').value;
    const semester = document.getElementById('semester').value;
    const chapterSelect = document.getElementById('chapter');
    
    // 清空现有选项
    chapterSelect.innerHTML = '<option value="">请选择章节</option>';
    
    // 添加对应章节
    if (grade && semester && grade !== '其他' && semester !== '其他' && chapterData[grade] && chapterData[grade][semester]) {
        chapterData[grade][semester].forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = chapter;
            chapterSelect.appendChild(option);
        });
    }
    
    // 添加"其他"选项
    const otherOption = document.createElement('option');
    otherOption.value = '其他';
    otherOption.textContent = '其他';
    chapterSelect.appendChild(otherOption);
    
    // 隐藏其他章节输入框
    document.getElementById('other-chapter-group').style.display = 'none';
}

// 保存动画
async function saveAnimation() {
    const id = document.getElementById('animation-id').value;
    const name = document.getElementById('animation-name').value;
    const type = document.getElementById('animation-type').value;
    const grade = document.getElementById('grade').value;
    const semester = document.getElementById('semester').value;
    let chapter = document.getElementById('chapter').value;
    
    // 如果选择了"其他"，使用用户输入的章节名称
    if (chapter === '其他') {
        chapter = document.getElementById('other-chapter').value || '其他';
    }
    
    let url;
    if (type === 'ggb' || type === 'external') {
        url = document.getElementById('ggb-url').value;
    } else {
        // 按照年级、学期、章节组织路径
        const gradePath = grade === '其他' ? '其他' : grade;
        const semesterPath = semester === '其他' ? '其他' : semester;
        const chapterPath = chapter === '其他' ? '其他' : chapter.replace(/\s+/g, '_');
        url = `animations/${gradePath}/${semesterPath}/${chapterPath}/${name}.html`;
    }
    
    if (id) {
        // 编辑现有动画
        const index = animations.findIndex(item => item.id === id);
        if (index !== -1) {
            animations[index] = {
                id,
                name,
                type,
                url,
                grade,
                semester,
                chapter
            };
        }
    } else {
        // 添加新动画
        const newId = generateId(grade, semester, chapter);
        animations.push({
            id: newId,
            name,
            type,
            url,
            grade,
            semester,
            chapter
        });
    }
    
    // 保存到本地存储
    localStorage.setItem('animations', JSON.stringify(animations));
    
    // 在部署环境中，保存到CloudBase数据库
    if (isDeployed) {
        await saveAnimationsToCloudBase();
    }
    
    // 更新过滤后的动画列表
    applyFilters();
    
    // 关闭模态框
    closeModal();
    
    // 重新渲染列表
    renderAnimationList();
    updateStats();
    
    showMessage('保存成功！');
}

// 生成动画ID
function generateId(grade, semester, chapter) {
    const gradeMap = { '初一': 1, '初二': 2, '初三': 3, '其他': 0 };
    const semesterMap = { '上册': 1, '下册': 2, '其他': 0 };
    const chapterIndex = Math.floor(Math.random() * 100);
    const animationIndex = Math.floor(Math.random() * 10);
    
    return `${gradeMap[grade]}-${semesterMap[semester]}-${chapterIndex}-${animationIndex}`;
}

// 渲染动画列表
function renderAnimationList() {
    const listContainer = document.getElementById('animation-list');
    listContainer.innerHTML = '';
    
    if (filteredAnimations.length === 0) {
        listContainer.innerHTML = '<p>暂无动画资源</p>';
        renderPagination();
        return;
    }
    
    // 计算当前页显示的动画
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageAnimations = filteredAnimations.slice(startIndex, endIndex);
    
    // 创建表格
    const table = document.createElement('table');
    table.className = 'animation-table';
    
    // 表头
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th class="checkbox-cell"><input type="checkbox" id="select-all"></th>
            <th>动画名称</th>
            <th>类型</th>
            <th>年级</th>
            <th>学期</th>
            <th>章节</th>
            <th>URL</th>
            <th>操作</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // 表体
    const tbody = document.createElement('tbody');
    currentPageAnimations.forEach(animation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="checkbox-cell"><input type="checkbox" class="animation-checkbox" data-id="${animation.id}"></td>
            <td>${animation.name}</td>
            <td>${animation.type === 'ggb' ? 'GGB在线动画' : animation.type === 'external' ? '外部网站动画' : '本地HTML动画'}</td>
            <td>${animation.grade}</td>
            <td>${animation.semester}</td>
            <td>${animation.chapter}</td>
            <td><a href="${animation.url}" target="_blank">${animation.url}</a></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="editAnimation('${animation.id}')">编辑</button>
                    <button class="btn btn-danger" onclick="deleteAnimation('${animation.id}')">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    listContainer.appendChild(table);
    
    // 绑定全选/取消全选事件
    document.getElementById('select-all').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.animation-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
    
    // 渲染分页控件
    renderPagination();
}

// 编辑动画
function editAnimation(id) {
    openEditAnimationModal(id);
}

// 删除动画
async function deleteAnimation(id) {
    if (await showConfirm('确定要删除这个动画吗？')) {
        animations = animations.filter(item => item.id !== id);
        localStorage.setItem('animations', JSON.stringify(animations));
        applyFilters();
        renderAnimationList();
        updateStats();
        showMessage('删除成功！');
    }
}

// 应用过滤
function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const type = document.getElementById('filter-type').value;
    const grade = document.getElementById('filter-grade').value;
    const semester = document.getElementById('filter-semester').value;
    const chapter = document.getElementById('filter-chapter').value;
    
    filteredAnimations = animations.filter(animation => {
        const matchesSearch = animation.name.toLowerCase().includes(searchTerm);
        const matchesType = !type || animation.type === type;
        const matchesGrade = !grade || animation.grade === grade;
        const matchesSemester = !semester || animation.semester === semester;
        const matchesChapter = !chapter || animation.chapter === chapter;
        
        return matchesSearch && matchesType && matchesGrade && matchesSemester && matchesChapter;
    });
    
    currentPage = 1;
    renderAnimationList();
    updateStats();
}

// 重置过滤
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

// 更新统计信息
function updateStats() {
    const statsElement = document.getElementById('animation-stats');
    statsElement.textContent = `共 ${animations.length} 个动画，当前显示 ${filteredAnimations.length} 个`;
}

// 渲染分页控件
function renderPagination() {
    const paginationElement = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredAnimations.length / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationElement.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 上一页按钮
    paginationHTML += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">上一页</button>`;
    
    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<button ${i === currentPage ? 'class="active"' : ''} onclick="goToPage(${i})")">${i}</button>`;
    }
    
    // 下一页按钮
    paginationHTML += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">下一页</button>`;
    
    paginationElement.innerHTML = paginationHTML;
}

// 跳转到指定页面
function goToPage(page) {
    currentPage = page;
    renderAnimationList();
}

// 批量删除
async function batchDelete() {
    const checkboxes = document.querySelectorAll('.animation-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(checkbox => checkbox.getAttribute('data-id'));
    
    if (selectedIds.length === 0) {
        showMessage('请选择要删除的动画');
        return;
    }
    
    if (await showConfirm(`确定要删除选中的 ${selectedIds.length} 个动画吗？`)) {
        animations = animations.filter(animation => !selectedIds.includes(animation.id));
        localStorage.setItem('animations', JSON.stringify(animations));
        
        // 在部署环境中，保存到CloudBase数据库
        if (isDeployed) {
            await saveAnimationsToCloudBase();
        }
        
        applyFilters();
        renderAnimationList();
        updateStats();
        showMessage('批量删除成功！');
    }
}

// 打开更新数据模态框
function openUpdateDataModal() {
    // 将当前动画数据转换为JSON格式并显示在文本框中
    const jsonData = JSON.stringify(animations, null, 2);
    document.getElementById('json-data').value = jsonData;
    document.getElementById('update-data-modal').style.display = 'block';
}

// 关闭更新数据模态框
function closeUpdateDataModal() {
    document.getElementById('update-data-modal').style.display = 'none';
}

// 更新动画数据
async function updateAnimationsData() {
    try {
        const jsonData = document.getElementById('json-data').value;
        const updatedAnimations = JSON.parse(jsonData);
        
        // 验证数据格式
        if (!Array.isArray(updatedAnimations)) {
            throw new Error('数据格式错误，必须是数组');
        }
        
        // 更新动画数据
        animations = updatedAnimations;
        
        // 保存到本地存储
        localStorage.setItem('animations', JSON.stringify(animations));
        
        // 在部署环境中，保存到CloudBase数据库
        if (isDeployed) {
            await saveAnimationsToCloudBase();
        }
        
        // 重新加载数据
        filteredAnimations = [...animations];
        applyFilters();
        renderAnimationList();
        updateStats();
        
        // 关闭模态框
        closeUpdateDataModal();
        
        showMessage('数据更新成功！');
    } catch (error) {
        console.error('更新数据失败:', error);
        showMessage('数据格式错误，请检查JSON格式', 'error');
    }
}

// 验证密码
async function validatePassword() {
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('password-error');
    
    if (password === DEFAULT_PASSWORD) {
        // 密码正确，显示管理后台
        document.getElementById('password-modal').style.display = 'none';
        document.querySelector('.admin-container').style.display = 'block';
        
        // 初始化CloudBase
        initCloudBase();
        
        // 优先从CloudBase数据库加载数据
        const cloudLoaded = await loadAnimationsFromCloudBase();
        // 如果CloudBase数据库加载失败，从JSON文件加载
        if (!cloudLoaded) {
            await loadAnimationsFromJSON();
        }
        
        // 初始化管理后台内容
        updateChapters();
        filteredAnimations = [...animations];
        updateStats();
        renderAnimationList();
    } else {
        // 密码错误，显示错误信息
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);