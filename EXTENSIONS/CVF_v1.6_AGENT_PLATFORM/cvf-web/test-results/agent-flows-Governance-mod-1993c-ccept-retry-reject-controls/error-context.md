# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - button "🌐 EN" [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]: 🔐
      - heading "Đăng Nhập CVF v1.6" [level=1] [ref=e8]
      - paragraph [ref=e9]: Đăng nhập để truy cập toàn bộ giao diện.
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Tên đăng nhập
        - textbox "admin" [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]: Mật khẩu
        - textbox "admin123" [active] [ref=e16]
      - generic [ref=e17]:
        - generic [ref=e18] [cursor=pointer]:
          - checkbox "Nhớ tài khoản" [ref=e19]
          - text: Nhớ tài khoản
        - generic [ref=e20] [cursor=pointer]:
          - checkbox "Hiện mật khẩu" [ref=e21]
          - text: Hiện mật khẩu
      - button "Đăng nhập" [ref=e22]
    - generic [ref=e23]:
      - text: "Tài khoản mặc định:"
      - strong [ref=e24]: admin
      - text: /
      - strong [ref=e25]: admin123
  - button "Open Next.js Dev Tools" [ref=e31] [cursor=pointer]:
    - img [ref=e32]
  - alert [ref=e35]
```