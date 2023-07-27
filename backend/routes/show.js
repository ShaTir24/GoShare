const router = require('express').Router();
const File = require('../models/file');

router.get('/:uuid', async (req, res) => {  //for dynamic parameter : is used
    try {
        const file = await File.findOne({ uuid: req.params.uuid }); //dynamic parameters in request body
        // Link expired
        if (!file) {
            return res.render('download', { error: 'Link has been expired!.' });
        }
        //to view a page
        //fields from database, not from dynamic parameters
        return res.render('download', { uuid: file.uuid, fileName: file.filename, fileSize: file.size, downloadLink: `${process.env.APP_BASE_URL}/files/download/${file.uuid}` });
        // http://localhost:3000/api/files/download/49823049-343ds
    } catch (err) {  //second parameter represents the data to be sent to client browser
        return res.render('download', { error: 'Something went wrong.' });
    }
});


module.exports = router;