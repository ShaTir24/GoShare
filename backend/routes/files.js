const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const File = require('../models/file');
const { v4: uuidv4 } = require('uuid');

let storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),  //second parameter is the path where to store the files in server
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName)  //unique name for file uploaded
  },
});

let upload = multer({ storage, limits: { fileSize: 1000000 * 100 }, }).single('myfile'); //100mb limit only single file allowed

router.post('/', (req, res) => {
  //Validate the request
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).send({ error: err.message });
    }
    const file = new File({
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      uuid: uuidv4() //generates unique id for a file
    });
    const response = await file.save();
    //console.log(`${process.env.APP_BASE_URL}/files/${response.uuid}`);
    const resLink = `${process.env.APP_BASE_URL}/files/${response.uuid}`;
    res.json({ file: resLink });
  });
});

router.post('/send', async (req, res) => {
  const { uuid, emailTo, emailFrom, expiresIn } = req.body;
  //Validate Request
  if (!uuid || !emailTo || !emailFrom) {
    return res.status(422).send({ error: 'All fields are required except expiry.' });
  }
  // Get data from db 
  try {
    const file = await File.findOne({ uuid: uuid });
    //checking to send the email only once
    if (file.sender) {  //returns the response as an error message
      return res.status(422).send({ error: 'Email already sent once.' });
    }

    // if sender not specified
    file.sender = emailFrom;
    file.receiver = emailTo;
    const response = await file.save();

    // send mail
    const sendMail = require('../services/mailService');
    sendMail({
      from: emailFrom,
      to: emailTo,
      subject: 'GoShare File Sharing - A File has been received!',
      text: `${emailFrom} shared a file with you.`,
      html: require('../services/emailTemplate')({
        emailFrom,
        downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}?source=email`,
        size: parseInt(file.size / 1000) + ' KB',
        expires: '24 Hours'
      })
    }).then(() => {
      return res.json({ success: true });
    }).catch(err => {
      return res.status(500).json({ error: 'Error in email sending.' });
    });
  } catch (err) {
    return res.status(500).send({ error: 'Something went wrong.' });
  }

});

module.exports = router;