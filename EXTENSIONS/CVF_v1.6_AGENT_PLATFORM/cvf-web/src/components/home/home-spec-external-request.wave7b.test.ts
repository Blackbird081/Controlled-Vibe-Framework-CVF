// Text Encoding Exception: Vietnamese requests are paired with their unaccented forms.
import { describe, expect, it } from 'vitest';
import { homeSpecExternalRequest } from './home-spec-external-request';

const hazardExamples = [
    ['fire', [
        'The radiator is on fire.', 'A towel caught fire in the washroom.',
        'There is a fire under the counter.', 'Flames are rising behind the freezer.',
        'The rubbish bin catches fire every time it is used.', 'Fire broke out at the shop entrance.',
        'Flames are spreading through the awning.', 'The blanket caught fire this morning.',
        'There’s a fire in the stack of boxes.', 'The cooker hood is on fire, what now?',
    ], [
        'Giẻ lau trong bếp bốc cháy.', 'Tấm bạt bắt lửa bên cửa.',
        'Trong kho có lửa dưới kệ.', 'Lửa đang cháy sát cửa sau.',
        'Thùng giấy cháy lan sang phòng bên.', 'Bếp đang cháy, phải làm gì?',
        'Ở phòng giặt vừa xảy ra cháy.', 'Đống lá cháy bùng trước sân.',
        'Có lửa cháy trong buồng sấy.', 'Tấm rèm bên bếp bắt lửa rồi.',
    ]],
    ['smoke', [
        'My heater is smoking from the grille.', 'There’s smoke in the stairwell.',
        'The tumble dryer is giving off smoke.', 'Smoke is rising out of the ceiling.',
        'There is smoke coming from the cupboard.', 'The motor is putting off smoke.',
        'Smoke is filling the utility room.', 'My toaster started smoking just now.',
        'The freezer fan is sending off smoke.', 'Smoke is pouring out of the grill.',
    ], [
        'Khói xông lên từ gầm bàn.', 'Bộ sạc đang bốc khói.',
        'Quạt trần phun khói khi bật.', 'Có khói trong phòng giặt.',
        'Khói bay ra phía sau lò.', 'Hộp nguồn xì khói lúc vừa cắm.',
        'Khói thoát ra từ cửa kho.', 'Trong hành lang khói đầy rồi.',
        'Dây nối bốc khói cả đoạn.', 'Có khói từ dưới sàn.',
    ]],
    ['burning odor', [
        'I notice a burning odour in the hallway.', 'A burnt smell is coming from the kettle.',
        'The wiring smells like burning rubber.', 'It smells of scorched, burning cloth.',
        'There is a scorched odor near the fan.', 'This corner smells like melting insulation.',
        'The box smells like burnt paper.', 'The fan smells of something burning.',
        'I smell burnt plastic behind the counter.', 'The motor smells like it is scorching.',
    ], [
        'Bên cầu thang có mùi khét rõ.', 'Hộp nguồn có mùi nhựa cháy.',
        'Từ nhà kho bay ra mùi cháy.', 'Tấm đệm cháy khét bên máy.',
        'Cửa phòng mở ra có mùi dây điện cháy.', 'Cái nồi khét như cao su nóng.',
        'Trong tủ có mùi khói rõ rệt.', 'Sau bàn thoảng mùi khét.',
        'Có mùi nhựa cháy từ bộ sạc.', 'Miếng cách điện cháy khét rồi.',
    ]],
    ['electrical sparks', [
        'Sparks flew out of the plug socket when the fan started.', 'Sparks were flying around the fuse board.',
        'Sparks suddenly came from the extension lead.', 'Sparks keep jumping out near the breaker cabinet.',
        'The wall socket briefly sparked behind the desk.', 'The outlet is getting sparky again.',
        'I could see a spark flash across the switchboard.', 'The receptacle suddenly began to spark.',
        'The cable sparked twice and went dark.', 'It looked like an electrical arc in the back room.',
    ], [
        'Tia lửa bất ngờ lóe phía sau phích cắm.', 'Ổ cắm tự dưng tóe lửa lúc đóng cửa.',
        'Dây điện hôm nay cứ bắn lửa từng đợt.', 'Vừa bật đèn là ổ chia phát lửa.',
        'Cầu dao dưới nhà bị chập điện.', 'Tủ điện chợt đánh lửa hai lần.',
        'Cục chia điện bật lên là xẹt lửa.', 'Ổ điện vừa tóet lửa ra ngoài.',
        'Có đoạn mạch mới hỏng trong bảng điện.', 'Máng cáp lóe tia lửa ở phía cuối.',
    ]],
    ['gas', [
        'I smell propane outside the utility room.', 'There is a gas leak beside the oven.',
        'I think gas is escaping by the valve.', 'We can smell natural gas near the basement.',
        'Propane is hissing in the cupboard.', 'The line is leaking gas again.',
        'There is hissing near the gas tank.', 'I keep smelling gas by the back door.',
        'We found a suspected propane leak today.', 'The cylinder is leaking propane badly.',
    ], [
        'Có mùi khí gas ngay sau bếp.', 'Ống dẫn có vẻ rò ga.',
        'Bình gas đang xì ở chân van.', 'Chỗ nối bị rỉ khí gas rồi.',
        'Phòng kín nồng mùi ga.', 'Van ga bị rò ở dưới đáy.',
        'Tủ bếp có khí ga thoát ra.', 'Tôi thấy bình xì ga từng lúc.',
        'Hình như có khí gas rỉ sát chân tường.', 'Ở sân vừa phát hiện chỗ rò khí ga.',
    ]],
    ['electric shock', [
        'The mixer just gave me an electric shock.', 'I got shocked by the metal casing.',
        'There is electrical leakage in the heater.', 'I was shocked when I picked up the kettle.',
        'A coworker was electrocuted in the pump room.', 'The appliance has a live casing.',
        'I worry I am getting shocked while holding the iron.', 'The machine gives an electrical shock on touch.',
        'There is electrical current leaking into the casing.', 'The grill gave my hand an electric shock.',
    ], [
        'Tôi bị giật điện lúc cầm ấm.', 'Điện giật ở vỏ tủ làm tôi giật mình.',
        'Máy giặt có vẻ rò điện.', 'Vỏ máy nhiễm điện, tôi bị tê tay.',
        'Bàn ủi điện rò ra vỏ.', 'Chạm vào tay nắm cửa rồi bị giật.',
        'Vỏ tủ nhiễm điện ở cạnh dưới.', 'Thợ vừa bị máy sấy giật điện.',
        'Tôi nghi rò điện trong máy bơm.', 'Chạm vào cái ấm kim loại thì bị giật.',
    ]],
    ['water by electrical equipment', [
        'Rain leaked through the UK plug socket this morning.', 'The tap leaks directly above the receptacle.',
        'Water is coming through the consumer unit.', 'The pipe was leaking onto the fuse cupboard.',
        'Water poured over the main service panel.', 'The power strip is wet on its underside.',
        'Floodwater is rising around the circuit breaker cabinet.', 'The extension lead lies in a puddle.',
        'The electrical closet is flooded at the back.', 'The water has been dripping near the electric cord.',
    ], [
        'Nước từ mái chảy lên ổ cắm.', 'Ống rò nước ngay trên phích cắm.',
        'Cầu dao tổng bị ướt sũng.', 'Nước mưa tràn vào buồng điện hôm qua.',
        'Gầm tủ bảng điện tổng đang ngập.', 'Ổ chia lấm tấm nước đang nhỏ giọt.',
        'Đoạn dây điện ướt cạnh chân tường.', 'Bên trên tủ cầu dao có chỗ rỉ nước.',
        'Nước rò xuống dãy đồ điện cuối nhà.', 'Nước nhỏ từng giọt trên máng dây điện.',
    ]],
    ['electrical noise or heat', [
        'The socket starts crackling whenever the fan turns on.', 'There is a buzz inside the consumer unit.',
        'I hear sizzling from the service panel.', 'The circuit breaker is humming very loudly.',
        'There was a popping sound by the electrical closet.', 'The receptacle is hot to the touch.',
        'The power bar made a crackle last night.', 'Sizzling started in the fuse box just now.',
        'The extension cord is scorching hot.', 'The plug is hissing near my desk.',
    ], [
        'Ổ cắm kêu lách tách mấy lần.', 'Sau tủ cầu dao nghe tiếng xèo xèo.',
        'Mặt ổ chia nóng ran khi dùng.', 'Trong tủ điện có tiếng rè liên tục.',
        'Có tiếng ù từ cầu dao tổng.', 'Phích cắm kêu xì xì bên bàn.',
        'Dây điện nóng bỏng tay.', 'Ổ điện phát tiếng lép bép mỗi lần bật.',
        'Bảng điện tổng kêu o o trong góc.', 'Cạnh máng cáp điện có tiếng nổ lách tách.',
    ]],
] as const;

