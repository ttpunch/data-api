const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const multer = require('multer');
const dotenv=require('dotenv')
dotenv.config();


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
  });

console.log(process.env.CLOUDINARY_KEY)

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
