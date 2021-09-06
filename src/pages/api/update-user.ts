import { query as q } from 'faunadb';
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from 'next-auth/client';

import { fauna } from "../../services/fauna";

// eslint-disable-next-line import/no-anonymous-default-export
export default async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method === "PUT") {
    const { user: { email } } = await getSession({ req: request });
    const { isAdmin, startedDate, category } = request.body;

    const res = await fauna.query(
      q.Update(
        q.Select('ref', q.Get(q.Match('users_by_email', email))), {
          data: {
            isAdmin,
            started_date: startedDate,
            category,
          },
        }
      )
    )

    return response.status(201).json(res);
  } else {
    response.setHeader('Allow', 'PUT');
    response.status(405).end('Method not allowed');
  }
}