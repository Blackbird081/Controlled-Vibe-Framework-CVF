# CVF Roadmap - 8 Upgrades To Increase Kid Engagement

**Date:** 2026-02-27  
**Version:** v1.0  
**Scope:** `Mini_Game/webapp`  
**Reference checklist:** `Mini_Game/CVF_DOCS/CVF_KID_GAME_QUALITY_CHECKLIST_2026-02-26.md`

---

## 1) Objective

Hoan tat day du 8 huong nang cap de game:
- Hap dan hon voi tre em o 3 nhom tuoi (5-6, 7-8, 9-10).
- Co motivation loop manh hon (quay lai choi tiep).
- Van giu an toan tre em, parent control, performance va test coverage theo CVF.

---

## 2) Scope of 8 Upgrades

1. Progress map ro rang (Academy map / zone unlock)
2. Boss round moi 5 vong
3. Ca nhan hoa theo do tuoi (noi dung + toc do + feedback)
4. Mo rong content bank, giam lap cau hoi
5. Reward loop sau hon (avatar/pet/sticker/chest)
6. Self-challenge an toan (beat-your-yesterday)
7. Parent report dep va huu ich hon (weekly)
8. Nang cap game-feel (hit effect, combo trail, win banner, layered audio)

---

## 3) Delivery Strategy (CVF)

- Phase C1: Core progression and challenge loop (items 1, 2, 6)
- Phase C2: Personalization + content scale (items 3, 4)
- Phase C3: Reward depth + parent intelligence + polish (items 5, 7, 8)
- Gate each phase by: quality checklist + test coverage + pilot mini-UAT

---

## 4) Sprint Roadmap (6 sprints x 1 week)

## Sprint 1 - Foundation for Progression

**Main outcome:** Tao khung tien trinh de support map + boss + challenge.

- Build `progression-service`:
  - Session node progression (zone, level, unlock state)
  - Round counter trong 1 run
  - Boss trigger rule scaffold
- Extend telemetry events:
  - `zone_enter`, `zone_unlock`, `node_complete`
- UI skeleton:
  - Academy map panel placeholder
  - "Mission of the day" compact status
- Testing:
  - Unit test progression state machine
  - Coverage gate >= 65% cho module moi

**DoD Sprint 1:**
- Co map skeleton render dung tren mobile/desktop.
- Progress luu local storage dung schema moi.
- Khong lam giam score/timer gameplay cu.

---

## Sprint 2 - Upgrade #1 + #2 (Map + Boss Round)

**Main outcome:** Nguoi choi cam thay co hanh trinh va cao trao.

- Implement Upgrade #1:
  - 3 zone dau (Space Class, Orbit Lab, Nova Gate)
  - Dieu kien unlock theo so node hoan thanh
  - VFX nhe khi mo khoa zone
- Implement Upgrade #2:
  - Boss round sau moi 5 vong
  - Boss co timer ngan hon + reward multiplier
  - Banner + confetti + sound cue rieng cho boss win
- QA:
  - Test flow: fail boss, pass boss, restart run
  - Ensure no dead-end state

**KPI target:**
- Session duration tang >= 15% so voi baseline.
- Restart sau thua boss <= 2 click.

---

## Sprint 3 - Upgrade #3 (Age Personalization, true behavior)

**Main outcome:** Moi nhom tuoi co trai nghiem khac ro rang, khong chi mau sac.

- 5-6:
  - Prompt ngan, pace cham hon, feedback dong vien manh
  - Math range nho hon, distractor de hon
- 7-8:
  - Pace can bang
  - Distractor vua phai
- 9-10:
  - Faster cycle, challenge cao hon, feedback gon
  - Combo pressure cao hon
- Add profile-specific config file:
  - `age_profiles.ts` (UI pace, hint frequency, round length, complexity)
- QA:
  - Snapshot/UI test cho 3 profile
  - Telemetry segment theo age profile

**KPI target:**
- Wrong streak >3 giam >= 20% o group 5-6.
- Completion rate cua group 9-10 khong giam duoi 75%.

---

## Sprint 4 - Upgrade #4 (Content Bank Expansion)

**Main outcome:** Giam lap, tang do moi moi phien choi.

- Tao content generator packs:
  - Math templates theo topic (addition/subtraction patterns)
  - Memory symbol set rotation theo theme
  - Color mode with anti-repeat rules
- Add anti-repeat algorithm:
  - Khong lap lai pattern trong N round gan nhat
- Add weekly theme switch (local config)
- QA + coverage:
  - Property-based tests cho random generator
  - Validate no invalid question output

