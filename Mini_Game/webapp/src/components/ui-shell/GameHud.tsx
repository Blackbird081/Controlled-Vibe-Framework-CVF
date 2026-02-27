import { getDetectiveRank } from "@/lib/game-core";
import styles from "@/app/page.module.css";

interface GameHudProps {
  score: number;
  combo: number;
  highScore: number;
  streak: number;
  timeLeft: number;
}

export function GameHud({ score, combo, highScore, streak, timeLeft }: GameHudProps) {
  const rank = getDetectiveRank(score);

  return (
    <section className={styles.hudGrid}>
      <article className={styles.statCard}>
        <p className={styles.statLabel}>Diem</p>
        <p className={styles.statValue}>{score}</p>
      </article>
      <article className={styles.statCard}>
        <p className={styles.statLabel}>Combo</p>
        <p className={styles.statValue}>x{combo}</p>
      </article>
      <article className={styles.statCard}>
        <p className={styles.statLabel}>Ky luc</p>
        <p className={styles.statValue}>{highScore}</p>
      </article>
      <article className={styles.statCard}>
        <p className={styles.statLabel}>Streak</p>
        <p className={styles.statValue}>{streak} ngay</p>
      </article>
      <article className={styles.statCardWide}>
        <p className={styles.statLabel}>Danh hieu</p>
        <p className={styles.rankValue}>{rank}</p>
      </article>
      <article className={styles.statCardWide}>
        <p className={styles.statLabel}>Thoi gian cau hoi</p>
        <p className={`${styles.rankValue} ${timeLeft <= 8 ? styles.timeDanger : ""}`}>{timeLeft}s</p>
      </article>
    </section>
  );
}
