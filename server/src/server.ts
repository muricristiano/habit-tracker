import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'

const app = Fastify()
const prisma = new PrismaClient()

//Após criação da aplicação, registrar o cors para o front-end conseguir acesar os dados do backend, e aqui mesmo especificar quais endereços de front-end conseguem acessar o backend
app.register(cors) //Qualquer aplicação consegue, aqui. Pois só está aberto sem especificar.

app.get('/', () => {
    return 'Hello world!'
})

app.get('/hello', async () => {
    const habits = await prisma.habit.findMany()

    return habits
})

app.listen({
    port: 3333
}).then(() => {
    console.log('HTTP server listening on port 3333');
})