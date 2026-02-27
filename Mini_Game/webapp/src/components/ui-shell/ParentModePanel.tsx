import { ParentModeSettings } from "@/lib/progress-service";
import styles from "@/app/page.module.css";

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

  return (
    <section className={styles.parentPanel}>
      <div className={styles.parentHeader}>
        <h2>Parent Mode</h2>
        <div className={styles.parentActions}>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => onToggle(event.target.checked)}
              disabled={locked}
            />
            <span>Bat gioi han</span>
          </label>
          {!locked && hasPin ? (
            <button type="button" className={styles.parentActionButton} onClick={onLock}>
              Khoa lai
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.parentLockCard}>
        {locked ? (
          <>
            <label htmlFor="parent-unlock-pin">Nhap PIN phu huynh de mo khoa cai dat:</label>
            <div className={styles.parentPinRow}>
              <input
                id="parent-unlock-pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="PIN"
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
                Mo khoa
              </button>
            </div>
          </>
        ) : (
          <p className={styles.parentUnlockedText}>Khu vuc phu huynh dang mo khoa.</p>
        )}
      </div>

      <div className={styles.parentLockCard}>
        <label htmlFor="parent-set-pin">{hasPin ? "Doi PIN phu huynh:" : "Dat PIN phu huynh:"}</label>
        <div className={styles.parentPinRow}>
          <input
            id="parent-set-pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder={hasPin ? "PIN moi" : "PIN moi (4-6 so)"}
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
            Luu PIN
          </button>
        </div>
      </div>

      <div className={styles.limitLine}>
        <label htmlFor="daily-limit">Gioi han choi moi ngay: {settings.dailyLimitMinutes} phut</label>
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
          ? `Con lai hom nay: ${remainingMinutes ?? 0} phut`
          : "Parent mode dang tat. Tre co the choi tu do."}
      </p>

      <div className={styles.parentReport}>
        <p>
          Vong choi hom nay: <strong>{report.rounds}</strong>
        </p>
        <p>
          Dung: <strong>{report.correct}</strong> | Sai: <strong>{report.wrong}</strong>
        </p>
        <p>
          Do chinh xac: <strong>{report.accuracy}%</strong>
        </p>
      </div>

      <button type="button" className={styles.parentDangerButton} disabled={locked} onClick={onResetAll}>
        Reset toan bo du lieu choi
      </button>

      {parentMessage ? <p className={styles.parentMessage}>{parentMessage}</p> : null}
    </section>
  );
}
