import express from 'express'
import bodyParser from 'body-parser'
import{MongoClient} from 'mongodb'
import path from 'path'

const app = express();

app.use(express.static(path.join(__dirname,"/build")))
app.use(bodyParser.json())

const withDB = async (operations, res) => {
    try{
        const client = await MongoClient.connect('mongodb://127.0.0.1:27017',{useNewUrlParser: true})
        const db = client.db('my-blog')

        await operations(db);
        
        client.close()
    } catch (error){
        res.status(500).json({message:"Error connecting to db", error })
    }
}

app.get('/api/articles/:name', async (req, res)=>{
    withDB( async (db)=>{
        const articlesName = req.params.name;
        const articlesInfo = await db.collection('articles').findOne({ name: articlesName})
        res.status(200).json(articlesInfo)
    }, res) 
})
app.post('/api/articles/:name/upvote', async (req, res)=>{
    withDB( async (db)=>{

      const articlesName = req.params.name;

      const articlesInfo = await db
        .collection("articles")
        .findOne({ name: articlesName });

      await db.collection("articles").updateOne(
        { name: articlesName },
        { $set: { upvotes: articlesInfo.upvotes + 1 } }
      );
      const updatedArtileInfo = await db
        .collection("articles")
        .findOne({ name: articlesName });

      res.status(200).json(updatedArtileInfo);
      }, res)
})
app.post('/api/articles/:name/add-comment',(req, res)=>{
    const{username, text} = req.body;
    const articlesName = req.params.name;

    withDB( async (db)=>{
        const articlesInfo = await db.collection('articles').findOne({ name: articlesName})
        await db.collection("articles").updateOne(
            { name: articlesName },
            { $set: { comments: articlesInfo.comments.concat({username, text})} }
          );

        const updatedArtileInfo = await db
          .collection("articles")
          .findOne({ name: articlesName });
  
        res.status(200).json(updatedArtileInfo);

    })

})

app.get('*', (req, res) =>{
  res.sendFile(path.join(__dirname+'/build/index.html'))
})

app.listen(8080, ()=>console.log("Listening on 8080"))