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

  fastify.get("/products", {
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

  fastify.addSchema({
    $id: "createProductSchema",
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: 'string'
      }
    }
  });

  fastify.post("/products", {
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

      const products = await fastify.addProduct(body);
      const newProducts = products;
      console.log("products:");
      console.log(products);

      return await reply.code(201).send(products);
    }
  });



  // delete all products
  fastify.delete("/products", {
    handler: async(request, reply: FastifyReply) => {

      const resetProducts = await fastify.resetProducts();
      return await reply.code(201).send(resetProducts);

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
    addProduct: (body: {}) => string;
    resetProducts: () => string;
  }
}

// decorators
fastify.decorate('getProducts', () => {
  const productsJSON = fs.readFileSync('./src/data/products.json', 'utf-8');
  const products = JSON.parse(productsJSON);
  return products;
});

fastify.decorate('addProduct', (body: {}): string => {
  // console.log(body);
  const productsJSON = fs.readFileSync('./src/data/products.json', 'utf-8');
  const products = JSON.parse(productsJSON);

  const newProducts = [...products, {id: 4, ...body}];
  const newProductsJSON = JSON.stringify(newProducts, null, 2);
  fs.writeFileSync('./src/data/products.json', newProductsJSON);
  return newProductsJSON;
});

fastify.decorate('resetProducts', (): string => {
  const defaultProductsJSON = fs.readFileSync('./src/data/products-default.json', 'utf-8');
  const products = JSON.parse(defaultProductsJSON);

  const newProductsJSON = JSON.stringify(products, null, 2);
  fs.writeFileSync('./src/data/products.json', newProductsJSON);

  return newProductsJSON;
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