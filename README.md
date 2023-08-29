# Basic Storefront API using Fastify
Basic api for a storefront using Fastify. 
Works with: [Basic Storefront Frontend - Typescript](https://github.com/Ryuker/react-practise-storefront-ts)

uses node v16.14.2
- Accepts GET, POST and DELETE requests
- Requests return and update an Object Array in a products.json file
- By passing a product at "{api location}/products/$id" at the end of the url in the frontend request a single product is returned or deleted.
- Only unique product names get added as new product.


This was written for practise purposes and is not suitable for deployment to production yet.
---

## To install:
~~~
nvm use 16
npm run install
~~~ 


## To run server: 
~~~
npm run dev
~~~
## To close server:
~~~
ctrl + c
~~~

