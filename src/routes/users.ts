import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import crypto, { randomUUID } from 'node:crypto'


export async function usersRoutes(app: FastifyInstance){
    app.post('/', async (request, reply) => {

        const createUserBodySchema = z.object({
            name: z.string()

          })
        const {name} = createUserBodySchema.parse(
            request.body
        )

        let sessionId = request.cookies.sessionId

        if (!sessionId) {
            sessionId = randomUUID()
          }

          const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7

          reply.cookie('sessionId', sessionId, {
            path: '/',
            maxAge: SEVEN_DAYS_IN_SECONDS,
          })



        await knex('users').insert({
            id: crypto.randomUUID(),
            name,
            session_id: sessionId
        })
        return reply.status(201).send()
    })

    app.get('/', async(request, reply) => {
         const users = await knex('users').select()


        return reply.status(200).send({users})
    })
}