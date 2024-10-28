from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from collections import defaultdict

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# 配置
app.config["SECRET_KEY"] = "your-secret-key"  # 用于JWT签名
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# 用户模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

    def __init__(self, username, password):
        self.username = username
        self.password = generate_password_hash(password)


# 创建数据库表
with app.app_context():
    db.create_all()


# 登录路由
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "用户名和密码不能为空"}), 400

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password, password):
        # 生成 JWT token
        token = jwt.encode(
            {
                "user_id": user.id,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
            },
            app.config["SECRET_KEY"],
        )

        return jsonify(
            {"token": token, "user": {"id": user.id, "username": user.username}}
        )

    return jsonify({"message": "用户名或密码错误"}), 401


# 注册路由
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "用户名和密码不能为空"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "用户名已存在"}), 400

    new_user = User(username=username, password=password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "注册成功"}), 201


# 存储等待配对的用户
waiting_users = defaultdict(list)  # key: focus_time, value: list of user_ids


@socketio.on("connect")
def handle_connect():
    print("Client connected")


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")
    # 清理等待列表中的断开连接的用户
    for time_slot in waiting_users:
        if request.sid in waiting_users[time_slot]:
            waiting_users[time_slot].remove(request.sid)


@socketio.on("start_matching")
def handle_matching(data):
    user_id = request.sid
    focus_time = data.get("focus_time")

    # 将用户添加到等待列表
    waiting_users[focus_time].append(user_id)

    # 检查是否有其他用户在等待相同时长
    if len(waiting_users[focus_time]) >= 2:
        # 获取第一个等待的用户
        partner_id = waiting_users[focus_time][0]
        if partner_id != user_id:
            # 匹配成功，通知双方
            emit("match_success", {"partner_id": user_id}, room=partner_id)
            emit("match_success", {"partner_id": partner_id}, room=user_id)
            # 从等待列表中移除这两个用户
            waiting_users[focus_time].remove(partner_id)
            waiting_users[focus_time].remove(user_id)
            return

    # 设置30秒超时
    socketio.sleep(30)

    # 检查用户是否还在等待列表中
    if user_id in waiting_users[focus_time]:
        waiting_users[focus_time].remove(user_id)
        emit("match_timeout", room=user_id)


if __name__ == "__main__":
    socketio.run(app, debug=True)
