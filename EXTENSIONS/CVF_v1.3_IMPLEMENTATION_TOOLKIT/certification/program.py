"""CVF Certification Program

Levels:
- Foundation (CVF Fundamentals, v1.0 core)
- Practitioner (CVF v1.1 implementation, real projects)
- Architect (CVF v1.2 design, advanced patterns)
- Specialist (CVF v1.3 extensions, custom implementation)
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum
from datetime import datetime


class CertificationLevel(Enum):
    """Certification levels"""
    FOUNDATION = 1
    PRACTITIONER = 2
    ARCHITECT = 3
    SPECIALIST = 4


class ExamType(Enum):
    """Types of certification exams"""
    MULTIPLE_CHOICE = "multiple_choice"
    PRACTICAL_PROJECT = "practical_project"
    CASE_STUDY = "case_study"
    SCENARIO_SIMULATION = "scenario_simulation"


@dataclass
class CertificationModule:
    """Single certification module"""
    id: str
    level: CertificationLevel
    title: str
    description: str
    duration_hours: float
    prerequisites: List[str] = field(default_factory=list)
    learning_objectives: List[str] = field(default_factory=list)
    topics: List[str] = field(default_factory=list)
    exam_type: ExamType = ExamType.MULTIPLE_CHOICE
    passing_score: int = 70  # Percentage
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class CertificationExam:
    """Exam structure"""
    id: str
    module_id: str
    questions: List[Dict[str, Any]] = field(default_factory=list)
    duration_minutes: int = 90
    passing_score: int = 70
    retake_allowed: bool = True
    max_retakes: int = 3


@dataclass
class CertificationResult:
    """Result of certification exam"""
    exam_id: str
    candidate_id: str
    score: int
    passed: bool
    completed_at: datetime = field(default_factory=datetime.utcnow)
    answers: Dict[str, Any] = field(default_factory=dict)
    feedback: str = ""


class CertificationProgram:
    """CVF Certification Program Manager"""

    def __init__(self):
        self.modules: Dict[str, CertificationModule] = {}
        self.exams: Dict[str, CertificationExam] = {}
        self.results: List[CertificationResult] = []
        self.certificates_issued: Dict[str, Dict[str, Any]] = {}
        self._create_default_modules()

    def _create_default_modules(self):
        """Create default certification modules"""
        
        # Foundation Module
        foundation = CertificationModule(
            id="cvf-foundation-1",
            level=CertificationLevel.FOUNDATION,
            title="CVF Fundamentals",
            description="Core concepts of CVF v1.0: Outcome > Code, decision frameworks, basic governance",
            duration_hours=4,
            prerequisites=[],
            learning_objectives=[
                "Understand CVF philosophy and core principles",
                "Apply decision templates and governance structure",
                "Set up basic project with CVF v1.0",
            ],
            topics=[
                "CVF Manifesto & Philosophy",
                "Outcome vs. Code paradigm",
                "Core governance layers",
                "Project initialization",
                "Basic decision tracking",
            ],
            exam_type=ExamType.MULTIPLE_CHOICE,
            passing_score=70,
        )
        self.modules["cvf-foundation-1"] = foundation

        # Practitioner Module
        practitioner = CertificationModule(
            id="cvf-practitioner-1",
            level=CertificationLevel.PRACTITIONER,
            title="CVF Practitioner: Spec-Driven Development",
            description="Master INPUT/OUTPUT specs, Action Units, and real project execution with CVF v1.1",
            duration_hours=12,
            prerequisites=["cvf-foundation-1"],
            learning_objectives=[
                "Write effective INPUT and OUTPUT specs",
                "Design Action Units for complex projects",
                "Manage AI execution with CVF v1.1 modules",
                "Implement tracing and audit logging",
            ],
            topics=[
                "INPUT_SPEC design patterns",
                "OUTPUT_SPEC acceptance criteria",
                "Agent Archetypes",
                "Action Unit decomposition",
                "Command taxonomy",
                "Execution tracing",
                "Preset configuration",
            ],
            exam_type=ExamType.PRACTICAL_PROJECT,
            passing_score=75,
        )
        self.modules["cvf-practitioner-1"] = practitioner

        # Architect Module
        architect = CertificationModule(
            id="cvf-architect-1",
            level=CertificationLevel.ARCHITECT,
            title="CVF Architect: Advanced Design & Patterns",
            description="Design complex skill contracts, risk models, and organizational governance with CVF v1.2",
            duration_hours=16,
            prerequisites=["cvf-practitioner-1"],
            learning_objectives=[
                "Design R0-R3 risk-aware skill contracts",
                "Apply capability versioning and lifecycle",
                "Design governance at scale",
                "Evaluate capability extensions",
            ],
            topics=[
                "Skill Contract design (R0-R3)",
                "Risk model assessment",
                "Capability lifecycle",
                "Versioning strategies",
                "External skill ingestion",
                "Governance scaling",
                "Compliance frameworks",
            ],
            exam_type=ExamType.CASE_STUDY,
            passing_score=80,
        )
        self.modules["cvf-architect-1"] = architect

        # Specialist Module
        specialist = CertificationModule(
            id="cvf-specialist-1",
            level=CertificationLevel.SPECIALIST,
            title="CVF Specialist: Implementation & Ecosystem",
            description="Implement routing engines, monitoring, certification, and ecosystem integration with CVF v1.3",
            duration_hours=20,
            prerequisites=["cvf-architect-1"],
            learning_objectives=[
                "Implement skill routing logic",
                "Build monitoring and observability systems",
                "Design ecosystem governance",
                "Advanced threat modeling and security",
            ],
            topics=[
                "Routing engine design",
                "Metrics and monitoring",
                "Dashboard implementation",
                "Ecosystem governance",
                "RFC process design",
                "Security hardening",
                "Production deployment",
            ],
            exam_type=ExamType.SCENARIO_SIMULATION,
            passing_score=85,
        )
        self.modules["cvf-specialist-1"] = specialist

    def create_exam(self, module_id: str) -> CertificationExam:
        """Create exam for a module"""
        module = self.modules.get(module_id)
        if not module:
            raise ValueError(f"Module {module_id} not found")

        exam = CertificationExam(
            id=f"exam-{module_id}-{datetime.utcnow().timestamp()}",
            module_id=module_id,
            duration_minutes=90 if module.exam_type == ExamType.MULTIPLE_CHOICE else 180,
        )

        # Generate questions based on topics
        exam.questions = self._generate_exam_questions(module)
        
        self.exams[exam.id] = exam
        return exam

    def _generate_exam_questions(self, module: CertificationModule) -> List[Dict[str, Any]]:
        """Generate exam questions for module"""
        questions = []

        # For each topic, create appropriate questions
        for topic in module.topics:
            if module.exam_type == ExamType.MULTIPLE_CHOICE:
                questions.append({
                    "id": f"q-{len(questions)}",
                    "topic": topic,
                    "type": "multiple_choice",
                    "question": f"Question about {topic}",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option A",
                })
            elif module.exam_type == ExamType.PRACTICAL_PROJECT:
                questions.append({
                    "id": f"q-{len(questions)}",
                    "topic": topic,
                    "type": "practical",
                    "task": f"Complete a practical task involving {topic}",
                    "deliverables": ["Code", "Documentation", "Test coverage"],
                })

        return questions

    def submit_exam_result(self, result: CertificationResult):
        """Submit exam result"""
        result.passed = result.score >= 70  # Default passing score
        self.results.append(result)

        # If passed, issue certificate
        if result.passed:
            self._issue_certificate(result)

    def _issue_certificate(self, result: CertificationResult):
        """Issue certification certificate"""
        exam = self.exams.get(result.exam_id)
        module = self.modules.get(exam.module_id) if exam else None

        if not module:
            return

        cert_id = f"cert-{result.candidate_id}-{module.level.name}-{datetime.utcnow().timestamp()}"

        self.certificates_issued[cert_id] = {
            "candidate_id": result.candidate_id,
            "level": module.level.name,
            "module_id": module.id,
            "module_title": module.title,
            "issued_at": datetime.utcnow().isoformat(),
            "score": result.score,
            "valid_until": None,  # No expiry for CVF
        }

    def get_candidate_progress(self, candidate_id: str) -> Dict[str, Any]:
        """Get certification progress for a candidate"""
        candidate_results = [
            r for r in self.results if r.candidate_id == candidate_id
        ]

        completed_modules = {}
        for result in candidate_results:
            if result.passed:
                exam = self.exams.get(result.exam_id)
                module = self.modules.get(exam.module_id) if exam else None
                if module:
                    completed_modules[module.id] = {
                        "level": module.level.name,
                        "title": module.title,
                        "score": result.score,
                        "completed_at": result.completed_at.isoformat(),
                    }

        return {
            "candidate_id": candidate_id,
            "completed_modules": completed_modules,
            "total_modules_completed": len(completed_modules),
            "highest_level": max([m["level"] for m in completed_modules.values()], default=None),
        }

    def get_catalog(self) -> Dict[str, Any]:
        """Get certification catalog"""
        return {
            "modules": [
                {
                    "id": m.id,
                    "level": m.level.name,
                    "title": m.title,
                    "description": m.description,
                    "duration_hours": m.duration_hours,
                    "prerequisites": m.prerequisites,
                }
                for m in self.modules.values()
            ],
            "total_modules": len(self.modules),
        }
