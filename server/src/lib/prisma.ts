import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({ // Criando prisma client, porém passando o parâmetro para mostrar todas as requisições feitas no server no console
    log: ['query']
})