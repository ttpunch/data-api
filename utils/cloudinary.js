const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const multer = require('multer');


cloudinary.config({
    cloud_name: 'dd0u74ebj',
    api_key: '339619269572924',
    api_secret: 'a67rWGypVffgG3j4GFVBUSt9FGA'
  });

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file in cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been successfuly uploaded
    fs.unlinkSync(localFilePath); //remove locally stored files after successfull upload
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the localy saved temporary file as the upload operation got failed
  }
};


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
    //cb(null, file.fieldname + '-' + uniqueSuffix)  for filename change
  },
});

const upload = multer({ storage });

module.exports = {uploadOnCloudinary,upload};
