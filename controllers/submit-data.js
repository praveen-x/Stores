const Store = require('../models/Store');

exports.getData = async (req, res, next) => {
    try {
      const stores = await Store.find(
        {category:`${req.body.category}`, distance:{$lte:parseInt(`${req.body.distance}`)}
      });

      return res.status(200).json({
        success: true,
        count: stores.length,
        data: stores
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }    
  };
