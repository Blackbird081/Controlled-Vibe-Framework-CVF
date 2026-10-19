"""Actual F2G boundary tests with pinned synthetic chains; no provider or agent claims."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import sys
sys.path.insert(0,str(Path(__file__).parent))
import learning_application_binding as binding
import check_finding_to_governance_learning as gate
import parent_learning_evidence as parent
from test_parent_learning_evidence import Fixture, FID

ORDER='docs/work_orders/test.md'
RECORD='docs/reviews/learnings/test.md'

class ApplicationBindingTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        fx=Fixture(self.root)
        self.pe=fx.record()
        self.pe['source']['evidence']=fx.ref(RECORD,'# Test learning\nparentFindingId: '+FID+'\n')
        self.row=dict(id=FID,parentEvidence=self.pe,learningRecordPath=RECORD,dispatchBindingRequired=True)
        self.registry=dict(entries=[dict(findings=[self.row])])
        self.save()
        ctl=next(x for x in self.pe['implementation']['evidence'] if x['fragment'].startswith('control:'))
        self.plan=dict(schemaVersion=binding.SCHEMA,bindings=[dict(findingId=FID,control={k:ctl[k] for k in ('path','sha256')},action='Bind required safety checks before dispatch',verificationPlan='Review actual completion receipt and negative mutations')])

    def save(self):
        p=self.root/binding.REGISTRY;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(self.registry))

    def text(self,plan=None):
        return '# Order\ndocType: work_order\n```learning-application-plan-json\n'+json.dumps(plan or self.plan)+'\n```\n'

    def codes(self,text,path=ORDER):
        return {x['type'] for x in binding.validate_changed(self.root,path,text)}

    def test_real_changed_classifier_rejects_missing_plan(self):
        p=self.root/ORDER;p.parent.mkdir(parents=True);p.write_text('docType: work_order\n')
        with patch.object(gate,'REPO_ROOT',self.root):
            report=gate._classify({ORDER:['A']})
        self.assertFalse(report['compliant'])
        self.assertIn('learning_plan_missing',{x['type'] for x in report['violations']})

    def test_modified_and_renamed_order_cannot_bypass_plan(self):
        p=self.root/ORDER;p.parent.mkdir(parents=True);p.write_text('docType: work_order\n')
        for status in ('M','R100','R050'):
            with patch.object(gate,'REPO_ROOT',self.root):
                report=gate._classify({ORDER:[status]})
            self.assertIn('learning_plan_missing',{x['type'] for x in report['violations']})

    def test_valid_plan_is_binding_not_application(self):
        self.assertEqual(self.codes(self.text()),set())
        self.assertEqual(self.pe['projectApplication']['state'],'APPLIED')
        # Existing synthetic APPLIED receipts remain a separate contract; a plan cannot create them.
        self.pe['projectApplication']=dict(state='NOT_APPLIED',reason='No real application',evidence=[])
        self.save();self.assertEqual(self.codes(self.text()),set())

    def test_control_hash_drift(self):
        p=copy.deepcopy(self.plan);p['bindings'][0]['control']['sha256']='0'*64
        self.assertIn('learning_control_drift',self.codes(self.text(p)))

    def test_missing_obligation(self):
        self.assertIn('learning_obligation_omitted',self.codes(self.text(dict(schemaVersion=binding.SCHEMA,bindings=[]))))

    def test_duplicate_binding(self):
        p=copy.deepcopy(self.plan);p['bindings'].append(p['bindings'][0])
        self.assertIn('learning_plan_invalid',self.codes(self.text(p)))

    def test_unknown_field_and_version(self):
        for key,value in [('extra',True),('schemaVersion','bad')]:
            p=copy.deepcopy(self.plan);p[key]=value
            self.assertIn('learning_plan_invalid',self.codes(self.text(p)))

    def test_placeholder_and_duplicate_json_key(self):
        p=copy.deepcopy(self.plan);p['bindings'][0]['action']='TODO'
        self.assertIn('learning_plan_invalid',self.codes(self.text(p)))
        text=self.text().replace('"schemaVersion":','"schemaVersion":"bad", "schemaVersion":',1)
        self.assertIn('learning_plan_invalid',self.codes(text))

    def test_record_must_join_typed_source(self):
        self.assertEqual(self.codes((self.root/RECORD).read_text(),RECORD),set())
        self.assertIn('learning_not_enrolled',self.codes('# Learning\n',RECORD))
        self.assertIn('learning_not_enrolled',self.codes('parentFindingId: other\n',RECORD))

    def test_fenced_example_is_not_enrollment(self):
        self.assertIn('learning_not_enrolled',self.codes('```\nparentFindingId: '+FID+'\n```',RECORD))

    def test_archive_templates_and_unchanged_history(self):
        self.assertEqual(self.codes('', 'docs/reviews/learnings/README.md'),set())
        self.assertEqual(self.codes('', 'docs/reviews/learnings/archive/test.md'),set())
        with patch.object(gate,'REPO_ROOT',self.root):
            report=gate._classify({})
        self.assertTrue(report['compliant'])

    def test_missing_registry_and_invalid_typed_obligation(self):
        (self.root/binding.REGISTRY).unlink()
        self.assertIn('application_registry_invalid',self.codes(self.text()))
        self.row['parentEvidence']=None;self.save()
        self.assertIn('dispatch_obligation_invalid',self.codes(self.text()))

    def test_positive_lifecycle_counts_only_for_valid_typed(self):
        r=parent.classify_registry(self.root,binding.REGISTRY)
        self.assertEqual(r['lifecycleCounts']['projectApplication']['APPLIED'],1)
        self.pe['projectApplication']['evidence']=[];self.save()
        r=parent.classify_registry(self.root,binding.REGISTRY)
        self.assertEqual(r['invalid'],1)
        self.assertEqual(r['lifecycleCounts']['projectApplication']['APPLIED'],0)

if __name__=='__main__':
    unittest.main()
