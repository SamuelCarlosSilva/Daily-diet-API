import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import crypto, { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'


export async function mealsRoutes(app: FastifyInstance){
   app.post('/',{preHandler: [checkSessionIdExists]}, async (request, reply) =>{
    const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        onDiet: z.boolean(),
        date: z.coerce.date(),
    })



    const {name, description, onDiet, date} = createMealBodySchema.parse(
        request.body,
    )

    await knex('meals').insert({
        id: crypto.randomUUID(),
        name,
        description,
        on_diet: onDiet,
        date: date.getTime(),
        user_id: request.user?.id,
    })

    return reply.status(201).send()

   })

   app.get('/', {preHandler: [checkSessionIdExists]}, async (request, reply) =>{
    const meals = await knex('meals').where({user_id: request.user?.id}) .orderBy('date', 'desc').select()

    return reply.send({meals})
    
   } )

   app.get('/:mealId', {preHandler: [checkSessionIdExists]}, async(request, reply) => {

    const paramsSchema = z.object({ mealId: z.string().uuid() })

    const { mealId } = paramsSchema.parse(request.params)

    const meal = await knex('meals').where({id: mealId }).first()

    if(!meal){
        return reply.status(404).send({
            error: "Meal not found"
        })
    }


    return reply.status(200).send({meal})
   })

   app.put('/:mealId', {preHandler: [checkSessionIdExists]}, async(request, reply) => {

    const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        onDiet: z.boolean(),
        date: z.coerce.date(),
    })

    const {name, description, onDiet, date} = createMealBodySchema.parse(request.body)

    const paramsSchema = z.object({
        mealId: z.string().uuid()
    })

    const {mealId} = paramsSchema.parse(request.params)

    const meal = await knex('meals').where({id: mealId}).first()
    


    if(!meal){
        return reply.status(404).send({
            error: "Meal not found"
        })
    }



    await knex('meals').where({ id: mealId }).update({
        name,
        description,
        on_diet: onDiet,
        date: date.getTime()
    })

    return reply.status(204).send({meal})

   })

   app.delete('/:mealId',{preHandler: [checkSessionIdExists]}, async(request, reply) => {

    const paramsSchema = z.object({
        mealId: z.string().uuid()
    })

    const {mealId} = paramsSchema.parse(request.params)

    const meal = await knex('meals').where({id: mealId}).first()

    if(!meal){
        return reply.status(404).send({
            error: "Meal not found"
        })
    }
    await knex('meals').where({id: mealId}).delete()

    return reply.status(204).send()

   })

   app.get('/metrics', {preHandler: [checkSessionIdExists]}, async (request, reply) =>{

    const totalMealsOnDiet = await knex('meals')
        .where({ user_id: request.user?.id, on_diet: true })
        .count('id', { as: 'total' })
        .first()

    const totalMealsOffDiet = await knex('meals')
        .where({ user_id: request.user?.id, on_diet: false })
        .count('id', { as: 'total' })
        .first()

    const totalOfMeals = await knex('meals')
        .where({user_id: request.user?.id})
    
        
    const { bestOnDietSequence } = totalOfMeals.reduce(
            (acc, meal) => {
              if (meal.on_diet) {
                acc.currentSequence += 1
              } else {
                acc.currentSequence = 0
              }
    
              if (acc.currentSequence > acc.bestOnDietSequence) {
                acc.bestOnDietSequence = acc.currentSequence
              }
    
              return acc
            },
            { bestOnDietSequence: 0, currentSequence: 0 },
          )

          return reply.send({
            totalMeals: totalOfMeals.length,
            totalMealsOnDiet: totalMealsOnDiet?.total,
            totalMealsOffDiet: totalMealsOffDiet?.total,
            bestOnDietSequence,
          })
  
    
   } )




}