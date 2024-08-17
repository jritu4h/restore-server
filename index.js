const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port =process.env.PORT || 3000

app.use(express.json())
app.use(cors())




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.Db}:${process.env.password}@cluster0.hwuf8vx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const database = client.db("EstoreDB");
    const productCollection = database.collection("product");

  


    app.post('/products',async(req,res)=>{
        try {
            // Destructure the required fields from the request body
            const { name, price, category, description, image, ratings } = req.body;
    
            // Validation: Ensure all required fields are provided
            if (!name || !price || !category) {
                return res.status(400).json({ message: 'Name, price, and category are required.' });
            }
    
            // Create a new product instance
            const newProduct = {
                name,
                price,
                category,
                description,  // Assuming description is optional
                image,        // Assuming image is optional
                ratings,      // Assuming ratings is optional
                createdAt: new Date(), // Set the current date as createdAt
            };
    
            await productCollection.insertOne(newProduct)
            
    
            // Respond with the newly created product
            res.status(200).json(newProduct);
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ message: 'Server error. Unable to create product.' });
        }
    })


    app.get('/products', async (req, res) => {
      try {
        const { page = 1, search = '', category = '', minPrice = 0, maxPrice = Infinity, sortBy = '' } = req.query;
    
        const pageSize = 10;
        const skip = (page - 1) * pageSize;
    
        // Build the query
        const query = {
          name: { $regex: search, $options: 'i' },
          price: { $gte: Number(minPrice), $lte: Number(maxPrice) },
        };
    
        if (category) {
          query.category = category;
        }
    
        // Determine sorting options
        let sort = {};
        if (sortBy.includes('low-to-hight')) {
          sort = { price: 1 };
        } else if (sortBy.includes('hight-to-low')) {
          sort = { price: -1 };
        } else if (sortBy.includes('dateDesc')) {
          sort = { createdAt: -1 };
        }
    
        // Fetch total product count and paginated results
        const totalProducts = await productCollection.countDocuments(query); // Remove curly braces around query
        const products = await productCollection.find(query) // Remove curly braces around query
          .sort(sort)
          .skip(skip)
          .limit(pageSize)
          .toArray(); // Convert cursor to array
    
        res.json({ products, totalPages: Math.ceil(totalProducts / pageSize) });
    
      } catch (error) {
        console.log(`Server error: ${error}`);
        res.status(500).json(`Server error: ${error.message}`); // Send only the error message
      }
    });
    

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
  res.send('Server Running!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})