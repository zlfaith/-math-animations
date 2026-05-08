// ============================================
// 初中数学交互动画 - 主程序
// IndexedDB 版本 - 纯本地存储
// ============================================

let currentAnimation = null;
let animations = [];
let dbReady = false;
let chapterData = {};

let ggbApplet = null;
let bilibiliPlayer = null;

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
    
    return 1;
}

function checkGeoGebraAPI(callback) {
    if (typeof GGBApplet !== 'undefined') {
        console.log('GeoGebra API 已加载');
        callback();
    } else {
        console.log('等待 GeoGebra API 加载...');
        setTimeout(() => checkGeoGebraAPI(callback), 100);
    }
}

function loadGeoGebraApplet(url, container) {
    console.log('loadGeoGebraApplet: URL:', url);
    
    checkGeoGebraAPI(() => {
        const params = {
            "appName": "classic",
            "width": "100%",
            "height": "100%",
            "borderColor":"#FFFFFF",
            "borderRadius":"8px",
            "showToolBar": true,
            "showAlgebraInput": true,
            "showMenuBar": true,
            "enable3d": false,
            "allowStyleBar": true,
            "appletOnLoad": function(api) {
                ggbApplet = api;
                console.log('GeoGebra applet 加载完成');
                document.getElementById('loading').style.display = 'none';
            },
            "errorDialogsActive": true,
            "language": "zh-CN"
        };

        const ggbAppletElement = new GGBApplet(params, true);
        ggbAppletElement.inject(container);
        
        if (url) {
            ggbAppletElement.setHTML5Code(url);
        }
    });
}

function loadBilibiliVideo(url, container) {
    console.log('loadBilibiliVideo: URL:', url);
    
    const videoId = extractBilibiliId(url);
    if (!videoId) {
        container.innerHTML = '<div style="color: red; padding: 20px;">无效的 Bilibili 链接</div>';
        document.getElementById('loading').style.display = 'none';
        return;
    }

    const iframe = document.createElement('iframe');
    iframe.src = `https://player.bilibili.com/player.html?bvid=${videoId}&page=1&high_quality=1`;
    iframe.allowFullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    iframe.onload = function() {
        console.log('Bilibili iframe 加载完成');
        document.getElementById('loading').style.display = 'none';
    };

    container.innerHTML = '';
    container.appendChild(iframe);
}

