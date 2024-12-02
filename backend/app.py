from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager,
    jwt_required,
    get_jwt_identity,
    create_access_token,
)
import datetime
from collections import defaultdict
import time

app = Flask(__name__)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:8081", "http://localhost:19006"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
)

# 配置
app.config["SECRET_KEY"] = "your-secret-key"  # 用于JWT签名
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# JWT配置
app.config["JWT_SECRET_KEY"] = "your-secret-key"  # 修改为你的密钥
jwt = JWTManager(app)  # 初始化 JWT

db = SQLAlchemy(app)
socketio = SocketIO(
    app, cors_allowed_origins=["http://localhost:8081", "http://localhost:19006"]
)

# 在 socketio = SocketIO(...) 之后添加
connected_users = {}


@socketio.on("connect")
def handle_connect():
    print("Client connected")
    connected_users[request.sid] = request.sid  # 存储连接的用户


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")
    if request.sid in connected_users:
        del connected_users[request.sid]


# 用户模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    coins = db.Column(db.Integer, default=0)
    total_sessions = db.Column(db.Integer, default=0)
    total_focus_time = db.Column(db.Integer, default=0)

    def update_coins(self, amount):
        self.coins += amount
        db.session.commit()


# 创建数据库表
with app.app_context():
    db.create_all()  # 创建新表


@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"message": "Username and password are required"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"message": "Username already exists"}), 400

        hashed_password = generate_password_hash(password)
        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        access_token = create_access_token(
            identity=new_user.id, expires_delta=datetime.timedelta(days=1)
        )

        return jsonify(
            {
                "token": access_token,
                "user": {"id": new_user.id, "username": new_user.username},
            }
        ), 201
    except Exception as e:
        print(f"Registration error: {str(e)}")  # 添加错误日志
        return jsonify({"message": "Server error"}), 500


@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"message": "Username and password are required"}), 400

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password, password):
            return jsonify({"message": "Invalid username or password"}), 401

        access_token = create_access_token(
            identity=user.id, expires_delta=datetime.timedelta(days=1)
        )

        return jsonify(
            {"token": access_token, "user": {"id": user.id, "username": user.username}}
        )
    except Exception as e:
        print(f"Login error: {str(e)}")  # 添加错误日志
        return jsonify({"message": "Server error"}), 500


# 存储等待配对的用户
waiting_users = defaultdict(
    list
)  # key: focus_time, value: list of (user_id, username) tuples


@socketio.on("start_matching")
def handle_matching(data):
    user_id = request.sid
    focus_time = data.get("focus_time")
    username = data.get("username")

    # 将用户添加到等待列表
    waiting_users[focus_time].append((user_id, username))

    # 检查是否有其他用户在等待相同时长
    if len(waiting_users[focus_time]) >= 2:
        # 获取第一个等待的用户
        partner_id, partner_username = waiting_users[focus_time][0]
        if partner_id != user_id:
            # 匹配成功，通知双方
            emit(
                "match_success",
                {"partner_id": user_id, "partner_username": username},
                room=partner_id,
            )
            emit(
                "match_success",
                {"partner_id": partner_id, "partner_username": partner_username},
                room=user_id,
            )
            # 从等待列表中移除这两个用户
            waiting_users[focus_time].remove((partner_id, partner_username))
            waiting_users[focus_time].remove((user_id, username))
            return

    # 设置30秒超时
    socketio.sleep(30)

    # 检查用户是否还在等待列表中
    if user_id in waiting_users[focus_time]:
        waiting_users[focus_time].remove(user_id)
        emit("match_timeout", room=user_id)


@socketio.on("leaving_session")
def handle_leaving(data):
    partner_id = data.get("partner_id")
    if partner_id:
        # 通知伙伴该用户已离开
        print(f"partner_left event emitted to partner_id: {partner_id}")
        emit("partner_left", room=partner_id)


@socketio.on("session_complete")
def handle_completion(data):
    partner_id = data.get("partner_id")
    print(f"session_complete received for partner_id: {partner_id}")
    print(f"Current connected users: {connected_users}")  # 添加日志
    if partner_id:
        time.sleep(0.1)
        print(f"Attempting to emit partner_complete to room: {partner_id}")
        emit("partner_complete", room=partner_id)
        print(f"partner_complete event emitted to partner_id: {partner_id}")


@app.route("/api/coins/update", methods=["POST"])
@jwt_required()
def update_coins():
    data = request.get_json()
    amount = data.get("amount")
    user_id = get_jwt_identity()

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    user.update_coins(amount)
    return jsonify({"message": "Coins updated successfully", "coins": user.coins})


@app.route("/api/coins", methods=["GET"])
@jwt_required()
def get_coins():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify({"coins": user.coins})


@socketio.on("notify_leaving")
def handle_notify_leaving(partner_id):
    print(f"notify_leaving event received. partner_id: {partner_id}")
    # 确保 partner_id 存在且有效
    if partner_id and partner_id in connected_users:
        print(f"Emitting partner_left event to partner_id: {partner_id}")
        emit("partner_left", room=connected_users[partner_id])
    else:
        print(
            f"Failed to emit partner_left. partner_id {partner_id} not found in connected_users"
        )


@app.route("/api/user/stats", methods=["GET"])
@jwt_required()
def get_user_stats():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify(
        {
            "totalSessions": user.total_sessions,
            "totalFocusTime": user.total_focus_time,
            "coins": user.coins,
        }
    )


@app.route("/api/focus/complete", methods=["POST"])
@jwt_required()
def complete_focus():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    focus_time = data.get("focusTime")
    if user:
        user.total_sessions += 1
        user.total_focus_time += focus_time
        db.session.commit()

    return jsonify({"success": True})


if __name__ == "__main__":
    socketio.run(app, debug=True)
