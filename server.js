import 'dotenv/config';
import express, { response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from 'mongoose';

const app = express()

app.use(cors())
app.use(bodyParser.json())
const port = process.env.PORT || 4000

app.listen(port, () => {
    console.log(`listening on port: ${port}`);
})

mongoose.connect(process.env.DATABASE_URL, {
    dbName: 'clotheslibrary'
});
const userSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    lastLogin: {
        type: Date,
        required: true
    }
})
const wardrobeItemSchema = new mongoose.Schema({
    picture: String, 
    category: {
      type: String,
      enumItems: ['tops', 'bottoms', 'outwears', 'accessories', 'shoes'], // Allowed top-level categories
      required: true
    },
    subcategory: {
      type: String,
      require: true,
      enum: ['long sleeve', 'short sleeve', 'sleeveless', 'skirts', 'shorts', 'trousers', 'coats', 'jackets', 'bags', 'scarfs', 'headwear', 'boots', 'shoes', 'sandals'],
      required: true,
    },
    userId: {
        // This specifies the data type of the field as an ObjectId. 
        //ObjectId is typically used for referencing other documents in the database.
        type: mongoose.Schema.Types.ObjectId,
        // This indicates that the "userId" field is expected to refer to documents in the "User" 
        //collection (or model) in your database.
        ref: 'User',
        // This means that the "userId" field is required, 
        //and every document in this schema must have a value for this field.
        required: true,
      },
  });

  const WardrobeItem = mongoose.model('WardrobeItem', wardrobeItemSchema);

  app.post('/addnew',   async (clientRequest, wardrobeServerResponse) => {
    // const reqUser = clientRequest.params.id
    const itemData = clientRequest.body;
    const findUserid = await User.findOne({"email": itemData.useremail})
    console.log(findUserid)
      
      const wardrobeItem = new WardrobeItem({
          picture: itemData.picture,
          category: itemData.category,
          subcategory: itemData.subcategory,
          userId: findUserid._id,
          useremail: itemData.useremail
        },
      );
  
      wardrobeItem.save()
          .then(() => {
              console.log(`Item saved - Picture: ${itemData.picture}, Category: ${itemData.category}, Subcategory: ${itemData.subcategory}, UserId: ${findUserid}`);
              wardrobeServerResponse.sendStatus(200);
          })
          .catch(error => {
            //   console.error(error.message);
              wardrobeServerResponse.status(500).json(error);
          });
  });

  app.get('/allitems', async (clientRequest, wardrobeServerResponse) => {
    const itemData = clientRequest.body;
    // const userEmail = clientRequest.query.email;
    //We start by looking for a user in our database. We are searching for a user 
    //whose email matches the one provided in itemData.email. This line finds that user 
    //and stores their information in a variable called findUserid.
    const findUserid = await User.findOne({"email": itemData.email})
    //We take the special ID of the user we found (the _id) and store it in a variable called userid. 
    //This ID is like a unique code that identifies this user in our database.
    const userid = findUserid.id
    //Next, we want to find all the items in our wardrobe that belong to this user. We search our database for 
    //wardrobe items where the userid matches the userid we found earlier. We collect all these wardrobe items 
    //and store them in a variable called allWardrobeItems.
    const allWardrobeItems = await WardrobeItem.find({ userId: userid})
    //Finally, we are ready to respond to the request. We send back the list of wardrobe items that we found belonging to the user.
    //We package these items in a special format called JSON and send it as a response. 
    //We use the name wardrobeItems to label this list so that whoever receives it knows what it is.
    wardrobeServerResponse.json({ wardrobeItems: allWardrobeItems })
})
const User = mongoose.model('User', userSchema);app.post('/user/login', async(req, res) => {
    const now = new Date()
    if(await User.count({'userEmail': req.body.email}) === 0 ) {
        const newUser = new User({ userEmail: req.body.email, lastLogin: now})
        newUser.save()
        .then(() => {
            res.sendStatus(200)
        })
    } else {
        User.findOneAndUpdate({'userEmail': req.body.email}, {lastLogin: now})
        res.sendStatus(200)
    }
})



const blogPostSchema = new mongoose.Schema ({
    title: String,
    content: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    }
})
const BlogPost = mongoose.model('BlogPost', blogPostSchema);

app.post('/addblogpost', async (clientRequest, blogPostServerResponse) => {
    const title = clientRequest.body.title;
    const content = clientRequest.body.content;
    const author = clientRequest.body.author;
    const blogPost = new BlogPost({
        title,
        content,
        author: author._id
    });
    await blogPost.save();
})
