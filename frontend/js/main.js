// 全局变量
let currentAnimation = null;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let animations = JSON.parse(localStorage.getItem('animations')) || [];

// 默认动画数据
const defaultAnimations = [
    {
        id: '1-1-01-01',
        name: '有理数的加减法',
        type: 'ggb',
        url: 'https://www.geogebra.org/classic/b7m8g3k2',
        grade: '初一',
        semester: '上册',
        chapter: '第一章 有理数'
    },
    {
        id: '1-1-04-01',
        name: '整式的概念',
        type: 'html',
        url: 'animations/初一/上册/第四章_整式的加减/整式的概念.html',
        grade: '初一',
        semester: '上册',
        chapter: '第四章 整式的加减'
    },
    {
        id: '1-1-02-01',
        name: '一元一次方程的解法',
        type: 'ggb',
        url: 'https://www.geogebra.org/classic/w5h7f9k3',
        grade: '初一',
        semester: '上册',
        chapter: '第五章 一元一次方程'
    },
    {
        id: '1-2-01-01',
        name: '相交线与平行线',
        type: 'ggb',
        url: 'https://www.geogebra.org/classic/d4j6h7k1',
        grade: '初一',
        semester: '下册',
        chapter: '第七章 相交线与平行线'
    },
    {
        id: '1-2-02-01',
        name: '坐标系的建立',
        type: 'html',
        url: 'animations/初一/下册/第九章_平面直角坐标系/坐标系的建立.html',
        grade: '初一',
        semester: '下册',
        chapter: '第九章 平面直角坐标系'
    },
    {
        id: '2-1-01-01',
        name: '三角形的内角和',
        type: 'ggb',
        url: 'https://www.geogebra.org/classic/v8n5m2k9',
        grade: '初二',
        semester: '上册',
        chapter: '第十三章 三角形'
    },
    {
        id: '2-1-03-01',
        name: '笛卡尔心形曲线',
        type: 'html',
        url: 'animations/初二/上册/第十五章_轴对称/笛卡尔心形曲线.html',
        grade: '初二',
        semester: '上册',
        chapter: '第十五章 轴对称'
    },
    {
        id: '2-1-03-02',
        name: '轴对称图形验证工具',
        type: 'html',
        url: 'animations/初二/上册/第十五章_轴对称/轴对称图形验证工具.html',
        grade: '初二',
        semester: '上册',
        chapter: '第十五章 轴对称'
    },
    {
        id: '2-2-01-01',
        name: '勾股定理演示',
        type: 'ggb',
        url: 'https://www.geogebra.org/classic/c3d7f8k5',
        grade: '初二',
        semester: '下册',
        chapter: '第二十章 勾股定理'
    },
    {
        id: '2-2-02-01',
        name: '四边形及其内角和',
        type: 'html',
        url: 'animations/初二/下册/第二十一章_四边形/四边形及其内角和.html',
        grade: '初二',
        semester: '下册',
        chapter: '第二十一章 四边形'
    },
    {
        id: '3-1-01-01',
        name: '二次函数图像',
        type: 'ggb',
        url: 'https://www.geogebra.org/classic/k6m3h2k7',
        grade: '初三',
        semester: '上册',
        chapter: '第二十二章 二次函数'
    }
];

// 初始化默认动画数据
const DATA_VERSION = '4'; // 数据版本号，更新默认数据时递增
const storedVersion = localStorage.getItem('animations_version');

if (animations.length === 0 || storedVersion !== DATA_VERSION) {
    animations = defaultAnimations;
    localStorage.setItem('animations', JSON.stringify(animations));
    localStorage.setItem('animations_version', DATA_VERSION);
    console.log('已初始化默认动画数据 (版本:', DATA_VERSION, '):', animations);
}

