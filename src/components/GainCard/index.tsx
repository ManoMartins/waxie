import styles from './styles.module.scss';

interface Props {
  amount: number;
  label: string;
  gains?: number;
  type?: 'more' | 'less';
}

export function GainCard({ amount, label, gains, type }: Props) {
  return (
    <li className={styles.gainCardContainer}>
      <p className={styles.createDate}>{ label }</p>
      <div>
        <p className={styles.total}>{ amount }</p>
        {gains >= 0 && (
          <p 
            className={styles.gains} 
            style={{ color: type === 'more' ? 'green' : 'red'}} 
          >
            { gains }
          </p>
        )}
      </div>
    </li>
  );
};