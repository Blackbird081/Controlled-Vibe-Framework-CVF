from pathlib import Path
import sys
import json
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import test_check_active_session_state as fixtures
MODULE = fixtures.MODULE
DECL = 'PROGRAM_ID=CVF-NCR; NEXT_ACTION_CLASS=LOCAL_DISPOSITION_ONLY; BATCH_ID=CVF-NCR-ONE. Stop before deployment; DIR-T2 is historical.'


class NCRAlignmentTests(unittest.TestCase):
    def setUp(self):
        self.fixture = fixtures.ActiveSessionStateTests()
        self.fixture.setUp()
        self.addCleanup(self.fixture.tearDown)
        self.repo_root = self.fixture.repo_root
        self.handoff = 'AGENT_HANDOFF_V8_2026-05-17.md'

    def alignment(self, state=DECL, front=DECL, handoff=DECL):
        (self.repo_root / self.handoff).write_text('Status: ACTIVE\n## Next Allowed Move\n'+handoff+'\n## Parked\n', encoding='utf-8')
        with patch.object(MODULE, 'REPO_ROOT', self.repo_root):
            return MODULE._check_next_allowed_move_alignment({'nextAllowedMove': state}, '## Next Allowed Move\n'+front+'\n## Other\n', self.handoff)

    def test_synchronized(self):
        self.assertEqual([], self.alignment())

    def test_spacing_and_wrappers(self):
        header, guidance = DECL.split('. ', 1)
        formatted = header.replace('PROGRAM_ID=', 'PROGRAM_ID = ').replace('; ', ' ;  ')
        formatted += '. ' + guidance.replace('Stop before', 'Stop   before')
        self.assertEqual([], self.alignment(front='Next allowed move: `'+formatted+'`', handoff='`'+DECL+'`'))

    def test_guidance_case_and_punctuation_preserved(self):
        for changed in [DECL.replace('Stop before', 'stop before'), DECL.replace('deployment;', 'deployment,'), DECL.replace('deployment;', 'deployment ;')]:
            with self.subTest(changed=changed):
                self.assertTrue(self.alignment(front=changed))

    def test_malformed_ncr_envelopes(self):
        for changed in ['`'+DECL, DECL.replace('CVF-NCR;', 'CVF-NCR.'), DECL.replace('; BATCH_ID', '; NEXT_ACTION_CLASS=DUPLICATE; BATCH_ID')]:
            with self.subTest(changed=changed):
                self.assertTrue(self.alignment(state=changed, front=changed, handoff=changed))

    def test_guidance_drift_front(self):
        self.assertTrue(self.alignment(front=DECL.replace('Stop before deployment', 'Deploy now')))

    def test_guidance_drift_handoff(self):
        self.assertTrue(self.alignment(handoff=DECL.replace('Stop before deployment', 'Deploy now')))

    def test_header_id_drift(self):
        self.assertTrue(self.alignment(front=DECL.replace('CVF-NCR-ONE', 'CVF-NCR-TWO')))

    def test_bad_front_declarations(self):
        mutations=['', DECL+'\n'+DECL, DECL.replace('CVF-NCR;', 'CVF-OTHER;'), DECL.replace('NEXT_ACTION_CLASS=LOCAL_DISPOSITION_ONLY;', ''), DECL.replace('BATCH_ID=CVF-NCR-ONE', 'BATCH_ID='), DECL.replace('; BATCH_ID', '; EXTRA=NO; BATCH_ID'), DECL.replace('CVF-NCR-ONE', 'invalid')]
        for value in mutations:
            with self.subTest(value=value):
                self.assertTrue(self.alignment(front=value))

    def test_bad_handoff_declarations(self):
        for value in ['',DECL+'\n'+DECL,DECL.replace('CVF-NCR;', 'CVF-OTHER;')]:
            with self.subTest(value=value):
                self.assertTrue(self.alignment(handoff=value))

    def test_bad_state_headers(self):
        for value in [DECL.replace('NEXT_ACTION_CLASS=LOCAL_DISPOSITION_ONLY;', ''),DECL.replace('BATCH_ID=CVF-NCR-ONE','BATCH_ID='),DECL.replace('; BATCH_ID','; EXTRA=NO; BATCH_ID'),DECL.replace('Stop before','Stop\nbefore')]:
            with self.subTest(value=value):
                self.assertTrue(self.alignment(state=value,front=value,handoff=value))

    def test_history_not_primary(self):
        self.assertEqual([],self.alignment(front='Mode: current\n'+DECL+'\nHistorical: DIR-T1 was closed.'))
        self.assertTrue(self.alignment(front='Historical: '+DECL))

    def test_legacy_families(self):
        for family in ['DIR-T1','MEMCON-T1','LPCI2-T1','DT-CVF-T1','PL-S1','Policy_Local','EC-1','DEP1']:
            with self.subTest(family=family):
                self.assertEqual([],self.alignment(state=family+' do one',front=family+' different prose',handoff=family+' more'))
                self.assertTrue(self.alignment(state=family,front='DIR-T9',handoff=family))

    def test_unknown_legacy_unchanged(self):
        self.assertEqual([],self.alignment(state='UNKNOWN-FAMILY work',front='unrelated',handoff='unrelated'))

    def test_classifier_current_format(self):
        path=self.repo_root/'CVF_SESSION/ACTIVE_SESSION_STATE.json'
        state=json.loads(path.read_text(encoding='utf-8'))
        state['nextAllowedMove']=DECL
        path.write_text(json.dumps(state),encoding='utf-8')
        front=self.repo_root/'CVF_SESSION_MEMORY.md'
        original=front.read_text(encoding='utf-8')
        front.write_text(original+'## Next Allowed Move\n'+DECL+'\n',encoding='utf-8')
        (self.repo_root/self.handoff).write_text('Status: ACTIVE - current\n## Next Allowed Move\n'+DECL+'\n',encoding='utf-8')
        with patch.object(MODULE,'REPO_ROOT',self.repo_root):
            report=MODULE._classify()
        self.assertTrue(report['compliant'],report['continuityViolations'])
        front.write_text(original+'## Next Allowed Move\n'+DECL.replace('Stop before deployment','Deploy now')+'\n',encoding='utf-8')
        with patch.object(MODULE,'REPO_ROOT',self.repo_root):
            report=MODULE._classify()
        self.assertFalse(report['compliant'])
        self.assertTrue(any('Next Allowed Move' in issue for issue in report['continuityViolations']))

    def test_front_door_next_allowed_primary_token_must_match_state(self) -> None:
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["nextAllowedMove"] = "Next allowed move: DIR-T2 only through fresh GC-018."
        state_path.write_text(json.dumps(state), encoding="utf-8")
        (self.repo_root / "CVF_SESSION_MEMORY.md").write_text(
            "ACTIVE SESSION FRONT DOOR\nCVF_SESSION/ACTIVE_SESSION_STATE.json\n"
            "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json\n"
            "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md\n"
            "system_reconvergence_stop\ngovernance_kernel_freeze_recommended\n"
            "AGENT_HANDOFF_V8_2026-05-17.md\n"
            "## Next Allowed Move\nNext allowed move: DIR-T1 only through stale text.\n",
            encoding="utf-8",
        )
        (self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md").write_text(
            "Status: ACTIVE - current\n## Next Allowed Move\nDIR-T2 may be opened.\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertTrue(
            any(
                "CVF_SESSION_MEMORY.md Next Allowed Move primary token `dir-t1`"
                in issue
                for issue in report["continuityViolations"]
            )
        )

    def test_handoff_next_allowed_primary_token_must_match_state(self) -> None:
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["nextAllowedMove"] = "Next allowed move: DIR-T2 only through fresh GC-018."
        state_path.write_text(json.dumps(state), encoding="utf-8")
        (self.repo_root / "CVF_SESSION_MEMORY.md").write_text(
            "ACTIVE SESSION FRONT DOOR\nCVF_SESSION/ACTIVE_SESSION_STATE.json\n"
            "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json\n"
            "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md\n"
            "system_reconvergence_stop\ngovernance_kernel_freeze_recommended\n"
            "AGENT_HANDOFF_V8_2026-05-17.md\n"
            "## Next Allowed Move\nNext allowed move: DIR-T2 only through fresh GC-018.\n",
            encoding="utf-8",
        )
        (self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md").write_text(
            "Status: ACTIVE - current\n## Next Allowed Move\nDIR-T1 may be opened.\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertTrue(
            any(
                "active handoff Next Allowed Move primary token `dir-t1`"
                in issue
                for issue in report["continuityViolations"]
            )
        )

    def test_next_allowed_primary_token_alignment_passes_when_synced(self) -> None:
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["nextAllowedMove"] = "Next allowed move: DIR-T2 only through fresh GC-018."
        state_path.write_text(json.dumps(state), encoding="utf-8")
        (self.repo_root / "CVF_SESSION_MEMORY.md").write_text(
            "ACTIVE SESSION FRONT DOOR\nCVF_SESSION/ACTIVE_SESSION_STATE.json\n"
            "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json\n"
            "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md\n"
            "system_reconvergence_stop\ngovernance_kernel_freeze_recommended\n"
            "AGENT_HANDOFF_V8_2026-05-17.md\n"
            "## Next Allowed Move\nNext allowed move: DIR-T2 only through fresh GC-018.\n",
            encoding="utf-8",
        )
        (self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md").write_text(
            "Status: ACTIVE - current\n## Next Allowed Move\nDIR-T2 may be opened.\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertTrue(report["compliant"])
