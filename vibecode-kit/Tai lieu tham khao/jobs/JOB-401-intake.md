## 6. Persona & Scenarios (STEP 1)

### Persona 1 – Dân văn phòng Sài Gòn (người hay bị giao nhiệm vụ chọn quán)
- Tuổi: 24–35  
- Làm văn phòng Q1–Q3–Phú Nhuận  
- Thường đi nhậu team 4–8 người  
- Rất sợ “chọn sai quán” vì bị đồng nghiệp cà khịa  
- Không có thời gian đọc review  
- Chỉ muốn quán ngon – thoáng – giá hợp lý  

### Persona 2 – Nhóm bạn thân (tụ tập cuối tuần)
- Nhóm 3–6 người  
- Ưa đồ nướng / lẩu / dê / hải sản  
- Quan trọng vibe: vỉa hè, thoáng, rộng, không sang  
- Ngân sách: 300k–550k/người  
- Muốn AI gợi ý nhanh để không cãi nhau chọn quán

---

### Scenarios (tối thiểu 3)

#### Scenario 1 – Nhu cầu thực tế nhất
**User nói:**  
“5 người, muốn ăn dê/trâu, tránh heo, vỉa hè thoáng, Q3, khoảng 500k một người, tối nay 6h.”

**AI cần hiểu được → slots structured:**  
- people: 5  
- prefer: dê, trâu  
- avoid: heo  
- vibe: vỉa hè, thoáng  
- area: Q3  
- budget: 400k–600k  
- time: 18:00 hôm nay  

**Output mong đợi:** 3–4 quán phù hợp nhất + giải thích.

---

#### Scenario 2 – Nhắc tới “bão review”
**User nói:**  
“Bạn bè nói quán X dạo này bị chửi nhiều, còn ăn được không?”

**Output mong đợi:**  
AI đọc dữ liệu review → tách drama → đưa FairScore → nói:  
“Tuần rồi quán dính drama phục vụ, nhưng món vẫn ổn. Nếu bạn ưu tiên dê ngon thì vẫn nên thử.”

---

#### Scenario 3 – Tìm quán trong bán kính
**User nói:**  
“Đang ở Phú Nhuận, kiếm quán nào chill chill gần đây có bia Hà Nội.”

**Output mong đợi:**  
- Tự detect vị trí → lấy bán kính 3–5km  
- Lọc vibe chill + bia hơi Hà Nội  
- Gợi ý 3 quán + map link  