// 构建教材体系数据
function buildTextbookData() {
    console.log('开始构建教材体系数据...');
    const textbookData = {
        "初一": { "上册": {}, "下册": {} },
        "初二": { "上册": {}, "下册": {} },
        "初三": { "上册": {}, "下册": {} }
    };
    
    console.log('当前动画数据:', animations);
    
    // 遍历所有动画，构建数据结构
    animations.forEach(animation => {
        const { grade, semester, chapter, id, name, type, url } = animation;
        console.log('处理动画:', { grade, semester, chapter, id, name });
        
        if (textbookData[grade] && textbookData[grade][semester]) {
            if (!textbookData[grade][semester][chapter]) {
                textbookData[grade][semester][chapter] = [];
            }
            textbookData[grade][semester][chapter].push({ id, name, type, url });
        } else {
            console.warn('无效的教材数据:', { grade, semester });
        }
    });
    
    console.log('构建完成的教材数据:', textbookData);
    return textbookData;
}

// 初始化函数
function init() {
    console.log('开始初始化应用...');
    renderNavigation();
    bindEvents();
    loadInitialAnimation();
    console.log('应用初始化完成');
}

// 渲染导航菜单
function renderNavigation() {
    console.log('开始渲染导航菜单...');
    const navMenu = document.getElementById('nav-menu');
    let html = '';
    const textbookData = buildTextbookData();
    
    console.log('渲染导航菜单，教材数据:', textbookData);
    
    for (const grade in textbookData) {
        html += `<ul>
            <li>
                <a href="#" class="grade-link" data-grade="${grade}">${grade}</a>
                <ul class="sub-menu">`;
        
        for (const semester in textbookData[grade]) {
            html += `<li>
                <a href="#" class="semester-link" data-grade="${grade}" data-semester="${semester}">${semester}</a>
                <ul class="sub-sub-menu">`;
            
            for (const chapter in textbookData[grade][semester]) {
                html += `<li>
                    <a href="#" class="chapter-link" data-grade="${grade}" data-semester="${semester}" data-chapter="${chapter}">${chapter}</a>
                    <ul class="animation-list">`;
                
                textbookData[grade][semester][chapter].forEach(animation => {
                    html += `<li>
                        <a href="#" class="animation-link" data-id="${animation.id}" data-type="${animation.type}" data-url="${animation.url}">${animation.name}</a>
                    </li>`;
                });
                
                html += `</ul>
                </li>`;
            }
            
            html += `</ul>
            </li>`;
        }
        
        html += `</ul>
            </li>
        </ul>`;
    }
    
    navMenu.innerHTML = html;
    console.log('导航菜单渲染完成');
}

// 绑定事件
function bindEvents() {
    console.log('开始绑定事件...');
    // 导航菜单展开/折叠
    document.querySelectorAll('.grade-link, .semester-link, .chapter-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const subMenu = this.nextElementSibling;
            if (subMenu) {
                subMenu.style.display = subMenu.style.display === 'block' ? 'none' : 'block';
                console.log('切换菜单显示状态:', this.textContent, '->', subMenu.style.display);
            }
        });
    });
    
    // 动画链接点击
    document.querySelectorAll('.animation-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const id = this.getAttribute('data-id');
            const type = this.getAttribute('data-type');
            const url = this.getAttribute('data-url');
            console.log('点击动画链接:', { id, type, url, name: this.textContent });
            loadAnimation(type, url, id);
            
            // 标记当前选中项
            document.querySelectorAll('.animation-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // 搜索功能
    document.getElementById('search-btn').addEventListener('click', function() {
        const searchTerm = document.getElementById('search-input').value.trim();
        console.log('点击搜索按钮，搜索词:', searchTerm);
        searchAnimations(searchTerm);
    });
    
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim();
            console.log('回车搜索，搜索词:', searchTerm);
            searchAnimations(searchTerm);
        }
    });
    
    // 控制按钮
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    document.getElementById('refresh-btn').addEventListener('click', refreshAnimation);
    document.getElementById('favorite-btn').addEventListener('click', toggleFavorite);
    console.log('事件绑定完成');
}

// 全局变量存储 GeoGebra applet 实例
let ggbApplet = null;

