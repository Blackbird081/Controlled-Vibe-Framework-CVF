# Text Encoding Exception: Vietnamese literals quote the frozen public task and Unicode vocabulary data contract.
"""R2 vocabulary and derived-inventory preservation against frozen public snapshots."""
import copy
import hashlib
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'governance/compat'))
from generate_skill_control_plane_inventory import recommend_skills_for_spec, validate_inventory_matches_sources

PROFILE = ROOT / 'docs/reference/agent_system_skills/control_plane/source/skill-selection-profiles.json'
INVENTORY = ROOT / 'docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json'
BASE = ROOT / 'docs/reviews/evidence/ccp-r2-20261107'
TARGET = 'cvf-engineering-frontend-ui'
PINS = {'baseline-profiles.json': '0967f797aac1a5ab38b580c38140afb7114f85befabf40949b763297e482a385',
        'baseline-inventory.json': '92c43351ede5b27f20d6fc67c70cab35c8edc85b35c5289f8999a3cf5b3f1e23'}


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def target(rows):
    matches = [item for item in rows if item['skillId'] == TARGET]
    if len(matches) != 1:
        raise AssertionError('expected exactly one frontend profile')
    return matches[0]


class VocabularyPreservation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        for filename, expected in PINS.items():
            if hashlib.sha256((BASE / filename).read_bytes()).hexdigest() != expected:
                raise AssertionError('baseline snapshot hash mismatch: ' + filename)
        cls.original_profiles = read(BASE / 'baseline-profiles.json')
        cls.original_inventory = read(BASE / 'baseline-inventory.json')
        cls.profiles = read(PROFILE)
        cls.inventory = read(INVENTORY)

    def test_profile_scope_and_preserved_fields(self):
        before, after = copy.deepcopy(self.original_profiles), copy.deepcopy(self.profiles)
        self.assertEqual(len(before['profiles']), 26)
        self.assertEqual(len(after['profiles']), 26)
        old, new = target(before['profiles']), target(after['profiles'])
        self.assertEqual(new['selectionKeywords'], old['selectionKeywords'] + ['website', 'dashboard', 'webpage', 'màn hình', 'giao diện', 'trang web'])
        self.assertEqual(new['specSignals'], old['specSignals'] + ['landing page', 'web page', 'thiết kế giao diện'])
        for key in ('selectionKeywords', 'specSignals'):
            del old[key], new[key]
        self.assertEqual(before, after)

    def test_inventory_only_projects_allowed_delta(self):
        before, after = copy.deepcopy(self.original_inventory), copy.deepcopy(self.inventory)
        self.assertEqual(len(before['records']), 34)
        self.assertEqual(len(after['records']), 34)
        old, new = target(before['records'])['selection'], target(after['records'])['selection']
        profile = target(self.profiles['profiles'])
        for key in ('selectionKeywords', 'specSignals'):
            self.assertEqual(new[key], profile[key])
            del old[key], new[key]
        self.assertEqual(before, after)
        self.assertEqual(validate_inventory_matches_sources(), [])

    def test_public_frontend_examples_and_backend_negative(self):
        for text in ('Create a website for a local club', 'Build a dashboard for a team',
                     'Create a webpage for an event', 'Design a landing page for a launch',
                     'Implement a web page for registration',
                     'Dựng màn hình điều độ ca cho bãi container. Mỗi ca khoảng 2.000 container hiển thị trong bảng; lọc cùng lúc theo khu bãi, hãng tàu và trạng thái; sắp xếp theo cột; chọn nhiều container để đổi trạng thái một lần; container quá hạn hoặc lỗi chứng từ phải nổi bật; nhân viên thao tác chủ yếu bằng bàn phím.',
                     'Thiết kế giao diện trang web đăng ký sự kiện'):
            with self.subTest(text=text):
                rows = recommend_skills_for_spec(text, self.inventory, top=5)
                self.assertIn(TARGET, [row['skillId'] for row in rows])
        for text in ('Repair database transactions and server authentication',
                     'Tối ưu truy vấn bảng dữ liệu, phân quyền máy chủ và xử lý giao dịch'):
            rows = recommend_skills_for_spec(text, self.inventory, top=5)
            self.assertNotIn(TARGET, [row['skillId'] for row in rows])

if __name__ == '__main__':
    unittest.main()