const actionExamples = [
    [
        'Please book me a taxi to the station.', 'The sink broke, can you call a repair service?',
        'My flight landed, please call a cab.', 'Book a courier to pick up the box for me.',
        'The meeting moved, can you reserve a table for us?', 'Please order me a bottle of water.',
        'It is hot, please order a fan from the department store.', 'The lift is down, call a technician.',
        'Please schedule a delivery for the afternoon.', 'Tomorrow is overbooked, cancel the tickets.',
    ], [
        'Gọi giúp tôi một chiếc taxi.', 'Đặt hộ mình xe ra ga nhé.',
        'Kêu giúp em một người qua lấy hàng.', 'Book giúp anh một xe đi bến.',
        'Chị đang bận, gọi hộ chị bên giao hàng.', 'Đặt giúp tụi mình đồ ăn trưa.',
        'Kêu hộ tôi thợ đến xem cửa.', 'Gọi giúp mình nhà cung cấp nhé.',
        'Đặt giùm em hai chai nước giao tới phòng.', 'Kêu giúp tụi mình cửa hàng đầu phố.',
    ],
] as const;

const ordinaryExamples = [
    ['utilities costs and bills', [
        'Chi phí điện nước tháng này tăng bao nhiêu?', 'So sánh hóa đơn tiền gas, điện và nước quý này.',
        'Mức tiêu thụ điện và nước trong kho tháng này.', 'Tiền điện, tiền nước và gas theo từng tháng.',
        'Ước tính chi phí điện của máy bơm nước.', 'How much did we spend on electricity, water and gas?',
    ]],
    ['outage notices', [
        'Viết thông báo cho cư dân mai cúp nước và cúp điện.', 'Ra thông báo cúp nước khu A vì bảo trì.',
        'Thông báo cúp điện cho cư dân trên tầng 3.', 'Soạn thông báo mất nước và mất điện cuối tuần.',
        'Draft a notice about the scheduled water and power outages.', 'Write to residents about their power being off tomorrow.',
    ]],
    ['safety documents', [
        'Tạo quy trình xử lý khi tủ điện rò nước.', 'Viết tài liệu tập huấn khi ổ cắm lóe tia lửa.',
        'Lập báo cáo sự cố cầu dao kêu xèo xèo hôm qua.', 'Prepare a checklist for a sparking fuse box.',
        'Create a guide to responding when water pours into a breaker.', 'Write a policy for gas leaks and electric shock.',
    ]],
    ['messages to people', [
        'Nhắn giúp em cho chị Lan mời ghé qua chiều nay.', 'Viết tin cho anh Nam hỏi anh ấy có đến không.',
        'Trả lời giúp mình cho chị Hạnh là mai rảnh.', 'Text a short reply about the appointment.',
        'Write a message asking them if they can book a table.', 'Nhắn hộ tôi cho bên giao hàng hỏi họ mấy giờ tới.',
        'Nhắn giúp em cho chị Lan là chị gọi giúp một chiếc taxi nhé.',
        'Nhan cho anh Huy la nho anh goi ho toi ben giao hang.',
        'Text Maya to book a cab if she cannot make the train.',
    ]],
    ['ordinary shopping and planning', [
        'Lên kế hoạch đặt bàn cho cả nhóm vào tuần tới.', 'So sánh giá mấy ổ cắm cho phòng giặt.',
        'Đặt giúp tôi ba câu hỏi phỏng vấn nhân viên.', 'What size circuit breaker is listed on the shopping receipt?',
        'List the options for office furniture and power strips.', 'Prepare a plan to order supplies from our vendor.',
        'The power cord runs through the wall to the office.',
        'A cable came through the cabinet opening when it was installed.',
    ]],
] as const;

