// Funções utilitárias
function getSessionUser() {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    try {
        return JSON.parse(userJson);
    } catch (e) {
        console.error('Erro ao analisar dados do usuário:', e);
        return null;
    }
}

function setSessionUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem('user');
}

// Função para mostrar alertas
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alert-container');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        ${message}
        <button class="alert-close">&times;</button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Adicionar evento de clique para fechar o alerta
    const closeBtn = alert.querySelector('.alert-close');
    closeBtn.addEventListener('click', () => {
        alert.classList.add('hide');
        setTimeout(() => {
            alertContainer.removeChild(alert);
        }, 300);
    });
    
    // Fechar automaticamente após 5 segundos
    setTimeout(() => {
        if (alertContainer.contains(alert)) {
            alert.classList.add('hide');
            setTimeout(() => {
                if (alertContainer.contains(alert)) {
                    alertContainer.removeChild(alert);
                }
            }, 300);
        }
    }, 5000);
}

// Configurar evento de logout
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Limpar sessão
            clearSession();
            
            // Mostrar alerta
            showAlert('Logout realizado com sucesso!', 'success');
            
            // Adicionar efeito de transição de página
            const pageTransition = document.querySelector('.page-transition');
            if (pageTransition) {
                pageTransition.classList.add('active');
                
                // Redirecionar após a transição
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 500);
            } else {
                // Redirecionar imediatamente se não houver transição
                window.location.href = '/login.html';
            }
        });
    }
    
    // Adicionar efeito de transição de página ao carregar
    const pageTransition = document.querySelector('.page-transition');
    if (pageTransition) {
        pageTransition.classList.add('active');
        setTimeout(() => {
            pageTransition.classList.remove('active');
        }, 300);
    }
});

// Função para validar formulários
function validateForm(form, rules) {
    const errors = {};
    
    for (const field in rules) {
        const value = form[field].value.trim();
        const fieldRules = rules[field];
        
        if (fieldRules.required && !value) {
            errors[field] = 'Este campo é obrigatório';
            continue;
        }
        
        if (fieldRules.minLength && value.length < fieldRules.minLength) {
            errors[field] = `Este campo deve ter pelo menos ${fieldRules.minLength} caracteres`;
            continue;
        }
        
        if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
            errors[field] = `Este campo deve ter no máximo ${fieldRules.maxLength} caracteres`;
            continue;
        }
        
        if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
            errors[field] = fieldRules.message || 'Formato inválido';
            continue;
        }
        
        if (fieldRules.match && value !== form[fieldRules.match].value) {
            errors[field] = 'Os valores não correspondem';
            continue;
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

// Função para aplicar efeitos de animação em elementos ao entrar na viewport
function setupScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Inicializar animações de scroll quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setupScrollAnimations();
});

// Função para formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Função para gerar ID único
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Função para debounce (limitar chamadas de função)
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Função para adicionar efeitos de hover em cards
function setupCardHoverEffects() {
    const cards = document.querySelectorAll('.hover-effect');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('hovered');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('hovered');
        });
    });
}

// Inicializar efeitos de hover quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setupCardHoverEffects();
});
