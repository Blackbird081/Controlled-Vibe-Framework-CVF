import { describe, it, expect } from 'vitest';
import { hasOutsideEffectCue } from './home-spec-outside-effect-cues';

// Text Encoding Exception: Vietnamese inputs below intentionally cover accented, NFD-decomposed and accent-stripped spellings.
const nfd = (text: string) => text.normalize('NFD');
const stripped = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').replaceAll('đ', 'd').replaceAll('Đ', 'D');

const MUST_BLOCK: readonly string[] = [
    'Làm công cụ lấy giá vàng từ trang SJC mỗi ngày',
    'Làm công cụ cào dữ liệu sản phẩm từ Shopee',
    'cao du lieu gia tu Shopee ve bang tinh',
    'Tạo công cụ chuyển khoản lương tự động cho nhân viên',
    'tu dong chuyen khoan tra luong nhan vien',
    'Làm công cụ tự động trả lương qua Momo',
    'Kết nối với Google Sheets của tôi để cập nhật tồn kho',
    'ket noi voi trang web cua cong ty de lay don hang',
    'Sửa file Excel bán hàng của tôi, thêm cột lãi',
    'Ghi đè lên file báo cáo cũ của tôi',
    'Dọn thư mục Downloads, bỏ các file trùng',
    'Don o D, bo het file trung nhau',
    'Xuất bản trang web giới thiệu quán',
    'Đưa trang lên web cho mọi người vào xem',
    'Dua trang len Vercel',
    'Đẩy code lên GitHub của tôi',
    'Trang lưu số CMND và địa chỉ nhà của học sinh',
    'Trang lưu căn cước công dân của nhân viên',
    'Trang quản lý hồ sơ bệnh nhân của phòng khám',
    'Lưu số tài khoản và mã PIN của tôi',
    'Lưu thông tin thẻ tín dụng của tôi',
    'Tự động thông báo cho phụ huynh khi con vắng',
    'Tự động trả lời bình luận của khách trên Shopee',
    'Tu dong nhan cho phu huynh qua Messenger',
    'Tự động gọi điện nhắc lịch cho bệnh nhân',
    'Tải dữ liệu thời tiết về mỗi sáng',
    'Lưu pass wifi và mã két sắt',
    'Luu ma khoa cua nha',
    'Làm trang web tự đặt vé máy bay cho tôi',
    'Công cụ tự mua hàng trên Lazada khi giảm giá',
    'Cài phần mềm này lên tất cả máy trong văn phòng',
    'Đổi tên toàn bộ ảnh trong thư mục Pictures của tôi',
    'Danh sách khách với địa chỉ và ngày sinh thật',
    'Tự động đăng nhập vào trang thuế',
    'Tu dong dang video len Tiktok',
    'Viết lại trang chủ của công ty tôi',
    'Thay đổi giá trên trang bán hàng của tôi',
    'Làm bot Discord trả lời thành viên',
    'Lấy dữ liệu từ máy chấm công của công ty',
    'Chạy quảng cáo Google cho tiệm',
    'Nạp tiền điện thoại tự động',
    'bo sung tinh nang vao phan mem ke toan cong ty dang xai',
    'Scrape prices from Amazon every morning',
    'Build a tool that wires money to my suppliers',
    'Transfer money between my accounts automatically',
    'Overwrite my old report files with the new ones',
    'Rename all the photos in my Pictures folder',
    'Clean up my Downloads folder and get rid of duplicates',
    'Push the page to GitHub',
    'Connect to my Google Drive and tidy it',
    'Store social security numbers and medical records of my patients',
    'Save my credit card number',
    'Notify parents when a child is absent',
    'Tweet my daily sales',
    'DM my followers on Instagram',
    'Deleting old files in my folder',
    'A script for sharing my folder with the team',
    'Tool for messaging all parents',
    'Download the weather feed each morning',
    'Buy the item on Amazon when the price drops',
    'Build a script that books flights for me',
    'Install this on all office computers',
    'Edit my resume file',
    'Change the prices on my shop website',
    'Fetch my orders from Shopify',
    'Put it on the web so everyone can see',
    'Make it public on Vercel',
    'Store my passport number and PIN',
    'Call the patients to remind them',
    'Run ads on Google for my shop',
    'gửi email mời cho tất cả phụ huynh',
    'tự nhắn Zalo nhắc người mượn quá hạn',
    'tu nhan zalo nhac',
    'Send an SMS to customers',
    'store my API key',
    'Xóa hết dữ liệu',
    'Xoá hết dữ liệu',
    'Deleted files and deleting records',
    'Removing and erasing entries',
    'Sharing with the team',
    'Kết nối ví momo',
    'Gửi thư cho khách',
    'Lưu số điện thoại khách và số điện thoại phụ huynh',
    'Lưu SĐT khách',
    'Trang lưu tên và số điện thoại 40 phụ huynh',
    'Làm công cụ nhắn tin cho người mượn',
    'Tự động đăng nhập vào ngân hàng',
    'Làm bot nhắn cho học sinh',
    'Đặt phòng khách sạn tự động',
    'Lưu khóa API của tôi',
    'Lưu mã khoá cửa',
];

