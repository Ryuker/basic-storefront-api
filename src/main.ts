import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as fs from 'fs';
import productsDefaultJSON from './data/products-default.json';
import { escape } from 'querystring';
import fastifyCors from '@fastify/cors';

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

  // hooks
  // hook to allow requests from other localhost port - security risk
  // https://stackoverflow.com/a/74131067
  // fastify.addHook('preHandler', (req, res, done) => {
  //   // example logic for conditionally adding headers
  //   const allowedPaths = ["/products"];
  //   if (allowedPaths.includes(req.routerPath)) {
  //     res.header("Access-Control-Allow-Origin", "*");
  //     res.header("Access-Control-Allow-Methods", "POST");
  //     res.header("Access-Control-Allow-Headers",  "*");
  //   }

  //   const isPreflight = /options/i.test(req.method);
  //   if (isPreflight) {
  //     console.log(req.method);
  //     return res.send();
  //   }
        
  //   done();
  // })

  fastify.get("/products", {
    handler: async(request: FastifyRequest<{
      Body: {
        name: string;
        age: number;
      }
    }>, reply: FastifyReply) => {
      
      // gives access from localhost - security risk!
      // reply.header("Access-Control-Allow-Origin", "*");

      const products = fastify.getProducts();

      return await reply.code(201).send(products);
    }
  });

  fastify.get("/products/:id", {
    handler: async(request: FastifyRequest<{
      Params: {
        id: string;
      }
    }>, reply: FastifyReply) => {

      const id  = Number(request.params.id);
      const product = fastify.getSingleProduct(id);

      if (product)
        return await reply.code(201).send(product); 
      else 
        return await reply.code(220).send({error: "id not found", id, product} );
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

  fastify.post("products", {
    schema: {
      body: { $ref: 'createProductSchema#'},
      response: {
        201: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
          }
        }
      }
    },
    handler: async(request: FastifyRequest<{
      Body: {
        name: string;
        description: string;
        price: number;
      }
    }>, reply: FastifyReply) => {
      console.log(request);
      console.log("method: " + request.method);
      console.log("receiving product");
      const body: IProduct = request.body;

      console.log(body);

      const products = await fastify.addProduct(body);
      console.log("products:");
      console.log(products);

      if (products)
        return await reply.code(201).send(products);
      else 
        return await reply.code(201).send({
          error: "product already exists", 
          name: body.name 
        });
    }
  });

  // delete single product
  fastify.delete("/products/:id", {
    handler: async(request: FastifyRequest<{
      Params: {
        id: string;
      }
    }>, reply: FastifyReply) => {
      const id  = Number(request.params.id);

      const products = fastify.deleteProduct(id);

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
    getSingleProduct: (id: number) => {} | undefined;
    addProduct: (body: IProduct) => string | undefined;
    deleteProduct: (id: number) => string | undefined;
    resetProducts: () => string;
  }
}

// decorators
fastify.decorate('getProducts', () => {
  const productsJSON = fs.readFileSync('./src/data/products.json', 'utf-8');
  const products = JSON.parse(productsJSON);
  return products;
});


interface IProduct {
  name: string;
  description: string;
  price: number;
}

interface IProductObj extends IProduct{
  id: number;
}

fastify.decorate('getSingleProduct', (id: number) => {
  const productsJSON = fs.readFileSync('./src/data/products.json', 'utf-8');
  const products: IProductObj[] = JSON.parse(productsJSON);

  const product = products.find((product) => product.id === id);

  return product ?? undefined;
});

fastify.decorate('addProduct', (body: IProduct): string | undefined => {
  // console.log(body);
  const productsJSON = fs.readFileSync('./src/data/products.json', 'utf-8');
  const products: IProductObj[] = JSON.parse(productsJSON);
  console.log(products);
  
  const existingProduct = products.find((product: IProductObj) => product.name === body.name);

  let newProducts = {};

  if (!existingProduct)
  {
    const newProductsArray = [...products, {id: products.length += 1, ...body}];
    newProducts = newProductsArray.sort(function(a,b){
      return a.id - b.id;
    })

    const newProductsJSON = JSON.stringify(newProducts, null, 2);
    fs.writeFileSync('./src/data/products.json', newProductsJSON);
    
    return newProductsJSON;
  }
   
  return undefined;
});

fastify.decorate('deleteProduct', (id: number) : string | undefined => {
  const productsJSON = fs.readFileSync('./src/data/products.json', 'utf-8');
  const products: IProductObj[] = JSON.parse(productsJSON);

  const existingProduct = products.find((product: IProductObj) => product.id === id);

  let newProducts = {};

  if (existingProduct){
    console.log(existingProduct.id);
    let newProductsArray = products.filter( product => 
      product.id !== existingProduct.id)
    
    newProducts = newProductsArray.sort(function(a,b){
      return a.id - b.id;
    })
    
    console.log(newProducts);
    const newProductsJSON = JSON.stringify(newProducts, null, 2);
    fs.writeFileSync('./src/data/products.json', newProductsJSON);
    return newProductsJSON;
  }
  else 
    return undefined;
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
fastify.register(fastifyCors, {
  origin: "http://127.0.0.1:5173",
});


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