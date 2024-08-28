var express = require('express');
var router = express.Router();
var textToSpeech = require('../helpers/tts');
const multer = require('multer');
const fs = require("fs");
const { createClient } = require("@deepgram/sdk");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

/* GET home page. */
router.post('/talk', function(req, res, next) {

  textToSpeech(req.body.text, req.body.voice)
  .then(result => {
    res.json(result);    
  })
  .catch(err => {
    res.json({"error":err});
  });
});


router.post('/upload', upload.single('file'), async (req, res)  => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  transcript = await transcribeFile(req.file.filename);
  return res.status(200).json({"text": transcript});
});

const transcribeFile = async (filename) => {
  // STEP 1: Create a Deepgram client using the API key
  const deepgram = createClient('d25585b4774aeb19ff0a53fae8bcf3b16bc68a16');

  // STEP 2: Call the transcribeFile method with the audio payload and options
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    // path to the audio file
    fs.readFileSync(`./uploads/${filename}`),
    // STEP 3: Configure Deepgram options for audio analysis
    {
      model: "nova-2",
      smart_format: true,
      language: 'es'
    }
  );

  if (error) throw error;
  // STEP 4: Print the results
  if (!error){
    console.log(result.results["channels"][0]["alternatives"][0]["transcript"]);
    return result.results["channels"][0]["alternatives"][0]["transcript"];
  } 
};

module.exports = router;
