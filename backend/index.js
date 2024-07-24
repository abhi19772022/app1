let express = require('express');
let app = express();
let cors = require('cors');
let mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const OpenAI = require('openai');

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/mypro')
.then(()=>console.log('connected to db'))
.catch((err)=>console.log(err))


let userSchema = new mongoose.Schema({
    username:String,
    password:String,
    role:String,
    batch:String
})
 // schema h yee notice kaa
 const noticeSchema = new mongoose.Schema({
   
    description: {
      type: String,
     
    },
    title: {
      type: String,
      
    },
  
    
  });
  
  // model h yee notice kaa
  const Notice = mongoose.model('Notice', noticeSchema);



  // all niotice kaa schema
  const StudentSchema = new mongoose.Schema({
    
      description: {
        type: String, 
      },
      title: {
        type: String,
        
        },
      to:{
        type:String,
      }
       
   
      
  });
  
  // Create a model using the schema
  const Student = mongoose.model('Student', StudentSchema);


  app.get('/notice', async (req, res) => {
    try {
      const notices = await Notice.find();
      res.json(notices);
    } catch (error) {
      console.error('Error during fetching notices:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });



 
let User = new mongoose.model('User',userSchema);

app.get('/count', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        res.json({ count: userCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});






 app.use(bodyParser.json());
 app.post('/signup', async (req, res) => {
    const { username, password ,role,batch } = req.body;

    try {
       
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);

      
        const newUser = new User({ username, password: hashedPassword,role,batch});

       
        await newUser.save();

        res.json({ message: 'User saved successfully' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'Incorrect username or password' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Incorrect username or password' });
        }

        // Assuming user.role is either "student" or "admin"
        const role = user.role;

        // Redirect based on user role
        if (role === "student") {
            res.json({ success: true, role: "student" });
        } else if (role === "admin") {
            res.json({ success: true, role: "admin" });
        } else {
            res.status(401).json({ error: 'User role not defined' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.put("/updateData/:id", async (req, res) => {
    try {
      const { description, title ,to} = req.body; // Extract description and title from request body
  
      const updatedNotice = await Notice.findOneAndUpdate(
        { _id: req.params.id },
        { description, title ,to}, // Update description and title
        { new: true }
      );
  
      if (!updatedNotice) {
        return res.status(404).send("Notice not found");
      }
  
      console.log("Notice updated successfully:", updatedNotice);
      res.send(updatedNotice);
    } catch (error) {
      console.error("Error updating notice:", error);
      res.status(500).send(error.message);
    }
  });

app.post('/allnotice', async (req, res) => {
    try {
        const { description ,title,to } = req.body;
        const newNotice = new Student({ description: description , title: title,to:to});
        const savedNotice = await newNotice.save();
        console.log("Notice saved successfully:", savedNotice);
        res.json(savedNotice); // Send the saved notice in the response
    } catch (error) {
        console.error("Error saving notice to students collection:", error);
        res.status(500).send(error.message); // Send the error response here
    }
});

app.get('/noticeview', async (req, res) => {
    try {
        const notices = await Student.find();
        res.json(notices);
    } catch (error) {
        console.error('Error during fetching notices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


const batchSchema = new mongoose.Schema({
  batch: String,
  active: Boolean
  
});

// Define model
const Batch = mongoose.model('Batch', batchSchema);

// Define route to fetch batch data
app.get('/batches', async (req, res) => {
  try {
    const batches = await Batch.find({ active: true });
    res.json(batches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Define route to create a new batch
app.post('/batches', async (req, res) => {
  try {
    const { batchName, active } = req.body;
    const batch = new Batch({ batch: batchName, active: active });
    await batch.save();
    res.status(201).json(batch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/batched', async (req, res) => {
  try {
      const batches = await Batch.find({});
      res.json(batches);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
  }
});
app.put('/batched/:id/toggle', async (req, res) => {
  try {
      const batch = await Batch.findById(req.params.id);
      batch.active = !batch.active; // Toggle active status
      await batch.save();
      res.json({ message: 'Batch status updated successfully' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
  }
});
app.delete('/batched/:id', async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    res.json({ message: 'Batch deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


const GEMINI_API_KEY = 'AIzaSyAneFdotHdCY-JDP7kNk0REGZOcmNGlYp8';

app.use(express.json());

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await axios.post('https://api.gemini.ai/v1/nlu', {
      message,
      api_key: GEMINI_API_KEY
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});








app.listen(9000, () => {
    console.log('Server started');
} );