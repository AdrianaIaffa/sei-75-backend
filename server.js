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

app.post('/addnew', async (clientRequest, wardrobeServerResponse) => {
    // const reqUser = clientRequest.params.id
    const itemData = clientRequest.body;
    const findUserid = await User.findOne({ "userEmail": itemData.useremail })


    const wardrobeItem = new WardrobeItem({
        picture: itemData.picture,
        category: itemData.category,
        subcategory: itemData.subcategory,
        userId: findUserid,
        useremail: itemData.useremail
    },
    );

    wardrobeItem.save()
        .then(() => {
            console.log(`Item saved - Picture: ${itemData.picture}, Category: ${itemData.category}, Subcategory: ${itemData.subcategory}, UserId: ${findUserid}`);
            wardrobeServerResponse.sendStatus(200);
        })
        .catch(error => {
            console.error(error.message);
            wardrobeServerResponse.sendStatus(400);
        });
});

//means that we're setting up a special action when someone tries to access a specific web address (URL) on our website. 
//In this case, it's "/allitems" followed by something that looks like an email address.
app.get('/allitems/:email', async (clientRequest, wardrobeServerResponse) => {
    //async (clientRequest, wardrobeServerResponse) => { sets up a function that will be run when someone goes 
    //to the "/allitems" page on our website. We have two helpers here: clientRequest (what the person is asking for) 
    //and wardrobeServerResponse (what we're going to tell them).
    console.log('hello')
    const itemData = clientRequest.params.userEmail;
    console.log('itemdata', itemData)
    //const itemData = clientRequest.params.email; means we're taking something the person put in the web address 
    //(like an email address), and we're saving it in a special box called itemData. So, if they went to "/allitems/john@example.com," 
    //itemData would be "john@example.com."
    const findUseremail = await User.findOne({ "email": itemData })
    console.log('finduser', findUseremail)
    //const findUserid = await User.findOne({"email": itemData}) means we're looking in our computer's memory (database) 
    //to find someone with an email that matches what's in itemData. It's like looking in a phone book to find a person's phone 
    //number when you know their name.
    const userid = findUseremail._id
    console.log('userid', userid)
    //Next, we want to find all the items in our wardrobe that belong to this user. We search our database for 
    //wardrobe items where the userid matches the userid we found earlier. We collect all these wardrobe items 
    //and store them in a variable called allWardrobeItems.
    const allWardrobeItems = await WardrobeItem.find({ userId: userid })
    console.log('allward', allWardrobeItems)
    //const allWardrobeItems = await WardrobeItem.find({ userId: userid }) means we're looking in our computer's memory (database) again, 
    //but this time we're looking for all the clothes (wardrobe items) that belong to the person with the number (userid) we found earlier. 
    //It's like finding all the clothes that belong to one person in a big closet.
    wardrobeServerResponse.json({ wardrobeItems: allWardrobeItems })
    //wardrobeServerResponse.json({ wardrobeItems: allWardrobeItems }) is like saying, 
    //"Okay, we're ready to tell the person what clothes they have. Let's give them the list of clothes (wardrobe items) we found." 
    //So, we send the list of clothes to the person's computer in a special format called JSON, and they can see their clothes on their screen.
})

app.get('/singleitem/:id', async (clientRequest, wardrobeServerResponse) => {
    const itemid = clientRequest.params.id
    const singleWardrobeItem = await WardrobeItem.find({ _id: itemid })
    wardrobeServerResponse.json(singleWardrobeItem)
})

app.put('/singleitem/:id', async (clientRequest, wardrobeServerResponse) => {
    // await WardrobeItem.updateOne({ _id: clientRequest.params.id}, {
    //     picture: clientRequest.body.picture,
    //     category: clientRequest.body.category,
    //     subcategory: clientRequest.body.subcategory,
    //     userId: findUserid._id,
    //     useremail: itemData.useremail
    // })
    // .then(() => {
    //     wardrobeServerResponse.sendStatus(200)
    // })
    // .catch(error => {
    //     wardrobeServerResponse.sendStatus(500)
    // })
    const id = clientRequest.params.id
    const wardrobeToUpdate = await WardrobeItem.findById(id)
    wardrobeToUpdate.set(clientRequest.body)
    await wardrobeToUpdate.save()
    return wardrobeServerResponse.status(202).json(wardrobeToUpdate)
})

const User = mongoose.model('User', userSchema);

app.post('/user/login', async (req, res) => {
    const now = new Date()
    if (await User.count({ 'userEmail': req.body.email }) === 0) {
        const newUser = new User({ userEmail: req.body.email, lastLogin: now })
        newUser.save()
            .then(() => {
                res.sendStatus(200)
            })
    } else {
        User.findOneAndUpdate({ 'userEmail': req.body.email }, { lastLogin: now })
        res.sendStatus(200)
    }
})



const blogPostSchema = new mongoose.Schema({
    title: String,
    content: String,
    picture: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true,
    }
})
const BlogPost = mongoose.model('BlogPost', blogPostSchema);

app.post('/addblogpost', async (clientRequest, blogPostServerResponse) => {
    const itemData = clientRequest.body;

    // blogPostServerResponse.json(clientRequest.body)
    const findUserid = await User.findOne({ "userEmail": itemData.useremail })


    const blogPost = new BlogPost({
        title: itemData.title,
        content: itemData.content,
        picture: itemData.picture,
        userId: findUserid,
        useremail: itemData.useremail
    });
    blogPost.save()
        .then(() => {
            blogPostServerResponse.sendStatus(200)
        })
})


app.get('/blogPage', async (req, response) => {
    const title = await BlogPost.find({})
    response.json(title)
}) 


const outfitSchema = new mongoose.Schema({
    outfitName: {
        type: String,
        required: true
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
   selectedItems: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WardrobeItem', 
        }
    ],
});
const Outfit = mongoose.model('Outfit', outfitSchema);

app.post('/outfitPlanner', async (req, response) => {
    const itemData = req.body;
    const findUserid = await User.findOne({ "userEmail": itemData.useremail })
    console.log(findUserid)

    const newOutfit = new Outfit({
        outfitName: itemData.outfitName,
        selecteditems: itemData.selectedItems,
        userId: findUserid,
    });
    newOutfit.save()
    .then(() => {
        response.sendStatus(200)
    })
})