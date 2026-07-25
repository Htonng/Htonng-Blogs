// 打字机效果优化：使用单一光标与 textNode，避免重复光标与重复渲染
const textElement = document.querySelector('.typing-text');
let finalText = "你好，我是 Htonng";
let index = 0;
let cursorEl = null;
let textNode = null;
let typingStarted = false;

function initTyping() {
    if (!textElement || typingStarted) return;
    const existing = textElement.textContent.trim();
    finalText = existing || finalText;

    // 清空并准备 textNode 与单一光标
    textElement.textContent = '';
    textNode = document.createTextNode('');
    textElement.appendChild(textNode);

    cursorEl = document.createElement('span');
    cursorEl.className = 'cursor';
    textElement.appendChild(cursorEl);

    typingStarted = true;
}

function typeWriter() {
    if (!textElement || !textNode) return;

    if (index < finalText.length) {
        textNode.data += finalText.charAt(index);
        index++;
        // 随机速度，模拟真人打字 (100ms - 250ms)
        const randomSpeed = Math.floor(Math.random() * 150 + 100);
        setTimeout(typeWriter, randomSpeed);
    } else {
        // 打字完成，保留闪烁光标
        console.log('打字完成');
    }
}

// 视口观察：当 hero 进入视口时再淡入背景大字
function observeHeroAnimation() {
    const heroSection = document.querySelector('.hero');
    const bgWords = document.querySelector('.bg-words');

    if (!heroSection || !bgWords || !('IntersectionObserver' in window)) {
        if (bgWords) bgWords.classList.add('in-view');
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                bgWords.classList.add('in-view');
                observer.disconnect();
            }
        });
    }, { threshold: 0.25 });

    observer.observe(heroSection);
}

function observeCardsReveal() {
    const cardSelector = '.card, .song-item, .server-card, .project-card, .blog-post-item, .contact-item';
    const cards = document.querySelectorAll(cardSelector);
    if (!cards.length || !('IntersectionObserver' in window)) {
        cards.forEach(card => card.classList.add('visible'));
        return;
    }

    cards.forEach(card => card.classList.add('reveal-card'));

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2
    });

    cards.forEach(card => revealObserver.observe(card));
}

function initServerCarousels() {
    const carousels = document.querySelectorAll('.server-carousel');
    if (!carousels.length) return;

    carousels.forEach(carousel => {
        const rawImages = carousel.dataset.images || '';
        const images = rawImages.split('|').map(src => src.trim()).filter(Boolean);
        if (!images.length) return;

        let currentIndex = 0;
        let currentImg = document.createElement('img');
        currentImg.alt = carousel.dataset.alt || '服务器预览';
        currentImg.src = images[currentIndex];
        currentImg.className = 'carousel-image visible';
        currentImg.style.zIndex = '1';

        let nextImg = document.createElement('img');
        nextImg.alt = carousel.dataset.alt || '服务器预览';
        nextImg.className = 'carousel-image';
        nextImg.style.zIndex = '0';

        carousel.appendChild(nextImg);
        carousel.appendChild(currentImg);

        if (currentImg.complete) {
            currentImg.classList.add('visible');
        }

        const indicators = document.createElement('div');
        indicators.className = 'carousel-indicators';
        const dots = images.map((_, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-indicator';
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => showSlide(index));
            indicators.appendChild(dot);
            return dot;
        });
        carousel.appendChild(indicators);

        let slideTimer = setInterval(() => showSlide(currentIndex + 1), 4000);

        function showSlide(index) {
            const nextIndex = (index + images.length) % images.length;
            if (nextIndex === currentIndex) return;

            const preload = new Image();
            preload.onload = () => {
                nextImg.src = preload.src;
                nextImg.classList.remove('visible');
                nextImg.style.zIndex = '2';

                requestAnimationFrame(() => {
                    nextImg.classList.add('visible');
                    currentImg.classList.remove('visible');
                    currentImg.style.zIndex = '1';
                    nextImg.style.zIndex = '2';

                    [currentImg, nextImg] = [nextImg, currentImg];
                    updateIndicators(nextIndex);
                    currentIndex = nextIndex;
                    resetTimer();
                });
            };
            preload.src = images[nextIndex];
        }

        function updateIndicators(activeIndex) {
            dots.forEach((dot, dotIndex) => {
                dot.classList.toggle('active', dotIndex === activeIndex);
            });
        }

        function resetTimer() {
            clearInterval(slideTimer);
            slideTimer = setInterval(() => showSlide(currentIndex + 1), 4000);
        }

        carousel.addEventListener('mouseenter', () => clearInterval(slideTimer));
        carousel.addEventListener('mouseleave', () => resetTimer());
    });
}

// ===== 滚动进度条 =====
function initScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = progress + '%';
    }, { passive: true });
}