const withoutAccents = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').replaceAll('đ', 'd').replaceAll('Đ', 'D');

describe('Home safety and external action categories', () => {
    for (const [category, english, vietnamese] of hazardExamples) {
        it.each([...english, ...vietnamese, ...vietnamese.map(withoutAccents)])(`${category}: %s`, (text) => {
            expect(homeSpecExternalRequest(text, '')).toBe('hazard');
        });
    }

    const [english, vietnamese] = actionExamples;
    it.each([...english, ...vietnamese, ...vietnamese.map(withoutAccents)])('external action: %s', (text) => {
        expect(homeSpecExternalRequest(text, '')).toBe('action');
    });

    for (const [category, requests] of ordinaryExamples) {
        it.each(requests)(`${category}: %s`, (text) => {
            expect(homeSpecExternalRequest(text, '')).toBeNull();
        });
    }

    it.each([
        ['H8.4', 'nhắn giúp em cho chị Lan là lịch 9h sáng mai dời qua 2h chiều được không'],
        ['H10.2', 'viết thông báo cho cư dân mai cúp nước từ 8h tới 12h, nhờ trữ nước trước'],
        ['H11.4', 'nhắn phụ huynh bé Na là thứ 7 này lớp nghỉ vì giáo viên bệnh, học bù chủ nhật tuần sau được không'],
        ['H12.4', 'write a short reply to Priya. she asked to swap her tuesday shift to thursday. thursday is full, but friday is open 10:00 to 14:00. keep it friendly and short'],
        ['H9.4', 'reply to a bride who asked if I can add a second shooter for $400 more, say yes but only if she confirms by Friday'],
    ])('keeps previously accepted assistant request %s', (_id, text) => {
        expect(homeSpecExternalRequest(text, '')).toBeNull();
    });

    it.each([
        ['H10.5', 'gọi thợ sửa ống nước lên ngay căn 302 giùm mình'],
        ['V1.4', 'Máy lạnh ở tiệm bị chảy nước, tôi phải làm sao?'],
    ])('keeps the fixed safety route for %s', (_id, text) => {
        expect(homeSpecExternalRequest(text, '')).toBe('hazard');
    });

    it('checks separate notes about equipment as well as the request', () => {
        expect(homeSpecExternalRequest('Call a technician for me.', 'The consumer unit has been crackling.')).toBe('hazard');
    });
});
