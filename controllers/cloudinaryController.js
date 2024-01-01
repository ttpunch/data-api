const { uploadOnCloudinary } = require('../utils/cloudinary.js')

const cloudinaryController= async (req, res) => {
  try {
    if (!req.files || !req.files['image'] ) {
      return res.status(400).json({ message: 'image required' });
    }
    // Upload image and coverImage to Cloudinary

    const imageUrl = await uploadOnCloudinary(req.files?.image[0]?.path);
    // Register user logic using the uploaded image URLs
    console.log(imageUrl)
    // Your registration logic here using imageUrl and coverImageUrl

    // Assuming registration is successful, send a response
    return res.status(200).json({ message: 'Image uploaded Scuccesfully',link:`${imageUrl.url}` });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = cloudinaryController;