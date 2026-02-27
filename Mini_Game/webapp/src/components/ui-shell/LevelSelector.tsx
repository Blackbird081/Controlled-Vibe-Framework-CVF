import { LEVEL_ORDER, LEVELS, LevelKey } from "@/lib/game-core";
import styles from "@/app/page.module.css";

interface LevelLabel {
  label: string;
  subtitle: string;
}

interface LevelSelectorProps {
  selected: LevelKey;
  labels: Record<LevelKey, LevelLabel>;
  onSelect: (level: LevelKey) => void;
}

export function LevelSelector({ selected, labels, onSelect }: LevelSelectorProps) {
  return (
    <section className={styles.levelSelector}>
      {LEVEL_ORDER.map((levelKey) => {
        const level = LEVELS[levelKey];
        const isActive = selected === levelKey;
        return (
          <button
            key={level.key}
            type="button"
            className={`${styles.levelButton} ${isActive ? styles.levelButtonActive : ""}`}
            onClick={() => onSelect(levelKey)}
          >
            <span className={styles.levelTitle}>{labels[levelKey].label}</span>
            <span className={styles.levelSubtitle}>{labels[levelKey].subtitle}</span>
          </button>
        );
      })}
    </section>
  );
}
