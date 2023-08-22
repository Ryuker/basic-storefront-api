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

// console.log("Hello from storefront API");
// console.log(productsDefaultJSON);

//plugins
async function userRoutes(fastify: FastifyInstance){

  fastify.get("/", {
    handler: async(request: FastifyRequest<{
      Body: {
        name: string;
        age: number;
      }
    }>, reply: FastifyReply) => {

      const products = fastify.getProducts();

      return reply.code(201).send(products);
    }
  });

  fastify.post("/", {
    schema: {
      body: { $ref: 'createProductSchema#'},
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
          }
        }
      }
    },
    handler: async(request: FastifyRequest<{
      Body: {
        id: number;
        name: string;
        description: string;
        price: number;
      }
    }>, reply: FastifyReply) => {
  
      const body = request.body;

      console.log(body);

      const products = fastify.addProduct(body);

      return reply.code(201).send(products);
    }
  });


  fastify.log.info("User routes registered");
}

// module with interfaces
declare module "fastify" {
  export interface FastifyRequest {
    product: {
      name: string;
    }
  }

  export interface FastifyInstance {
    getProducts: () => {};
    addProduct: (body: {}) => {};
  }
}

fastify.decorate('getProducts', () => {
  const productsJSON = fs.readFileSync('./src/data/products.json', 'utf-8');
  const products = JSON.parse(productsJSON);
  return products;
});

fastify.decorate('addProduct', (body: {}) => {
  const productsJSON = fs.readFileSync('./src/data/products.json', 'utf-8');
  const products = JSON.parse(productsJSON);

  const newProducts = [...products, {id: 4, ...body}];
  const newProductsJSON = JSON.stringify(newProducts, null, 2);

  fs.writeFileSync('./src/data/products.json', newProductsJSON);

  return newProducts;
});


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