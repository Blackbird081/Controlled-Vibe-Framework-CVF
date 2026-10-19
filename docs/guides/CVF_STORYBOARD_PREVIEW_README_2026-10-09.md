# CVF Storyboard Preview - Huong dan su dung

Memory class: POINTER_RECORD

Status: PRIVATE_UI_ONLY

docType: reference

Date: 2026-10-09

Batch ID: CVF-NCR-OFFLINE-PREVIEW-20261009

EPISTEMIC_PROCESS_NA_WITH_REASON: usage guide for a private offline UI; the claim-to-source joins live in the worker evidence JSON, not here.

## Purpose

Muc dich cua huong dan nay: cach dung lai, mo, kiem thu va hieu gioi han cua ban xem thu.

Ban xem thu offline cua kich ban video 10 canh (S01-S10, 240 giay uoc tinh) ve CVF cho nguoi moi giao AI viec code. Day la UI rieng tu: mot file HTML tu chua, mo bang trinh duyet, khong can may chu, mang, tai khoan hay cai dat. Trang duoc dung tu thiet ke da duoc chap nhan; no khong phai video, khong co giong doc va khong sinh ra media.

## Scope

Chi ap dung cho file `docs/reviews/evidence/cvf-storyboard-preview-2026-10-09.html` va ba file lenh trong `scripts/` ben duoi. Nguoi so huu quyet dinh ky thuat cuoi cung la Local reviewer; huong dan nay khong thay doi nguon thiet ke.

## Lenh

Chay tu thu muc goc cua repository (can Python 3 chuan; Node + Playwright + Chromium co san cho phan test trinh duyet):

| Muc dich | Lenh |
|---|---|
| Dung lai HTML tu nguon da ghim | `python -B scripts/cvf_storyboard_preview.py` |
| Mo xem | mo `docs/reviews/evidence/cvf-storyboard-preview-2026-10-09.html` bang trinh duyet (nhap doi chuot, khong can may chu) |
| Test tinh (builder, kiem tra nguon, chen van ban doc hai) | `python -B -m unittest discover -s scripts -p test_cvf_storyboard_preview.py` |
| Test trinh duyet (10 canh, 2 khung hinh) | `node scripts/test_cvf_storyboard_preview_browser.cjs` |

Builder nhan tham so ro rang: `--root`, `--manifest`, `--source`, `--claims`, `--prototype`, `--output`. Mac dinh dung manifest `docs/reviews/evidence/cvf-offline-preview-dispatch-inputs-2026-10-09.json`. Test trinh duyet dung Playwright co san trong `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/node_modules` va Chromium da cai; khong tai hay cai gi them. Ket qua test khong duoc nhung vao trang HTML: hay chay lenh de kiem lai, khong tin nhan trang thai cu.

## Nguon va hash

- Thiet ke goc: `docs/reference/CVF_NCR_GENERAL_VIDEO_DESIGN_2026-10-02.md`, SHA-256 byte goc `3ce5e2363c3e29997fcbf42cb4cec59af7447cca38409d4d970e8aa71e5777e0` (ghim trong manifest).
- Ban do claim C01-C19 va tap canh minh hoa: `docs/reviews/evidence/cvf-ncr-general-video-design-2026-10-02.json`.
- The tom tat trinh chieu (tieu de, the): lay tu prototype dong bang `docs/reviews/evidence/cvf-offline-preview-prototype-2026-10-09.html`, va duoc doi chieu voi thiet ke tung canh.
- Moi lan dung, builder tinh lai SHA-256 cua tung dau vao va hien thi hash dan xuat trong muc "Nguon, kiem chung va gioi han" cua trang.
- Neu mot dau vao doi byte (ke ca doi ky tu xuong dong khi checkout), builder dung voi loi `BUILD_FAILED` va khong ghi de file dau ra. Day la hanh vi co chu y: cap nhat manifest co kiem soat roi moi dung lai.
- Builder tu choi: thieu/trung/sai thu tu canh, thieu hoac them truong, lich thoi gian co khoang trong hoac chong lan hoac khong ket thuc o 240 giay, ma claim chua khai bao, prototype lech thiet ke. Van ban nguon luon duoc ma hoa HTML nen khong the tao DOM chay duoc.

## Dieu khien

| Thao tac | Cach dung |
|---|---|
| Chon canh | 10 nut S01-S10 |
| Truoc / Tiep | nut hoac phim mui ten trai / phai |
| Phat / tam dung | nut Phat preview, hoac phim Space; het 240 giay thi nut thanh Phat lai |
| Tua | thanh timeline (0-240 giay), hoac nut Ve dau |
| Tu dong tam dung | khi tab bi an |

Moi canh hien tom tat trinh chieu (co nhan ro la tom tat), loi dan goc va chu tren man hinh goc nguyen van; muc "Y do hinh anh va tai nguyen" chua truong visual intent va asset needs cua thiet ke. Bon canh S05-S08 luon mang the day du "VÍ DỤ MINH HỌA - CHƯA CHẠY THẬT - DỮ LIỆU GIẢ" ngay ca khi mo rieng le.

## Bo cuc thich ung

Desktop: khung 16:9 o tren, dieu khien o giua, loi dan va chu goc o duoi. Mobile (man hinh hep): cac the xep doc mot cot, nut co vung cham toi thieu 44px, khong cuon ngang. Test trinh duyet kiem tra hai viewport 1440x1050 va 390x844.

## Thoi gian

Cac moc 0-240 giay la uoc tinh ke hoach cua thiet ke, khong do giong doc hay video. Dong ho trong trang chi mo phong timeline bang dong ho trinh duyet. Test dung dong ho ao cua Playwright chi de kiem tra logic timer cua UI; do khong phai thoi luong da do.

## Claim Boundary

- Rieng tu, chi UI offline (`DEFERRED_PRIVATE_ONLY`). Khong dang tai, khong deploy, khong dong bo cong khai.
- Khong am thanh, TTS, giong that, MP4, FFmpeg, HyperFrames, provider hay mang. Khong tai font hay tai nguyen tu xa; chi dung font he thong.
- Vi du loc chi tieu chua chay that; trang khong dua ket qua test nao cua vi du do.
- Khong giai quyet nguon R2, luu giu nguon hay cac lane parked khac. Xem xet va dong bo tiep theo thuoc Local reviewer.

Text Encoding Exception: this Vietnamese-language guide is written without diacritics for portability; the preview page itself and the quoted source text keep Vietnamese diacritics.
