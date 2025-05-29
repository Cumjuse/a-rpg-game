// Funções de segurança e validação

// Sanitização de entrada para prevenir XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validação de força de senha
function validatePasswordStrength(password) {
  // Pelo menos 6 caracteres, com pelo menos um número e uma letra
  const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
  return regex.test(password);
}

// Proteção contra CSRF
function addCSRFToken() {
  // Gerar token CSRF
  const csrfToken = generateRandomToken();
  localStorage.setItem('csrf_token', csrfToken);
  
  // Adicionar token a todos os formulários
  document.querySelectorAll('form').forEach(form => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'csrf_token';
    input.value = csrfToken;
    form.appendChild(input);
  });
  
  return csrfToken;
}

// Verificar token CSRF
function verifyCSRFToken(token) {
  return token === localStorage.getItem('csrf_token');
}

// Gerar token aleatório
function generateRandomToken() {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Proteção contra brute force
const loginAttempts = {
  count: 0,
  lastAttempt: 0,
  lockUntil: 0
};

function checkLoginAttempts() {
  const now = Date.now();
  
  // Resetar contagem após 30 minutos
  if (now - loginAttempts.lastAttempt > 30 * 60 * 1000) {
    loginAttempts.count = 0;
  }
  
  // Verificar se está bloqueado
  if (loginAttempts.lockUntil > now) {
    const remainingMinutes = Math.ceil((loginAttempts.lockUntil - now) / (60 * 1000));
    showAlert(`Muitas tentativas de login. Tente novamente em ${remainingMinutes} minutos.`, 'error');
    return false;
  }
  
  return true;
}

function recordLoginAttempt(success) {
  const now = Date.now();
  loginAttempts.lastAttempt = now;
  
  if (success) {
    // Resetar contagem em caso de sucesso
    loginAttempts.count = 0;
    return;
  }
  
  // Incrementar contagem de tentativas
  loginAttempts.count++;
  
  // Bloquear após 5 tentativas falhas
  if (loginAttempts.count >= 5) {
    // Bloquear por 15 minutos
    loginAttempts.lockUntil = now + 15 * 60 * 1000;
    showAlert('Muitas tentativas de login. Tente novamente em 15 minutos.', 'error');
  }
}

// Proteção contra clickjacking
function preventClickjacking() {
  if (window.self !== window.top) {
    // O site está sendo carregado em um iframe
    window.top.location = window.self.location;
  }
}

// Validação de formulários
function validateForm(formId, rules) {
  const form = document.getElementById(formId);
  if (!form) return false;
  
  let isValid = true;
  
  // Verificar cada campo conforme as regras
  for (const field in rules) {
    const input = form.querySelector(`[name="${field}"]`);
    if (!input) continue;
    
    const value = input.value.trim();
    const fieldRules = rules[field];
    
    // Verificar se é obrigatório
    if (fieldRules.required && value === '') {
      showFieldError(input, 'Este campo é obrigatório');
      isValid = false;
      continue;
    }
    
    // Verificar comprimento mínimo
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      showFieldError(input, `Mínimo de ${fieldRules.minLength} caracteres`);
      isValid = false;
      continue;
    }
    
    // Verificar comprimento máximo
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      showFieldError(input, `Máximo de ${fieldRules.maxLength} caracteres`);
      isValid = false;
      continue;
    }
    
    // Verificar padrão regex
    if (fieldRules.pattern && !new RegExp(fieldRules.pattern).test(value)) {
      showFieldError(input, fieldRules.message || 'Formato inválido');
      isValid = false;
      continue;
    }
    
    // Verificar função de validação personalizada
    if (fieldRules.validate && typeof fieldRules.validate === 'function') {
      const validationResult = fieldRules.validate(value);
      if (validationResult !== true) {
        showFieldError(input, validationResult || 'Valor inválido');
        isValid = false;
        continue;
      }
    }
    
    // Limpar erro se o campo for válido
    clearFieldError(input);
  }
  
  return isValid;
}

// Mostrar erro de campo
function showFieldError(input, message) {
  // Remover mensagem de erro existente
  clearFieldError(input);
  
  // Adicionar classe de erro
  input.classList.add('input-error');
  
  // Criar e adicionar mensagem de erro
  const errorElement = document.createElement('div');
  errorElement.className = 'field-error';
  errorElement.textContent = message;
  
  // Inserir após o input
  input.parentNode.insertBefore(errorElement, input.nextSibling);
}

// Limpar erro de campo
function clearFieldError(input) {
  // Remover classe de erro
  input.classList.remove('input-error');
  
  // Remover mensagem de erro
  const errorElement = input.parentNode.querySelector('.field-error');
  if (errorElement) {
    errorElement.parentNode.removeChild(errorElement);
  }
}

// Proteção contra ataques de timing (simulação)
function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// Inicialização de segurança
document.addEventListener('DOMContentLoaded', () => {
  // Prevenir clickjacking
  preventClickjacking();
  
  // Adicionar token CSRF
  const csrfToken = addCSRFToken();
  
  // Sobrescrever a função de login para adicionar validações
  const originalLogin = window.login;
  window.login = async function(username, password) {
    // Verificar tentativas de login
    if (!checkLoginAttempts()) {
      return Promise.reject(new Error('Muitas tentativas de login'));
    }
    
    try {
      // Validar força da senha
      if (!validatePasswordStrength(password)) {
        showAlert('A senha deve ter pelo menos 6 caracteres, incluindo números e letras', 'error');
        recordLoginAttempt(false);
        return Promise.reject(new Error('Senha fraca'));
      }
      
      // Chamar função original de login
      const result = await originalLogin(username, password);
      recordLoginAttempt(true);
      return result;
    } catch (error) {
      recordLoginAttempt(false);
      throw error;
    }
  };
  
  // Configurar validação para formulário de registro
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      const isValid = validateForm('register-form', {
        username: {
          required: true,
          minLength: 3,
          maxLength: 50,
          pattern: '^[a-zA-Z0-9_]+$',
          message: 'Nome de usuário deve conter apenas letras, números e underscore'
        },
        password: {
          required: true,
          validate: validatePasswordStrength,
          message: 'A senha deve ter pelo menos 6 caracteres, incluindo números e letras'
        },
        'confirm-password': {
          required: true,
          validate: value => {
            const password = document.getElementById('password').value;
            return value === password || 'As senhas não coincidem';
          }
        }
      });
      
      if (!isValid) {
        e.preventDefault();
        return false;
      }
    });
  }
  
  // Configurar validação para formulário de login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      const isValid = validateForm('login-form', {
        username: {
          required: true
        },
        password: {
          required: true
        }
      });
      
      if (!isValid) {
        e.preventDefault();
        return false;
      }
    });
  }
  
  // Configurar validação para formulário de edição de perfil
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
      const isValid = validateForm('profile-form', {
        description: {
          maxLength: 500,
          message: 'A descrição não pode ter mais de 500 caracteres'
        }
      });
      
      if (!isValid) {
        e.preventDefault();
        return false;
      }
    });
  }
});
