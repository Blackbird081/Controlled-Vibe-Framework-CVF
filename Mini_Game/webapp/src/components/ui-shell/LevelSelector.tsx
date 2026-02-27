import { LEVEL_ORDER, LEVELS, LevelKey } from "@/lib/game-core";
import styles from "@/app/page.module.css";

interface LevelSelectorProps {
  selected: LevelKey;
  onSelect: (level: LevelKey) => void;
}

export function LevelSelector({ selected, onSelect }: LevelSelectorProps) {
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
            <span className={styles.levelTitle}>{level.label}</span>
            <span className={styles.levelSubtitle}>{level.subtitle}</span>
          </button>
        );
      })}
    </section>
  );
}
