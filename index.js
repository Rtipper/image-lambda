// DEPENDENCIES
const AWS = require('aws-sdk');
const util = require('until');
const sharp = require('sharp');

const s3 = new AWS.S3();

exports.handler = async (event, context) => {

  console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
  const srcBucket = event.Records[0].s3.bucket.name;
  const srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  const dstBucket = srcBucket + "-resized";
  const dstKey    = "resized-" + srcKey;
  
  // INFER THE IMAGE TYPE FROM THE FILE SUFFIX
   const typeMatch = srcKey.match(/\.([^.]*)$/);
     if (!typeMatch) {
      console.log("Could not determine the image type.");
      return;
  }
  
  // CHECK THAT THE IMAGE TYPE IS SUPPORTED
    const imageType = typeMatch[1].toLowerCase();
    if (imageType != "jpg" && imageType != "png") {
      console.log(`Unsupported image type: ${imageType}`);
      return;
  }
  
  // DOWNLOAD IMAGE FROM s# SOURCE BUCKET
    try {
      const params = {
          Bucket: srcBucket,
          Key: srcKey
      };
      var origimage = await s3.getObject(params).promise();

  } catch (error) {
      console.log(error);
      return;
  }
  
  // SET THUMBNAIL WIDTH -- RESIZE WILL SET HEIGHT AUTOMATICALLY
  const width  = 200;
  
  // USE THE SHARP MODULE TO RESIZE THE IMAGE AND SAVE IN A BUFFER
   try { 
      var buffer = await sharp(origimage.Body).resize(width).toBuffer();
          
  } catch (error) {
      console.log(error);
      return;
  } 
  
  // UPLOAD THE THUMBNAIL IMAGE TO THE DESTINATION BUCKET
    try {
      const destparams = {
          Bucket: dstBucket,
          Key: dstKey,
          Body: buffer,
          ContentType: "image"
      };

      const putResult = await s3.putObject(destparams).promise(); 
      
  } catch (error) {
      console.log(error);
      return;
  } 
      
  console.log('Successfully resized ' + srcBucket + '/' + srcKey +
      ' and uploaded to ' + dstBucket + '/' + dstKey); 
};