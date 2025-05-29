from flask import Blueprint, request, jsonify, session, current_app
from src.models.user import db, User, UserLike
import hashlib
import secrets
import functools

user_bp = Blueprint('user', __name__)

# Decorator para verificar autenticação
def login_required(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Autenticação necessária'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Decorator para verificar permissões de administrador
def admin_required(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Autenticação necessária'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
            return jsonify({'success': False, 'message': 'Permissão negada'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

# Rota para registro de usuário
@user_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'success': False, 'message': 'Dados incompletos'}), 400
    
    username = data['username'].strip()
    password = data['password']
    
    # Validações básicas
    if len(username) < 3 or len(username) > 50:
        return jsonify({'success': False, 'message': 'Nome de usuário deve ter entre 3 e 50 caracteres'}), 400
    
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Senha deve ter pelo menos 6 caracteres'}), 400
    
    # Verificar se usuário já existe
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'success': False, 'message': 'Nome de usuário já está em uso'}), 400
    
    # Criar novo usuário
    new_user = User(username=username, password=password)
    db.session.add(new_user)
    
    try:
        db.session.commit()
        return jsonify({
            'success': True, 
            'message': 'Usuário registrado com sucesso',
            'key_auth': new_user.key_auth
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao registrar usuário: {str(e)}'}), 500

# Rota para login
@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'success': False, 'message': 'Dados incompletos'}), 400
    
    username = data['username'].strip()
    password = data['password']
    
    # Buscar usuário
    user = User.query.filter_by(username=username).first()
    
    # Verificar se usuário existe e senha está correta
    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Usuário ou senha inválidos'}), 401
    
    # Verificar se usuário está banido
    if user.is_banned:
        return jsonify({'success': False, 'message': 'Sua conta foi banida'}), 403
    
    # Criar sessão
    session['user_id'] = user.id
    
    return jsonify({
        'success': True,
        'message': 'Login realizado com sucesso',
        'user': {
            'id': user.id,
            'username': user.username,
            'is_admin': user.is_admin,
            'key_auth': user.key_auth
        }
    }), 200

# Rota para logout
@user_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'success': True, 'message': 'Logout realizado com sucesso'}), 200

# Rota para obter perfil do usuário
@user_bp.route('/profile/<username>', methods=['GET'])
def get_profile(username):
    user = User.query.filter_by(username=username).first()
    
    if not user:
        return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404
    
    if user.is_banned:
        return jsonify({'success': False, 'message': 'Este perfil foi banido'}), 403
    
    return jsonify({
        'success': True,
        'profile': {
            'username': user.username,
            'description': user.description,
            'profile_image': user.profile_image,
            'likes': user.likes,
            'created_at': user.created_at.isoformat()
        }
    }), 200

# Rota para atualizar perfil
@user_bp.route('/profile/update', methods=['PUT'])
@login_required
def update_profile():
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'Dados incompletos'}), 400
    
    user = User.query.get(session['user_id'])
    
    if 'description' in data:
        user.description = data['description']
    
    # A atualização da imagem seria feita por outra rota específica para upload
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Perfil atualizado com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao atualizar perfil: {str(e)}'}), 500

# Rota para dar like em um perfil
@user_bp.route('/profile/<int:user_id>/like', methods=['POST'])
@login_required
def like_profile(user_id):
    # Não permitir dar like em si mesmo
    if user_id == session['user_id']:
        return jsonify({'success': False, 'message': 'Você não pode dar like em seu próprio perfil'}), 400
    
    # Verificar se o usuário existe
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404
    
    # Obter IP do usuário para evitar múltiplos likes
    ip_address = request.remote_addr
    
    # Verificar se já deu like
    existing_like = UserLike.query.filter_by(
        user_id=user_id,
        liker_id=session['user_id'],
        ip_address=ip_address
    ).first()
    
    if existing_like:
        return jsonify({'success': False, 'message': 'Você já deu like neste perfil'}), 400
    
    # Registrar o like
    new_like = UserLike(
        user_id=user_id,
        liker_id=session['user_id'],
        ip_address=ip_address
    )
    
    # Incrementar contador de likes
    target_user.likes += 1
    
    db.session.add(new_like)
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Like registrado com sucesso', 'likes': target_user.likes}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao registrar like: {str(e)}'}), 500

# Rotas de administração

# Rota para banir usuário
@user_bp.route('/admin/ban/<int:user_id>', methods=['POST'])
@admin_required
def ban_user(user_id):
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404
    
    # Não permitir banir a si mesmo
    if user_id == session['user_id']:
        return jsonify({'success': False, 'message': 'Você não pode banir a si mesmo'}), 400
    
    user.is_banned = True
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Usuário banido com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao banir usuário: {str(e)}'}), 500

# Rota para desbanir usuário
@user_bp.route('/admin/unban/<int:user_id>', methods=['POST'])
@admin_required
def unban_user(user_id):
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404
    
    user.is_banned = False
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Usuário desbanido com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao desbanir usuário: {str(e)}'}), 500

# Rota para definir quantidade de likes
@user_bp.route('/admin/set-likes/<int:user_id>', methods=['POST'])
@admin_required
def set_likes(user_id):
    data = request.get_json()
    
    if not data or 'likes' not in data:
        return jsonify({'success': False, 'message': 'Dados incompletos'}), 400
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404
    
    try:
        likes = int(data['likes'])
        if likes < 0:
            return jsonify({'success': False, 'message': 'Quantidade de likes deve ser não-negativa'}), 400
        
        user.likes = likes
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Quantidade de likes atualizada com sucesso'}), 200
    except ValueError:
        return jsonify({'success': False, 'message': 'Valor de likes inválido'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao atualizar likes: {str(e)}'}), 500

# Rota para listar todos os usuários (apenas para admin)
@user_bp.route('/admin/users', methods=['GET'])
@admin_required
def list_users():
    users = User.query.all()
    
    user_list = [{
        'id': user.id,
        'username': user.username,
        'likes': user.likes,
        'is_banned': user.is_banned,
        'created_at': user.created_at.isoformat()
    } for user in users]
    
    return jsonify({'success': True, 'users': user_list}), 200
