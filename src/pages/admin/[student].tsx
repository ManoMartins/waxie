import React from "react";
import Head from "next/head";
import Link from "next/link";
import { query as q } from 'faunadb'
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/client";
import { FiChevronLeft } from "react-icons/fi";


import styles from './student.module.scss';
import { fauna } from "../../services/fauna";
import { GainCard } from "../../components/GainCard";
import { HighlightCard } from "../../components/HighlightCard";
import moment from "moment";
import axios from "axios";

interface Earning {
  ref: string;
  amount: number;
  create_date: string;
  differenceLastRelease: number;
  type: 'more' | 'less';
}

interface Props {
  data: {
    earnings: Earning[];
    amountSLP: number;
    amountBRL: number;
  }
}

export default function Student({ data }: Props) {
  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <main className={styles.container}>
        <header className={styles.headerWrapper}>
          <Link href="/admin">
            <a><FiChevronLeft size={24} /></a>
          </Link>
          <h1>Estudante</h1>
        </header>

        <div className={styles.highlightCards}>
          <HighlightCard amountSLP={data.amountSLP} amountBRL={data.amountBRL} />
          <HighlightCard amountSLP={20} amountBRL={20} />
        </div>

        <div className={styles.gainCards}>
          <div>
            <h1>Listagem</h1>
          </div>
          <ul>
            {data.earnings && data.earnings.map(earning => (
              <GainCard 
                key={earning.ref} 
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
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, params }) => {
  const session = await getSession({ req });

  const { student } = params;

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
        permanent: false,
      }
    }
  }

  try {
    const faunaResponse = await fauna.query(
      q.Map(
        q.Paginate(
          q.Join(
            q.Match(
              q.Index('earnings_by_user'),
              q.Ref(q.Collection("users"), student)
            ),
            q.Index('earnings_sort_by_create_date_desc'),
          )
        ),
        q.Lambda(["create_date", "ref"], q.Get(q.Var("ref"))) 
      )
    ) as any

    const cmc = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
      params: {
        id: 5824,
        convert: 'BRL',
      },
      headers: {
        'X-CMC_PRO_API_KEY': process.env.CMC_PRO_API_KEY,
      },
    });

    const list = JSON.parse(JSON.stringify(faunaResponse.data))
  
    const earnings = list.map(earning => {
      const formattedDate = earning.data.create_date.replace('Z', '')
      return {
        ...earning.data,
        ref: String(earning.ref),
        amount: parseInt(earning.data.amount),
        create_date: moment(formattedDate).locale('pt-br').format("DD MMM YY"),
      }
    })
  
    const amountSLP = earnings[0].amount * (session.isAdmin.data.category / 100);
    const amountBRL = amountSLP * cmc.data.data['5824'].quote.BRL.price;

    return {
      props: {
        data: {
          earnings,
          amountSLP,
          amountBRL:new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(amountBRL),
        }
      }
    }
  } catch (e) {
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