function extractBilibiliId(url) {
    if (!url) return null;
    
    const patterns = [
        /bilibili\.com\/video\/([a-zA-Z0-9]+)/,
        /bilibili\.com\/bv\/([a-zA-Z0-9]+)/,
        /bvid=([a-zA-Z0-9]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    
    return null;
}

function loadAnimation(type, url, id) {
    console.log('loadAnimation: type:', type, ', url:', url, ', id:', id);
    
    const container = document.getElementById('animation-content');
    const loading = document.getElementById('loading');
    
    if (!container) {
        console.error('动画容器不存在');
        return;
    }

    loading.style.display = 'block';
    container.innerHTML = '';

    currentAnimation = { type, url, id };

    switch (type) {
        case 'geogebra':
            loadGeoGebraApplet(url, container);
            break;
        case 'bilibili':
            loadBilibiliVideo(url, container);
            break;
        case 'iframe':
            loadIframeContent(url, container);
            break;
        default:
            container.innerHTML = '<div style="color: red; padding: 20px;">未知的动画类型</div>';
            loading.style.display = 'none';
    }
}

function loadIframeContent(url, container) {
    console.log('loadIframeContent: URL:', url);
    
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.allowFullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    iframe.onload = function() {
        console.log('iframe 加载完成');
        document.getElementById('loading').style.display = 'none';
    };

    iframe.onerror = function() {
        console.error('iframe 加载失败');
        document.getElementById('loading').style.display = 'none';
    };

    container.innerHTML = '';
    container.appendChild(iframe);
}

function renderNavigation() {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) {
        console.error('nav-menu 元素不存在');
        return;
    }

    let html = '';
    
    for (const grade in chapterData) {
        html += `<div class="grade-item">
            <a href="#" class="grade-link">${grade}</a>
            <div class="sub-menu">`;
        
        for (const semester in chapterData[grade]) {
            html += `<div class="semester-item">
                <a href="#" class="semester-link">${semester}</a>
                <ul class="sub-sub-menu">`;
            
            chapterData[grade][semester].forEach(chapter => {
                html += `<li>
                    <a href="#" class="chapter-link" 
                       data-grade="${grade}" 
                       data-semester="${semester}" 
                       data-chapter="${chapter.name}" 
                       data-chapter-id="${chapter.id}">${chapter.name}</a>
                    <ul class="animation-list" id="animations-${chapter.id}"></ul>
                </li>`;
            });
            
            html += `</ul></div>`;
        }
        
        html += `</div></div>`;
    }
    
    navMenu.innerHTML = html;
    console.log('导航栏渲染完成');
}

function bindEvents() {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) {
        console.error('nav-menu元素不存在');
        return;
    }

    navMenu.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;

        e.preventDefault();

        if (link.classList.contains('grade-link') || link.classList.contains('semester-link')) {
            const subMenu = link.nextElementSibling;
            if (subMenu) {
                subMenu.classList.toggle('show');
                link.classList.toggle('active');
            }
        } else if (link.classList.contains('chapter-link')) {
            const grade = link.getAttribute('data-grade');
            const semester = link.getAttribute('data-semester');
            const chapter = link.getAttribute('data-chapter');
            const chapterId = link.getAttribute('data-chapter-id');
            
            console.log('点击章节:', grade, semester, chapter, chapterId);
            
            loadChapterAnimations(grade, semester, chapter, chapterId);
        }
    });

    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function() {
            searchAnimations(searchInput.value);
        });
        
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                searchAnimations(searchInput.value);
            }
        });
    }

    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshAnimation);
    }
}

function searchAnimations(term) {
    if (!term) return;

    const results = animations.filter(animation => {
        return animation.grade && animation.grade.includes(term) ||
               animation.semester && animation.semester.includes(term) ||
               animation.chapter && animation.chapter.includes(term) ||
               animation.name && animation.name.includes(term);
    });

    if (results.length > 0) {
        const first = results[0];
        loadAnimation(first.type, first.url, first.id);
    }
}

function toggleFullscreen() {
    const container = document.getElementById('animation-container');
    if (!container) return;

    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => console.error('全屏错误:', err));
    } else {
        document.exitFullscreen();
    }
}

function refreshAnimation() {
    if (currentAnimation) {
        loadAnimation(currentAnimation.type, currentAnimation.url, currentAnimation.id);
    }
}

async function loadChapterAnimations(grade, semester, chapter, chapterId, animationListElement) {
    console.log('loadChapterAnimations:', grade, semester, chapter, chapterId);
    
    if (animations.length === 0) {
        await loadData();
    }

    let chapterAnimations = animations.filter(animation => {
        return animation.chapterId === chapterId;
    });

    console.log('筛选出的动画:', chapterAnimations);
    
    const listElement = animationListElement || document.getElementById(`animations-${chapterId}`);
    
    if (listElement) {
        let html = '';
        if (chapterAnimations.length > 0) {
            chapterAnimations.forEach(animation => {
                html += `<li><a href="#" class="animation-link" 
                    data-id="${animation.id}" 
                    data-type="${animation.type}" 
                    data-url="${animation.url}">${animation.name}</a></li>`;
            });
        } else {
            html = '<li class="no-animation">该章节暂无动画</li>';
        }
        
        listElement.innerHTML = html;
        listElement.classList.add('show');
        
        listElement.querySelectorAll('.animation-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const type = this.getAttribute('data-type');
                const url = this.getAttribute('data-url');
                const id = this.getAttribute('data-id');
                loadAnimation(type, url, id);
            });
        });
    }
}

