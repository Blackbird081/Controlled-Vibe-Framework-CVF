import streamlit as st
import pandas as pd
import random
import time
import base64
import os
import sqlite3

# --- 💾 SKILL: SQLITE HIGH SCORE ---
def init_db():
    conn = sqlite3.connect('scores.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS highscores
                 (level TEXT PRIMARY KEY, score INTEGER)''')
    conn.commit()
    conn.close()

def get_highscore(level):
    conn = sqlite3.connect('scores.db')
    c = conn.cursor()
    c.execute('SELECT score FROM highscores WHERE level=?', (level,))
    result = c.fetchone()
    conn.close()
    return result[0] if result else 0

def save_highscore(level, score):
    current = get_highscore(level)
    if score > current:
        conn = sqlite3.connect('scores.db')
        c = conn.cursor()
        c.execute('REPLACE INTO highscores (level, score) VALUES (?, ?)', (level, score))
        conn.commit()
        conn.close()
        return True
    return False

init_db()

# --- 🛠️ SKILL: VIBE & MEDIA INJECTION ---
def get_base64(file_path):
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode()

def apply_vibe():
    css_str = """
        <style>
        .stMarkdown, .stHeader, .stMetric, .stNumberInput, .stSelectbox {
            background-color: rgba(255, 255, 255, 0.85);
            padding: 15px; border-radius: 20px; border: 2px solid #00A0E9;
            margin-bottom: 10px;
        }
        
        .stButton>button {
            border-radius: 20px;
            border: 3px solid #00A0E9;
            font-size: 24px !important;
            font-weight: bold;
            padding: 20px !important;
            width: 100%;
            height: 100px;
            background-color: #f0f8ff;
            color: #ff4b4b;
            transition: all 0.3s;
        }
        
        .stButton>button:hover {
            background-color: #00A0E9;
            color: white;
            transform: scale(1.05);
        }

        @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        </style>
    """
    
    if os.path.exists("background.jpg"):
        bin_str = get_base64("background.jpg")
        css_str += f"""
        <style>
        .stApp {{
            background-image: url("data:image/jpg;base64,{bin_str}");
            background-size: cover; background-attachment: fixed;
        }}
        </style>
        """
    else:
        st.info("💡 Mẹo: Thêm file 'background.jpeg' để có hình nền hoạt hình!")
        
    st.markdown(css_str, unsafe_allow_html=True)
    
    if st.session_state.get('shake', False):
        st.markdown("<style> [data-testid='column'] { animation: shake 0.5s; } </style>", unsafe_allow_html=True)
        st.session_state.shake = False

# --- 🏆 GAME LOGIC & TITLES ---
st.set_page_config(page_title="Thám Tử Doraemon", page_icon="🐱", layout="wide")

GADGETS = ['🚁', '🚪', '🍞', '🔦', '⏱️', '📸', '💊', '🗡️', '🧢', '🕶️']

if 'score' not in st.session_state: st.session_state.score = 0
if 'combo' not in st.session_state: st.session_state.combo = 0
if 'inventory' not in st.session_state: st.session_state.inventory = []
if 'start_time' not in st.session_state: st.session_state.start_time = time.time()
if 'n1' not in st.session_state: 
    st.session_state.n1, st.session_state.n2, st.session_state.op = 5, 3, '+'
if 'shake' not in st.session_state: st.session_state.shake = False
if 'audio_to_play' not in st.session_state: st.session_state.audio_to_play = None
if 'message' not in st.session_state: st.session_state.message = None
if 'message_type' not in st.session_state: st.session_state.message_type = None

# Generation of multiple choice
if 'choices' not in st.session_state:
    st.session_state.choices = []
    st.session_state.correct_ans = 0

def get_title_and_progress(score):
    if score < 50: return "Thám Tử Trẻ em", score / 50.0
    elif score < 100: return "Thám Tử Đồng", (score - 50) / 50.0
    elif score < 200: return "Thám Tử Bạc", (score - 100) / 100.0
    elif score < 500: return "Thám Tử Vàng", (score - 200) / 300.0
    else: return "Siêu Thám Tử Doraemon", 1.0

def generate_choices(limit):
    st.session_state.n1 = random.randint(1, limit)
    st.session_state.n2 = random.randint(1, limit)
    st.session_state.op = random.choice(['+', '-'])
    
    if st.session_state.op == '-' and st.session_state.n1 < st.session_state.n2:
        st.session_state.n1, st.session_state.n2 = st.session_state.n2, st.session_state.n1
        
    correct = st.session_state.n1 + st.session_state.n2 if st.session_state.op == '+' else st.session_state.n1 - st.session_state.n2
    st.session_state.correct_ans = correct
    
    choices = [correct]
    while len(choices) < 4:
        wrong = correct + random.choice([-1, 1, -2, 2, -10, 10])
        if wrong not in choices and wrong >= 0:
            choices.append(wrong)
            
    random.shuffle(choices)
    st.session_state.choices = choices
    st.session_state.start_time = time.time()

if not st.session_state.choices:
    generate_choices(20)

apply_vibe()

with st.sidebar:
    st.header("🎒 Thông tin Thám tử")
    level = st.selectbox("Chọn Cửa ải:", ["Cửa 1: Thám tử Tập sự (20)", "Cửa 2: Thám tử Tài năng (50)", "Cửa 3: Siêu Thám tử (100)"])
    limit = 20 if "20" in level else 50 if "50" in level else 100
    
    current_title, progress = get_title_and_progress(st.session_state.score)
    
    st.markdown(f"### Danh hiệu: **{current_title}**")
    st.progress(progress)
    
    highscore = get_highscore(level)
    st.metric("🏆 Kỷ lục cao nhất", highscore)
    st.metric("⭐ Điểm thám tử", st.session_state.score)
    st.metric("🔥 Combo hiện tại", st.session_state.combo)
    
    st.markdown("---")
    st.markdown("### 🎒 Túi Bảo Bối")
    if st.session_state.inventory:
        st.markdown(" ".join(st.session_state.inventory))
    else:
        st.info("Chưa có món bảo bối nào!")
        
    st.markdown("---")
    if st.button("🔄 Chơi lại từ đầu"): 
        if save_highscore(level, st.session_state.score):
            st.toast("🎉 BẠN ĐÃ PHÁ KỶ LỤC!", icon="🏆")
        st.session_state.score = 0
        st.session_state.combo = 0
        st.session_state.inventory = []
        st.session_state.message = None
        generate_choices(limit)
        st.rerun()

# --- 🎮 GIAO DIỆN CHÍNH ---
st.title("🕵️‍♂️ THÁM TỬ NHÍ & TÚI BẢO BỐI 🐱")

if st.session_state.audio_to_play:
    file_path = st.session_state.audio_to_play
    if os.path.exists(file_path):
        audio_str = get_base64(file_path)
        st.markdown(f'<audio autoplay><source src="data:audio/mp3;base64,{audio_str}" type="audio/mp3"></audio>', unsafe_allow_html=True)
    st.session_state.audio_to_play = None

if st.session_state.message:
    if st.session_state.message_type == 'success':
        st.success(st.session_state.message)
        if st.session_state.combo > 0 and st.session_state.combo % 3 == 0: 
            st.snow()
            # Reward a gadget every 3 combo!
            new_gadget = random.choice(GADGETS)
            st.session_state.inventory.append(new_gadget)
            st.toast(f"🎁 Bạn nhận được bảo bối mới: {new_gadget}", icon=new_gadget)
        else: 
            st.balloons()
    else:
        st.error(st.session_state.message)
    st.session_state.message = None

elapsed_time = time.time() - st.session_state.start_time

if elapsed_time > 30:
    st.error("⏰ HẾT GIỜ! Thám tử nhí đã để mất dấu bảo bối rồi!")
    if st.button("🎮 Thử lại cửa này"):
        if save_highscore(level, st.session_state.score):
            st.toast("🎉 BẠN ĐÃ PHÁ KỶ LỤC!", icon="🏆")
        st.session_state.score = 0
        st.session_state.combo = 0
        generate_choices(limit)
        st.rerun()
else:
    # Đếm ngược timer visual JS giúp web không giật
    st.markdown("""
    <div style='font-size: 24px; color: #ff4b4b; font-weight: bold; margin-bottom: 20px; text-align: center;'>
        ⏳ Thời gian vòng này: <span id="timer">30</span> giây
    </div>
    <script>
        var timerElem = document.getElementById('timer');
        var timeLeft = 30; // Force reset on new render
        if (window.countdownTimer) clearInterval(window.countdownTimer);
        window.countdownTimer = setInterval(function() {
            if (timeLeft <= 0) {
                clearInterval(window.countdownTimer);
            } else {
                timeLeft--;
                if(timerElem) timerElem.innerHTML = timeLeft;
            }
        }, 1000);
    </script>
    """, unsafe_allow_html=True)
    
    st.markdown(f"<h1 style='text-align: center; font-size: 60px;'>❓ {st.session_state.n1} {st.session_state.op} {st.session_state.n2} = ?</h1>", unsafe_allow_html=True)
    
    st.write("")
    st.write("")
    
    def handle_answer(selected):
        if selected == st.session_state.correct_ans:
            st.session_state.combo += 1
            if st.session_state.combo >= 3:
                added_score = 30
            else:
                added_score = 10
            
            st.session_state.score += added_score
            st.session_state.audio_to_play = "win.mp3"
            st.session_state.message_type = 'success'
            st.session_state.message = f"✨ CHÍNH XÁC! COMBO X{st.session_state.combo}! Doraemon tặng bạn bảo bối!"
            
            if save_highscore(level, st.session_state.score):
                st.toast("🎉 BẠN ĐÃ PHÁ KỶ LỤC!", icon="🏆")
                
            generate_choices(limit)
        else:
            st.session_state.combo = 0
            st.session_state.shake = True
            st.session_state.audio_to_play = "wrong.mp3"
            st.session_state.message_type = 'error'
            st.session_state.message = "❌ Nhầm rồi! Thám tử nhí hãy suy nghĩ lại nhé!"
    
    # Render multiple choice buttons in 2 columns
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button(f"👉 {st.session_state.choices[0]}", key="btn0"):
            handle_answer(st.session_state.choices[0])
            st.rerun()
        if st.button(f"👉 {st.session_state.choices[1]}", key="btn1"):
            handle_answer(st.session_state.choices[1])
            st.rerun()
            
    with col2:
        if st.button(f"👉 {st.session_state.choices[2]}", key="btn2"):
            handle_answer(st.session_state.choices[2])
            st.rerun()
        if st.button(f"👉 {st.session_state.choices[3]}", key="btn3"):
            handle_answer(st.session_state.choices[3])
            st.rerun()