const MUST_PASS: readonly string[] = [
    'Làm trang thời khóa biểu cho con tôi',
    'Trang giới thiệu khóa học vẽ của tôi',
    'Trang quản lý thư viện sách gia đình',
    'Trang ôn các dạng bài toán lớp 3',
    'Tôi đang dùng sổ tay để ghi chi tiêu, muốn có một trang nhỏ thay thế',
    'Tôi đang nhập tay vào sổ, muốn một trang nhỏ để ghi',
    'Làm một trang trông đáng tin cậy để ghi thu chi',
    'Trang đăng ký món ăn cho bữa tiệc gia đình',
    'Trang ghi bài tập thư giãn mỗi ngày',
    'Make a page with large text for grandma to read recipes',
    'A page about the town where I live',
    'A running log for my jogging',
    'A list of key dates for my family',
    'A page for a blog post draft',
    'A piggy bank tracker for my kids',
    'A chore chart so the family can share chores',
    'A page to host game night scores',
    'Một trang mở trên điện thoại để ghi việc cần chuẩn bị',
    'Trang giới thiệu tiệm bánh có địa chỉ và số điện thoại của tiệm',
    'Lam trang thoi khoa bieu cho con toi',
    'Trang quan ly thu vien sach gia dinh',
    'Trang dang ky mon an cho bua tiec gia dinh',
    'Bang thu chi gia dinh',
    'Trang on cac dang bai toan lop 3',
    'Toi dang dung so tay de ghi chi tieu, muon co mot trang nho thay the',
    'Trang ghi bai tap thu gian moi ngay',
    'Lam mot trang trong dang tin cay de ghi thu chi',
];

const NFD_MUST_BLOCK: readonly string[] = [
    'Xóa hết dữ liệu',
    'Xoá hết dữ liệu',
    'Tự động đăng nhập vào trang thuế',
    'Lưu số CMND và địa chỉ nhà của học sinh',
    'Tự động thông báo cho phụ huynh khi con vắng',
];

const NFD_MUST_PASS: readonly string[] = [
    'Làm trang thời khóa biểu cho con tôi',
    'Trang quản lý thư viện sách gia đình',
    'Trang đăng ký món ăn cho bữa tiệc gia đình',
    'Tôi đang dùng sổ tay để ghi chi tiêu, muốn có một trang nhỏ thay thế',
];

const STRIPPED_MUST_BLOCK: readonly string[] = [
    'Tạo công cụ chuyển khoản lương tự động cho nhân viên',
    'Kết nối với Google Sheets của tôi để cập nhật tồn kho',
    'Tự động gọi điện nhắc lịch cho bệnh nhân',
    'Lưu số CMND và địa chỉ nhà của học sinh',
    'Tự động thông báo cho phụ huynh khi con vắng',
    'Xóa hết dữ liệu cũ',
    'Lưu mã khóa cửa nhà',
];

describe('hasOutsideEffectCue', () => {
    it.each(MUST_BLOCK)('blocks hazardous request: %s', text => {
        expect(hasOutsideEffectCue(text)).toBe(true);
    });

    it.each(MUST_PASS)('keeps an ordinary local job: %s', text => {
        expect(hasOutsideEffectCue(text)).toBe(false);
    });

    it.each(NFD_MUST_BLOCK)('blocks the decomposed (NFD) form: %s', text => {
        expect(hasOutsideEffectCue(nfd(text))).toBe(true);
    });

    it.each(NFD_MUST_PASS)('keeps the decomposed (NFD) form: %s', text => {
        expect(hasOutsideEffectCue(nfd(text))).toBe(false);
    });

    it.each(STRIPPED_MUST_BLOCK)('blocks the accent-stripped form: %s', text => {
        expect(hasOutsideEffectCue(stripped(text))).toBe(true);
    });

    it('checks every text argument', () => {
        expect(hasOutsideEffectCue('Trang ghi chi tiêu', 'gửi email cho khách')).toBe(true);
        expect(hasOutsideEffectCue('Trang ghi chi tiêu', 'bảng tính nhỏ')).toBe(false);
    });
});