function loadInitialAnimation() {
    console.log('初始加载完成，等待用户点击章节');
}

async function loadData() {
    console.log('开始加载数据...');
    
    try {
        await indexedDBService.init();
        await indexedDBService.initDefaultData();
        
        const chapterResult = await indexedDBService.getAllChapters();
        if (chapterResult.length > 0 && chapterResult[0].data) {
            chapterData = chapterResult[0].data;
            console.log('章节数据加载成功');
        }
        
        animations = await indexedDBService.getAllAnimations();
        console.log('动画数据加载成功，数量:', animations.length);
        
        dbReady = true;
    } catch (error) {
        console.error('数据加载失败:', error);
        chapterData = buildDefaultChapterData();
    }
    
    renderNavigation();
}

function buildDefaultChapterData() {
    return {
        "初一": {
            "上册": [
                { id: "1-1-1", name: "第一章 有理数" },
                { id: "1-1-2", name: "第二章 有理数的运算" },
                { id: "1-1-3", name: "综合与实践 进位制的认识与探究" },
                { id: "1-1-4", name: "第三章 代数式" },
                { id: "1-1-5", name: "第四章 整式的加减" },
                { id: "1-1-6", name: "第五章 一元一次方程" },
                { id: "1-1-7", name: "第六章 几何图形初步" }
            ],
            "下册": [
                { id: "1-2-7", name: "第七章 相交线与平行线" },
                { id: "1-2-8", name: "第八章 实数" },
                { id: "1-2-9", name: "第九章 平面直角坐标系" },
                { id: "1-2-10", name: "第十章 二元一次方程组" },
                { id: "1-2-11", name: "第十一章 不等式与不等式组" },
                { id: "1-2-12", name: "综合与实践 低碳生活" },
                { id: "1-2-13", name: "第十二章 数据的收集、整理与描述" }
            ]
        },
        "初二": {
            "上册": [
                { id: "2-1-13", name: "第十三章 三角形" },
                { id: "2-1-14", name: "综合与实践 确定匀质薄板的重心位置" },
                { id: "2-1-15", name: "第十四章 全等三角形" },
                { id: "2-1-16", name: "第十五章 轴对称" },
                { id: "2-1-17", name: "综合与实践 最短路径问题" },
                { id: "2-1-18", name: "第十六章 整式的乘法" },
                { id: "2-1-19", name: "第十七章 因式分解" },
                { id: "2-1-20", name: "第十八章 分式" }
            ],
            "下册": [
                { id: "2-2-19", name: "第十九章 二次根式" },
                { id: "2-2-20", name: "第二十章 勾股定理" },
                { id: "2-2-21", name: "第二十一章 四边形" },
                { id: "2-2-22", name: "第二十二章 函数" },
                { id: "2-2-23", name: "第二十三章 一次函数" },
                { id: "2-2-24", name: "综合与实践 音乐与数学" },
                { id: "2-2-25", name: "第二十四章 数据的分析" }
            ]
        },
        "初三": {
            "上册": [
                { id: "3-1-21", name: "第二十一章 一元二次方程" },
                { id: "3-1-22", name: "第二十二章 二次函数" },
                { id: "3-1-23", name: "第二十三章 旋转" },
                { id: "3-1-24", name: "第二十四章 圆" },
                { id: "3-1-25", name: "第二十五章 概率初步" }
            ],
            "下册": [
                { id: "3-2-26", name: "第二十六章 反比例函数" },
                { id: "3-2-27", name: "第二十七章 相似" },
                { id: "3-2-28", name: "第二十八章 锐角三角函数" },
                { id: "3-2-29", name: "第二十九章 投影与视图" }
            ]
        }
    };
}

async function init() {
    console.log('开始初始化...');
    
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
    }

    await loadData();
    bindEvents();
    loadInitialAnimation();
    
    console.log('初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        init().catch(err => console.error('初始化失败:', err));
    });
} else {
    init().catch(err => console.error('初始化失败:', err));
}