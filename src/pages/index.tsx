import axios from 'axios';
import moment from 'moment';
import Head from 'next/head';
import Link from 'next/link';
import { query as q } from 'faunadb';
import { FiPower } from 'react-icons/fi';
import { GetServerSideProps } from 'next';
import { getSession, signOut, useSession } from 'next-auth/client';

import { fauna } from '../services/fauna';
import { GainCard } from '../components/GainCard'
import { HighlightCard } from '../components/HighlightCard'

import styles from './home.module.scss';

interface Earning {
  amount: number;
  create_date: string;
  differenceLastRelease: number;
  type: 'more' | 'less';
}

interface Props {
  data: {
    earnings: Earning[];
    amountSLP: number;
    amountUserBRL: number;
    amountUserSLP: number;
  }
}

export default function Home({ data }: Props) {
  const [session] = useSession();

  if (session === undefined) {
    return (
      <span>
        Carregando...
      </span>
    )
  }

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <main className={styles.container}>
        <header className={styles.header}>
          <div className={styles.userWrapper}>
            <div>
              <Link passHref href="/settings">
                <img 
                  src={session?.user?.image} 
                  alt="Avatar" 
                />
              </Link>
              <div>
                <span>Olá, </span>
                <strong>{session?.user?.name}</strong>
              </div>
            </div>

            <button onClick={() => signOut()}>
              <FiPower size={24} />
            </button>
          </div>
        </header>
        <div className={styles.highlightCards}>
          <HighlightCard amountSLP={data.amountUserSLP} amountBRL={data.amountUserBRL} />
        </div>

        <div className={styles.gainCards}>
          <div>
            <h1>Listagem</h1>
            <Link 
              href={{ 
                pathname: "/register", 
                query: { 
                  amountSLP: data.amountSLP, 
                  differenceLastRelease: data.earnings[0]?.differenceLastRelease || 0 
                } 
              }}
            >
              <a>Novo</a>
            </Link>
          </div>
          <ul>
            {data.earnings && data.earnings.map(earning => (
              <GainCard 
                key={earning.amount} 
                amount={earning.amount} 
                label={earning.create_date} 
                gains={earning.differenceLastRelease}
                type={earning.type}
              />
            ))}
          </ul>
        </div>
      </main>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });
  
  if (!session) {
    return { 
      redirect: {
        destination: '/login',
        permanent: false,
      }
    }
  } 

  if (!!session.isAdmin) {
    return {
      redirect: {
        destination: '/admin',
        permanent: false,
      }
    }
  }

  try {
    const list = await fauna.query(
      q.Map(
        q.Paginate(
          q.Join(
            q.Match(
              q.Index('earnings_by_user'),
              q.Select('ref', q.Get(q.Match(q.Index('users_by_email'), session.user.email)))
            ),
            q.Index('earnings_sort_by_create_date_desc'),
          )
        ),
        q.Lambda(["create_date", "ref"], q.Get(q.Var("ref"))) 
      )
    ) as any

    const userInfo = await fauna.query(
      q.Get(
        q.Match(
          q.Index('users_by_email'),
          session.user.email
        )
      )
    )
  
    const cmc = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
      params: {
        id: 5824,
        convert: 'BRL',
      },
      headers: {
        'X-CMC_PRO_API_KEY': process.env.CMC_PRO_API_KEY,
      },
    });
  
    const earnings = JSON.parse(JSON.stringify(list.data)).map(e => {
      const formattedDate = e.data.create_date.replace('Z', '')
      return ({
        ...e.data,
        create_date: moment(formattedDate).locale('pt-br').format("DD MMM YY"),
      })
    });

    const amountSLP = earnings[0].amount;
    const amountUserSLP = earnings[0].amount * ((userInfo as any).data.category / 100);
    const amountUserBRL = amountUserSLP * cmc.data.data['5824'].quote.BRL.price;
  
    const data = {
      earnings,
      amountSLP,
      amountUserSLP,
      amountUserBRL: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amountUserBRL),
    }
  
    return {
      props: {
        data,
      }
    }
  } catch {
    return {
      props: {
        data: {
          earnings: [],
          amountSLP: 0,
          amountBRL: 0,
        }
      }
    }
  }
}
