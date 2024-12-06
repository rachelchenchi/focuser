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
import logging
import math


def calculate_medication_effect(medication, dose_time, current_time):
    """
    Calculate the effect level of a medication at the current time.

    :param medication: Medication object with pharmacokinetic properties.
    :param dose_time: datetime when the dose was taken.
    :param current_time: datetime for which we want to calculate the effect.
    :return: Effect level between 0 and 1.
    """
    time_since_dose = (current_time - dose_time).total_seconds() / 3600  # Convert to hours

    if time_since_dose < 0 or time_since_dose > medication.duration:
        return 0  # No effect before dose or after duration

    # Simplified effect model: Gaussian curve centered at peak time
    peak_time = medication.onset + (medication.peak - medication.onset) / 2
    sigma = (medication.peak - medication.onset) / 2

    effect = math.exp(-0.5 * ((time_since_dose - peak_time) / sigma) ** 2)

    return effect


def fetch_medication_effects(user_id):
    try:
        # Fetch medications and dose logs for the user
        medications = Medication.query.filter_by(user_id=user_id).all()
        dose_logs = DoseLog.query.filter_by(user_id=user_id).all()

        # Build effect curves
        effects = []

        for med in medications:
            med_dose_logs = [log for log in dose_logs if log.medication_id == med.id]
            effect_curve = []

            # Define time range (e.g., from earliest dose to now)
            time_points = []
            for log in med_dose_logs:
                # Generate time points from dose time to dose time + duration
                start_time = log.dose_time
                end_time = log.dose_time + datetime.timedelta(hours=med.duration)
                for i in range(int((end_time - start_time).total_seconds() // 3600) + 1):
                    t = start_time + datetime.timedelta(hours=i)
                    if t not in time_points:
                        time_points.append(t)


            # Remove duplicates and sort
            time_points = sorted(set(time_points))

            # Calculate effect levels
            for t in time_points:
                total_effect = 0
                for log in med_dose_logs:
                    effect_level = calculate_medication_effect(med, log.dose_time, t)
                    total_effect += effect_level
                if total_effect > 0:
                    effect_curve.append({
                        "time": t.isoformat(),
                        "level": min(total_effect, 1.0)  # Cap effect level at 1.0
                    })

            effects.append({
                "medication_id": med.id,
                "name": med.name,
                "effect_curve": effect_curve
            })

        return {"effects": effects}, 200

    except Exception as e:
        logging.error(f"Failed to fetch medication effects: {e}")
        return {"message": "Failed to fetch medication effects"}, 500


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


# Logger setup
logging.basicConfig(level=logging.INFO)


# 用户模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    coins = db.Column(db.Integer, default=0)
    total_sessions = db.Column(db.Integer, default=0)
    total_focus_time = db.Column(db.Integer, default=0)
    active_meds = db.Column(db.Integer, default=0)

    def update_coins(self, amount):
        self.coins += amount
        db.session.commit()

    def update_active_meds(self, increment=True):
        self.active_meds = self.active_meds + 1 if increment else max(0, self.active_meds - 1)
        db.session.commit()

# Add Meds table: managing medications
class Medication(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    dosage = db.Column(db.Integer, nullable=False)
    frequency = db.Column(db.String(50), nullable=False)

    # effects
    onset = db.Column(db.Float, nullable=False, default=1.0)      # in hours
    peak = db.Column(db.Float, nullable=False, default=4.0)       
    duration = db.Column(db.Float, nullable=False, default=12.0)   

# Dose-logs table
class DoseLog(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    medication_id = db.Column(db.Integer, db.ForeignKey('medication.id'), nullable=False)
    dose_time = db.Column(db.DateTime, default=datetime.datetime.now(datetime.timezone.utc), nullable=False)


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
            "activeMeds": user.active_meds,
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


@app.route("/api/medications", methods=["GET"])
@jwt_required()
def get_medications():
    try:
        user_id = get_jwt_identity()
        medications = Medication.query.filter_by(user_id=user_id).all()
        return jsonify([
            {
                "id": med.id,
                "name": med.name,
                "dosage": med.dosage,
                "frequency": med.frequency,
                "onset": med.onset,
                "peak": med.peak,
                "duration": med.duration
            }
            for med in medications
        ]), 200
    except Exception as e:
        logging.error(f"Failed to fetch medications: {e}")
        return jsonify({"message": "Failed to fetch medications"}), 500


@app.route("/api/medications", methods=["POST"])
@jwt_required()
def add_medication():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Check for duplicate medication
        existing_medication = Medication.query.filter_by(
            user_id=user_id, name=data["name"], dosage=data["dosage"], frequency=data["frequency"]
        ).first()
        if existing_medication:
            return jsonify({"message": "Medication already exists"}), 400

        # Add medication
        medication = Medication(
            user_id=user_id,
            name=data["name"],
            dosage=data["dosage"],
            frequency=data["frequency"],
            onset=data.get("onset", 1.0),    
            peak=data.get("peak", 3.0),     
            duration=data.get("duration", 8.0)
        )
        db.session.add(medication)
        db.session.commit()

        # Update active meds count
        user = User.query.get(user_id)
        if user:
            user.update_active_meds(increment=True)

        return jsonify({
            "id": medication.id,
            "name": medication.name,
            "dosage": medication.dosage,
            "frequency": medication.frequency,
            "onset": medication.onset,   
            "peak": medication.peak,      
            "duration": medication.duration  
        }), 201
    except Exception as e:
        logging.error(f"Failed to add medication: {e}")
        return jsonify({"message": "Failed to add medication"}), 500


@app.route("/api/medications/<int:med_id>", methods=["PUT"])
@jwt_required()
def update_medication(med_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Fetch medication
        medication = Medication.query.filter_by(id=med_id, user_id=user_id).first()
        if not medication:
            return jsonify({"message": "Medication not found"}), 404

        # Check for duplicate medication
        existing_medication = Medication.query.filter_by(
            user_id=user_id, name=data["name"], dosage=data["dosage"], frequency=data["frequency"]
        ).first()
        if existing_medication:
            return jsonify({"message": "Medication already exists"}), 400

        # Update medication
        medication.name = data["name"]
        medication.dosage = data["dosage"]
        medication.frequency = data["frequency"]
        medication.onset = data.get("onset", medication.onset)    
        medication.peak = data.get("peak", medication.peak)     
        medication.duration = data.get("duration", medication.duration)
        db.session.commit()

        return jsonify({
            "id": medication.id,
            "name": medication.name,
            "dosage": medication.dosage,
            "frequency": medication.frequency,
            "onset": medication.onset,    
            "peak": medication.peak,  
            "duration": medication.duration
        }), 200
    except Exception as e:
        logging.error(f"Failed to update medication: {e}")
        return jsonify({"message": "Failed to update medication"}), 500


@app.route("/api/medications/<int:med_id>", methods=["DELETE"])
@jwt_required()
def delete_medication(med_id):
    try:
        user_id = get_jwt_identity()

        # Fetch medication
        medication = Medication.query.filter_by(id=med_id, user_id=user_id).first()
        if not medication:
            return jsonify({"message": "Medication not found"}), 404

        # Delete medication
        db.session.delete(medication)
        db.session.commit()

        # Update active meds count
        user = User.query.get(user_id)
        if user:
            user.update_active_meds(increment=False)

        return jsonify({"message": "Medication deleted successfully"}), 200
    except Exception as e:
        logging.error(f"Failed to delete medication: {e}")
        return jsonify({"message": "Failed to delete medication"}), 500


@app.route("/api/doselogs", methods=["GET"])
@jwt_required()
def get_dose_logs():
    try:
        user_id = get_jwt_identity()
        logs = DoseLog.query.filter_by(user_id=user_id).all()
        return jsonify([
            {"id": log.id, "medication_id": log.medication_id, "dose_time": log.dose_time.isoformat()}
            for log in logs
        ]), 200
    except Exception as e:
        logging.error(f"Failed to fetch dose logs: {e}")
        return jsonify({"message": "Failed to fetch dose logs"}), 500


@app.route("/api/doselogs", methods=["POST"])
@jwt_required()
def add_dose_log():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        app.logger.info(f"Received data: {data}")

        # Validate input
        medication_id = data.get("medication_id")
        hours = data.get("hours")
        minutes = data.get("minutes")

        if not medication_id or hours is None or minutes is None:
            return jsonify({"message": "Medication ID, hours, and minutes are required"}), 400

        # Validate medication ownership
        medication = Medication.query.filter_by(id=medication_id, user_id=user_id).first()
        if not medication:
            return jsonify({"message": "Medication not found for the user"}), 404

        # Create the full dose time using today's date
        now = datetime.datetime.now()
        dose_time = datetime.datetime(
            year=now.year,
            month=now.month,
            day=now.day,
            hour=int(hours),
            minute=int(minutes),
            tzinfo=datetime.timezone.utc
        )
        app.logger.info(f"Constructed dose_time: {dose_time}")

        # Add dose log
        dose_log = DoseLog(
            user_id=user_id,
            medication_id=medication_id,
            dose_time=dose_time,
        )
        db.session.add(dose_log)
        db.session.commit()

        return jsonify({
            "message": "Dose log added successfully",
            "dose_time": dose_log.dose_time.isoformat(),
        }), 201
    except Exception as e:
        app.logger.error(f"Failed to add dose log: {e}", exc_info=True)
        return jsonify({"message": "Failed to add dose log"}), 500


@app.route("/api/doselogs/<int:log_id>", methods=["DELETE"])
@jwt_required()
def delete_dose_log(log_id):
    try:
        user_id = get_jwt_identity()
        # Fetch the dose log
        dose_log = DoseLog.query.filter_by(id=log_id, user_id=user_id).first()
        if not dose_log:
            return jsonify({"message": "Dose log not found"}), 404

        db.session.delete(dose_log)
        db.session.commit()

        return jsonify({"message": "Dose log deleted successfully"}), 200

    except Exception as e:
        logging.error(f"Failed to delete dose log: {e}")
        return jsonify({"message": "Failed to delete dose log"}), 500


@app.route("/api/medication-effects", methods=["GET"])
@jwt_required()
def get_medication_effects():
    user_id = get_jwt_identity()
    data, status_code = fetch_medication_effects(user_id)
    return jsonify(data), status_code


@app.route("/api/focus-zones", methods=["GET"])
@jwt_required()
def get_focus_zones():
    try:
        user_id = get_jwt_identity()

        # Use the helper function to fetch medication effects
        effects_data, status_code = fetch_medication_effects(user_id)
        if status_code != 200:
            return jsonify(effects_data), status_code  # Pass error response directly

        effects = effects_data.get("effects", [])

        # Aggregate effects at each time point
        time_effects = {}
        for med_effect in effects:
            for point in med_effect["effect_curve"]:
                time = point["time"]
                level = point["level"]
                time_effects[time] = time_effects.get(time, 0) + level

        # Identify focus zones where combined effect exceeds a threshold (e.g., 0.7)
        threshold = 0.7
        focus_zones = []
        current_zone = None

        for time in sorted(time_effects.keys()):
            total_effect = time_effects[time]
            if total_effect >= threshold:
                if not current_zone:
                    current_zone = {"start": time, "end": time}
                else:
                    current_zone["end"] = time
            elif current_zone:
                    focus_zones.append(current_zone)
                    current_zone = None

        if current_zone:
            focus_zones.append(current_zone)

        return jsonify({"focus_zones": focus_zones}), 200

    except Exception as e:
        logging.error(f"Failed to get focus zones: {e}")
        return jsonify({"message": "Failed to get focus zones"}), 500



if __name__ == "__main__":
    socketio.run(app, debug=True)
