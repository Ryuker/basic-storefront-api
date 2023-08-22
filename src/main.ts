import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as fs from 'fs';
import productsDefaultJSON from './data/products-default.json';

// server declaration
const fastify = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
    },
  },
});

console.log("Hello from storefront API");
console.log(productsDefaultJSON);

//plugins
async function userRoutes(fastify: FastifyInstance){
  fastify.get("/", {
    handler: async(request: FastifyRequest<{
      Body: {
        name: string;
        age: number;
      }
    }>, reply: FastifyReply) => {
      
      const productsJSON = fs.readFileSync('./src/data/products.json', 'utf-8');
      const products = JSON.parse(productsJSON);

      return reply.code(201).send(productsJSON);
    }
  });


}

// register the plugins
fastify.register(userRoutes, { prefix: "/" })


// server function to run the server
async function main() {
  await fastify.listen({
    port: 8080,
    host: "0.0.0.0"
  });
}


// Gracefull shutdown and restart
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    await fastify.close();
    process.exit(0);
  })
});

// Start server
main();