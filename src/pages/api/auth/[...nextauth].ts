import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'
import { query as q } from 'faunadb';

import { fauna } from '../../../services/fauna';

export default NextAuth({
  providers: [
    Providers.Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&access_type=offline&response_type=code',
      scope: 'profile email',
    })
  ],
  callbacks: {
    async session(session) {
      try {
        const userIsAdmin = await fauna.query(
          q.Get(
            q.Intersection(
              q.Match(
                q.Index('users_by_email'),
                session.user.email
              ),
              q.Match(
                q.Index('users_by_is_admin'),
                true
              )
            )
          )
        )
        
        return {
          ...session,
          isAdmin: userIsAdmin,
        }
      } catch {
        return {
          ...session,
          isAdmin: false,
        } 
      }
    },
    async signIn(user, account, profile) {
      const { email } = user;

      try {
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                q.Match(
                  q.Index('users_by_email'),
                  q.Casefold(email)
                )
              )
            ),
            q.Create(
              q.Collection('users'),
              { data: { email }}
            ),
            q.Get(
              q.Match(
                q.Index('users_by_email'),
                q.Casefold(email)
              )
            )
          )
        );

        return true
      } catch (err) {
        console.log(err)
        return false
      }
    },
    async redirect(url, baseUrl) {
      return baseUrl
    },
  }
})