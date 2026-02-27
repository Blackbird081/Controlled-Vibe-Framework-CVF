import styles from "@/app/page.module.css";

interface BadgeShelfProps {
  badges: string[];
}

export function BadgeShelf({ badges }: BadgeShelfProps) {
  return (
    <section className={styles.badgeShelf}>
      <h2>Bo suu tap huy hieu</h2>
      {badges.length === 0 ? (
        <p className={styles.badgeEmpty}>Dat combo x3 de mo khoa huy hieu dau tien.</p>
      ) : (
        <ul className={styles.badgeList}>
          {badges.map((badge) => (
            <li key={badge} className={styles.badgeItem}>
              <span>{badge}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
