import { MINI_GAMES, MiniGameKey } from "@/lib/game-core";
import styles from "@/app/page.module.css";

interface MiniGameTabsProps {
  activeKey: MiniGameKey;
  onSelect: (key: MiniGameKey) => void;
}

export function MiniGameTabs({ activeKey, onSelect }: MiniGameTabsProps) {
  return (
    <section className={styles.tabsRow}>
      {MINI_GAMES.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`${styles.tabCard} ${activeKey === tab.key ? styles.tabCardActive : ""}`}
          onClick={() => onSelect(tab.key)}
        >
          <h3>{tab.title}</h3>
          <p>{tab.description}</p>
        </button>
      ))}
    </section>
  );
}
