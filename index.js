const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
var fs = require('fs');
var path = require('path');

const app = express();

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region
AWS.config.update({region: 'ap-south-1'});

// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

app.use(fileUpload({
    createParentPath: true
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

//start app
const port = process.env.PORT || 3000;

app.listen(port, () =>
  console.log(`App is listening on port ${port}.`)
);

app.post('/upload-avatar', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
            let avatar = req.files.avatar;
            let path = './uploads/' + avatar.name;
            console.log(avatar.name);
            console.log(avatar.size);

            avatar.mv(path);
            await uploadFilesInS3Bucket(path);

            res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: avatar.name,
                    mimetype: avatar.mimetype,
                    size: avatar.size
                }
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

async function uploadFilesInS3Bucket(file){
    var uploadParams = {Bucket: 'bucketnummerzwei', Key: '', Body: ''};
    // console.log(file);
    // var file = '1.jpeg';
    var fileStream = await fs.createReadStream(file);
    fileStream.on('error', function(err) {
        console.log('File Error', err);
    });
    console.log("ALl okay, File has been Read");
    uploadParams.Body = fileStream;
    uploadParams.Key = path.basename(file);
    // uploadParams.Key = './images' + file.name;

    // call S3 to retrieve upload file to specified bucket
    s3.upload (uploadParams, function (err, data) {
      if (err) {
        console.log("Error", err);
      } if (data) {
        console.log("Upload Success", data.Location);
      }
    });
}
