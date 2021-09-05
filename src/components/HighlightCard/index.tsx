import { FiDollarSign } from 'react-icons/fi';

import styles from './styles.module.scss';

interface Props {
  amountSLP: number;
  amountBRL: number;
}

export function HighlightCard({ amountSLP, amountBRL }: Props) {
  return (
    <div className={styles.highlightCardContainer}>
      <div className={styles.highlightCardContent}>
        <header >
          <h1>Ganhos</h1>
          <FiDollarSign size={40} />
        </header>

        <footer>
          <h1>{ amountSLP } SLP</h1>
          <span>~ { amountBRL } BRL</span>
        </footer>
      </div>
    </div>
  );
};