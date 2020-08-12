var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var geocoder = require('geocoder');
var { isLoggedIn, checkUserCampground, checkUserComment, isAdmin, isSafe } = middleware; // destructuring assignment

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//INDEX - show all items
router.get("/", function(req, res){
  if(req.query.search && req.xhr) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all food from DB
      Campground.find({name: regex}, function(err, allCampgrounds){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allCampgrounds);
         }
      });
  } else {
      // Get all items from DB
      Campground.find({}, function(err, allCampgrounds){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allCampgrounds);//takes single object and converts in json
            } else {
              res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds'});
            }
         }
      });
  }
});

//CREATE - add new item to DB
router.post("/", isLoggedIn, isSafe, function(req, res){
  // get data from form and add to  array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  var cost = req.body.cost;
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || data.status === 'ZERO_RESULTS') {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = 30;//data.results[0].geometry.location.lat;
    var lng = 28.7041;
    var location = "delhi";
    var newCampground = {name: name, image: image, description: desc, cost: cost, author:author, location: location, lat: lat, lng: lng};
    // Create a new item and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to index page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
  });
});

//NEW - show form to create new item
router.get("/new", isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one item
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments likes").exec(function(err, foundCampground){
        if(err || !foundCampground){
            console.log(err);
            req.flash('error', 'Sorry, that item does not exist!');
            return res.redirect('/campgrounds');
        }
        console.log(foundCampground)
        //render show template with that item
        res.render("campgrounds/show", {campground: foundCampground});
    });
});

// EDIT - shows edit form for a item
router.get("/:id/edit", isLoggedIn, checkUserCampground, function(req, res){
  //render edit template with that item
  res.render("campgrounds/edit", {campground: req.campground});
});

// PUT - updates item in the database
router.put("/:id", isSafe, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    var lat = 25.23;	//results[0].geometry.location.lat;
    var lng =  82.24;//results[0].geometry.location.lng;
    var location = req.body.location;
    var newData = {name: req.body.name, image: req.body.image, description: req.body.description, cost: req.body.cost, location: location, lat: lat, lng: lng};
    Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

// DELETE - removes items and its comments from the database
router.delete("/:id", isLoggedIn, checkUserCampground, function(req, res) {
    Comment.remove({// first removing the comment and then the item
      _id: {
        $in: req.campground.comments
      }
    }, function(err) {
      if(err) {
          req.flash('error', err.message);
          res.redirect('/');
      } else {
          req.campground.remove(function(err) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('/');
            }
            req.flash('error', 'Food item deleted!');
            res.redirect('/campgrounds');
          });
      }
    })
});

// Campground Like Route
router.post("/:id/like", middleware.isLoggedIn, function (req, res) {
  Campground.findById(req.params.id, function (err, foundCampground) {
      if (err) {
          console.log(err);
          return res.redirect("/campgrounds");
      }

      // check if req.user._id exists in foundCampground.likes
      var foundUserLike = foundCampground.likes.some(function (like) {
          return like.equals(req.user._id);
      });

      if (foundUserLike) {
          // user already liked, removing like
          foundCampground.likes.pull(req.user._id);
      } else {
          // adding the new user like
          foundCampground.likes.push(req.user);
      }

      foundCampground.save(function (err) {
          if (err) {
              console.log(err);
              return res.redirect("/campgrounds");
          }
          return res.redirect("/campgrounds/" + foundCampground._id);
      });
  });
});

module.exports = router;

