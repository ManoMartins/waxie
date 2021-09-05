import React from "react";
import axios from "axios";
import Head from "next/head";
import Link from "next/link";
import { query as q } from 'faunadb'
import { FiPower } from "react-icons/fi";
import { GetServerSideProps } from "next";
import { getSession, signOut, useSession } from "next-auth/client";

import styles from './dashboard.module.scss';
import { fauna } from "../../services/fauna";
import { GainCard } from "../../components/GainCard";
import { HighlightCard } from "../../components/HighlightCard";

interface Earning {
  id: string;
  amount: number;
  email: string;
}

interface Props {
  data: {
    earnings: Earning[];
    amountSLP: number;
    amountBRL: number;
  }
}

export default function Dashboard({ data }: Props) {
  const [session] = useSession();

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
                <strong>{ session?.user?.name }</strong>
              </div>
            </div>

            <button onClick={() => signOut()}>
              <FiPower size={24} />
            </button>
          </div>
        </header>
        <div className={styles.highlightCards}>
          <HighlightCard amountSLP={data.amountSLP} amountBRL={data.amountBRL} />
        </div>

        <div className={styles.gainCards}>
          <div>
            <h1>Listagem</h1>
          </div>
          <ul>
            {data.earnings && data.earnings.map(earning => (
              <Link href={`/admin/${earning.id}`} key={earning.id}>
                <a>
                  <GainCard 
                    amount={earning.amount} 
                    label={earning.email}
                  />
                </a>
              </Link>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({req }) => {
  const session = await getSession({ req });

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      }
    }
  }

  if (!session.isAdmin) {
    return { 
      redirect: { 
        destination: '/', 
        permanent: false 
      }
    }
  }

  const list = await fauna.query(
    q.Map(
      q.Paginate(q.Match(q.Index('all_users'))),
      q.Lambda(x => q.Get(x))
    )
  ) as any

  const convertedList = JSON.parse(JSON.stringify(list.data))

  const newList = convertedList.filter(earning => !earning.data.isAdmin)

  const earnings = newList.map(earning => {
    return {
      id: earning.ref['@ref'].id,
      amount: parseInt(earning.data.amount) || 0,
      email: earning.data.email.split('@')[0],
    }
  });

  const cmc = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
    params: {
      id: 5824,
      convert: 'BRL',
    },
    headers: {
      'X-CMC_PRO_API_KEY': process.env.CMC_PRO_API_KEY,
    },
  });

  const amountSLP = earnings.reduce((acc, e) => acc + e.amount, 0);
  const amountBRL = amountSLP * cmc.data.data['5824'].quote.BRL.price;

  const data = {
    earnings,
    amountSLP,
    amountBRL: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amountBRL),
  }

  return {
    props: {
      data,
    }
  }
}

