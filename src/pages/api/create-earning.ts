import { query as q } from 'faunadb';
import { getSession } from 'next-auth/client';
import { NextApiRequest, NextApiResponse } from "next";

import { fauna } from "../../services/fauna";

// eslint-disable-next-line import/no-anonymous-default-export
export default async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method === "POST") {
    const { user: { email } } = await getSession({ req: request });
    const { amount, createDate, differenceLastRelease, type } = request.body;

    try {
      const res = await fauna.query(
        q.Create(
          q.Collection("earnings"), { 
            data: { 
              user: q.Select('ref', q.Get(q.Match(q.Index('users_by_email'), email))),
              type,
              amount,
              differenceLastRelease,
              create_date: createDate,
              created_at: q.ToString(q.Now()),
              updated_at: q.ToString(q.Now()),
            }
          }
        )
      )

      await fauna.query(
        q.Update(
          q.Select(
            'ref', 
            q.Get(
              q.Match(
                q.Index('users_by_email'), 
                email
              )
            )
          ),
          {
            data: {
              amount,
            }
          }    
        )
      )
  
      return response.status(201).json(res);
    } catch (err) {
      console.log(err)
      return response.status(404).send('fd');
    }

  } else {
    response.setHeader('Allow', 'POST');
    response.status(405).end('Method not allowed');
  }
}