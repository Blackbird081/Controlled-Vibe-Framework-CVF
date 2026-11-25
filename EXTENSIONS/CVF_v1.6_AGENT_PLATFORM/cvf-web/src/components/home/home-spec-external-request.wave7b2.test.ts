// Text Encoding Exception: Vietnamese fixtures exercise both accented and unaccented requests.
import { describe, expect, it } from 'vitest';
import { homeSpecExternalRequest } from './home-spec-external-request';

const electricalEquipment = [
    'There are sparks near the electrics above the landing.',
    'A spark jumped from the meter closet before the lights failed.',
    'Sparks came from inside the fuse room under the stairs.',
    'The power box sparked behind the entrance.',
    'The electrics cabinet sparked at the back.',
    'The electric cupboard sparked when we opened the door.',
    'The light fitting sparked when the room went dark.',
    'The fused spur suddenly sparked and went black.',
    'The ceiling light sparked twice over the bench.',
    'The socket outlet briefly sparked beside the sink.',
    'The light switch sparked when I came back into the hall.',
    'The light fixture sparked directly over the steps.',
];

const electricalSounds = [
    'The socket by the landing is fizzing intermittently.',
    'I heard fizzing across the passage from the electric cupboard.',
    'The fuse closet fizzes loudly when the boiler starts.',
    'A crackle came from the electrics room behind the garage.',
    'The light fixture crackled just as the fan stopped.',
    'Every time I close the front door, the light switch by the entry and behind the tall coat rack beside the floor mat makes a buzzing noise.',
    'From the fused spur in the kitchen I heard a loud hum.',
    'The socket outlet hummed even while we were in the living room.',
    'The meter cabinet popped once in the middle of the night.',
    'There was popping at the ceiling light after we turned it on.',
    'The power closet beside our reception desk sizzles whenever the door closer pulls the side door shut.',
    'I can hear sizzling from the fuse cabinet after the mains came back.',
];

const waterNearElectrics = [
    'Water seeped through the plaster ceiling beside the fused spur.',
    'Rain is coming into the electrics from the gap above the door.',
    'The electric closet got soaked along one wall.',
    'The light switch next to the sink got wet when the pipe broke.',
    'Water has been pouring onto the ceiling light over the counter.',
    'The fuse room is wet all along the far wall.',
    'Water came from the ceiling near the plug socket beside the desk.',
    'Water is running into the power cupboard from the floor above.',
    'Rain was seeping from the outside wall onto the light fitting.',
    'Water ran from the ceiling towards the main circuit breaker.',
    'A pipe leaked through the floor into the electrics cabinet below.',
    'There is water dripping from the wall next to the socket outlet.',
];

const delegatedParties = [
    'Gọi giúp tôi bên vận chuyển đến nhận kiện này.',
    'Kêu giúp anh phía điện lực qua xem công tơ.',
    'Đặt hộ chị bên tổ chức sự kiện cho sáng mai.',
    'Nhờ em gọi bên sửa cửa kính tới địa chỉ mới.',
    'Nhờ gọi phía cấp nước tới kiểm tra đồng hồ.',
    'Nhờ anh đặt bên giao nhận qua văn phòng lúc trưa.',
    'Nhờ tụi mình kêu phía kỹ thuật qua phòng họp.',
    'Đặt giùm em bên vệ sinh cho ngày thứ Năm.',
    'Kêu bên bảo trì tới nhà kho hộ tôi.',
    'Nhờ mình gọi phía nhà máy qua lấy mẫu sẵn.',
    'Gọi hộ tụi mình phía kho lạnh để họ nhận hàng.',
    'Nhờ đặt phía đối tác sang khảo sát sáng mai.',
];

describe('Home electrical safety and third-party requests', () => {
    for (const [category, examples] of Object.entries({ electricalEquipment, electricalSounds, waterNearElectrics })) {
        it.each(examples)(`${category}: %s`, text => expect(homeSpecExternalRequest(text, '')).toBe('hazard'));
    }

    const unaccented = delegatedParties.map(text => text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[Đđ]/g, word => word === 'Đ' ? 'D' : 'd'));
    it.each([...delegatedParties, ...unaccented])('recognizes a request to a party: %s', text => {
        expect(homeSpecExternalRequest(text, '')).toBe('action');
    });

    it.each([
        'Draft a note to keep the electrics cupboard clear.',
        'Keep the electrics cupboard clear when storing boxes.',
        'Write a checklist for inspecting a ceiling light that has been fizzing.',
        'Prepare an incident report for a meter closet that got wet yesterday.',
        'List the dates when the fuse room is due for maintenance.',
        'The power cupboard is due for its usual inspection on Monday.',
        'Schedule routine maintenance of the power room in May.',
        'A cable runs through the ceiling to the light fitting.',
        'So sánh giá của bên vận chuyển và phía kho lạnh.',
        'Tôi cần báo giá của các bên trước khi quyết định.',
        'Liệt kê các bên có thể sửa đồng hồ.',
        'Ghi chú về các bên dự buổi họp sáng thứ Sáu.',
        'Nhắn cho Lan là nhờ anh gọi phía vận chuyển giúp.',
        'Lập lịch bảo trì tủ điện định kỳ cho cả năm.',
        'So sanh bao gia cua cac ben giao nhan.',
        'Ghi chú lúc nào nên gọi bên vận chuyển và lúc nào nên tự mang đi.',
        'Liệt kê số tham chiếu cần có trước khi gọi phía bảo hiểm.',
        'Gọi bên cạnh là phía Đông trong sơ đồ kho.',
    ])('keeps documents, maintenance, and comparisons ordinary: %s', text => {
        expect(homeSpecExternalRequest(text, '')).toBeNull();
    });
});
