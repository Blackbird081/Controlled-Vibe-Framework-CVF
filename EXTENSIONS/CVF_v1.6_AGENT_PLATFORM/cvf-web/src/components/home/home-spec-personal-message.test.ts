// Text Encoding Exception: Vietnamese examples are preserved as typed.
import { describe, expect, it } from 'vitest';
import { isMessagingProject, isPersonalMessageRequest } from './home-spec-personal-message';

const personal = {
    'Vietnamese': [
        'Nhắn giúp em cho chị Lan là lịch 9h sáng mai dời được không',
        'Hỏi anh Dũng xem chiều nay có qua cửa hàng không',
        'Báo chị Mai là buổi tập ngày mai đổi phòng',
        'Trả lời cô Hạnh là con đã nhận được giấy hẹn',
        'Soạn một tin nhắn cho anh Trí về giờ nhận hàng',
        'Viết lời nhắn cho mẹ là tối nay con về trễ',
        'Nhắn tin cho bạn ấy để xác nhận chỗ gặp',
        'Làm ơn hỏi người đó xem có mang chìa khóa không',
        'Nhắn Khánh là cuộc họp lùi một tiếng',
        'Gửi email cho bác Phúc về buổi hẹn hôm thứ tư',
    ],
    'Vietnamese without accents': [
        'nhan giup minh cho anh bao la gan den gio dong cua',
        'hoi chi thao xem chieu co ranh khong',
        'bao ban ay la hom nay khong can mang may tinh',
        'tra loi voi ong hai rang em da nhan duoc',
        'soan tin nhan cho co cuc ve lich hen moi',
        'viet email cho thay Minh ve bai nop muon',
        'hay gui tin nhan cho chu Tien de hoi gio mo cua',
        'nhan Phuong la sap den gio dua tre di hoc',
        'nho hoi nguoi do xem co de quen ao mua khong',
        'bao ngai sep la xe dang tren duong',
    ],
    'English': [
        'Ask Mrs Patel if she can pick up Sam at 4',
        'Tell Maya that the shop is closing early',
        'Text her that I found the key',
        'Reply to Jess that I can join the call',
        'Please message ben about tomorrow’s appointment',
        'Draft a friendly email to my teacher about the plan',
        'Write a birthday message for my sister',
        'Could you please text Jordan that the files are ready',
        'I need to tell him the deadline moved to Friday',
        'Compose a brief note for our landlord about the rent',
    ],
};

const ordinary = {
    'process or template': [
        'Viết quy trình nhắn tin chăm sóc khách',
        'Soạn mẫu tin nhắn để nhân viên xác nhận đơn',
        'lap ke hoach nhan tin nhac viec cho thu ngan',
        'viet tai lieu huong dan nhan tin khi ban giao',
        'Viết hướng dẫn gửi thông báo cho lễ tân',
        'Write a template for text messages to customers',
        'Create a checklist for handling customer messages',
        'Draft an employee messaging policy',
        'Prepare a guide for writing reminders',
        'Build a training document for customer messaging',
    ],
    'functional software': [
        'app that sends reminders to parents',
        'Build an app for text messages to clients',
        'I need a system that sends appointment notifications',
        'Design software that queues SMS messages',
        'Create a tool for sending texts to parents',
        'Làm ứng dụng tự động gửi tin nhắn khi đơn tới',
        'Cần phần mềm nhắc hẹn qua tin nhắn',
        'xay dung he thong gui thong bao don hang',
        'can cong cu nhan tin nhac lich cham cong',
        'Thiết kế ứng dụng đặt lịch có gửi tin nhắn',
    ],
    'bulk plan or campaign': [
        'Lập kế hoạch nhắn tin hàng loạt cho khách',
        'Viết kế hoạch chiến dịch tin nhắn tháng tới',
        'tao chien dich gui tin nhan khai truong',
        'Chạy chiến dịch SMS cho hội viên mới',
        'Soạn nội dung tin nhắn hàng loạt cho toàn bộ khách',
        'Plan a bulk SMS campaign for December',
        'Create a messaging campaign for new subscribers',
        'Design a bulk text message campaign',
        'Draft a campaign message for all subscribers',
        'Send a bulk message to all the customers',
    ],
    'analysis': [
        'Phân tích tin nhắn chăm sóc khách tháng trước',
        'phan tich tin nhan tu hom qua va tim loi',
        'Soạn báo cáo phân tích tin nhắn nhắc hẹn',
        'Phân tích tỷ lệ phản hồi tin nhắn trong quý',
        'Viết báo cáo về tin nhắn đã gửi cho khách',
        'Analyze replies to our text messages',
        'Analyse messages for recurring issues',
        'Produce a report on customer messaging',
        'Compare texts using a messaging analytics dashboard',
        'Use analytics to count response times for SMS',
    ],
};

for (const [label, requests] of Object.entries(personal)) {
    describe(label, () => {
        it.each(requests)('recognizes one recipient in %s', request => {
            expect(isPersonalMessageRequest(request)).toBe(true);
        });
    });
}

for (const [label, requests] of Object.entries(ordinary)) {
    describe(label, () => {
        it.each(requests)('leaves %s in the specification flow', request => {
            expect(isPersonalMessageRequest(request)).toBe(false);
            expect(isMessagingProject(request)).toBe(true);
        });
    });
}

it.each([
    'Tell everyone that the office will close early',
    'Text all the parents that the gate is shut',
    'Nhắn tin cho cả nhóm biết ca làm thay đổi',
    'Hỏi có thể mở cửa muộn thêm không',
])('requires a person as the recipient in %s', request => {
    expect(isPersonalMessageRequest(request)).toBe(false);
});
