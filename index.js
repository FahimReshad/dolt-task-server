const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware:
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rpkd5x3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const productCollection = client.db("timeKeeper").collection("products");

    app.get("/products", async (req, res) => {
      const {
        productName,
        brandName,
        categoryName,
        minPrice,
        maxPrice,
        sortBy,
        page,
        limit,
      } = req.query;

      const filter = {};
      if (productName) {
        filter.productName = { $regex: productName, $options: "i" };
      }
      if (brandName) {
        filter.brandName = { $regex: brandName, $options: "i" };
      }
      if (categoryName) {
        filter.category = { $regex: categoryName, $options: "i" };
      }
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) {
          filter.price.$gte = Number(minPrice);
        }
        if (maxPrice) {
          filter.price.$lte = Number(maxPrice);
        }
      }

      // Set default sorting
      let sort = {};
      if (sortBy === "priceAsc") {
        sort.price = 1; // Ascending order
      } else if (sortBy === "priceDesc") {
        sort.price = -1; // Descending order
      } else if (sortBy === "newest") {
        sort.creationDateTime = -1; // Newest first
      }

      const options = {
        skip: page * limit,
        limit: Number(limit),
        sort: sort,
      };

      const totalCount = await productCollection.countDocuments(filter);
      const products = await productCollection.find(filter, options).toArray();

      res.send({ products, totalCount });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Time Keeper running");
});

app.listen(port, () => {
  console.log(`TimeKeeper running on the port ${port}`);
});
