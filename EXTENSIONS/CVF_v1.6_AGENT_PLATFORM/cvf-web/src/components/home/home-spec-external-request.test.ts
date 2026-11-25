// Text Encoding Exception: regression fixtures preserve the VI requests verbatim.
import { describe, expect, it } from 'vitest';
import { homeSpecExternalRequest } from './home-spec-external-request';

describe('homeSpecExternalRequest', () => {
    it.each([
        ['H12.5', 'the walk-in fridge is making a burning smell and sparking near the plug, call an electrician for me', 'hazard'],
        ['H13.4', 'dat giup toi 20 cuon chi trang tren Lazada giao toi xuong', 'action'],
        ['H13.5', 'trong xuong co mui khet va khoi o tu dien, toi phai lam gi', 'hazard'],
    ] as const)('routes the original blind case %s', (_case, text, expected) => {
        expect(homeSpecExternalRequest(text, '')).toBe(expected);
    });

    it.each([
        'Flames are coming out of the heater.',
        'The power strip caught fire while I was working.',
        'My oven is smoking at the back.',
        'The fuse box is giving off smoke.',
        'There is a smell of burnt plastic in the hall.',
        'The socket smells like something is burning.',
        'There are sparks at the breaker.',
        'I think the wiring shorted out.',
        'I hear gas hissing by the regulator.',
        'There is a suspected propane leak next to the grill.',
        'The washing machine gave me an electric shock.',
        'I got shocked while touching the kettle.',
        'Water is dripping onto the electrical panel.',
        'A puddle is spreading around a power strip.',
    ])('recognizes an immediate hazard in English: %s', (text) => {
        expect(homeSpecExternalRequest(text, '')).toBe('hazard');
    });

    it.each([
        'Lửa đang cháy trong tủ ở bếp.',
        'Trong kho co lua boc len tu lo suoi.',
        'Lò nướng xì khói ở đằng sau.',
        'Khoi bay ra tu o cam, toi lo qua.',
        'MUI NHUA CHAY o cuoi hanh lang.',
        'Ổ điện có mùi cháy khét.',
        'Tia lửa bắn ra từ cầu dao.',
        'Cai quat hinh nhu bi chap dien.',
        'Tôi ngửi thấy mùi khí gas ở gần bếp.',
        'Nghi bi ro ga cho van binh.',
        'Tôi vừa bị giật điện lúc sờ vào máy giặt.',
        'May giat bi ro dien ra vo.',
        'Nước nhỏ xuống tủ điện.',
        'Nuoc tran sat o cam dien.',
    ])('recognizes a hazard with or without Vietnamese accents: %s', (text) => {
        expect(homeSpecExternalRequest(text, '')).toBe('hazard');
    });

    it.each([
        'My trip moved, please reserve a room for Friday.',
        'The shop says it can deliver and can you order me some paper?',
        'Tối mai cả nhà đi ăn, đặt giúp tôi một bàn.',
        'CHIEU MAI TOI DEN DA NANG, DAT GIUP TOI MOT PHONG.',
    ])('finds a request to act after the background: %s', (text) => {
        expect(homeSpecExternalRequest(text, '')).toBe('action');
    });

    it.each([
        'Write an evacuation plan for a fire or gas leak.',
        'Create an electrical safety procedure for a short circuit.',
        'I need an incident report about yesterday’s outlet sparks.',
        'Draft a checklist I can use to book a flight.',
        'Write a reminder for the overdue tuition fee.',
        'Prepare the monthly electricity and water consumption report.',
        'Tạo quy trình sơ tán khi có cháy và khói.',
        'soan quy trinh an toan dien khi co chap dien',
        'Tôi cần báo cáo sự cố rò gas xảy ra hôm qua.',
        'Tạo mẫu đặt chỗ cho phòng khám.',
        'nhac giup toi dong hoc phi vao thu sau',
        'Lập báo cáo tiêu thụ điện nước hàng tháng.',
        'Máy đang chạy ở chế độ tiết kiệm.',
        'Nhắc tiền nước điện mỗi tháng.',
    ])('keeps documents and ordinary requests available: %s', (text) => {
        expect(homeSpecExternalRequest(text, '')).toBeNull();
    });

    it('checks immediate danger in the details rather than downgrading it to a booking', () => {
        expect(homeSpecExternalRequest('Can you call an electrician?', 'I just touched the oven and got an electric shock.')).toBe('hazard');
    });
});
