# AGT-016: Scientific Research Assistant

> **Type:** Agent Skill  
> **Domain:** Scientific Research  
> **Status:** Active

---

## Source

Inspired by K-Dense-AI/claude-scientific-skills (139 scientific skills covering biology, chemistry, medicine, computational research) and claude-code-templates scientific category.  
Reference: https://github.com/K-Dense-AI/claude-scientific-skills  
Implementation in v1.6 AGENT_PLATFORM.  
Skill mapping: `governance/skill-library/examples/AGT-016_SCIENTIFIC_RESEARCH_ASSISTANT.md`

---

## Capability

Assists with scientific research workflows including literature review, hypothesis generation, data analysis, statistical methods, citation management, and research paper structuring. Supports disciplines: biology, chemistry, physics, medicine, computational science.

**Actions:**
- Perform structured literature reviews across databases (PubMed, bioRxiv, arXiv)
- Generate research hypotheses based on existing evidence
- Apply statistical analysis methods (frequentist, Bayesian, survival analysis)
- Visualize scientific data (matplotlib, plotly, seaborn patterns)
- Manage citations and format references (APA, IEEE, Nature, etc.)
- Structure research papers (IMRaD format, supplementary materials)
- Review methodology and suggest improvements
- Generate scientific schematics and diagrams

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R1 – Low** |
| Allowed Roles | All |
| Allowed Phases | All |
| Decision Scope | Advisory |
| Autonomy | Auto (read-only analysis and generation) |

---

## Risk Justification

- **Accuracy critical** – Scientific analysis requires verified methodologies
- **Citation integrity** – Incorrect references undermine research credibility
- **Statistical misuse** – Improper statistical methods produce misleading results
- **Bias risk** – Literature selection may introduce confirmation bias
- **Reproducibility** – Generated analysis must be reproducible
- **No external execution** – All outputs are informational, not executable

---

## Constraints

- ✅ Literature search results include source URLs and access dates
- ✅ Statistical methods clearly state assumptions and limitations
- ✅ Generated citations follow specified format standards
- ✅ Hypothesis generation includes supporting evidence references
- ✅ All data visualizations include axis labels and data source notes
- ✅ Methodology reviews flag potential biases
- ❌ Cannot present unverified claims as established facts
- ❌ Cannot generate fake citations or fabricate data
- ❌ Cannot omit statistical test assumptions
- ❌ Cannot perform irreversible data transformations
- ❌ Cannot make clinical/medical recommendations

---

## UAT Binding

**PASS criteria:**
- [ ] Literature reviews include proper citations with URLs
- [ ] Statistical analyses state method assumptions
- [ ] Visualizations include proper labels and source annotations
- [ ] Hypothesis generation references supporting evidence
- [ ] Paper structure follows standard scientific format

**FAIL criteria:**
- [ ] Citations are fabricated or inaccurate
- [ ] Statistical methods applied without stating assumptions
- [ ] Results presented without reproducibility information
- [ ] Medical/clinical recommendations are made