**KPI target:**
- "Cau hoi lap lai" feedback trong pilot <= 10%.

---

## Sprint 5 - Upgrade #5 + #6 (Reward Depth + Self Challenge)

**Main outcome:** Tre co ly do quay lai choi hang ngay.

- Implement Upgrade #5:
  - Sticker album
  - Daily chest
  - Avatar/pet slot (v1 local unlock)
- Implement Upgrade #6:
  - "Beat your yesterday" widget
  - Targets: score, accuracy, streak
  - Khong co leaderboard cong khai
- Add telemetry:
  - `daily_chest_open`, `sticker_unlock`, `self_challenge_win`
- QA:
  - Reward khong dupe
  - Data khong corrupt khi reset parent mode

**KPI target:**
- Day-2 return rate pilot >= 35%.
- Tuong tac reward panel >= 60% session.

---

## Sprint 6 - Upgrade #7 + #8 (Parent Report + Game Feel Polish)

**Main outcome:** Game dep hon va phu huynh nhin thay gia tri hoc tap ro rang.

- Implement Upgrade #7:
  - Weekly parent report card
  - Trend: time played, accuracy trend, weak spot by mini game
  - Suggestion text (next-step guidance)
- Implement Upgrade #8:
  - Hit effects per mini game
  - Combo trail
  - Age-based win banner variants
  - Layered audio mix tuning (safe volume)
- Release prep:
  - Controlled pilot UAT (5-10 child + parent)
  - Critical/High bug cleanup
  - Coverage evidence refresh

**KPI target:**
- Parent flow completion >= 90%.
- Child flow completion >= 80%.
- Crash rate = 0 trong pilot.

---

## 5) Technical Backlog Summary

## A. Architecture

- New modules:
  - `progression-service/`
  - `content-bank/`
  - `rewards-service/`
  - `report-service/`
- Existing modules to extend:
  - `game-core/`
  - `progress-service/`
  - `telemetry.ts`
  - `game-store.ts`

## B. Data model changes

- Add `progressMapState`
- Add `bossStats`
- Add `rewardInventory`
- Add `selfChallengeHistory`
- Add `weeklyReportSnapshot`

## C. Testing and quality

- Unit tests for each new service
- Integration tests for game loop transitions
- Maintain coverage threshold and update baseline each sprint

---

## 6) CVF Gates by Phase

## Gate C1 (after Sprint 2)

- Map + boss flow stable
- No critical state break
- Coverage maintained

## Gate C2 (after Sprint 4)

- Age behavior personalization active
- Content anti-repeat active
- Pilot feedback: repetition issue reduced

## Gate C3 (after Sprint 6)

- Reward + parent report + polish complete
- Pilot pass, no Critical/High bug
- Release package evidence complete

---

## 7) Risks and Mitigation

- Scope creep (qua nhieu feature trong 1 sprint)
  - Mitigation: strict sprint scope + freeze at mid-week
- Data migration bug (local progress schema changes)
  - Mitigation: migration tests + fallback reset path
- Performance drop do VFX/audio layer
  - Mitigation: perf budget + reduced-motion + low-end audio mode
- Content quality khong dong deu
  - Mitigation: content validation scripts + pilot feedback loop

---

## 8) Documentation Outputs (must create during roadmap)

- `Mini_Game/CVF_DOCS/PHASE_C1_PROGRESS_REPORT_YYYY-MM-DD.md`
- `Mini_Game/CVF_DOCS/PHASE_C2_PROGRESS_REPORT_YYYY-MM-DD.md`
- `Mini_Game/CVF_DOCS/PHASE_C3_PROGRESS_REPORT_YYYY-MM-DD.md`
- `Mini_Game/CVF_DOCS/PILOT_UAT_RESULTS_YYYY-MM-DD.md` (refresh)
- `Mini_Game/CVF_DOCS/TEST_COVERAGE_BASELINE_YYYY-MM-DD.md` (refresh each phase)
- `Mini_Game/CVF_DOCS/RELEASE_NOTES_v1.1.0-rc1.md`

---

## 9) Immediate Next Action (Start now)

1. Kickoff Sprint 1: tao branch/task list cho progression-service.
2. Add telemetry schema for map/boss events.
3. Tao test skeleton cho progression state machine truoc khi code feature.

---

## 10) Approval

- [ ] Approved roadmap v1.0 by Product Owner
- [ ] Approved technical scope by Engineering
- [ ] Approved pilot plan by QA/UAT owner

