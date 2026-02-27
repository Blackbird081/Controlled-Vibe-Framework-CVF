import { ParentModeSettings } from "@/lib/progress-service";
import styles from "@/app/page.module.css";

type UiLanguage = "vi" | "en";

interface ParentReport {
  rounds: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

interface ParentModePanelProps {
  settings: ParentModeSettings;
  remainingMinutes: number | null;
  report: ParentReport;
  language: UiLanguage;
  locked: boolean;
  parentMessage: string | null;
  onUnlock: (pin: string) => void;
  onSetPin: (pin: string) => void;
  onLock: () => void;
  onResetAll: () => void;
  onToggle: (enabled: boolean) => void;
  onLimitChange: (minutes: number) => void;
}

export function ParentModePanel({
  settings,
  remainingMinutes,
  report,
  language,
  locked,
  parentMessage,
  onUnlock,
  onSetPin,
  onLock,
  onResetAll,
  onToggle,
  onLimitChange,
}: ParentModePanelProps) {
  const hasPin = Boolean(settings.pinCode);
  const copy =
    language === "vi"
      ? {
          title: "Parent Mode",
          enableLimit: "Bat gioi han",
          lock: "Khoa lai",
          unlockLabel: "Nhap PIN phu huynh de mo khoa cai dat:",
          pinPlaceholder: "PIN",
          unlock: "Mo khoa",
          unlocked: "Khu vuc phu huynh dang mo khoa.",
          changePin: "Doi PIN phu huynh:",
          setPin: "Dat PIN phu huynh:",
          newPin: "PIN moi",
          newPinHint: "PIN moi (4-6 so)",
          savePin: "Luu PIN",
          dailyLimit: "Gioi han choi moi ngay:",
          minutes: "phut",
          remaining: "Con lai hom nay:",
          freePlay: "Parent mode dang tat. Tre co the choi tu do.",
          rounds: "Vong choi hom nay",
          correct: "Dung",
          wrong: "Sai",
          accuracy: "Do chinh xac",
          resetAll: "Reset toan bo du lieu choi",
        }
      : {
          title: "Parent Mode",
          enableLimit: "Enable limit",
          lock: "Lock",
          unlockLabel: "Enter parent PIN to unlock settings:",
          pinPlaceholder: "PIN",
          unlock: "Unlock",
          unlocked: "Parent area is unlocked.",
          changePin: "Change parent PIN:",
          setPin: "Set parent PIN:",
          newPin: "New PIN",
          newPinHint: "New PIN (4-6 digits)",
          savePin: "Save PIN",
          dailyLimit: "Daily play limit:",
          minutes: "min",
          remaining: "Remaining today:",
          freePlay: "Parent mode is off. Child can play freely.",
          rounds: "Today's rounds",
          correct: "Correct",
          wrong: "Wrong",
          accuracy: "Accuracy",
          resetAll: "Reset all game data",
        };

  return (
    <section className={styles.parentPanel}>
      <div className={styles.parentHeader}>
        <h2>{copy.title}</h2>
        <div className={styles.parentActions}>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => onToggle(event.target.checked)}
              disabled={locked}
            />
            <span>{copy.enableLimit}</span>
          </label>
          {!locked && hasPin ? (
            <button type="button" className={styles.parentActionButton} onClick={onLock}>
              {copy.lock}
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.parentLockCard}>
        {locked ? (
          <>
            <label htmlFor="parent-unlock-pin">{copy.unlockLabel}</label>
            <div className={styles.parentPinRow}>
              <input
                id="parent-unlock-pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder={copy.pinPlaceholder}
                className={styles.parentPinInput}
              />
              <button
                type="button"
                className={styles.parentActionButton}
                onClick={() => {
                  const el = document.getElementById("parent-unlock-pin") as HTMLInputElement | null;
                  onUnlock(el?.value ?? "");
                  if (el) el.value = "";
                }}
              >
                {copy.unlock}
              </button>
            </div>
          </>
        ) : (
          <p className={styles.parentUnlockedText}>{copy.unlocked}</p>
        )}
      </div>

      <div className={styles.parentLockCard}>
        <label htmlFor="parent-set-pin">{hasPin ? copy.changePin : copy.setPin}</label>
        <div className={styles.parentPinRow}>
          <input
            id="parent-set-pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder={hasPin ? copy.newPin : copy.newPinHint}
            className={styles.parentPinInput}
            disabled={locked && hasPin}
          />
          <button
            type="button"
            className={styles.parentActionButton}
            disabled={locked && hasPin}
            onClick={() => {
              const el = document.getElementById("parent-set-pin") as HTMLInputElement | null;
              onSetPin(el?.value ?? "");
              if (el) el.value = "";
            }}
          >
            {copy.savePin}
          </button>
        </div>
      </div>

      <div className={styles.limitLine}>
        <label htmlFor="daily-limit">
          {copy.dailyLimit} {settings.dailyLimitMinutes} {copy.minutes}
        </label>
        <input
          id="daily-limit"
          type="range"
          min={5}
          max={120}
          step={5}
          value={settings.dailyLimitMinutes}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          disabled={!settings.enabled || locked}
        />
      </div>

      <p className={styles.parentRemaining}>
        {settings.enabled
          ? `${copy.remaining} ${remainingMinutes ?? 0} ${copy.minutes}`
          : copy.freePlay}
      </p>

      <div className={styles.parentReport}>
        <p>
          {copy.rounds}: <strong>{report.rounds}</strong>
        </p>
        <p>
          {copy.correct}: <strong>{report.correct}</strong> | {copy.wrong}: <strong>{report.wrong}</strong>
        </p>
        <p>
          {copy.accuracy}: <strong>{report.accuracy}%</strong>
        </p>
      </div>

      <button type="button" className={styles.parentDangerButton} disabled={locked} onClick={onResetAll}>
        {copy.resetAll}
      </button>

      {parentMessage ? <p className={styles.parentMessage}>{parentMessage}</p> : null}
    </section>
  );
}
