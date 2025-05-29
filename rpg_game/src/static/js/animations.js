// Funções para melhorar animações e transições entre páginas

// Variáveis globais
let pageTransitionActive = false;

// Inicializar elementos de transição
function initPageTransitions() {
    // Criar elemento de transição se não existir
    if (!document.querySelector('.page-transition')) {
        const transitionElement = document.createElement('div');
        transitionElement.className = 'page-transition';
        document.body.appendChild(transitionElement);
    }
    
    // Interceptar cliques em links para adicionar animação de transição
    document.querySelectorAll('a').forEach(link => {
        // Ignorar links externos e âncoras
        if (link.getAttribute('href') && 
            link.getAttribute('href').startsWith('/') && 
            !link.getAttribute('href').startsWith('/#') &&
            !link.classList.contains('no-transition')) {
            
            link.addEventListener('click', handleLinkClick);
        }
    });
}

// Manipular clique em links para adicionar transição
function handleLinkClick(e) {
    // Não processar se já estiver em transição
    if (pageTransitionActive) return;
    
    const href = this.getAttribute('href');
    
    // Ignorar se for a mesma página
    if (href === window.location.pathname) return;
    
    // Prevenir navegação padrão
    e.preventDefault();
    
    // Ativar transição
    pageTransitionActive = true;
    const transitionElement = document.querySelector('.page-transition');
    transitionElement.classList.add('active');
    
    // Navegar após a animação
    setTimeout(() => {
        window.location.href = href;
    }, 500);
}

// Melhorar animações de elementos ao entrar na viewport
function initScrollAnimations() {
    // Criar observer para detectar elementos entrando na viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    // Observar elementos com classe .animate-on-scroll
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        observer.observe(element);
    });
}

// Adicionar efeitos de hover em cards e elementos interativos
function enhanceInteractiveElements() {
    // Adicionar efeito de elevação em cards
    document.querySelectorAll('.user-card, .dashboard-card, .spoiler-section').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // Adicionar efeito de destaque em botões
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        button.addEventListener('click', function() {
            // Adicionar efeito de ripple
            const ripple = document.createElement('span');
            ripple.className = 'btn-ripple';
            this.appendChild(ripple);
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${event.clientX - rect.left - size/2}px`;
            ripple.style.top = `${event.clientY - rect.top - size/2}px`;
            
            ripple.classList.add('active');
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Melhorar navegação com indicador de página atual
function enhanceNavigation() {
    const currentPath = window.location.pathname;
    
    // Destacar link atual na navegação
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        
        if (href === currentPath || 
            (href === '/' && currentPath === '/index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Adicionar efeitos de parallax em imagens de fundo
function addParallaxEffects() {
    document.querySelectorAll('.parallax-bg').forEach(element => {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.pageYOffset;
            const speed = element.getAttribute('data-speed') || 0.5;
            
            element.style.transform = `translateY(${scrollPosition * speed}px)`;
        });
    });
}

// Melhorar animações de slider
function enhanceSlider() {
    const slider = document.querySelector('.slider');
    if (!slider) return;
    
    // Adicionar efeito de zoom suave nas imagens
    document.querySelectorAll('.slide img').forEach(img => {
        img.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        img.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Inicializar todas as melhorias de animação
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se o usuário prefere animações reduzidas
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
        initPageTransitions();
        initScrollAnimations();
        enhanceInteractiveElements();
        addParallaxEffects();
        enhanceSlider();
    }
    
    // Sempre melhorar a navegação, mesmo com animações reduzidas
    enhanceNavigation();
    
    // Adicionar classe para indicar que as animações estão prontas
    document.body.classList.add('animations-ready');
    
    // Remover classe de transição após carregamento
    setTimeout(() => {
        const transitionElement = document.querySelector('.page-transition');
        if (transitionElement) {
            transitionElement.classList.remove('active');
        }
    }, 300);
});

// Detectar quando a página terminou de carregar completamente
window.addEventListener('load', () => {
    document.body.classList.add('page-loaded');
});
