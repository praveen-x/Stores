const express = require('express');
const { getData } = require('../controllers/submit-data');   // little destructuring to pull out getData
const router = express.Router();


// router.get('/', (req, res) =>{
//     res.send("hello, from submit-data");
// });

router.route('/').post(getData); // same as line 6-8 just more sophisticated
module.exports = router;