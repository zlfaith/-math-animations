// ============================================
// 初中数学交互动画 - 主程序
// 纯 CloudBase 版本
// ============================================

const CLOUDBASE_ENV = 'math-animations-2ga3njm77f3944eb';
let currentAnimation = null;
let animations = [];
let app = null;
let db = null;
let animationsCollection = null;
let cloudBaseReady = false;
let authUid = null;

// 章节数据结构 - 初始化为空对象，所有数据将从数据库加载
let chapterData = {};

// 章节数据集合
let chaptersCollection = null;

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

async function initCloudBase() {
    if (cloudBaseReady) return true;

    console.log('开始初始化 CloudBase...');
    console.log('当前时间:', new Date().toLocaleString());
    console.log('CLOUDBASE_ENV:', CLOUDBASE_ENV);
    console.log('window.tcb:', typeof window.tcb, window.tcb ? '已加载' : '未加载');
    console.log('window.cloudbase:', typeof window.cloudbase, window.cloudbase ? '已加载' : '未加载');

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
        console.log('开始初始化 CloudBase 应用...');
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
            console.log('用户 UID:', authUid);
        } else if (state && state.uid) {
            // 兼容旧版本SDK
            authUid = state.uid;
            console.log('用户 UID:', authUid);
        } else {
            console.error('获取用户 UID 失败，登录状态对象:', state);
            return false;
        }

        console.log('初始化数据库...');
        try {
            db = app.database();
            console.log('数据库初始化成功');
        } catch (dbError) {
            console.error('数据库初始化失败:', dbError);
            return false;
        }

        console.log('初始化集合...');
        try {
            animationsCollection = db.collection('animations');
            chaptersCollection = db.collection('chapters');
            console.log('集合初始化成功');
        } catch (collectionError) {
            console.error('集合初始化失败:', collectionError);
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
                                    let index = 1;
                                    const gradeMap = { '初一': 1, '初二': 2, '初三': 3 };
                                    const semesterMap = { '上册': 1, '下册': 2 };
                                    for (const key in chapters) {
                                        if (chapters.hasOwnProperty(key)) {
                                            // key是章节名称，如"第一章 有理数"
                                            const chapterId = `${gradeMap[grade]}-${semesterMap[semester]}-${index}`;
                                            chapterArray.push({
                                                name: key,
                                                id: chapterId
                                            });
                                            index++;
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
function buildTextbookData() {
    const textbookData = {
        "初一": {
            "上册": [
                { id: "1-1-1", name: "第一章 有理数" },
                { id: "1-1-2", name: "第二章 整式的加减" },
                { id: "1-1-3", name: "第三章 一元一次方程" },
                { id: "1-1-4", name: "第四章 几何图形初步" }
            ],
            "下册": [
                { id: "1-2-1", name: "第五章 相交线与平行线" },
                { id: "1-2-2", name: "第六章 实数" },
                { id: "1-2-3", name: "第七章 平面直角坐标系" },
                { id: "1-2-4", name: "第八章 二元一次方程组" },
                { id: "1-2-5", name: "第九章 不等式与不等式组" },
                { id: "1-2-6", name: "第十章 数据的收集、整理与描述" }
            ]
        },
        "初二": {
            "上册": [
                { id: "2-1-1", name: "第十一章 三角形" },
                { id: "2-1-2", name: "第十二章 全等三角形" },
                { id: "2-1-3", name: "第十三章 轴对称" },
                { id: "2-1-4", name: "第十四章 整式的乘法与因式分解" },
                { id: "2-1-5", name: "第十五章 分式" }
            ],
            "下册": [
                { id: "2-2-1", name: "第十六章 二次根式" },
                { id: "2-2-2", name: "第十七章 勾股定理" },
                { id: "2-2-3", name: "第十八章 平行四边形" },
                { id: "2-2-4", name: "第十九章 一次函数" },
                { id: "2-2-5", name: "第二十章 数据的分析" }
            ]
        },
        "初三": {
            "上册": [
                { id: "3-1-1", name: "第二十一章 一元二次方程" },
                { id: "3-1-2", name: "第二十二章 二次函数" },
                { id: "3-1-3", name: "第二十三章 旋转" },
                { id: "3-1-4", name: "第二十四章 圆" },
                { id: "3-1-5", name: "第二十五章 概率初步" }
            ],
            "下册": [
                { id: "3-2-1", name: "第二十六章 反比例函数" },
                { id: "3-2-2", name: "第二十七章 相似" },
                { id: "3-2-3", name: "第二十八章 锐角三角函数" },
                { id: "3-2-4", name: "第二十九章 投影与视图" }
            ]
        }
    };

    return textbookData;
}
function renderNavigation() {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) return;

    let html = '<ul>';

    // 按固定顺序遍历年级：初一、初二、初三
    const grades = ['初一', '初二', '初三'];
    grades.forEach(grade => {
        // 确保年级数据存在
        if (!chapterData[grade]) {
            chapterData[grade] = {
                '上册': [],
                '下册': []
            };
        }
        
        html += `<li>
            <a href="#" class="grade-link" data-grade="${grade}">${grade}</a>
            <ul class="sub-menu">`;

        // 按固定顺序遍历学期：上册、下册
        const semesters = ['上册', '下册'];
        semesters.forEach(semester => {
            // 确保学期数据存在
            if (!chapterData[grade][semester]) {
                chapterData[grade][semester] = [];
            }
            
            html += `<li>
                <a href="#" class="semester-link" data-grade="${grade}" data-semester="${semester}">${semester}</a>
                <ul class="sub-sub-menu">`;

            // 遍历章节
            chapterData[grade][semester].forEach((chapter, index) => {
                // 获取章节名称和 id
                let chapterName = chapter;
                let chapterId = '';
                
                if (typeof chapter === 'object' && chapter !== null) {
                    chapterName = chapter.name || chapter;
                    chapterId = chapter.id || '';
                }
                
                // 如果章节没有 id，生成章节 ID：年级-学期-章节索引
                if (!chapterId) {
                    const gradeMap = { '初一': 1, '初二': 2, '初三': 3 };
                    const semesterMap = { '上册': 1, '下册': 2 };
                    chapterId = `${gradeMap[grade]}-${semesterMap[semester]}-${index + 1}`;
                }
                
                html += `<li><a href="#" class="chapter-link" data-grade="${grade}" data-semester="${semester}" data-chapter="${chapterName}" data-chapter-id="${chapterId}">${chapterName}</a><ul class="animation-list"></ul></li>`;
            });

            html += '</ul></li>';
        });

        html += '</ul></li>';
    });

    html += '</ul>';

    navMenu.innerHTML = html;
    
    // 手动绑定事件，确保事件绑定正确
    bindEvents();
}
function bindEvents() {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) {
        console.error('nav-menu元素不存在');
        return;
    }
    console.log('bindEvents: nav-menu元素存在');

    navMenu.addEventListener('click', function(e) {
        console.log('bindEvents: 点击事件触发');
        console.log('bindEvents: 点击目标:', e.target);
        
        const link = e.target.closest('a');
        if (!link) {
            console.log('bindEvents: 点击目标不是链接');
            return;
        }
        console.log('bindEvents: 点击的链接:', link);
        console.log('bindEvents: 链接类名:', link.className);

        e.preventDefault();

        if (link.classList.contains('grade-link') || link.classList.contains('semester-link')) {
            console.log('bindEvents: 点击的是展开/收起链接:', link.textContent);
            const subMenu = link.nextElementSibling;
            console.log('bindEvents: 子菜单元素:', subMenu);
            if (subMenu) {
                console.log('bindEvents: 子菜单当前类名:', subMenu.className);
                subMenu.classList.toggle('show');
                link.classList.toggle('active');
                console.log('bindEvents: 子菜单新类名:', subMenu.className);
                console.log('bindEvents: 链接新类名:', link.className);
            } else {
                console.log('bindEvents: 没有找到子菜单元素');
            }
        } else if (link.classList.contains('chapter-link')) {
            console.log('bindEvents: 点击的是章节链接:', link.textContent);
            const subMenu = link.nextElementSibling;
            console.log('bindEvents: 子菜单元素:', subMenu);
            if (subMenu) {
                link.classList.toggle('active');
                const grade = link.getAttribute('data-grade');
                const semester = link.getAttribute('data-semester');
                const chapter = link.getAttribute('data-chapter');
                const chapterId = link.getAttribute('data-chapter-id');
                console.log('bindEvents: 加载章节动画:', grade, semester, chapter, chapterId);
                loadChapterAnimations(grade, semester, chapter, chapterId, subMenu);
            }
        } else if (link.classList.contains('animation-link')) {
            console.log('bindEvents: 点击的是动画链接:', link.textContent);
            const id = link.getAttribute('data-id');
            const type = link.getAttribute('data-type');
            const url = link.getAttribute('data-url');
            loadAnimation(type, url, id);

            document.querySelectorAll('.animation-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });

    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');

    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            searchAnimations(searchInput ? searchInput.value.trim() : '');
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchAnimations(this.value.trim());
            }
        });
    }

    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const openNewWindowBtn = document.getElementById('open-new-window-btn');

    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
    if (refreshBtn) refreshBtn.addEventListener('click', refreshAnimation);
    if (openNewWindowBtn && !openNewWindowBtn._hasClickListener) {
        openNewWindowBtn._hasClickListener = true;
        openNewWindowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (currentAnimation && currentAnimation.url) {
                window.open(currentAnimation.url, '_blank');
            }
        });
    }
}
function loadAnimation(type, url, id) {
    const container = document.getElementById('animation-content');
    const loading = document.getElementById('loading');
    const openNewWindowBtn = document.getElementById('open-new-window-btn');

    if (!container || !loading) return;

    loading.style.display = 'block';
    container.innerHTML = '';

    currentAnimation = { id, type, url };

    // 显示或隐藏"在新窗口打开"按钮
    if (openNewWindowBtn) {
        if (type === 'external' || type === 'ggb' || url.includes('douyin.com') || url.includes('iesdouyin.com')) {
            openNewWindowBtn.style.display = 'inline-block';
        } else {
            openNewWindowBtn.style.display = 'none';
        }
    }

    setTimeout(() => {
        try {
            if (!url) {
                loading.style.display = 'none';
                return;
            }

            if (url.includes('douyin.com') || url.includes('iesdouyin.com')) {
                container.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 20px;">
                        <h3>抖音视频链接</h3>
                        <p style="margin: 20px 0;">由于抖音的安全策略，无法直接在页面中嵌入视频</p>
                        <p style="margin: 10px 0; color: #666;">点击下方"在新窗口打开"按钮查看</p>
                    </div>
                `;
                loading.style.display = 'none';
            } else if (type === 'ggb') {
                loadGeoGebraApplet(url, container);
            } else if (type === 'external') {
                // 外部链接，检查是否是抖音（抖音不支持嵌入）
                const isDouyin = url.includes('douyin.com') || url.includes('iesdouyin.com');
                
                if (isDouyin) {
                    // 抖音不支持嵌入，显示提示
                    container.innerHTML = `
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 20px;">
                            <h3>抖音视频链接</h3>
                            <p style="margin: 20px 0;">由于抖音的安全策略，无法直接在页面中嵌入视频</p>
                            <p style="margin: 10px 0; color: #666;">点击下方"在新窗口打开"按钮查看</p>
                        </div>
                    `;
                    loading.style.display = 'none';
                } else if (url.includes('bilibili.com')) {
                    // Bilibili使用官方嵌入代码格式
                    let embedUrl = url;
                    // 提取bvid并转换为官方嵌入格式
                    const bvidMatch = url.match(/bvid=([\w]+)/i) || url.match(/BV[\w]+/);
                    if (bvidMatch) {
                        const bvid = bvidMatch[1] || bvidMatch[0];
                        embedUrl = `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0&isOutside=true`;
                    }
                    
                    const iframe = document.createElement('iframe');
                    iframe.src = embedUrl;
                    iframe.allowFullscreen = true;
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.border = 'none';
                    iframe.scrolling = 'no';
                    iframe.frameBorder = '0';
                    iframe.framespacing = '0';
                    
                    // 监听iframe加载完成
                    iframe.onload = function() {
                        loading.style.display = 'none';
                    };
                    
                    // 监听iframe加载错误
                    iframe.onerror = function() {
                        loading.style.display = 'none';
                    };
                    
                    container.innerHTML = '';
                    container.appendChild(iframe);
                } else {
                    // 尝试iframe嵌入其他网站
                    const iframe = document.createElement('iframe');
                    iframe.src = url;
                    iframe.allowFullscreen = true;
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.border = 'none';
                    
                    // 监听iframe加载完成
                    iframe.onload = function() {
                        loading.style.display = 'none';
                    };
                    
                    // 监听iframe加载错误
                    iframe.onerror = function() {
                        loading.style.display = 'none';
                    };
                    
                    container.innerHTML = '';
                    container.appendChild(iframe);
                }
            } else {
                // 本地HTML文件
                const iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.allowFullscreen = true;
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                
                // 监听加载完成
                iframe.onload = function() {
                    loading.style.display = 'none';
                };
                
                // 监听加载错误
                iframe.onerror = function() {
                    container.innerHTML = `
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 20px;">
                            <h3>文件加载失败</h3>
                            <p style="margin: 20px 0;">无法加载动画文件，请检查文件是否存在</p>
                            <p style="margin: 10px 0; color: #666;">文件路径：${url}</p>
                        </div>
                    `;
                    loading.style.display = 'none';
                };
                
                container.innerHTML = '';
                container.appendChild(iframe);
                
                // 设置超时检查
                setTimeout(() => {
                    if (loading.style.display !== 'none') {
                        loading.style.display = 'none';
                    }
                }, 5000);
            }
        } catch (e) {
            loading.style.display = 'none';
            console.error('加载动画失败:', e);
        }
    }, 500);
}

// 显示外部链接的备用方案（提示用户在控制栏点击按钮）
function showExternalLinkFallback(url, container, loading) {
    console.log('外部链接无法嵌入，显示备用方案:', url);
    const isGeoGebra = url.includes('geogebra.org');
    const title = isGeoGebra ? 'GeoGebra 动画' : '外部网站链接';
    const message = isGeoGebra 
        ? 'GeoGebra 动画加载超时或失败' 
        : '该网站不允许在页面中嵌入';
    
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 20px;">
            <h3>${title}</h3>
            <p style="margin: 20px 0;">${message}</p>
            <p style="margin: 10px 0; color: #666;">点击下方"在新窗口打开"按钮查看</p>
        </div>
    `;
    if (loading) loading.style.display = 'none';
}

function loadGeoGebraApplet(url, container) {
    const materialId = extractMaterialId(url);
    console.log('loadGeoGebraApplet: URL:', url);
    console.log('loadGeoGebraApplet: Material ID:', materialId);

    if (!materialId) {
        container.innerHTML = '<div style="color: red; padding: 20px;">无效的 GeoGebra URL</div>';
        document.getElementById('loading').style.display = 'none';
        return;
    }

    // 使用iframe嵌入GeoGebra
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.allowFullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    // 监听iframe加载完成
    iframe.onload = function() {
        console.log('GeoGebra iframe 加载完成');
        document.getElementById('loading').style.display = 'none';
    };
    
    // 监听iframe加载错误
    iframe.onerror = function() {
        console.error('GeoGebra iframe 加载失败');
        // 加载失败时显示提示，但不替换iframe
        document.getElementById('loading').style.display = 'none';
    };
    
    container.innerHTML = '';
    container.appendChild(iframe);
}
function extractMaterialId(url) {
    if (!url) return null;
    url = url.replace(/\/$/, '');

    const patterns = [
        /geogebra\.org\/classic\/([a-zA-Z0-9]+)$/,
        /geogebra\.org\/m\/([a-zA-Z0-9]+)$/,
        /\/([a-zA-Z0-9]{8,})$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    const parts = url.split('/');
    return parts[parts.length - 1];
}
function searchAnimations(term) {
    if (!term) return;

    const results = animations.filter(animation => {
        return animation.grade.includes(term) ||
               animation.semester.includes(term) ||
               animation.chapter.includes(term) ||
               animation.name.includes(term);
    });

    if (results.length > 0) {
        const first = results[0];
        loadAnimation(first.type, first.url, first.id);

        document.querySelectorAll('.sub-menu, .sub-sub-menu').forEach(menu => {
            menu.style.display = 'block';
        });
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
    console.log('loadChapterAnimations: 开始加载章节动画');
    console.log('loadChapterAnimations: 参数:', grade, semester, chapter, chapterId);
    console.log('loadChapterAnimations: 动画列表元素:', animationListElement);
    console.log('loadChapterAnimations: 当前动画数量:', animations.length);
    
    if (animations.length === 0) {
        console.log('loadChapterAnimations: 动画数组为空，加载数据');
        await loadData();
        console.log('loadChapterAnimations: 加载数据后动画数量:', animations.length);
    }

    console.log('loadChapterAnimations: 所有动画数据:', animations);
    
    // 使用 chapterId 字段匹配动画数据
    let chapterAnimations = animations.filter(animation => {
        const match = animation.chapterId === chapterId;
        console.log('loadChapterAnimations: 筛选动画:', animation.name, 
                    '动画chapterId:', animation.chapterId, '目标chapterId:', chapterId, '匹配:', match);
        return match;
    });

    console.log('loadChapterAnimations: 筛选出的动画数量:', chapterAnimations.length);
    console.log('loadChapterAnimations: 筛选出的动画:', chapterAnimations);

    let html = '';
    if (chapterAnimations.length > 0) {
        chapterAnimations.forEach(animation => {
            html += `<li><a href="#" class="animation-link" data-id="${animation.id}" data-type="${animation.type}" data-url="${animation.url}">${animation.name}</a></li>`;
        });
    } else {
        html = '<li class="no-animation">该章节暂无动画</li>';
    }

    if (animationListElement) {
        console.log('loadChapterAnimations: 设置动画列表HTML:', html);
        animationListElement.innerHTML = html;
        // 添加 show 类以显示动画列表
        animationListElement.classList.add('show');
        console.log('loadChapterAnimations: 动画列表HTML已设置，内容:', animationListElement.innerHTML);
    } else {
        console.error('loadChapterAnimations: 动画列表元素不存在');
    }
}
function loadInitialAnimation() {
    console.log('初始加载完成，等待用户点击章节');
}
async function loadData() {
    const ready = await initCloudBase();
    if (ready) {
        // 加载章节数据
        const chaptersLoaded = await loadChaptersFromCloudBase();
        if (chaptersLoaded) {
            console.log('章节数据加载成功，重新渲染导航栏...');
        } else {
            console.log('章节数据加载失败，使用默认章节数据...');
        }
        renderNavigation();
        
        const animationsLoaded = await loadAnimationsFromCloudBase();
        if (!animationsLoaded) {
            console.log('从CloudBase加载动画数据失败，尝试从本地文件加载...');
            await loadAnimationsFromLocalFile();
        }
    } else {
        console.log('CloudBase初始化失败，尝试从本地文件加载数据...');
        await loadAnimationsFromLocalFile();
        renderNavigation();
    }
}

async function loadAnimationsFromLocalFile() {
    try {
        console.log('开始从本地文件加载动画数据...');
        const response = await fetch('animations.json');
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        const data = await response.json();
        if (Array.isArray(data)) {
            animations = data;
            console.log('从本地文件加载动画数据成功，数量:', animations.length);
            return true;
        }
        return false;
    } catch (error) {
        console.error('从本地文件加载动画数据失败:', error);
        return false;
    }
}
async function init() {
    console.log('init: 开始初始化');
    console.log('init: document.readyState:', document.readyState);
    console.log('init: nav-menu元素:', document.getElementById('nav-menu'));
    
    // 等待DOM完全加载
    if (document.readyState === 'loading') {
        console.log('init: 等待DOM加载完成...');
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
        console.log('init: DOM加载完成');
    }
    
    console.log('init: DOM已完全加载');
    console.log('init: nav-menu元素:', document.getElementById('nav-menu'));
    
    // 检查nav-menu元素是否存在
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) {
        console.error('init: nav-menu元素不存在');
        return;
    }
    
    console.log('init: 渲染导航栏');
    renderNavigation();
    console.log('init: 渲染导航栏完成');
    console.log('init: 渲染后nav-menu元素:', document.getElementById('nav-menu'));
    console.log('init: 渲染后nav-menu子元素数量:', document.getElementById('nav-menu')?.children?.length);
    
    console.log('init: 绑定事件');
    bindEvents();
    console.log('init: 绑定事件完成');
    
    console.log('init: 加载数据');
    await loadData();
    
    console.log('init: 加载初始动画');
    loadInitialAnimation();
    
    console.log('init: 初始化完成');
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        init().catch(err => console.error('初始化失败:', err));
    });
} else {
    console.log('DOM已加载，立即执行init');
    init().catch(err => console.error('初始化失败:', err));
}