// ===== 返回顶部按钮 =====
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== 最新博客文章动态加载 =====
async function loadLatestBlogPosts() {
    const container = document.getElementById('latest-posts');
    if (!container) return;

    try {
        // 尝试获取博客首页的文章列表
        const response = await fetch('blog/index.html');
        if (!response.ok) throw new Error('无法获取博客数据');

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 提取文章列表
        const articles = doc.querySelectorAll('.article-title');
        const dates = doc.querySelectorAll('.meta-info time');

        let postsHTML = '';
        const maxPosts = Math.min(articles.length, 4);

        for (let i = 0; i < maxPosts; i++) {
            const link = articles[i];
            const title = link.textContent.trim();
            let href = link.getAttribute('href');
            const date = dates[i] ? dates[i].getAttribute('datetime') || dates[i].textContent.trim() : '';

            // 将绝对路径转为相对路径（移除 /Htonng-Blogs/blog/ 前缀）
            if (href.startsWith('/')) {
                const parts = href.split('/').filter(Boolean);
                // 移除第一个目录段（如 Htonng-Blogs）
                if (parts.length > 1) parts.shift();
                href = parts.join('/');
                if (!href.endsWith('/')) href += '/';
            }

            const displayDate = date ? date.split('T')[0] : '';

            postsHTML += `
                <a href="${href}" class="blog-post-item reveal-card">
                    <time class="post-date">${displayDate}</time>
                    <h4 class="post-title">${title}</h4>
                    <span class="post-arrow"><i class="fas fa-arrow-right"></i></span>
                </a>
            `;
        }

        if (postsHTML) {
            container.innerHTML = postsHTML;
            // 重新触发滚动观察
            observeCardsReveal();
        } else {
            container.innerHTML = '<p class="no-posts">暂无文章，敬请期待</p>';
        }
    } catch (e) {
        console.warn('博客文章加载失败，使用静态备用数据:', e.message);
        // 备用：直接使用已知的博客文章
        container.innerHTML = `
            <a href="blog/2026/07/24/科学上网和绕过工具推荐/" class="blog-post-item reveal-card">
                <time class="post-date">2026-07-24</time>
                <h4 class="post-title">科学上网和绕过工具推荐</h4>
                <span class="post-arrow"><i class="fas fa-arrow-right"></i></span>
            </a>
            <a href="blog/2026/07/23/我的第一个文章/" class="blog-post-item reveal-card">
                <time class="post-date">2026-07-23</time>
                <h4 class="post-title">我的第一个文章</h4>
                <span class="post-arrow"><i class="fas fa-arrow-right"></i></span>
            </a>
        `;
        // 重新触发滚动观察（延迟让 DOM 更新）
        setTimeout(() => observeCardsReveal(), 100);
    }
}

// ===== 项目卡片特殊悬浮效果 =====
function initProjectCards() {
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.project-icon i');
            if (icon) {
                icon.style.transform = 'scale(1.2) rotate(8deg)';
            }
        });
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.project-icon i');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });
}

window.addEventListener('load', () => {
    initTyping();
    typeWriter();
    observeHeroAnimation();
    observeCardsReveal();
    initServerCarousels();
    initScrollProgress();
    initBackToTop();
    loadLatestBlogPosts();
    initProjectCards();
    initThemeToggle();
});

// 平滑滚动 (兼容旧版浏览器)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        // 如果是外部链接（如 QQ 群），不执行滚动
        if (this.target === '_blank') return;

        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);
        if (target) target.scrollIntoView({ behavior: 'smooth' });

        // 若移动端打开了导航，点击后关闭它
        const navbar = document.querySelector('.navbar');
        if (navbar && navbar.classList.contains('open')) {
            navbar.classList.remove('open');
                    document.body.classList.remove('nav-open');
                    const toggle = document.querySelector('.nav-toggle');
                    if (toggle) {
                        toggle.setAttribute('aria-expanded', 'false');
                        const icon = toggle.querySelector('i');
                        if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
                    }
                }
    });
});

// ===== 深色模式切换 =====
function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    const icon = toggleBtn.querySelector('i');
    const html = document.documentElement;

    // 检测系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');

    // 优先级：已保存的主题 > 系统偏好
    let currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    function applyTheme(theme) {
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            if (icon) {
                icon.className = 'fas fa-sun';
            }
            toggleBtn.setAttribute('aria-label', '切换浅色模式');
            toggleBtn.setAttribute('title', '切换浅色模式');
        } else {
            html.removeAttribute('data-theme');
            if (icon) {
                icon.className = 'fas fa-moon';
            }
            toggleBtn.setAttribute('aria-label', '切换深色模式');
            toggleBtn.setAttribute('title', '切换深色模式');
        }
        localStorage.setItem('theme', theme);
    }

    // 应用初始主题
    applyTheme(currentTheme);

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    toggleBtn.addEventListener('click', () => {
        const isDark = html.getAttribute('data-theme') === 'dark';
        applyTheme(isDark ? 'light' : 'dark');
        // 按钮旋转反馈
        toggleBtn.style.transform = 'rotate(360deg)';
        setTimeout(() => { toggleBtn.style.transform = ''; }, 400);
        // 如果移动端菜单打开了，点击深色模式按钮时自动收起
        closeMobileNav();
    });
}

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navOverlay = document.querySelector('.nav-overlay');
function closeMobileNav() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    navbar.classList.remove('open');
    document.body.classList.remove('nav-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    if (navToggle) {
        const icon = navToggle.querySelector('i');
        if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
    }
    if (navOverlay) navOverlay.classList.remove('show');
}

if (navToggle) {
    navToggle.addEventListener('click', () => {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        const isOpen = navbar.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        // 页面滚动锁定
        if (isOpen) {
            document.body.classList.add('nav-open');
            if (navOverlay) navOverlay.classList.add('show');
        } else {
            document.body.classList.remove('nav-open');
            if (navOverlay) navOverlay.classList.remove('show');
        }
        // 切换汉堡图标为关闭图标
        const icon = navToggle.querySelector('i');
        if (icon) {
            if (isOpen) { icon.classList.remove('fa-bars'); icon.classList.add('fa-times'); }
            else { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
        }
    });
}

// 点击遮罩关闭菜单
if (navOverlay) {
    navOverlay.addEventListener('click', () => {
        closeMobileNav();
    });
}

// 确保点击菜单项后也隐藏遮罩（兼容之前的处理）
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        // 如果是外部链接（如 QQ 群），不执行滚动
        if (this.target === '_blank') return;

        const navbar = document.querySelector('.navbar');
        if (navbar && navbar.classList.contains('open')) {
            closeMobileNav();
        }
    });
});