// 检查 GeoGebra API 是否加载完成的函数
function checkGeoGebraAPI(callback) {
    if (typeof GGBApplet !== 'undefined') {
        console.log('GeoGebra API 已加载');
        callback();
    } else {
        console.log('等待 GeoGebra API 加载...');
        // 最多尝试 10 次，每次间隔 500ms
        let attempts = 0;
        const maxAttempts = 10;
        const interval = setInterval(() => {
            attempts++;
            if (typeof GGBApplet !== 'undefined') {
                clearInterval(interval);
                console.log('GeoGebra API 加载完成');
                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.error('GeoGebra API 加载超时');
                callback(false);
            }
        }, 500);
    }
}

// 加载动画
function loadAnimation(type, url, id) {
    console.log('开始加载动画:', { id, type, url });
    const container = document.getElementById('animation-content');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');

    // 显示加载状态
    loading.style.display = 'block';
    error.style.display = 'none';
    container.innerHTML = '';

    // 清理之前的 GeoGebra applet
    if (ggbApplet) {
        ggbApplet = null;
    }

    // 保存当前动画信息
    currentAnimation = { id, type, url };
    console.log('当前动画设置为:', currentAnimation);

    // 更新收藏按钮状态
    updateFavoriteButton();

    // 根据类型加载动画
    setTimeout(() => {
        try {
            // 首先检查是否为抖音链接，无论type是什么
            if (url.includes('douyin.com') || url.includes('iesdouyin.com')) {
                // 对于抖音链接，显示提示和跳转按钮
                console.log('加载抖音视频链接:', url);
                container.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 20px;">
                        <h3>抖音视频链接</h3>
                        <p style="margin: 20px 0;">由于抖音的安全策略，无法直接在页面中嵌入视频</p>
                        <a href="${url}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #0088cc; color: white; text-decoration: none; border-radius: 4px; margin: 10px;">在新窗口打开</a>
                    </div>
                `;
                loading.style.display = 'none';
            } else if (type === 'ggb') {
                // 加载GGB动画 - 使用 GeoGebra API
                console.log('加载GGB动画:', url);
                checkGeoGebraAPI((success) => {
                    if (success !== false) {
                        loadGeoGebraApplet(url, container);
                    } else {
                        console.error('GeoGebra API 加载失败');
                        container.innerHTML = '<div style="color: red; padding: 20px;">GeoGebra API 加载失败，请检查网络连接后刷新页面重试</div>';
                        loading.style.display = 'none';
                    }
                });
            } else if (type === 'html' || type === 'external' || type === 'video') {
                // 加载本地HTML动画、外部网站动画或视频链接
                console.log('加载HTML/外部/视频动画:', url);
                // 其他链接正常使用iframe加载
                container.innerHTML = `<iframe src="${url}" allowfullscreen style="width: 100%; height: 100%; border: none;"></iframe>`;
                loading.style.display = 'none';
            } else {
                console.warn('未知动画类型:', type);
                loading.style.display = 'none';
            }
        } catch (e) {
            loading.style.display = 'none';
            error.style.display = 'block';
            console.error('加载动画失败:', e);
        }
    }, 500);
}

// 使用 GeoGebra API 加载 applet
function loadGeoGebraApplet(url, container) {
    // 从 URL 中提取 material ID
    // GeoGebra URL 格式: https://www.geogebra.org/classic/b7m8g3k2
    // Material ID 是最后一部分
    console.log('原始 URL:', url);
    const materialId = extractMaterialId(url);
    console.log('提取的 Material ID:', materialId);
    console.log('测试 Material ID 有效性:', materialId && materialId.length >= 6);

    if (!materialId) {
        console.error('无法从 URL 提取 Material ID:', url);
        container.innerHTML = '<div style="color: red; padding: 20px;">无效的 GeoGebra URL</div>';
        document.getElementById('loading').style.display = 'none';
        return;
    }

    // 使用 GeoGebra API 加载
    try {
        console.log('使用 GeoGebra API 加载');
        
        // 创建 applet 容器
        const appletContainer = document.createElement('div');
        appletContainer.id = 'ggb-applet-container';
        appletContainer.style.width = '100%';
        appletContainer.style.height = '100%';
        container.appendChild(appletContainer);

        // 配置 GeoGebra applet 参数
        const parameters = {
            id: 'ggbApplet',
            material_id: materialId,
            width: container.clientWidth || 800,
            height: container.clientHeight || 600,
            showToolBar: true,
            showAlgebraInput: true,
            showMenuBar: true,
            enableRightClick: true,
            enableShiftDragZoom: true,
            showResetIcon: true,
            language: 'zh-CN',
            country: 'CN',
            allowStyleBar: true,
            useBrowserForJS: false,
            borderColor: '#CCCCCC',
            showFullscreenButton: true
        };

        // applet 加载完成的回调
        const appletLoaded = function() {
            console.log('GeoGebra Applet 加载完成');
            ggbApplet = document.getElementById('ggbApplet');
            document.getElementById('loading').style.display = 'none';
        };

        // 创建 applet
        const views = { 'is3D': 0, 'AV': 1, 'SV': 0, 'CV': 0, 'EV2': 0, 'CP': 0, 'PC': 0, 'DA': 0, 'FI': 0, 'PV': 0 };

        if (typeof GGBApplet !== 'undefined') {
            const applet = new GGBApplet(parameters, '5.0', views);
            applet.setHTML5Codebase('https://www.geogebra.org/apps/5.0.803.0/web3d');
            applet.inject(appletContainer.id, 'html5', appletLoaded);
        } else {
            console.error('GeoGebra API 未加载');
            container.innerHTML = '<div style="color: red; padding: 20px;">GeoGebra API 加载失败，请刷新页面重试</div>';
            document.getElementById('loading').style.display = 'none';
        }
    } catch (e) {
        console.error('加载 GeoGebra Applet 失败:', e);
        container.innerHTML = '<div style="color: red; padding: 20px;">加载 GeoGebra 应用失败，请刷新页面重试</div>';
        document.getElementById('loading').style.display = 'none';
    }
}

// 从 GeoGebra URL 中提取 Material ID
function extractMaterialId(url) {
    // 支持多种 URL 格式
    // https://www.geogebra.org/classic/b7m8g3k2
    // https://www.geogebra.org/m/b7m8g3k2
    // https://www.geogebra.org/classic#matrix/b7m8g3k2

    if (!url) return null;

    // 移除末尾的斜杠
    url = url.replace(/\/$/, '');

    // 尝试从 URL 中提取 ID
    const patterns = [
        /geogebra\.org\/classic\/(\w+)$/,
        /geogebra\.org\/m\/(\w+)$/,
        /geogebra\.org\/classic#matrix\/(\w+)$/,
        /geogebra\.org\/classic#(\w+)$/,
        /\/([a-zA-Z0-9]{8,})$/  // 通用模式，匹配最后8位以上的字母数字组合
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    // 如果都不匹配，尝试直接返回 URL 的最后一部分
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.length >= 8) {
        return lastPart;
    }

    return null;
}

// 加载初始动画
function loadInitialAnimation() {
    console.log('开始加载初始动画...');
    // 加载第一个动画
    const textbookData = buildTextbookData();
    const firstGrade = Object.keys(textbookData)[0];
    console.log('第一个年级:', firstGrade);
    
    if (firstGrade) {
        const firstSemester = Object.keys(textbookData[firstGrade])[0];
        console.log('第一个学期:', firstSemester);
        
        if (firstSemester) {
            const firstChapter = Object.keys(textbookData[firstGrade][firstSemester])[0];
            console.log('第一章:', firstChapter);
            
            if (firstChapter) {
                const firstAnimation = textbookData[firstGrade][firstSemester][firstChapter][0];
                console.log('第一个动画:', firstAnimation);
                
                if (firstAnimation) {
                    loadAnimation(firstAnimation.type, firstAnimation.url, firstAnimation.id);
                } else {
                    console.warn('没有找到第一个动画');
                }
            } else {
                console.warn('没有找到第一章');
            }
        } else {
            console.warn('没有找到第一个学期');
        }
    } else {
        console.warn('没有找到第一个年级');
    }
}

// 搜索动画
function searchAnimations(term) {
    if (!term) return;
    console.log('开始搜索动画，搜索词:', term);
    
    const results = [];
    const textbookData = buildTextbookData();
    
    // 遍历所有动画
    for (const grade in textbookData) {
        for (const semester in textbookData[grade]) {
            for (const chapter in textbookData[grade][semester]) {
                textbookData[grade][semester][chapter].forEach(animation => {
                    if (
                        grade.includes(term) ||
                        semester.includes(term) ||
                        chapter.includes(term) ||
                        animation.name.includes(term)
                    ) {
                        results.push({
                            grade,
                            semester,
                            chapter,
                            ...animation
                        });
                    }
                });
            }
        }
    }
    
    console.log('搜索结果:', results);
    // 显示搜索结果
    if (results.length > 0) {
        // 加载第一个搜索结果
        const firstResult = results[0];
        console.log('加载第一个搜索结果:', firstResult);
        loadAnimation(firstResult.type, firstResult.url, firstResult.id);
        
        // 展开对应的导航菜单
        const gradeLink = document.querySelector(`.grade-link[data-grade="${firstResult.grade}"]`);
        const semesterLink = document.querySelector(`.semester-link[data-grade="${firstResult.grade}"][data-semester="${firstResult.semester}"]`);
        const chapterLink = document.querySelector(`.chapter-link[data-grade="${firstResult.grade}"][data-semester="${firstResult.semester}"][data-chapter="${firstResult.chapter}"]`);
        
        // 强制展开所有相关菜单，而不是切换状态
        if (gradeLink) {
            const gradeSubMenu = gradeLink.nextElementSibling;
            if (gradeSubMenu) gradeSubMenu.style.display = 'block';
        }
        
        if (semesterLink) {
            const semesterSubMenu = semesterLink.nextElementSibling;
            if (semesterSubMenu) semesterSubMenu.style.display = 'block';
        }
        
        if (chapterLink) {
            const chapterSubMenu = chapterLink.nextElementSibling;
            if (chapterSubMenu) chapterSubMenu.style.display = 'block';
        }
        
        // 标记选中的动画
        document.querySelectorAll('.animation-link').forEach(link => {
            if (link.getAttribute('data-id') === firstResult.id) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    } else {
        console.log('未找到相关动画资源');
        showMessage('未找到相关动画资源');
    }
}

// 切换全屏
function toggleFullscreen() {
    console.log('切换全屏状态');
    const container = document.getElementById('animation-container');
    
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.error(`全屏错误: ${err.message}`);
        });
        console.log('进入全屏');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            console.log('退出全屏');
        }
    }
}

// 刷新动画
function refreshAnimation() {
    console.log('刷新动画');
    if (currentAnimation) {
        console.log('当前动画:', currentAnimation);
        loadAnimation(currentAnimation.type, currentAnimation.url, currentAnimation.id);
    } else {
        console.warn('没有当前动画可刷新');
    }
}

// 切换收藏状态
function toggleFavorite() {
    if (!currentAnimation) {
        console.warn('没有当前动画可收藏');
        return;
    }
    
    console.log('切换收藏状态，当前动画:', currentAnimation);
    const index = favorites.findIndex(item => item.id === currentAnimation.id);
    if (index === -1) {
        // 添加到收藏
        favorites.push(currentAnimation);
        console.log('添加到收藏:', currentAnimation);
    } else {
        // 从收藏中移除
        favorites.splice(index, 1);
        console.log('从收藏中移除:', currentAnimation);
    }
    
    // 保存到本地存储
    localStorage.setItem('favorites', JSON.stringify(favorites));
    console.log('收藏数据已保存到本地存储:', favorites);
    
    // 更新按钮状态
    updateFavoriteButton();
}

// 更新收藏按钮状态
function updateFavoriteButton() {
    console.log('更新收藏按钮状态');
    const favoriteBtn = document.getElementById('favorite-btn');
    if (currentAnimation && favorites.some(item => item.id === currentAnimation.id)) {
        favoriteBtn.classList.add('favorited');
        favoriteBtn.textContent = '取消收藏';
        console.log('按钮状态: 已收藏');
    } else {
        favoriteBtn.classList.remove('favorited');
        favoriteBtn.textContent = '收藏';
        console.log('按钮状态: 未收藏');
    }
}

// 复制到剪贴板函数
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('链接已复制到剪贴板');
    }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制链接');
    });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);