import dayjs from "dayjs"
import { FastifyInstance } from "fastify"
import {z} from 'zod' // Validação de dados vindos do Body e suas tipagens (Exemplos abaixo na prática)
import { prisma } from "./lib/prisma"



export async function appRoutes(app: FastifyInstance) {
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
}


