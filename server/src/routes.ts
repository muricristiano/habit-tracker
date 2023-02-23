import dayjs from "dayjs"
import { FastifyInstance } from "fastify"
import {z} from 'zod' // Validação de dados vindos do Body e suas tipagens (Exemplos abaixo na prática)
import { prisma } from "./lib/prisma"



export async function appRoutes(app: FastifyInstance) {
    // Post - Create Habit
    app.post('/habits', async (request) => {
        const creationHabitBody = z.object({
            title: z.string(),
            weekDays: z.array(z.number().min(0).max(6)) // Definindo week Days como sendo um array que possuem números de 0 a 6, representando os dias da semana (Domingo = 0 até Sábado = 6)
        })
        const { title, weekDays } = creationHabitBody.parse(request.body)

        const todayDayJS = dayjs().startOf('day').toDate() // Faz com que o campo do dia da criação, seja preenchido automaticamente com o dia, porém com o horário 00:00:00 para que não haja complicações com horários e datas disponíveis, assim o hábito fica disponível a partir do dia que foi criado.

        await prisma.habit.create({
            data: {
                title,
                created_at: todayDayJS,
                weekDays: {
                    create: weekDays.map(weekDay => {
                        return {
                            week_day: weekDay
                        } 
                    })
                }
            }
        })
    })

    // Get day
    app.get('/day', async (request) => { // 'day' = dia da semana / 'date' = data com dia e mês
        const getDayParams = z.object({
            date: z.coerce.date() //Converte a string recebida do parâmetro date em data no banco de dados
        })

        const { date } = getDayParams.parse(request.query)

        const parsedDate = dayjs(date).startOf('day')
        const weekDay = parsedDate.get('day') // 'day' = dia da semana / 'date' = data com dia e mês

        // Funções
        // 1- Todos os hábitos possíveis para aquele dia segundo o banco de dados e datas de criação
        // 2- Hábitos que já foram concluídos no dia
        
        // 1.
        const possibleHabits = await prisma.habit.findMany({
            where: {
                created_at: {
                    lte: date,
                },
                weekDays: {
                    some: {
                        week_day: weekDay,
                    }
                }
            }
        })

        // 2.
        const day = await prisma.day.findUnique({
            where: {
                date: parsedDate.toDate()
            },
            include: { 
                dayHabits: true,
            }
        })

        const completedHabits = day?.dayHabits.map(dayHabit => {
            return dayHabit.habit_id
        })

        return {
            possibleHabits,
            completedHabits
        }
    })

    // Patch Habit Toggle
    app.patch('/habits/:id/toggle', async (request) => {
        // route param (parameter of identification)
        const toggleHabitParams = z.object({
            id: z.string().uuid()
        })

        const { id } = toggleHabitParams.parse(request.params)

        const today = dayjs().startOf('day').toDate()

        let day = await prisma.day.findUnique({
            where: {
                date: today
            }
        })

        if (!day) {
            day = await prisma.day.create({
                data: {
                    date: today
                }
            })
        }

        const dayHabit = await prisma.dayHabit.findUnique({
            where: {
                day_id_habit_id: {
                    day_id: day.id,
                    habit_id: id,
                }
            }
        })

        if (dayHabit) {
            // If Completed the habit > toggle to cancel
            await prisma.dayHabit.delete({
                where: {
                    id: dayHabit.id
                }
            })
        } else {
            // If not completed > complete the habit on the day
        await prisma.dayHabit.create({
            data: {
                day_id: day.id,
                habit_id: id
            }
        })
        }
    })

    // Get Summary Table (Completion of  Habits Representation with Squares by % Percentage of Possible Habits and Completed Habits at each day) - High complexity and rules.
    app.get('/summary', async () => {
        
        const summary = await prisma.$queryRaw` /* $queryRaw - It is a function of prisma so we can make a Raw Query to the DB */
            SELECT 
                D.id, 
                D.date,
                (
                    /* Subquery - Selecting all the available habits to completed of this specific date. */
                    SELECT
                        cast(count(*) as float)
                    FROM habit_week_days HWD
                    JOIN habits H /* Validation of a habit was created before the date */
                        ON H.id = HWD.habit_id 
                    WHERE
                        HWD.week_day = cast(strftime('%w', D.date/1000.0, 'unixepoch') as int)
                        AND H.created_at <= D.date /* Validation of habit date creation */
                ) as amount, /* Defining the name of this query return as: amount */
                (   
                    /* Subquery - Selecting the completed habits of the specific date.Selecionando a contagem de vezes em que o day_id da tabela day_habits é igual ao id. */
                    SELECT 
                        cast(count(*) as float)
                    FROM day_habits DH
                    WHERE DH.day_id = D.id
                ) as completed /*Defining the name of this query return as: completed */
            FROM days D
        `

        return summary
    })
}


