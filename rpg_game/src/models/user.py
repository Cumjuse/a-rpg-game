from flask_sqlalchemy import SQLAlchemy
import datetime
import secrets
import hashlib

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    key_auth = db.Column(db.String(64), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    profile_image = db.Column(db.String(255), nullable=True, default='default.png')
    likes = db.Column(db.Integer, default=0)
    is_admin = db.Column(db.Boolean, default=False)
    is_banned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def __init__(self, username, password, is_admin=False):
        self.username = username
        self.set_password(password)
        self.key_auth = self.generate_key_auth()
        self.is_admin = is_admin
    
    def set_password(self, password):
        self.password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    def check_password(self, password):
        return self.password_hash == hashlib.sha256(password.encode()).hexdigest()
    
    def generate_key_auth(self):
        return secrets.token_hex(32)  # 64 caracteres hexadecimais

class UserLike(db.Model):
    __tablename__ = 'user_likes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    liker_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    ip_address = db.Column(db.String(45), nullable=False)  # IPv6 pode ter até 45 caracteres
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Garantir que um usuário só possa dar like uma vez por IP
    __table_args__ = (
        db.UniqueConstraint('user_id', 'liker_id', 'ip_address', name='unique_like'),
    )
