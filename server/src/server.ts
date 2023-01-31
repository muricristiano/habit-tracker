import Fastify from 'fastify'
import cors from '@fastify/cors'
import { appRoutes } from './routes'

const app = Fastify()
//Após criação da aplicação, registrar o cors para o front-end conseguir acesar os dados do backend, e aqui mesmo especificar quais endereços de front-end conseguem acessar o backend
app.register(cors) //Qualquer aplicação consegue, aqui. Pois só está aberto sem especificar.
app.register(appRoutes)


app.get('/', () => {
    return 'Hello world!'
})


app.listen({
    port: 3333
}).then(() => {
    console.log('HTTP server listening on port 3333');
})