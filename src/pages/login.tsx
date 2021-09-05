import styles from './login.module.scss';

import { signIn, useSession } from 'next-auth/client';
import { useRouter } from 'next/dist/client/router';

export default function Login() {
  const [session] = useSession();
  const router = useRouter();

  if (session) {
    router.push(session.isAdmin ? 'admin' : '/');
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.loginText}>Bem vindo, <br/> Ao app de <br/> gerenciamento <br/> <span>Starlight Academy</span></p>
        <p className={styles.text}>Faça login utilizando <br/> a conta da Mavis hub</p>
      </div>
      <div className={styles.buttonWrapper}>
        <button 
          className={styles.googleButton}
          onClick={() => signIn('google')}
        >
          <div>
            <img src="/icons/google.svg" alt="Login" />
          </div>
          <span>Entrar com google</span>
        </button>
      </div>
    </div>
  );
}