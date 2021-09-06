import styles from './register.module.scss';
import Link from 'next/link'
import { FiChevronLeft } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { api } from '../services/api';
import { useRouter } from 'next/dist/client/router';

export default function Register() {
  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      createDate: new Date().toISOString().substr(0,10),
      amount: 0,
    }
  });

  const { isSubmitting } = formState;

  const route = useRouter();

  const onSubmit = async (form: any) => {
    try {
      let differenceLastRelease = form.amount - +route.query.amountSLP;
      console.log(differenceLastRelease);

      if (form.amount < +route.query.amountSLP && differenceLastRelease === 0) {
        differenceLastRelease = 0
      }

      const data = {
        createDate: new Date(form.createDate),
        amount: form.amount,
        differenceLastRelease,
        type: differenceLastRelease > +route.query.differenceLastRelease ? 'more' : 'less',
      }
      
      await api.post('/api/create-earning', data);
      route.push('/');
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <main className={styles.contentWrapper}>
      <header className={styles.headerWrapper}>
        <Link href="/">
          <a><FiChevronLeft size={24} /></a>
        </Link>
        <h1>Cadastro</h1>
      </header>

      <form className={styles.formWrapper} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.fields}>
          <input 
            type="date" 
            {...register('createDate', {
              valueAsDate: true,
            })}
          />

          <input 
            type="number" 
            {...register('amount')}
            placeholder="Quantidade total de SLP"  
          />
        </div>
        {isSubmitting ? (
          <span>Enviando...</span>
        ) : (
          <button type="submit">Salvar</button>
        )}
      </form>
    </main>
);
};