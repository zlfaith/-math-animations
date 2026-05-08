// ============================================
// IndexedDB 存储服务 - 替代 CloudBase
// ============================================

const DB_NAME = 'MathAnimationsDB';
const DB_VERSION = 3;

class IndexedDBService {
    constructor() {
        this.db = null;
        this.isReady = false;
    }

    async init() {
        if (this.isReady) return true;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB 打开失败');
                reject(false);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.isReady = true;
                console.log('IndexedDB 初始化成功');
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建动画数据存储
                if (!db.objectStoreNames.contains('animations')) {
                    const animationStore = db.createObjectStore('animations', { keyPath: '_id', autoIncrement: true });
                    animationStore.createIndex('id', 'id', { unique: false });
                    animationStore.createIndex('chapterId', 'chapterId', { unique: false });
                }

                // 创建章节数据存储
                if (!db.objectStoreNames.contains('chapters')) {
                    const chapterStore = db.createObjectStore('chapters', { keyPath: '_id', autoIncrement: true });
                    chapterStore.createIndex('id', 'id', { unique: false });
                }

                console.log('IndexedDB 数据库结构创建完成');
            };
        });
    }

    // 动画数据操作
    async getAllAnimations() {
        if (!this.isReady) await this.init();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['animations'], 'readonly');
                const store = transaction.objectStore('animations');
                const request = store.getAll();

                request.onsuccess = () => {
                    resolve(request.result || []);
                };

                request.onerror = () => {
                    console.error('获取动画数据失败');
                    resolve([]);
                };
            } catch (error) {
                console.error('获取动画数据出错:', error);
                resolve([]);
            }
        });
    }

    async addAnimation(animationData) {
        if (!this.isReady) await this.init();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['animations'], 'readwrite');
                const store = transaction.objectStore('animations');
                const request = store.add(animationData);

                request.onsuccess = () => {
                    console.log('动画数据添加成功');
                    resolve(true);
                };

                request.onerror = () => {
                    console.error('动画数据添加失败');
                    reject(false);
                };
            } catch (error) {
                console.error('添加动画数据出错:', error);
                reject(false);
            }
        });
    }

    async updateAnimation(docId, animationData) {
        if (!this.isReady) await this.init();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['animations'], 'readwrite');
                const store = transaction.objectStore('animations');

                // 先获取现有数据
                const getRequest = store.get(docId);

                getRequest.onsuccess = () => {
                    const existingData = getRequest.result;
                    if (!existingData) {
                        console.error('未找到要更新的动画');
                        reject(false);
                        return;
                    }

                    // 合并数据
                    const updatedData = { ...existingData, ...animationData };
                    const updateRequest = store.put(updatedData);

                    updateRequest.onsuccess = () => {
                        console.log('动画数据更新成功');
                        resolve(true);
                    };

                    updateRequest.onerror = () => {
                        console.error('动画数据更新失败');
                        reject(false);
                    };
                };

                getRequest.onerror = () => {
                    console.error('获取动画数据失败');
                    reject(false);
                };
            } catch (error) {
                console.error('更新动画数据出错:', error);
                reject(false);
            }
        });
    }

    async deleteAnimation(docId) {
        if (!this.isReady) await this.init();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['animations'], 'readwrite');
                const store = transaction.objectStore('animations');

                // 先尝试直接通过 _id 删除
                const request = store.delete(docId);

                request.onsuccess = () => {
                    console.log('动画数据删除成功');
                    resolve(true);
                };

                request.onerror = () => {
                    console.error('动画数据删除失败');
                    reject(false);
                };
            } catch (error) {
                console.error('删除动画数据出错:', error);
                reject(false);
            }
        });
    }

    async deleteAnimationById(id) {
        if (!this.isReady) await this.init();

        try {
            const allAnimations = await this.getAllAnimations();
            const animation = allAnimations.find(a => a.id === id);

            if (animation && animation._id) {
                return await this.deleteAnimation(animation._id);
            }

            return false;
        } catch (error) {
            console.error('删除动画出错:', error);
            return false;
        }
    }

    // 章节数据操作
    async getAllChapters() {
        if (!this.isReady) await this.init();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['chapters'], 'readonly');
                const store = transaction.objectStore('chapters');
                const request = store.getAll();

                request.onsuccess = () => {
                    resolve(request.result || []);
                };

                request.onerror = () => {
                    console.error('获取章节数据失败');
                    resolve([]);
                };
            } catch (error) {
                console.error('获取章节数据出错:', error);
                resolve([]);
            }
        });
    }

    async saveChapters(chapterData) {
        if (!this.isReady) await this.init();

        return new Promise(async (resolve, reject) => {
            try {
                // 先获取现有章节数据
                const existingChapters = await this.getAllChapters();

                const transaction = this.db.transaction(['chapters'], 'readwrite');
                const store = transaction.objectStore('chapters');

                if (existingChapters.length > 0) {
                    // 更新现有数据
                    const existingDoc = existingChapters[0];
                    existingDoc.data = chapterData;
                    const request = store.put(existingDoc);

                    request.onsuccess = () => {
                        console.log('章节数据更新成功');
                        resolve(true);
                    };

                    request.onerror = () => {
                        console.error('章节数据更新失败');
                        reject(false);
                    };
                } else {
                    // 创建新数据
                    const request = store.add({ data: chapterData });

                    request.onsuccess = () => {
                        console.log('章节数据创建成功');
                        resolve(true);
                    };

                    request.onerror = () => {
                        console.error('章节数据创建失败');
                        reject(false);
                    };
                }
            } catch (error) {
                console.error('保存章节数据失败:', error);
                reject(false);
            }
        });
    }

    // 初始化默认数据
    async initDefaultData() {
        try {
            const animations = await this.getAllAnimations();
            
            // 强制更新章节数据，确保与最新版本一致
            const defaultChapterData = {
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

            await this.saveChapters(defaultChapterData);
            console.log('默认章节数据已更新');

            console.log('数据库初始化检查完成');
        } catch (error) {
            console.error('初始化默认数据失败:', error);
        }
    }
}

// 创建全局实例
const dbService = new IndexedDBService();

// 兼容 CloudBase API 的包装函数
const indexedDBAPI = {
    // 初始化
    async init() {
        return await dbService.init();
    },

    // 获取数据库实例
    database() {
        return {
            collection: (name) => {
                if (name === 'animations') {
                    return {
                        get: async () => {
                            const data = await dbService.getAllAnimations();
                            return { data };
                        },
                        add: async (data) => {
                            return await dbService.addAnimation(data);
                        },
                        doc: (docId) => ({
                            update: async (data) => {
                                return await dbService.updateAnimation(docId, data);
                            },
                            remove: async () => {
                                return await dbService.deleteAnimation(docId);
                            }
                        })
                    };
                } else if (name === 'chapters') {
                    return {
                        get: async () => {
                            const data = await dbService.getAllChapters();
                            return { data };
                        },
                        add: async (data) => {
                            return await dbService.saveChapters(data.data);
                        },
                        doc: (docId) => ({
                            update: async (data) => {
                                const chapters = await dbService.getAllChapters();
                                const chapter = chapters.find(c => c._id === docId);
                                if (chapter) {
                                    chapter.data = data.data;
                                    return await dbService.saveChapters(data.data);
                                }
                                return false;
                            },
                            remove: async () => {
                                return await dbService.deleteAnimation(docId);
                            }
                        })
                    };
                }
            }
        };
    },

    // 初始化默认数据
    async initDefaultData() {
        return await dbService.initDefaultData();
    }
};

// 导出
window.indexedDBService = dbService;
window.indexedDBAPI = indexedDBAPI;
