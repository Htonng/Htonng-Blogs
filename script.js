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
    const cardSelector = '.card, .song-item, .server-card';
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

window.addEventListener('load', () => {
    initTyping();
    typeWriter();
    observeHeroAnimation();
    observeCardsReveal();
    initServerCarousels();
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