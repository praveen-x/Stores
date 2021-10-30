const mongoose = require('mongoose');
const geocoder = require('../utils/geocoder');



const StoreSchema = new mongoose.Schema({
    storeId: {
        type: String,
        required: [true, 'Please add a store ID'],
        unique: true,
        trim: true,
        maxlength: [10, 'Store ID must be less than 10 chars']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    storeName: {
      type: String,
      required: [true, 'Please add a Name'],
      trim: true,
      unique: true
    },
    discount: {
      type: String,
      trim: true,
      required: [false]
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      trim: true
    },
    distance: {
      //type: Number
    },
    location: {
        type: {
          type: String, // Don't do `{ location: { type: String } }`
          enum: ['Point'], // 'location.type' must be 'Point'         
        },
        coordinates: {
          type: [Number], 
          index: '2dsphere'
        },
        formattedAddress: String
      },
      createdAt: {
          type: Date,
          default: Date.now
      }
});


// Calculate Distance between user location and store location
function calculateDistance(lat2, lon2) {
  const latFixed = 34.0720111;
  const lonFixed = 74.7999999;

  if ((latFixed == lat2) && (lonFixed == lon2)) {
    return 0;
  }
  else {
    var radlatFixed = Math.PI * latFixed/180;
    var radlat2 = Math.PI * lat2/180;
    var theta = lonFixed-lon2;
    var radtheta = Math.PI * theta/180;
    var dist = Math.sin(radlatFixed) * Math.sin(radlat2) + Math.cos(radlatFixed) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = dist * 180/Math.PI;
    dist = dist * 60 * 1.1515; // miles  
    dist = dist * 1.609344 // miles * 1.609344 = km
    //if (unit=="N") { dist = dist * 0.8684 }
    return parseFloat((dist).toFixed(2));
  }
}


//Geocode & create location
StoreSchema.pre('save', async function(next) {
    const loc = await geocoder.geocode(this.address);
    this.location = {
      type: 'Point',
      coordinates: [loc[0].longitude, loc[0].latitude],
      formattedAddress: loc[0].formattedAddress
    }

    this.distance = calculateDistance(loc[0].latitude, loc[0].longitude)
    
    this.address = undefined, // won't save address
    next();
});

module.exports = mongoose.model('Store', StoreSchema);
